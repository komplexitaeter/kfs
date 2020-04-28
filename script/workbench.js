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

    setCurrentItem(item_id, item_svg){
        if(this.itemId != item_id){
            this.itemId = item_id;
            this.start(item_svg);
        }
    }

    disableWorkbench(){
        if(document.getElementById("locked_div") == null) {
            let lockedDiv = document.createElement("div");
            lockedDiv.classList.add("locked_div");
            lockedDiv.id = "locked_div";
            document.getElementById('workbench').appendChild(lockedDiv);
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
            fCanvas.clear();
    }

    finish(){
        this.itemId = null;
    }

    start(item_svg){
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