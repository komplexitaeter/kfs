<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Check-In Kanban Ship Building Flow Simulation Online</title>
    <script src="./script/flow.js"></script>
    <link rel="stylesheet" type="text/css" href="./style.css">
</head>
<body onload="loadCheckIn()">

<div id="vertical_container">
    <div id="share" class="display_block">
        <input type="text" id="link" type="text" class="link_checkin" readonly />
        <button onclick="copyContent('link')" class="button_checkin">Link kopieren</button>
    </div>

    <div id="configurations" class="display_block">
            <label for="pick_configuration">Choose a configuration:</label>
            <select id="pick_configuration" onchange="switchConfiguration()">

            </select>
    </div>

    <div id="attendees_list" class="display_block">
       <div class="attendee" id="current_user"><button class="avatar">&nbsp;</button><input class="attendee_name" type="text" placeholder="Type in your name!"  maxlength="15" onchange="editNameCurrentUser()" onsubmit="editNameCurrentUser()" autocomplete="off" spellcheck="false" /><button id="flag_button" class="ready_button_active" onclick="switchCurrentUserReadyStatus()">&nbsp;</button></div>
    </div>



    <div id="start_simulation" class="display_block">
        <input id="start_simulation_button" type="submit" value="Simulation starten" onclick="startSimulation()" disabled/>
    </div>
</div>

</body>
</html>