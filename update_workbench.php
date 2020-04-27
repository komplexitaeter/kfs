<?php
require 'config.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$thumbnail_svg = filter_input(INPUT_POST, 'thumbnail_svg');
$item_svg = filter_input(INPUT_POST, 'item_svg');


header('Content-Type: application/json');
header('Pragma-directive: no-cache');
header('Cache-directive: no-cache');
header('Cache-control: no-cache"');
header('Pragma: no-cache');
header('Expires: 0');

function exit_with_status($status_code) {
    echo(json_encode(array("status_code"=>$status_code)));
    exit(0);
}

$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

/* do some checks on the input params */
if ($simulation_id == null) exit_with_status('NO_SIMULATION_ID_SET');
if (!in_array($action, array('start','finish','thumbnail_update'))) exit_with_status('NO_VALID_ACTION_SET');
if ($session_key == null) exit_with_status('NO_SESSION_KEY_SET');

/* based on the input params query some meta data */
$meta_data = null;
$sql = null;

$sql = "select sim.simulation_id
      ,kat.attendee_id
      ,ksct.station_id
      ,ksct.station_pos
      ,krt.round_id as current_round_id
      ,krt.last_start_time
      ,krt.last_stop_time
      ,(select count(1) from kfs_station_conf_tbl sco where sco.configuration_name = sim.configuration_name) as station_count
      ,(select psco.station_id
          from kfs_station_conf_tbl psco
         where psco.configuration_name = ksct.configuration_name
           and psco.station_pos = ksct.station_pos - 1) as previous_station_id
      ,(select nsco.station_id
          from kfs_station_conf_tbl nsco
         where nsco.configuration_name = ksct.configuration_name
           and nsco.station_pos = ksct.station_pos + 1) as next_station_id
       ,(select max(itm.item_id)
           from kfs_items_tbl itm
          where itm.round_id = krt.round_id
            and itm.is_in_progress = true
            and itm.current_station_id = kat.station_id
         ) as current_work_item_id
        ,(select count(1) 
           from kfs_workbench_tbl kwb
          where kwb.simulation_id = sim.simulation_id
            and kwb.station_id = kat.station_id) as thumbnail_cnt
     from kfs_simulation_tbl sim
     join kfs_attendees_tbl kat on kat.simulation_id = sim.simulation_id
     left outer join kfs_station_conf_tbl ksct on ksct.station_id = kat.station_id
     left outer join kfs_rounds_tbl krt on krt.round_id = sim.current_round_id
    where sim.simulation_id = ". $simulation_id."
      and kat.session_key = '". $session_key . "'";

if ($result = $link->query($sql)) {
    if(  $obj = $result->fetch_object()) {
        $meta_data = $obj;
    }
    else {
        exit_with_status('INVALID_SIMULATION_ATTENDEE_COMBINATION');
    }
}
else{
    exit_with_status('INTERNAL_ERROR_001');
}

/* to some more checks based on the meta data */
if ($meta_data->station_id == null) exit_with_status('ATTENDEE_IS_OBSERVER');
if ($action!='thumbnail_update') {
    if ($meta_data->current_round_id == null) exit_with_status('NO_CURRENT_ROUND');
    if (!($meta_data->last_start_time != null && $meta_data->last_stop_time == null))
        exit_with_status('CURRENT_ROUND_NOT_STARTED');
}

/* want to start the next work item */
if ($action=='start') {
    /* check if attendee has nothing to-do right now in his station */
    if ($meta_data->current_work_item_id != null) exit_with_status('ALREADY_WORK_IN_PROGRESS');

    /* query next to do item based on my stations position  */
    $item_id = null;
    if ($meta_data->station_pos == 1) {
        $sql = 'SELECT * FROM kfs_items_tbl WHERE current_station_id is null and end_time is null and round_id='.$meta_data->current_round_id.' ORDER BY prio';
    }
    else {
        $sql = 'SELECT * FROM kfs_items_tbl WHERE current_station_id='.$meta_data->station_id.' and is_in_progress = false and round_id='.$meta_data->current_round_id.' ORDER BY prio';
    }
    if ($result = $link->query($sql)) {
        if(  $obj = $result->fetch_object()) {
            $item_id = $obj->item_id;
        }
        else {
            exit_with_status('NOTHING_MORE_TODO');
        }
    }
    else{
        exit_with_status('INTERNAL_ERROR_002');
    }

    /* start item based on station pos */
    if ($meta_data->station_pos == 1) {
        $sql =  "UPDATE kfs_items_tbl as itm
                    SET itm.start_time=current_timestamp
                      , itm.is_in_progress=true
                      , itm.current_station_id=".$meta_data->station_id."
                      , itm.start_time_s = (
                             select COALESCE(cumulative_time_s, 0) + TIMESTAMPDIFF( SECOND, round.last_start_time, COALESCE(round.last_stop_time, CURRENT_TIMESTAMP))
                               from kfs_rounds_tbl as round
                              where round.round_id=itm.round_id
                         )
                  WHERE itm.item_id=".$item_id;
    }
    else {
        $sql = "UPDATE kfs_items_tbl SET is_in_progress=true WHERE item_id=".$item_id;
    }

    /* do the dml */
    if(!$result = $link->query($sql)) exit('INTERNAL_ERROR_003');
}



/* want to stop the current work item */
if ($action=='finish') {
    /* check if attendee has a unfinished item in his station */
    if ($meta_data->current_work_item_id == null) exit_with_status('NO_WORK_IN_PROGRESS');

    /* set do done based on current station pos */
    if ($meta_data->station_pos == $meta_data->station_count) {
        /* last station before done column */
        $sql = "UPDATE kfs_items_tbl as itm
                   SET itm.end_time=current_timestamp
                     , itm.is_in_progress=false
                     , itm.current_station_id=null 
                     , itm.end_time_s = (
                             select COALESCE(cumulative_time_s, 0) + TIMESTAMPDIFF( SECOND, round.last_start_time, COALESCE(round.last_stop_time, CURRENT_TIMESTAMP))
                               from kfs_rounds_tbl as round
                              where round.round_id=itm.round_id
                       )
                      ,item_svg = '".$item_svg."'
                 WHERE itm.item_id=".$meta_data->current_work_item_id;
    }
    else {
        $sql = "UPDATE kfs_items_tbl 
                   SET is_in_progress=false
                     , item_svg = '".$item_svg."'
                     , current_station_id=".$meta_data->next_station_id." WHERE item_id=".$meta_data->current_work_item_id;
    }

    /* do the dml */
    if(!$result = $link->query($sql)) exit('INTERNAL_ERROR_004');
}

/*  update the thumbnail of current workbench  */
if ($action=='thumbnail_update') {
    if ($meta_data->thumbnail_cnt==0) {
        $sql = "INSERT INTO kfs_workbench_tbl(simulation_id, station_id, workbench_svg) 
                     VALUES (".$simulation_id.",".$meta_data->station_id.",'".$thumbnail_svg."')";
    }
    else {
        $sql = "UPDATE kfs_workbench_tbl 
                   SET workbench_svg = '".$thumbnail_svg."'
                 WHERE simulation_id=".$simulation_id."
                   AND station_id=".$meta_data->station_id;
    }
    if(!$result = $link->query($sql)) exit('INTERNAL_ERROR_005');
}

    /* looks like we made it up this far, unexpectedly  */
exit_with_status('SUCCESS');