function loadBoard(){
    setInterval(function(){
        refreshBoard(getSimulationId(),getSessionKey());
    }, 500);
}

function refreshBoard(simulation_id, session_key){
    const url ='./get_board.php?simulation_id='+simulation_id+'&session_key='+session_key;
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            switch(myJson.status_code) {
                case "RUNNING":
                    displayStations(myJson.stations);
                    displayAttendees(myJson.attendees, session_key);
                    break;
                case "NO_SIMULATION":
                    // alert("The required simulation ID does not exit. You will be taken to the home page.");
                    location.href = './index.php';
                    break;
                case "CHECKIN":
                    location.href = './checkin.php?simulation_id='+simulation_id;
                    break;
                default:
                //alert("Undefined status_code - this is an error. Sorry.");
            }
        });
}

function displayStations(stations){
    let recreateStations = false;
    stations.forEach(obj => {
        let myDiv;
        /*check if at least one station hasn't a div, then delete all station divs and create them all again*/
        myDiv = document.getElementById(obj.station_id);
        if(myDiv === null){
            recreateStations=true;
        }
    });
    if(recreateStations){
        Array.from(document.getElementsByClassName("station")).forEach( div => {
            div.remove();
            });
        stations.forEach(obj => {
            createStationDiv(obj);
            });
    /*add the done column as last station*/
        let doneDiv = document.createElement("div");
        doneDiv.id = "done";
        doneDiv.classList.add("station");
        document.getElementById("stations").appendChild(doneDiv);
    }
}

function createStationDiv(station){
    let stationDiv = document.createElement("div");
    stationDiv.id = station.station_id;
    stationDiv.classList.add("station");
    document.getElementById("stations").appendChild(stationDiv);
}

function displayAttendees(attendees, session_key){
    attendees.forEach(obj => {
        let myDiv;
        /*check if attendee has a div, if not create it*/
        myDiv = document.getElementById(obj.session_key);
        if(myDiv ==  null){
            myDiv = createAttendeeDiv(obj, session_key);
        }
        /*check if attendee-myDiv is at the correct position, if not put it there*/
        putAttendeeDivAtTheRightPosition(myDiv, obj);
        /*identify time out attendees and mark them*/
        if(obj.timeout > 30){
            switchTimeoutAttendee(myDiv, true);
        }
        else{
            switchTimeoutAttendee(myDiv, false);
        }
    }
    );
}

function putAttendeeDivAtTheRightPosition(myDiv, obj){
    if (obj.station_id == null) {
        obj.station_id = "observers";
    } /*todo*/
    if((myDiv.parentElement == null) || (obj.station_id != myDiv.parentElement.id)) {
        document.getElementById(obj.station_id).appendChild(myDiv);
    }
}

function switchTimeoutAttendee(myDiv, bool){
    if(bool){
        myDiv.classList.add("timeout_user");
    }
    else{
        myDiv.classList.remove("timeout_user");
    }
}

function createAttendeeDiv(obj, session_key){
    let myDiv = document.createElement("div");
    myDiv.classList.add("attendee");
    if(obj.session_key == session_key){
        myDiv.classList.add("current_user");
    }
    else{
        myDiv.classList.add("not_current_user");
    }
    myDiv.id = obj.session_key;
    myDiv.innerHTML = '<button class="avatar">&nbsp;</button>'+obj.name;
    myDiv.draggable=true;
    myDiv.ondragstart=drag;
    return myDiv;
}

function updateAttendeeStation(session_key, station_id, simulation_id){
    if(parseInt(station_id)||station_id == 'observers') {
        if(station_id == 'observers'){station_id="";}
        const url = './update_attendee.php?simulation_id=' + simulation_id + '&session_key=' + session_key + '&station_id=' + station_id;
        fetch(url);
        // .then((response) => {
        //     return response.json();
        // })
    }
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    updateAttendeeStation(data, ev.target.id, getSimulationId());
}