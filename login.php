<?php
require 'config.php';
require 'helper_lib.php';

$signed_on = 0;
$error_code = null;

$session_key = filter_input(INPUT_GET, 'session_key', FILTER_SANITIZE_STRING);

$mode = filter_input(INPUT_POST, 'mode', FILTER_SANITIZE_STRING);
$user = filter_input(INPUT_POST, 'user', FILTER_SANITIZE_STRING);
$password = filter_input(INPUT_POST, 'password', FILTER_SANITIZE_STRING);
$new_password = filter_input(INPUT_POST, 'new_password', FILTER_SANITIZE_STRING);
$token = filter_input(INPUT_POST, 'token', FILTER_SANITIZE_STRING);
$language_code = filter_input(INPUT_POST, 'language_code', FILTER_SANITIZE_STRING);


$link = db_init();

if (isset($_GET['logout'])) {
    logout($link, $session_key);
} else {

    /* check, if already signed on */
    $login_cnt = get_login_cnt($link, $session_key, "session_key");

    if ($login_cnt > 0) {
        $signed_on = 1;
    } else {
        if ($mode == "REGISTER") {
            if (!isset($user) || strlen($user) == 0) {
                $error_code = "hint_user_empty";
            } else if (!isset($new_password) || strlen($new_password) == 0) {
                $error_code = "hint_password_empty";
            } else {
                $login_cnt = get_login_cnt($link, $user, "email_address");
                if ($login_cnt > 0) {
                    $error_code = "hint_user_exists";
                } else {
                    create_login($link, $user, password_hash(prepare_pwd($new_password), PASSWORD_BCRYPT), $session_key);
                    if (get_login_cnt($link, $session_key, "session_key") > 0) {
                        $signed_on = 1;
                    }
                }
            }
        }

        if ($mode == "SIGN_ON") {
            $password_hash = get_credentials_hash($link, $user);
            if (password_verify(prepare_pwd($password), $password_hash)) {
                logout($link, $session_key);
                login($link, $user, $session_key);
                $signed_on = 1;
            }
            else {
                $error_code = 'hint_invalid_logon';
            }
        }

        if ($mode == "LOST_PWD") {
            /* only send mail, if we know the user (but do not tell) */
            if (get_login_cnt($link, $user, "email_address") > 0) {
                $token = get_set_token($link, $user);

                send_pwd_reset_mail($user, $token, $language_code);
            }
            $error_code = 'reset_init';
        }

        if ($mode == "RESET_PWD") {
            if (get_login_cnt($link, $token, "token") == 0) {
                $error_code = 'hint_invalid_token';
            } else if (!isset($new_password) || strlen($new_password) == 0) {
                $error_code = "hint_password_empty";
            } else {
                reset_password($link, $token, password_hash(prepare_pwd($new_password), PASSWORD_BCRYPT), $session_key);
                if (get_login_cnt($link, $session_key, "session_key") > 0) {
                    $signed_on = 1;
                }
            }
        }
    }
}

echo json_encode( array("signed_on"=>$signed_on, "error_code"=>$error_code), JSON_UNESCAPED_UNICODE);


/*
 *  FUNCTION DECLARATIONS:
*/

function get_login_cnt($link, $key, $mode) {
    if ($mode == "session_key") {
        $sql = $link->prepare("SELECT count(1) as cnt FROM kfs_login_tbl WHERE session_key = ?");
    } else if ($mode == "token") {
        $sql = $link->prepare("SELECT count(1) as cnt FROM kfs_login_tbl WHERE token = ?");
    } else {
        $sql = $link->prepare("SELECT count(1) as cnt FROM kfs_login_tbl WHERE email_address = ?");
    }
    $sql->bind_param('s', $key);
    $sql->execute();
    $result = $sql->get_result();
    return $result->fetch_object()->cnt;
}

function create_login($link, $email_address, $credentials_hash, $session_key) {
    /* to be safe, logout */
    logout($link, $session_key);

    $sql = $link->prepare("INSERT INTO kfs_login_tbl(email_address, credentials_hash, session_key) 
                                VALUE (?,?,?)");
    $sql->bind_param('sss', $email_address, $credentials_hash, $session_key);
    $sql->execute();
}

function logout($link, $session_key) {
    $sql = $link->prepare("UPDATE kfs_login_tbl SET session_key=null WHERE session_key=?");
    $sql->bind_param('s', $session_key);
    $sql->execute();
}

function login($link, $email_address, $session_key) {
    $sql = $link->prepare("UPDATE kfs_login_tbl SET session_key=?, token=null WHERE email_address=?");
    $sql->bind_param('ss', $session_key, $email_address);
    $sql->execute();
}

function prepare_pwd($password) {
    return hash_hmac("sha256", $password, _PEPPER);
}

function get_credentials_hash($link, $email_address) {
    $sql = $link->prepare("SELECT credentials_hash FROM kfs_login_tbl WHERE email_address = ?");
    $sql->bind_param('s', $email_address);
    $sql->execute();
    $result = $sql->get_result();
    if ($obj = $result->fetch_object()) {
        return $obj->credentials_hash;
    } else {
        return 'NOT_FOUND';
    }
}

function get_set_token($link, $email_address) {
    /* generate random token */
    $token = openssl_random_pseudo_bytes(16);
    $token = bin2hex($token);

    /* remember token */
    $sql = $link->prepare("UPDATE kfs_login_tbl SET token=? WHERE email_address=?");
    $sql->bind_param('ss', $token, $email_address);
    $sql->execute();

    return $token;
}

function send_pwd_reset_mail($email_address, $token, $language_code) {
    $subject = get_translation("login_php", "pwd_reset_mail_subject", $language_code);

    error_log($subject);

    $link = _PWD_RESET_URL.$token;
    $msg = get_translation("login_php", "pwd_reset_mail_text", $language_code).' '.$link;
    error_log($msg);

    $header = array(
        'From' => _MAIL_REPLY_TO,
        'Reply-To' => _MAIL_REPLY_TO,
        'X-Mailer' => 'PHP/' . phpversion()
    );

    mail($email_address, $subject, $msg, $header);
}

function reset_password($link, $token, $credentials_hash, $session_key) {
    /* to be safe, logout */
    logout($link, $session_key);

    $sql = $link->prepare("UPDATE kfs_login_tbl 
                            SET token=null, credentials_hash=?, session_key=?
                            WHERE token=?");
    $sql->bind_param('sss', $credentials_hash, $session_key, $token);
    $sql->execute();
}