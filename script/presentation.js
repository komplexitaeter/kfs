let presentationSimulation_id;
let presentationSession_key;

function initializePresentation(simulation_id, session_key){
    presentationSimulation_id = simulation_id;
    presentationSession_key = session_key
}

function toggleParentDomVisibility(e){
   let url = "./update_dom.php"+
       "?simulation_id="+presentationSimulation_id+
       "&dom_id="+e.target.parentElement.id+
       "&action=toggle_visibility";
    fetch(url).then();
    console.log(url);
}

function displayPresentation(domList, role_code){

    let toggles = Array.from(document.getElementsByClassName("visibility_toggle"));
    toggles.forEach( dom => {
           dom.onclick = toggleParentDomVisibility;
           if(role_code === "OBSERVER") {
               dom.parentElement.classList.remove("is_facilitator");
           }
           if(role_code === "FACILITATOR"){
               dom.parentElement.classList.add("is_facilitator");
           }
    });

    domList.forEach( currentDom => {
        let targetDom = document.getElementById(currentDom.dom_id);

        if((targetDom.classList.contains("dom_hidden"))&&(currentDom.visibility === "1")) {
            targetDom.classList.remove("dom_hidden");
            targetDom.classList.add("dom_visible");
        }
        if((targetDom.classList.contains("dom_visible"))&&(currentDom.visibility === "1")) {
            return 0;
        }
        if((targetDom.classList.contains("dom_visible"))&&(currentDom.visibility === "0")) {
            targetDom.classList.remove("dom_visible");
            targetDom.classList.add("dom_hidden");
        }
        if((targetDom.classList.contains("dom_hidden"))&&(currentDom.visibility === "0")) {
            return 0;
        }
    });

}