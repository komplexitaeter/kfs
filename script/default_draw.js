class DefaultDrawWorkbench extends Workbench {
    setContext(implParam, stationId) {
        super.setContext(implParam, stationId);

        this.colorArray = [
            {colorName: "green", colorCode: "#2ecc71"},
            {colorName: "blue", colorCode: "#3498db"},
            {colorName: "yellow", colorCode: "#f1c40f"},
            {colorName: "red", colorCode: "#e74c3c"},
            {colorName: "brown", colorCode: "#dea06e"},
            {colorName: "pink", colorCode: "#ff97e3"},
            {colorName: "black", colorCode: "#656565"},
            {colorName: "white", colorCode: "#ffffff"},
        ];
        /*set the tools back to their default position on station change*/
        document.getElementById('width-2').checked=true;
        document.getElementById("color-1").checked=true;
        let drawingLineWidthEl = document.getElementById('widthPicker');
        let drawingColorEl = document.getElementById("colorPicker");

        fCanvas.freeDrawingBrush.color = drawingColorEl.colorValue.value;
        fCanvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.widthValue.value, 10) || 1;


    }

    initiate(){
        super.initiate();

        var that = this;
        fCanvas.isDrawingMode = true;
        fCanvas.freeDrawingCursor = "crosshair";
        let drawingLineWidthEl = document.getElementById('widthPicker');
        let drawingColorEl = document.getElementById("colorPicker");

        fCanvas.freeDrawingBrush.color = drawingColorEl.colorValue.value;
        fCanvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.widthValue.value, 10) || 1;

        fabric.loadSVGFromURL('./src/ship_template/ship_template.svg', function (objects, options) {
            objects.forEach(obj =>{
                if (obj.id == that.implParam.path_id) {
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
                fCanvas.clear();
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
            fCanvas.renderAll();
        });

        document.getElementById("tools").appendChild(document.getElementById("toolbox_default_draw"));
        document.getElementById("toolbox_default_draw").className = "visible_div";

    }

    start() {
        super.start();

        let that = this;
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
            fCanvas.renderAll();
        });


        /*
         * Randomize items work instruction
         */
        let p = document.getElementById("instruction");
        if(p == null) {
            p = document.createElement("p");
            p.id = "instruction";
            if (this.instructionItemId == null || this.instructionItemId != this.itemId) {
                this.instructionItemId = this.itemId;
                let color = this.colorArray[Math.floor(Math.random()*7)]; //ignore index "8" because it's white and hence invisible
                this.instructionText = this.implParam.instruction.replace("[COLOR]","<b style='color:"+color.colorCode+";'>"+color.colorName+"</b>");
            }
            p.innerHTML = this.instructionText;
            document.getElementById("workbench_" + this.itemId).appendChild(p);
        }
    }

    finish() {
        if (this.objectsCountOrig == fCanvas.getObjects().length) {
            return ['FAIL','No work has been done!'];
        }
        else {
            super.finish();
            fCanvas.getObjects().length;
            let svg_code;
            fCanvas.remove(this.paths);
            svg_code = fCanvas.toSVG();
            fCanvas.clear();
            fCanvas.add(this.paths);
            return ['SUCCESS', svg_code];
        }
    }
}