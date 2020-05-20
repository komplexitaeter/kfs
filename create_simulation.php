<?php
require 'config.php';

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

header('Content-Type: application/json');
header('Pragma-directive: no-cache');
header('Cache-directive: no-cache');
header('Cache-control: no-cache');
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

$sql = "INSERT INTO kfs_simulation_tbl(current_round_id) VALUES (NULL)";
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

    $sql="INSERT INTO kfs_attendees_tbl(simulation_id, session_key, avatar_code, role_code) 
                                VALUES ($obj->simulation_id,'$session_key','1','FACILITATOR')";
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