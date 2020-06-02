<?php
require 'config.php';
require 'sql_lib.php';

/* GET Parameters */
$round_id = filter_input(INPUT_GET, 'round_id', FILTER_SANITIZE_NUMBER_INT);
$side = filter_input(INPUT_GET, 'side', FILTER_SANITIZE_NUMBER_INT);


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

$wip_toggle = '0';
if ($side == 0 || $side == 1) {
    $sql = "SELECT substr(s.debriefing_wip_toggle,$side+1,1) wip_toggle
              FROM kfs_rounds_tbl r, kfs_simulation_tbl s
             WHERE s.simulation_id = r.simulation_id
               AND r.round_id = $round_id";
    if ($result = $link->query($sql)) {
        if ($obj = $result->fetch_object()) {
            $wip_toggle = $obj->wip_toggle;
        }
    }
}



$sql = "select COALESCE(rnd.cumulative_time_s, 0) + TIMESTAMPDIFF(SECOND, rnd.last_start_time,
    COALESCE(rnd.last_stop_time, CURRENT_TIMESTAMP)) as total_time_s
       ,count(i.item_id) as total_items_cnt
       ,sum(i.price) as total_money_earned
       ,round(avg(i.end_time_s-i.start_time_s), 0) as avg_cycle_time
       ,null as avg_throughput
       ,rnd.simulation_id
       ,(   select max(floor((i.end_time_s)/60)) 
              from kfs_items_tbl i
             where i.round_id = rnd.round_id
               and i.end_time_s is not null
               and i.current_station_id is null) as last_minute
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

/* query round stat per minute */

$style = array("role"=> "style","type"=> "string");
$per_minute = array();
array_push($per_minute, array("Min", "ships", "wip", $style));

if ($round_kpi->last_minute != null) {
    for ($min=0; $min<=$round_kpi->last_minute; $min++ ) {

        $ships = '';
        $wip = '';

        $sql = "select count(1) as ships
             from kfs_items_tbl i
            where i.round_id = $round_id
              and i.end_time_s is not null
              and i.current_station_id is null
              and i.end_time_s > $min*60
              and i.end_time_s < ($min+1)*60";
        if ($result = $link->query($sql)) {
            if ($obj = $result->fetch_object()) {
                $ships = $obj->ships;
            }
        }

        $sql = "select count(1) as wip
             from kfs_items_tbl i
            where i.round_id = $round_id
              and i.end_time_s is not null
              and i.current_station_id is null
              and i.start_time_s < ($min+1)*60
              and ifnull(i.end_time_s, ($min+2)*60) > (($min+1)*60)-1";
        if ($result = $link->query($sql)) {
            if ($obj = $result->fetch_object()) {
                $wip = $obj->wip;
            }
        }

        array_push($per_minute, array(
            (int)$min,
            (int)$ships,
            (int)$wip,
            "opacity:".$wip_toggle
        ));
    }
}


$per_ship = array();
$style = array("role"=> "style"
                ,"type"=> "string");
array_push($per_ship, array("delivery time", "cycle time", $style));

$sql = "select end_time_s delivery_time
              ,end_time_s - start_time_s cycle_time
              ,coalesce(options, '') as options
          from kfs_items_tbl i
         where i.round_id = $round_id
           and i.end_time_s is not null
           and i.current_station_id is null
           order by end_time_s";

if ($result = $link->query($sql)) {
    while ($obj = $result->fetch_object()) {
        array_push($per_ship
            , array((int)$obj->delivery_time
            , (int)$obj->cycle_time
            , $obj->options));
    }
}


$myJSON_array = array("title"=> $title
                     ,"kpi"=> $round_kpi
                     ,"per_minute"=> $per_minute
                     ,"per_ship"=> $per_ship);

echo json_encode($myJSON_array);

$link->close();