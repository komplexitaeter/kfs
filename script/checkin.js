let firstLoad = true;

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

    if(ready_to_start==1 && name!=null){
        addStyleClass(current_object, "ready_button_active");
        removeStyleClass(current_object, "ready_button");
    }
    else {
        addStyleClass(current_object, "ready_button");
        removeStyleClass(current_object, "ready_button_active");
    }

    if(name==null) {
        disableElement(current_object);
    } else {
        enableElement(current_object);
    }
}

function updateDom(myJson){
    let simulation_id = getSimulationId();
    let simulation_key = getSimulationKey();
    let session_key = getSessionKey();

    switch(myJson.status_code) {
        case "CHECKIN":

            displayConfigurationsList(myJson.configuration_name, myJson.configurations, myJson.demo_mode);

            var list_of_session_keys = new Array();
            var readiness_level = 0;
            myJson.attendees.forEach(attendee => {
                    readiness_level += parseInt(attendee.ready_to_start);
                    if (attendee.session_key != session_key) {
                        list_of_session_keys[attendee.session_key] = true;
                        if (!document.getElementById(attendee.session_key)) {
                            addAttendeeField(attendee.session_key, attendee.name, attendee.avatar_code);
                        } else {
                            updateAttendeeName(attendee.session_key, attendee.name);
                        }
                        updateReadyStatus(attendee.session_key, attendee.ready_to_start, attendee.name);
                    } else {
                        var crt = document.getElementById("current_user").querySelector(".attendee_name");
                        var avt = document.getElementById("current_user").querySelector(".avatar");

                        if (document.activeElement != crt) {
                            if (crt.value != attendee.name) {
                                crt.value = attendee.name;
                            }
                        }
                        if(attendee.avatar_code == null){attendee.avatar_code = 1;}
                        avt.style.backgroundImage = "url('./src/avatar_"+attendee.avatar_code+".png')";
                        updateReadyStatus("current_user", attendee.ready_to_start, attendee.name);
                    }

                    /* show cursor of attendee if active */
                    displayCursor(attendee.session_key, attendee.cursor_x, attendee.cursor_y, attendee.avatar_code);

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


            let btn = document.getElementById('start_simulation_button');

            if (myJson.role_code == "FACILITATOR") {
                if (readiness_level == myJson.attendees.length) {
                    removeStyleClass(btn, 'start_button_invisible');
                    addStyleClass(btn, 'start_button_ready');
                    removeStyleClass(btn, 'start_button_pending');
                } else {
                    removeStyleClass(btn, 'start_button_invisible');
                    removeStyleClass(btn, 'start_button_ready');
                    addStyleClass(btn, 'start_button_pending');
                }
            }
            else {
                addStyleClass(btn, 'start_button_invisible');
                removeStyleClass(btn, 'start_button_ready');
                removeStyleClass(btn, 'start_button_pending');
            }

            if (document.body.getAttribute("data-value") !== myJson.language_code) {
                translateElements("checkin", myJson.language_code);
                document.body.setAttribute("data-value", myJson.language_code);
            }
            break;
        case "NO_SIMULATION":
           // alert("The required simulation ID does not exit. You will be taken to the home page.");
            location.href = './index.html';
            break;
        case "RUNNING":
            location.href = './board.html?simulation_id='+simulation_id
                                        +'&simulation_key='+simulation_key;
            break;
        case "DEBRIEFING":
            location.href = './debriefing.html?simulation_id='+simulation_id
                                        +'&simulation_key='+simulation_key;
            break;
        default:
            //alert("Undefined status_code - this is an error. Sorry.");
    }

    if (firstLoad) {
        firstLoad = false;
        document.getElementById('current_attendee_name').focus();
    }

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
        removeStyleClass(document.getElementById("vertical_container"), "display_none");
        addStyleClass(document.getElementById("invalid_browser"), "display_none")
    }
    
    let facilitate = getFacilitate();
    if (facilitate && facilitate === '1') {
        let url = './create_attendee.php?'
            +"session_key="+getSessionKey()
            +"&simulation_id="+getSimulationId()
            +"&facilitate=1";
        fetch(url).then(r => {
            if (r) location.href = './checkin.html?simulation_id='+getSimulationId()
                                                +"&simulation_key="+getSimulationKey();
        });
    }
    else {

        let baseUrl = 'get_checkin';
        let params = {
            "simulation_id": getSimulationId(),
            "simulation_key": getSimulationKey(),
            "session_key": getSessionKey()
        }
        initializeConnection(baseUrl, params, updateDom);

        initializeCursor(getSimulationId(), getSessionKey());
        document.getElementById('link').value = window.location.href;

    }
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

function startSimulation(){
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=RUNNING';
    fetch(url);
}

function displayConfigurationsList(configuration_name, configurations, demo_mode){
    let list = document.getElementById("pick_configuration");
    let demoHint;

    if (demo_mode===0) {
        enableElement(list);
        demoHint = '';
    } else {
        disableElement(list);
        demoHint = ' (Demo)';
    }

    if (list.childElementCount == 0) {
        configurations.forEach(item => {
            let option = document.createElement('option');
            option.value = item.configuration_name;
            option.id = item.configuration_name;
            option.text = item.description + demoHint;
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
    fetch(url).then();
}