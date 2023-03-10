<?php
require 'config.php';
require 'helper_lib.php';
require 'status.php';

function exit_on_error($link) {
    $link->rollback();
    $link->close();
    exit();
}

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$default_language_code = filter_input(INPUT_GET, 'default_language_code', FILTER_SANITIZE_STRING);
$demo_mode = filter_input(INPUT_GET, 'demo_mode', FILTER_SANITIZE_NUMBER_INT);
$simulation_name = substr(filter_input(INPUT_GET, 'simulation_name', FILTER_SANITIZE_STRING), 0, 50);
$display_warning_live_simulation = filter_input(INPUT_GET, 'display_warning_live_simulation', FILTER_SANITIZE_STRING);

$purchasing_detail_id = null;

set_header('json');

$link = db_init();
$link->autocommit(false);

if (strlen($default_language_code)!=2) {
    $default_language_code = 'en';
}

$demo_mode = 0;

$sql = $link->prepare("SELECT login_id, purchasing_detail_id
                               FROM kfs_login_tbl 
                              WHERE session_key=?");
$sql->bind_param('s', $session_key);
$sql->execute();
$result = $sql->get_result();
if ($obj = $result->fetch_object()) {
    $login_id = $obj->login_id;
    $purchasing_detail_id = $obj->purchasing_detail_id;
} else {
    exit_on_error($link);
}

if($display_warning_live_simulation !== null && in_array($display_warning_live_simulation, array('0', '1'))) {
    $sql = $link->prepare("UPDATE kfs_login_tbl
                               SET display_warning_live_simulation = ?
                              WHERE login_id = ?");
    $sql->bind_param('ii', $display_warning_live_simulation, $login_id);
    $sql->execute();
}


$simulation_key = openssl_random_pseudo_bytes(8);
$simulation_key = bin2hex($simulation_key);

$sql = $link->prepare("INSERT INTO kfs_simulation_tbl(simulation_key, current_round_id, default_language_code, login_id, demo_mode, simulation_name) VALUES (?,NULL,?,?,?,?)");
$sql->bind_param('ssiis', $simulation_key, $default_language_code, $login_id, $demo_mode, $simulation_name);

if (!$sql->execute()) {
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$sql = "SELECT LAST_INSERT_ID() AS simulation_id";

if ($result = $link->query($sql)) {
    $obj = $result->fetch_object();

    $obj->simulation_key = $simulation_key;

    initialize_status($link, $obj->simulation_id, 'KFS');

    $myJSON = json_encode($obj);
    echo $myJSON;
} else {
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


$link->commit();
$link->close();