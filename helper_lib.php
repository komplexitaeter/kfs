<?php
function db_init() {
    //sleep(5);
    $link = mysqli_init();
    mysqli_real_connect(
        $link,
        _MYSQL_HOST,
        _MYSQL_USER,
        _MYSQL_PWD,
        _MYSQL_DB,
        _MYSQL_PORT
    );
    $link->set_charset("utf8");
    return $link;
}

function set_header($content_type) {
    if ($content_type=='json') {
        header('Content-Type: application/json; charset=utf-8');
    }
    else if ($content_type=='event-stream') {
        header("Content-Type: text/event-stream; charset=utf-8");
    }
    else if ($content_type=='svg') {
        header('Content-type: image/svg+xml');
    }
    header('Pragma-directive: no-cache');
    header('Cache-directive: no-cache');
    header('Cache-control: no-cache');
    header('Pragma: no-cache');
    header('Expires: 0');
}

function translate_tl($language_code, $tl)
{
    if ($tl != null &&$language_code != null) {
        return trim(json_encode(json_decode($tl, true)[$language_code], JSON_UNESCAPED_UNICODE), '"');
    } else {
        return null;
    }
}

function get_translation_obj($context) {
    return json_decode(file_get_contents('./'.$context.'_translations.json'), true);
}

function get_translation_val($json, $id, $language_code) {
    for ($i=0;$i<count($json);$i++) {
        if ($json[$i]["id"]===$id) {
            return $json[$i][$language_code]["text"];
        }
    }
    return '';
}

function get_translation($context, $id, $language_code) {
    $json = get_translation_obj($context);
    return get_translation_val($json, $id, $language_code);
}

function get_month_tl() {
    return array( null,
        array("de"=>"Jan", "en"=>"Jan"),
        array("de"=>"Feb", "en"=>"Feb"),
        array("de"=>"Mär", "en"=>"Mar"),
        array("de"=>"Apr", "en"=>"Apr"),
        array("de"=>"Mai", "en"=>"May"),
        array("de"=>"Jun", "en"=>"Jun"),
        array("de"=>"Jul", "en"=>"Jul"),
        array("de"=>"Aug", "en"=>"Aug"),
        array("de"=>"Sep", "en"=>"Sep"),
        array("de"=>"Okt", "en"=>"Oct"),
        array("de"=>"Nov", "en"=>"Nov"),
        array("de"=>"Dez", "en"=>"Dec"));
}

function get_create_items_sql($round_id, $offset, $count, $item_options) {
    $options = array('green','blue','yellow','brown','pink','black','purple','red');

    //$sids = array('null','null','null','123321','124421','125521','126621','127721','128821','129921','131131');
    $sids = array('null');
    $station_id = null;

    $sql = 'INSERT'.' INTO kfs_items_tbl(order_number,round_id,prio,price,current_station_id,options)';
    if ($round_id==null) $round_id = 'LAST_INSERT_ID()';
    if ($offset==null) $offset = 0;
    if ($count==null) $count = 10;

    for ($i=$offset;$i<$offset+$count;$i++) {
        $station_id = $sids[mt_rand(0, count($sids)-1)];
        if ($i==$offset) $sql.='VALUES'; else $sql.=',';
        if ($item_options == null) $item_options_val = $options[rand(0,count($options)-1)]; else $item_options_val = $item_options;
        $sql.="('".str_pad($i+1, 2, "0", STR_PAD_LEFT)."',".$round_id.",".($i+1).",100,".$station_id.",'".$item_options_val."')";
    }

    return $sql;
}



function get_stations_status_sql($simulation_id) {
 $sql=   "select x.*
      ,case when is_attended then
         case when is_paused then 'simulation_paused'
              else case when current_items_cnt>0 then 'none'
                  else case when not auto_pull and wip_next_station_cnt>0 then 'coffee_break'
                      else case when todo_items_cnt > 0 then 'pull_ready'
                          else 'coffee_break'
                          end
                      end
                  end
           end
          else 'unattended'
       end as locked_div
      ,case when !is_attended
              or is_paused
              or current_items_cnt>0
              or (not auto_pull and wip_next_station_cnt>0)
              or todo_items_cnt = 0
            then 'inactive'
            else 'active'
       end as pull
      ,case when !is_attended
              or is_paused
            then 'inactive'
            when current_items_cnt = 0
             and not auto_pull
             and wip_next_station_cnt>0
            then 'glass_hour'
            when current_items_cnt > 0
            then 'active'
            else 'inactive'
             end as push
  from (
select sc.station_id
      ,sc.station_name_tl
      ,sc.station_pos
      ,sc.params_json_tl
      ,(select count(1)
          from kfs_station_conf_tbl sco
         where sco.configuration_name = s.configuration_name) as station_count
      ,case when kat.attendee_id is null then false else true end as is_attended
      ,case when not (krt.last_start_time is not null and krt.last_stop_time is null) then true else false end as is_paused
      ,(select count(1)
          from kfs_items_tbl i
         where i.round_id = krt.round_id
           and i.current_station_id = sc.station_id
           and i.is_in_progress = true ) as current_items_cnt
      ,(select count(1)
        from kfs_items_tbl i
        where i.round_id = krt.round_id
          and (i.current_station_id = sc.station_id
              or (i.current_station_id is null and pri_s.station_id is null)
            )
          and i.is_in_progress = false ) as todo_items_cnt
      ,(select count(1)
        from kfs_items_tbl i
        where i.round_id = krt.round_id
          and i.current_station_id = pos_s.station_id
          and i.is_in_progress = false
        ) as wip_next_station_cnt
      ,krt.auto_pull
      ,w.last_item_id
      ,kat.session_key
      ,krt.round_id as current_round_id
      ,pos_s.station_id as next_station_id
  from kfs_simulation_tbl as s
  join kfs_station_conf_tbl as sc
  on sc.configuration_name = s.configuration_name
  left outer join kfs_station_conf_tbl as pri_s
  on pri_s.configuration_name = s.configuration_name
   and pri_s.station_pos = sc.station_pos - 1
  left outer join kfs_station_conf_tbl as pos_s
    on pos_s.configuration_name = s.configuration_name
  and pos_s.station_pos = sc.station_pos + 1
  left outer join kfs_rounds_tbl krt
  on krt.round_id = s.current_round_id
  left outer join  kfs_attendees_tbl kat
    on  kat.simulation_id = krt.simulation_id
    and kat.station_id = sc.station_id
  left outer join kfs_workbench_tbl w
    on w.station_id = sc.station_id
   and w.simulation_id = s.simulation_id
where s.simulation_id = $simulation_id
) as x order by x.station_pos"
;


 return $sql;

}

function get_rounds($link, $simulation_id) {
    /* query all finished rounds of simulation */
    $rounds = array();
    $sql = "select round_id, last_stop_time, auto_pull
          from kfs_rounds_tbl
         where simulation_id = $simulation_id
            and trial_run = false
         order
            by last_stop_time";
    $i=0;
    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            $i++;
            $round = (Object) Array("round_id"=>$obj->round_id
            ,"description"=>"Nr. $i - $obj->last_stop_time"
            ,"title"=>"$i"
            ,"push_mode"=>$obj->auto_pull);
            array_push($rounds, $round);
        }
    }
    return $rounds;
}

function add_attendee_stats($obj, $simulation_id, $add_stats, $link) {
    if ($add_stats==1) {
        $sql = "SELECT count(1) AS executions_cnt
                              ,coalesce(round(avg(milliseconds),0), -1) execution_time
                           FROM kfs_execution_times_tbl
                          WHERE simulation_id = $simulation_id
                            AND session_key = '$obj->session_key'
                            AND creation_date > timestampadd(MINUTE, -1, current_timestamp)";
        if ($result = $link->query($sql)) {
            if ($stats = $result->fetch_object()) {
                $obj->executions_cnt = $stats->executions_cnt;
                $obj->execution_time = $stats->execution_time;
            }
        }
    }
    return $obj;
}

function save_execution_time($link, $simulation_id, $session_key, $execution_time, $resource_name, $is_stream) {
    if(isset($execution_time)) {
        if ($execution_time>0) {
            if ($is_stream)
            $sql = null;
            $sql = $link->prepare("INSERT INTO kfs_execution_times_tbl(simulation_id, session_key, resource_name, milliseconds, is_stream) 
                                            VALUES (?,?,?,?,?)");
            $is_stream_int = intval($is_stream);
            $sql->bind_param('issii', $simulation_id, $session_key, $resource_name, $execution_time, $is_stream_int);
            $sql->execute();
        }
    }
}

function update_current_round($link, $simulation_id, $action, $trial_run, $auto_pull) {

    /*
     * query current_round data, if round is set
     */
    $sql  = "SELECT sims.simulation_id
               ,sims.current_round_id
               ,round.last_start_time
               ,round.last_stop_time
               ,round.trial_run
           FROM kfs_simulation_tbl AS sims
           LEFT OUTER JOIN kfs_rounds_tbl AS round ON round.round_id = sims.current_round_id
          WHERE sims.simulation_id = ".$simulation_id;

    $current_round = null;

    if ($result = $link->query($sql)) {
        if(!$current_round = $result->fetch_object()) exit('INVALID_SIMULATION_ID');
    }
    else exit('INTERNAL_ERROR');

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
            if ($current_round->trial_run == 0) {
                set_status($link, $simulation_id, 'FIRST_TIMED_ROUND_STARTED');
            }
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

            /*
                measure the usage for billing purpose:
                when stopping the second round, that is not a trail run,
                whe count the number of all attendees (observers, players,
                facilitators) that have been active (callback) during
                the last 30 seconds
             */
            $sql = 'update kfs_simulation_tbl s
                       set s.measured_use = (select count(1)
                                               from kfs_attendees_tbl a
                                              where a.simulation_id = s.simulation_id
                                                and TIMESTAMPDIFF( SECOND, last_callback_date, CURRENT_TIMESTAMP) < 30
                                         )
                          ,s.measurement_date = CURRENT_TIMESTAMP
                     where simulation_id = '.$simulation_id.'
                       and (select count(1)
                              from kfs_rounds_tbl r
                             where r.simulation_id = s.simulation_id
                               and r.trial_run = false
                           ) > 1
                       and isnull(s.measurement_date)
                    ';
            array_push($sql_dml, $sql);

        }
        else exit ('INVALID_STATE_TO_STOP_ROUND');
    }


    /* RESET (a stopped current_round) */
    if ($action == 'reset') {
        /* there is a stopped or unstarted current round */
        if ($current_round->current_round_id != null
            && (
                ($current_round->last_start_time != null  && $current_round->last_stop_time != null)
             || ($current_round->last_start_time == null  && $current_round->last_stop_time == null)
                )
        ){
            /*
             * alternative style, but 'no round' == 'no tasks to display'
             * -- $sql = 'UPDATE kfs_simulation_tbl SET current_round_id=null WHERE simulation_id='.$simulation_id;
             * -- array_push($sql_dml, $sql);
             * so we better create a new round and add it to the simulations current_round now
             */
            $sql ="INSERT INTO kfs_rounds_tbl(simulation_id, trial_run, auto_pull) VALUES ($simulation_id, $trial_run, $auto_pull)";
            array_push($sql_dml, $sql);
            $sql ='UPDATE kfs_simulation_tbl SET current_round_id = LAST_INSERT_ID() WHERE simulation_id='.$simulation_id;
            array_push($sql_dml, $sql);
            /* create some items*/
            $sql = get_create_items_sql(null, null, null, null); /* get round id from last insert */
            array_push($sql_dml, $sql);
            /* reset workstation thumbnails to empty */
            $sql = "UPDATE kfs_workbench_tbl SET last_item_id=null, last_item_svg=null WHERE simulation_id=$simulation_id";
            array_push($sql_dml, $sql);
        }
        else exit ('INVALID_STATE_TO_RESET_ROUND');
    }

    if ($action == 'toggle_auto_pull') {
        /* there is a started current round */
        if ($current_round->current_round_id != null) {
            $sql ="UPDATE kfs_rounds_tbl SET auto_pull=not auto_pull WHERE round_id=$current_round->current_round_id";
            array_push($sql_dml, $sql);
        }
        else exit ('INVALID_STATE_TO_UPDATE_ROUND');
    }

    if ($action == 'toggle_trial_run') {
        /* there is a started current round */
        if ($current_round->current_round_id != null) {
            $sql ="UPDATE kfs_rounds_tbl SET trial_run=not trial_run WHERE round_id=$current_round->current_round_id";
            array_push($sql_dml, $sql);
        }
        else exit ('INVALID_STATE_TO_UPDATE_ROUND');
    }


    /* execute sql dml(s) from above*/
    for($i=0; $i<count($sql_dml);$i++){
        if(!$result = $link->query($sql_dml[$i])) exit('INTERNAL_ERROR');
    }

}