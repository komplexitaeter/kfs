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
        <th>Total duration:</th>
        <td>3:12:09</td>
    </tr>
    <tr>
        <th>Total items completed:</th>
        <td>34</td>
    </tr>
    <tr>
        <th>Average Throughput (items/min):</th>
        <td>11.6</td>
    </tr>
    <tr>
        <th>Average Cycle Time:</th>
        <td>5:23:23</td>
    </tr>
    <tr>
        <th>First Item Cycle Time:</th>
        <td>1:01:10</td>
    </tr>
    <tr>
        <th>Last Item Cycle Time:</th>
        <td>8:31:56</td>
    </tr>
</table>

<h3>Details</h3>
<table>
    <tr>
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