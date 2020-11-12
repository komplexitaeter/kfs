let fCanvas;
let language_code = 'en';

function loadBoard(){

    let baseUrl = 'get_board';
    let params = {
        "simulation_id" : getSimulationId(),
        "simulation_key" : getSimulationKey(),
        "session_key" : getSessionKey()
    }
    initializeConnection(baseUrl, params, updateDom);

    initializeCursor(getSimulationId(), getSessionKey());
}

function updateDom(myJson){
    let simulationId = getSimulationId();
    let simulation_key = getSimulationKey();
    let sessionKey = getSessionKey();
    let firstLoad = false;
    if (document.body.style.visibility != 'visible') firstLoad = true;

    switch(myJson.status_code) {
        case "RUNNING":
            window.addEventListener('resize', resizeCanvas);
            displayStations(myJson.stations, simulationId, false);
            displayAttendees(myJson.attendees, sessionKey, myJson.role_code);
            displayControls(myJson.current_round);
            displayItems(myJson.items_list);
            displayWorkbench(myJson.workbench, myJson.current_round, simulationId);
            toggleAccessControl(myJson.role_code);
            if(language_code !== myJson.language_code){
                translateElements("board", myJson.language_code);
                displayStations(myJson.stations, simulationId, true);
                workbenchGlobal = null;
            }
            language_code = myJson.language_code;
            updateNewRoundBtnPresets(myJson.current_round.auto_pull, myJson.current_round.trial_run);
            break;
        case "NO_SIMULATION":
            // alert("The required simulation ID does not exit. You will be taken to the home page.");
            location.href = './index.html';
            break;
        case "CHECKIN":
            location.href = './checkin.html?simulation_id='+simulationId
                +'&simulation_key='+simulation_key;
            break;
        case "DEBRIEFING":
            location.href = './debriefing.html?simulation_id='+simulationId
                +'&simulation_key='+simulation_key;
            break;
        default:
        //alert("Undefined status_code - this is an error. Sorry.");
    }
    if (firstLoad){
        translateElements("board", myJson.language_code);
        document.body.style.visibility = 'visible';
    }
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
    let strTime = time.toString();
    for(let i=0; i<strTime.length; i++){
       if ("0123456789".includes( strTime.charAt(i) )) {
           setSrc(document.getElementById('clock_digit_'+i.toString()), './src/', strTime.charAt(i)+'.png')
       }
    }
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
deleteOutdatedItemsOnWorkbench("work_in_progress",[workbench.current_item]);


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



/********If the current user is part of the simulation, load the workbench and send SVG from the canvas to the DB******/
    if(workbench.meta_data) {
        loadWorkbench(
             workbench.meta_data.params_json
            ,workbench.meta_data.station_id);

        if(workbench.current_item !== null){
            workbenchGlobal.setCurrentItem(workbench.current_item.item_id, workbench.current_item.options);
        }
        else{
            workbenchGlobal.unsetItem();
        }
    }

    /********Check if the buttons on the workbench are clickable*********/

    /* set the status of the workbenches pull button (start next item) */
    if (workbench.meta_data.pull == 'active') {
        enableElement(document.getElementById("pull_button"));
    }
    else {
        disableElement(document.getElementById("pull_button"));
    }

    /* set the status of the workbenches work-area (aka locked_div) */
    workbenchGlobal.setStatus(workbench.meta_data.locked_div);

    /* set the status of the workbenches push button (finish current item) */
    let pushButton = document.getElementById("push_button");
    if (workbench.meta_data.push == 'active') {
        enableElement(pushButton);
        removeStyleClass(pushButton, "glass_hour");
    }
    else if (workbench.meta_data.push == 'glass_hour') {
        disableElement(pushButton);
        addStyleClass(pushButton, "glass_hour");
    }
    else {
        disableElement(pushButton);
        removeStyleClass(pushButton, "glass_hour");
    }

    /* set the status of the "Finish Item" button */
    let finishItemButton = document.getElementById("button_finish_item");
    if (workbench.meta_data.push == 'active') {
        addStyleClass(finishItemButton, 'button_finish_item_on');
        removeStyleClass(finishItemButton, 'button_finish_item_off');
    }
    else {
        removeStyleClass(finishItemButton, 'button_finish_item_on');
        addStyleClass(finishItemButton, 'button_finish_item_off');
    }

}

function deleteOutdatedItemsOnWorkbench(divToCheck, itemsCurrentData){
    let itemsToCheck = Array.from(document.getElementById(divToCheck).getElementsByClassName("item"));
    itemsToCheck.forEach( itemToCheck => {
        let idToCheck = itemToCheck.id.split('_').pop();
        let itemExists = 0;
        itemsCurrentData.forEach(obj => {
            if(obj != null && obj.item_id == idToCheck){
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
            div.innerText = "#" + item.order_number + " | " + item.price + "€";
            let optionDiv = document.createElement("img");
            optionDiv.classList.add("item_options");

            optionDiv.src = './src/dot_'+item.options+'.png';

            div.appendChild(optionDiv);
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
            todoColumnLabel.id="todo_column_label";
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
            doneColumnLabel.id="done_column_label";
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
            workinprogressLabel.id = "work_in_progress_label";
            workinprogressLabel.innerText = "Work in Progress";

            tools.classList.add("tools");
            tools.id = "tools";
            toolsLabel.classList.add("station_label");
            toolsLabel.id = "tools_label";
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
            fCanvas = new fabric.Canvas('workbench_canvas', { isDrawingMode: false, backgroundColor: "transparent" });
            let width = document.getElementById('workarea').clientWidth * 0.78;
            let height = document.getElementById('workarea').clientHeight;
            fCanvas.setHeight(height);
            fCanvas.setWidth( width);

        default:
            return 0;
    }
}

function moveItemOnWorkbench(e){
    let url;
    if (e.target.name==='finish' || e.target.name === 'finish_big_button') {
        let item_status = workbenchGlobal.finish();

        if (item_status[0]=='FAIL') {
            alert(document.getElementById("alert_fail_workbench").value);
        }
        else {
            let item_svg = item_status[1];
            url = "./update_workbench.php"
                + "?action=finish"
                + "&simulation_id=" + getSimulationId()
                + "&session_key=" + getSessionKey();

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
            request.send('item_svg=' + item_svg);
        }
    }
    else if (e.target.name==='start') {
        url = "./update_workbench.php"
            + "?action=start"
            + "&simulation_id=" + getSimulationId()
            + "&session_key=" + getSessionKey();
        fetch(url);
    }
}

function displayItems(items_list){

    let itemDivIdArray = []; /*only for items not in progress*/
    items_list.forEach( obj => {
       let currentItemDivId = obj.round_id+'_'+obj.item_id;

       /* remember all items that should not be removed by
         "garbage collector" later
        */
       itemDivIdArray.push(currentItemDivId);

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
        if ( (!div.id.includes('workbench_')) &&  itemDivIdArray.indexOf(div.id) == -1) {
            div.remove();
        }
    });
}

function displayControls(round){

    let totalDuration;
    let playButton = document.getElementById("play");
    let stopButton = document.getElementById("pause");
    let resetButton = document.getElementById("reset");
    let debriefingButton = document.getElementById("debriefing");
    let checkinButton = document.getElementById("checkin");

    let language = Array.from(document.getElementsByClassName("language"));
    language.forEach( lang => {
        if(lang.id !== language_code) {
            removeStyleClass(lang, "active");
        }
        else{
            addStyleClass(lang, "active");
        }
    });

    if (round.trial_run==1) {
        addStyleClass(document.getElementById('clock'), "clock_hidden");
    }
    else {
        removeStyleClass(document.getElementById('clock'), "clock_hidden");
    }

    if((round.last_start_time == null)&&(round.last_stop_time == null)){
        enableElement(playButton);
        disableElement(stopButton);
        enableElement(resetButton);
        enableElement(debriefingButton);
    }

    if((round.last_start_time == null)&&(round.last_stop_time != null)){
        disableElement(playButton);
        disableElement(stopButton);
        disableElement(resetButton);
        disableElement(debriefingButton);
        console.log("Unfortunately there is an error");
    }

    if((round.last_start_time != null)&&(round.last_stop_time == null)){
        disableElement(playButton);
        enableElement(stopButton);
        disableElement(resetButton);
        disableElement(debriefingButton);
    }

    if((round.last_start_time != null)&&(round.last_stop_time != null)){
        enableElement(playButton);
        disableElement(stopButton);
        enableElement(resetButton);
        enableElement(debriefingButton);
    }

    if (round.last_start_time != null) {
        disableElement(checkinButton);
    } else {
        enableElement(checkinButton);
    }

    let modeHint;
    let modeHintDiv = document.getElementById('mode_hint_div');
    if (round.auto_pull==='1') {
        modeHint = document.getElementById('mode_hint_unlimited').value;
    } else {
        modeHint = document.getElementById('mode_hint_limit').value;
    }
    if (modeHintDiv.innerText !== modeHint) {
        modeHintDiv.innerText = modeHint;
    }


    /*
    totalDuration = sec2time(parseInt(round.total_time_s));
    document.getElementById("clock").innerText = totalDuration;
    */
    if (!document.getElementById('clock').classList.contains("clock_hidden")) {
        complexClock(sec2time(parseInt(round.total_time_s), 1));
    }
}

function displayStations(stations, simulation_id, override){
    let recreateStations = false;
    if(override === true){ recreateStations = true;}
    stations.forEach(obj => {
        let myDiv;
        /*check if at least one station hasn't a div, then delete all station divs and create them all again*/
        myDiv = document.getElementById(obj.station_id);
        if(myDiv === null){
            recreateStations=true;
        }
        else{
            updateThumbnail(simulation_id, obj.station_id, obj.last_item_id, obj.locked_div);
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
        doneLabel.id = "done_station_label";
        doneDiv.appendChild(doneLabel);
        document.getElementById("stations").appendChild(doneDiv);
    }
}

function updateItemDiv(obj, currentItemDivId){
    let item = document.getElementById(currentItemDivId);
    //item.innerText = "#"+obj.order_number+" | "+sec2time(obj.cycle_time_s)+" | "+obj.price+"€";
    if (obj.wip == '0') {
        removeStyleClass(item, 'wip_item');
        removeStyleClass(item, 'done_item');
    }
    else if (obj.wip == '1') {
        addStyleClass(item, 'wip_item');
        removeStyleClass(item, 'done_item');
    }
    else {
        removeStyleClass(item, 'wip_item');
        addStyleClass(item, 'done_item');
    }

    updateItemDivOptions(item, obj.options);

}

function updateItemDivOptions(itemDiv, options){
    let optionsItemDiv = Array.from(itemDiv.getElementsByTagName("img"))[0];
    if (optionsItemDiv && !optionsItemDiv.src.includes(options)) {
        optionsItemDiv.src = "./src/dot_" + options + ".png";
        let workbenchItemDiv = document.getElementById("workbench_" + itemDiv.id.split('_')[1]);
        if (workbenchItemDiv != null) Array.from(workbenchItemDiv.getElementsByTagName("img"))[0].src = "./src/dot_" + options + ".png";
    }
}

function createItemDiv(obj, currentItemDivId){
    let div = document.createElement("div");
    div.id = currentItemDivId;
    div.classList.add("item");
    div.innerText = "#"+obj.order_number+" | "+obj.price+"€";
    if(obj.current_station_id == null){obj.current_station_id = "backlog";}
    div.onmouseover=displayItemPreview;
    div.onmouseout=removeItemPreview;
    div.oncontextmenu=rightClickItem;

    let optionDiv = document.createElement("img");
    optionDiv.classList.add("item_options");

    optionDiv.src = './src/dot_'+obj.options+'.png';

    optionDiv.style.pointerEvents = "none";
    div.appendChild(optionDiv);
    document.getElementById(obj.current_station_id).appendChild(div);
}

function displayItemPreview(e){
    if(e.target.parentElement.id!="backlog") {
        let div_preview = document.createElement("img");

        div_preview.classList.add("item_preview");
        div_preview.style.visibility = "hidden";
        document.body.appendChild(div_preview);
        div_preview.style.left = (e.clientX - div_preview.clientWidth) + "px";
        div_preview.style.top = e.clientY + "px";

        let item_id = e.target.id.split('_')[1];

        if (item_id && item_id.toString().length >0) {
            let url = "./get_item_svg.php?"
                + "item_id=" + item_id;
            div_preview.src = url;
            div_preview.style.visibility = "visible";
        }
    }
}

function removeItemPreview(){
    document.querySelectorAll('.item_preview').forEach(e => e.remove());
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
    stationDropTarget.style.pointerEvents = "none";
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

function displayAttendees(attendees, session_key, role_code){
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
        if(obj.timeout > 30 && role_code === 'FACILITATOR'){
            switchTimeoutAttendee(myDiv, true);
        }
        else{
            switchTimeoutAttendee(myDiv, false);
        }

        /* show cursor of attendee if active */
        displayCursor(obj.session_key, obj.cursor_x, obj.cursor_y, obj.avatar_code);

        }
    );
}

function putAttendeeDivAtTheRightPosition(myDiv, obj){
    if (obj.station_id == null) {
        obj.station_id = "observers";
    } /*todo*/
    if((myDiv.parentElement == null) || (obj.station_id != myDiv.parentElement.id)) {
        let targetDiv = document.getElementById(obj.station_id);
        if (targetDiv === null) {
            targetDiv = document.getElementById("observers");
        }
        targetDiv.appendChild(myDiv);
    }
}

function switchTimeoutAttendee(myDiv, bool){
    if(bool){
        addStyleClass(myDiv, "timeout_user");
    }
    else{
        removeStyleClass(myDiv, "timeout_user");
    }
}

function createAttendeeDiv(obj, session_key){
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
    myDiv.draggable=true;
    myDiv.ondragstart=drag;
    return myDiv;
}

function updateAttendeeStation(session_key, station_id, simulation_id){
    if(parseInt(station_id)||station_id == 'observers') {
        if(station_id == 'observers'){station_id="";}

        workbenchGlobal = null;

        const url = './update_attendee.php?simulation_id=' + simulation_id + '&session_key=' + session_key + '&station_id=' + station_id;
        fetch(url);
        // .then((response) => {
        //     return response.json();
        // })
    }
}

function autoPullItem(workbench) {
   // alert('X='+doAutoPull);
 if (workbench.do_auto_pull=='1' && workbench.current_item==null) {
     url = "./update_workbench.php"
         + "?action=start"
         + "&simulation_id=" + getSimulationId()
         + "&session_key=" + getSessionKey();
     fetch(url);
 }
}

/****functions for the FACILITATOR****/

function updateItemOption(e){
    /*reminder: option.id = item_id+"_"+key; */
    let url = './update_items.php?'
                +"item_id="+e.target.id.split('_')[0]
                +"&options="+e.target.id.split('_')[1];
    fetch(url);
}



/******Toolbox for the default_draw implementation**********/

function changeDrawingColor(e) {
    fCanvas.freeDrawingBrush.color = e.target.value;
}

function clearDrawing() {
    let i=0;
    fCanvas.getObjects().forEach(obj => {
        i++;
        if (i>workbenchGlobal.objectsCountOrig) {
            fCanvas.remove(obj);
        }
    });
}

function cancelLastAction(){
    if(fCanvas.getObjects().length > workbenchGlobal.objectsCountOrig) {
        fCanvas.remove(fCanvas.getObjects()[fCanvas.getObjects().length - 1]);
    }
}

function changeDrawingLineWidth (e) {
    fCanvas.freeDrawingBrush.width = parseInt(e.target.value, 10) || 1;
    //e.target.previousSibling.innerHTML = e.target.value;
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
    document.getElementById('new_round_dialog').hidden=false;
}

function close_new_round_dialog() {
    document.getElementById('new_round_dialog').hidden=true;
}

function toggleTrialBtn(isTrial) {
    let trialButtonTrue = document.getElementById('btn_trial_true');
    let trialButtonFalse = document.getElementById('btn_trial_false');
    if (isTrial) {
        addStyleClass(trialButtonTrue, 'tb_active');
        removeStyleClass(trialButtonTrue, 'tb_inactive');
        addStyleClass(trialButtonFalse, 'tb_inactive');
        removeStyleClass(trialButtonFalse, 'tb_active')
    } else {
        addStyleClass(trialButtonTrue, 'tb_inactive');
        removeStyleClass(trialButtonTrue, 'tb_active');
        addStyleClass(trialButtonFalse, 'tb_active');
        removeStyleClass(trialButtonFalse, 'tb_inactive')
    }
}

function toggleAutoPullBtn(isAutoPull) {
    let autoPullButtonTrue = document.getElementById('btn_auto_pull_true');
    let autoPullButtonFalse = document.getElementById('btn_auto_pull_false');
    if (isAutoPull) {
        addStyleClass(autoPullButtonTrue, 'tb_active');
        removeStyleClass(autoPullButtonTrue, 'tb_inactive');
        addStyleClass(autoPullButtonFalse, 'tb_inactive');
        removeStyleClass(autoPullButtonFalse, 'tb_active')
    } else {
        addStyleClass(autoPullButtonTrue, 'tb_inactive');
        removeStyleClass(autoPullButtonTrue, 'tb_active');
        addStyleClass(autoPullButtonFalse, 'tb_active');
        removeStyleClass(autoPullButtonFalse, 'tb_inactive')
    }
}

function updateNewRoundBtnPresets(autoPull, trialRun) {
    if (document.getElementById('new_round_dialog').hidden) {
        if (autoPull == 1 && trialRun == 1) {
            toggleAutoPullBtn(true);
            toggleTrialBtn(false);
        } else if (autoPull == 1 && trialRun == 0) {
            toggleAutoPullBtn(false);
            toggleTrialBtn(true);
        } else if (autoPull == 0 && trialRun == 1) {
            toggleAutoPullBtn(false);
            toggleTrialBtn(false);
        }
    }
}

function pressNewRound() {
    let autoPull=1;
    let trialRun=1;

    if (document.getElementById('btn_trial_true').classList.contains('tb_inactive')) {
        trialRun=0;
    }

    if (document.getElementById('btn_auto_pull_true').classList.contains('tb_inactive')) {
        autoPull=0;
    }

    const url = './update_current_round.php?simulation_id=' + getSimulationId()
              + '&action=reset'
              + '&auto_pull=' + autoPull
              + '&trial_run=' + trialRun;
    fetch(url).then(r=>{
        if (r) {
            close_new_round_dialog();

        }
    });
}

function pressDebriefing(){
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=DEBRIEFING';
    fetch(url);
}

function pressCheckIn(){
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=CHECKIN';
    fetch(url);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function setLanguage(e){
    let url = "./update_attendee.php?"
        +"simulation_id="+getSimulationId()
        +"&session_key="+getSessionKey()
        +"&language_code="+e.target.id;
    fetch(url).then();
}

/***switch pointer-events on the drop_targets while dragging to allow item_preview on mouseover for lower z-index children***/
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.dataTransfer.setDragImage(ev.target, 25,25, 0);
    Array.from(document.getElementsByClassName("drop_target")).forEach(o => {
       o.style.pointerEvents = "auto";
    });
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    updateAttendeeStation(data, ev.target.parentElement.id, getSimulationId());
    Array.from(document.getElementsByClassName("drop_target")).forEach(o => {
        o.style.pointerEvents = "none";
    });
}

function resizeCanvas(){

    let workArea = document.getElementById('workarea');
    if (workArea!==null) {
        let width = document.getElementById('workarea').clientWidth * 0.78;
        let height = document.getElementById('workarea').clientHeight;
        fCanvas.setHeight(height);
        fCanvas.setWidth(width);
        workbenchGlobal.unsetItem();
    }

}


function updateThumbnail(simulation_id, station_id, last_item_id, locked_div) {
    const url = "./get_thumbnail.php";
    const url_param = "?item_id="+last_item_id
                    + "&simulation_id="+simulation_id
                    + "&station_id="+station_id;
    const url_miss = "?empty";

    let e = Array.from(document.getElementById(station_id).getElementsByClassName("station_thumbnail"));
    e.forEach( obj => {

        if (!obj.src || !obj.src.length || obj.src.length === 0 || obj.src.includes(url_miss)) {
            if (locked_div == 'none') {
                if (last_item_id) {
                    obj.src = url + url_param;
                }
            }
        } else {
            if (locked_div == 'none') {
                if (last_item_id) {
                    if (!obj.src.includes(url_param)) {
                        obj.src = url + url_param;
                    }
                } else {
                    if (!obj.src.includes(url_miss)) {
                        obj.src = url + url_miss;
                    }
                }
            } else {
                if (!obj.src.includes(url_miss)) {
                    obj.src = url + url_miss;
                }
            }
        }


        switch(locked_div){
            case "coffee_break":
                if (!obj.classList.contains("coffee_break")) {
                    obj.classList.remove("simulation_paused", "pull_ready", "unattended", "none");
                    obj.classList.add("coffee_break");
                }
                break;
            case "simulation_paused":
                if (!obj.classList.contains("simulation_paused")) {
                    obj.classList.remove("coffee_break", "pull_ready", "unattended", "none");
                    obj.classList.add("simulation_paused");
                }
                break;
            case "pull_ready":
                if (!obj.classList.contains("pull_ready")) {
                    obj.classList.remove("coffee_break", "simulation_paused", "unattended", "none");
                    obj.classList.add("pull_ready");
                }
                break;
            case "unattended":
                if (!obj.classList.contains("unattended")) {
                    obj.classList.remove("coffee_break", "simulation_paused", "pull_ready", "none");
                    obj.classList.add("unattended");
                }
                break;
            case "none":
                removeStyleClass(obj, "coffee_break");
                removeStyleClass(obj, "simulation_paused");
                removeStyleClass(obj, "pull_ready");
                removeStyleClass(obj, "unattended");
            break;
        }
    });
}