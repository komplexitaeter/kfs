var fCanvas;


function loadBoard(){
    setInterval(function(){
        refreshBoard(getSimulationId(),getSessionKey());
    }, 500);
}

function refreshBoard(simulation_id, session_key){

    let firstload = false;
    if (document.body.style.visibility != 'visible') firstload = true;


    let url ='./get_board.php?simulation_id='+simulation_id+'&session_key='+session_key;

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
                    toggleAccessControl(myJson.role_code);
                    //autoPullItem(myJson.workbench);
                    break;
                case "NO_SIMULATION":
                    // alert("The required simulation ID does not exit. You will be taken to the home page.");
                    location.href = './index.html';
                    break;
                case "CHECKIN":
                    location.href = './checkin.html?simulation_id='+simulation_id;
                    break;
                case "DEBRIEFING":
                    location.href = './debriefing.html?simulation_id='+simulation_id;
                    break;
                default:
                //alert("Undefined status_code - this is an error. Sorry.");
            }
            if (firstload) document.body.style.visibility = 'visible';
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
/****TODO: WIP1, Arbeit fertig aber noch nicht weggepullt -> Text in Done Spalte (parameter mitgeben)***/
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
             workbench.meta_data.implementation_class
            ,workbench.meta_data.params_json
            ,workbench.meta_data.station_id);
        sendSVGForThumbnail(simulation_id, workbench.meta_data.station_id);
        if(workbench.current_item != null){
            workbenchGlobal.setCurrentItem(workbench.current_item.item_id);
        }
        else{
            workbenchGlobal.unsetItem();
        }
    }

    /********Check if the buttons on the workbench are clickable*********/

    /* set the status of the workbenches pull button (start next item) */
    if (workbench.meta_data.pull == 'active') {
        document.getElementById("pull_button").disabled=false;
    }
    else {
        document.getElementById("pull_button").disabled=true;
    }

    /* set the status of the workbenches work-area (aka locked_div) */
    if (workbench.meta_data.locked_div == 'none') {
        workbenchGlobal.enableWorkbench();
    }
    else {
        workbenchGlobal.disableWorkbench(workbench.meta_data.locked_div);
    }

    /* set the status of the workbenches push button (finish current item) */
    if (workbench.meta_data.push == 'active') {
        document.getElementById("push_button").disabled=false;
        document.getElementById("push_button").classList.remove("glass_hour");
    }
    else if (workbench.meta_data.push == 'glass_hour') {
        /* todo: set a css class for button image with a glass hour  */
        document.getElementById("push_button").disabled=true;
        document.getElementById("push_button").classList.add("glass_hour");
    }
    else {
        document.getElementById("push_button").disabled=true;
        document.getElementById("push_button").classList.remove("glass_hour");
    }


    /* set the status of the Push-Pull toggle switch */
    let auto_pull = document.getElementById('auto_pull');
    if (current_round.auto_pull == 1 && auto_pull.checked != true) {
        auto_pull.checked = true;
    }
    else if (current_round.auto_pull == 0 && auto_pull.checked != false) {
        auto_pull.checked = false;
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
            optionDiv.src = './src/dot_aliceblue.png';
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
    switch (e.target.name) {
        case "finish":
            let item_status = workbenchGlobal.finish();

            if (item_status[0]=='FAIL') {
                alert(item_status[1]);
            }
            else {
                let item_svg = item_status[1];
                url = "./update_workbench.php"
                    + "?action=" + e.target.name
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
        break;
        case "start":
            url = "./update_workbench.php"
                + "?action=" + e.target.name
                + "&simulation_id=" + getSimulationId()
                + "&session_key=" + getSessionKey();
            fetch(url);
        break;
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

function hashCode(str) {
    let hash = 0;
    if (str.length == 0) return hash;
    let char;
    for (let i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function sendSVGForThumbnail(simulation_id, station_id){
    let svgCode = fCanvas.toSVG();
    let svgHash = hashCode(svgCode);

    if (workbenchGlobal.getHash() != svgHash) {

        let url = "update_workbench.php?"
            + 'simulation_id=' + simulation_id
            + '&session_key=' + getSessionKey()
            + '&svg_hash=' +svgHash
            + '&action=thumbnail_update';

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
        request.send('thumbnail_svg=' + svgCode);

        workbenchGlobal.setHash(svgHash);
    }
}


function displayControls(round){

    let totalDuration;
    let playButton = document.getElementById("play");
    let stopButton = document.getElementById("pause");
    let resetButton = document.getElementById("reset");
    let debriefingButton = document.getElementById("debriefing");


    if((round.last_start_time == null)&&(round.last_stop_time == null)){
        playButton.disabled=false;
        stopButton.disabled=true;
        resetButton.disabled=true
        debriefingButton.disabled=false;
    }

    if((round.last_start_time == null)&&(round.last_stop_time != null)){
        playButton.disabled = true;
        stopButton.disabled = true;
        resetButton.disabled = true;
        debriefingButton.disabled = true;
        console.log("Unfortunately there is an error");
    }

    if((round.last_start_time != null)&&(round.last_stop_time == null)){
        playButton.disabled = true;
        stopButton.disabled = false;
        resetButton.disabled = true;
        debriefingButton.disabled = true;
    }

    if((round.last_start_time != null)&&(round.last_stop_time != null)){
        playButton.disabled = false;
        stopButton.disabled = true;
        resetButton.disabled = false;
        debriefingButton.disabled = false;
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
/***TODO: catch lockedDiv status and give it to updateThumbnail, create case no worker on thumbnail*/
            if (obj.locked_div == 'unattended') {
                updateThumbnail(obj.station_id, -1, '', obj.locked_div);
            }
            else {
                updateThumbnail(obj.station_id, simulation_id, obj.svg_hash, obj.locked_div);
            }
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
    let item = document.getElementById(currentItemDivId);
    //item.innerText = "#"+obj.order_number+" | "+sec2time(obj.cycle_time_s)+" | "+obj.price+"€";
    if (obj.wip == '0') {
        item.classList.remove('wip_item');
        item.classList.remove('done_item');
    }
    else if (obj.wip == '1') {
        item.classList.add('wip_item');
        item.classList.remove('done_item');
    }
    else {
        item.classList.remove('wip_item');
        item.classList.add('done_item');
    }

    updateItemDivOptions(item, obj.options);

}

function updateItemDivOptions(itemDiv, options){
    let workbenchItemDiv = document.getElementById("workbench_"+itemDiv.id.split('_')[1]);

    switch(options){
        case "red":
            Array.from(itemDiv.getElementsByTagName("img"))[0].src = "./src/dot_red.png";
            if(workbenchItemDiv!=null) Array.from(workbenchItemDiv.getElementsByTagName("img"))[0].src = "./src/dot_red.png";
            break;
        case "green":
            Array.from(itemDiv.getElementsByTagName("img"))[0].src = "./src/dot_green.png";
            if(workbenchItemDiv!=null) Array.from(workbenchItemDiv.getElementsByTagName("img"))[0].src = "./src/dot_green.png";
            break;
        case "yellow":
            Array.from(itemDiv.getElementsByTagName("img"))[0].src = "./src/dot_yellow.png";
            if(workbenchItemDiv!=null) Array.from(workbenchItemDiv.getElementsByTagName("img"))[0].src = "./src/dot_yellow.png";
            break;
        default:
            Array.from(itemDiv.getElementsByTagName("img"))[0].src = "./src/dot_aliceblue.png";
            if(workbenchItemDiv!=null) Array.from(workbenchItemDiv.getElementsByTagName("img"))[0].src = "./src/dot_aliceblue.png";
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
    optionDiv.src = './src/dot_aliceblue.png';
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
        let url = "./get_item_svg.php?"
            +"item_id="+item_id;

        div_preview.src = url;
        div_preview.style.visibility = "visible";
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

function clearOpenedMenu(){
    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
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

function defineContextMenu(target_id, context){
    let contextMenuArray;
    let contextMenu;
    switch(context) {
        case "item":
            contextMenuArray = {
                "red": "set item to red",
                "green": "set item to green",
                "yellow": "set item to yellow",
                "": "remove color"
            };

            contextMenu = document.createElement("div");
            contextMenu.classList.add("context_menu", "access_control");

            for (var key in contextMenuArray) {
                var value = contextMenuArray[key];
                let option = document.createElement("img");
                option.classList.add("context_menu_option");
                option.id = target_id + "_" + key;
                option.value = target_id;
                if (key != "") {
                    option.src = "./src/dot_" + key + ".png";
                } else {
                    option.src = "./src/dot_aliceblue.png";
                }

                option.onclick = updateItemOption;
                contextMenu.append(option);
            }
            document.body.appendChild(contextMenu);
            return contextMenu;
            break;

        case "attendee":
            contextMenuArray = {
                "FACILITATOR": "give facilitator role",
                "OBSERVER": "remove facilitator role"
            };

            contextMenu = document.createElement("div");
            contextMenu.classList.add("context_menu", "set_role", "access_control");

            for (var key in contextMenuArray) {
                var value = contextMenuArray[key];
                let option = document.createElement("div");
                option.classList.add("context_menu_role");
                option.id = target_id + "_" + key;
                option.innerText = value;
                option.onclick = updateAttendeeRole;
                contextMenu.append(option);
            }
            document.body.appendChild(contextMenu);
            return contextMenu;
            break;
    }
}

function rightClickAttendee(e){
    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
        });
    }

    let contextMenu = defineContextMenu(e.target.id, "attendee");

    /*position context menu to the left in case the cursor is on the far right*/
    if(contextMenu.clientWidth + e.clientX > document.body.clientWidth){
        contextMenu.style.left = (e.clientX - contextMenu.clientWidth) + "px";
    }
    else{
        contextMenu.style.left = (e.clientX ) + "px";
    }
    contextMenu.style.top = e.clientY + "px";
}

function rightClickItem(e){

    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
        });
    }

    let contextMenu = defineContextMenu(e.target.id.split('_')[1], "item");

    /*position context menu to the left in case the cursor is on the far right*/
    if(contextMenu.clientWidth + e.clientX > document.body.clientWidth){
        contextMenu.style.left = (e.clientX - contextMenu.clientWidth) + "px";
    }
    else{
        contextMenu.style.left = (e.clientX ) + "px";
    }
    contextMenu.style.top = e.clientY + "px";

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
    const url = './update_current_round.php?simulation_id=' + getSimulationId() + '&action=reset';
    fetch(url);
}

function pressDebriefing(){
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=DEBRIEFING';
    fetch(url);
}

function pressAutoPull() {
    const url = './update_current_round.php?simulation_id=' + getSimulationId() + '&action=toggle_auto_pull';
    fetch(url);
}


function allowDrop(ev) {
    ev.preventDefault();
}

/***switch pointer-events on the drop_targets while dragging to allow item_preview on mouseover for lower z-index children***/
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
    var crt = ev.target.cloneNode(true);
    crt.id="image_"+ev.target.id;
    crt.style.backgroundColor = "transparent";
    crt.style.width = "3.1em";
    document.body.appendChild(crt);
    ev.dataTransfer.setDragImage(crt, 25,25, 0);
    Array.from(document.getElementsByClassName("drop_target")).forEach(o => {
       o.style.pointerEvents = "auto";
    });
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    document.getElementById("image_"+data).remove();
    updateAttendeeStation(data, ev.target.parentElement.id, getSimulationId());
    Array.from(document.getElementsByClassName("drop_target")).forEach(o => {
        o.style.pointerEvents = "none";
    });
}

function resizeCanvas(){

    let width = document.getElementById('workarea').clientWidth * 0.78;
    let height = document.getElementById('workarea').clientHeight;
    fCanvas.setHeight(height);
    fCanvas.setWidth(width);
    workbenchGlobal.unsetItem();
    workbenchGlobal.initiate();

}


function updateThumbnail(station_id, simulation_id, svg_hash, locked_div) {

    let url = "get_thumbnail.php?"
        +"simulation_id="+simulation_id
        +"&station_id="+station_id
        +"&svg_hash="+svg_hash;

    let e = Array.from(document.getElementById(station_id).getElementsByClassName("station_thumbnail"));
    e.forEach( obj => {
        if (!obj.src.includes(url)) {
            obj.src=url;
        }
        switch(locked_div){
            case "coffee_break":
                obj.classList.remove("simulation_paused", "pull_ready", "unattended", "none");
                obj.classList.add("coffee_break");
                break;
            case "simulation_paused":
                obj.classList.remove("coffee_break", "pull_ready", "unattended", "none");
                obj.classList.add("simulation_paused");
                break;
            case "pull_ready":
                obj.classList.remove("coffee_break", "simulation_paused", "unattended", "none");
                obj.classList.add("pull_ready");
                break;
            case "unattended":
                obj.classList.remove("coffee_break", "simulation_paused", "pull_ready", "none");
                obj.classList.add("unattended");
                break;
            case "none":
                obj.classList.remove("coffee_break", "simulation_paused", "pull_ready", "unattended");
                break;
        }
    });
}