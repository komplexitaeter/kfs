var workbenchGlobal;

class Workbench {
    constructor() {
    }
    setContext(implParam, stationId) {
        /*
        Konstruktor:
            (beim Aufruf werden Canvasobject, Toolbox und Instruction resettet
            , es ist erstmal der Zustand: Kein Item in Arbeit
            , merkt sich um welche Station id es grade geht)

          */

        this.implParam = implParam;
        this.stationId = stationId;
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



    /*

     StartWorkOnItem:
     (stellt das aktuelle Schiff entsprechend der Arbeitsstation dar und
     registriert Eventhandler, damit am Schiff gearbeitet werden kann
     ,merkt sich an welchem Item-Id grade gearbeitet wird
     )
     - ID des Items
     - SVG welches den aktuellen Stand des Schiffs repräsentiert

     FinishWork:
     (Prüft, ob der Arbeitschritt erfolgreich abgeschlossen wurde
     , wenn ja wird analog Construktor alle resettet)
     -> Erfolg: liefert SVG des aktuellen Stand des Schiffs nach dem Bearbeitungsschritt
     -> Misserfolg: Anweisung an den Anwender, was das Problem ist

     IsItemInProcess
     - ID des Items
     -> liefert True, wenn Item grade in Arbeit ist, sonst false

     GetThumbnailSvg
     -> liefert SVG, welches den aktuelen Arbeitsbereich repräsentiert

      */
}

function loadWorkbench(implName, implParam, stationId) {

    if (workbenchGlobal == null || workbenchGlobal.getStationId() != stationId) {

        switch (implName) {
            case "DefaultDrawWorkbench":
                workbenchGlobal = new DefaultDrawWorkbench();
                break;
        }
        workbenchGlobal.setContext(implParam, stationId);

    }
}