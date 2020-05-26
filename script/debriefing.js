/**** streaming functions for dom update ***/

function loadDebriefing(){
    const stream_url = './get_debriefing_stream.php?'
        + 'session_key=' + getSessionKey()
        + '&simulation_id=' + getSimulationId();
    let evtSource = new EventSource(stream_url);
    evtSource.addEventListener("update", handleUpate);
    document.addEventListener("visibilitychange", onVisibilityChange);
}

function handleUpdate(event) {
    let myJson = JSON.parse(event.data);
    updateDom(myJson);
}

function onVisibilityChange() {
    if (document.visibilityState == 'hidden') {
        evtSource.close();
    }
    else {
        evtSource = new EventSource(stream_url);
        evtSource.addEventListener("update", handleNewData);
    }
}

function updateDom(myJson){
    let firstload = false;
    if (document.body.style.visibility != 'visible') firstload = true;

    switch(myJson.status_code) {
        case "RUNNING":
            location.href = './board.html?simulation_id=' + getSimulationId();
            break;
        case "NO_SIMULATION":
            // alert("The required simulation ID does not exit. You will be taken to the home page.");
            location.href = '../index.html';
            break;
        case "CHECKIN":
            location.href = './checkin.html?simulation_id=' + getSimulationId();
            break;
        case "DEBRIEFING":
            displayAttendees(myJson.attendees, session_key);
            break;
        default:
    }

    if (firstload) document.body.style.visibility = 'visible';
}

/**** display functions based on delivered Json on stream udpdate ***/

function displayAttendees(attendees, session_key){
    let count = 0;
    attendees.forEach(obj => {
            let myDiv;
            /*check if attendee has a div, if not create it*/
            myDiv = document.getElementById(obj.session_key);
            if(myDiv ==  null){
                myDiv = createAttendeeDiv(obj, session_key);
            }
            /*identify time out attendees and mark them*/
            if(obj.timeout > 30){
                myDiv.visibility = "hidden";
            }
            else{
                myDiv.visibility = "visible";
            }
            if(count%2 == 0){
                document.getElementById("left").appendChild(myDiv);
            }
            else{
                document.getElementById("right").appendChild(myDiv);
            }
        count++;
        }
    );
}

function createAttendeeDiv(attendee, session_key){
    let myDiv = document.createElement("div");
    myDiv.classList.add("attendee");
    myDiv.oncontextmenu=rightClickAttendee;
    if(obj.session_key == session_key){
        myDiv.classList.add("current_user");
    }
    else{
        myDiv.classList.add("not_current_user");
    }
    myDiv.id = obj.session_key;
    myDiv.innerHTML = '<div class="avatar" style="pointer-events: none;">&nbsp;</div>';
    if(obj.avatar_code == null){obj.avatar_code = 1;}
    myDiv.querySelector(".avatar").style.backgroundImage = "url('./src/avatar_"+obj.avatar_code+".png')";
    myDiv.innerHTML += '<div class="attendee_name_label" style="pointer-events: none;">'+obj.name+'</div>';
    return myDiv;
}


/**** context menus and facilitation functions *****/

function rightClickAttendee(e){
    return 0;
}