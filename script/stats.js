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
    for (let i=0;i<2;i++)
    {
        let roundswitch = document.getElementById(i+'_round_switch');
        if (roundswitch.childElementCount == 0) {
            let i = 0;
            myJson.rounds.forEach(item => {
                i++;
                let round = document.createElement('option')
                round.value = item.round_id;
                round.id = i+'_round_switch-' + item.round_id;
                round.text = 'Round ' + i + ' - ' + item.round_description;
                roundswitch.appendChild(round);
            });
        }
        roundswitch.value = myJson.stats_round_id[i];
    }
}

function displayRoundData(myJson) {
    for (let i = 0; i < 2; i++) {
        document.getElementById(i+'_total_time_s').textContent = sec2time(myJson.round_data[i].total_time_s);
        document.getElementById(i+'_total_items_cnt').textContent = myJson.round_data[i].total_items_cnt;
        document.getElementById(i+'_total_money_earned').textContent = myJson.round_data[i].total_money_earned + ' €';
        document.getElementById(i+'_avg_cycle_time').textContent = sec2time(myJson.round_data[i].avg_cycle_time);
        document.getElementById(i+'_first_item_cycle_time').textContent = sec2time(myJson.round_data[i].first_item_cycle_time);
        document.getElementById(i+'_last_item_cycle_time').textContent = sec2time(myJson.round_data[i].last_item_cycle_time);
        document.getElementById(i+'_avg_throughput').textContent = myJson.round_data[i].avg_throughput;
    }
}

function displayDetails(myJson) {
    for (let i = 0; i < 2; i++) {

        let hidden_id = document.getElementById(i+'_round_details_round_id')
        let tbl = document.getElementById(i+'_round_details');

        if (hidden_id.value != myJson.stats_round_id[i]) {
            /* remember what rounds detail data is displayed  */
            hidden_id.value = myJson.stats_round_id[i];

            /* go through all table data rows and delete them */
            let rows = Array.from(tbl.getElementsByTagName('tr'));
            rows.forEach(row => {
                if (!row.classList.contains('detailTH')) {
                    row.remove();
                }
            });

            /* go through all stats details and create a table row for each */

            myJson.round_details[i].forEach(row => {

                let tr = document.createElement('tr');
                let td1 = document.createElement('td');
                let td2 = document.createElement('td');
                let td3 = document.createElement('td');

                td1.textContent = row.minute;
                td2.textContent = row.items_cnt;
                td3.textContent = sec2time(row.avg_cycle_time);

                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);

                tbl.appendChild(tr);

            });
        }
    }
}

function changeRound(round_switch, i) {
    const url = './update_simulation.php?i='+i+'&simulation_id='+getSimulationId()+'&stats_round_id='+round_switch.options[round_switch.selectedIndex].value;
    fetch(url);
}