class DefaultDrawWorkbench extends Workbench {
    setContext(implParam, stationId) {
        super.setContext(implParam, stationId);

        fabric.loadSVGFromURL('./src/ship_template/paths', function (objects, options) {
            var paths = fabric.util.groupSVGElements(objects, options);
            paths.set({
                top: 0.1 * fCanvas.height,
                left: 0.1 * fCanvas.width,
                scaleY: 0.8 * (fCanvas.height / paths.height),
                scaleX: 0.8 * (fCanvas.width / paths.width)
            });
            fCanvas.add(paths);
            fCanvas.calcOffset();
            fCanvas.renderAll();
        });
    }
}