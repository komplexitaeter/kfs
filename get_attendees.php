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


/* check if the provided sim/session combo is already in DB */
$attendee_not_found=true;
$attendee_id=null;

$sql = "SELECT count(1) cnt, max(attendee_id) attendee_id FROM kfs_attendees_tbl WHERE simulation_id=".$simulation_id." AND session_key ='".$session_key."'";
if ($result = $link->query($sql)) {
    $obj = $result->fetch_object();
    if ($obj->cnt == 1) {
        $attendee_not_found = false;
        $attendee_id = $obj->attendee_id;
    }
}
else {
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


/* insert or update current attendee in db and set callback */
if($attendee_not_found){
    $sql="INSERT INTO kfs_attendees_tbl(simulation_id, session_key) VALUES (".$simulation_id.",'".$session_key."')";
    if(!$result = $link->query($sql))
    {
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


/* query all simulations attendees whit a callback up-to-date */
$sql = "SELECT * FROM kfs_attendees_tbl WHERE TIMESTAMPDIFF( SECOND, last_callback_date, CURRENT_TIMESTAMP) < 30 AND simulation_id=".$simulation_id;
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

$myJSON = json_encode($objs);
echo $myJSON;

$link->close();

