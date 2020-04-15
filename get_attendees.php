<?php
$simulation_id = filter_input(INPUT_GET, 'simulation_id');
$session_key = filter_input(INPUT_GET, 'session_key');

header('Content-Type: application/json');
header ("Pragma-directive: no-cache");
header ("Cache-directive: no-cache");
header ("Cache-control: no-cache");
header ("Pragma: no-cache");
header ("Expires: 0");
require 'config.php';

$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

$sql = "DELETE FROM kfs_attendees_tbl WHERE TIMESTAMPDIFF( SECOND, last_callback_date, CURRENT_TIMESTAMP) > 30 AND simulation_id=".$simulation_id;
if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$sql = "SELECT * FROM kfs_attendees_tbl WHERE simulation_id=".$simulation_id;
$objs= array();

if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        array_push($objs, $obj);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}
$attendee_not_found=true;
$attendee_id=null;

foreach($objs as $obj){
 if($obj->session_key == $session_key){
     $attendee_not_found=false;
     $attendee_id=$obj->attendee_id;
 }
}

if($attendee_not_found){
    $sql="INSERT INTO kfs_attendees_tbl(simulation_id, session_key) VALUES (".$simulation_id.",'".$session_key."')";
    if(!$result = $link->query($sql))
    {
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
    $sql = "SELECT * FROM kfs_attendees_tbl WHERE attendee_id = LAST_INSERT_ID()";
    if ($result = $link->query($sql)) {
        $obj = $result->fetch_object();
        array_push($objs, $obj);
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
}

else{
    $sql="UPDATE kfs_attendees_tbl SET last_callback_date = CURRENT_TIMESTAMP WHERE attendee_id=".$attendee_id;
    if(!$result = $link->query($sql))
    {
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
}

$myJSON = json_encode($objs);
echo $myJSON;

$link->close();

