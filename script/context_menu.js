function defineContextMenu(target_id, context){
    let contextMenuArray;
    let contextMenu;
    switch(context) {
        case "item":
            contextMenuArray = {
                "red": "set item to red",
                "green": "set item to green",
               // "yellow": "set item to yellow",
               // "blue": "set item to yellow",
                "multicolored": "set item to multicolored"
            };

            contextMenu = document.createElement("div");
            contextMenu.classList.add("context_menu", "access_control");

            for (let key in contextMenuArray) {
                //var value = contextMenuArray[key];
                let option = document.createElement("img");
                option.classList.add("context_menu_option");
                option.id = target_id + "_" + key;
                option.value = target_id;

                option.src = "./src/dot_" + key + ".png";

                option.onclick = updateItemOption;
                contextMenu.append(option);
            }
            document.body.appendChild(contextMenu);
            return contextMenu;
            break;

        case "attendee":
            contextMenuArray = {
                "FACILITATOR": "give facilitator role",
                "OBSERVER": "remove facilitator role"
            };

            contextMenu = document.createElement("div");
            contextMenu.classList.add("context_menu", "set_role", "access_control");

            for (var key in contextMenuArray) {
                var value = contextMenuArray[key];
                let option = document.createElement("div");
                option.classList.add("context_menu_role");
                option.id = target_id + "_" + key;
                option.innerText = value;
                option.onclick = updateAttendeeRole;
                contextMenu.append(option);
            }
            document.body.appendChild(contextMenu);
            return contextMenu;
            break;
    }
}

function rightClickAttendee(e){
    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
        });
    }

    let contextMenu = defineContextMenu(e.target.id, "attendee");

    /*position context menu to the left in case the cursor is on the far right*/
    if(contextMenu.clientWidth + e.clientX > document.body.clientWidth){
        contextMenu.style.left = (e.clientX - contextMenu.clientWidth) + "px";
    }
    else{
        contextMenu.style.left = (e.clientX ) + "px";
    }
    contextMenu.style.top = e.clientY + "px";
}

function rightClickAttendeeAvatar(e){
    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
        });
    }

    let contextMenu = defineContextMenu(e.target.parentElement.id, "attendee");

    /*position context menu to the left in case the cursor is on the far right*/
    if(contextMenu.clientWidth + e.clientX > document.body.clientWidth){
        contextMenu.style.left = (e.clientX - contextMenu.clientWidth) + "px";
    }
    else{
        contextMenu.style.left = (e.clientX ) + "px";
    }
    contextMenu.style.top = e.clientY + "px";
}

function rightClickItem(e){

    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
        });
    }

    let contextMenu = defineContextMenu(e.target.id.split('_')[1], "item");

    /*position context menu to the left in case the cursor is on the far right*/
    if(contextMenu.clientWidth + e.clientX > document.body.clientWidth){
        contextMenu.style.left = (e.clientX - contextMenu.clientWidth) + "px";
    }
    else{
        contextMenu.style.left = (e.clientX ) + "px";
    }
    contextMenu.style.top = e.clientY + "px";

}

function clearOpenedMenu(){
    let openedMenu = Array.from(document.getElementsByClassName("context_menu"));
    if(openedMenu != null){
        openedMenu.forEach( obj=> {
            obj.remove();
        });
    }
}