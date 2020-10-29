<?php

function do_exit($str) {
    error_log($str);
    exit($str);
}

function update_workbench($link,
                          $simulation_id,
                          $session_key,
                          $action,
                          $item_svg = null)
{
    /* do some checks on the input params */
    if ($simulation_id == null) return 'NO_SIMULATION_ID_SET';
    if (!in_array($action, array('start', 'finish'))) return 'NO_VALID_ACTION_SET';
    if ($session_key == null) return 'NO_SESSION_KEY_SET';

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
            and kwb.station_id = kat.station_id) as workbench_cnt
        ,krt.auto_pull
     from kfs_simulation_tbl sim
     join kfs_attendees_tbl kat on kat.simulation_id = sim.simulation_id
     left outer join kfs_station_conf_tbl ksct on ksct.station_id = kat.station_id
     left outer join kfs_rounds_tbl krt on krt.round_id = sim.current_round_id
    where sim.simulation_id = " . $simulation_id . "
      and kat.session_key = '" . $session_key . "'";

    if ($result = $link->query($sql)) {
        if ($obj = $result->fetch_object()) {
            $meta_data = $obj;
        } else {
            return 'INVALID_SIMULATION_ATTENDEE_COMBINATION';
        }
    } else {
        return 'INTERNAL_ERROR_001';
    }

    /* do some more checks based on the meta data */
    if ($meta_data->station_id == null) return 'ATTENDEE_IS_OBSERVER';
    if ($meta_data->current_round_id == null) return 'NO_CURRENT_ROUND';
    if (!($meta_data->last_start_time != null && $meta_data->last_stop_time == null))
        return 'CURRENT_ROUND_NOT_STARTED';

    /* want to start the next work item */
    if ($action == 'start') {
        /* check if attendee has nothing to-do right now in his station */
        if ($meta_data->current_work_item_id != null) return 'ALREADY_WORK_IN_PROGRESS';

        /* if in limit-1-mode check, if next stations wip limit is not violated*/
        if ($meta_data->auto_pull == 0
         && $meta_data->station_pos < $meta_data->station_count) {
            /*query amount of unstarted work in next station*/
            $sql = "select count(1) as waiting_items
                      from kfs_items_tbl
                     where round_id = $meta_data->current_round_id
                       and current_station_id = $meta_data->next_station_id
                       and is_in_progress = false";
            $result = $link->query($sql);
            $obj = $result->fetch_object();
            //error_log($sql);
            if ($obj->waiting_items > 0 ) return 'WAITING_FOR_NEXT_STATION';
        }

        /* query next to do item based on my stations position  */
        $item_id = null;
        if ($meta_data->station_pos == 1) {
            $sql = 'SELECT * FROM kfs_items_tbl WHERE current_station_id is null and end_time is null and round_id=' . $meta_data->current_round_id . ' ORDER BY prio';
        } else {
            $sql = 'SELECT * FROM kfs_items_tbl WHERE current_station_id=' . $meta_data->station_id . ' and is_in_progress = false and round_id=' . $meta_data->current_round_id . ' ORDER BY prio';
        }
        if ($result = $link->query($sql)) {
            if ($obj = $result->fetch_object()) {
                $item_id = $obj->item_id;
            } else {
                return 'NOTHING_MORE_TODO';
            }
        } else {
            return 'INTERNAL_ERROR_002';
        }

        /* start item based on station pos */
        if ($meta_data->station_pos == 1) {
            $sql = "UPDATE kfs_items_tbl as itm
                    SET itm.start_time=current_timestamp
                      , itm.is_in_progress=true
                      , itm.current_station_id=" . $meta_data->station_id . "
                      , itm.start_time_s = (
                             select COALESCE(cumulative_time_s, 0) + TIMESTAMPDIFF( SECOND, round.last_start_time, COALESCE(round.last_stop_time, CURRENT_TIMESTAMP))
                               from kfs_rounds_tbl as round
                              where round.round_id=itm.round_id
                         )
                  WHERE itm.item_id=" . $item_id;

            $sql_items_cnt = "SELECT count(1) as cnt FROM kfs_items_tbl WHERE round_id = $meta_data->current_round_id";

            $result = $link->query($sql_items_cnt);
            $obj = $result->fetch_object();
            $offset = $obj->cnt;

            $sql_items = get_create_items_sql($meta_data->current_round_id, $offset, 1);
            $link->query($sql_items);

        } else {
            $sql = "UPDATE kfs_items_tbl SET is_in_progress=true WHERE item_id=" . $item_id;
        }

        /* do the dml */
        if (!$result = $link->query($sql)) do_exit('INTERNAL_ERROR_003: '.$sql);

        /* measure the time for each station */
        $sql = "INSERT INTO kfs_work_results_tbl(station_id, item_id, start_time_s) 
            VALUES ($meta_data->station_id, $item_id,
                    (
                             select COALESCE(cumulative_time_s, 0) + TIMESTAMPDIFF( SECOND, round.last_start_time, COALESCE(round.last_stop_time, CURRENT_TIMESTAMP))
                               from kfs_rounds_tbl as round
                              where round.round_id=$meta_data->current_round_id
                         )
                    )";
        if (!$result = $link->query($sql)) do_exit('INTERNAL_ERROR_003a: '.$sql);

    }


    /* want to stop the current work item */
    if ($action == 'finish') {

        /* check if attendee has a unfinished item in his station */
        if ($meta_data->current_work_item_id == null) return 'NO_WORK_IN_PROGRESS';

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
                      ,item_svg = '" . $item_svg . "'
                 WHERE itm.item_id=" . $meta_data->current_work_item_id;
        } else {
            $sql = "UPDATE kfs_items_tbl 
                   SET is_in_progress=false
                     , item_svg = '" . $item_svg . "'
                     , current_station_id=" . $meta_data->next_station_id . " WHERE item_id=" . $meta_data->current_work_item_id;
        }

        /* do the dml */
        if (!$result = $link->query($sql)) do_exit('INTERNAL_ERROR_004: '.$sql);


        $sql = "UPDATE kfs_work_results_tbl 
               SET end_time_s =   (
                             SELECT COALESCE(cumulative_time_s, 0) + TIMESTAMPDIFF( SECOND, round.last_start_time, COALESCE(round.last_stop_time, CURRENT_TIMESTAMP))
                               FROM kfs_rounds_tbl AS round
                              WHERE round.round_id=$meta_data->current_round_id
                         )
             WHERE station_id = $meta_data->station_id
               AND item_id = $meta_data->current_work_item_id";

        if (!$result = $link->query($sql)) do_exit('INTERNAL_ERROR_004a: '.$sql);

        if ($meta_data->workbench_cnt > 0) {
            $sql = "UPDATE kfs_workbench_tbl 
                       SET last_item_id = $meta_data->current_work_item_id
                          ,last_item_svg = '$item_svg'
                     WHERE station_id = $meta_data->station_id
                       AND simulation_id = $simulation_id";
        }
        else {
            $sql = "INSERT INTO kfs_workbench_tbl(simulation_id, station_id, last_item_id, last_item_svg) 
                   VALUE($simulation_id, $meta_data->station_id, $meta_data->current_work_item_id, '$item_svg')";
        }

        if (!$result = $link->query($sql)) do_exit('INTERNAL_ERROR_004b: '.$sql);

    }


    /* looks like we made it up this far, unexpectedly  */
    return 'SUCCESS';
}