const gConsTargetURL = "./target.html"
let gLanguageCode = "de";
let gModeCode = "SIGN_ON";

function loadLogin() {
    /* check if already logged on */
    checkLogonStatus();

    let languageCode = getURLParam("language");
    if (   languageCode === "en"
        || languageCode === "de") {
        gLanguageCode = languageCode;
    }
    setLanguage();

    let modeCode = getURLParam("mode");
    if (   modeCode === "SIGN_ON"
        || modeCode === "REGISTER"
        || modeCode === "LOST_PWD"
        || modeCode === "RESET_PWD") {
        gModeCode = modeCode;
    }
    setMode();
}

function checkLogonStatus() {
    const url = "./login.php?session_key="+getSessionKey();
    fetch(url)
        .then(response => response.json())
        .then(myJson => {
            // noinspection JSUnresolvedVariable
            if (myJson.signed_on === 1) {
                /* logon for session_key found, so switch to target */
                location.href = gConsTargetURL;
            }
        } );
}

function getURLParam(parmeterName){
    let url = new URL(window.location.href);
    return url.searchParams.get(parmeterName);
}

function setLanguage() {
    translateElements("login", gLanguageCode);
}

function toggleLanguage() {
    if (gLanguageCode === "de") {
        gLanguageCode = "en";
    }
    else {
        gLanguageCode = "de";
    }
    setLanguage();
}

function setMode() {
    if (gModeCode === "SIGN_ON") {
        document.getElementById("msg_login").classList.remove("hidden");
        document.getElementById("msg_register").classList.add("hidden");
        document.getElementById("msg_request_reset").classList.add("hidden");
        document.getElementById("msg_reset").classList.add("hidden");
        document.getElementById("user").classList.remove("hidden");
        document.getElementById("password").classList.remove("hidden");
        document.getElementById("new_password").classList.add("hidden");
        document.getElementById("confirm_password").classList.add("hidden");
        document.getElementById("ref_login").classList.remove("hidden");
        document.getElementById("ref_back_sign_on").classList.add("hidden");
        document.getElementById("user").focus();
    }

    if (gModeCode === "REGISTER") {
        document.getElementById("msg_login").classList.add("hidden");
        document.getElementById("msg_register").classList.remove("hidden");
        document.getElementById("msg_request_reset").classList.add("hidden");
        document.getElementById("msg_reset").classList.add("hidden");
        document.getElementById("user").classList.remove("hidden");
        document.getElementById("password").classList.add("hidden");
        document.getElementById("new_password").classList.remove("hidden");
        document.getElementById("confirm_password").classList.remove("hidden");
        document.getElementById("ref_login").classList.add("hidden");
        document.getElementById("ref_back_sign_on").classList.remove("hidden");
        document.getElementById("user").focus();
    }

    if (gModeCode === "LOST_PWD") {
        document.getElementById("msg_login").classList.add("hidden");
        document.getElementById("msg_register").classList.add("hidden");
        document.getElementById("msg_request_reset").classList.remove("hidden");
        document.getElementById("msg_reset").classList.add("hidden");
        document.getElementById("user").classList.remove("hidden");
        document.getElementById("password").classList.add("hidden");
        document.getElementById("new_password").classList.add("hidden");
        document.getElementById("confirm_password").classList.add("hidden");
        document.getElementById("ref_login").classList.add("hidden");
        document.getElementById("ref_back_sign_on").classList.remove("hidden");
        document.getElementById("user").focus();
    }

    if (gModeCode === "RESET_PWD") {
        document.getElementById("msg_login").classList.add("hidden");
        document.getElementById("msg_register").classList.add("hidden");
        document.getElementById("msg_request_reset").classList.add("hidden");
        document.getElementById("msg_reset").classList.remove("hidden");
        document.getElementById("user").classList.add("hidden");
        document.getElementById("password").classList.add("hidden");
        document.getElementById("new_password").classList.remove("hidden");
        document.getElementById("confirm_password").classList.remove("hidden");
        document.getElementById("ref_login").classList.add("hidden");
        document.getElementById("ref_back_sign_on").classList.add("hidden");
        document.getElementById("new_password").focus();
    }
}

function changeMode(modeCode) {
    gModeCode = modeCode;
    resetHints();
    setMode();
}

function sendClicked() {
    let submitBtn = document.getElementById("submit_btn");
    let resetSubmitBtn = true;

    /* reset all hints */
    resetHints();

    /* set to waiting */
    submitBtn.classList.remove("submit_btn_active");
    submitBtn.classList.add("submit_btn_waiting");

    if (validateFormData()) {
        /* asynchronous handling of http request has to care about */
        resetSubmitBtn = false;
        submitFormData();
    }

    /* set back to active */
    if (resetSubmitBtn) {
        submitBtn.classList.remove("submit_btn_waiting");
        submitBtn.classList.add("submit_btn_active");
    }
}

function validateFormData() {
    if (!validateUser()) return false;
    if (!validatePassword()) return false;
    return validateNewPassword();
}

function submitFormData() {
    const url = "./login.php?session_key="+getSessionKey();
    let httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function() {handleHttpResponse(this.readyState, this.status, this.responseText)};
    httpRequest.open("POST", url, true);
    httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    httpRequest.send(
        "mode="+gModeCode
        +"&user="+document.getElementById("user").value
        +"&password="+ document.getElementById("password").value
        +"&new_password="+ document.getElementById("new_password").value
        +"&confirm_password="+ document.getElementById("confirm_password").value
    );
}

function handleHttpResponse(readyState, status, responseText) {
    if (readyState === 4) {
        if (status === 200) {
            try {
                let responseJSON = JSON.parse(responseText);

                if (responseJSON.signed_on === 1) {
                    location.href = gConsTargetURL;
                } else if (!responseJSON.hasOwnProperty("error_code")
                        || responseJSON.error_code === null
                        || responseJSON.error_code.length === 0) {
                    handleHttpError("hint_http_error", "Exception: responseJSON.error_code missing");
                } else if (responseJSON.error_code === "reset_init") {
                    document.getElementById("user").disabled = true;
                    document.getElementById("submit_btn").classList.add("hidden");
                    document.getElementById("ref_back_sign_on").classList.add("hidden");
                    document.getElementById("hint_reset_init").classList.remove("hidden");
                } else {
                    handleHttpError(responseJSON.error_code, null)
                }
            }
            catch (e) {
                handleHttpError("hint_http_error", e);
            }
        } else {
            handleHttpError("hint_http_error", "HTTP Error Status="+status);
        }
    }
}

function handleHttpError(hint, error) {
    if (error !== null) {
        console.log('handleHttpError: ' + error);
    }

    /* reset the button to active */
    let submitBtn = document.getElementById("submit_btn");
    submitBtn.classList.remove("submit_btn_waiting");
    submitBtn.classList.add("submit_btn_active");

    /* show an error hint*/
    document.getElementById(hint).classList.remove("hidden");
}

function resetHints() {
    let hints = document.getElementsByClassName("hint");
    for (let i = 0; i < hints.length; i++) {
        hints.item(i).classList.add("hidden");
    }
}

function validateUser() {
    const mailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let userElement = document.getElementById("user")
    let userStr = userElement.value;

    /* in RESET_PWD mode we do not display user field */
    if (gModeCode !== "RESET_PWD") {

        /* check if user field is empty */
        if (userStr === null || userStr.length === 0) {
            document.getElementById("hint_user_empty").classList.remove("hidden");
            userElement.focus();
            return false;
        }

        /* check for valid mail format */
        if (!mailFormat.test(userStr)) {
            document.getElementById("hint_user_invalid_mail").classList.remove("hidden");
            userElement.focus();
            return false;
        }

    }
    return true;
}

function validatePassword() {
    let passwordElement = document.getElementById("password")
    let passwordStr = passwordElement.value;

    /* password field is only displayed in SIGN_ON mode */
    if (gModeCode === "SIGN_ON") {
        /* check if password field is empty */
        if (passwordStr === null || passwordStr.length === 0) {
            document.getElementById("hint_password_empty").classList.remove("hidden");
            passwordElement.focus();
            return false;
        }
    }
    return true;
}

function validateNewPassword() {
    let passwordElement = document.getElementById("new_password")
    let passwordStr = passwordElement.value;

    let confirmPasswordElement = document.getElementById("confirm_password")
    let confirmPasswordStr = confirmPasswordElement.value;

    /* new password fields  only displayed in REGISTER or RESET_PWD mode */
    if (gModeCode === "REGISTER" || gModeCode === "RESET_PWD") {
        /* check if password field is empty */
        if (passwordStr === null || passwordStr.length === 0) {
            document.getElementById("hint_password_empty").classList.remove("hidden");
            passwordElement.focus();
            return false;
        }
        /* check if password is long enough */
        if (passwordStr.length < 8) {
            document.getElementById("hint_password_policy").classList.remove("hidden");
            passwordElement.focus();
            return false;
        }

        if (confirmPasswordStr === null || confirmPasswordStr.length === 0) {
            document.getElementById("hint_confirm_password_empty").classList.remove("hidden");
            confirmPasswordElement.focus();
            return false;
        }

        if (confirmPasswordStr !== passwordStr) {
            document.getElementById("hint_confirm_password_mismatch").classList.remove("hidden");
            confirmPasswordElement.focus();
            return false;
        }

    }
    return true;
}