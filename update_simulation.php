<?php
require 'config.php';
require 'sql_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id');

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

$sql_set = array();

if(isset($_GET['status_code'])){
    $status_code = filter_input(INPUT_GET, 'status_code');
    if (strlen($status_code)>0) {
        if ($status_code=='RERUNNING') {
            array_push($sql_set, "status_code = 'RUNNING'");
        }
        else {
            array_push($sql_set, "status_code = '".$status_code."'");
        }

        if($status_code=="RUNNING") {
            /* delete inactive attendees */
            $sql = "DELETE FROM kfs_attendees_tbl WHERE TIMESTAMPDIFF( SECOND, last_callback_date, CURRENT_TIMESTAMP) >= 30 AND simulation_id=" . $simulation_id;
            if(!$result = $link->query($sql)) exit('INTERNAL_ERROR');

            /* create un-started round */
            $sql ='INSERT INTO kfs_rounds_tbl(simulation_id) VALUES ('.$simulation_id.')';
            if(!$result = $link->query($sql)) exit('INTERNAL_ERROR');
            $sql ='UPDATE kfs_simulation_tbl SET current_round_id = LAST_INSERT_ID() WHERE simulation_id='.$simulation_id;
            if(!$result = $link->query($sql)) exit('INTERNAL_ERROR');

            /* create some items*/
            $sql = get_create_items_sql(null); /* get round id from last insert */
            if(!$result = $link->query($sql)) exit('INTERNAL_ERROR');

        }
    }
}

if(isset($_GET['stats_round_id'])){
    $i = filter_input(INPUT_GET, 'i', FILTER_SANITIZE_NUMBER_INT);

    if ($i!=null && $i>=0 && $i<2) {
        $stats_round_id = filter_input(INPUT_GET, 'stats_round_id', FILTER_SANITIZE_NUMBER_INT);
        if ($stats_round_id != null) array_push($sql_set, "stats_round_id_$i = $stats_round_id");

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

$sql = "UPDATE kfs_simulation_tbl SET ".$sql_update." WHERE simulation_id='".$simulation_id."'";

if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}
$link->close();