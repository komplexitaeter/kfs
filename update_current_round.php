<?php
require 'config.php';
require 'helper_lib.php';
require 'status.php';

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);
$trial_run = filter_input(INPUT_GET, 'trial_run', FILTER_SANITIZE_NUMBER_INT);
$auto_pull = filter_input(INPUT_GET, 'auto_pull', FILTER_SANITIZE_NUMBER_INT);

if (!($trial_run!=null && $trial_run>=0 && $trial_run<=1)) $trial_run = 1;
if (!($auto_pull!=null && $auto_pull>=0 && $auto_pull<=1)) $auto_pull = 1;


set_header('json');

if ($simulation_id == null) exit('NO_SIMULATION_ID_SET');
if (!in_array($action, array('start', 'stop' ,'reset', 'toggle_auto_pull', 'toggle_trial_run'))) exit('NO_VALID_ACTION_SET');

$link = db_init();
$link->autocommit(false);

update_current_round($link, $simulation_id, $action, $trial_run, $auto_pull);

$link->commit();
$link->close();
