<?php
require 'config.php';
require 'helper_lib.php';

/* GET Parameters */
$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$context = filter_input(INPUT_GET, 'context', FILTER_SANITIZE_STRING);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

/* POST Parameters */
$station_id = filter_input(INPUT_POST, 'station_id', FILTER_SANITIZE_STRING);
$items = filter_input(INPUT_POST, 'items', FILTER_SANITIZE_STRING);
$json = filter_input(INPUT_POST, 'json');

$link = db_init();
$sql = $link->prepare("INSERT into kfs_debug_tbl (context, simulation_id, session_key, station_id, items, json)
                                VALUES (?,?,?,?,?,?)");
$sql->bind_param('sissss', $context,$simulation_id, $session_key, $station_id, $items, $json);
$sql->execute();
$link->close();