let gConsLoginUrl = "./login.html";
let gPriceList;
let gPurchaseQty = 1;

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
}

function setLanguage() {
    translateElements("base", gLanguageCode);
}

function updateDom(myJson) {
    switch(myJson.status_code) {
        case "BASE":
            updateOpenCredits(myJson.open_credits);
            removeStyleClass(document.body, 'hidden');
            break;
        case "LOGIN":
            location.href = gConsLoginUrl+'?language_code='+gLanguageCode;
            break;
        default:
            addStyleClass(document.body, 'hidden')
    }
}

function updateOpenCredits(openCredits) {
    let creditsBtn = document.getElementById("credits_btn");
    let buyCreditsBtn = document.getElementById("buy_credits_btn");

    if (openCredits && openCredits >0 ) {
        let creditsBtnLabel = document.getElementById("credits_btn_label");
        let labelTxt;
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
    } else {
        addStyleClass(creditsBtn, "hidden");
        removeStyleClass(buyCreditsBtn, "hidden");
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

function open_purchase_dialog(){
    gPurchaseQty = 1;
    updatePurchaseQty();
    document.getElementById('purchase_dialog').hidden=false;
}

function close_purchase_dialog() {
    document.getElementById('purchase_dialog').hidden=true;
}

function btn_purchase_qty_minus() {
    if (gPurchaseQty > 1) gPurchaseQty--;
    updatePurchaseQty();
}

function btn_purchase_qty_plus() {
    if (gPurchaseQty < 50) gPurchaseQty++;
    updatePurchaseQty();
}

function updatePurchaseQty() {
    document.getElementById("purchase_qty").textContent
        = gPurchaseQty.toString() + "x";
    document.getElementById("purchase_unit_price").textContent
        = "á " + gPriceList[gPurchaseQty].toString() + "€";;
    document.getElementById("purchase_total_price").textContent
        = (gPurchaseQty * gPriceList[gPurchaseQty]).toString() + "€";
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