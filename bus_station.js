var bus_station_id = get_parameter_from_url('bus_station_id');
if (!bus_station_id) {
    bus_station_id = "w83595319"; // Poissy Sud
}

// some good bus stations to test
//var bus_station_id = "r10918865" // Chelles
//var bus_station_id = "w741056551" //Villejuif (wiki) - wifi
//var bus_station_id = "w401608508" // Meaux
//var bus_station_id = "w192747673" //Torcy (local_ref)
//var bus_station_id = "w334697705" // Gare sud abidjan
//var bus_station_id = "w1016622036" // Les Mureaux
//var bus_station_id = "w997211475" //Vernouillet Verneuil
//var bus_station_id = "w148818296" //Poissy Nord
//var bus_station_id = "r18380036" // Cergy Prefecture
//var bus_station_id = "w466894981" // Cergy St-Christophe

var display_osmose_issues = (get_parameter_from_url('qa') == "yes") ? true : false;

var additional_name_language = get_parameter_from_url('name_l10n'); // not used for now

unroll_bus_station(bus_station_id)

async function unroll_bus_station(bus_station_id) {
    await load_translation_strings();
    var status = await bus_station_data.init_from_overpass(bus_station_id);
    if (status != "ok") {
        console.error(status);
        document.getElementById("error").innerHTML = mutualised_display_error(status);
    }

    var data_age = bus_station_data.get_data_age();
    var osm_type = "way"
    if (bus_station_id.startsWith("r")) {
        var osm_type = "relation";
    }
    document.getElementById("credits").innerHTML = mutualised_display_credits(osm_type, bus_station_id.substr(1));
    document.getElementById("data_age").textContent = data_age;

    var bus_station_tags = bus_station_data.get_tags();

    document.getElementById("bus_station_name").innerHTML = bus_station_tags['name'] || "??";
    document.getElementById("bus_station_detail").innerHTML = display_bus_station_details(bus_station_tags, bus_station_id);

    mutualised_get_and_display_wikidata_info(bus_station_tags);
    document.getElementById("bus_station_map").innerHTML = init_bus_station_map(osm_type, bus_station_id);
    

    if (display_osmose_issues) {
        var osmose_issues = await mutualised_get_osmose_issues(osm_type, bus_station_id.substring(1))
        if (osmose_issues.length > 0) {
            document.getElementById("osmose_issues").innerHTML = mutualised_display_osmose_issues(osmose_issues);
        }
    }

    var stops = bus_station_data.get_stops();
    var shape = bus_station_data.get_shape();
    display_bus_station_map("map", stops, shape);
    
    for (var i = 0; i < stops.length; i++) {
        var current_stop = stops[i];
        var local_ref = current_stop['tags']['local_ref'] || `<i> ${i}</i>`

        if (i % 2 == 0) {
            var row_of_stops = document.createElement("div");
            row_of_stops.classList.add("w3-cell-row");
            stop_list.appendChild(document.createElement("p"));
            stop_list.appendChild(row_of_stops);
        }
        var current_stop_block = document.createElement("div");
        current_stop_block.classList.add("w3-container");
        current_stop_block.classList.add("w3-cell");
        current_stop_block.style.width = '50%';
        row_of_stops.appendChild(current_stop_block);

        var current_stop_content = document.createElement("div");
        current_stop_content.innerHTML = display_stop_in_bus_station_details(current_stop, local_ref)
        current_stop_block.appendChild(current_stop_content);

        if (display_osmose_issues) {
            var osmose_issues = await mutualised_get_osmose_issues("node", current_stop["id"])
            if (osmose_issues.length > 0) {
                var osmose_detail = document.createElement("div");
                osmose_detail.classList.add("w3-container");
                osmose_detail.innerHTML = mutualised_display_osmose_issues(osmose_issues);
                current_stop_block.appendChild(document.createElement("p"));
                current_stop_block.appendChild(osmose_detail);
            }
        }
    }

}

function display_stop_in_bus_station_details(stop_info, stop_number) {
    var open_data_link = '';
    if (stop_info["tags"]['ref:FR:STIF']) {
        open_data_link = `
    <p>
        <img src="https://data.iledefrance-mobilites.fr/favicon.ico" alt="idfm opendata icon"
      class="w3-margin-right" style="width:24px">
        <a href="https://ref-lignes-stif.5apps.com/stop.html?osm_stop_id=${stop_info['id']}" target="_blank">Compare open data and OpenStreetMap</a>
    </p>
    `
    }

    var additional_detail_template = '';
    var additional_detail = stop_info["tags"]["description"] || stop_info["tags"]["note"] || stop_info["tags"]["note:fr"];
    if (additional_detail) {
        additional_detail_template = `
        <p>
        <i class="fa fa-info fa-fw w3-margin-right"></i> ${additional_detail}
        </p> 
        `
    }


    var routes_list_template = ''
    if (stop_info["route_list"].length < 1 && stop_info["tags"]["route_ref"]) {
        routes_list_template = `
        <p>
        <i class="fa fa-info fa-fw w3-margin-right"></i> ${stop_info["tags"]["route_ref"]}
        </p> 
        `
    } else {
        routes_list_template = '<div class="w3-container"><ul class="w3-ul w3-hoverable">'
        for (var route of stop_info["route_list"]) {
            routes_list_template += `<li>
            <transport-thumbnail
                data-transport-line-code="${route['ref'] || ' '}"
                data-transport-line-color="${route['colour']}"
                data-transport-destination="${route['destination'] || "<i> ??</i>"}">
            </transport-thumbnail>
             </li>`
        }
        routes_list_template += '</ul></div>'
    }

    var template = `
	<div class="w3-card w3-container w3-white">
	  <h5 class="w3-opacity"># ${stop_number}</h5>
      <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/node/${stop_info['id']}" target="_blank">${i18n_messages["See on OpenStreetMap"]}</a></h6>
    ${open_data_link}
    ${additional_detail_template}
    ${routes_list_template}
	</div>
    `
    return template
}

function display_bus_station_details(tags,bus_station_id) {
    var osm_type = "way"
    if (bus_station_id.startsWith("r")) {
        var osm_type = "relation";
    }
    var additional_detail = '';
    if (tags['wheelchair'] && tags['wheelchair'] != "no") {
        additional_detail += `<p><i class="fa fa-fw fa-wheelchair w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Wheelchair:"]} ${tags['wheelchair']}</p>`
    }
    if (tags['toilets'] && tags['toilets'] != "no") {
        additional_detail += `<p><i class="fa fa-fw fa-restroom w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Toilets:"]} ${tags['toilets']}</p>`
    }
    if (tags['internet_access'] && tags['internet_access'] != "no") {
        additional_detail += `<p><i class="fa fa-fw fa-wifi w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Internet access:"]} ${tags['internet_access']}</p>`
    }
    if (additional_detail) {
        additional_detail = "<hr>" + additional_detail + "<hr>"
    }

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Details"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=remote&${osm_type}=${bus_station_id.substr(1)}" target="_blank">${i18n_messages["Edit details"]}</a></h6>
          ${additional_detail}
        </div>
      </div>
    `
    return template
}

function init_bus_station_map(osm_type, bus_station_id) {
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b> ${i18n_messages["Map and stops"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=remote&${osm_type}=${bus_station_id.substr(1)}" target="_blank">${i18n_messages["Edit details"]}</a></h6>
          <div id="map" style="height: 480px;"></div>
        </div>
      </div>
    `
    return template
}

function display_bus_station_map(map_id, stop_list, bus_station_shape) {
    var map = L.map(map_id).setView([48.84702, 2.37705], 14);

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        opacity: 0.6,
        maxZoom: 20,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.scale().addTo(map);

    var myicon = L.icon({
            iconUrl: 'img/stop.png',
    });
    for (var i = 0; i < stop_list.length; i++) {
        var current_stop = stop_list[i];
        var latlng = [current_stop['lat'], current_stop['lon']];
        var label = current_stop['tags']['local_ref'] || `<i> ${i}</i>`;

        L.marker(latlng, {
            icon: myicon,
            iconAnchor: [5, 5],
        }).addTo(map)
        .bindTooltip("# "+label,{permanent:true,direction:'center'})
        .bindPopup(`<a href="http://www.openstreetmap.org/node/${current_stop['id']}" target="_blank">${label}</a>`)
        .on('click', function (e) {
            this.openPopup();
        });

    }

    if (bus_station_shape) {
        var shape = L.geoJSON(bus_station_shape, {
            style: {
                color: '#ff0000',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.1
            }
        }).addTo(map);
        shape.bindPopup(`<a href="http://www.openstreetmap.org/${bus_station_shape['id']}" target="_blank">${bus_station_shape['id']}</a>`);
        shape.on('click', function (e) {
            this.openPopup();
        });
    }


    if (shape &&shape.getBounds().isValid()) {
        map.fitBounds(shape.getBounds());
    } else {
        //zoom to one the markers
        var first_stop = stop_list[0];
        map.setView([first_stop['lat'], first_stop['lon']], 17);
    }

}

