let gConsLoginUrl = "./login.html";

function loadBase() {
    checkLogonStatus(gConsLoginUrl, false, null);
}

function logoutBtnClick() {
    let url = "./login.php?session_key="+getSessionKey()+"&logout";
    fetch(url).then(r=>{
        if(r) location.href = gConsLoginUrl;
    });
}