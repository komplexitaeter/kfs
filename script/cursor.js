let cursorClientX=0;
let cursorClientY=0;
let postIntervalHandle;
let cursorSimulationId;
let cursorSessionKey;
let animationIntervalHandles = new Object();
let cursorAvatarCode;


function initializeCursor(simulationId, sessionKey) {
    cursorSimulationId = simulationId;
    cursorSessionKey = sessionKey;
    postCursorPos(simulationId, sessionKey); /* set to off on server */
    document.addEventListener("mousemove", cursorMoved);
    document.addEventListener("keydown", onKeyDown);
}

function cursorMoved(e) {
    cursorClientX=e.clientX-2;
    cursorClientY=e.clientY;
}

function onKeyDown(e) {
    if (e.key === "Control") {
        if (postIntervalHandle==null) {
            setCursorPostOn(cursorSimulationId, cursorSessionKey);
        }
        else {
            setCursorPostOff(cursorSimulationId, cursorSessionKey);
        }
    }
}

function setCursorPostOn(simulationId, sessionKey) {
    if (postIntervalHandle!=null) {
        clearInterval(postIntervalHandle);
        postIntervalHandle=null;
    }
    postCursorPosInterval(simulationId, sessionKey);
    postIntervalHandle = setInterval(postCursorPosInterval, 300, simulationId, sessionKey );
    document.body.parentElement.classList.add('reset-all-cursors', 'cursor_cur_'+cursorAvatarCode);
}

function setCursorPostOff(simulationId, sessionKey) {
    clearInterval(postIntervalHandle);
    postIntervalHandle=null;
    postCursorPos(simulationId, sessionKey); /* set to off on server */
    document.body.parentElement.classList.remove('reset-all-cursors','cursor_cur_'+cursorAvatarCode);
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

function displayCursor(sessionKey, cursorX, cursorY, avatar_code) {
    let cursorDiv=document.getElementById('cursor_'+sessionKey);

    if (animationIntervalHandles[sessionKey]!=null) {
        clearInterval(animationIntervalHandles[sessionKey]);
        animationIntervalHandles[sessionKey]=null;
    }

    if (cursorSessionKey!=sessionKey) {

        if (cursorX == null || cursorY == null) {
            if (cursorDiv != null) {
                cursorDiv.remove();
            }
        } else {
            if (cursorDiv == null) {
                cursorDiv = document.createElement('div');
                cursorDiv.id = 'cursor_' + sessionKey;
                cursorDiv.style.left = Math.round(window.innerWidth * cursorX).toString() + 'px';
                cursorDiv.style.top = Math.round(window.innerHeight * cursorY).toString() + 'px';
                cursorDiv.classList.add('cursor', 'cursor_' + avatar_code);
                document.body.appendChild(cursorDiv);
            }
            animationIntervalHandles[sessionKey] = setInterval(animateCursor, 5, sessionKey, cursorX, cursorY, cursorDiv);
        }
    }
    else {
        cursorAvatarCode = avatar_code;
    }
}

function animateCursor(sessionKey, cursorX, cursorY, cursorDiv) {

    const curX = cursorDiv.getBoundingClientRect().left;
    const curY = cursorDiv.getBoundingClientRect().top;
    const toX = Math.round(window.innerWidth * cursorX);
    const toY = Math.round(window.innerHeight * cursorY);

    let newX;
    if (Math.abs(toX - curX) >= 40 ) newX = Math.round(curX + (toX - curX)/40);
    else newX = curX + Math.sign(toX - curX);

    let newY;
    if (Math.abs(toY - curY) >= 40 ) newY = Math.round(curY + (toY - curY)/40);
    else newY = curY + Math.sign(toY - curY);

    cursorDiv.style.left = newX.toString() +'px';
    cursorDiv.style.top = newY.toString() +'px';

    if (newX==toX && newY==toY) {
        clearInterval(animationIntervalHandles[sessionKey]);
        animationIntervalHandles[sessionKey] = null;
    }
}