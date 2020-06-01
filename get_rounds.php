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

$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

$rounds = get_rounds($link, $simulation_id);

$myJSON_array = array("rounds"=> $rounds);
echo json_encode($myJSON_array);

$link->close();