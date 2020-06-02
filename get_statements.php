<?php
require 'config.php';

$language_code = substr(filter_input(INPUT_GET, 'language_code', FILTER_SANITIZE_STRING), 0, 2);

header('Content-Type: application/json');
header("Pragma-directive: no-cache");
header("Cache-directive: no-cache");
header("Cache-control: no-cache");
header("Pragma: no-cache");
header("Expires: 0");

$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

print_r($link->get_charset());
$link->set_charset("utf8");
print_r($link->get_charset());


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
