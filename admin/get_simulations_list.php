<?php
require '../config.php';
require '../helper_lib.php';

set_header('json');
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$link = db_init();
$data_obj = array();
$status_code = "UNAUTHORIZED";

/*verify status of the current simulation*/
$sql = $link->prepare("SELECT count(1) cnt
                                FROM kfs_login_tbl
                               WHERE session_key=?
                                 AND role_code = 'ADMIN'");
$sql->bind_param("s",$session_key);
$sql->execute();
$result = $sql->get_result();
if ($result->fetch_object()->cnt == 1) {
    $status_code = "SUCCESS";

    /*verify status of the current simulation*/
    $sql = $link->prepare("SELECT s.simulation_id
                                ,s.simulation_key
                                ,s.creation_date
                                ,s.demo_mode
                                ,l.email_address
                                ,p.billing_email_address
                                ,p.purchase_address
                                ,p.purchase_method
                                ,s.simulation_name
                                ,p.single_gross_price
                                ,s.measured_use
                                ,s.measurement_date
                                ,s.invoice_number
              FROM kfs_simulation_tbl as s
              JOIN kfs_login_tbl as l ON l.login_id = s.login_id 
            LEFT OUTER JOIN kfs_purchasing_details_tbl as p ON p.purchasing_detail_id = l.purchasing_detail_id                     
              ORDER BY s.creation_date DESC");
    $sql->execute();

    if ($result = $sql->get_result()) {
        while ($obj = $result->fetch_object()) {
            $simulation = array(
                "simulation_id" => (int)$obj->simulation_id,
                "simulation_key" => (string)$obj->simulation_key,
                "creation_date" => (string)$obj->creation_date,
                "demo_mode" => (bool)$obj->demo_mode,
                "email_address" => (string)$obj->email_address,
                "billing_email_address" => (string)$obj->billing_email_address,
                "purchase_address" => (string)$obj->purchase_address,
                "purchase_method" => (string)$obj->purchase_method,
                "simulation_name" => (string)$obj->simulation_name,
                "single_gross_price" => (int)$obj->single_gross_price,
                "measured_use" => (int)$obj->measured_use,
                "measurement_date" => (string)$obj->measurement_date,
                "invoice_number" => (string)$obj->invoice_number
            );
            array_push($data_obj, $simulation);
        }
    }
}

$link->close();

echo json_encode(array("status_code" => (String)$status_code
                      ,"simulations" => $data_obj)
    ,JSON_UNESCAPED_UNICODE);