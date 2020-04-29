<?php
require 'config.php';

header('Content-type: application/json');
header("Pragma-directive: no-cache");
header("Cache-directive: no-cache");
header("Cache-control: no-cache");
header("Pragma: no-cache");
header("Expires: 0");

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

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
$sql = "SELECT sim.status_code
              ,coalesce(sim.stats_round_id, sim.current_round_id) stats_round_id
          FROM kfs_simulation_tbl as sim
         WHERE sim.simulation_id=".$simulation_id;
if ($result = $link->query($sql)) {
    if($obj = $result->fetch_object()) {
        $status_code = $obj->status_code;
        $stats_round_id = $obj->stats_round_id;
    }
    else{
        $status_code = "NO_SIMULATION";
        $stats_round_id = null;
    }
}
else {
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


/* query all finished rounds of simulation */
$rounds = array();
$sql = "select round_id, last_stop_time as round_description
          from kfs_rounds_tbl
         where simulation_id = $simulation_id
           and last_start_time is not null
           and last_stop_time is not null
         order
            by last_stop_time";
if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        array_push($rounds, $obj);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$round_data=null;
$sql="select COALESCE(rnd.cumulative_time_s, 0) + TIMESTAMPDIFF(SECOND, rnd.last_start_time,
    COALESCE(rnd.last_stop_time, CURRENT_TIMESTAMP)) as total_time_s
       ,count(i.item_id) as total_items_cnt
       ,sum(i.price) as total_money_earned
       ,round(avg(i.end_time_s-i.start_time_s), 0) as avg_cycle_time
       ,(select ii.end_time_s-ii.start_time_s from kfs_items_tbl ii where ii.round_id = i.round_id and ii.prio = min(i.prio)) as first_item_cycle_time
       ,(select ii.end_time_s-ii.start_time_s from kfs_items_tbl ii where ii.round_id = i.round_id and ii.prio = max(i.prio)) as last_item_cycle_time
       ,null as avg_throughput
  from kfs_rounds_tbl as rnd
    left outer join  kfs_items_tbl i
      on i.round_id = rnd.round_id
and i.end_time_s is not null
and i.current_station_id is null
  where rnd.round_id = $stats_round_id
group by rnd.round_id, rnd.cumulative_time_s, rnd.last_start_time, rnd.last_stop_time";

if ($result = $link->query($sql)) {
    if(  $obj = $result->fetch_object()) {
        $round_data = $obj;
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


$myJSON_array = array("status_code"=> $status_code
                    , "stats_round_id" => $stats_round_id
                    , "round_data" => $round_data
                    , "rounds"=> $rounds);

$myJSON = json_encode($myJSON_array);
echo $myJSON;

$link->close();