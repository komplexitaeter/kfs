<?php
require 'config.php';
require 'helper_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$facilitate = filter_input(INPUT_GET, 'facilitate', FILTER_SANITIZE_NUMBER_INT);


/* this all is only to become facilitator ... otherwise we create attendees in checkin.php */
if ($facilitate == null || $facilitate!=1
   || $session_key == null || strlen($session_key)<10 ) exit;
else {

    set_header('json');

    $link = db_init();

    $sql = "SELECT sim.simulation_id
              ,kat.attendee_id
              ,sim.default_language_code
          FROM kfs_simulation_tbl sim
          left outer join kfs_attendees_tbl kat on sim.simulation_id = kat.simulation_id 
                                                and kat.session_key = '$session_key'
         WHERE sim.simulation_id = $simulation_id";


    if ($result = $link->query($sql)) {
        if ($obj = $result->fetch_object()) {
            if ($obj->simulation_id != null) {
                if ($obj->attendee_id != null) {
                    $sql = "UPDATE kfs_attendees_tbl SET role_code='FACILITATOR' WHERE attendee_id=$obj->attendee_id";
                } else {
                    $sql = "INSERT INTO kfs_attendees_tbl(simulation_id, session_key, avatar_code, language_code, role_code) 
                         VALUES ($simulation_id,'$session_key','1','$obj->default_language_code', 'FACILITATOR')";
                }
                $link->query($sql);
            }
        }
    }

    $link->close();
}