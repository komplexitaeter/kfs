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
        if(this.lockedDiv == null) {
            this.lockedDiv = document.createElement("div");
            this.lockedDiv.classList.add("locked_div");
            document.getElementById('workbench').appendChild(this.lockedDiv);
        }
    }

    enableWorkbench(){
        if(this.lockedDiv) {
            this.lockedDiv.remove();
            this.lockedDiv = null;
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