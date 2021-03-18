let gConsLoginUrl = "./login.html";
let gPriceList;
let gPurchaseMethod = "INVOICE";
let gCreditId = null;
let gLiveToggle = null;
let gHasPurchasingDetails = false;
let gPurchasingPrice;
let gPurchasingAddress;

function loadBase() {
    let languageCode = getURLParam("language_code");
    if (   languageCode === "en"
        || languageCode === "de") {
        gLanguageCode = languageCode;
    }
    setLanguage();

    let baseUrl = 'get_base';
    let params = {
        "session_key"  : getSessionKey(),
        "language_code": gLanguageCode
    }
    initializeConnection(baseUrl, params, updateDom);
    loadPriceList();

    focusSimName();
}

function setLanguage() {
    translateElements("base", gLanguageCode);
}

function updateDom(myJson) {
    switch(myJson.status_code) {
        case "BASE":
            updatePurchasingDetails(myJson.purchasing_detail_exists
                , myJson.purchase_address
                , myJson.single_gross_price
                , myJson.purchase_method);
            removeStyleClass(document.body, 'hidden');
            updateSimulations(myJson.simulations);
            break;
        case "LOGIN":
            location.href = gConsLoginUrl+'?language_code='+gLanguageCode;
            break;
        default:
            addStyleClass(document.body, 'hidden')
    }
}

function updatePurchasingDetails(purchasing_detail_exists
    , purchase_address
    , single_gross_price
    , purchase_method){

    let buyCreditsBtn = document.getElementById("buy_credits_btn");
    let creditsBtn = document.getElementById("credits_btn");

    let creditsBtnLabel = document.getElementById("credits_btn_label");
    let labelTxt;

    if (purchasing_detail_exists && purchasing_detail_exists  === 1 ) {
        labelTxt = document.getElementById("purchasing_details_exist_txt").value;
        if(document.getElementById('purchase_dialog').hidden){
            gHasPurchasingDetails = true;
            gPurchasingPrice = single_gross_price;
            gPurchaseMethod = purchase_method;
            gPurchasingAddress = purchase_address;
        }

        addStyleClass(buyCreditsBtn, "hidden");
        removeStyleClass(creditsBtn, "hidden");
        if (!creditsBtnLabel.textContent.includes(labelTxt)) {
            creditsBtnLabel.textContent = labelTxt;
        }
        if (gLiveToggle === null) toggleLive();


    } else {
        addStyleClass(creditsBtn, "hidden");
        removeStyleClass(buyCreditsBtn, "hidden");

        gHasPurchasingDetails = false;
    }

}

function loadPriceList() {
    let url = "./price_list.json";
    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            gPriceList = myJson;
        });
}

function logoutBtnClick() {
    let url = "./login.php?session_key="+getSessionKey()+"&logout";
    fetch(url).then(r=>{
        if(r) location.href = gConsLoginUrl+'?language_code='+gLanguageCode;
    });
}

function togglePlayground() {
    gLiveToggle = 0;
    let playground_div = document.getElementById("icon_playground");
    let live_div = document.getElementById("icon_live");
    toggleStyleClass(playground_div, "playground_toggle_active", "playground_toggle_inactive");
    toggleStyleClass(live_div, "live_toggle_inactive", "live_toggle_active");
    focusSimName();
    revokeFadeInAnimation();
    toggleSimulationsVisibility();
}

function toggleLive() {
    if (gHasPurchasingDetails) {
        gLiveToggle = 1;
        let playground_div = document.getElementById("icon_playground");
        let live_div = document.getElementById("icon_live");
        toggleStyleClass(playground_div, "playground_toggle_inactive", "playground_toggle_active");
        toggleStyleClass(live_div, "live_toggle_active", "live_toggle_inactive");
        focusSimName();
        revokeFadeInAnimation();
        toggleSimulationsVisibility();
    }
    else {
        open_purchase_dialog();
    }
}

function revokeFadeInAnimation() {
    // switch off fade-in animation to avoid re-animation of recently created sims
    Array.from(document.getElementsByClassName("sim_fade-in")).forEach( sim_div => {
        toggleStyleClass(sim_div, "sim_static", "sim_fade-in");
    });
}

function toggleSimulationsVisibility(){
    Array.from(document.getElementsByClassName("sim")).forEach( sim_div => {
        if (sim_div.getAttribute("demo_mode") != gLiveToggle){
            sim_div.style.display = "grid";
        }
        else{
            sim_div.style.display = "none";
        }
    });
}

function focusPurchasingTextarea() {
    setTimeout(function() {
        document.getElementById("purchase_address").focus();
    }, 0);
}

function focusSimName() {
    setTimeout(function() {
        document.getElementById("sim_name").focus();
    }, 500);
}

function open_purchase_dialog(){
    updatePurchasingPrice();
    updatePurchasingAdress();
    updatePurchaseMethod();
    blurPurchaseWarningMsg();
    document.getElementById('purchase_dialog').hidden=false;
}

function setPurchaseWarningMsg(msgText) {
    let purchase_warning_msg = document.getElementById("purchase_warning_msg");
    purchase_warning_msg.textContent = msgText;
    toggleStyleClass(purchase_warning_msg, "warning_msg_active", "warning_msg_inactive")
}

function blurPurchaseWarningMsg() {
    let purchase_warning_msg = document.getElementById("purchase_warning_msg");
    toggleStyleClass(purchase_warning_msg, "warning_msg_inactive", "warning_msg_active")
}

function close_purchase_dialog() {
    document.getElementById('purchase_dialog').hidden=true;
}

function set_purchase_method(purchaseMethod) {
    if (!document.getElementById("purchase_submit_btn").classList.contains("submit_btn_waiting")) {
        gPurchaseMethod = purchaseMethod;
        updatePurchaseMethod();
    }
}

function updatePurchasingPrice(){

    let price_value = document.getElementById("price_value");
    if(gHasPurchasingDetails){
        price_value.textContent = gPurchasingPrice;
    }
    else{
        price_value.textContent = gPriceList[0].toString();
    }
}

function updatePurchasingAdress(){
    let purchase_address = document.getElementById("purchase_address");
    if(gHasPurchasingDetails){
        purchase_address.textContent = gPurchasingAddress;
    }
    else{
        purchase_address.textContent = null;
    }
}

function updatePurchaseMethod() {
    let purchase_method_invoice_text = document.getElementById("purchase_method_invoice_text");
    let purchase_method_offer_text = document.getElementById("purchase_method_offer_text");
    let purchase_method_custom_text = document.getElementById("purchase_method_custom_text");
    let div_invoice = document.getElementById("purchase_method_invoice");
    let div_offer = document.getElementById("purchase_method_offer");
    let div_custom = document.getElementById("purchase_method_custom");
    let div_address = document.getElementById("purchase_address_div");

    let address_label = document.getElementById("purchase_address_label");
    let purchase_address = document.getElementById("purchase_address");
    let address_label_tl;
    let address_placeholder_tl;

    let submit_btn = document.getElementById("purchase_submit_btn");
    let submit_btn_val;

    switch (gPurchaseMethod) {
        case "INVOICE":
            removeStyleClass(purchase_method_invoice_text, "hidden");
            addStyleClass(purchase_method_offer_text, "hidden");
            addStyleClass(purchase_method_custom_text, "hidden");
            toggleStyleClass(div_invoice, "active", "inactive");
            toggleStyleClass(div_offer, "inactive", "active");
            toggleStyleClass(div_custom, "inactive", "active");
            toggleStyleClass(div_address, "purchase_address_active", "purchase_address_hidden");
            address_label_tl = document.getElementById("purchase_address_label_invoice");
            address_placeholder_tl = document.getElementById("purchase_address_placeholder_invoice");
            submit_btn_val = document.getElementById("submit_btn_invoice").value;
            if (!submit_btn.value.includes(submit_btn_val)) {
                address_label.textContent = address_label_tl.value;
                purchase_address.placeholder = address_placeholder_tl.value;
                submit_btn.value = submit_btn_val;
            }
            break;
        case "OFFER":
            addStyleClass(purchase_method_invoice_text, "hidden");
            removeStyleClass(purchase_method_offer_text, "hidden");
            addStyleClass(purchase_method_custom_text, "hidden");
            toggleStyleClass(div_invoice, "inactive", "active");
            toggleStyleClass(div_offer, "active", "inactive");
            toggleStyleClass(div_custom, "inactive", "active");
            toggleStyleClass(div_address, "purchase_address_active", "purchase_address_hidden");
            address_label_tl = document.getElementById("purchase_address_label_offer");
            address_placeholder_tl = document.getElementById("purchase_address_placeholder_offer");
            submit_btn_val = document.getElementById("submit_btn_offer").value;
            if (!submit_btn.value.includes(submit_btn_val)) {
                address_label.textContent = address_label_tl.value;
                purchase_address.placeholder = address_placeholder_tl.value;
                submit_btn.value = submit_btn_val;
            }
            break;
        case "CUSTOM":
            addStyleClass(purchase_method_invoice_text, "hidden");
            addStyleClass(purchase_method_offer_text, "hidden");
            removeStyleClass(purchase_method_custom_text, "hidden");
            toggleStyleClass(div_invoice, "inactive", "active");
            toggleStyleClass(div_offer, "inactive", "active");
            toggleStyleClass(div_custom, "active", "inactive");
            toggleStyleClass(div_address, "purchase_address_hidden", "purchase_address_active");
            submit_btn_val = document.getElementById("submit_btn_custom").value;
            if (!submit_btn.value.includes(submit_btn_val)) {
                submit_btn.value = submit_btn_val;
            }
            break;
    }
    if(gHasPurchasingDetails) {
        submit_btn_val = document.getElementById("submit_btn_update").value;
        if (!submit_btn.value.includes(submit_btn_val)) {
            submit_btn.value = submit_btn_val;
        }
    }
    blurPurchaseWarningMsg();
    focusPurchasingTextarea();
}

function purchase_submit() {
    let purchase_address = document.getElementById("purchase_address");

    if (gPurchaseMethod !== "CUSTOM" && (!purchase_address || purchase_address.value.length < 8 )) {
        setPurchaseWarningMsg(document.getElementById("warning_no_purchase_address").value);
        focusPurchasingTextarea();
    } else {
        setPurchaseSubmitWaiting();
        submitPurchaseData(purchase_address.value);
    }

}

function submitPurchaseData(purchaseAddress) {
    const url = "./purchase.php?session_key="+getSessionKey();
    let httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function() {handlePurchaseHttpResponse(this.readyState, this.status, this.responseText)};
    httpRequest.open("POST", url, true);
    httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    httpRequest.send(
        "purchase_method=" + gPurchaseMethod
        +"&language_code=" + gLanguageCode
        +"&purchase_address=" + purchaseAddress
    );
}

function handlePurchaseHttpResponse(readyState, status, responseText) {
    if (readyState === 4) {
        if (status === 200) {
            try {
                let responseJSON = JSON.parse(responseText);
                if (responseJSON.status_code !== 'SUCCESS') {
                    setPurchaseWarningMsg('Internal Server Error!');
                    setPurchaseSubmitActive();
                }
                else{
                    let purchase_submit_btn = document.getElementById("purchase_submit_btn");
                    setPurchaseSubmitActive();
                    close_purchase_dialog();
                }
            }
            catch (e) {
                setPurchaseWarningMsg('Internal Error!');
                setPurchaseSubmitActive();
                console.error(e);
            }
        } else {
            setPurchaseWarningMsg('Connection Error!');
            setPurchaseSubmitActive();
            console.error("HTTP Error Status="+status);
        }
    }
}

function setPurchaseSubmitWaiting() {
    let purchase_address = document.getElementById("purchase_address");
    let submit_btn = document.getElementById("purchase_submit_btn");
    blurPurchaseWarningMsg();
    disableElement(purchase_address);
    disableElement(submit_btn);
    toggleStyleClass(submit_btn, "submit_btn_waiting", "submit_btn_active");
}

function setPurchaseSubmitActive() {
    let purchase_address = document.getElementById("purchase_address");
    let submit_btn = document.getElementById("purchase_submit_btn");
    enableElement(purchase_address);
    enableElement(submit_btn);
    toggleStyleClass(submit_btn, "submit_btn_active", "submit_btn_waiting");
}

function createSimulation() {

    if (gHasPurchasingDetails || !gLiveToggle) {

        let url;
        let demo_mode;
        let sim_name = document.getElementById("sim_name");

        if (sim_name.value && sim_name.value.length > 0) {

            if (gLiveToggle === 1) demo_mode = 0;
            else demo_mode = 1;

            url = "./create_simulation.php?session_key=" + getSessionKey()
                + "&demo_mode=" + demo_mode
                + "&default_language_code=" + gLanguageCode
                + "&simulation_name=" + sim_name.value;

            fetch(url)
                .then((response) => {
                    if (response.ok) {
                        sim_name.value = "";
                    }
                });

        } else {

            /* shake the Simulation Name filed and then focus it */
            setTimeout(function () {
                sim_name.classList.add("highlight");
                setTimeout(function () {
                    sim_name.focus();
                    sim_name.classList.remove("highlight");
                }, 750);
            }, 100);
        }
    }
    else {
        open_purchase_dialog();
    }
}

function updateSimulations(simulations) {
    let sim_list = document.getElementById("sim_list");
    let sim_template = document.getElementById("sim_template");

    let create_sim_class = "sim_fade-in";
    if (sim_list.childElementCount === 0) create_sim_class = "sim_static";

    simulations.forEach(simulation=> {
        let sim_div = document.getElementById(simulation.simulation_key);

        if (sim_div) {
            updateSimulation(sim_div, simulation);
        } else {
            sim_div = sim_template.cloneNode(true);
            sim_div.id = simulation.simulation_key;
            sim_div.setAttribute("data-id", simulation.simulation_id);
            sim_div.setAttribute("demo_mode", simulation.demo_mode);
            sim_div.classList.add(create_sim_class);
            updateSimulation(sim_div, simulation);
            if (sim_list.firstChild) {
                sim_list.insertBefore(sim_div, sim_list.firstChild)
            }
            else {
                sim_list.appendChild(sim_div);
            }
        }

    });
    toggleSimulationsVisibility();
}

function updateSimulation(sim_div, simulation) {
    /* creation date */
    let date_dsp;
    if (gLanguageCode === "en") date_dsp = simulation.date_day + ". " + simulation.date_mon.en;
    else date_dsp = simulation.date_day + ". " + simulation.date_mon.de;
    setTextContent(sim_div.getElementsByClassName("sim_date")[0], date_dsp);

    /* simulation name */
    setTextContent(sim_div.getElementsByClassName("sim_name_txt")[0], simulation.simulation_name);

    /* status */
    let status_tl = document.getElementById("status_"+simulation.status_code);
    if (status_tl && status_tl != null) {
        let status_dsp = status_tl.value
        setTextContent(sim_div.getElementsByClassName("sim_status")[0], status_dsp);
    } else {
        console.log("missing_translation: status_"+simulation.status_code);
    }

    /* start button text */
    let start_sim_btn_txt = document.getElementById("start_sim_btn_txt").value;
    setValue(sim_div.getElementsByClassName("sim_start_btn")[0], start_sim_btn_txt);

    /* live or demo */
    let toggle_img_src;
    if (simulation.demo_mode === 0) toggle_img_src = "sim_live_inactive.png"
    else toggle_img_src = "sim_playground_inactive.png";
    setSrc(sim_div.getElementsByClassName("sim_live_toggle")[0], "./src/", toggle_img_src);


    /* default language  */
    if (simulation.default_language_code === 'en') {
        toggleStyleClass(sim_div.getElementsByClassName("sim_lang_de")[0], "sim_lang_inactive", "sim_lang_active");
        toggleStyleClass(sim_div.getElementsByClassName("sim_lang_en")[0], "sim_lang_active", "sim_lang_inactive");
    } else {
        toggleStyleClass(sim_div.getElementsByClassName("sim_lang_de")[0], "sim_lang_active", "sim_lang_inactive");
        toggleStyleClass(sim_div.getElementsByClassName("sim_lang_en")[0], "sim_lang_inactive", "sim_lang_active");
    }

}

function getSimUrl(simDiv, fullPath) {
    let baseURL = '.';
    if (fullPath) {
        let pathArray = window.location.pathname.split( '/' );
        baseURL = window.location.origin + "/" + pathArray[1];
    }
    return baseURL + "/checkin.html?simulation_id="+simDiv.getAttribute("data-id")
        +"&simulation_key="+simDiv.id
        +"&facilitate=1";
}

function openSimulation(e) {
    window.open(getSimUrl(e.target.parentElement, false));
}

function copyShareLink(e) {
    let sim_cs_div = e.target;

    let copy_cat = document.getElementById("copy_cat");
    copy_cat.value = getSimUrl(sim_cs_div.parentElement, true);
    copy_cat.select();
    copy_cat.setSelectionRange(0, 99999); /*For mobile devices*/
    document.execCommand("copy");
    copy_cat.value = "";

    /* feedback animation */
    if (!sim_cs_div.classList.contains("sim_cs_clicked")) {
        setTimeout(function () {
            sim_cs_div.classList.add("sim_cs_clicked");
            setTimeout(function () {
                sim_cs_div.classList.remove("sim_cs_clicked");
            }, 1000);
        }, 10);
    }
}

function setDefaultLang(e) {
    const url = './update_simulation.php?simulation_id='+e.target.parentElement.parentElement.getAttribute("data-id")
                +'&default_language_code='+e.target.getAttribute("data-language");
    fetch(url).then();
}