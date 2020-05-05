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
$svg_hash = filter_input(INPUT_GET, 'svg_hash', FILTER_SANITIZE_NUMBER_INT );


function exit_with_status($status_code) {
    $empty_svg='<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1 1" width="1" height="1" id="starter_svg"></svg>';
    echo($empty_svg);
    exit(0);
}

if ($simulation_id==null) exit_with_status('NO_SIMULATION_ID_SET');
if ($station_id==null) exit_with_status('NO_STATION_ID_SET');
if ($svg_hash==null) exit_with_status('NO_SVG_HASH_SET');



$link = mysqli_init();
$success = mysqli_real_connect(
    $link,
    _MYSQL_HOST,
    _MYSQL_USER,
    _MYSQL_PWD,
    _MYSQL_DB,
    _MYSQL_PORT
);

$sql = "SELECT w.workbench_svg 
          FROM kfs_workbench_tbl w
         WHERE w.station_id =$station_id
           AND w.simulation_id = $simulation_id
           and w.svg_hash = $svg_hash
           AND (select count(1) 
                  from kfs_attendees_tbl a
                 where a.simulation_id = w.simulation_id
                   and a.station_id = w.station_id) >0 ";

    if ($result = $link->query($sql)) {
        if ($obj = $result->fetch_object()) {
            if ($obj->workbench_svg != NULL) {
                echo($obj->workbench_svg);
            } else {
                exit_with_status(null);
            }

        } else {
            exit_with_status(null);
        }
    }

$link->close();