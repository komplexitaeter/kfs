<?php
function db_init() {
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

function translate_tl($language_code, $tl) {
    return trim(json_encode(json_decode($tl, true)[$language_code], JSON_UNESCAPED_UNICODE), '"');
}

function get_create_items_sql($round_id, $offset, $count ) {
    //$sids = array('null','null','null','123321','124421','125521','126621','127721','128821','129921','131131');
    $sids = array('null');
    $station_id = null;

    $sql = 'INSERT'.' INTO kfs_items_tbl(order_number,round_id,prio,price,current_station_id)';
    if ($round_id==null) $round_id = 'LAST_INSERT_ID()';
    if ($offset==null) $offset = 0;
    if ($count==null) $count = 10;

    for ($i=$offset;$i<$offset+$count;$i++) {
        $station_id = $sids[mt_rand(0, count($sids)-1)];
        if ($i==$offset) $sql.='VALUES'; else $sql.=',';
        $sql.="('".str_pad($i+1, 2, "0", STR_PAD_LEFT)."',".$round_id.",".($i+1).",100,".$station_id.")";
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
      ,sc.implementation_class
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
      ,w.svg_hash
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
            $sql->bind_param('issii', $simulation_id, $session_key, $resource_name, $execution_time, intval($is_stream));
            $sql->execute();
        }
    }
}