<?php
function get_create_items_sql($round_id) {
    //$sids = array('null','null','null','123321','124421','125521','126621','127721','128821','129921','131131');
    $sids = array('null');
    $station_id = null;

    $sql = 'INSERT'.' INTO kfs_items_tbl(order_number,round_id,prio,price,current_station_id)';
    if ($round_id==null) $round_id = 'LAST_INSERT_ID()';
    for ($i=0;$i<20;$i++) {
        $station_id = $sids[mt_rand(0, count($sids)-1)];
        if ($i==0) $sql.='VALUES'; else $sql.=',';
        $sql.="('".str_pad($i+1, 3, "0", STR_PAD_LEFT)."',".$round_id.",".($i+1).",100,".$station_id.")";
    }
    error_log($sql);
    return $sql;
}