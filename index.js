projects = {
    "Abidjan":{
        "line_list":"https://raw.githubusercontent.com/Jungle-Bus/AbidjanTransport_geom_ci/gh-pages/lines.csv",
        "format": "osm-transit-extractor",
        "qa": true
    },
    "IDF":{
        "line_list":"https://raw.githubusercontent.com/Jungle-Bus/ref-fr-STIF/gh-pages/data/lignes.csv",
        "format": "osm-transit-extractor",
        "qa": true
    },
    "Kochi":{
        "line_list":"https://raw.githubusercontent.com/Jungle-Bus/KochiTransport_geom_ci/gh-pages/lines.csv",
        "format": "osm-transit-extractor",
        "qa": true
    }
}

var project_id = get_parameter_from_url('project');

if (project_id){
    if (projects[project_id]["format"] == "osm-transit-extractor"){
        display_from_osm_transit_extractor_csv_list(projects[project_id]["line_list"], projects[project_id]["qa"])
    }
}

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
    var lines_stats = document.getElementById("lines_stats");
    lines_stats.innerHTML = "";
    display_table(lines_examples, lines_table)
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
    var lines_stats = document.getElementById("lines_stats");
    lines_stats.innerHTML = "";
    lines_table.innerHTML = `<i class="fa fa-spinner fa-spin"></i> searching routes ...`
    lines_stats.scrollIntoView();


    fetch(overpass_url)
    .then(function(data) {
        return data.json()
    })
    .then(function(data) {
        var lines = []
        for (var line of data['elements']){
            line['tags']['id'] = line['id'];
            line['tags']['mode'] = line['tags']['route_master'];
            line['tags']['code'] = line['tags']['ref'];
            line['tags']["thumbnail"] = `
            <transport-thumbnail
                data-transport-mode="${line['tags']['mode']}"
                data-transport-line-code="${line['tags']['code'] ||' '}"
                data-transport-line-color="${line['tags']['colour'] || 'grey'}">
            </transport-thumbnail>`;
            lines.push(line['tags'])
        }
        if (lines.length != 0){
            console.log(lines)
            display_table(lines, lines_table)
            lines_stats.innerHTML = display_stats(lines);
            lines_stats.scrollIntoView();
        } else {
            lines_table.innerHTML = "<p>No results :(</p>"
        }
    })
    .catch(function(error) {
        console.error(error.message);
        lines_table.innerHTML = "Oops, something went wrong!"
    });
}

function display_from_osm_transit_extractor_csv_list(url, add_qa_to_url){
    Papa.parse(url, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            results.data.splice(-1, 1);
            for (var line of results.data){
                line['id'] = line['line_id'].split(':')[2];
                line["thumbnail"] = `
            <transport-thumbnail
                data-transport-mode="${line['mode']}"
                data-transport-line-code="${line['code'] ||' '}"
                data-transport-line-color="${line['colour'] || 'grey'}">
            </transport-thumbnail>`
            }
            display_table(results.data, lines_table, add_qa_to_url)

            var lines_stats = document.getElementById("lines_stats");
            lines_stats.innerHTML = display_stats(results.data);
            lines_stats.scrollIntoView();
        }
    });  
}

function display_stats(lines){
    var line_nb = lines.length;
    if (line_nb > 10){
        var networks = [...new Set(lines.map(x => x.network))];
        var networks_nb = networks.length;
        var operators = [...new Set(lines.map(x => x.operator))];
        var operators_nb = operators.length;
        var modes = [...new Set(lines.map(x => x.mode))];
        var route_types = [...new Set(lines.map(x => x.route_master))];
        var modes_nb = Math.max(modes.length, route_types.length);
        var template = `
        <div class="w3-row-padding w3-margin-bottom w3-margin-top">
        <div class="w3-quarter">
            <div class="w3-container w3-junglebus w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-code-fork w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${line_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>Routes</h4>
            </div>
        </div>
        <div class="w3-quarter">
            <div class="w3-container w3-orange w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-briefcase w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${networks_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>Networks</h4>
            </div>
        </div>
        <div class="w3-quarter">
            <div class="w3-container w3-junglebus w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-home w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${operators_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>Operators</h4>
            </div>
        </div>
        <div class="w3-quarter">
            <div class="w3-container w3-orange w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-bus w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${modes_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>Modes</h4>
            </div>
        </div>
        </div>
        `
    } else {
        var template = ""; 
    }
    return template
}

function display_table(lines, line_document_element, display_qa = false){
    if (lines.length > 10){
        var table = new Tabulator(line_document_element, {
            data:lines,
            maxHeight:"100%",
            movableRows:true,
            layout:"fitColumns",
            groupBy:"mode",
            pagination:"local",
            paginationSize:20,
            columns:[
                {title:"", field:"thumbnail",  formatter:"html"},
                {title:"Name", field:"name", headerFilter:"input"},
                {title:"Operator", field:"operator", headerFilter:"input"},
                {title:"Network", field:"network", headerFilter:"input"},                
            ],
            rowClick:function(e, row){
                var current_line_id = row.getData().id;
                window.location.href = `route.html?line=${current_line_id}${display_qa ? "&qa=yes" : ""}`;
            },
       });
    } else {
        var template = `
        <table class="w3-table w3-striped w3-white">
        `
    
        for (const tags of lines) {
            template+=`
            <tr>
            <td>
                <transport-thumbnail
                    data-transport-mode="${tags['route_master'] || tags['mode']}"
                    data-transport-line-code="${tags['ref'] || tags['code'] ||' '}"
                    data-transport-line-color="${tags['colour'] || 'grey'}">
                </transport-thumbnail>
            </td>
            <td><a href="route.html?line=${tags['id']}${display_qa ? "&qa=yes" : ""}">${tags["name"]}</a></td>
            <td>${tags["operator"]}</td>
            <td>${tags["network"]}</td>`
            if (tags["comment"]){
                template+= `<td>${tags["comment"]}</td>`
            }
            template+=`</tr>`
        }
        template+= `
        </table>`

        line_document_element.innerHTML = template;
    }
}

