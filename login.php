<?php
require 'config.php';
require 'helper_lib.php';

$signed_on = 0;

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$link = db_init();



$link->close();
echo json_encode( array("signed_on"=>$signed_on), JSON_UNESCAPED_UNICODE);
