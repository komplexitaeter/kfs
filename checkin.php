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
   <div class="attendee" id="current_user"><button class="avatar">&nbsp;</button><input class="attendee_name" type="text" placeholder="Type in your name!" onchange="editNameCurrentUser()"/><button class="ready_button_active">&nbsp;</button></div>
</div>



<div id="start_simulation" class="display_block">
    <input type="submit" value="Simulation starten" onclick="startSimulation()" disabled/>
</div>

</body>
</html>