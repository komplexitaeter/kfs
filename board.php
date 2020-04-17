<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Board Kanban Ship Building Flow Simulation Online</title>
    <script src="./lib/fabric.js"></script>
    <script src="./script/flow.js"></script>
    <script src="./script/board.js"></script>
    <link rel="stylesheet" type="text/css" href="./board.css">
</head>
<body onload="loadBoard()">


<div id="backlog">
    <div id="item_id" class="item">&nbsp;</div>
</div>
<div id="controls">&nbsp;</div>
<div id="observers" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
<div id="stations" ondrop="drop(event)" ondragover="allowDrop(event)">

    <div id="done" class="station">&nbsp;</div>
</div>
<div id="workspace" class="">&nbsp;</div>


</body>
</html>