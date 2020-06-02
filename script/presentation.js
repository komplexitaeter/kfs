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

}

function toggleWIPVisibility(e){
    let sides = ["left","right"];
    let side = sides.indexOf(e.target.id.split('_')[0]);

    const url = './update_simulation.php' +
        '?simulation_id='+presentationSimulation_id +
        '&side='+side+
        '&action=toggle_wip_visibility';
    fetch(url);
}

function displayPresentation(domList, role_code, wip_visibility){

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

    let sides = ["left","right"];
    for(i=0;i<=1;i++){
        let wip_toggle = document.getElementById(sides[i]+"_wip_visibility_toggle");
        if((wip_visibility[i] === 1)&&wip_toggle.classList.contains("wip_inactive")){
            wip_toggle.classList.remove("wip_inactive");
            wip_toggle.classList.add("wip_active");
        }
        if((wip_visibility[i] === 0)&&wip_toggle.classList.contains("wip_active")){
            wip_toggle.classList.remove("wip_active");
            wip_toggle.classList.add("wip_inactive");
        }
    }

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
    let sides = ["left","right"];
    const url = "./get_round_statistics.php"+
        "?round_id="+round_id+
        "?side="+sides.indexOf(side);

    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            /**update round display on the corresponding side**/
            let display = document.getElementById("round_display_"+side);
            display.setAttribute("data-value", round_id);
            display.innerHTML = myJson.title+'<div class="visibility_toggle facilitator_tool"></div>';

            /**generate and update graphs on the corresponding side**/
            drawShipsPerMinute(myJson.per_minute, 'round_stats_'+side+'_top_graph');
            drawShipsCycleTime(myJson.per_ship, 'round_stats_'+side+'_middle_graph');
        });
}

function drawShipsCycleTime(data, targetDiv) {

    let gData = google.visualization.arrayToDataTable(data);

    let options = {
        title : '',
        vAxes: {
            0: {
                title:'cycle time',
                titleTextStyle: {color: 'blue', fontName: 'Komplexitater', fontSize: 16, minValue: 0}
            }
        },
        hAxis: {
            title: 'delivery time',
            titleTextStyle: {color: 'black', fontName: 'Komplexitater', fontSize: 16, minValue: 0},
            textPosition: 'out'
        },
        series: {
            0: {
                pointSize: 3
            }
        },
        legend: 'none',
        chartArea:{width:'80%',height:'70%'}
    };

    let chart = new google.visualization.ScatterChart(document.getElementById(targetDiv));
    chart.draw(gData, options);
}

function drawShipsPerMinute(data, targetDiv) {

    let gData = google.visualization.arrayToDataTable(data);

    let options = {
        title : '',
        vAxes: {
            0: {
                title:'ships',
                titleTextStyle: {color: 'blue', fontName: 'Komplexitater', fontSize: 16}
            },
            1: {
                title:'wip',
                titleTextStyle: {color: 'red', fontName: 'Komplexitater', fontSize: 16}
            }
        },
        hAxis: {
            title: 'Minutes',
            titleTextStyle: {color: 'black', fontName: 'Komplexitater', fontSize: 16},
            textPosition: 'out'
        },
        seriesType: 'bars',
        bar: {
            groupWidth: "30%"
        },

    series: {
            0: {
                type: 'bars',
                targetAxisIndex: 0
            },
            1: {
                type: 'bars',
                targetAxisIndex: 1
            },
            2: {
                type: 'line',
                targetAxisIndex: 0,
                curveType: 'function',
                lineDashStyle: [4,4]
            }
            },
        legend: {position: 'top', textStyle: {color: 'blue', fontName: 'Komplexitater', fontSize: 16}},
        chartArea:{width:'80%',height:'70%'}
    };

    let chart = new google.visualization.ComboChart(document.getElementById(targetDiv));
    chart.draw(gData, options);
}