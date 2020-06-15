
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

function updateReadyStatus(session_key, ready_to_start, name){
    let e = document.getElementById(session_key);
    let current_object;

    if(e.querySelector('.ready_button_active')==null) {
        current_object = e.querySelector('.ready_button');
    }
    else {
        current_object = e.querySelector('.ready_button_active');
    }

    if(ready_to_start==1){
            current_object.className = "ready_button_active";
            current_object.disabled=false;
        }
    else{
            current_object.className = "ready_button";
            current_object.disabled=false;
        }
    if(name==null){
        current_object.className="ready_button";
        current_object.disabled=true;
    }
}

function toggleAccessControl(role){
    let accessControlDivs = Array.from(document.getElementsByClassName("access_control"));
    if(role == "FACILITATOR"){
        accessControlDivs.forEach( div => {
            if(div.classList.contains("is_facilitator") == false){
                div.classList.add("is_facilitator");
            }
        });
    }
    if(role == "OBSERVER"){
        accessControlDivs.forEach( div => {
            div.classList.remove("is_facilitator");
        });
    }
}

function refreshAttendeesList(simulation_id, session_key){

    const url ='./get_checkin_attendees.php?simulation_id='+simulation_id+'&session_key='+session_key;
    fetch(url)
        .then((response) => {
            return response.json();
        })

        .then((myJson) => {
            switch(myJson.status_code) {
                case "CHECKIN":

                    displayConfigurationsList(myJson.configuration_name, myJson.configurations);

                    var list_of_session_keys = new Array();
                    var readiness_level = 0;
                    myJson.attendees.forEach(obj => {
                            readiness_level += parseInt(obj.ready_to_start);
                            if (obj.session_key != session_key) {
                                list_of_session_keys[obj.session_key] = true;
                                if (!document.getElementById(obj.session_key)) {
                                    addAttendeeField(obj.session_key, obj.name, obj.avatar_code);
                                } else {
                                    updateAttendeeName(obj.session_key, obj.name);
                                }
                                updateReadyStatus(obj.session_key, obj.ready_to_start, obj.name);
                            } else {
                                var crt = document.getElementById("current_user").querySelector(".attendee_name");
                                var avt = document.getElementById("current_user").querySelector(".avatar");

                                if (document.activeElement != crt) {
                                    if (crt.value != obj.name) {
                                        crt.value = obj.name;
                                    }
                                }
                                if(obj.avatar_code == null){obj.avatar_code = 1;}
                                avt.style.backgroundImage = "url('./src/avatar_"+obj.avatar_code+".png')";
                                updateReadyStatus("current_user", obj.ready_to_start, obj.name);
                            }

                            /* show cursor of attendee if active */
                            displayCursor(obj.session_key, obj.cursor_x, obj.cursor_y, obj.avatar_code);

                        }
                    );
                    var inp = document.getElementById("attendees_list").children;
                    for (var i = 0; i < inp.length; i++) {
                        if (inp[i].id != 'current_user')
                            if (!list_of_session_keys[inp[i].id]) {
                                removeAttendeeField(inp[i].id);
                            }
                    }
                    toggleAccessControl(myJson.role_code);
                    if (myJson.role_code == "FACILITATOR"){
                        let facilitatorDivs = Array.from(document.getElementsByClassName("facilitator_tool"));
                        facilitatorDivs.forEach( div => {
                           div.style.visibility = "visible";
                        });
                    }

                    if (myJson.role_code == "FACILITATOR") {
                        if (readiness_level == myJson.attendees.length) {
                            document.getElementById('start_simulation_button').classList.remove('start_button_invisible');
                            document.getElementById('start_simulation_button').classList.add('start_button_ready');
                            document.getElementById('start_simulation_button').classList.remove('start_button_pending');
                        } else {
                            document.getElementById('start_simulation_button').classList.remove('start_button_invisible');
                            document.getElementById('start_simulation_button').classList.remove('start_button_ready');
                            document.getElementById('start_simulation_button').classList.add('start_button_pending');
                        }
                    }
                    else {
                        document.getElementById('start_simulation_button').classList.add('start_button_invisible');
                        document.getElementById('start_simulation_button').classList.remove('start_button_ready');
                        document.getElementById('start_simulation_button').classList.remove('start_button_pending');
                    }
                    translateElements("checkin", myJson.language_code);
                    break;
                case "NO_SIMULATION":
                   // alert("The required simulation ID does not exit. You will be taken to the home page.");
                    location.href = './index.html';
                    break;
                case "RUNNING":
                    location.href = './board.html?simulation_id='+simulation_id;
                    break;
                case "DEBRIEFING":
                    location.href = './debriefing.html?simulation_id='+simulation_id;
                    break;
                default:
                    //alert("Undefined status_code - this is an error. Sorry.");
            }
            });
}



function editNameCurrentUser(){
    var new_name=document.getElementById("current_user").querySelector(".attendee_name").value;
    var c= "";
    if(new_name==""){
        c = "&ready_to_start=0";
    }
    else {
        c = "&ready_to_start=1";
    }

    const url ='./update_attendee.php?simulation_id='+getSimulationId()+'&session_key='+getSessionKey()+'&name='+new_name+c;
    fetch(url);
    document.getElementById('flag_button').focus();
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

function addAttendeeField(session_key, name,avatar_code){
    if(avatar_code == null){avatar_code = 1;}
    var div = document.createElement("div");
        div.className="attendee";
    var name = document.createElement("input");
        name.type="text";
        name.readOnly=true;
        name.className="attendee_name";
    var avatar = document.createElement("button");
        avatar.readOnly=true;
        avatar.className="avatar";
        avatar.innerHTML="&nbsp";
        avatar.oncontextmenu=rightClickAttendeeAvatar;
        avatar.style.backgroundImage= "url('./src/avatar_"+avatar_code+".png')";
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
    if (checkBrowser()) {
        document.getElementById("vertical_container").classList.remove("display_none");
        document.getElementById("invalid_browser").classList.add("display_none");
    }
    initializeCursor(getSimulationId(), getSessionKey());
    document.getElementById('link').value = window.location.href;
    setInterval(function(){
        refreshAttendeesList(getSimulationId(),getSessionKey());
    }, 500);
}

function checkBrowser() {
    let ua = window.navigator.userAgent;
    let msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return false;
    }
    let trident = ua.indexOf('Trident/');
    if (trident > 0) {
        return false;
    }
    return true;
}

function copyContent(content){

    var copyText = document.getElementById(content);
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");
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
    const url ='./create_simulation.php?session_key='+getSessionKey()+'&default_language_code='+defaultLanguage;

    fetch(url)
        .then((response) => {
            return response.json();
        })

        .then((myJson) => {
            location.href = './checkin.html?simulation_id='+myJson.simulation_id;
        });
    }, 1);

}

function startSimulation(){
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=RUNNING';
    fetch(url);
}

function displayConfigurationsList(configuration_name, configurations){
    let list = document.getElementById("pick_configuration");
    if (list.childElementCount == 0) {
        configurations.forEach(item => {
            let option = document.createElement('option');
            option.value = item.configuration_name;
            option.id = item.configuration_name;
            option.text = item.description;
            list.appendChild(option);
        });
    }
    list.value=configuration_name;
}

function switchConfiguration(){
    let list = document.getElementById("pick_configuration");
    let url = "./update_simulation.php?"
                +"simulation_id="+getSimulationId()
                +"&configuration_name="+list.value;
    fetch(url);
}

function updateAttendeeRole(e){
    /*reminder: option.id = session_key+"_"+role; */
    let url = './update_attendee.php?'
        +"session_key="+e.target.id.split('_')[0]
        +"&role_code="+e.target.id.split('_')[1]
        +"&simulation_id="+getSimulationId();
    fetch(url);
}