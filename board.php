<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Board Kanban Ship Building Flow Simulation Online</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/3.6.3/fabric.min.js"></script>
    <script src="./script/flow.js"></script>

    <script src="./script/workbench.js"></script>
    <script src="./script/default_draw.js"></script>

    <script src="./script/board.js"></script>


    <link rel="stylesheet" type="text/css" href="./board.css">
</head>
<body onload="loadBoard()">

<div id="backlog">
    <div class="station_label">Backlog</div>
</div>
<div id="controls">
    <button id="play" class="control_button button_play" onclick="pressPlay()">&nbsp;</button>
    <button id="pause" class="control_button button_pause" onclick="pressPause()">&nbsp;</button>
    <button id="reset" class="control_button button_reset" onclick="pressReset()">&nbsp;</button>
    <div id="clock" class="clock_display">&nbsp;</div>
    <button id="stats" class="control_button button_stats" onclick="pressStats()">&nbsp;</button>
</div>
<div id="observers">
    <div class="drop_target"  ondrop="drop(event)" ondragover="allowDrop(event)"></div>
</div>
<div id="stations">

    <div id="done" class="station">&nbsp;
    </div>
</div>
<div id="workbench" class="">&nbsp;</div>

<!-- hidden divs containing the different toolboxes for the implementations and loading on instancing -->
<div id="toolbox_default_draw" class="invisible_div">
    <div style="display: inline-block; margin-left: 10px" >
        <div id="drawing-mode-options">
            <button id="clear-canvas" class="tools_button" onclick="clearDrawing(event);">CLEAR</button>
            <button id="cancel-action" class="tools_button" onclick="cancelLastAction(event);">UNDO</button>
            <br/>
            <form name="widthPicker" id="widthPicker" class="custom-radios" onchange="changeDrawingLineWidth(event);">
                <div >
                    <input type="radio" id="width-1" name="widthValue" value="1" checked>
                    <label for="width-1">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="width-2" name="widthValue" value="5">
                    <label for="width-2">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="width-3" name="widthValue" value="10">
                    <label for="width-3">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="width-4" name="widthValue" value="15">
                    <label for="width-4">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="width-5" name="widthValue" value="20">
                    <label for="width-5">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>
            </form>
            <br/>
<!------------------------------------->
<!-------- Colorpicker form------------>
<!------------------------------------->

            <form name="colorPicker" id="colorPicker" class="custom-radios" onchange="changeDrawingColor(event);">
                <div >
                    <input type="radio" id="color-1" name="colorValue" value="#2ecc71" checked>
                    <label for="color-1">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-2" name="colorValue" value="#3498db">
                    <label for="color-2">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-3" name="colorValue" value="#f1c40f">
                    <label for="color-3">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-4" name="colorValue" value="#e74c3c">
                    <label for="color-4">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-5" name="colorValue" value="#dea06e">
                    <label for="color-5">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-6" name="colorValue" value="#ff97e3">
                    <label for="color-6">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-7" name="colorValue" value="#656565">
                    <label for="color-7">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>

                <div >
                    <input type="radio" id="color-8" name="colorValue" value="#ffffff">
                    <label for="color-8">
      <span>
        <img src="./src/checked.png" alt="Checked Icon" />
      </span>
                    </label>
                </div>
            </form>
        </div>
    </div>
</div>

</body>
</html>