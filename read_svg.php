<?php
require 'config.php';
require 'sql_lib.php';

header('Content-type: image/svg+xml');
header("Pragma-directive: no-cache");
header("Cache-directive: no-cache");
header("Cache-control: no-cache");
header("Pragma: no-cache");
header("Expires: 0");

$id = filter_input(INPUT_GET, 'id');

if ($id != NULL) {
    $$link = db_init();

    $sql = "SELECT svg_code FROM kfs_test_tbl WHERE id =".$link->real_escape_string($id);

    if($result = $link->query($sql)){
        $obj = $result->fetch_object();
        if ($obj->svg_code!=NULL) {
            print($obj->svg_code);
        }
        else{
            print("SVG_code not provided");
        }
    }
    else{
        if ($link->connect_errno) {
            printf("\n Fail: %s\n", $link->connect_error);
            exit();
        }
    }
    $link->close();
}
