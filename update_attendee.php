<?php
require 'config.php';
require 'helper_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

set_header('json');

$link = db_init();

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
    $new_name = filter_input(INPUT_GET, 'name', FILTER_SANITIZE_STRING);
    if (strlen($new_name)>0) {
        array_push($sql_set, "name = '".$new_name."'");
    }
    else {
        array_push($sql_set, "name = NULL");
    }
}

if(isset($_GET['language_code'])){
    $language_code = filter_input(INPUT_GET, 'language_code', FILTER_SANITIZE_STRING);
    if (strlen($language_code)==2) {
        array_push($sql_set, "language_code = '".$language_code."'");
    }
    else if (strlen($language_code)==0) {
        array_push($sql_set, "language_code = NULL");
    }
}

if(isset($_GET['mood_code'])){
    $mood_code = filter_input(INPUT_GET, 'mood_code', FILTER_SANITIZE_STRING);
    if (strlen($mood_code)>0) {
        array_push($sql_set, "mood_code = '".$mood_code."'");
    }
    else {
        array_push($sql_set, "mood_code = NULL");
    }
}

if(isset($_GET['cursor_x'])&&isset($_GET['cursor_y'])){
    $cursor_x = filter_input(INPUT_GET, 'cursor_x', FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $cursor_y = filter_input(INPUT_GET, 'cursor_y', FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

    if (   $cursor_x != null
        && $cursor_y != null
        && $cursor_x >= 0
        && $cursor_y >= 0
        && $cursor_x <= 1
        && $cursor_y <= 1
    ) {
        array_push($sql_set, "cursor_x = ".$cursor_x);
        array_push($sql_set, "cursor_y = ".$cursor_y);
    }
    else {
        array_push($sql_set, "cursor_x = NULL");
        array_push($sql_set, "cursor_y = NULL");
    }
}

if(isset($_GET['statement_code'])){
    $statement_code = filter_input(INPUT_GET, 'statement_code', FILTER_SANITIZE_STRING);
    if (strlen($statement_code)>0) {
        array_push($sql_set, "statement_code = '".$statement_code."'");
    }
    else {
        array_push($sql_set, "statement_code = NULL");
    }
}
else if(isset($_GET['statement_text'])) {
    $statement_text = filter_input(INPUT_GET, 'statement_text', FILTER_SANITIZE_STRING);
    if (strlen($statement_text)>0) {
        $sql = "select language_code 
                  from kfs_attendees_tbl 
                 where simulation_id = $simulation_id
                   and session_key = '$session_key'";
        $result = $link->query($sql);
        $obj = $result->fetch_object();

        //$sql = 'insert into kfs_statements_tbl(statement_code, language_code, type_code, statement_text, sort_order)  '
        //array_push($sql_set, "statement_code = '".$statement_code."'");
    }
}

    if(isset($_GET['role_code'])){
    $role_code = filter_input(INPUT_GET, 'role_code', FILTER_SANITIZE_STRING);
    if (strlen($role_code)>0 && in_array($role_code, array('OBSERVER','FACILITATOR'))) {
        /* check if not the last facilitator */
        if ($role_code=='OBSERVER') {
            $sql = "select count(1) as cnt 
                      from kfs_attendees_tbl
                     where simulation_id=$simulation_id
                       and role_code='FACILITATOR'";
            $result = $link->query($sql);
            $obj = $result->fetch_object();
            if ($obj->cnt > 1 ) {
                array_push($sql_set, "role_code = '".$role_code."'");
            }
        }
        else {
            array_push($sql_set, "role_code = '".$role_code."'");
        }
    }
}

$reset_thumbnail = false;
if(isset($_GET['station_id'])){
    $station_id = filter_input(INPUT_GET, 'station_id');
    if (strlen($station_id)>0) {
        $reset_thumbnail = true;
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

if ($reset_thumbnail) {
    $sql_t =   "update kfs_workbench_tbl w
                     set w.last_item_id = null
                       ,w.last_item_svg = null
                    where w.simulation_id = 11
                        and w.station_id = (
                        select a.station_id
                        from kfs_attendees_tbl a
                        where a.simulation_id = $simulation_id
                        and a.session_key = '$session_key'
                        )";
    $link->query($sql_t);
}

$sql_update = '';
for($i=0; $i<count($sql_set);$i++){
    if($i>0){
        $sql_update.=", ";
    }
    $sql_update .= $sql_set[$i];
}

$sql = "UPDATE kfs_attendees_tbl SET ".$sql_update." WHERE session_key='".$session_key."' AND simulation_id='".$simulation_id."'";

if(!$result = $link->query($sql))
    {
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
$link->close();