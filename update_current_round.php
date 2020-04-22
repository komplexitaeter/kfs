<?php
require 'config.php';
require 'items_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);

header('Content-Type: application/json');
header('Pragma-directive: no-cache');
header('Cache-directive: no-cache');
header('Cache-control: no-cache');
header('Pragma: no-cache');
header('Expires: 0');

if ($simulation_id == null) exit('NO_SIMULATION_ID_SET');
if (!in_array($action, array('start', 'stop' ,'reset'))) exit('NO_VALID_ACTION_SET');

$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

/*
 * query current_round data, if round is set
 * .. mind the outer join, pls
 */
$sql  = 'SELECT sims.simulation_id';
$sql .= '      ,sims.current_round_id';
$sql .= '      ,round.last_start_time';
$sql .= '     ,round.last_stop_time';
$sql .= '  FROM kfs_simulation_tbl AS sims';
$sql .= '  LEFT OUTER JOIN kfs_rounds_tbl AS round';
$sql .= '    ON round.round_id = sims.current_round_id';
$sql .= ' WHERE sims.simulation_id = '.$simulation_id;

$current_round = null;

if ($result = $link->query($sql)) {
    if(!$current_round = $result->fetch_object()) exit('INVALID_SIMULATION_ID');
}
else exit('INTERNAL_ERROR');
//print_r($current_round);

$sql_dml = array();

/* START (stopped or never-started current_round, or create a started round if there is no current round) */
if ($action == 'start') {
    /* there is no current round */
    if ($current_round->current_round_id == null) {
        $sql ='INSERT INTO kfs_rounds_tbl(simulation_id, last_start_time) VALUES ('.$simulation_id.', CURRENT_TIMESTAMP)';
        array_push($sql_dml, $sql);
        $sql ='UPDATE kfs_simulation_tbl SET current_round_id = LAST_INSERT_ID() WHERE simulation_id='.$simulation_id;
        array_push($sql_dml, $sql);
    }
    /* there is a never-started current round */
    elseif ($current_round->last_start_time == null
        && $current_round->last_stop_time == null) {
        $sql = 'UPDATE kfs_rounds_tbl SET last_start_time=current_timestamp WHERE round_id='.$current_round->current_round_id;
        array_push($sql_dml, $sql);
    }
    /* there is a stopped current round */
    elseif ($current_round->last_start_time != null
        && $current_round->last_stop_time != null) {
        /*
         * when restarting a previously stopped round, add the
         * time in seconds, spend on the prior round to the
         * cumulative_time_s field, to keep it in memory
         */
        $sql = 'UPDATE kfs_rounds_tbl SET cumulative_time_s=coalesce(cumulative_time_s, 0)+timestampdiff(SECOND, last_start_time, last_stop_time), last_start_time=current_timestamp, last_stop_time=null WHERE round_id='.$current_round->current_round_id;
        array_push($sql_dml, $sql);
        $sql = 'UPDATE kfs_items_tbl SET cumulative_pause_time_s=coalesce(cumulative_pause_time_s, 0) + timestampdiff(SECOND, last_pause_start_time, current_timestamp), last_pause_start_time=null WHERE start_time is not null and end_time is null and round_id='.$current_round->current_round_id;
        array_push($sql_dml, $sql);
    }
    else exit ('INVALID_STATE_TO_START_ROUND');
}


/* STOP (a started current_round) */
if ($action == 'stop') {
    /* there is a started current round */
    if ($current_round->current_round_id != null
        && $current_round->last_start_time != null
        && $current_round->last_stop_time == null) {
        $sql = 'UPDATE kfs_rounds_tbl SET last_stop_time=current_timestamp WHERE round_id='.$current_round->current_round_id;
        array_push($sql_dml, $sql);
        $sql = 'UPDATE kfs_items_tbl SET last_pause_start_time=current_timestamp WHERE start_time is not null and end_time is null and round_id='.$current_round->current_round_id;
        array_push($sql_dml, $sql);
    }
    else exit ('INVALID_STATE_TO_STOP_ROUND');
}


/* RESET (a stopped current_round) */
if ($action == 'reset') {
    /* there is a stopped current round */
    if ($current_round->current_round_id != null
        && $current_round->last_start_time != null
        && $current_round->last_stop_time != null) {
        /*
         * alternative style, but 'no round' == 'no tasks to display'
         * -- $sql = 'UPDATE kfs_simulation_tbl SET current_round_id=null WHERE simulation_id='.$simulation_id;
         * -- array_push($sql_dml, $sql);
         * so we better create a new round and add it to the simulations current_round now
         */
        $sql ='INSERT INTO kfs_rounds_tbl(simulation_id) VALUES ('.$simulation_id.')';
        array_push($sql_dml, $sql);
        $sql ='UPDATE kfs_simulation_tbl SET current_round_id = LAST_INSERT_ID() WHERE simulation_id='.$simulation_id;
        array_push($sql_dml, $sql);
        /* create some items*/
        $sql = get_create_items_sql(null); /* get round id from last insert */
        array_push($sql_dml, $sql);
    }
    else exit ('INVALID_STATE_TO_RESET_ROUND');
}

/* execute sql dml(s) from above*/
for($i=0; $i<count($sql_dml);$i++){
    if(!$result = $link->query($sql_dml[$i])) exit('INTERNAL_ERROR');
}

$link->close();
