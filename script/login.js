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

    /* reset all hints */
    resetHints();

    /* set to waiting */
    submitBtn.classList.remove("submit_btn_active");
    submitBtn.classList.add("submit_btn_waiting");

    if (validateFormData()) {
        if (submitFormData()) {
            if (gModeCode !== "LOST_PWD" ) {
                location.href = gConsTargetURL;
            }
            else {
                document.getElementById("user").disabled = true;
                document.getElementById("submit_btn").classList.add("hidden");
                document.getElementById("ref_back_sign_on").classList.add("hidden");
                document.getElementById("hint_reset_init").classList.remove("hidden");
            }
        }
    }

    /* set back to active */
    submitBtn.classList.remove("submit_btn_waiting");
    submitBtn.classList.add("submit_btn_active");
}

function validateFormData() {
    if (!validateUser()) return false;
    if (!validatePassword()) return false;
    if (!validateNewPassword()) return false;
    return true;
}

function submitFormData() {
    /*

     var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      document.getElementById("demo").innerHTML =
      this.responseText;
    }
  };
xhttp.open("POST", "ajax_test.asp", true);
xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
xhttp.send("fname=Henry&lname=Ford");


     */
    return true;
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