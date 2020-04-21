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
                    displayControls(myJson.current_round);
                    displayItems(myJson.items_list);
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

function sec2time(timeInSeconds) {
    if(isNaN(timeInSeconds)){
        timeInSeconds=0;
    }
    var pad = function(num, size) { return ('000' + num).slice(size * -1); },
        time = parseFloat(timeInSeconds).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);

    return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
}

function complexClock(time){
    let digits = [];
    let clockDisplay="";
    for(var i=0; i<10;i++){
        digits[i]="<img src='./src/"+i+".png' class='clock_digit'>";
    }
    digits[':']="<img src='./src/dots.png' class='clock_digit'>";
    let stime = time.toString();
    console.log("stime: "+stime+" time: "+time)
    for(i=0;i<stime.length;i++){
            clockDisplay += digits[stime.charAt(i)];
    }
    return clockDisplay;

}

function displayItems(items_list){

    let itemDivIdArray = []; /*only for items not in progress*/
    items_list.forEach( obj => {
       let currentItemDivId = obj.round_id+'_'+obj.item_id;
       if(obj.is_in_progress == 0){
           itemDivIdArray.push(currentItemDivId);
       }
        /*go through each item in the round and check if element exists*/
        if(document.getElementById(currentItemDivId) != null){
            updateItemDiv(obj, currentItemDivId);
        }
        else{
            createItemDiv(obj, currentItemDivId);
        }

        putItemDivAtTheRightPosition(obj, currentItemDivId);
    });

    /*go through all the item divs on page and identify those without corresponding itemDivId - then remove those*/
    let itemDivsOnPage = Array.from(document.getElementsByClassName("item"));
    itemDivsOnPage.forEach( div => {
        if (itemDivIdArray.indexOf(div.id) == -1) {
            div.remove();
        }
    });
}

function displayControls(round){

    let totalDuration;
    let playButton = document.getElementById("play");
    let stopButton = document.getElementById("pause");
    let resetButton = document.getElementById("reset");

    if((round.last_start_time == null)&&(round.last_stop_time == null)){
        playButton.disabled=false;
        stopButton.disabled=true;
        resetButton.disabled=true;
    }

    if((round.last_start_time == null)&&(round.last_stop_time != null)){
        playButton.disabled = false;
        stopButton.disabled = false;
        resetButton.disabled = false;
        console.log("Unfortunately there is an error");
    }

    if((round.last_start_time != null)&&(round.last_stop_time == null)){
        playButton.disabled = true;
        stopButton.disabled = false;
        resetButton.disabled = true;
    }

    if((round.last_start_time != null)&&(round.last_stop_time != null)){
        playButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = false;
    }
    /*
    totalDuration = sec2time(parseInt(round.total_time_s));
    document.getElementById("clock").innerText = totalDuration;
    */
    totalDuration = complexClock(sec2time(parseInt(round.total_time_s)));
    document.getElementById("clock").innerHTML = totalDuration;
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
        else{
            renderSVG(obj.station_id)
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

function updateItemDiv(obj, currentItemDivId){
    currentItemDivId.innerText = "Order #"+obj.order_number+" | "+sec2time(obj.cycle_time_s)+" | "+obj.price+" €";
}

function createItemDiv(obj, currentItemDivId){
    let div = document.createElement("div");
    div.id = currentItemDivId;
    div.classList.add("item");
    div.innerText = "Order #"+obj.order_number+" | "+obj.price+" €";
    if(obj.current_station_id == null){obj.current_station_id = "backlog";}
    document.getElementById(obj.current_station_id).appendChild(div);
}

function putItemDivAtTheRightPosition(obj, currentItemDivId){
    let div = document.getElementById(currentItemDivId);
    if(obj.current_station_id == null){
        obj.current_station_id = "backlog";
    }
    if(div.parentElement.id != obj.current_station_id){
        document.getElementById(obj.current_station_id).appendChild(div);
    }
}

function createStationDiv(station){
    let stationDiv = document.createElement("div");
    stationDiv.id = station.station_id;
    stationDiv.classList.add("station");
    let stationDropTarget = document.createElement("div");
    stationDropTarget.classList.add("drop_target");
    stationDropTarget.ondrop = drop;
    stationDropTarget.ondragover = allowDrop;
    stationDiv.appendChild(stationDropTarget);

    let stationLabel = document.createElement("div");
    stationLabel.classList.add("station_label");
    stationLabel.innerHTML=station.station_name;
    stationLabel.style.backgroundImage="url('./src/station_label_"+ ( 1 + parseInt(station.station_pos) % 4 ) +".png')";

    let stationThumbnail = document.createElement("img");
    stationThumbnail.classList.add("station_thumbnail");

    stationDiv.appendChild(stationLabel);
    stationDiv.appendChild(stationThumbnail);

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
    myDiv.innerHTML = '<button class="avatar">&nbsp;</button>';
    myDiv.innerHTML += '<div class="attendee_name_label">'+obj.name+'</div>';
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


function pressPlay(){
    const url = './update_current_round.php?simulation_id=' + getSimulationId() + '&action=start';
    fetch(url);
}

function pressPause(){
    const url = './update_current_round.php?simulation_id=' + getSimulationId() + '&action=stop';
    fetch(url);
}

function pressReset(){
    const url = './update_current_round.php?simulation_id=' + getSimulationId() + '&action=reset';
    fetch(url);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    var crt = ev.target.cloneNode(true);
    crt.id="image_"+ev.target.id;
    crt.style.backgroundColor = "transparent";
    crt.style.width = "3.1em"
    document.body.appendChild(crt);
    ev.dataTransfer.setDragImage(crt, 25,25, 0);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    document.getElementById("image_"+data).remove();
    updateAttendeeStation(data, ev.target.parentElement.id, getSimulationId());

}

function renderSVG(station_id){
    var request = new XMLHttpRequest();
    request.open("GET", "read_svg.php?id=1", true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.addEventListener('load', function (event) {
        if (request.status >= 200 && request.status < 300) {
            //console.log(request.responseText);
            let e = Array.from(document.getElementById(station_id).getElementsByClassName("station_thumbnail"));
            e.forEach( obj => {
                obj.src="read_svg.php?id=1";
            });

        } else {
            console.warn(request.statusText, request.responseText);
        }
    });

    request.send();
}