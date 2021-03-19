<?php
function get_base_obj($session_key) {

    $link = db_init();
    $status_code = 'BASE';
    $login_id = null;
    $display_warning_live_simulation = null;
    $purchasing_details_exists = 0;
    $purchase_method = null;
    $purchase_address = null;
    $billing_email_address = null;
    $single_gross_price = null;
    $simulations = array();
    $month = get_month_tl();

    $sql = $link->prepare("SELECT l.login_id
                                        ,IF(isnull(d.purchasing_detail_id), 0, 1) as purchasing_details_exists
                                        ,d.purchase_method
                                        ,d.purchase_address
                                        ,d.billing_email_address
                                        ,d.single_gross_price
                                        ,l.display_warning_live_simulation
                                   FROM kfs_login_tbl l
                                  left outer join kfs_purchasing_details_tbl d 
                                         on d.purchasing_detail_id = l.purchasing_detail_id
                                  WHERE l.session_key = ?");

    $sql->bind_param('s', $session_key);
    $sql->execute();

    if ($result = $sql->get_result()) {
        if ($obj = $result->fetch_object()) {

            $login_id = $obj->login_id;
            $purchasing_details_exists = $obj->purchasing_details_exists;
            $display_warning_live_simulation = $obj->display_warning_live_simulation;
            if ($purchasing_details_exists == 1) {
                $purchase_method = $obj->purchase_method;
                $purchase_address = $obj->purchase_address;
                $billing_email_address = $obj->billing_email_address;
                $single_gross_price = $obj->single_gross_price;
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
                                                ,s.measured_use
                                               FROM kfs_simulation_tbl s
                                              WHERE s.login_id = ?
                                              ORDER BY s.creation_date");
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
                        "status_code" => (String)get_status($link, $obj->simulation_id),
                        "measured_use" => (int)$obj->measured_use
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
                ,"purchasing_detail_exists" => (int)$purchasing_details_exists
                ,"purchase_method" => (String)$purchase_method
                ,"purchase_address" => (String)$purchase_address
                ,"billing_email_address" => (String)$billing_email_address
                ,"single_gross_price" => (int)$single_gross_price
                ,"display_warning_live_simulation" => (bool)$display_warning_live_simulation
                ,"simulations" => (array)$simulations);
}