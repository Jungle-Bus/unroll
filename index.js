function display_examples(){
    var lines_examples = [
        {
            "id": 6929043,
            "ref":"3",
            "mode":"bus",
            "colour":"blue",
            "operator":"",
            "network":"",
            "name":"Bus 3 : Gare de Choisy-Le-Roi ↔ Gare de Villeneuve-Saint-Georges"
        },
        {
            "id": 10173635,
            "ref":"37",
            "mode":"bus",
            "colour":"grey",
            "operator":"",
            "network":"",
            "comment": "with fare and schedules",
            "name":"bus 37: Gare Sud↔Yopougon Camp Militaire",
        },
        {
            "id": 8404844,
            "ref":" ",
            "mode":"bus",
            "colour":"grey",            
            "operator":"",
            "network":"",
            "comment": "on-demand bus",
            "name":"Bus Filéo Saint-Pathus : Roissypole ↔ Saint-Pathus"
        },
        {
            "id": 1667801,
            "ref":"24",
            "mode":"bus",
            "colour":"#F78F4B",            
            "operator":"",
            "network":"",
            "comment": "night bus",
            "name":"Noctilien N24: Gare de Sartrouville ↔ Châtelet "
        },
        {
            "id": 3328765,
            "ref":"6",
            "mode":"subway",
            "colour":"#75c695",
            "operator":"",
            "network":"",
            "comment": "with images and wikipedia",
            "name":"Paris Métro line 6",
        },     
    ]
    var lines_table = document.getElementById("lines_table");
    lines_table.innerHTML = display_table(lines_examples)
    lines_table.scrollIntoView();
}

function display_from_overpass(use_geo){
    if (use_geo){
        var town = document.getElementById('search_town').value;
        if (!town){
            console.error("no town")
            var error_town = document.getElementById("error_town");
            error_town.innerHTML = `<p class="w3-text-red">Please enter a town name</p>`
            return
        }
        var overpass_url = `
        https://overpass-api.de/api/interpreter?data=[out:json];
        area[name="${town}"];
        relation
        ["type"="route"]
        (area)
        ;
        rel(br)["type"="route_master"];
        out tags;
        `

    } else {
        var network = document.getElementById('search_network').value;
        var ref = document.getElementById('search_ref').value;
        var error_network_ref = document.getElementById("error_network_ref");
        if (!network && !ref){
            console.error("no network and ref")
            error_network_ref.innerHTML = `<p class="w3-text-red">Please enter a line number and a network</p>`
            return   
        }
        var overpass_url = `https://overpass-api.de/api/interpreter?data=[out:json];relation[type=route_master]`
        if (network){
            overpass_url += `[~"network|operator"~"${network}",i]`
        }
        if (ref) {
            overpass_url += `["ref"~"^${ref}$",i]`
        }
        overpass_url += `;out tags;`
    }
    var lines_table = document.getElementById("lines_table");
    lines_table.innerHTML = `<i class="fa fa-spinner fa-spin"></i> searching routes ...`
    lines_table.scrollIntoView(); 


    fetch(overpass_url)
    .then(function(data) {
        return data.json()
    })
    .then(function(data) {
        var lines = []
        for (var line of data['elements']){
            line['tags']['id'] = line['id'];
            lines.push(line['tags'])
        }
        if (lines.length != 0){
            lines_table.innerHTML = display_table(lines)
        } else {
            lines_table.innerHTML = "<p>No results :(</p>"
        }   
    })
    .catch(function(error) {
        console.error(error.message);
        lines_table.innerHTML = "Oops, something went wrong!"
    });
}

function display_table(lines){
    var template = `
    <table class="w3-table w3-striped w3-white">
    `

    for (const tags of lines) {
        template+=`
        <tr>
        <td>
            <transport-thumbnail
                data-transport-mode="${tags['route_master'] || tags['mode']}"
                data-transport-line-code="${tags['ref'] || ' '}"
                data-transport-line-color="${tags['colour'] || 'grey'}">
            </transport-thumbnail> 
        </td>
        <td><a href="/route.html?line=${tags['id']}">${tags["name"]}</a></td>
        <td>${tags["operator"]}</td>
        <td>${tags["network"]}</td>`
        if (tags["comment"]){
            template+= `<td>${tags["comment"]}</td>`
        }
        template+=`</tr>`
    }
    template+= `
    </table>`

    return template
}