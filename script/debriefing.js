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
            displayControls(myJson.language_code, myJson.mood_code);
            break;
        default:
    }

    if (firstload) document.body.style.visibility = 'visible';
}

/**** display functions based on delivered Json on stream udpdate ***/

function displayControls(language_code, mood_code){
    let moods = Array.from(document.getElementsByClassName("tool"));
    let language = Array.from(document.getElementsByClassName("language"));
    language.forEach( lang => {
        if(lang.id != language_code) {
            lang.classList.remove("active");
        }
        else{
            lang.classList.add("active");
        }
    });
}

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
            setAttendeeMood(myDiv, obj);
            /*identify time out attendees and mark them*/
        /* TODO probably doesn't work because body is set to visible after page load*/
            if(obj.timeout > 30){
                //myDiv.style.visibility = "hidden";
            }
            else{
                //myDiv.style.visibility = "visible";
            }
        count++;
        }
    );
}


function setAttendeeMood(attendeeDiv, attendee){
    let moodDiv = Array.from(attendeeDiv.getElementsByClassName("mood"));
    switch(attendee.mood_code){
        case "light_bulb":
            moodDiv[0].style.animation = "light_bulb 2.5s 2 ease-out";
            break;
        case "waiving_hand":
            moodDiv[0].style.animation = "waiving_hand  1.5s infinite linear";
            break;
        case "gear":
            moodDiv[0].style.animation = "gear 3.5s infinite ease-in-out";
            break;
        case "explosion":
            moodDiv[0].style.animation = "explosion 3.5s 1 linear";
            break;
        case "wondering":
            moodDiv[0].style.animation = "wondering 3.5s infinite ease-in-out";
            break;
        default:
            moodDiv[0].style.animation = "";
    }
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
    myDiv.innerHTML = '<div class="mood" style="pointer-events: none;">&nbsp;</div>';
    myDiv.innerHTML += '<div class="avatar" style="pointer-events: none;">&nbsp;</div>';
    if(attendee.avatar_code == null){attendee.avatar_code = 1;}
    myDiv.querySelector(".avatar").style.backgroundImage = "url('./src/avatar_"+attendee.avatar_code+".png')";
    myDiv.innerHTML += '<div class="attendee_name_label" style="pointer-events: none;">'+attendee.name+'</div>';
    return myDiv;
}


/**** tools, context menus and facilitation functions *****/

function rightClickAttendee(e){
    return 0;
}

function setMood(e){
    let url = "./update_attendee.php?"
        +"simulation_id="+getSimulationId()
        +"&session_key="+getSessionKey()
        +"&mood_code="+e.target.id;
    fetch(url);
}

function setLanguage(e){
    let url = "./update_attendee.php?"
        +"simulation_id="+getSimulationId()
        +"&session_key="+getSessionKey()
        +"&language_code="+e.target.id;
    fetch(url);
    console.log(url);
}