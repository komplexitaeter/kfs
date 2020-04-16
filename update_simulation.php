<?php
$simulation_id = filter_input(INPUT_GET, 'simulation_id');

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

if(isset($_GET['status_code'])){
    $status_code = filter_input(INPUT_GET, 'status_code');
    if (strlen($status_code)>0) {
        array_push($sql_set, "status_code = '".$status_code."'");
    }
}

if(count($sql_set)==0){
    $link->close();
    exit(0);
}

for($i=0; $i<count($sql_set);$i++){
    if($i>0){
        $sql_update.=", ";
    }
    $sql_update .= $sql_set[$i];
}

$sql = "UPDATE kfs_simulation_tbl SET ".$sql_update." WHERE simulation_id='".$simulation_id."'";
echo "$sql";
if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}
$link->close();