/**** streaming functions for dom update ***/
let evtSource;
let stream_url;

function loadDebriefing(){
    stream_url = './get_debriefing_stream.php?'
        + 'session_key=' + getSessionKey()
        + '&simulation_id=' + getSimulationId();
    evtSource = new EventSource(stream_url);
    evtSource.addEventListener("update", handleUpdate);

    document.addEventListener("visibilitychange", onVisibilityChange);

    initializeCursor(getSimulationId(), getSessionKey());
}

function handleUpdate(event) {
    let myJson = JSON.parse(event.data);
    updateDom(myJson);
}

function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        evtSource.close();
    }
    else {
        evtSource = new EventSource(stream_url);
        evtSource.addEventListener("update", handleUpdate);
    }
}

function updateDom(myJson){
    let firstload = false;
    if (document.body.style.visibility !== 'visible') firstload = true;

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
            displayControls(myJson.language_code, myJson.mood_code, myJson.role_code);
            break;
        default:
    }

    if (firstload) document.body.style.visibility = 'visible';
}

/**** display functions based on delivered Json on stream udpdate ***/

function displayControls(language_code, mood_code, role_code){
    let faciliator_tool = Array.from(document.getElementsByClassName("faciliator_tool"));
    let language = Array.from(document.getElementsByClassName("language"));
    language.forEach( lang => {
        if(lang.id !== language_code) {
            lang.classList.remove("active");
        }
        else{
            lang.classList.add("active");
        }
    });
    if(role_code === "FACILITATOR") {
        faciliator_tool.forEach(tool => {
            tool.style.visibility = "visible";
        });
    }
        else{
        faciliator_tool.forEach(tool => {
            tool.style.visibility = "hidden";
        });
    }
}

function displayAttendees(attendees, session_key){
    let count = 0;
    attendees.forEach(obj => {
            let myDiv;
            /*check if attendee has a div, if not create it*/
            myDiv = document.getElementById(obj.session_key);
            if(myDiv ==  null){
                myDiv = createAttendeeDiv(obj, session_key);
                if(count%2 === 0){
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

            /* show cursor of attendee if active */
            displayCursor(obj.session_key, obj.cursor_x, obj.cursor_y, obj.avatar_code);

        count++;
        }
    );
}


function setAttendeeMood(attendeeDiv, attendee){
    let moodDiv = Array.from(attendeeDiv.getElementsByClassName("mood"));
    moodDiv[0].className = "";
    moodDiv[0].classList.add("mood");
    let toolDiv = Array.from(document.getElementById("tools").getElementsByClassName("tool"));
    switch(attendee.mood_code){
        case "light_bulb":
            moodDiv[0].classList.add("light_bulb");
            moodDiv[0].style.animation = "light_bulb 2.5s 2 ease-out";
            break;
        case "waiving_hand":
            moodDiv[0].classList.add("waiving_hand");
            moodDiv[0].style.animation = "waiving_hand  1.5s infinite linear";
            break;
        case "gear":
            moodDiv[0].classList.add("gear");
            moodDiv[0].style.animation = "gear 3.5s infinite ease-in-out";
            break;
        case "explosion":
            moodDiv[0].classList.add("explosion");
            moodDiv[0].style.animation = "explosion 3.5s 1 linear";
            break;
        case "wondering":
            moodDiv[0].classList.add("wondering");
            moodDiv[0].style.animation = "wondering 3.5s infinite ease-in-out";
            break;
        default:
            moodDiv[0].style.animation = "";
    }
    if(attendee.session_key === getSessionKey()) {
        toolDiv.forEach(tool => {
            if (tool.id === attendee.mood_code) {
                tool.classList.add("active_tool");
            } else {
                tool.classList.remove("active_tool");
            }
        });
    }
}


function createAttendeeDiv(attendee, session_key){
    let myDiv = document.createElement("div");
    myDiv.classList.add("attendee");
    myDiv.oncontextmenu=rightClickAttendee;
    if(attendee.session_key === session_key){
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
    fetch(url).then();
}

function setMoodAll(e){
    let mood;
    switch (e.target.id) {
        case "gear_all":
            mood = "gear";
            break;
        case "unset_mood_all":
            mood = "";
            break;
        default:
            mood = "";
            break;
    }
    let url = "./update_debriefing.php?"
        +"simulation_id="+getSimulationId()
        +"&mood_code="+mood;
    fetch(url).then();
}

function pressBackToSimulation(){
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=RERUNNING';
    fetch(url).then();
}

function setLanguage(e){
    let url = "./update_attendee.php?"
        +"simulation_id="+getSimulationId()
        +"&session_key="+getSessionKey()
        +"&language_code="+e.target.id;
    fetch(url).then();
}