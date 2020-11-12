let language_code = 'en';
let audioFiles;

function loadDebriefing() {

    let baseUrl = 'get_debriefing';
    let params = {
        "simulation_id" : getSimulationId(),
        "simulation_key": getSimulationKey(),
        "session_key" : getSessionKey()
    }
    initializeConnection(baseUrl, params, updateDom);

    initializeCursor(getSimulationId(), getSessionKey());
    initializePresentation(getSimulationId(), getSessionKey());
    displayDefinitions(language_code);
    translateElements("debriefing", language_code);

    document.addEventListener('click', initSounds);

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


function updateDom(myJson){
    let firstLoad = false;
    if (document.body.style.visibility !== 'visible') firstLoad = true;

    switch(myJson.status_code) {
        case "RUNNING":
            location.href = './board.html?simulation_id=' + getSimulationId()
                +'&simulation_key='+getSimulationKey();
            break;
        case "NO_SIMULATION":
            // alert("The required simulation ID does not exit. You will be taken to the home page.");
            location.href = './index.html';
            break;
        case "CHECKIN":
            location.href = './checkin.html?simulation_id=' + getSimulationId()
                +'&simulation_key='+getSimulationKey();
            break;
        case "DEBRIEFING":
            displayAttendees(myJson.attendees, getSessionKey());
            displayControls(myJson.language_code, myJson.mood_code, myJson.role_code);
            displayStatements(myJson.attendees);
            toggleAccessControl(myJson.role_code);
            displayPresentation(myJson.dom, myJson.role_code, myJson.wip_visibility);
            if(checkedDisplayedRounds(myJson.round_id_0, myJson.round_id_1)){
                updateRoundStats(myJson.round_id_0, "left");
                updateRoundStats(myJson.round_id_1, "right");
            }
            updateRoundSwitch(myJson.round_id_0, myJson.round_id_1);

            if(language_code !== myJson.language_code){
                displayDefinitions(myJson.language_code);
                translateElements("debriefing", myJson.language_code);
                updateRoundStats(myJson.round_id_0, "left");
                updateRoundStats(myJson.round_id_1, "right");
            }
            language_code = myJson.language_code;
            break;
        default:
    }

    if (firstLoad) document.body.style.visibility = 'visible';
}

/**** display functions based on delivered Json on stream udpdate ***/

function checkedDisplayedRounds(round_id_left, round_id_right) {

    let currentRoundLeft = document.getElementById("round_display_left");
    let currentRoundRight = document.getElementById("round_display_right");

    let currentAttrLeft = null;
    if (currentRoundLeft.hasAttribute("data-value")) {
        currentAttrLeft = currentRoundLeft.getAttribute("data-value").toString();
    }

    let currentAttrRight = null;
    if (currentRoundRight.hasAttribute("data-value")) {
        currentAttrRight = currentRoundRight.getAttribute("data-value").toString();
    }

    if((currentAttrLeft != round_id_left) || (currentAttrRight != round_id_right)){

        //alert(currentAttrLeft+':'+round_id_left+' | '+currentAttrRight+':'+round_id_right);

        if (round_id_left == null) {
            currentRoundLeft.removeAttribute("data-value");
        }
        else {
            currentRoundLeft.setAttribute("data-value", round_id_left);
        }

        if (round_id_right == null) {
            currentRoundRight.removeAttribute("data-value");
        }
        else {
            currentRoundRight.setAttribute("data-value", round_id_right);
        }
        return true;
    }
    else{
        return false;
    }

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
            removeStyleClass(lang, "active");
        }
        else{
            addStyleClass(lang, "active");
        }
    });
    if(role_code === "FACILITATOR") {
        if (document.body.getAttribute("data-facilitator_flag")!=="1") {
            document.body.setAttribute("data-facilitator_flag", "1");
        }
        facilitator_tool.forEach(tool => {
            tool.style.visibility = "visible";
        });
    }
        else{
        if (document.body.getAttribute("data-facilitator_flag")!=="0") {
            document.body.setAttribute("data-facilitator_flag", "0");
        }
        facilitator_tool.forEach(tool => {
            tool.style.visibility = "hidden";
        });
    }
}

function displayAttendees(attendees, session_key){
    let count = 0;
    attendees.forEach(obj => {

            let myDiv = document.getElementById(obj.session_key);

            if (obj.timeout > 30) {
                /* remove avatar when exists */
                if (myDiv != null) {
                    myDiv.remove();
                }
                /* hide cursor of timed out attendee */
                displayCursor(obj.session_key, null, null, obj.avatar_code);
            }
            else {
                /*check if attendee has a div, if not create it*/
                if (myDiv == null) {
                    myDiv = createAttendeeDiv(obj, session_key);
                    if (count % 2 === 0) {
                        document.getElementById("left").appendChild(myDiv);
                    } else {
                        document.getElementById("right").appendChild(myDiv);
                    }
                }
                setAttendeeMood(myDiv, obj);
                /*identify time out attendees and mark them*/

                /* show cursor of attendee if active */
                displayCursor(obj.session_key, obj.cursor_x, obj.cursor_y, obj.avatar_code);
                count++;
            }
        }
    );
}


function setAttendeeMood(attendeeDiv, attendee){
    let moodCode = null;
    if (attendee.mood_code && attendee.mood_code.length>0 && attendee.mood_code != 'unset_mood') {
        moodCode = attendee.mood_code;
    }


    let moodDiv = Array.from(attendeeDiv.getElementsByClassName("mood"));

    let toolDiv = Array.from(document.getElementById("tools").getElementsByClassName("tool"));
    if (
        (moodCode &&  !moodDiv[0].classList.contains(attendee.mood_code))
      ||  (!moodCode && moodDiv[0].classList.length > 1)
    )
    {
            switch(moodCode){
            case "light_bulb":
                resetMood(moodDiv[0]);
                moodDiv[0].style.animation = "light_bulb 2.5s 2 ease-out";
                moodDiv[0].classList.add("light_bulb");
                playSound("light_bulb");
                break;
            case "waiving_hand":
                resetMood(moodDiv[0]);
                moodDiv[0].style.animation = "waiving_hand  1.5s infinite linear";
                moodDiv[0].classList.add("waiving_hand");
                playSound("waiving_hand");
                break;
            case "gear":
                resetMood(moodDiv[0]);
                moodDiv[0].style.animation = "gear 3.5s infinite ease-in-out";
                moodDiv[0].classList.add("gear");
                break;
            case "explosion":
                resetMood(moodDiv[0]);
                moodDiv[0].style.animation = "explosion 3.5s 1 linear";
                moodDiv[0].classList.add("explosion");
                playSound("explosion");
                break;
            case "wondering":
                resetMood(moodDiv[0]);
                moodDiv[0].style.animation = "wondering 3.5s infinite ease-in-out";
                moodDiv[0].classList.add("wondering");
                playSound("wondering");
                break;
            default:
                resetMood(moodDiv[0]);
        }
    }

    if(attendee.session_key === getSessionKey()) {
        toolDiv.forEach(tool => {
            if (tool.id === attendee.mood_code) {
                addStyleClass(tool, "active_tool");
            } else {
                removeStyleClass(tool, "active_tool");
            }
        });
    }
}

function resetMood(div) {
    div.style.animation = "";
    removeStyleClass(div,"light_bulb");
    removeStyleClass(div,"waiving_hand");
    removeStyleClass(div,"gear");
    removeStyleClass(div,"explosion");
    removeStyleClass(div,"wondering");
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
    myDiv.onclick = resetAttendeeMood;
    myDiv.innerHTML = '<div class="mood" style="pointer-events: none;">&nbsp;</div>';
    myDiv.innerHTML += '<div class="avatar" style="pointer-events: none;">&nbsp;</div>';
    if(attendee.avatar_code == null){attendee.avatar_code = 1;}
    myDiv.querySelector(".avatar").style.backgroundImage = "url('./src/avatar_"+attendee.avatar_code+".png')";
    myDiv.innerHTML += '<div class="attendee_name_label" style="pointer-events: none;">'+attendee.name+'</div>';
    return myDiv;
}

function updateRoundSwitch(leftRoundId, rightRoundId) {
    let leftId;
    let rightId;

    if (leftRoundId==null) {
        leftId = "";
    }
    else {
        leftId = leftRoundId.toString();
    }
    if (rightRoundId==null) {
        rightId = "";
    }
    else {
        rightId = rightRoundId.toString();
    }

    if (document.getElementById("left_round_switch").value !== leftId) {
        document.getElementById("left_round_switch").value = leftId
    }
    if (document.getElementById("right_round_switch").value !== rightId) {
        document.getElementById("right_round_switch").value = rightId
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

function resetAttendeeMood(e) {
    if (document.body.getAttribute("data-facilitator_flag")==="1") {
        let url = "./update_attendee.php?"
            + "simulation_id=" + getSimulationId()
            + "&session_key=" + e.target.id
            + "&mood_code=";
        fetch(url).then();
    }
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

function updateItemOption(e){
    /*reminder: option.id = item_id+"_"+key; */
    let url = './update_items.php?'
        +"item_id="+e.target.id.split('_')[0]
        +"&options="+e.target.id.split('_')[1];
    fetch(url);
}

function playSound(file){
    if (audioFiles!=null) {
        audioFiles[file].play();
    }
}

function initSounds() {
    if (audioFiles == null) {
        audioFiles = new Array();
        let moods =  ["explosion", "light_bulb", "waiving_hand", "wondering"];
        moods.forEach( mood=> {
            audioFiles[mood] = new Audio('./src/sounds/'+mood+'.mp3');
            audioFiles[mood].volume = 0.2;
            audioFiles[mood].load();
            //audioFiles[mood].play();
            //audioFiles[mood].pause();
        });
        document.removeEventListener('click', initSounds);
    }
}