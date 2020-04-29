function loadStats(){
    setInterval(function(){
        refreshStats(getSimulationId(),getSessionKey());
    }, 500);
}

function refreshStats(simulation_id, session_key){

    const url ='./get_stats.php?simulation_id='+simulation_id+'&session_key='+session_key;
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            switch(myJson.status_code) {
                case "RUNNING":
                    location.href = './board.php?simulation_id='+simulation_id;
                    break;
                case "NO_SIMULATION":
                    // alert("The required simulation ID does not exit. You will be taken to the home page.");
                    location.href = './index.php';
                    break;
                case "CHECKIN":
                    location.href = './checkin.php?simulation_id='+simulation_id;
                    break;
                case "STATS":
                    displayRoundSwitch(myJson);
                    displayRoundData(myJson);
                    displayDetails(myJson);
                    break;
                default:
                //alert("Undefined status_code - this is an error. Sorry.");
            }
            document.body.style.visibility = 'visible';
        });
}

function backToSimulationPressed() {
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&status_code=RERUNNING';
    fetch(url);
}

function displayRoundSwitch(myJson) {
    let roundswitch = document.getElementById('roundswitch');
    if (roundswitch.childElementCount==0) {
        let i=0;
        myJson.rounds.forEach( item => {
            i++;
            let round = document.createElement('option')
            round.value = item.round_id;
            round.id = 'roundswitch-'+item.round_id;
            round.text = 'Round '+i+' - '+  item.round_description;
            roundswitch.appendChild(round);
        });
    }
    roundswitch.value = myJson.stats_round_id;
}

function displayRoundData(myJson) {
    document.getElementById('total_time_s').textContent = sec2time(myJson.round_data.total_time_s);
    document.getElementById('total_items_cnt').textContent = myJson.round_data.total_items_cnt;
    document.getElementById('total_money_earned').textContent = myJson.round_data.total_money_earned+' €';
    document.getElementById('avg_cycle_time').textContent = sec2time(myJson.round_data.avg_cycle_time);
    document.getElementById('first_item_cycle_time').textContent = sec2time(myJson.round_data.first_item_cycle_time);
    document.getElementById('last_item_cycle_time').textContent = sec2time(myJson.round_data.last_item_cycle_time);
    document.getElementById('avg_throughput').textContent = myJson.round_data.avg_throughput;
}

function displayDetails(myJson) {
    let hidden_id= document.getElementById('round_details_round_id')
    let tbl = document.getElementById('round_details');

    if (hidden_id.value != myJson.stats_round_id) {
        /* remember what rounds detail data is displayed  */
        hidden_id.value = myJson.stats_round_id;

        /* go through all table data rows and delete them */
        let rows = Array.from(tbl.getElementsByTagName('tr'));
        rows.forEach(row => {
            if (!row.classList.contains('detailTH')) {
                row.remove();
            }
        });

        /* go through all stats details and create a table row for each */

        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');

        td1.textContent = 'a';
        td2.textContent = 'b';
        td3.textContent = 'c';

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);

        tbl.appendChild(tr);

    }
}

function changeRound(roundswitch) {
    const url = './update_simulation.php?simulation_id='+getSimulationId()+'&stats_round_id='+roundswitch.options[roundswitch.selectedIndex].value;
    fetch(url);
}