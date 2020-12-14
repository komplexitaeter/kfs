<?php
function initialize_status($link, $simulation_id, $simulation_type) {
    if ($simulation_type == 'KFS') {
        $sql= "INSERT INTO kfs_status_tbl (simulation_id, status_code, sequence, event_date) 
                VALUES ($simulation_id, 'NEW', 1, current_timestamp)
                     , ($simulation_id, 'FIRST_FACILITATOR_KNOWN', 2, NULL)
                     , ($simulation_id, 'FIRST_START', 3, NULL)
                     , ($simulation_id, 'FIRST_TIMED_ROUND_STARTED', 4, NULL)
                     , ($simulation_id, 'FIRST_ROUND_STATS_SELECTED', 5, NULL)                     
                     , ($simulation_id, 'CLOSED', 6, NULL)";
        $link->query($sql);
    }
}

function set_status($link, $simulation_id, $status_code) {
    $sql= "UPDATE kfs_status_tbl
            SET event_date = current_timestamp
            WHERE simulation_id = $simulation_id
            AND status_code = '$status_code'
            AND event_date is null";
    $link->query($sql);
}

function get_status($link, $simulation_id) {
    $status_code = null;
    $sql = "SELECT status_code
              FROM kfs_status_tbl
             WHERE simulation_id = $simulation_id
               AND event_date is not null
            ORDER BY sequence desc";
    if ($result = $link->query($sql)) {
        if ($obj = $result->fetch_object()) {
            $status_code = $obj->status_code;
        }
    }
    return $status_code;
}