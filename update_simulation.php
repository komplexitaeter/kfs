<?php
require 'config.php';
require 'helper_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id');


set_header('json');


$link = db_init();

$link->autocommit(false);


$sql_set = array();

if(isset($_GET['status_code'])){
    $status_code = filter_input(INPUT_GET, 'status_code');
    if (strlen($status_code)>0) {
        if ($status_code=='RERUNNING') {
            array_push($sql_set, "status_code = 'RUNNING'");
        }
        else {
            array_push($sql_set, "status_code = '".$status_code."'");
        }

        if($status_code=="RUNNING") {
            /* delete inactive attendees */
            $sql = "DELETE FROM kfs_attendees_tbl WHERE TIMESTAMPDIFF( SECOND, last_callback_date, CURRENT_TIMESTAMP) >= 30 AND simulation_id=" . $simulation_id;
            if(!$result = $link->query($sql)) exit('INTERNAL_ERROR');

            /* Check, if this is the first start of the simulation
             * and there is the need to create a new round and
             * add some items
             */
            $sql = $link->prepare("SELECT count(1) as cnt FROM kfs_rounds_tbl WHERE simulation_id = ?");
            $sql->bind_param('i', $simulation_id);
            $sql->execute();
            $result = $sql->get_result();
            $round_count = $result->fetch_object()->cnt;

            if ($round_count==0) {
                /* create un-started round */
                $sql = 'INSERT INTO kfs_rounds_tbl(simulation_id) VALUES (' . $simulation_id . ')';
                if (!$result = $link->query($sql)) exit('INTERNAL_ERROR');
                $sql = 'UPDATE kfs_simulation_tbl SET current_round_id = LAST_INSERT_ID() WHERE simulation_id=' . $simulation_id;
                if (!$result = $link->query($sql)) exit('INTERNAL_ERROR');

                /* create some items*/
                $sql = get_create_items_sql(null, null, null, null); /* get round id from last insert */
                if (!$result = $link->query($sql)) exit('INTERNAL_ERROR');
            }
        }
    }
}

if(isset($_GET['stats_round_id'])){
    $side = filter_input(INPUT_GET, 'side', FILTER_SANITIZE_NUMBER_INT);

    if ($side!=null && $side>=0 && $side<2) {
        $stats_round_id = filter_input(INPUT_GET, 'stats_round_id', FILTER_SANITIZE_NUMBER_INT);
        if ($stats_round_id != null) array_push($sql_set, "stats_round_id_$side = $stats_round_id");

    }
}

if(isset($_GET['configuration_name'])){
    $configuration_name = filter_input(INPUT_GET, 'configuration_name', FILTER_SANITIZE_STRING);
    if ($configuration_name != null) {

        $sql = $link->prepare( "select count(1) as cnt
                  from kfs_simulation_tbl kst
                  join kfs_rounds_tbl krt on krt.round_id = kst.current_round_id
                  join kfs_items_tbl kit on kit.round_id = krt.round_id
                 where kst.simulation_id = ?
                   and (not isnull(kit.start_time)
                       or not isnull(kit.current_station_id)
                     )");

        $sql->bind_param('i', $simulation_id);
        $sql->execute();
        $result = $sql->get_result();
        $items_cnt = $result->fetch_object()->cnt;

        if ($items_cnt === 0) {

            array_push($sql_set, "configuration_name = '$configuration_name'");

            $sql = "UPDATE kfs_attendees_tbl SET station_id = null WHERE simulation_id=$simulation_id";

            if (!$result = $link->query($sql)) {
                $link->rollback();
                exit('INTERNAL_ERROR');
            }

        }
    }
}

if(isset($_GET['action'])){
    $action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);
    $side = filter_input(INPUT_GET, 'side', FILTER_SANITIZE_STRING);

    if ($action == 'toggle_wip_visibility') {
        if ($side==0) {
            $sql="debriefing_wip_toggle = concat(not substr(debriefing_wip_toggle,1,1) , substr(debriefing_wip_toggle,2,1))";
        }
        else if ($side==1) {
            $sql="debriefing_wip_toggle = concat( substr(debriefing_wip_toggle,1,1) , not substr(debriefing_wip_toggle,2,1))";
        }
        array_push($sql_set, $sql);
    }
}

if(count($sql_set)==0){
    $link->close();
    exit(0);
}

$sql_update = '';
for($i=0; $i<count($sql_set);$i++){
    if($i>0){
        $sql_update.=", ";
    }
    $sql_update .= $sql_set[$i];
}

$sql = "UPDATE kfs_simulation_tbl SET ".$sql_update." WHERE simulation_id='".$simulation_id."'";

if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}


$link->commit();
$link->close();