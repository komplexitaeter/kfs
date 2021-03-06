<?php
function get_checkin_obj($simulation_id, $simulation_key, $session_key, $add_stats, $execution_time, $is_stream) {
    $link = db_init();

    /* save performance stats */
    save_execution_time($link, $simulation_id, $session_key, $execution_time, 'checkin', $is_stream);

    $configuration_name = null;
    $status_code = null;
    $demo_mode = 1;
    $default_language_code = 'en';

    $sql = $link->prepare("SELECT if(kat.name is null, 'CHECKIN', s.status_code) as status_code 
                                       ,s.configuration_name
                                     ,s.default_language_code
                                        ,s.demo_mode
                                  FROM kfs_simulation_tbl s
                                    LEFT OUTER JOIN kfs_attendees_tbl kat 
                                        on kat.simulation_id = s.simulation_id
                                        AND kat.session_key = ?
                                    WHERE s.simulation_id=?
                                    AND s.simulation_key=?");
    $sql->bind_param('sis', $session_key, $simulation_id, $simulation_key);
    $sql->execute();

    if ($result = $sql->get_result()) {
        if($obj = $result->fetch_object()) {
            $status_code = $obj->status_code;
            $demo_mode = $obj->demo_mode;
            $configuration_name = $obj->configuration_name;
            $default_language_code = $obj->default_language_code;
            if (strlen($default_language_code)!=2) {
                $default_language_code = 'en';
            }
        }
        else{
            $status_code = "NO_SIMULATION";
        }
    }
    else {
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }

    /* check if the provided sim/session combo is already in DB */
    $attendee_not_found=true;
    $attendee_id=null;

    $sql = "SELECT count(1) cnt, max(attendee_id) attendee_id FROM kfs_attendees_tbl WHERE simulation_id=".$simulation_id." AND session_key ='".$session_key."'";
    if ($result = $link->query($sql)) {
        $obj = $result->fetch_object();
        if ($obj->cnt == 1) {
            $attendee_not_found = false;
            $attendee_id = $obj->attendee_id;
        }
    }
    else {
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }


    /* insert or update current attendee in db and set callback */
    if($attendee_not_found){

        /* find a avatar, that is ... if possible ... not used */
        $avatar_code = null;
        $sql="select code from (
                select 1 as code
                union select 2
                union select 3
                union select 4
                union select 5
                union select 6
                union select 7
                union select 8
                union select 9) as ac
                where not exists(select 1
                                   from kfs_attendees_tbl a
                                  where a.simulation_id = $simulation_id
                                    and a.avatar_code = ac.code)
                order by rand()";
        if ($result = $link->query($sql)) {
            if ($obj = $result->fetch_object()) {
                $avatar_code = $obj->code;
            }
        }
        if ($avatar_code==null) {
            $avatar_code = mt_rand(1,9);
        }

        $sql="INSERT INTO kfs_attendees_tbl(simulation_id, session_key, avatar_code, language_code) 
               VALUES ($simulation_id,'$session_key','$avatar_code','$default_language_code')";
        if(!$result = $link->query($sql))
        {
            if ($link->connect_errno) {
                printf("\n Fail: %s\n", $link->connect_error);
                exit();
            }
        }
    }
    else{
        $sql="UPDATE kfs_attendees_tbl SET last_callback_date = CURRENT_TIMESTAMP WHERE attendee_id=".$attendee_id;
        if(!$result = $link->query($sql))
        {
            if ($link->connect_errno) {
                printf("\n Fail: %s\n", $link->connect_error);
                exit();
            }
        }
    }


    /* query all simulations attendees whit a callback up-to-date */
    $sql = "SELECT * FROM kfs_attendees_tbl WHERE TIMESTAMPDIFF( SECOND, last_callback_date, CURRENT_TIMESTAMP) < 30 AND simulation_id=".$simulation_id;
    $objs= array();
    $role_code = null;
    $language_code = 'en';

    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            if ($obj->session_key == $session_key) {
                $role_code = $obj->role_code;
                $language_code = $obj->language_code;
            }
            $obj = add_attendee_stats($obj, $simulation_id, $add_stats, $link);
            array_push($objs, $obj);
        }
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }

    /* query all simulations attendees whit a callback up-to-date */
    $sql = "SELECT *
         FROM kfs_configurations_tbl ORDER BY min_player_recom";
    $configurations = array();

    if ($result = $link->query($sql)) {
        while(  $obj = $result->fetch_object()) {
            $conf = (object) array(
                "configuration_name"=>$obj->configuration_name,
                "description"=>translate_tl($language_code, $obj->description_tl),
                "min_player_recom"=>$obj->min_player_recom,
                "max_player_recom"=>$obj->max_player_recom
            );
            array_push($configurations, $conf);
        }
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }

    $link->close();

    return array("status_code"=>$status_code
    , "demo_mode"=>(int)$demo_mode
    , "role_code"=>$role_code
    , "language_code" => $language_code
    , "attendees"=>$objs
    , "configuration_name"=>$configuration_name
    , "configurations"=>$configurations);
}