<?php
require 'config.php';

/* GET Parameters */
$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);

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


/* query all finished rounds of simulation */
$rounds = array();
$sql = "select round_id, last_stop_time
          from kfs_rounds_tbl
         where simulation_id = $simulation_id
         order
            by last_stop_time";
$i=0;
if ($result = $link->query($sql)) {
    while(  $obj = $result->fetch_object()) {
        $i++;
        $round = (Object) Array("round_id"=>$obj->round_id
                               ,"description"=>"Nr. $i - $obj->last_stop_time");
        array_push($rounds, $round);
    }
}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$myJSON_array = array("rounds"=> $rounds);
echo json_encode($myJSON_array);

$link->close();