var fCanvas;

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
                    window.addEventListener('resize', resizeCanvas);
                    displayStations(myJson.stations, simulation_id);
                    displayAttendees(myJson.attendees, session_key);
                    displayControls(myJson.current_round);
                    displayItems(myJson.items_list);
                    displayWorkbench(myJson.workbench, myJson.current_round, simulation_id);
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
            document.body.style.visibility = 'visible';
        });
}

function sec2time(timeInSeconds, getHours) {
    if(isNaN(timeInSeconds)){
        timeInSeconds=0;
    }
    var pad = function(num, size) { return ('000' + num).slice(size * -1); },
        time = parseFloat(timeInSeconds).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);
    if(getHours) {
        return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
    }
    else{
        return pad(minutes, 2) + ':' + pad(seconds, 2);
    }
}

function complexClock(time){
    let digits = [];
    let clockDisplay="";
    for(var i=0; i<10;i++){
        digits[i]="<img src='./src/"+i+".png' class='clock_digit'>";
    }
    digits[':']="<img src='./src/dots.png' class='clock_digit'>";
    let stime = time.toString();
    for(i=0;i<stime.length;i++){
            clockDisplay += digits[stime.charAt(i)];
    }
    return clockDisplay;

}

function displayWorkbench(workbench, current_round, simulation_id){
/********Check if the different areas on the workbench are already here, if not create them*********/
    if(document.getElementById("todo_column") == null){
        createAreaOnWorkbench("todo");
    }

    if(document.getElementById("done_column") == null){
        createAreaOnWorkbench("done");
    }

    if(document.getElementById("workarea") == null){
        createAreaOnWorkbench("workarea");
    }

    if(document.getElementById("workbench_canvas") == null){
        createAreaOnWorkbench("workbench_canvas");
    }

/********check if some items are displayed at the wrong position, if so, delete them***********/

deleteOutdatedItemsOnWorkbench("todo_column",workbench.todo_items);
deleteOutdatedItemsOnWorkbench("done_column",workbench.done_items);
deleteOutdatedItemsOnWorkbench("work_in_progress",workbench.current_item);


/********Check if all the items in the workbench object are already here, if not, trigger creation*********/
    let itemsToCreate = [];

    workbench.todo_items.forEach( item => {
        if(document.getElementById("workbench_"+item.item_id) == null){
            itemsToCreate.push(item);
        }
    });
    createItemsOnWorkbench(itemsToCreate, "todo_column");
    itemsToCreate = [];

    workbench.done_items.forEach( item => {
        if(document.getElementById("workbench_"+item.item_id) == null){
            itemsToCreate.push(item);
        }
    });
    createItemsOnWorkbench(itemsToCreate, "done_column");
    itemsToCreate = [];

    if(workbench.current_item){
        item = workbench.current_item;
        if(document.getElementById("workbench_"+item.item_id) == null){
            itemsToCreate.push(item);
        }
    }
    createItemsOnWorkbench(itemsToCreate, "work_in_progress");
    itemsToCreate = [];

/********Check if the buttons on the workbench are clickable*********/
if(!((current_round.last_start_time != null)&&(current_round.last_stop_time == null))){
    document.getElementById("pull_button").disabled=true;
    document.getElementById("push_button").disabled=true;
}
else{
    if((workbench.current_item)&&(workbench.todo_items)){
        document.getElementById("pull_button").disabled=true;
        document.getElementById("push_button").disabled=false;
    }
    if((workbench.current_item == null)&&(workbench.todo_items)){
        document.getElementById("pull_button").disabled=false;
        document.getElementById("push_button").disabled=true;

    }
}

/********If the current user is part of the simulation, load the workbench and send SVG from the canvas to the DB******/
    if(workbench.meta_data) {
        loadWorkbench('DefaultDrawWorkbench', 'Test', workbench.meta_data.station_id);

        sendSVGForThumbnail(simulation_id, workbench.meta_data.station_id);
    }
}

function deleteOutdatedItemsOnWorkbench(divToCheck, itemsCurrentData){
    let itemsToCheck = Array.from(document.getElementById(divToCheck).getElementsByClassName("item"));
    itemsToCheck.forEach( itemToCheck => {
        let idToCheck = itemToCheck.id.split('_').pop();
        let itemExists = 0;
        itemsCurrentData.forEach(obj => {
            if(obj.item_id == idToCheck){
                itemExists = 1;
            }
        });
        if(itemExists == 0){
            itemToCheck.remove();
        }
    });
}

function createItemsOnWorkbench(itemsToCreate, targetDivId) {
    if (itemsToCreate.length > 0) {
        itemsToCreate.forEach(item => {
            let div = document.createElement("div");
            div.id = "workbench_" + item.item_id;
            div.classList.add("item");
            div.innerText = "#" + item.order_number + " | " + item.price + " €";
            document.getElementById(targetDivId).appendChild(div);
        });
    }
}

function createAreaOnWorkbench(area){
    let workbench = document.getElementById("workbench");
    switch(area){
        case "todo":
            let todoColumn = document.createElement("div");
            let todoColumnLabel = document.createElement("div");
            let pullButton = document.createElement("button");

            todoColumn.classList.add("column", "todo");
            todoColumn.id="todo_column";
            todoColumnLabel.classList.add("column_label");
            todoColumnLabel.innerText = "To Do";
            pullButton.id="pull_button";
            pullButton.name="start";
            pullButton.classList.add("p_button");
            pullButton.onclick = moveItemOnWorkbench;

            workbench.appendChild(todoColumn);
            todoColumn.append(pullButton);
            todoColumn.appendChild(todoColumnLabel)
            break;

        case "done":
            let doneColumn = document.createElement("div");
            let doneColumnLabel = document.createElement("div");
            let pushButton = document.createElement("button");

            doneColumn.classList.add("column",  "done");
            doneColumn.id="done_column";
            doneColumnLabel.classList.add("column_label");
            doneColumnLabel.innerText = "Done";
            pushButton.id="push_button";
            pushButton.name="finish";
            pushButton.classList.add("p_button");
            pushButton.onclick = moveItemOnWorkbench;

            workbench.appendChild(doneColumn);
            doneColumn.appendChild(pushButton);
            doneColumn.appendChild(doneColumnLabel);
            break;

        case "workarea":
            let workarea = document.createElement("div");
            let workinprogress = document.createElement("div");
            let tools = document.createElement("div");
            let workinprogressLabel = document.createElement("div");
            let toolsLabel = document.createElement("div");

            workarea.classList.add("workarea");
            workarea.id="workarea";

            workinprogress.classList.add("work_in_progress");
            workinprogress.id = "work_in_progress";
            workinprogressLabel.classList.add("station_label");
            workinprogressLabel.innerText = "Work in Progress";

            tools.classList.add("tools");
            tools.id = "tools";
            toolsLabel.classList.add("station_label");
            toolsLabel.innerText = "Toolbox";

            workbench.appendChild(workarea);
            workarea.appendChild(workinprogress);
            workinprogress.appendChild(workinprogressLabel);
            workarea.appendChild(tools);
            tools.appendChild(toolsLabel);
            break;

        case "workbench_canvas":
            let canvas = document.createElement('canvas');
            canvas.id = 'workbench_canvas';
            document.getElementById('workarea').appendChild(canvas);
            fCanvas = new fabric.Canvas('workbench_canvas', { isDrawingMode: true, freeDrawingCursor: "default", backgroundColor: "transparent" });
            let width = document.getElementById('workarea').clientWidth * 0.78;
            let height = document.getElementById('workarea').clientHeight;
            fCanvas.setHeight(height);
            fCanvas.setWidth( width);
            break;
        default:
            return 0;
    }
}

function moveItemOnWorkbench(e){
    const url = "./update_workbench.php"
        +"?action="+e.target.name
        +"&simulation_id="+getSimulationId()
        +"&session_key="+getSessionKey();
    fetch(url);
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

function sendSVGForThumbnail(simulation_id, station_id){
    let url = "update_workbench.php?"
        +'simulation_id='+simulation_id
        +'&session_key='+getSessionKey()
        +'&action=thumbnail_update';
    let request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.addEventListener('load', function (event) {
        if (request.status >= 200 && request.status < 300) {
            //console.log(request.responseText);
        } else {
            console.warn(request.statusText, request.responseText);
        }
    });
    request.send('thumbnail_svg='+fCanvas.toSVG());
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
    totalDuration = complexClock(sec2time(parseInt(round.total_time_s), 1));
    document.getElementById("clock").innerHTML = totalDuration;
}

function displayStations(stations, simulation_id){
    let recreateStations = false;
    stations.forEach(obj => {
        let myDiv;
        /*check if at least one station hasn't a div, then delete all station divs and create them all again*/
        myDiv = document.getElementById(obj.station_id);
        if(myDiv === null){
            recreateStations=true;
        }
        else{
            renderSVG(obj.station_id, simulation_id)
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
        let doneLabel = document.createElement("div");
        doneLabel.classList.add("station_label");
        doneLabel.innerText="Done";
        doneDiv.appendChild(doneLabel);
        document.getElementById("stations").appendChild(doneDiv);
    }
}

function updateItemDiv(obj, currentItemDivId){
    document.getElementById(currentItemDivId).innerText = "#"+obj.order_number+" | "+sec2time(obj.cycle_time_s)+" | "+obj.price+" €";
}

function createItemDiv(obj, currentItemDivId){
    let div = document.createElement("div");
    div.id = currentItemDivId;
    div.classList.add("item");
    div.innerText = "#"+obj.order_number+" | "+obj.price+" €";
    if(obj.current_station_id == null){obj.current_station_id = "backlog";}
    document.getElementById(obj.current_station_id).appendChild(div);
}

function putItemDivAtTheRightPosition(obj, currentItemDivId){
    let div = document.getElementById(currentItemDivId);
    if(obj.current_station_id == null){
        if(obj.end_time != null) {
            obj.current_station_id = "done";
        }
        else{
            obj.current_station_id = "backlog";
        }
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
    myDiv.innerHTML = '<div class="avatar">&nbsp;</div>';
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
    crt.style.width = "3.1em";
    document.body.appendChild(crt);
    ev.dataTransfer.setDragImage(crt, 25,25, 0);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    document.getElementById("image_"+data).remove();
    updateAttendeeStation(data, ev.target.parentElement.id, getSimulationId());

}

function resizeCanvas(){

    let width = document.getElementById('workarea').clientWidth * 0.78;
    let height = document.getElementById('workarea').clientHeight;

    let zoomfactor = width / fCanvas.getWidth();

    fCanvas.setHeight(height);
    fCanvas.setWidth(width);
    fCanvas.setZoom(zoomfactor);
    fCanvas.calcOffset();
    fCanvas.renderAll();

}


function renderSVG(station_id, simulation_id){

    let url = "get_thumbnail.php?"
        +"simulation_id="+simulation_id
        +"&station_id="+station_id;

    var request = new XMLHttpRequest();
    request.open("GET", url, true); //get_thumbnail simulation id and station id
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.addEventListener('load', function (event) {
        if (request.status >= 200 && request.status < 300) {
            //console.log(request.responseText);
            let e = Array.from(document.getElementById(station_id).getElementsByClassName("station_thumbnail"));
            e.forEach( obj => {
                obj.src=url;
            });

        } else {
            console.warn(request.statusText, request.responseText);
        }
    });

    request.send();
}