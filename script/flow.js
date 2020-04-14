
function getSessionKey(){
    var session_key = localStorage.getItem('SESSION_KEY');
    if (session_key === null) {
        var uid = (Date.now().toString(36) + Math.random().toString(36).substr(2, 8)).toUpperCase();
        localStorage.setItem('SESSION_KEY', uid);
        session_key=uid;
    }
   // console.log("SESSION_KEY: "+session_key);
    return session_key;
}

function getSimulationId(){
    var url = new URL(window.location.href);
    var c = url.searchParams.get('simulation_id');
   // console.log("simulation_id: "+c);
    return c;
}

function refreshAttendeesList(simulation_id, session_key){
    const url ='./get_attendees.php?simulation_id='+simulation_id+'&session_key='+session_key;
    fetch(url)
        .then((response) => {
            return response.json();
        })

        .then((myJson) => {
            myJson.forEach(obj => {
                console.log(obj.session_key);
            });
        });
}

function loadCheckIn() {
    document.getElementById('link').value = window.location.href;
    setInterval(function(){
        refreshAttendeesList(getSimulationId(),getSessionKey());
    }, 500);
}

function copyContent(content){

    var copyText = document.getElementById(content);
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

    /* Alert the copied text */
    alert("Copied the text: " + copyText.value);
}

function create_simulation() {

    setInterval(function(){
    document.getElementById("create_simulation").style.backgroundColor='red';
        setTimeout(function(){
            document.getElementById("create_simulation").style.backgroundColor='blue';
        }, 500);
    }, 1000);

    setTimeout(function(){
    const url ='./create_simulation.php';
    fetch(url)
        .then((response) => {
            return response.json();
        })

        .then((myJson) => {
            //document.getElementById("create_simulation").style.backgroundColor="red";
            location.href = './checkin.php?simulation_id='+myJson.simulation_id;
        });
    }, 1);

}