function loadSimulationsList(url){

    if(!url){url = "./get_simulations_list.php?session_key="+getSessionKey();}
        fetch(url)
            .then((response) => {
                return response.json();
            })
            .then((myJson) => {

                if (myJson.status_code !== "SUCCESS") {
                    location.href = "../";
                }

                let table_body = document.getElementById("table_body");
                while (table_body.firstChild) {
                    table_body.removeChild(table_body.firstChild);
                }
                myJson.simulations.forEach(sim => {
                    let table_row = document.createElement("tr");
                    let table_data;

                    table_row.setAttribute("data-simulation_id", sim.simulation_id);
                    table_row.setAttribute("data-simulation_key", sim.simulation_key);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.email_address;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.billing_email_address + "\n" + sim.purchase_address;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.creation_date;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.demo_mode;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.simulation_name;
                    table_data.addEventListener("click", openSimulation);
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.single_gross_price;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.measured_use;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.measurement_date;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    table_data.innerText = sim.purchase_method;
                    table_row.append(table_data);

                    table_data = document.createElement("td");
                    let invoice_number_input = document.createElement("input");
                    invoice_number_input.type = "text";
                    invoice_number_input.size = 11;
                    invoice_number_input.maxLength = 11;
                    invoice_number_input.readOnly = true;
                    invoice_number_input.value = sim.invoice_number;
                    invoice_number_input.addEventListener("dblclick", editInvoiceNumber);
                    invoice_number_input.addEventListener("blur", stopEditInvoiceNumber);
                    invoice_number_input.addEventListener("change", stopEditInvoiceNumber);
                    table_data.append(invoice_number_input);
                    table_row.append(table_data);

                    table_body.append(table_row);
                });
            });

}

function openSimulation(e){
    let simulation_id = e.target.parentElement.getAttribute("data-simulation_id");
    let simulation_key = e.target.parentElement.getAttribute("data-simulation_key");
    let url = "../checkin.html?simulation_id="+simulation_id
                            +"&simulation_key="+simulation_key
                            +"&facilitate=1";
    console.log(url);
    window.open(url, '_blank',).focus();
}

function editInvoiceNumber(e){
    e.target.removeAttribute("readonly");
}

function stopEditInvoiceNumber(e){
    if(!e.target.readOnly) {
        e.target.readOnly = "true";
        updateInvoiceNumber(e);
    }
}

function updateInvoiceNumber(e){
    let url = "./update_simulation.php"
    +"?simulation_id="+e.target.parentElement.parentElement.getAttribute("data-simulation_id")
    +"&invoice_number="+e.target.value;

    fetch(url).then();
}

function handleSubmit(e) {
    let form = document.getElementById("filters");
    e.preventDefault();
    let formData = new FormData(form);
    let url = "./get_simulations_list.php?session_key="+getSessionKey();
        Array.from(formData).forEach( key => {
            if(key[1]==="on"){
                url += "&"+key[0];
            }
            else{
                url += "&"+key[0]+"="+key[1];
            }
        });
        console.log(url);
    loadSimulationsList(url);
}