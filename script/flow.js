
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
    return c;
}

function switchCurrentUserReadyStatus(){
    const url ='./update_attendee.php?simulation_id='+getSimulationId()+'&session_key='+getSessionKey()+'&switch_status=1';
    fetch(url);
}

function updateReadyStatus(session_key, ready_to_start){
    var e = document.getElementById(session_key);
    if(ready_to_start==1){
        if(e.querySelector('.ready_button_active')==null){
            e.querySelector('.ready_button').className="ready_button_active";
        }
    }
    else{
        if(e.querySelector('.ready_button')==null){
            e.querySelector('.ready_button_active').className="ready_button";
        }
    }
}

function refreshAttendeesList(simulation_id, session_key){

    const url ='./get_attendees.php?simulation_id='+simulation_id+'&session_key='+session_key;
    fetch(url)
        .then((response) => {
            return response.json();
        })

        .then((myJson) => {
            var list_of_session_keys = new Array();
            var readiness_level = 0;
            myJson.forEach(obj => {
                readiness_level+=parseInt(obj.ready_to_start);
                if(obj.session_key!=session_key) {
                    list_of_session_keys[obj.session_key] = true;
                    if (!document.getElementById(obj.session_key)) {
                        addAttendeeField(obj.session_key, obj.name);
                    } else {
                        updateAttendeeName(obj.session_key, obj.name);
                    }
                    updateReadyStatus(obj.session_key, obj.ready_to_start);
                }
                else{
                    var crt = document.getElementById("current_user").querySelector(".attendee_name");

                    if(document.activeElement != crt){
                        if(crt.value!=obj.name) {
                            crt.value = obj.name;
                        }
                    }
                    updateReadyStatus("current_user", obj.ready_to_start);
                }
            }
            );
            var inp = document.getElementById("attendees_list").children;
            for (var i = 0; i < inp.length ; i++) {
                if(inp[i].id!='current_user')
                    if (!list_of_session_keys[inp[i].id]) {
                        removeAttendeeField(inp[i].id);
                    }
            }
            if(readiness_level==myJson.length){
                document.getElementById('start_simulation_button').disabled=false;
            }
            else{
                document.getElementById('start_simulation_button').disabled=true;
            }
            console.log(myJson.length);
        });
}

function editNameCurrentUser(){
    var new_name=document.getElementById("current_user").querySelector(".attendee_name").value;
    const url ='./update_attendee.php?simulation_id='+getSimulationId()+'&session_key='+getSessionKey()+'&name='+new_name;
    fetch(url);

}

function updateAttendeeName(session_key, name){
    var e = document.getElementById(session_key).querySelector(".attendee_name");
    if(name==null){
        name = "unknown attendee";
    }
    if(e.value != name) {
        e.value = name;
    }
}

function removeAttendeeField(session_key){
    document.getElementById(session_key).remove();
}

function addAttendeeField(session_key, name){
    var div = document.createElement("div");
        div.className="attendee";
    var name = document.createElement("input");
        name.type="text";
        name.readOnly=true;
        name.className="attendee_name";
    var avatar = document.createElement("button");
        avatar.readOnly=true;
        avatar.className="avatar";
        avatar.disabled=true;
        avatar.innerHTML="&nbsp";
    var ready = document.createElement("button");
        ready.readOnly=true;
        ready.className="ready_button";
        ready.disabled=true;
        ready.innerHTML="&nbsp";
    div.appendChild(avatar);
    div.appendChild(name);
    div.appendChild(ready);
    if(name==null){
        name.value = name;
    }
    div.id=session_key;

    document.getElementById("attendees_list").appendChild(div);
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
            location.href = './checkin.php?simulation_id='+myJson.simulation_id;
        });
    }, 1);

}