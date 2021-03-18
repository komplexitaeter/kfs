<?php
require 'config.php';
require 'helper_lib.php';
require 'document.php';

set_header('json');

$status_code = 'SUCCESS';

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$purchase_method = filter_input(INPUT_POST, 'purchase_method', FILTER_SANITIZE_STRING);
$language_code = filter_input(INPUT_POST, 'language_code', FILTER_SANITIZE_STRING);
$purchase_address = filter_input(INPUT_POST, 'purchase_address', FILTER_SANITIZE_STRING);
$billing_email_address = filter_input(INPUT_POST, 'billing_email_address', FILTER_SANITIZE_STRING);

$link = db_init();
$link->autocommit(false);

$login_id = null;
$purchase_address_arr = array();


$sql = $link->prepare("SELECT l.login_id
                                    ,l.email_address
                                    ,l.purchasing_detail_id
                               FROM kfs_login_tbl l
                              WHERE l.session_key = ?");
$sql->bind_param('s', $session_key);
$sql->execute();

if ($result = $sql->get_result()) {
    if ($login = $result->fetch_object()) {
        /* check and default input params */
        if (!in_array($purchase_method, array('INVOICE', 'OFFER', 'CUSTOM'))) $purchase_method = 'INVOICE';
        if (!in_array($language_code, array('de', 'en'))) $language_code = 'de';

        if ($purchase_address === null || strlen($purchase_address) === 0) {
            $purchase_address_arr[0] = translate_tl($language_code, '{"en":"PRIVATE CUSTOMER ", "de": "PRIVATKUNDE"}');
            $purchase_address_arr[1] = $login->email_address;
        } else {
            $purchase_address = trim($purchase_address, "\r");
            $purchase_address_arr = explode("\n", $purchase_address);
        }
        $purchase_address = implode("\n", $purchase_address_arr);

        $price_list = json_decode(file_get_contents('./price_list.json'));
        $single_price = $price_list[0];

        if ($billing_email_address === null || strlen($billing_email_address) == 0) {
            $billing_email_address = $login->email_address;
        }

        if ($login->purchasing_detail_id == null) {

            $sql = $link->prepare("INSERT INTO kfs_purchasing_details_tbl (single_gross_price, purchase_method
                                                                          ,purchase_address, billing_email_address) 
                                            VALUES(?,?,?,?)");

            $sql->bind_param('isss', $single_price, $purchase_method, $purchase_address, $billing_email_address);


            if (!$sql->execute()) {
                error_log('SQL_ERR'.$sql->error);
                $status_code = 'ERROR';
            } else {
                $sql = $link->prepare("UPDATE kfs_login_tbl 
                                                SET purchasing_detail_id = LAST_INSERT_ID() 
                                                WHERE login_id = ?");
                $sql->bind_param('i', $login->login_id);
                if (!$sql->execute()) {
                    error_log('SQL_ERR'.$sql->error);
                    $status_code = 'ERROR';
                }
            }

        } else {
            /* update existing row */
            $sql = $link->prepare("UPDATE kfs_purchasing_details_tbl 
                                            SET purchase_method = ?
                                               ,purchase_address = ?  
                                               ,billing_email_address = ?
                                          WHERE purchasing_detail_id = ?");

            $sql->bind_param('sssi',  $purchase_method, $purchase_address
                                                , $billing_email_address, $login->purchasing_detail_id);

            if (!$sql->execute()) {
                error_log('SQL_ERR'.$sql->error);
                $status_code = 'ERROR';
            }
        }



            /* create documents */
            /*
            if ($purchase_method != 'CUSTOM') {

                generate_purchase_doc($link, $purchase_method, $language_code, $purchase_qty, $single_price
                    , $purchase_address_arr, $login->email_address, $credit_id);

            } else $link->commit();
            */


    } else $status_code = 'ERROR';
} else $status_code = 'ERROR';

if ($status_code == 'ERROR') $link->rollback(); else $link->commit();
$link->close();

echo json_encode( array("status_code" => $status_code), JSON_UNESCAPED_UNICODE);
