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
</div>
<div id="observers">
    <div class="drop_target"  ondrop="drop(event)" ondragover="allowDrop(event)"></div>
</div>
<div id="stations">

    <div id="done" class="station">&nbsp;
    </div>
</div>
<div id="workbench" class="">&nbsp;</div>


</body>
</html>