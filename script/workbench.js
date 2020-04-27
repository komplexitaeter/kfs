var workbench;

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

        fCanvas.clear();

    }
    getStationId() {
        return this.stationId;
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

    if (workbench == null || workbench.getStationId() != stationId) {

        switch (implName) {
            case "DefaultDrawWorkbench":
                workbench = new DefaultDrawWorkbench();
                break;
        }
        workbench.setContext(implParam, stationId);

    }
}