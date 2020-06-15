function createBots(){
    let simulation_id = document.getElementById("simulation_id").value;
    let bots_count = document.getElementById("bots_count").value;

    if(simulation_id!="auto"){
        for(let i=0; i<bots_count; i++){
            let session_key = getSessionKey().substring(0,12);
            let str = "" + i;
            let pad = "0000";
            session_key= session_key+pad.substring(0, pad.length - str.length) + str;
            let url ='./get_checkin_attendees.php?simulation_id='+simulation_id+'&session_key='+session_key;
            fetch(url)
                .then((response) => {
                    return response.json();
                })
        }

    }

    getAttendees("updating");

}

function getAttendees(e){

    let d = Array.from(document.getElementsByClassName("attendee"));
    d.forEach( d => {
        d.remove();
    });

    if(e === "updating"){
        simulation_id = document.getElementById("simulation_id").value;
    }
    else{
        simulation_id = e.target.value;
    }

    let url ='./get_board.php?simulation_id='+simulation_id+'&session_key='+getSessionKey();

    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((myJson) => {
            myJson.attendees.forEach( attendee => {
                if(attendee.name === null){
                    let bot_name = "RobotNr."+attendee.session_key.substring(12,16);
                    let name_url ='./update_attendee.php?simulation_id='+simulation_id+'&session_key='+attendee.session_key+'&name='+bot_name;
                    fetch(name_url);
                    console.log(name_url);
                }
                let div = document.createElement("div");
                div.classList.add("attendee");
                div.innerHTML = "<div class='column c1' onclick='removeAttendee(event)' id='"+attendee.session_key+"'>X</div><div class='column c2'>"+attendee.name + "</div><div class='column c3'><a target='_blank' href='./running_bot.html?session_key=" + attendee.session_key + "&simulation_id="+simulation_id+"'>" + attendee.session_key + "</a></div><div class='column c4'>" +attendee.station_id+"</div><div class='column c4'>"+1+"</div>";
                document.getElementById("bots_list").appendChild(div);

            });
        });

}

function removeAttendee(e){
    let session_key = e.target.id;
    let simulation_id = document.getElementById("simulation_id").value;
    let url = "./delete_attendee.php"+
        "?simulation_id="+simulation_id+
        "&session_key="+session_key;
    fetch(url);
    getAttendees("updating");
}