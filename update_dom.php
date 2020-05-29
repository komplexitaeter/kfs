<?php
require 'config.php';

/* GET Parameters */
$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$dom_id = filter_input(INPUT_GET, 'dom_id', FILTER_SANITIZE_STRING);
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);

header('Content-Type: application/json');
header('Pragma-directive: no-cache');
header('Cache-directive: no-cache');
header('Cache-control: no-cache"');
header('Pragma: no-cache');
header('Expires: 0');

function exit_with_status($status_code) {
    echo(json_encode(array("status_code"=>$status_code)));
    exit(0);
}

$link = mysqli_init();
if (!mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
)) exit_with_status('ERROR_DB_CONNECT');

/* do some checks on the input params */
if ($simulation_id == null) exit_with_status('NO_SIMULATION_ID_SET');
if ($dom_id == null || strlen($dom_id) == 0) exit_with_status('NO_DOM_ID_SET');

if ($action=='toggle_visibility') {
    $sql = "SELECT count(1) cnt
              FROM kfs_dom_tbl
             WHERE simulation_id = $simulation_id
               AND dom_id = '$dom_id'";

    if ($result = $link->query($sql)) {
        if(  $obj = $result->fetch_object()) {
            if ($obj->cnt == 0) {
                $sql = "INSERT INTO kfs_dom_tbl(simulation_id, dom_id) 
                        VALUES ($simulation_id, '$dom_id')";
            }
            else {
                $sql = "UPDATE kfs_dom_tbl
                        SET visibility=not visibility
                       WHERE simulation_id = $simulation_id
                         AND dom_id = '$dom_id'";
            }
            if (!$result = $link->query($sql)) exit_with_status('INTERNAL_ERROR_001');
        }
        else {
            exit_with_status('INTERNAL_ERROR_002');
        }
    }
    else{
        exit_with_status('INTERNAL_ERROR_003');
    }
}

$link->close();