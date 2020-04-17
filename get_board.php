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

/*verify status of the current simulation*/
$sql = "SELECT status_code FROM kfs_simulation_tbl WHERE simulation_id=".$simulation_id;
if ($result = $link->query($sql)) {
    if($obj = $result->fetch_object()) {
        $status_code = $obj->status_code;
    }
    else{
        $status_code = "NO_SIMULATION";
    }
}
else {
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

/*identify attendees that may have a tech issue and not be able to participate anymore*/
$sql="UPDATE kfs_attendees_tbl SET last_callback_date = CURRENT_TIMESTAMP WHERE simulation_id=".$simulation_id." AND session_key ='".$session_key."'";
if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

/* query all simulations attendees */
$sql = "SELECT tbl.*, TIMESTAMPDIFF( SECOND, tbl.last_callback_date, CURRENT_TIMESTAMP) as timeout FROM kfs_attendees_tbl as tbl WHERE simulation_id=".$simulation_id;
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

/* query all working station for this simulation */
$sql = "SELECT confs.* FROM kfs_simulation_tbl as sims, kfs_station_conf_tbl as confs WHERE sims.simulation_id='".$simulation_id."' AND confs.configuration_name = sims.configuration_name";
$stations= array();

if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        array_push($stations, $obj);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$myJSON_array = array("status_code"=>$status_code, "attendees"=>$objs, "stations"=>$stations);

$myJSON = json_encode($myJSON_array);
echo $myJSON;

$link->close();