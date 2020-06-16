const gPreferStreaming = false;
const gPullInterval = 500;
const gPauseWhenInvisible = false;

let gLastExecutionTime="";
let gFetchCount = 0;

function initializeConnection(baseUrl, params, func) {
    let useStreaming = false;

    if (gPreferStreaming && typeof EventSource == 'function') {
        useStreaming = true;
    }

    if (useStreaming) {
        let url = getUrl(baseUrl, params, useStreaming);
        initializeStreaming(url, func);
    } else {
        initializePulling(baseUrl, params, func);
    }
}

function getUrl(baseUrl, params, useStreaming) {
    let separator = '?';
    let url="./"+baseUrl;
    if (useStreaming) url+='_stream';
    url+=".php";
    for (let param in params) {
        if (params.hasOwnProperty(param)) {
            url += separator + param + "=" + params[param];
            separator = '&';
        }
    }
    return url;
}

function initializePulling(baseUrl, params, func) {
    try {
        params["execution_time"] = gLastExecutionTime;
        let url = getUrl(baseUrl, params, false);

        let refreshInterval;
        let myJson = {status_code: 'SUCCESS'};

        let t1 = performance.now();

        let request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send();

        let t2 = performance.now();
        gLastExecutionTime = Math.round(t2 - t1);
        gFetchCount++;

        if (request.status === 200) {
            myJson = JSON.parse(request.responseText);
            func(myJson, gFetchCount, gLastExecutionTime);
        } else {
            console.error("error on XMLHttpRequest for " + url + "with status code: " + this.status);
        }

        if (gLastExecutionTime >= gPullInterval) {
            refreshInterval = 0;
        } else {
            refreshInterval = gPullInterval - gLastExecutionTime;
        }

        if (myJson.status_code !== "TERMINATE") {
            setTimeout(function () {
                initializePulling(baseUrl, params, func);
            }, refreshInterval);
        }
    }
    catch(e) {
        setTimeout(function () {
            initializePulling(baseUrl, params, func);
        }, gPullInterval);
        console.error(e);
    }
}

function initializeStreaming(url, func) {
     let eventSource = new EventSource(url);

    eventSource.addEventListener("update"
        ,function(event) {
                    handleStreamEvent(event, func);
                });

    if (gPauseWhenInvisible) {
        document.addEventListener("visibilitychange"
            , function () {
                onVisibilityChange(eventSource, func, url);
            });
    }
}

function handleStreamEvent(event, func) {
    let myJson = JSON.parse(event.data);
    gFetchCount++;
    func(myJson, gFetchCount, gLastExecutionTime);
}

function onVisibilityChange(eventSource, func, url) {
    if (document.visibilityState === 'hidden') {
        eventSource.close();
    }
    else if (eventSource === null || eventSource.readyState === 2) {
        eventSource = new EventSource(url);
        eventSource.addEventListener("update"
            , function (event) {
                handleStreamEvent(event, func);
            });
    }
}