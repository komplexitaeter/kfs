<?php
require 'config.php';
require 'helper_lib.php';
require 'workbench.php';

/* GET Parameters */
$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_STRING);
$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);
$thumbnail_svg = filter_input(INPUT_POST, 'thumbnail_svg');
$svg_hash = filter_input(INPUT_GET, 'svg_hash', FILTER_SANITIZE_NUMBER_INT );

/* POST Parameters */
$item_svg = filter_input(INPUT_POST, 'item_svg');

set_header('json');

$link = db_init();
$status_code = update_workbench($link, $simulation_id, $session_key, $action, $item_svg, $svg_hash, $thumbnail_svg);
echo(json_encode(array("status_code"=>$status_code), JSON_UNESCAPED_UNICODE));