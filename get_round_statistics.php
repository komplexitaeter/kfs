<?php
require 'config.php';
require 'sql_lib.php';

/* GET Parameters */
$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$round_id = filter_input(INPUT_GET, 'round_id', FILTER_SANITIZE_NUMBER_INT);

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


$sql = "select COALESCE(rnd.cumulative_time_s, 0) + TIMESTAMPDIFF(SECOND, rnd.last_start_time,
    COALESCE(rnd.last_stop_time, CURRENT_TIMESTAMP)) as total_time_s
       ,count(i.item_id) as total_items_cnt
       ,sum(i.price) as total_money_earned
       ,round(avg(i.end_time_s-i.start_time_s), 0) as avg_cycle_time
       ,null as avg_throughput
       ,rnd.simulation_id
  from kfs_rounds_tbl as rnd
    left outer join  kfs_items_tbl i
      on i.round_id = rnd.round_id
and i.end_time_s is not null
and i.current_station_id is null
  where rnd.round_id = $round_id
group by rnd.round_id, rnd.cumulative_time_s, rnd.last_start_time, rnd.last_stop_time";

$round_kpi = (Object) Array();
if ($result = $link->query($sql)) {
    $round_kpi = $result->fetch_object();
}
else {
    exit("NO_ROUND_FOUND_ERROR");
}

$sql = "select round(avg(mins.items_cnt),1) as avg_throughput from (
                  select floor((xi.end_time_s) / 60) as minute
                       , count(1)                   as items_cnt
                  from kfs_items_tbl xi
                  where xi.round_id = $round_id
                    and xi.end_time_s is not null
                    and xi.current_station_id is null
                  group by minute
                  having minute != 0
                     and minute != (select floor((max(x.end_time_s)) / 60)
                                    from kfs_items_tbl x
                                    where x.round_id = $round_id
                                      and x.end_time_s is not null
                                      and x.current_station_id is null)
                       and minute != (select floor((min(x.end_time_s)) / 60)
                                    from kfs_items_tbl x
                                    where x.round_id = $round_id
                                      and x.end_time_s is not null
                                      and x.current_station_id is null)                  
              ) as mins";

if ($result = $link->query($sql)) {
    if ($obj = $result->fetch_object()) {
        $round_kpi->avg_throughput = $obj->avg_throughput;
    }
}

$rounds = get_rounds($link, $round_kpi->simulation_id);
$title = null;

for ($i=0; $i<count($rounds); $i++) {
    if ($rounds[$i]->round_id==$round_id) {
        $title = $rounds[$i]->title;
    }
}



$myJSON_array = array("title"=> $title
                     ,"kpi"=> $round_kpi);

echo json_encode($myJSON_array);

$link->close();