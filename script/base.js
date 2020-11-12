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

function createSimulation() {

    setInterval(function(){
        document.getElementById("create_simulation").style.backgroundColor='red';
        setTimeout(function(){
            document.getElementById("create_simulation").style.backgroundColor='blue';
        }, 500);
    }, 1000);

    setTimeout(function(){
        let defaultLanguage = document.querySelector('input[name="language_code"]:checked').value;
        const url ='./create_simulation.php?session_key='+getSessionKey()
            +"&demo_mode=1"
            +'&default_language_code='+defaultLanguage;

        fetch(url)
            .then((response) => {
                return response.json();
            })

            .then((myJson) => {
                location.href = './checkin.html?simulation_id='+myJson.simulation_id
                    +"&simulation_key="+myJson.simulation_key;
            });
    }, 1);

}