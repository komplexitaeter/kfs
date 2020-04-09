<?php
header('Content-type: image/svg+xml');
require 'config.php';
$id = filter_input(INPUT_GET, 'id');

if ($id != NULL) {
    $link = mysqli_init();
    $success = mysqli_real_connect(
        $link,
        _MYSQL_HOST,
        _MYSQL_USER,
        _MYSQL_PWD,
        _MYSQL_DB,
        _MYSQL_PORT
    );
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
