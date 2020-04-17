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
                    displayAttendees(myJson.attendees, simulation_id, session_key);
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

function displayAttendees(attendees, simulation_id, session_key){
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
            markTimeoutAttendee(myDiv);
        }
    }
    );
}

function putAttendeeDivAtTheRightPosition(myDiv, obj){
    document.getElementById("observers").appendChild(myDiv);
}

function markTimeoutAttendee(myDiv){
    myDiv.classList.add("timeout_user");
}

function createAttendeeDiv(obj, session_key){
    let myDiv = document.createElement("div");
    myDiv.classList.add("attendee");
    if(obj.session_key == session_key){
        myDiv.classList.add("current_user");
        dragElement(myDiv);
    }
    else{
        myDiv.classList.add("not_current_user");
    }
    myDiv.id = obj.session_key;
    myDiv.innerHTML = '<button class="avatar">&nbsp;</button>'+obj.name;
    return myDiv;
}


function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        elmnt.style.position = 'absolute';
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        elmnt.style.position = 'reset'; /*todo*/
    }
}