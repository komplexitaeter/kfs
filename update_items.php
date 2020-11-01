<?php
require 'config.php';
require 'helper_lib.php';

$item_id = filter_input(INPUT_GET, 'item_id', FILTER_SANITIZE_NUMBER_INT);

header('Content-Type: application/json');
header('Pragma-directive: no-cache');
header('Cache-directive: no-cache');
header('Cache-control: no-cache');
header('Pragma: no-cache');
header('Expires: 0');

if ($item_id == null) exit('UPDATE_ITEMS:NO_ITEM_ID_SET');

$link = db_init();

$sql_set = array();

if(isset($_GET['options'])){
    $options = filter_input(INPUT_GET, 'options', FILTER_SANITIZE_STRING);
    if (strlen($options)>0) {
        array_push($sql_set, "options = '".$options."'");
    }
    else {
        array_push($sql_set, "options = NULL");
    }
}

if(count($sql_set)==0){
    $link->close();
    exit(0);
}

$sql_update = '';
for($i=0; $i<count($sql_set);$i++){
    if($i>0){
        $sql_update.=", ";
    }
    $sql_update .= $sql_set[$i];
}

$sql = "UPDATE kfs_items_tbl SET ".$sql_update." WHERE item_id=".$item_id;

if(!$result = $link->query($sql))
{
    if ($link->connect_errno) {
        printf("\n Fail: %s\n", $link->connect_error);
        exit();
    }
}
$link->close();