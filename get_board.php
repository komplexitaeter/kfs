<?php
require 'config.php';
require 'items_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

header('Content-Type: application/json');
header ("Pragma-directive: no-cache");
header ("Cache-directive: no-cache");
header ("Cache-control: no-cache");
header ("Pragma: no-cache");
header ("Expires: 0");

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
$sql = "SELECT s.status_code 
              ,case  when s.status_code = 'RUNNING'
                      and r.last_start_time is not null
                      and r.last_stop_time is null
                      and r.auto_pull
               then 1 end as auto_pull
         FROM kfs_simulation_tbl  as s
    LEFT OUTER JOIN kfs_rounds_tbl as r 
       ON r.round_id = s.current_round_id
        WHERE s.simulation_id=$simulation_id";

if ($result = $link->query($sql)) {
    if($obj = $result->fetch_object()) {
        $status_code = $obj->status_code;
        if ($obj->auto_pull === '1') {
            $do_auto_pull = '1';
        }
        else {
            $do_auto_pull = '0';
        }

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
$sql = "SELECT tbl.attendee_id
             , tbl.session_key
             , tbl.name
             , tbl.station_id
             , tbl.avatar_code
             , TIMESTAMPDIFF( SECOND, tbl.last_callback_date, CURRENT_TIMESTAMP) as timeout FROM kfs_attendees_tbl as tbl WHERE simulation_id=".$simulation_id;
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
$sql = "SELECT confs.station_id
          ,confs.station_name
          ,confs.station_pos
          ,w.svg_hash
          ,(select count(1) 
              from kfs_attendees_tbl as t
             where t.simulation_id = sims.simulation_id
              and t.station_id = confs.station_id) workers_cnt
     FROM kfs_simulation_tbl as sims
     join kfs_station_conf_tbl as confs on confs.configuration_name = sims.configuration_name
     left outer join kfs_workbench_tbl w on w.station_id = confs.station_id and w.simulation_id = sims.simulation_id
    WHERE sims.simulation_id=$simulation_id
    ORDER BY confs.station_pos";

$stations = array();

if ($result = $link->query($sql)) {
    while ($obj = $result->fetch_object()) {
        array_push($stations, $obj);
    }
} else {
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


/* query current round for this simulation, if exists */
$sql = "SELECT round.*, COALESCE(cumulative_time_s, 0) + TIMESTAMPDIFF( SECOND, round.last_start_time, COALESCE(round.last_stop_time, CURRENT_TIMESTAMP)) as total_time_s  FROM kfs_simulation_tbl as sims, kfs_rounds_tbl as round WHERE sims.simulation_id='".$simulation_id."' AND round.round_id = sims.current_round_id";
$current_round = null;

if ($result = $link->query($sql)) {
    if(  $obj = $result->fetch_object()) {
        $current_round = $obj;
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

/* query all items for current round */
$sql = "SELECT item.item_id
             , item.order_number
             , item.price
             , item.round_id
             , item.is_in_progress
             , item.current_station_id
             , item.start_time 
             , item.end_time
             , TIMESTAMPDIFF( SECOND, COALESCE(item.start_time, CURRENT_TIMESTAMP), COALESCE(item.end_time, item.last_pause_start_time, CURRENT_TIMESTAMP))-cumulative_pause_time_s as cycle_time_s FROM kfs_simulation_tbl as sims, kfs_items_tbl as item WHERE sims.simulation_id='".$simulation_id."' AND item.round_id = sims.current_round_id ORDER BY item.prio;";
$items = array();

if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        array_push($items, $obj);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


/*
 *  Query all data concerning the current_users workbench
 *  -> what is his current work item
 *  -> what items are in his individual to-do column
 *  -> what items are in his done column waiting
 *
 */
$workbench = null;
$meta_data = null;
$todo_items = array();
$current_item = null;
$done_items = array();

$sql = 'select kat.station_id';
$sql.= '      ,(select station_pos from kfs_station_conf_tbl sco where sco.station_id = kat.station_id) as station_pos';
$sql.= '      ,(select implementation_class from kfs_station_conf_tbl sco where sco.station_id = kat.station_id) as implementation_class';
$sql.= '      ,(select params_json from kfs_station_conf_tbl sco where sco.station_id = kat.station_id) as params_json';
$sql.= '      ,(select count(1) from kfs_station_conf_tbl sco where sco.configuration_name = sim.configuration_name) as station_count';
$sql.= '      ,sim.current_round_id';
$sql.= '      ,(select nsco.station_id';
$sql.= '          from kfs_station_conf_tbl sco';
$sql.= '              ,kfs_station_conf_tbl nsco';
$sql.= '         where sco.station_id = kat.station_id';
$sql.= '           and nsco.configuration_name = sco.configuration_name';
$sql.= '           and nsco.station_pos = sco.station_pos + 1) as next_station_id';
$sql.= '  from kfs_simulation_tbl sim';
$sql.= '  join kfs_attendees_tbl kat on sim.simulation_id = kat.simulation_id';
$sql.= ' where sim.simulation_id = '. $simulation_id;
$sql.= "   and kat.session_key = '". $session_key . "'";
if ($result = $link->query($sql)) {
    if(  $obj = $result->fetch_object()) {
        $meta_data = $obj;
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

if ($meta_data != null) {
    /* query to-to items from Backlog or from previous station? */
    if ($meta_data->station_pos==1) {
        /* query all items from backlog */
        $sql = 'SELECT item_id, order_number, price FROM kfs_items_tbl WHERE current_station_id is null and end_time is null and round_id='.$meta_data->current_round_id.' ORDER BY prio';;
    }
    else {
        $sql = 'SELECT item_id, order_number, price FROM kfs_items_tbl WHERE current_station_id='.$meta_data->station_id.' and is_in_progress = false and round_id='.$meta_data->current_round_id.' ORDER BY prio';;
    }
    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            array_push($todo_items, $obj);
        }
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }

    /* query the current item */
    $sql = 'SELECT item_id, order_number, price FROM kfs_items_tbl WHERE current_station_id='.$meta_data->station_id.' and is_in_progress = true and round_id='.$meta_data->current_round_id.' ORDER BY prio';;
   //error_log($sql);
    if ($result = $link->query($sql)) {
        if(  $obj = $result->fetch_object()) {
            $current_item = $obj;
        }
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }

    /* query done items from Done column or from next station? */
    if ($meta_data->station_pos==$meta_data->station_count) {
        /* query all items from backlog */
        $sql = 'SELECT item_id, order_number, price FROM kfs_items_tbl WHERE current_station_id is null and end_time is not null and round_id='.$meta_data->current_round_id.' ORDER BY prio';
    }
    else {
        $sql = 'SELECT item_id, order_number, price FROM kfs_items_tbl WHERE current_station_id='.$meta_data->next_station_id.' and is_in_progress=false and round_id='.$meta_data->current_round_id.' ORDER BY prio';
    }
    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            array_push($done_items, $obj);
        }
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
}

$workbench = array("meta_data"=>$meta_data
                  ,"todo_items"=>$todo_items
                  ,"current_item"=>$current_item
                  ,"done_items"=>$done_items
                  ,"do_auto_pull"=>$do_auto_pull);

$myJSON_array = array("status_code"=>$status_code
                    , "attendees"=>$objs
                    , "stations"=>$stations
                    , "current_round"=>$current_round
                    , "items_list"=>$items
                    , "workbench"=>$workbench);

$myJSON = json_encode($myJSON_array);
echo $myJSON;

$link->close();