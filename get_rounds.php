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

$link = db_init();

$rounds = get_rounds($link, $simulation_id);

$myJSON_array = array("rounds"=> $rounds);
echo json_encode($myJSON_array);

$link->close();