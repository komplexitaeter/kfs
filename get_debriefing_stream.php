<?php
require 'config.php';
require 'helper_lib.php';
require 'debriefing.php';

ob_implicit_flush(1);
set_header('event_stream');

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$count = 0;

/* force client reconnect after a couple of minutes*/
while ($count<2500) {

    $str  = "event: update\n";
    $str .= "data: ".json_encode(getDebriefingObj($simulation_id, $session_key), JSON_UNESCAPED_UNICODE);
    $str .= "\n\n";

    $trash = '';
    if (strlen($str)<4096-21) {
        for ($i = 1; $i < 4096-strlen($str)-21; $i++) {
            $trash .= "X";
        }
        $str .= "event: trash\n";
        $str .= "data: " . json_encode($trash);
        $str .= "\n\n";
    }

    echo $str;

    if(ob_get_length() > 0) ob_end_flush();
    flush();
    usleep(300000);

    $count++;

}