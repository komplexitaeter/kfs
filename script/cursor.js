let cursorClientX=0;
let cursorClientY=0;
let postIntervalHandle;
let cursorSimulationId;
let cursorSessionKey;
let animationIntervalHandles = new Object();


function initializeCursor(simulationId, sessionKey) {
    cursorSimulationId = simulationId;
    cursorSessionKey = sessionKey;

    document.addEventListener("mousemove", cursorMoved);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
}

function cursorMoved(e) {
    cursorClientX=e.clientX-3;
    cursorClientY=e.clientY-1;
}

function onKeyDown(e) {
    if (e.key === "Alt") {
        setCursorPostOn(cursorSimulationId, cursorSessionKey);
    }
}

function onKeyUp(e) {
    if (e.key === "Alt") {
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

    if (animationIntervalHandles[sessionKey]!=null) {
        clearInterval(animationIntervalHandles[sessionKey]);
        animationIntervalHandles[sessionKey]=null;
    }

    if (cursorX==null || cursorY==null) {
        if (cursorDiv!=null) {
            cursorDiv.remove();
        }
    }
    else {
        if (cursorDiv==null) {
            cursorDiv = document.createElement('div');
            cursorDiv.id = 'cursor_'+sessionKey;
            cursorDiv.style.left = Math.round(window.innerWidth * cursorX).toString() +'px';
            cursorDiv.style.top = Math.round(window.innerHeight * cursorY).toString() +'px';
            cursorDiv.classList.add('cursor');
            document.body.appendChild(cursorDiv);
        }
        animationIntervalHandles[sessionKey] = setInterval(animateCursor, 5, sessionKey, cursorX, cursorY, cursorDiv);
    }
}

function animateCursor(sessionKey, cursorX, cursorY, cursorDiv) {

    const curX = cursorDiv.getBoundingClientRect().left;
    const curY = cursorDiv.getBoundingClientRect().top;
    const toX = Math.round(window.innerWidth * cursorX);
    const toY = Math.round(window.innerHeight * cursorY);

    let newX;
    if (Math.abs(toX - curX) >= 30 ) newX = Math.round(curX + (toX - curX)/30);
    else newX = curX + Math.sign(toX - curX);

    let newY;
    if (Math.abs(toY - curY) >= 30 ) newY = Math.round(curY + (toY - curY)/30);
    else newY = curY + Math.sign(toY - curY);

    cursorDiv.style.left = newX.toString() +'px';
    cursorDiv.style.top = newY.toString() +'px';

    if (newX==toX && newY==toY) {
        clearInterval(animationIntervalHandles[sessionKey]);
        animationIntervalHandles[sessionKey] = null;
    }
}