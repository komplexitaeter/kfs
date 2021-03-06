<?php
function get_debriefing_obj($simulation_id, $simulation_key, $session_key, $add_stats, $execution_time, $is_stream) {
    $link = db_init();

    /* save performance stats */
    save_execution_time($link, $simulation_id, $session_key, $execution_time, 'debriefing', $is_stream);

    $status_code = null;
    $stats_round_id = array();
    $wip_toggle_0 = '0';
    $wip_toggle_1 = '0';
    $default_language_code = 'en';

    $sql = $link->prepare("SELECT if(kat.name is null, 'CHECKIN', s.status_code) as status_code 
                 ,s.stats_round_id_0
                 ,s.stats_round_id_1
                 ,substr(s.debriefing_wip_toggle,1,1) wip_toggle_0
                 ,substr(s.debriefing_wip_toggle,2,1) wip_toggle_1
                 ,s.default_language_code
              FROM kfs_simulation_tbl s
            LEFT OUTER JOIN kfs_attendees_tbl kat on kat.simulation_id = s.simulation_id
                AND kat.session_key = ?
             WHERE s.simulation_id = ?
             AND s.simulation_key = ?");

    $sql->bind_param('sis', $session_key, $simulation_id, $simulation_key);
    $sql->execute();

    if ($result = $sql->get_result()) {
        if($obj = $result->fetch_object()) {
            $status_code = $obj->status_code;
            $stats_round_id[0] = $obj->stats_round_id_0;
            $stats_round_id[1] = $obj->stats_round_id_1;
            $wip_toggle_0 = $obj->wip_toggle_0;
            $wip_toggle_1 = $obj->wip_toggle_1;
            $default_language_code = $obj->default_language_code;
        }
        else{
            $status_code = "NO_SIMULATION";
        }
    } else return null;

    /* set call_back for current attendee */
    $sql = "UPDATE kfs_attendees_tbl
               SET last_callback_date = current_timestamp
             WHERE simulation_id=$simulation_id
               AND session_key='$session_key'";
    $link->query($sql);

    /* query all simulations attendees */
    $sql = "SELECT tbl.session_key
             , tbl.name
             , tbl.avatar_code
             , tbl.role_code
             , TIMESTAMPDIFF( SECOND, tbl.last_callback_date, CURRENT_TIMESTAMP) as timeout
             , tbl.language_code
             , tbl.mood_code
             , tbl.cursor_x
             , tbl.cursor_y
             , tbl.statement_code
             , st.statement_text
          FROM kfs_attendees_tbl as tbl 
          LEFT OUTER JOIN kfs_statements_tbl as st
            ON st.language_code = (select ca.language_code 
                                    from kfs_attendees_tbl as ca
                                    where ca.session_key = '$session_key'
                                     and ca.simulation_id = $simulation_id)
           AND st.statement_code = tbl.statement_code
         WHERE tbl.name is not null
           AND tbl.simulation_id=".$simulation_id;

    $attendees = array();
    $role_code = null;
    $mood_code = null;
    $language_code = $default_language_code;

    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            if ($obj->session_key == $session_key) {
                $role_code = $obj->role_code;
                $mood_code = $obj->mood_code;
                $language_code = $obj->language_code;
            }

            $attendee = (object) array(
                "session_key" => $obj->session_key,
                "name" => $obj->name,
                "avatar_code" => $obj->avatar_code,
                "role_code" => $obj->role_code,
                "timeout" => (int)$obj->timeout,
                "mood_code" => $obj->mood_code,
                "cursor_x" => $obj->cursor_x,
                "cursor_y" => $obj->cursor_y,
                "statement_code" => $obj->statement_code,
                "statement_text" => $obj->statement_text
            );

            $attendee = add_attendee_stats($attendee, $simulation_id, $add_stats, $link);

            array_push($attendees, $attendee);
        }
    }

    /* query dom visibility */
    $sql = "SELECT dom_id
                  ,visibility
              FROM kfs_dom_tbl
             WHERE simulation_id = $simulation_id";
    $dom = array();

    if ($result = $link->query($sql)) {
        while ($obj = $result->fetch_object()) {
            $node = (object) array("dom_id"=>$obj->dom_id,
                "visibility"=> $obj->visibility);
            array_push($dom, $node);
        }
    }

    $link->close();

    return array("status_code" => $status_code
                ,"role_code" => $role_code
                ,"mood_code" => $mood_code
                ,"language_code" => $language_code
                ,"attendees" => $attendees
                ,"round_id_0" => $stats_round_id[0]
                ,"round_id_1" => $stats_round_id[1]
                ,"wip_visibility" => array((int)$wip_toggle_0, (int)$wip_toggle_1)
                ,"dom" => $dom);
}