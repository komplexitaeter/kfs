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

$sql_set = array();

if(isset($_GET['ready_to_start'])){
    $ready_to_start = filter_input(INPUT_GET, 'ready_to_start');
    if ($ready_to_start == 0 | $ready_to_start == 1 ) {
        array_push($sql_set, "ready_to_start = ".$ready_to_start." ");
    }
}
else {
    if (isset($_GET['switch_status'])){
        $switch_status = filter_input(INPUT_GET, 'switch_status');
        if ($switch_status==1) {
            array_push($sql_set, "ready_to_start = NOT ready_to_start");
        }
    }
}

if(isset($_GET['name'])){
    $new_name = filter_input(INPUT_GET, 'name');
    if (strlen($new_name)>0) {
        array_push($sql_set, "name = '".$new_name."'");
    }
    else {
        array_push($sql_set, "name = NULL");
    }
}

if(isset($_GET['station_id'])){
    $station_id = filter_input(INPUT_GET, 'station_id');
    if (strlen($station_id)>0) {
        array_push($sql_set, "station_id = '".$station_id."'");
    }
    else {
        array_push($sql_set, "station_id = NULL");
    }
}

if(count($sql_set)==0){
    $link->close();
    exit(0);
}

$sql_update = '';
for($i=0; $i<count($sql_set);$i++){
    if($i>0){
        $sql_update.=", ";
    }
    $sql_update .= $sql_set[$i];
}

$sql = "UPDATE kfs_attendees_tbl SET ".$sql_update." WHERE session_key='".$session_key."' AND simulation_id='".$simulation_id."'";
echo "$sql";
if(!$result = $link->query($sql))
    {
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
$link->close();