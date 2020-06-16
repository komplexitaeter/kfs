<?php
function initialize_streaming($resource_name) {
    set_header('event-stream');
    ob_implicit_flush(1);

    $simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
    $session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
    $add_stats = filter_input(INPUT_GET, 'add_stats', FILTER_SANITIZE_NUMBER_INT);

    $execution_time = (int)-1;
    $count = 0;

    /* force client reconnect after a couple of minutes*/
    while ($count<2500) {
        $data_obj = null;

        $t1 = microtime(true);
        $data_obj = get_data_obj($resource_name, $simulation_id, $session_key, $add_stats, $execution_time, true);

        $str  = "event: update\n";
        $str .= "data: ".json_encode($data_obj, JSON_UNESCAPED_UNICODE);
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
        $execution_time = (int)round((microtime(true) - $t1)*1000, 0);

        usleep(300000);
        $count++;
    }
}

function initialize_pulling($resource_name) {
    set_header('json');

    $simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
    $session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
    $execution_time = filter_input(INPUT_GET, 'execution_time', FILTER_SANITIZE_NUMBER_INT);
    $add_stats = filter_input(INPUT_GET, 'add_stats', FILTER_SANITIZE_NUMBER_INT);

    $data_obj = get_data_obj($resource_name, $simulation_id, $session_key, $add_stats, $execution_time, false);

    echo json_encode($data_obj, JSON_UNESCAPED_UNICODE);
}

function get_data_obj($resource_name, $simulation_id, $session_key, $add_stats, $execution_time, $is_stream) {
    $data_obj = null;
    switch($resource_name) {
        case 'checkin':
            $data_obj = get_checkin_obj($simulation_id, $session_key, $add_stats, $execution_time, $is_stream);
            break;
        case 'board':
            $data_obj = get_board_obj($simulation_id, $session_key, $add_stats, $execution_time, $is_stream);
            break;
        case 'debriefing':
            $data_obj = get_debriefing_obj($simulation_id, $session_key, $add_stats, $execution_time, $is_stream);
            break;
    }
    return $data_obj;
}