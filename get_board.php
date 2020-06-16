<?php
require 'config.php';
require 'helper_lib.php';
require 'board.php';

set_header('json');

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$add_stats = filter_input(INPUT_GET, 'add_stats', FILTER_SANITIZE_NUMBER_INT);
$execution_time = filter_input(INPUT_GET, 'execution_time', FILTER_SANITIZE_NUMBER_INT);

echo json_encode(get_board_obj($simulation_id, $session_key, $add_stats, $execution_time), JSON_UNESCAPED_UNICODE);