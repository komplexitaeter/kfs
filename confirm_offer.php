<?php
require 'config.php';
require 'helper_lib.php';
require 'document.php';

set_header('json');

$status_code = 'SUCCESS';

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$credit_id = filter_input(INPUT_GET, 'credit_id', FILTER_SANITIZE_NUMBER_INT);
$language_code = filter_input(INPUT_GET, 'language_code', FILTER_SANITIZE_STRING);
if (!in_array($language_code, array('de', 'en'))) $language_code = 'de';

$link = db_init();
$link->autocommit(false);
$login_id = null;
$purchase_address_arr = array();
$purchase_method = 'INVOICE';


$sql = $link->prepare("SELECT c.purchase_address
                                   ,c.single_gross_price
                                   ,c.original_qty
                                   ,l.email_address
                               FROM kfs_login_tbl l
                                   ,kfs_credits_tbl c
                              WHERE l.session_key = ?
                                and c.buyer_login_id = l.login_id
                                and c.credit_id = ?
                                and c.open_flag = true");

$sql->bind_param('si', $session_key, $credit_id);
$sql->execute();

if ($result = $sql->get_result()) {
    if ($credit = $result->fetch_object()) {

        /* check and default input params */
        $purchase_qty = $credit->original_qty;

        if ($credit->purchase_address === null || strlen($credit->purchase_address) === 0) {
            $purchase_address_arr[0] = translate_tl($language_code, '{"en":"PRIVATE CUSTOMER ", "de": "PRIVATKUNDE"}');
            $purchase_address_arr[1] = $credit->email_address;
        } else {
            $purchase_address = trim($credit->purchase_address, "\r");
            $purchase_address_arr = explode("\n", $purchase_address);
        }
        $single_price = $credit->single_gross_price;

        generate_purchase_doc($link, $purchase_method, $language_code, $purchase_qty, $single_price
            , $purchase_address_arr, $credit->email_address, $credit_id);

    }
}

$link->close();

echo json_encode( array("status_code" => $status_code), JSON_UNESCAPED_UNICODE);


