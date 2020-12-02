let gConsLoginUrl = "./login.html";
let gPriceList;
let gPurchaseQty = 1;
let gPurchaseMethod = "INVOICE";
let gCreditId = null;
let gLiveToggle = null;

function loadBase() {
    let languageCode = getURLParam("language_code");
    if (   languageCode === "en"
        || languageCode === "de") {
        gLanguageCode = languageCode;
    }
    setLanguage();

    let baseUrl = 'get_base';
    let params = {
        "session_key" : getSessionKey()
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
    } else if (openPurchaseTrx > 0 && latestTrx.purchase_method === "OFFER" ) {
        labelTxt = document.getElementById("pending_offer_label").value;
        if (!creditsBtnLabel.textContent.includes(labelTxt)) {
            creditsBtnLabel.textContent = labelTxt;
        }
        addStyleClass(buyCreditsBtn, "hidden");
        removeStyleClass(creditsBtn, "hidden");
    }
    else {
        addStyleClass(creditsBtn, "hidden");
        removeStyleClass(buyCreditsBtn, "hidden");
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
}

function toggleLive() {
    gLiveToggle = 1;
    let playground_div = document.getElementById("icon_playground");
    let live_div = document.getElementById("icon_live");
    toggleStyleClass(playground_div, "playground_toggle_inactive", "playground_toggle_active");
    toggleStyleClass(live_div, "live_toggle_active", "live_toggle_inactive");
    focusSimName();
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

    setInterval(function(){
        document.getElementById("create_simulation").style.backgroundColor='red';
        setTimeout(function(){
            document.getElementById("create_simulation").style.backgroundColor='blue';
        }, 500);
    }, 1000);

    setTimeout(function(){
        let defaultLanguage = document.querySelector('input[name="language_code"]:checked').value;
        const url ='./create_simulation.php?session_key='+getSessionKey()
            +"&demo_mode=1"
            +'&default_language_code='+defaultLanguage;

        fetch(url)
            .then((response) => {
                return response.json();
            })

            .then((myJson) => {
                location.href = './checkin.html?simulation_id='+myJson.simulation_id
                    +"&simulation_key="+myJson.simulation_key;
            });
    }, 1);

}