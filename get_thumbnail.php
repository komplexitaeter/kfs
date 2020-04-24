<?php
require 'config.php';

header('Content-type: image/svg+xml');
header("Pragma-directive: no-cache");
header("Cache-directive: no-cache");
header("Cache-control: no-cache");
header("Pragma: no-cache");
header("Expires: 0");

$simulation_id = filter_input(INPUT_GET, 'simulation_id', FILTER_SANITIZE_NUMBER_INT);
$station_id = filter_input(INPUT_GET, 'station_id', FILTER_SANITIZE_NUMBER_INT);

function exit_with_status($status_code) {
    if ($status_code!=null) error_log($status_code);
    $empty_svg='<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1 1" width="1" height="1" id="starter_svg"></svg>"';
    echo($empty_svg);
    exit(0);
}

if ($simulation_id==null) exit_with_status('NO_SIMULATION_ID_SET');
if ($simulation_id==null) exit_with_status('NO_STATION_ID_SET');


$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

$sql = "SELECT workbench_svg 
          FROM kfs_workbench_tbl 
         WHERE station_id =".$station_id."
           AND simulation_id =".$simulation_id;

    if ($result = $link->query($sql)) {
        $obj = $result->fetch_object();
        if ($obj->svg_code != NULL) {
            echo($obj->svg_code);
        } else {
            exit_with_status(null);
        }
    } else {
        exit_with_status(null);
    }

$link->close();