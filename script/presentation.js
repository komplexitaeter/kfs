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

function displayDefinitions(language){
    let url = "./definitions.json";
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            myJson.forEach( def => {
               let defDiv = document.getElementById(def.id);
               let frontDiv = Array.from(defDiv.getElementsByClassName("def-front"))[0];
               let backDiv = Array.from(defDiv.getElementsByClassName("def-back"))[0];
               frontDiv.textContent = def[language].title;
               backDiv.textContent = def[language].text;
            });
        });
}


function displayPresentation(domList, role_code, wip_visibility){

    let toggles = Array.from(document.getElementsByClassName("visibility_toggle"));
    toggles.forEach( dom => {
           dom.onclick = toggleParentDomVisibility;
           if(role_code === "OBSERVER") {
               removeStyleClass(dom.parentElement, "is_facilitator");
           }
           if(role_code === "FACILITATOR"){
               addStyleClass(dom.parentElement, "is_facilitator");
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
            document.getElementById("round_display_left").removeAttribute("data-value");
        }
        if((wip_visibility[i] === 0)&&wip_toggle.classList.contains("wip_active")){
            wip_toggle.classList.remove("wip_active");
            wip_toggle.classList.add("wip_inactive");
            document.getElementById("round_display_right").removeAttribute("data-value");
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

    let sides = ["left", "right"];
    let display = document.getElementById("round_display_" + side);
    let avgThroughputDisplay = document.getElementById("round_stats_" + side + "_bottom_value");
    let shipsPerMinuteDiv = document.getElementById('round_stats_' + side + '_top_graph');
    let shipsPerCycleTimeDiv = document.getElementById('round_stats_' + side + '_middle_graph');

    if (round_id!== null) {
        const url = "./get_round_statistics.php" +
            "?round_id=" + round_id +
            "&side=" + sides.indexOf(side);

        fetch(url)
            .then((response) => {
                return response.json();
            })
            .then((myJson) => {

                display.hidden = false;
                avgThroughputDisplay.hidden = false;
                shipsPerMinuteDiv.hidden = false;
                shipsPerCycleTimeDiv.hidden = false;

                /**update round display on the corresponding side**/
                let modeTitle;
                if (myJson.push_mode === '1') {
                    modeTitle = document.getElementById("title_push").value
                } else {
                    modeTitle = document.getElementById("title_pull").value
                }

                display.innerHTML = document.getElementById("title_round").value
                    + " " + myJson.title
                    + ": " + modeTitle;

                /**generate and update graphs on the corresponding side**/
                drawShipsPerMinute(myJson.per_minute, myJson.ship_per_minute_max, myJson.wip_per_minute_max, shipsPerMinuteDiv);
                drawShipsCycleTime(myJson.per_ship, myJson.cycle_time_per_ship_max, shipsPerCycleTimeDiv);
                avgThroughputDisplay.innerText = document.getElementById("chart_average_throughput").value + myJson.kpi.avg_throughput;

            });
    } else {
        display.hidden = true;
        avgThroughputDisplay.hidden = true;
        shipsPerMinuteDiv.hidden = true;
        shipsPerCycleTimeDiv.hidden = true;
    }
}

function drawShipsCycleTime(data, cycle_time_per_ship_max, targetDiv) {

    let gData = new google.visualization.DataTable();
    let maxCycleTime;

    if (cycle_time_per_ship_max) {
        maxCycleTime = (Math.ceil(cycle_time_per_ship_max/30)+1)*30;
    } else {
        maxCycleTime = 60;
    }

    gData.addColumn('timeofday', '');
    gData.addColumn('timeofday', '');
    gData.addColumn( {'type': 'string', 'role': 'style'} );

    let wb = new Workbench();
    let colorCode;

    data.forEach(obj => {
        if (obj[2] && obj[2]==='multicolored') {
            colorCode = wb.getColorByName('red').colorCode;
        } else {
            colorCode = wb.getColorByName('green').colorCode;
        }
        gData.addRow([{v: sec2time(obj[0], false), f:sec2time(obj[0], true)}
            , {v: sec2time(obj[1], false), f: document.getElementById("chart_cycle_time").value+": "+sec2time(obj[1], true)}
            ,colorCode]);
    });



    var options = {
        title: '',
        hAxis: {
            title: document.getElementById("chart_delivery_time").value,
            format: 'mm:ss',
            titleTextStyle: {color: '#535353', fontName: 'Komplexitater', fontSize: 16},
            viewWindow: {
                min: [0,0,0]
            }
        },
        vAxis: {
            title: document.getElementById("chart_cycle_time").value,
            format: 'mm:ss',
            titleTextStyle: {color: '#535353', fontName: 'Komplexitater', fontSize: 16},
            textPosition: 'out',
            viewWindow: {
                min: [0,0,0],
                max: sec2time(maxCycleTime)
            }
        },
        series: {
            0: {
                pointSize: 3
            }
        },
        legend: 'none',
        chartArea:{
            width:'70%',
            height:'70%'
        },
        backgroundColor: {
            fill: '#F0F8FF',
            fillOpacity: 0.4
        }
    };


    let chart = new google.visualization.ScatterChart(targetDiv);
    chart.draw(gData, options);
}

function drawShipsPerMinute(data, ship_per_minute_max, wip_per_minute_max, targetDiv) {
    let gData = new google.visualization.DataTable();
    let maxShip = Math.ceil(ship_per_minute_max*1.1);
    let maxWip = Math.ceil(wip_per_minute_max*1.1);

    if (!maxShip) maxShip = 4;
    if (!maxWip) maxWip = 4;

    gData.addColumn('string', 'min');
    gData.addColumn('number', document.getElementById("chart_ships").value);
    gData.addColumn('number', 'wip');
    gData.addColumn( {'type': 'string', 'role': 'style'} );

    data.forEach(obj => {
        gData.addRow([obj[0], obj[1], obj[2], obj[3]]);
    });


    let options = {
        title : '',
        vAxes: {
            0: {
                title: document.getElementById("chart_ships").value,
                titleTextStyle: {color: '#2ecc71', fontName: 'Komplexitater', fontSize: 16},
                viewWindow: {
                    max: maxShip,
                    min: 0
                },
                gridlines: {
                    color: 'transparent'
                }
            },
            1: {
                title: document.getElementById("chart_wip").value,
                titleTextStyle: {color: '#ffcc73', fontName: 'Komplexitater', fontSize: 16},
                viewWindow: {
                    max: maxWip,
                    min: 0
                },
                gridlines: {
                    color: 'transparent'
                }
            }
        },
        hAxis: {
            title: document.getElementById("chart_minutes").value,
            titleTextStyle: {color: '#535353', fontName: 'Komplexitater', fontSize: 16},
            textPosition: 'out',
            viewWindow: {

            },
            gridlines: {
                color: 'transparent'
            }
        },
        seriesType: 'bars',
        bar: {
            groupWidth: "30%"
        },

    series: {
            0: {
                type: 'bars',
                targetAxisIndex: 0,
                color: '#2ecc71'
            },
            1: {
                type: 'bars',
                targetAxisIndex: 1,
                color: '#ffcc73'
            },
            2: {
                type: 'line',
                targetAxisIndex: 0,
                curveType: 'function',
                lineDashStyle: [4,4]
            }
            },
        legend: 'none',
        chartArea:{
            width:'80%',
            height:'70%'
        },
        backgroundColor: {
            fill: '#F0F8FF',
            fillOpacity: 0.4
        }
    };

    let chart = new google.visualization.ComboChart(targetDiv);
    chart.draw(gData, options);
}

function sec2time(timeInSeconds, format) {
    if(isNaN(timeInSeconds)){
        timeInSeconds=0;
    }
    let pad = function(num, size) { return ('000' + num).slice(size * -1); },
        time = parseFloat(timeInSeconds).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);
    if(format) {
        return pad(minutes, 2) + ':' + pad(seconds, 2);
    }
    else{
        return [hours, minutes, seconds];
    }
}