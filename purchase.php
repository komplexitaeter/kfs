<?php
require 'config.php';
require 'helper_lib.php';
require 'document.php';

set_header('json');

$status_code = 'SUCCESS';

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$purchase_method = filter_input(INPUT_POST, 'purchase_method', FILTER_SANITIZE_STRING);
$purchase_qty = filter_input(INPUT_POST, 'purchase_qty', FILTER_SANITIZE_NUMBER_INT);
$language_code = filter_input(INPUT_POST, 'language_code', FILTER_SANITIZE_STRING);
$purchase_address = filter_input(INPUT_POST, 'purchase_address', FILTER_SANITIZE_STRING);

$link = db_init();
$link->autocommit(false);

$login_id = null;
$purchase_address_arr = array();


$sql = $link->prepare("SELECT l.login_id
                                    ,l.email_address
                               FROM kfs_login_tbl l
                              WHERE l.session_key = ?");
$sql->bind_param('s', $session_key);
$sql->execute();

if ($result = $sql->get_result()) {
    if ($login = $result->fetch_object()) {

        /* check and default input params */
        if (!in_array($purchase_method, array('INVOICE', 'OFFER', 'CUSTOM'))) $purchase_method = 'INVOICE';
        if (!($purchase_qty>=1 and $purchase_qty<=50)) $purchase_qty = 1;
        if (!in_array($language_code, array('de', 'en'))) $language_code = 'de';
        if ($purchase_address === null || strlen($purchase_address) === 0) {
            $purchase_address_arr[0] = translate_tl($language_code, '{"en":"PRIVATE CUSTOMER ", "de": "PRIVATKUNDE"}');
            $purchase_address_arr[1] = $login->email_address;
        } else {
            $purchase_address = trim($purchase_address, "\r");
            $purchase_address_arr = explode("\n", $purchase_address);
        }
        $purchase_address = implode("\n", $purchase_address_arr);
        $price_list = json_decode(file_get_contents('./price_list.json'), false);
        $single_price = $price_list[$purchase_qty];

        /* insert into database */
        $sql = $link->prepare("INSERT INTO kfs_credits_tbl(buyer_login_id, original_qty
                                    ,single_gross_price, purchase_method, purchase_address) 
                                    VALUES(?,?,?,?,?)");

        $sql->bind_param('iiiss', $login->login_id, $purchase_qty
                                    ,$single_price, $purchase_method, $purchase_address);

        if (!$sql->execute()) {
            $status_code = 'ERROR';
            error_log('SQL_ERR'.$sql->error);
        } else {
            /* create documents */
            if ($purchase_method != 'CUSTOM') {

                $sql = $link->prepare("SELECT current_value+1 document_number
                                               FROM kfs_sequences_tbl
                                              WHERE document_type=?
                                              FOR UPDATE");
                $sql->bind_param('s', $purchase_method);
                $sql->execute();
                $result = $sql->get_result();
                $document_number = $result->fetch_object()->document_number;
                $sql = $link->prepare("UPDATE kfs_sequences_tbl
                                                SET current_value = current_value+1
                                              WHERE document_type=?");
                $sql->bind_param('s', $purchase_method);
                $sql->execute();

                $tlo = get_translation_obj('document_php');
                $pdf_doc = create_purchase_doc($language_code, $purchase_qty, $single_price, $purchase_method
                    , $purchase_address_arr, $login->email_address, $document_number, $tlo);

                $sql = $link->prepare("INSERT INTO kfs_documents_tbl(content, document_type, document_number
                                            , content_type) VALUES(?, ? ,? , 'pdf' )");

                $null = NULL;
                $sql->bind_param('bsi', $null, $purchase_method, $document_number);
                $sql->send_long_data(0, $pdf_doc);


                if (!$sql->execute()) {
                    $status_code = 'ERROR';
                    error_log('SQL_ERR' . $sql->error);
                } else {
                    $link->commit();
                    sent_purchase_doc($login->email_address, $pdf_doc, $document_number.'.pdf'
                        , $purchase_method, $language_code, $tlo);
                }

            } else $link->commit();
        }

    } else $status_code = 'ERROR';
} else $status_code = 'ERROR';

if ($status_code == 'ERROR') $link->rollback();
$link->close();

echo json_encode( array("status_code" => $status_code), JSON_UNESCAPED_UNICODE);


