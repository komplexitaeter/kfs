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
        fCanvas.clear();

    }
    getStationId() {
        return this.stationId;
    }

    getItemId(){
        return this.itemId;
    }

    setCurrentItem(item_id){
        if(this.itemId != item_id){
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
            case "no_wip":
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.add("no_work_in_progress");
                break;
            case "pause":
                lockedDiv.classList.remove("no_work_in_progress");
                lockedDiv.classList.add("simulation_paused");
                break;
            default:
                lockedDiv.classList.remove("no_work_in_progress");
                lockedDiv.classList.add("simulation_paused");
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
            this.initiate();
            this.itemId = null;
        }
    }

    initiate(){
        /* erase Canvas */
        fCanvas.clear();
    }

    finish(){
        this.itemId = null;
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