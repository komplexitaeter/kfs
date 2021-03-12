let gConsLoginUrl = "./login.html";
let gPriceList;
let gPurchaseQty = 1;
let gPurchaseMethod = "INVOICE";
let gCreditId = null;
let gLiveToggle = null;
let gHasCredits = false;

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
            updateOpenCredits(myJson.open_credits, myJson.open_purchase_trx, myJson.latest_trx);
            updateOpenPurchaseTrx(myJson.open_purchase_trx, myJson.latest_trx);
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

function updateOpenCredits(openCredits, openPurchaseTrx, latestTrx) {
    let creditsBtn = document.getElementById("credits_btn");
    let buyCreditsBtn = document.getElementById("buy_credits_btn");

    let creditsBtnLabel = document.getElementById("credits_btn_label");
    let labelTxt;

    if (openCredits && openCredits >0 ) {
        if (openCredits === 1) {
            labelTxt = openCredits + document.getElementById("open_credit_txt").value;
        } else {
            labelTxt = openCredits + document.getElementById("open_credits_txt").value;
        }
        if (!creditsBtnLabel.textContent.includes(labelTxt)) {
            creditsBtnLabel.textContent = labelTxt;
        }
        addStyleClass(buyCreditsBtn, "hidden");
        removeStyleClass(creditsBtn, "hidden");

        if (gLiveToggle === null) toggleLive();

        gHasCredits = true;
    } else if (openPurchaseTrx > 0 && latestTrx.purchase_method === "OFFER" ) {
        labelTxt = document.getElementById("pending_offer_label").value;
        if (!creditsBtnLabel.textContent.includes(labelTxt)) {
            creditsBtnLabel.textContent = labelTxt;
        }
        addStyleClass(buyCreditsBtn, "hidden");
        removeStyleClass(creditsBtn, "hidden");

        gHasCredits = false;
    } else if (openPurchaseTrx > 0 && latestTrx.purchase_method === "CUSTOM" ) {
        labelTxt = document.getElementById("submit_btn_custom").value;
        if (!creditsBtnLabel.textContent.includes(labelTxt)) {
            creditsBtnLabel.textContent = labelTxt;
        }
        addStyleClass(buyCreditsBtn, "hidden");
        removeStyleClass(creditsBtn, "hidden");

        gHasCredits = false;
    }
    else {
        addStyleClass(creditsBtn, "hidden");
        removeStyleClass(buyCreditsBtn, "hidden");

        gHasCredits = false;
    }
}

function updateOpenPurchaseTrx(openPurchaseTrx, latestTrx) {
    let purchase_new = document.getElementById("purchase_new");
    let purchase_open = document.getElementById("purchase_open");

    if (openPurchaseTrx > 0) {

        let header = document.getElementById("purchase_open_header");
        let simulationString;

        gCreditId = latestTrx.credit_id;

        if (latestTrx.original_qty===1) simulationString = document.getElementById("open_credit_txt").value;
        else simulationString = document.getElementById("open_credits_txt").value;

        let headerTxt = "+"
            + latestTrx.original_qty
            + simulationString;

        if (!header.textContent.includes(headerTxt)) {
            header.textContent = headerTxt;
        }

        let div_feedback = document.getElementById("purchase_open_feedback");
        let div_invoice = document.getElementById("purchase_open_invoice");
        let div_offer = document.getElementById("purchase_open_offer");
        let div_custom = document.getElementById("purchase_open_custom");

        let confirm_offer_btn = document.getElementById("confirm_offer_btn");

        switch (latestTrx.purchase_method) {
            case "INVOICE":
                removeStyleClass(div_feedback, "hidden");
                removeStyleClass(div_invoice, "hidden");
                addStyleClass(div_offer, "hidden");
                addStyleClass(div_custom, "hidden");
                addStyleClass(confirm_offer_btn, "hidden");
                break;
            case "OFFER":
                if (latestTrx.pending_offer === 1) {
                    addStyleClass(div_feedback, "hidden");
                    addStyleClass(div_invoice, "hidden");
                    removeStyleClass(div_offer, "hidden");
                    addStyleClass(div_custom, "hidden");
                    removeStyleClass(confirm_offer_btn, "hidden");
                } else {
                    removeStyleClass(div_feedback, "hidden");
                    removeStyleClass(div_invoice, "hidden");
                    addStyleClass(div_offer, "hidden");
                    addStyleClass(div_custom, "hidden");
                    addStyleClass(confirm_offer_btn, "hidden");
                }
                break;
            case "CUSTOM":
                addStyleClass(div_feedback, "hidden");
                addStyleClass(div_invoice, "hidden");
                addStyleClass(div_offer, "hidden");
                removeStyleClass(div_custom, "hidden");
                addStyleClass(confirm_offer_btn, "hidden");
                break;
        }

        addStyleClass(purchase_new, "hidden");
        removeStyleClass(purchase_open, "hidden");
        setPurchaseSubmitActive();

    } else {
        addStyleClass(purchase_open, "hidden");
        removeStyleClass(purchase_new, "hidden");
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
    toggleSimulationsVisibility();
}

function toggleLive() {
    gLiveToggle = 1;
    let playground_div = document.getElementById("icon_playground");
    let live_div = document.getElementById("icon_live");
    toggleStyleClass(playground_div, "playground_toggle_inactive", "playground_toggle_active");
    toggleStyleClass(live_div, "live_toggle_active", "live_toggle_inactive");
    focusSimName();
    toggleSimulationsVisibility();
}

function toggleSimulationsVisibility(){
    Array.from(document.getElementsByClassName("sim")).forEach( sim_div => {
        //toggleStyleClass(sim_div, "sim_static", "sim_fade-in");
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
    updatePurchaseQty();
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

function btn_purchase_qty_minus() {
    if (gPurchaseQty > 1
        && !document.getElementById("purchase_submit_btn").classList.contains("submit_btn_waiting")) {
        gPurchaseQty--;
        updatePurchaseQty();
    }
}

function btn_purchase_qty_plus() {
    if (gPurchaseQty < 50
        && !document.getElementById("purchase_submit_btn").classList.contains("submit_btn_waiting")) {
        gPurchaseQty++;
        updatePurchaseQty();
    }
}

function updatePurchaseQty() {
    document.getElementById("purchase_qty").textContent
        = gPurchaseQty.toString() + "x";
    document.getElementById("purchase_unit_price").textContent
        = "á " + gPriceList[gPurchaseQty].toString() + "€";
    document.getElementById("purchase_total_price").textContent
        = (gPurchaseQty * gPriceList[gPurchaseQty]).toString() + "€";
    focusPurchasingTextarea();
}

function set_purchase_method(purchaseMethod) {
    if (!document.getElementById("purchase_submit_btn").classList.contains("submit_btn_waiting")) {
        gPurchaseMethod = purchaseMethod;
        updatePurchaseMethod();
    }
}

function updatePurchaseMethod() {
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

    /* in this case we can re-enable the button for offer conformation */
    let confirm_offer_btn = document.getElementById("confirm_offer_btn");
    enableElement(confirm_offer_btn);
    toggleStyleClass(confirm_offer_btn, "submit_btn_active", "submit_btn_waiting");
}

function submitPurchaseData(purchaseAddress) {
    const url = "./purchase.php?session_key="+getSessionKey();
    let httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function() {handlePurchaseHttpResponse(this.readyState, this.status, this.responseText)};
    httpRequest.open("POST", url, true);
    httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    httpRequest.send(
        "purchase_method=" + gPurchaseMethod
        +"&purchase_qty=" + gPurchaseQty
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

function confirm_offer() {
    const url = "./confirm_offer.php?session_key="+getSessionKey()+"&credit_id="+gCreditId+"&language_code="+gLanguageCode;

    let confirm_offer_btn = document.getElementById("confirm_offer_btn");
    disableElement(confirm_offer_btn);
    toggleStyleClass(confirm_offer_btn, "submit_btn_waiting", "submit_btn_active");

    fetch(url).then();
}

function createSimulation() {

    if (gHasCredits || !gLiveToggle) {

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