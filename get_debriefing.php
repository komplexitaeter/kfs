<?php
require 'config.php';
require 'helper_lib.php';
require 'debriefing.php';

set_header('json');

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$count = 0;

echo json_encode(getDebriefingObj($simulation_id, $session_key), JSON_UNESCAPED_UNICODE);

