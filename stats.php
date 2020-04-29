<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Board Kanban Ship Building Flow Simulation Online</title>

    <script src="./script/flow.js"></script>
    <script src="./script/board.js"></script>
    <script src="./script/stats.js"></script>


    <link rel="stylesheet" type="text/css" href="./stats.css">
</head>
<body onload="loadStats()">

<button onclick="backToSimulationPressed()">Back to Simulation</button>

<select id="roundswitch" onchange="changeRound(this)" ></select>

<h2>Round Data</h2>
<table>
    <tr>
        <th>Total Duration:</th>
        <td id="total_time_s"></td>
    </tr>
    <tr>
        <th>Total Money earned:</th>
        <td id="total_money_earned"></td>
    </tr>
    <tr>
        <th>Total items completed:</th>
        <td id="total_items_cnt"></td>
    </tr>
    <tr>
        <th>Average Throughput (items/min):</th>
        <td id="avg_throughput"></td>
    </tr>
    <tr>
        <th>Average Cycle Time:</th>
        <td id="avg_cycle_time"></td>
    </tr>
    <tr>
        <th>First Item Cycle Time:</th>
        <td id="first_item_cycle_time"></td>
    </tr>
    <tr>
        <th>Last Item Cycle Time:</th>
        <td id="last_item_cycle_time"></td>
    </tr>
</table>

<h2>Details</h2>
<input type="hidden" id="round_details_round_id" value="">
<table id="round_details">
    <tr class="detailTH">
        <th>Minute</th>
        <th>Items completed</th>
        <th>Average Cycle Tine</th>
    </tr>
    <tr>
        <td>0</td>
        <td>6</td>
        <td>0:01:02</td>
    </tr>
    <tr>
        <td>1</td>
        <td>11</td>
        <td>0:01:02</td>
    </tr>
    <tr>
        <td>2</td>
        <td>12</td>
        <td>0:01:59</td>
    </tr>
    <tr>
        <td>3</td>
        <td>11</td>
        <td>0:05:45</td>
    </tr>
    <tr>
        <td>4</td>
        <td>11</td>
        <td>0:08:32</td>
    </tr>
    <tr>
        <td>5</td>
        <td>12</td>
        <td>0:11:02</td>
    </tr>
</table>


</body>
</html>