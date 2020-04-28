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
                top: 0 * fCanvas.height,
                left: (fCanvas.width- (fCanvas.height / that.paths.height)*that.paths.width)/2,
                scaleY: 1.15 * (fCanvas.height / that.paths.height),
                scaleX: 1.15 * (fCanvas.height / that.paths.height),
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
             let scale = options.viewBoxHeight / fCanvas.height;


                that.item = fabric.util.groupSVGElements(objects, options);

                scale = fCanvas.height / options.height;


                that.item.set({
                    left: (fCanvas.width- scale*that.item.width)/2,
                    top: (fCanvas.height- scale*that.item.height)/2,

                    scaleY: scale,
                    scaleX: scale,
                });




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