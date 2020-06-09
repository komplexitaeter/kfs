<?php
require 'config.php';
require 'sql_lib.php';

/* GET Parameters */
$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);

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

$link = db_init();

/* do some checks on the input params */
if ($simulation_id == null) exit_with_status('NO_SIMULATION_ID_SET');

if(isset($_GET['mood_code'])) {
    $mood_code = filter_input(INPUT_GET, 'mood_code', FILTER_SANITIZE_STRING);
    if (strlen($mood_code)>0) {
        $sql = "UPDATE kfs_attendees_tbl
                   SET mood_code = '$mood_code'
                 WHERE simulation_id = $simulation_id
                   AND role_code != 'FACILITATOR'";
    }
    else {
        $sql = "UPDATE kfs_attendees_tbl
                   SET mood_code = NULL
                 WHERE simulation_id = $simulation_id";
    }
    if (!$link->query($sql)) exit_with_status('INTERNAL_ERROR_001');
}

$link->close();