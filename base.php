<?php
function get_base_obj($session_key) {

    $link = db_init();
    $status_code = 'BASE';
    $login_id = null;
    $latest_trx = null;
    $simulations = array();
    $month = get_month_tl();

    $sql = $link->prepare("SELECT l.login_id
                                   FROM kfs_login_tbl l
                                  WHERE l.session_key = ?");
    $sql->bind_param('s', $session_key);
    $sql->execute();

    if ($result = $sql->get_result()) {
        if ($obj = $result->fetch_object()) {

            $login_id = $obj->login_id;

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
                ,"purchasing_detail_exists" => (int)0
                ,"purchase_method" => (String)"INVOICE"
                ,"purchase_address" => (String)""
                ,"billing_email_address" => (String)""
                ,"single_gross_price" => (int)15
                ,"simulations" => (array)$simulations);
}