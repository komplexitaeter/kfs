<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Check-In Kanban Ship Building Flow Simulation Online</title>
    <script src="./lib/fabric.js"></script>
    <script src="./script/flow.js"></script>
    <link rel="stylesheet" type="text/css" href="./style.css">
</head>
<body onload="loadCheckIn()">

<div id="share" class="display_block">
    <input type="text" id="link" type="text" width="auto" readonly />
    <button onclick="copyContent('link')">Link kopieren</button>
</div>

<div id="attendees_list" class="display_block">
    <input type="text" id="current_user" type="text" placeholder="Type in your name!" onclick="editName()" />
    <input type="text" type="text" value="unknown participant" readonly />
    <input type="text" type="text" value="unknown participant" readonly />
    <input type="text" type="text" value="unknown participant" readonly />
</div>


<div id="start_simulation" class="display_block">
    <input type="submit" value="Simulation starten" onclick="create_simulation()" disabled/>
</div>

</body>
</html>