/*>>>DOM:
* add to onLoadXYZ:
* observer.observe(document.body, {attributes: true, childList: true, subtree: true});
* document.body.addEventListener('dom-changed', e => console.log(e));

const observer = new MutationObserver( list => {
    const evt = new CustomEvent('dom-changed', {detail: list});
    document.body.dispatchEvent(evt)
});
DOM<<<*/

function addStyleClass(element, className) {
    if (!element.classList.contains(className)) element.classList.add(className);
}

function removeStyleClass(element, className) {
    if (element.classList.contains(className)) element.classList.remove(className);
}

function toggleStyleClass(element, addClassName, removeClassName) {
    removeStyleClass(element, removeClassName);
    addStyleClass(element, addClassName);
}

function enableElement(element) {
    if (element.disabled) element.disabled = false;
}

function disableElement(element) {
    if (!element.disabled) element.disabled = true;
}

function setSrc(element, srcPath, srcFile) {
    if (!element.src.includes(srcFile)) element.src = srcPath+srcFile;
}

function setTextContent(element, textContent) {
    if ((!element.textContent.includes(textContent))
       | Math.abs(element.textContent.length - textContent.length) > 2
    ) element.textContent = textContent;
}

function setValue(element, value) {
    if (!element.value.includes(value)) element.value = value;
}

function getSessionKey(){
    let session_key = localStorage.getItem('SESSION_KEY');
    if (session_key === null) {
        let uid = (Date.now().toString(36) + Math.random().toString(36).substr(2, 8)).toUpperCase();
        localStorage.setItem('SESSION_KEY', uid);
        session_key=uid;
    }
    return session_key;
}

function getSimulationId() {
    let url = new URL(window.location.href);
    return url.searchParams.get('simulation_id');
}

function getSimulationKey(){
    let url = new URL(window.location.href);
    return url.searchParams.get('simulation_key');
}

function getFacilitate(){
    let url = new URL(window.location.href);
    return  url.searchParams.get('facilitate');
}

function toggleAccessControl(role){
    let accessControlDivs = Array.from(document.getElementsByClassName("access_control"));
    if(role === "FACILITATOR"){
        accessControlDivs.forEach( div => {
            addStyleClass(div, "is_facilitator");
        });
        setCursorPermission(true);
    }
    if(role === "OBSERVER"){
        accessControlDivs.forEach( div => {
            removeStyleClass(div, "is_facilitator");
        });
        setCursorPermission(false);
    }
}

function updateAttendeeRole(e) {
    /*reminder: option.id = session_key+"_"+role; */
    let url = './update_attendee.php?'
        +"session_key="+e.target.id.split('_')[0]
        +"&role_code="+e.target.id.split('_')[1]
        +"&simulation_id="+getSimulationId();
    fetch(url).then();
}