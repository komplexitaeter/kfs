/**** streaming functions for dom update ***/
let evtSource;
let stream_url;
let language_code = 'en';

function loadDebriefing(){
    stream_url = './get_debriefing_stream.php?'
        + 'session_key=' + getSessionKey()
        + '&simulation_id=' + getSimulationId();
    evtSource = new EventSource(stream_url);
    evtSource.addEventListener("update", handleUpdate);

    document.addEventListener("visibilitychange", onVisibilityChange);

    initializeCursor(getSimulationId(), getSessionKey());
    initializePresentation(getSimulationId(), getSessionKey());
    displayDefinitions(language_code);

    let rounds_url = "./get_rounds.php?simulation_id="+getSimulationId();
    fetch(rounds_url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            myJson.rounds.forEach(item => {
                let round = document.createElement('option');
                round.value = item.round_id;
                round.text = item.description;
                document.getElementById('left_round_switch').appendChild(round);
                document.getElementById('right_round_switch').appendChild(round.cloneNode(true));
            });
        })
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
            displayStatements(myJson.attendees);
            toggleAccessControl(myJson.role_code);
            displayPresentation(myJson.dom, myJson.role_code, myJson.wip_visibility);
            if(checkedDisplayedRound(myJson.round_id_0,"left")||checkedDisplayedRound(myJson.round_id_1,"right")){
                updateRoundStats(myJson.round_id_0, "left");
                updateRoundStats(myJson.round_id_1, "right");
            }
            if(language_code !== myJson.language_code){
                displayDefinitions(myJson.language_code);
            }
            language_code = myJson.language_code;
            break;
        default:
    }

    if (firstload) document.body.style.visibility = 'visible';
}

/**** display functions based on delivered Json on stream udpdate ***/

function checkedDisplayedRound(round_id, side){

    let currentRound = document.getElementById("round_display_"+side);
    return (currentRound.getAttribute("data-value") !== round_id);

}

function displayStatements(attendees){
        attendees.forEach( attendee => {
            if(attendee.statement_code !== null){
                let statementDiv;
                let closeDiv = document.createElement("div");
                closeDiv.id = "";
                closeDiv.classList.add("close_statement","facilitator_tool");
                closeDiv.onclick = setStatement;

                if(document.getElementById("statement_" + attendee.session_key) == null) {

                    statementDiv = document.createElement("div");
                    statementDiv.id = "statement_" + attendee.session_key;
                    statementDiv.classList.add("active_statement");
                    statementDiv.innerHTML = attendee.statement_text;
                    statementDiv.name = attendee.statement_code+"_"+language_code;
                    statementDiv.appendChild(closeDiv);
                    document.body.appendChild(statementDiv);

                }
                else{
                    statementDiv = document.getElementById("statement_" + attendee.session_key);
                    if(statementDiv.name !== attendee.statement_code+"_"+language_code){
                        statementDiv.name = attendee.statement_code+"_"+language_code;
                        statementDiv.innerHTML = attendee.statement_text;
                        statementDiv.appendChild(closeDiv);
                    }
                }
            }
            else{
                if(document.getElementById("statement_" + attendee.session_key) !== null){
                    document.getElementById("statement_" + attendee.session_key).remove();
                }
            }
        });
}

function displayControls(language_code, mood_code, role_code){
    let facilitator_tool = Array.from(document.getElementsByClassName("facilitator_tool"));
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
        facilitator_tool.forEach(tool => {
            tool.style.visibility = "visible";
        });
    }
        else{
        facilitator_tool.forEach(tool => {
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

    let toolDiv = Array.from(document.getElementById("tools").getElementsByClassName("tool"));
    if(moodDiv[0].classList.contains(attendee.mood_code) == false){
        moodDiv[0].className = "mood";
        switch(attendee.mood_code){
            case "light_bulb":
                moodDiv[0].classList.add("light_bulb");
                moodDiv[0].style.animation = "light_bulb 2.5s 2 ease-out";
                playSound("light_bulb");
                break;
            case "waiving_hand":
                moodDiv[0].classList.add("waiving_hand");
                moodDiv[0].style.animation = "waiving_hand  1.5s infinite linear";
                playSound("waiving_hand");
                break;
            case "gear":
                moodDiv[0].classList.add("gear");
                moodDiv[0].style.animation = "gear 3.5s infinite ease-in-out";
                break;
            case "explosion":
                moodDiv[0].classList.add("explosion");
                moodDiv[0].style.animation = "explosion 3.5s 1 linear";
                playSound("explosion");
                break;
            case "wondering":
                moodDiv[0].classList.add("wondering");
                moodDiv[0].style.animation = "wondering 3.5s infinite ease-in-out";
                playSound("wondering");
                break;
            default:
                moodDiv[0].style.animation = "";
        }
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

/**** tools, context menus and facilitation functions *****/

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

function setStatement(e){
    let url;
    let sessionKey;
    /*target id is empty when clicking on close active statement*/
    if(e.target.id === ""){
        sessionKey = e.target.parentElement.id.split('_')[1];
    }
    else{
        sessionKey = getSessionKey()
    }

    url = "./update_attendee.php"+
            "?simulation_id="+getSimulationId()+
            "&session_key="+sessionKey+
            "&statement_code="+e.target.id;
    if(e.target.id !== ""){closeStatementsWindow(null);}
    fetch(url).then();
}

function openStatementsWindow(){

    let overlay = document.createElement("div");
    overlay.classList.add("overlay");
    overlay.onclick = closeStatementsWindow;
    overlay.id = "overlay";
    let modalWindow = document.createElement("div");
    modalWindow.classList.add("modal_window");
    modalWindow.id = "modal_window";
    let closeWindowDiv = document.createElement("div");
    closeWindowDiv.classList.add("close_statement");
    closeWindowDiv.onclick = closeStatementsWindow;
    modalWindow.appendChild(closeWindowDiv);



    let url ='./get_statements.php?language_code='+language_code;


    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            myJson.forEach( statement => {
                let statementDiv = document.createElement("div");
                statementDiv.classList.add("statement_pick");
                statementDiv.name = "statement";
                statementDiv.id = statement.statement_code;
                statementDiv.innerText = statement.statement_text;
                statementDiv.onclick = setStatement;
                modalWindow.appendChild(statementDiv);
            });
        });
    overlay.appendChild(modalWindow);
    document.body.appendChild(overlay);
}

function closeStatementsWindow(e){
    if((e === null)||(e.target.id != "modal_window")&&(e.target.name != "statement")){
        document.getElementById("overlay").remove();
        let cursors = Array.from(document.getElementsByClassName("cursor"));
        cursors.forEach( cur => {
            cur.style.visibility = "visible";
        });
    }
}

function updateAttendeeRole(e){
    /*reminder: option.id = session_key+"_"+role; */
    let url = './update_attendee.php?'
        +"session_key="+e.target.id.split('_')[0]
        +"&role_code="+e.target.id.split('_')[1]
        +"&simulation_id="+getSimulationId();
    fetch(url);
}

function updateItemOption(e){
    /*reminder: option.id = item_id+"_"+key; */
    let url = './update_items.php?'
        +"item_id="+e.target.id.split('_')[0]
        +"&options="+e.target.id.split('_')[1];
    fetch(url);
}

function playSound(file){
    var audio = new Audio('./src/sounds/'+file+'.mp3');
    audio.volume = 0.2;
    audio.play();
}