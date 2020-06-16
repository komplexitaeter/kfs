<?php
require 'config.php';
require 'helper_lib.php';

set_header('svg');

$item_id = filter_input(INPUT_GET, 'item_id', FILTER_SANITIZE_NUMBER_INT);

function exit_with_status($status_code) {
    if ($status_code!=null) error_log($status_code);
    $empty_svg='<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1 1" width="1" height="1" id="starter_svg"></svg>';
    echo($empty_svg);
    exit(0);
}

if ($item_id==null) exit_with_status('NO_ITEM_ID_SET');

$link = db_init();

$sql = "SELECT item_svg
          from kfs_items_tbl 
         WHERE item_id =".$item_id;

if ($result = $link->query($sql)) {
    if ($obj = $result->fetch_object()) {
        if ($obj->item_svg != NULL) {
            echo($obj->item_svg);
        } else {
            exit_with_status(null);
        }

    } else {
        exit_with_status(null);
    }
}

$link->close();