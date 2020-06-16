<?php
require 'config.php';
require 'helper_lib.php';

$language_code = substr(filter_input(INPUT_GET, 'language_code', FILTER_SANITIZE_STRING), 0, 2);

header('Content-Type: application/json');
header("Pragma-directive: no-cache");
header("Cache-directive: no-cache");
header("Cache-control: no-cache");
header("Pragma: no-cache");
header("Expires: 0");

$link = db_init();

$statements = array();
$sql = "SELECT statement_code
              ,statement_text
          FROM kfs_statements_tbl
         WHERE lower(language_code) = lower('$language_code')
           AND type_code = 'DEFAULT'
         ORDER BY sort_order";

if ($result = $link->query($sql)) {
    while(  $statement = $result->fetch_object()) {
        array_push($statements, $statement);
    }
}

echo json_encode($statements);
$link->close();
