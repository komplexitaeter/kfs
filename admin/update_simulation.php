<?php
require '../config.php';
require '../helper_lib.php';

set_header('json');

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$invoice_number = substr(filter_input(INPUT_GET, 'invoice_number', FILTER_SANITIZE_STRING),0,10);

$link = db_init();
$data_obj = array();

$sql = $link->prepare("UPDATE kfs_simulation_tbl
                              SET invoice_number = ? 
                             WHERE simulation_id = ?");
if (strlen($invoice_number ) == 0) $invoice_number = null;
$sql->bind_param('si', $invoice_number, $simulation_id);
$sql->execute();

$link->close();