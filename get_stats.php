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


$myJSON_array = array("status_code"=>$status_code
                    , "stats_round_id" =>$stats_round_id
                    , "rounds"=>$rounds);

$myJSON = json_encode($myJSON_array);
echo $myJSON;

$link->close();