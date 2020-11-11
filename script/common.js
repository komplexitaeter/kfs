/*>>>DOM:
*
* observer.observe(document.body, {attributes: true, childList: true, subtree: true});
* document.body.addEventListener('dom-changed', e => console.log(e));
*/
const observer = new MutationObserver( list => {
    const evt = new CustomEvent('dom-changed', {detail: list});
    document.body.dispatchEvent(evt)
});
/*DOM<<<*/

function addStyleClass(element, className) {
    if (!element.classList.contains(className)) element.classList.add(className);
}

function removeStyleClass(element, className) {
    if (element.classList.contains(className)) element.classList.remove(className);
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