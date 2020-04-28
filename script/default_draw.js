class DefaultDrawWorkbench extends Workbench {
    setContext(implParam, stationId) {
        super.setContext(implParam, stationId);
    }

    initiate(){
        super.initiate();
        var that = this;
        fabric.loadSVGFromURL('./src/ship_template/ship_template.svg', function (objects, options) {
            that.paths = fabric.util.groupSVGElements(objects, options);
            that.paths.set({
                top: 0.05 * fCanvas.height,
                left: 0.05 * fCanvas.width,
                scaleY: 1 * (fCanvas.height / that.paths.height),
                scaleX: 1 * (fCanvas.width / that.paths.width),
                opacity: 0.6
            });

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

            fCanvas.add(that.paths);
            fCanvas.calcOffset();
            fCanvas.renderAll();
        });
    }

    start(svg_code) {
        super.start(svg_code);
        if(svg_code) {
            var that = this;
            fabric.loadSVGFromString(svg_code, function (objects, options) {
                that.item = fabric.util.groupSVGElements(objects, options);
                /*that.item.set({
                    top: 0.1 * fCanvas.height,
                    left: 0.1 * fCanvas.width,
                    scaleY: 0.8 * (fCanvas.height / that.item.height),
                    scaleX: 0.8 * (fCanvas.width / that.item.width)
                });*/
                fCanvas.add(that.item);
                fCanvas.calcOffset();
                fCanvas.renderAll();
            });
        }
    }

    finish() {
        super.finish();
        let svg_code;
        fCanvas.remove(this.paths);
        svg_code = fCanvas.toSVG();
        fCanvas.clear();
        fCanvas.add(this.paths);
        return svg_code;
    }
}