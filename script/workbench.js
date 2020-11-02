let workbenchGlobal;
const gcLineWith = 6;

class Workbench {

    constructor(implParam, stationId) {

        this.colorArray = [
            {colorName: "green", colorCode: "#18d58b"},
            {colorName: "blue", colorCode: "#0c9eff"},
            {colorName: "yellow", colorCode: "#ffe573"},
            {colorName: "red", colorCode: "#ef0000"},
            {colorName: "brown", colorCode: "#dfa372"},
            {colorName: "pink", colorCode: "#ff78e7"},
            {colorName: "black", colorCode: "#484848"},
            {colorName: "purple", colorCode: "#a105b1"},
        ];

        if (implParam || stationId) {

            this.stationId = stationId;
            this.pending = true;
            this.status = 'none';

            if (implParam != null) {
                this.implParam = JSON.parse(implParam);
            } else {
                this.implParam = null;
            }

            this.initiate();

            let p_instruction = document.getElementById("instruction");
            if (p_instruction !== null) p_instruction.remove();

            /*set the tools back to their default position on station change*/
            document.getElementById("color-1").checked = true;
            let drawingColorEl = document.getElementById("colorPicker");

            fCanvas.freeDrawingBrush.color = drawingColorEl.colorValue.value;
            fCanvas.freeDrawingBrush.width = gcLineWith;

            this.disableWorkbench('pending');
        }
    }

    getStationId() {
        return this.stationId;
    }

    setCurrentItem(item_id, options){
        if(this.itemId !== item_id){
            this.itemId = item_id;
            this.options = options;
            this.initiate(true);
        }
    }

    unsetItem(){
        if(this.itemId != null){
            this.itemId = null;
            this.options = null;
            this.initiate();
        }
    }

    disableWorkbench(state) {

        let lockedDiv = document.getElementById("locked_div");
        if(lockedDiv == null) {
            lockedDiv = document.createElement("div");
            lockedDiv.classList.add("locked_div");
            lockedDiv.id = "locked_div";
            document.getElementById('workbench').appendChild(lockedDiv);
        }

        switch(state) {
            case "coffee_break":
                lockedDiv.classList.add("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("pending");
                lockedDiv.classList.remove("none");
                break;
            case "simulation_paused":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.add("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("pending");
                lockedDiv.classList.remove("none");
                break;
            case "pull_ready":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.add("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("pending");
                lockedDiv.classList.remove("none");
                break;
            case "unattended":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.add("unattended");
                lockedDiv.classList.remove("pending");
                lockedDiv.classList.remove("none");
                break;
            case "pending":
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.add("pending");
                lockedDiv.classList.remove("none");
                break;
            default:
                lockedDiv.classList.remove("coffee_break");
                lockedDiv.classList.remove("simulation_paused");
                lockedDiv.classList.remove("pull_ready");
                lockedDiv.classList.remove("unattended");
                lockedDiv.classList.remove("pending");
                lockedDiv.classList.add("none");
                break;
        }
    }

    enableWorkbench(){
        if(document.getElementById("locked_div") != null) {
            document.getElementById("locked_div").remove();
        }
    }

    setStatus(status) {
        this.status = status;
        if (!this.pending || status !== 'none') {
            if (status === 'none') {
                workbenchGlobal.enableWorkbench();
            } else {
                workbenchGlobal.disableWorkbench(status);
            }
        }
    }

    initiate(loadItem){
        /* erase Canvas */
        fCanvas.clear();

        let that = this;
        fCanvas.isDrawingMode = true;
        fCanvas.freeDrawingCursor = "crosshair";
        let drawingColorEl = document.getElementById("colorPicker");

        fCanvas.freeDrawingBrush.color = drawingColorEl.colorValue.value;
        fCanvas.freeDrawingBrush.width = gcLineWith;

        fabric.loadSVGFromURL('./src/ship_template/ship_template.svg', function (objects, options) {
            objects.forEach(obj =>{
                if (obj.id === that.implParam.path_id) {
                    obj.strokeWidth = 3;
                    obj.strokeDashArray = [7,4];
                    obj.fill = 'rgba(0,0,255,0.4)';
                }
                else {
                    obj.strokeWidth = 0;
                    obj.strokeDashArray = [5,4];
                }
            });

            /* remove old artifacts, just to be sure */
            if (that.paths!=null) {
                fCanvas.remove(that.paths);
                that.paths=null;
            }

            that.paths = fabric.util.groupSVGElements(objects, options);

            let scale = fCanvas.height / options.height;

            that.paths.set({
                top: (fCanvas.height- scale*options.height)/2,
                left: (fCanvas.width- scale*options.width)/2,
                scaleY: 1.15 * scale,
                scaleX: 1.15 * scale,
                opacity: 0.6
            });

            fCanvas.add(that.paths);
            fCanvas.calcOffset();
            fCanvas.renderAll.bind(fCanvas);

            document.getElementById("tools").appendChild(document.getElementById("toolbox_default_draw"));
            document.getElementById("toolbox_default_draw").className = "visible_div";

            if (loadItem) {
                that.start(that);
            }

        });

    }

    start(that) {

        fabric.loadSVGFromURL('./get_item_svg.php?item_id='+this.itemId, function (objects, options) {

            that.item = fabric.util.groupSVGElements(objects, options);

            let scale = fCanvas.height / options.height;


            that.item.set({
                top: (fCanvas.height- scale*that.item.height)/2,
                left: (fCanvas.width- scale*that.item.width)/2,
                scaleY: scale,
                scaleX: scale
            });

            fCanvas.add(that.item);

            /*
            * remember the number of objects on canvas for a later check if
            * som work has been done
            * */
            that.objectsCountOrig = fCanvas.getObjects().length;

            /*
             * workaround: fixes a scaling issue, when only two path was
             * drawn in the first station
             * 1 = Background
             * 2 = item_svg (even if it is empty)
             * */

            if (that.objectsCountOrig<=2) {
                let pxl = new fabric.Circle(0,'white',1,1);
                fCanvas.add(pxl);
                that.objectsCountOrig = fCanvas.getObjects().length;
            }

            fCanvas.calcOffset();
            fCanvas.renderAll.bind(fCanvas);


            /*
             * Randomize items work instruction
             */
            let p = document.getElementById("instruction");
            if(p == null) {
                p = document.createElement("p");
                p.id = "instruction";
                if (that.instructionItemId == null || that.instructionItemId !== that.itemId) {
                    that.instructionItemId = that.itemId;

                    let color;
                    if (that.options) {
                        color = that.getColorByName(that.options);
                    } else {
                        color = that.colorArray[Math.floor(Math.random() * 8)]; //ignore index "8" because it's white and hence invisible
                    }

                    that.instructionText = that.implParam.instruction.replace("[COLOR]","<b style='color:"+color.colorCode+"; background-color:"+color.colorCode+";'>XXXX</b>");
                }
                p.innerHTML = that.instructionText;
                document.getElementById("workbench_" + that.itemId).appendChild(p);
            }

            that.pending = false;
            that.setStatus(that.status);

        });

    }

    finish() {
        if (this.objectsCountOrig === fCanvas.getObjects().length) {
            return ['FAIL','No work has been done!'];
        }
        else {
            let svg_code;
            fCanvas.remove(this.paths);
            svg_code = fCanvas.toSVG();
            fCanvas.add(this.paths);
            fCanvas.renderAll.bind(fCanvas);
            this.pending = true;
            this.disableWorkbench('pending');
            return ['SUCCESS', svg_code];
        }
    }

    getColorByName(colorName) {
        for (let i=0; i<=this.colorArray.length; i++) {
            if (colorName && this.colorArray[i].colorName === colorName) {
                return this.colorArray[i];
            }
        }
        return this.colorArray[0];
    }
}

function loadWorkbench(implParam, stationId) {
    if (workbenchGlobal == null || workbenchGlobal.getStationId() !== stationId) {
        workbenchGlobal = new Workbench(implParam, stationId);
    }
}