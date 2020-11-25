<?php
function get_base_obj($session_key) {

    $link = db_init();
    $status_code = 'BASE';
    $login_id = null;
    $open_credits = 0;
    $open_purchase_trx = 0;
    $latest_trx = null;

    $sql = $link->prepare("SELECT l.login_id
                                       ,(select sum(c.original_qty - c.used_qty) 
                                           from kfs_credits_tbl c
                                         where c.buyer_login_id = l.login_id) open_credits
                                       ,(select count(1) 
                                           from kfs_credits_tbl oc
                                         where oc.buyer_login_id = l.login_id
                                           and oc.open_flag = true) open_purchase_trx
                                   FROM kfs_login_tbl l
                                  WHERE l.session_key = ?");
    $sql->bind_param('s', $session_key);
    $sql->execute();

    if ($result = $sql->get_result()) {
        if ($obj = $result->fetch_object()) {

            $login_id = $obj->login_id;
            $open_credits = $obj->open_credits;
            $open_purchase_trx = $obj->open_purchase_trx;

            if ($open_purchase_trx>0) {
                /* select the latest purchase transaction, that is still open
                 * ... and open means not payed yet
                 */
                $sql = $link->prepare("SELECT c.purchase_method
                                                    ,c.original_qty
                                               FROM kfs_credits_tbl c
                                              WHERE c.buyer_login_id = ?
                                                AND c.open_flag = true
                                              ORDER BY c.creation_date DESC");
                $sql->bind_param('i', $login_id);
                $sql->execute();

                if ($result = $sql->get_result()) {
                    $latest_trx = $result->fetch_object();
                }
            }

        } else {
            $status_code = 'LOGIN';
        }
    } else {
        $status_code = 'ERROR';
    }
    return array("status_code" => $status_code
                ,"open_credits" => $open_credits
                ,"open_purchase_trx" => $open_purchase_trx
                ,"latest_trx" => $latest_trx);
}