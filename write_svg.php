<?php
require 'config.php';
$svg = filter_input(INPUT_POST, 'svg');
$id = filter_input(INPUT_POST, 'id');

if (strlen($svg) > 0) {
        $link = mysqli_init();
        $success = mysqli_real_connect(
            $link,
            _MYSQL_HOST,
            _MYSQL_USER,
            _MYSQL_PWD,
            _MYSQL_DB,
            _MYSQL_PORT
        );
        $sql = "SELECT COUNT(*) AS count FROM kfs_test_tbl WHERE id =".$link->real_escape_string($id);
    print($sql);
        if($result = $link->query($sql)){
            $obj = $result->fetch_object();
            if ($obj->count==0) {
                $sql = "INSERT INTO kfs_test_tbl(svg_code) VALUES('".$link->real_escape_string($svg)."')";
            }
            else{

                $sql = "UPDATE kfs_test_tbl SET svg_code = '".$link->real_escape_string($svg)."' WHERE id = ".$link->real_escape_string($id);
            }
        }
        else{
            if ($link->connect_errno) {
                printf("\n Fail: %s\n", $link->connect_error);
                exit();
            }
        }
print($sql);
    if ($result = $link->query($sql)) {

}
else{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}

$link->close();
}
