projects = {
    "Thiruvananthapuram":{
        "line_list":"assets/tvm_Data.csv",
        "format": "osm-transit-extractor",
        "qa": true
    },
    "Kochi":{
        "line_list":"https://raw.githubusercontent.com/Jungle-Bus/KochiTransport_exports_ci/gh-pages/lines_for_unroll.csv",
        "format": "prism",
        "qa": true
    }
}

async function on_load(){
    await load_translation_strings();
    var project_id = get_parameter_from_url('project');

    if (project_id){
        if (projects[project_id]["format"] == "osm-transit-extractor"){
            display_from_osm_transit_extractor_csv_list(projects[project_id]["line_list"], projects[project_id]["qa"])
        }
        if (projects[project_id]["format"] == "prism"){
            display_from_prism_csv_list(projects[project_id]["line_list"], projects[project_id]["qa"])
        }        
    }
}

function display_examples(){
    var lines_examples = [
        {
            "id": 10831516,
            "ref":"",
            "mode":"bus",
            "colour":"blue",
            "operator":"Private Owners",
            "network":"Mofussil Kochi bus",
            "name":"High Court ↔ Nedungad (via Vypin)",
            "district": "Ernakulam"
        },
        {
            "id": 17131270,
            "ref":"9A",
            "mode":"bus",
            "colour":"orange",
            "operator":"KSRTC",
            "network":"city circular",
            "name":"East Fort ↔ East Fort",
            "district": "Thiruvananthapuram"
        },
        {
            "id": 13577501,
            "ref":" ",
            "mode":"bus",
            "colour":"grey",
            "operator":"KSRTC",
            "network":"Ordinary bus",
            "name":"High Court ↔ Aluva (via Eloor)",
            "district": "Ernakulam"
        },
        {
            "id": 10831465,
            "ref":"",
            "mode":"boat",
            "colour":"grey",
            "operator":"KSWTD",
            "network":"Kochi city boat",
            "comment": i18n_messages["With Schedule"],
            "name":"Vypin ↔ Fort Kochi (Ro Ro) ",
            "district": "Ernakulam"
        },
        {
            "id": 17508066,
            "ref":"",
            "mode":"boat",
            "colour":"grey",
            "operator":"Kochi Water Metro Limited",
            "network":"",
            "comment": i18n_messages["with fare"],
            "name":"Fort Kochi ↔ High Court Water Metro",
            "district": "Ernakulam"
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
            error_network_ref.innerHTML = `<p class="w3-text-red">${i18n_messages["Please enter a line number and a network"]}</p>`
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
    lines_table.innerHTML = `<i class="fa fa-spinner fa-spin"></i> ${i18n_messages["searching routes ..."]}`
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
            var not_pt_modes = ['bicycle', 'canoe', 'detour', 'fitness_trail', 'foot', 'hiking', 'horse', 'inline_skates', 'mtb', 'nordic_walking', 'pipeline', 'piste', 'power', 'proposed', 'road', 'running', 'ski', 'historic', 'path', 'junction', 'tracks'];
            if (!(not_pt_modes.includes(line['tags']['mode']))) {
            	lines.push(line['tags'])
            }
        }
        if (lines.length != 0){
            display_table(lines, lines_table)
            lines_stats.innerHTML = display_stats(lines);
            lines_stats.scrollIntoView();
        } else {
            lines_table.innerHTML = `<p>${i18n_messages["No results"]}</p>`;
        }
    })
    .catch(function(error) {
        console.error(error.message);
        lines_table.innerHTML = i18n_messages["Oops, something went wrong!"];
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

function display_from_prism_csv_list(url, add_qa_to_url){
    Papa.parse(url, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            results.data.splice(-1, 1);
            for (var line of results.data){
                line['id'] = line['line_id'].slice(1);
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
            <h4>${i18n_messages["Routes"]}</h4>
            </div>
        </div>
        <div class="w3-quarter">
            <div class="w3-container w3-orange w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-briefcase w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${networks_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>${i18n_messages["Networks"]}</h4>
            </div>
        </div>
        <div class="w3-quarter">
            <div class="w3-container w3-junglebus w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-home w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${operators_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>${i18n_messages["Operators"]}</h4>
            </div>
        </div>
        <div class="w3-quarter">
            <div class="w3-container w3-orange w3-text-white w3-padding-16">
            <div class="w3-left"><i class="fa fa-bus w3-xxxlarge"></i></div>
            <div class="w3-right">
                <h3>${modes_nb}</h3>
            </div>
            <div class="w3-clear"></div>
            <h4>${i18n_messages["Modes"]}</h4>
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
            layout:"fitColumns",
            groupBy:"mode",
            initialSort:[
                {column:"thumbnail", dir:"asc"},
            ],
            pagination:"local",
            paginationSize:20,
            columns:[
                {title:"", field:"thumbnail",  formatter:"html", sorter:"alphanum"},
                {title:i18n_messages["Name"], field:"name", headerFilter:"input"},
                {title:i18n_messages["Operator"], field:"operator", headerFilter:"input"},
                {title:i18n_messages["Network"], field:"network", headerFilter:"input"},                
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
            <td>${tags["district"]}</td>
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
