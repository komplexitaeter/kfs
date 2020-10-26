var workbenchGlobal;

class Workbench {

    constructor() {
    }

    setContext(implParam, stationId) {

        this.stationId = stationId;

        if (implParam != null) {
            this.implParam = JSON.parse(implParam);
        }
        else {
            this.implParam = null;
        }

        this.initiate();

    }
    getStationId() {
        return this.stationId;
    }

    setCurrentItem(item_id){
        if(this.itemId !== item_id){
            this.initiate();
            this.itemId = item_id;
            this.start();
        }
    }

    disableWorkbench(state){
    let lockedDiv = document.getElementById("locked_div");
        if(lockedDiv == null) {
            lockedDiv = document.createElement("div");
            lockedDiv.classList.add("locked_div");
            lockedDiv.id = "locked_div";
            document.getElementById('workbench').appendChild(lockedDiv);
        }

/***Disable Workbench and show different image depending on state
 * Note: Removing a class that does not exist, does NOT throw an error****/
        switch(state) {
            case "coffee_break":
                lockedDiv.classList.add("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("none");
                break;
            case "simulation_paused":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.add("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("none");
                break;
            case "pull_ready":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.add("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("none");
                break;
            case "unattended":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.add("unattended");
                lockedDiv.classList.remove("none");
                break;
            default:
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.add("none");
                break;
        }
    }

    enableWorkbench(){
        if(document.getElementById("locked_div") != null) {
            document.getElementById("locked_div").remove();
        }
    }

    unsetItem(){
        if(this.itemId != null){
            this.itemId = null;
            this.initiate();
        }
    }

    initiate(){
    }

    finish(){
    }

    start(){
    }

    setHash(hash) {
        this.hash = hash;
    }

    getHash() {
        return this.hash;
    }

}

function loadWorkbench(implName, implParam, stationId) {

    if (workbenchGlobal == null || workbenchGlobal.getStationId() != stationId) {

        switch (implName) {
            case "DefaultDrawWorkbench":
                workbenchGlobal = new DefaultDrawWorkbench();
                break;
            default:
                workbenchGlobal = new Workbench();
        }
        workbenchGlobal.setContext(implParam, stationId);

    }
}