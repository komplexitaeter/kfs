let gConsLoginUrl = "./login.html";

function loadBase() {
    checkLogonStatus(gConsLoginUrl, false);
}

function logoutBtnClick() {
    let url = "./login.php?session_key="+getSessionKey()+"&logout";
    fetch(url).then();
    location.href = gConsLoginUrl;
}