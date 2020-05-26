/**** streaming functions for dom update ***/

var evtSource;
var stream_url;

function loadDebriefing(){
    stream_url = './get_debriefing_stream.php?'
        + 'session_key=' + getSessionKey()
        + '&simulation_id=' + getSimulationId();
    evtSource = new EventSource(stream_url);
    evtSource.addEventListener("update", handleUpdate);
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
        evtSource.addEventListener("update", handleUpdate);
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
            location.href = './index.html';
            break;
        case "CHECKIN":
            location.href = './checkin.html?simulation_id=' + getSimulationId();
            break;
        case "DEBRIEFING":
            displayAttendees(myJson.attendees, getSessionKey());
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
                if(count%2 == 0){
                    document.getElementById("left").appendChild(myDiv);
                }
                else{
                    document.getElementById("right").appendChild(myDiv);
                }
            }
            /*identify time out attendees and mark them*/
            if(obj.timeout > 30){
                myDiv.visibility = "hidden";
                console.log(myDiv.visibility);
            }
            else{
                myDiv.visibility = "visible";
            }
        count++;
        }
    );
}

function createAttendeeDiv(attendee, session_key){
    let myDiv = document.createElement("div");
    myDiv.classList.add("attendee");
    myDiv.oncontextmenu=rightClickAttendee;
    if(attendee.session_key == session_key){
        myDiv.classList.add("current_user");
    }
    else{
        myDiv.classList.add("not_current_user");
    }
    myDiv.id = attendee.session_key;
    myDiv.innerHTML = '<div class="avatar" style="pointer-events: none;">&nbsp;</div>';
    if(attendee.avatar_code == null){attendee.avatar_code = 1;}
    myDiv.querySelector(".avatar").style.backgroundImage = "url('./src/avatar_"+attendee.avatar_code+".png')";
    myDiv.innerHTML += '<div class="attendee_name_label" style="pointer-events: none;">'+attendee.name+'</div>';
    return myDiv;
}


/**** context menus and facilitation functions *****/

function rightClickAttendee(e){
    return 0;
}