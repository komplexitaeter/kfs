<?php
require 'config.php';
require 'helper_lib.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);

set_header('json');

if ($simulation_id == null) exit('NO_SIMULATION_ID_SET');
if (!in_array($action, array('start', 'stop' ,'reset', 'toggle_auto_pull', 'toggle_trial_run'))) exit('NO_VALID_ACTION_SET');

$link = db_init();
$link->autocommit(false);

update_current_round($link, $simulation_id, $action);

$link->commit();
$link->close();
