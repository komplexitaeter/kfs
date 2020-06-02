<?php
require 'config.php';
require 'sql_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

header('Content-Type: application/json');
header('Pragma-directive: no-cache');
header('Cache-directive: no-cache');
header('Cache-control: no-cache');
header('Pragma: no-cache');
header('Expires: 0');

$link = db_init();

$sql = "SELECT status_code, configuration_name FROM kfs_simulation_tbl WHERE simulation_id=".$simulation_id;
$configuration_name = null;
$status_code = null;

if ($result = $link->query($sql)) {
    if($obj = $result->fetch_object()) {
        $status_code = $obj->status_code;
        $configuration_name = $obj->configuration_name;
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

    /* find a avatar, that is ... if possible ... not used */
    $avatar_code = null;
    $sql="select code from (
                select 1 as code
                union select 2
                union select 3
                union select 4
                union select 5
                union select 6
                union select 7
                union select 8
                union select 9) as ac
                where not exists(select 1
                                   from kfs_attendees_tbl a
                                  where a.simulation_id = $simulation_id
                                    and a.avatar_code = ac.code)
                order by rand()";
    if ($result = $link->query($sql)) {
        if ($obj = $result->fetch_object()) {
            $avatar_code = $obj->code;
        }
    }
    if ($avatar_code==null) {
        $avatar_code = mt_rand(1,9);
    }

    $sql="INSERT INTO kfs_attendees_tbl(simulation_id, session_key, avatar_code) VALUES ($simulation_id,'$session_key','$avatar_code')";
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
$role_code = null;

if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        if ($obj->session_key == $session_key) {
            $role_code = $obj->role_code;
        }
        array_push($objs, $obj);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

/* query all simulations attendees whit a callback up-to-date */
$sql = "SELECT * FROM kfs_configurations_tbl ORDER BY min_player_recom";
$conf = array();

if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        array_push($conf, $obj);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$myJSON_array = array("status_code"=>$status_code
                    , "role_code"=>$role_code
                    , "attendees"=>$objs
                    , "configuration_name"=>$configuration_name
                    , "configurations"=>$conf);

$myJSON = json_encode($myJSON_array);
echo $myJSON;

$link->close();

