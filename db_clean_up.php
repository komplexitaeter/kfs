<?php
require 'config.php';

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
 * loop through all 24h outdated simulation
 * attendees and remove all user-data
 */
$sql="select a.simulation_id
  , max(a.last_callback_date)
,min(a.last_callback_date)
from kfs_attendees_tbl a
         join kfs_simulation_tbl s on s.simulation_id = a.simulation_id
where s.status_code != 'CHECKIN'
group by simulation_id
having timestampdiff( second, max(a.last_callback_date), current_timestamp) >  60*60*24
";

if ($result = $link->query($sql)) {
    while ($sim = $result->fetch_object()) {
        $link->query("delete from kfs_items_tbl 
                              where round_id in (
                                  select round_id
                                    from kfs_rounds_tbl t
                                   where t.simulation_id = $sim->simulation_id
                                   )");
        $link->query("delete from kfs_attendees_tbl where simulation_id = $sim->simulation_id");
        $link->query("delete from kfs_rounds_tbl where simulation_id = $sim->simulation_id");
        $link->query("delete from kfs_workbench_tbl where simulation_id = $sim->simulation_id");
        $link->query("update kfs_simulation_tbl set status_code = 'CHECKIN' where simulation_id = $sim->simulation_id");
    }
}