<?php
require 'config.php';
require 'helper_lib.php';

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$default_language_code = filter_input(INPUT_GET, 'default_language_code', FILTER_SANITIZE_STRING);

set_header('json');

$link = db_init();

if (strlen($default_language_code)!=2) {
    $default_language_code = 'en';
}

$sql = $link->prepare("SELECT login_id FROM kfs_login_tbl WHERE session_key=?");
$sql->bind_param('s', $session_key);
$sql->execute();
$result = $sql->get_result();
if ($obj = $result->fetch_object()) {
    $login_id = $obj->login_id;
} else exit();

$sql = "INSERT INTO kfs_simulation_tbl(current_round_id, default_language_code, login_id) VALUES (NULL, '$default_language_code', $login_id)";
if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$sql = "SELECT LAST_INSERT_ID() AS simulation_id";

if ($result = $link->query($sql)) {
    $obj = $result->fetch_object();

    $sql="INSERT INTO kfs_attendees_tbl(simulation_id, session_key, avatar_code, role_code, language_code) 
                                VALUES ($obj->simulation_id,'$session_key','1','FACILITATOR', '$default_language_code')";
    $link->query($sql);

    $myJSON = json_encode($obj);
    echo $myJSON;
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$link->close();