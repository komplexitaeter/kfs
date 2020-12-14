<?php
function get_base_obj($session_key) {

    $link = db_init();
    $status_code = 'BASE';
    $login_id = null;
    $open_credits = 0;
    $open_purchase_trx = 0;
    $latest_trx = null;
    $simulations = array();
    $month = get_month_tl();

    $sql = $link->prepare("SELECT l.login_id
                                       ,(select sum(
                                           case
                                            when c.purchase_method = 'OFFER'
                                            and isnull(c.invoice_document_id)
                                            and open_flag = true
                                            then 0
                                            when c.purchase_method = 'CUSTOM'
                                            and open_flag = true
                                            then 0
                                            else  c.original_qty
                                        end
                                           - c.used_qty) 
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
                $sql = $link->prepare("SELECT c.credit_id
                                                    ,c.purchase_method
                                                    ,c.original_qty
                                                    ,IF(c.purchase_method = 'OFFER'
                                                        and isnull(c.invoice_document_id)
                                                        and open_flag = true, true, false) pending_offer
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

            /* query simulations */
            $sql = $link->prepare("SELECT s.simulation_id
                                                ,s.simulation_key
                                                ,date_format(s.creation_date, '%e') creation_date_day
                                                ,date_format(s.creation_date, '%c') creation_date_mon
                                                ,s.simulation_name
                                                ,'Check-In' status
                                                ,s.default_language_code
                                                ,s.demo_mode
                                               FROM kfs_simulation_tbl s
                                              WHERE s.login_id = ?
                                              ORDER BY s.creation_date ASC");
            $sql->bind_param('i', $login_id);
            $sql->execute();

            if ($result = $sql->get_result()) {
                while ($obj = $result->fetch_object()) {

                    $simulation = array(
                        "simulation_id" => (int)$obj->simulation_id,
                        "simulation_key" => (String)$obj->simulation_key,
                        "date_day" => (String)$obj->creation_date_day,
                        "date_mon" => (Array)$month[$obj->creation_date_mon],
                        "simulation_name" => (String)$obj->simulation_name,
                        "status" => (String)$obj->status,
                        "default_language_code" => (String)$obj->default_language_code,
                        "demo_mode" => (int)$obj->demo_mode,
                        "status_code" => (String)get_status($link, $obj->simulation_id)
                    );

                    array_push($simulations, $simulation);
                }
            }

        } else {
            $status_code = 'LOGIN';
        }
    } else {
        $status_code = 'ERROR';
    }
    return array("status_code" => (String)$status_code
                ,"open_credits" => (int)$open_credits
                ,"open_purchase_trx" => (int)$open_purchase_trx
                ,"latest_trx" => (array)$latest_trx
                ,"simulations" => (array)$simulations);
}