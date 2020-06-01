let presentationSimulation_id;
let presentationSession_key;

function initializePresentation(simulation_id, session_key){
    presentationSimulation_id = simulation_id;
    presentationSession_key = session_key
}

function toggleParentDomVisibility(e){
   let url = "./update_dom.php"+
       "?simulation_id="+presentationSimulation_id+
       "&dom_id="+e.target.parentElement.id+
       "&action=toggle_visibility";
    fetch(url).then();
    console.log(url);
}

function displayPresentation(domList, role_code){

    let toggles = Array.from(document.getElementsByClassName("visibility_toggle"));
    toggles.forEach( dom => {
           dom.onclick = toggleParentDomVisibility;
           if(role_code === "OBSERVER") {
               dom.parentElement.classList.remove("is_facilitator");
           }
           if(role_code === "FACILITATOR"){
               dom.parentElement.classList.add("is_facilitator");
           }
    });

    domList.forEach( currentDom => {
        let targetDom = document.getElementById(currentDom.dom_id);

        if((targetDom.classList.contains("dom_hidden"))&&(currentDom.visibility === "1")) {
            targetDom.classList.remove("dom_hidden");
            targetDom.classList.add("dom_visible");
        }
        if((targetDom.classList.contains("dom_visible"))&&(currentDom.visibility === "1")) {
            return 0;
        }
        if((targetDom.classList.contains("dom_visible"))&&(currentDom.visibility === "0")) {
            targetDom.classList.remove("dom_visible");
            targetDom.classList.add("dom_hidden");
        }
        if((targetDom.classList.contains("dom_hidden"))&&(currentDom.visibility === "0")) {
            return 0;
        }
    });

}

function updateDisplayedRound(e){
    let sides = ["left","right"];
    let side = sides.indexOf(e.target.id.split('_')[0]);

    const url = './update_simulation.php?' +
        'simulation_id='+presentationSimulation_id +
        '&stats_round_id='+e.target.value +
        '&side='+side;
    fetch(url);
}

function updateRoundStats(round_id, side){
    const url = "./get_round_statistics.php"+
        "?round_id="+round_id;
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            let display = document.getElementById("round_display_"+side);
            display.name = round_id;
            display.value = myJson.title;
            drawVisualization();
        });
}

function drawVisualization() {
    console.log("draw");
    let rand = Math.floor(Math.random()*10);
    // Some raw data (not necessarily accurate)
    let data = google.visualization.arrayToDataTable([
        ['Min', 'ships', 'wip', 'tp'],
        ['0',  2,      6,         2],
        ['1',  4,      rand,        3],
        ['2',  6,      16,        4],
        ['3',  5,      21,        4.25],
        ['4',  4,      25,         4.2]
    ]);

    let options = {
        title : '',
        vAxis: {title: '#'},
        hAxis: {title: 'Min'},
        seriesType: 'bars',
        series: {2: {type: 'line'}}
    };

    let chart = new google.visualization.ComboChart(document.getElementById('round_stats_left_top'));
    chart.draw(data, options);
}