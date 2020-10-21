<?php
require 'config.php';
require 'helper_lib.php';

$signed_on = 0;
$error_code = null;

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$link = db_init();



$link->close();


sleep(1);
echo json_encode( array("signed_on"=>$signed_on, "error_code"=>$error_code), JSON_UNESCAPED_UNICODE);
