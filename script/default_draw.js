class DefaultDrawWorkbench extends Workbench {
    setContext(implParam, stationId) {
        super.setContext(implParam, stationId);
    }

    initiate(){
        super.initiate();
        var that = this;
        fCanvas.isDrawingMode = true;
        fCanvas.freeDrawingCursor = "crosshair";
        let drawingLineWidthEl = document.getElementById('drawing-line-width');
        let drawingColorEl = document.getElementById("color-1");
        fCanvas.freeDrawingBrush.color = drawingColorEl.value;
        fCanvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;

        fabric.loadSVGFromURL('./src/ship_template/ship_template.svg', function (objects, options) {
            objects.forEach(obj =>{
                if (obj.id == that.implParam.path_id) {
                    obj.strokeWidth = 3;
                    obj.strokeDashArray = [7,4];
                    obj.fill = 'rgba(0,0,255,0.4)';
                }
                else {
                    obj.strokeWidth = 1;
                    obj.strokeDashArray = [5,4];
                }
            });

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

    start(svg_code) {
        super.start(svg_code);

        if(svg_code) {
            var that = this;
            fabric.loadSVGFromString(svg_code, function (objects, options) {

                that.item = fabric.util.groupSVGElements(objects, options);

                let scale = fCanvas.height / options.height;


                that.item.set({
                    top: (fCanvas.height- scale*that.item.height)/2,
                    left: (fCanvas.width- scale*that.item.width)/2,
                    scaleY: scale,
                    scaleX: scale
                });

                fCanvas.add(that.item);

                fCanvas.calcOffset();
                fCanvas.renderAll();
            });
        }

        /*
        * remember the number of objects on canvas for a later check if
        * som work has been done
        * */
        this.objectsCount = fCanvas.getObjects().length;

        /*
         * workaround: fixes a scaling issue, when only one path was
         * drawn in the first station
         * */
        if (this.objectsCount==1) {
            let pxl = new fabric.Circle(0,'white',1,1);
            fCanvas.add(pxl);
            this.objectsCount++;
        }

    }

    finish() {
        if (this.objectsCount == fCanvas.getObjects().length) {
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