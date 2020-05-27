let cursorClientX=0;
let cursorClientY=0;
let postIntervalHandle;
let cursorSimulationId;
let cursorSessionKey;

function initializeCursor(simulationId, sessionKey) {
    cursorSimulationId = simulationId;
    cursorSessionKey = sessionKey;

    document.onmousemove = cursorMoved;
    window.onkeydown = keyDown;
    window.onkeyup = keyUp;
}

function cursorMoved(e) {
    cursorClientX=e.clientX;
    cursorClientY=e.clientY;
}

function keyDown(e) {
    if (e.key === "Control") {
        setCursorPostOn(cursorSimulationId, cursorSessionKey);
    }
}

function keyUp(e) {
    if (e.key === "Control") {
        setCursorPostOff(cursorSimulationId, cursorSessionKey);
    }
}

function setCursorPostOn(simulationId, sessionKey) {
    clearInterval(postIntervalHandle);
    postCursorPosInterval(simulationId, sessionKey);
    postIntervalHandle = setInterval(postCursorPosInterval, 500, simulationId, sessionKey );
}

function setCursorPostOff(simulationId, sessionKey) {
    clearInterval(postIntervalHandle);
    /* set cursor position to null */
    postCursorPos(simulationId, sessionKey);
}

function postCursorPosInterval(simulationId, sessionKey) {
    const cursorX = cursorClientX / window.innerWidth;
    const cursorY = cursorClientY / window.innerHeight;
    postCursorPos(simulationId, sessionKey, cursorX, cursorY);
}

function postCursorPos(simulationId, sessionKey, cursorX, cursorY) {
    let url
    if (cursorX == null || cursorY == null) {
        url = "./update_attendee.php?"
            + "simulation_id=" + simulationId
            + "&session_key=" + sessionKey
            + "&cursor_x="
            + "&cursor_y=";
    }
    else {
        url = "./update_attendee.php?"
            + "simulation_id=" + simulationId
            + "&session_key=" + sessionKey
            + "&cursor_x=" + cursorX
            + "&cursor_y=" + cursorY;
    }
    fetch(url).then();
}

function displayCursor(sessionKey, cursorX, cursorY, label) {
    let cursorDiv=document.getElementById('cursor_'+sessionKey);
    if (cursorX==null || cursorY==null) {
        if (cursorDiv!=null) {
            cursorDiv.remove();
        }
    }
    else {
        if (cursorDiv==null) {
            cursorDiv = document.createElement('div');
            cursorDiv.id = 'cursor_'+sessionKey;
            cursorDiv.classList.add('cursor');
            document.body.appendChild(cursorDiv);
        }
        cursorDiv.style.left = (window.innerWidth * cursorX).toString() +'px';
        cursorDiv.style.top = (window.innerHeight * cursorY).toString() +'px';
    }
}