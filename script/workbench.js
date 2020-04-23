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


        this.canvas = new fabric.Canvas('workbench_canvas');
        //this.canvas.setDimensions({width: '88.3%', height: '100%'}, {cssOnly: true});

        let width = document.getElementById('workarea').clientWidth * 0.78;
        let height = document.getElementById('workarea').clientHeight;
        this.canvas.setHeight(height);
        this.canvas.setWidth( width);

        window.addEventListener('resize', resize);

        this.canvas.add(new fabric.Rect({
            top: 10, left: 10, width: 15, height: 15, fill: 'blue'
        }));

    }
    getStationId() {
        return this.stationId;
    }
    resize() {
        let width = document.getElementById('workarea').clientWidth * 0.78;
        let height = document.getElementById('workarea').clientHeight;

        let zoomfactor = width / this.canvas.getWidth();
        console.log('zoom:' + zoomfactor);

        this.canvas.setHeight(height);
        this.canvas.setWidth( width);
        this.canvas.setZoom(zoomfactor);
        this.canvas.calcOffset();
        this.canvas.renderAll();    }

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

function resize(e) {
    workbench.resize();
}