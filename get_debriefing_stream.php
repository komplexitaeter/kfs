<?php
require 'config.php';

ob_implicit_flush(1);
header("Cache-Control: no-cache");
header("Pragma-directive: no-cache");
header("Cache-directive: no-cache");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: text/event-stream");

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$count = 0;

/* force client reconnect after a couple of minutes*/
while ($count<2500) {

    echo "event: update\n";
    echo "data: ".json_encode(getDebriefingObj($simulation_id, $session_key));
    echo "\n\n";

    $trash = '';
    for ($i=1;$i<4096;$i++) {
        $trash.="X";
    }
    echo "event: trash\n";
    echo "data: ".json_encode($trash);
    echo "\n\n";

    if(ob_get_length() > 0) ob_end_flush();
    flush();
    usleep(500000);

    $count++;

}

function getDebriefingObj($simulation_id, $session_key) {
    $link = mysqli_init();
    if (!mysqli_real_connect(
        $link,
        _MYSQL_HOST,
        _MYSQL_USER,
        _MYSQL_PWD,
        _MYSQL_DB,
        _MYSQL_PORT
    )) return null;

    $sql = "SELECT status_code FROM kfs_simulation_tbl WHERE simulation_id=".$simulation_id;
    $status_code = null;

    if ($result = $link->query($sql)) {
        if($obj = $result->fetch_object()) {
            $status_code = $obj->status_code;
        }
        else{
            $status_code = "NO_SIMULATION";
        }
    } else return null;


    /* query all simulations attendees */
    $sql = "SELECT tbl.session_key
             , tbl.name
             , tbl.avatar_code
             , tbl.role_code
             , TIMESTAMPDIFF( SECOND, tbl.last_callback_date, CURRENT_TIMESTAMP) as timeout 
          FROM kfs_attendees_tbl as tbl WHERE simulation_id=".$simulation_id;

    $attendees = array();
    $role_code = null;

    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            if ($obj->session_key == $session_key) {
                $role_code = $obj->role_code;
            }
            array_push($attendees, $obj);
        }
    }

    return array("status_code" => $status_code
                ,"role_code" => $role_code
                ,"attendees" => $attendees);
}