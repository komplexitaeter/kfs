<?php
function get_base_obj($session_key) {

    $link = db_init();
    $status_code = 'BASE';
    $open_credits = 0;

    $sql = $link->prepare("SELECT l.login_id
                                       ,(select sum(c.original_qty - c.used_qty) 
                                           from kfs_credits_tbl c
                                         where c.buyer_login_id = l.login_id) open_credits
                                   FROM kfs_login_tbl l
                                  WHERE l.session_key = ?");
    $sql->bind_param('s', $session_key);
    $sql->execute();

    if ($result = $sql->get_result()) {
        if ($obj = $result->fetch_object()) {
            $open_credits = $obj->open_credits;
        } else {
            $status_code = 'LOGIN';
        }
    } else {
        $status_code = 'ERROR';
    }
    return array("status_code" => $status_code
                ,"open_credits" => $open_credits);
}