var line_id = get_parameter_from_url('line');
//var line_id = 6117019 //IDF
//var line_id = 10361922 //Abidjan

var display_osmose_issues = (get_parameter_from_url('qa') == "yes") ? true : false;

var additional_name_language = get_parameter_from_url('name_l10n');

unroll_line(line_id)

async function unroll_line(line_id){
    await load_translation_strings();
    var status = await line_data.init_from_overpass(line_id);
    if (status !="ok"){
        console.error(status);
        document.getElementById("error").innerHTML = mutualised_display_error(status);
    }

    var data_age = line_data.get_data_age();
    document.getElementById("credits").innerHTML = mutualised_display_credits("relation", line_id);
    document.getElementById("data_age").textContent = data_age;

    var trip_number = line_data.get_trips_number();
    var line_tags = line_data.get_tags();

    document.getElementById("line_title").innerHTML = display_line_title(line_tags);
    document.getElementById("line_detail").innerHTML = display_line_details(line_tags, trip_number);
    document.getElementById("line_schedules").innerHTML = display_line_or_route_schedules(line_tags, line_id);

    mutualised_get_and_display_wikidata_info(line_tags);
    get_and_display_line_fares(line_tags);
    get_and_display_on_demand_info(line_id, line_tags);
    get_and_display_external_info(line_id, line_tags);

    if (display_osmose_issues){
        var osmose_issues = await mutualised_get_osmose_issues("relation", line_id);
        if (osmose_issues.length > 0){
            document.getElementById("osmose_issues").innerHTML = mutualised_display_osmose_issues(osmose_issues);
        }
    }

    var trips = line_data.get_trips();
    for (var i = 0; i < trips.length; i++) {
        var route_title = document.createElement("h5");
        var route = trips[i];
        route_title.innerHTML = display_route_title(route['tags']);
        trip_list.appendChild(route_title);

        var route_map = document.createElement("div");
        route_map.classList.add("w3-container");
        route_map.innerHTML = init_route_map(route['tags'], route["stop_list"], route["id"]);
        trip_list.appendChild(route_map);

        var map_id = "map_" + route["id"]
        display_route_map(map_id, route['tags']['colour'], route["shape"], route["stop_list"]);

        if (route['tags']['interval']){
            var route_schedule = document.createElement("div");
            route_schedule.classList.add("w3-container");
            route_schedule.innerHTML = display_line_or_route_schedules(route['tags'], route["id"]);
            trip_list.appendChild(route_schedule);
        }

        if (display_osmose_issues){
            var osmose_issues = await mutualised_get_osmose_issues("relation", route["id"])
            if (osmose_issues.length > 0){
                var osmose_detail = document.createElement("div");
                osmose_detail.classList.add("w3-container");
                osmose_detail.innerHTML = mutualised_display_osmose_issues(osmose_issues);
                trip_list.appendChild(osmose_detail); 
            }
        }
    }

}

function display_line_title(tags){
    var template = `
    <div class="w3-container w3-card w3-white w3-margin-bottom" id="line_title">
        <h2 class="w3-text-grey w3-padding-16">
            <transport-thumbnail
                data-transport-mode="${tags['route_master']}"
                data-transport-line-code="${tags['ref'] || ' '}"
                data-transport-line-color="${tags['colour'] || tags['vehicle:colour']}">
            </transport-thumbnail>
            ${tags['name'] || "??" }
        </h2>
    </div>
    `
    return template
}

function display_line_details(tags, trip_number){
    var additional_detail = '';
    if (tags['wheelchair'] && tags['wheelchair'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-wheelchair w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Wheelchair:"]} ${tags['wheelchair']}</p>`
    }
    if (tags['school'] && tags['school'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-graduation-cap w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["School:"]} ${tags['school']}</p>`
    }
    if (tags['tourism'] && tags['tourism'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-camera-retro w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Tourism:"]} ${tags['tourism']}</p>`
    }
    if (tags['on_demand'] && tags['on_demand'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-phone w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["On demand:"]} ${tags['on_demand']}</p>`
    }
    if (tags['bicycle'] && tags['bicycle'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-solid fa-bicycle w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Bicycle:"]} ${tags['bicycle']}</p>`
    }    
    if (additional_detail){
        additional_detail = "<hr>" + additional_detail + "<hr>"
    }

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Details"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=remote&relation=${line_id}" target="_blank">${i18n_messages["Edit details"]}</a></h6>
          <p><i class="fa fa-briefcase fa-fw w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Network:"]} ${tags['network'] || "??" }</p>
          <p><i class="fa fa-home fa-fw w3-margin-right w3-large w3-text-junglebus"></i>${i18n_messages["Operator:"]} ${tags['operator'] || "??" }</p>
          ${additional_detail}
          <p><i class="fa fa-fw fa-arrows-h w3-margin-right w3-large w3-text-junglebus"></i>${trip_number || "??" } ${i18n_messages["trips"]}</p>
        </div>
      </div>
    `
    return template
}

function display_line_fares(tags){
    var fare = tags['charge']
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Fares"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=id&relation=${line_id}" target="_blank">${i18n_messages["Edit Fares"]}</a></h6>
          <p><i class="fa fa-money fa-fw w3-margin-right w3-large w3-text-junglebus"></i>${fare}</p>
        </div>
      </div>
    `
    return template
}

function get_and_display_line_fares(tags){
    if (tags['charge']){
        document.getElementById("line_fares").innerHTML = display_line_fares(tags);
    }
}

function display_line_or_route_schedules(tags, relation_id){
    if (tags['interval'] && tags['opening_hours']){
        var th = new TransportHours();
        var result = th.tagsToHoursObject(tags);
        var all_intervals = result['allComputedIntervals']
        if (all_intervals == "invalid"){
            var one_liner = `<p><i class="fa fa-calendar fa-fw w3-margin-right"></i>${i18n_messages["Invalid schedules"]}</p>`
        } else {
                var one_liner = '';
            for (i = 0; i < all_intervals.length; i++) {
                var period_name = all_intervals[i]['days'].join(" - ");
                one_liner += `<p><i class="fa fa-calendar fa-fw w3-margin-right"></i> ${period_name} </p>`;
                var intervals = {};
                Object.keys(all_intervals[i]['intervals']).sort().forEach(function(key) {
                  intervals[key] = all_intervals[i]['intervals'][key];
                });
                for (var interval_hours in intervals) {
                    one_liner += `<p class="w3-container"><i class="fa fa-fw fa-clock-o"></i> ${interval_hours} <i class="fa fa-hourglass-start"></i> ${intervals[interval_hours]} min</p>`
                }
            }
        }
    } else if (tags['interval']) {
        var one_liner = `<p><i class="fa fa-hourglass-start"></i> ${i18n_messages["Every "]}${tags['interval']} min</p>`
    } else if (tags['opening_hours']) {
        var one_liner = `<p><i class="fa fa-hourglass-start"></i> ${i18n_messages["Runs on "]}${tags['opening_hours']}</p>`
    } else {
        var one_liner = `<p><i class="fa fa-calendar fa-fw w3-margin-right"></i>${i18n_messages["Unknown schedules"]}</p>`
    }

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Schedules"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://jungle-bus.github.io/Busy-Hours/#/line/${relation_id}" target="_blank">${i18n_messages["Edit schedules"]}</a></h6>
          ${one_liner}
        </div>
      </div>
    `
    return template
}
function display_route_title(tags){
    var template = `
    <h5 class="w3-opacity">
        <transport-thumbnail
            data-transport-network="${tags['network'] || '??'}"
            data-transport-mode="${tags['route'] || 'bus'}"
            data-transport-line-code="${tags['ref'] || ' '}"
            data-transport-line-color="${tags['colour'] || "grey"}"
            data-transport-destination="${tags['to'] || '??'}">
        </transport-thumbnail>
     </h5>
    `
    return template
}

function create_stop_list_for_a_route(stop_list, route_colour) {
    var route_colour = route_colour || 'grey';
    var inner_html = ''
    for (var i = 0; i < stop_list.length; i++) {
        stop = stop_list[i]
        if (i != stop_list.length - 1) {
            var border_color = route_colour;
        } else { // remove the border so the stop list ends with a dot
            var border_color = "#FFF";
        }

        var add_name = "";
        if (additional_name_language){
            var add_name = stop['properties']['name:'+ additional_name_language] || "";
        }

        inner_html += `<div class="stop_item" style="border-left-color:${border_color};">`;

        inner_html += `
          <span class="stop_dot" style="border-color:${route_colour};"></span>
          <span><sup>${stop['properties'][`name:${current_language}`] || stop['properties']['name'] || i18n_messages['unamed stop']} ${add_name}</sup></span>

          `
        inner_html += `
        </div>
        `
    }

    return inner_html
};

function init_route_map(tags, stop_list, relation_id){
    var stop_list = create_stop_list_for_a_route(stop_list, tags['colour'])
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b> ${i18n_messages["Map and stops"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=remote&relation=${relation_id}" target="_blank">${i18n_messages["Edit trip"]} </a></h6>
          <p><b>${tags['name'] || '??'}</b></p>
          <ul>
                <li>${i18n_messages["Origin:"]} ${tags['from'] || '??'}
                <li>${i18n_messages["Destination:"]} ${tags['to'] || '??'}
        `
    if (tags['duration']){
        template += `<li>${i18n_messages["Travel time:"]} ${tags['duration'] || i18n_messages['unknown']}`;
        }
    template +=`
            </ul>
          <p>${stop_list}</p>
          <div id="map_${relation_id}" style="height: 280px;"></div>
        </div>
      </div>
    `
    return template
}

function display_route_map(map_id, route_colour, route_geojson, stops_geojson){
    var map = L.map(map_id).setView([48.84702, 2.37705], 14);

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        opacity: 0.6,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.scale().addTo(map);


    var line_weight = 4;
    var line_colour = route_colour || "grey";
    var feature_outlines = L.geoJson(route_geojson, {
                            color: "#000",
                            weight: line_weight + 4,
                            offset: 0
                        }).addTo(map);
    var feature_background = L.geoJson(route_geojson, {
                            color: "#fff",
                            weight: line_weight + 2,
                            opacity: 1,
                            offset: 0
                        }).addTo(map);
    var feature = L.geoJson(route_geojson, {
                            color: line_colour,
                            weight: line_weight,
                            opacity: 1,
                            offset: 0
                        }).addTo(map);

    function add_popup(feature, layer) {
        layer.bindPopup(`<a href="http://www.openstreetmap.org/${feature.properties.id}" target="_blank">${feature.properties.name || i18n_messages['unamed stop']}</a>`);
    }
    function display_platforms(feature, latlng) {
        var myicon = L.icon({
            iconUrl: 'img/stop.png',
        });
        return L.marker(latlng, {
            icon: myicon,
            iconAnchor:   [5, 5],
        })

    }
    var feature_platforms = L.geoJson(stops_geojson, {
                                        onEachFeature: add_popup,
                                        pointToLayer: display_platforms
                                        }).addTo(map);

    if (feature.getBounds().isValid()){
        map.fitBounds(feature.getBounds());
    } else {
        map.fitBounds(feature_platforms.getBounds());
    }

}


function get_and_display_on_demand_info(relation_id, tags){
    if (tags['on_demand'] === 'yes') {
        var title = i18n_messages["This line has on demand services."];
    }
    else if (tags['on_demand'] === 'only') {
        var title = i18n_messages["This line is on demand."];
    } 
    else if (tags['hail_and_ride'] === 'partial' || tags['hail_and_ride'] === 'yes') {
        var title = i18n_messages["There are some sections on this route with no fixed stops, where you can get on or off the vehicle anywhere along the road by giving a sign to the driver"];
    } else {
        return
    }
    

    var description = tags['on_demand:description'] || tags['hail_and_ride:description'];
    var contact_phone = tags['on_demand:phone'] || tags['phone'] || tags['contact:phone'];
    var contact_website = tags['on_demand:website'] || tags['website'] || tags['contact:website'];

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["On demand conditions"]}</b></h5>
          <p>${title}</p>`
          
    if (description) {
        template += `<p><i class="fa fa-info fa-fw w3-margin-right w3-large w3-text-junglebus"></i>${description}</p>`
    }
    if (contact_phone) {
        template += `<p><i class="fa fa-phone fa-fw w3-margin-right w3-large w3-text-junglebus"></i>${contact_phone}</p>`
    }
    if (contact_website) {
        template += `<p><i class="fa fa-external-link fa-fw w3-margin-right w3-large w3-text-junglebus"></i><a href="${contact_website}" target="_blank">${contact_website}</a></p>`
    }
    template += `
          </div>
      </div>
    `
    document.getElementById("line_on_demand_info").innerHTML = template
}

function get_and_display_external_info(relation_id, tags){
    if (tags["ref:FR:STIF"]){
        var vianavigo_base_url = "https://me-deplacer.iledefrance-mobilites.fr/en/timetables/bus";
        if (current_language == "fr"){
            vianavigo_base_url = "https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/bus"
        }
        var template = `
        <div class="w3-container w3-card w3-white w3-margin-bottom">
          <div class="w3-container">
            <h5 class="w3-opacity"><b>${i18n_messages["External links"]}</b></h5>
            <p>
                <img src="https://me-deplacer.iledefrance-mobilites.fr/favicon.ico" alt="vianavigo icon" class="w3-margin-right" style="width:24px">
                <a href="${vianavigo_base_url}/line:IDFM:${tags["ref:FR:STIF"]}" target="_blank">${i18n_messages["See the timetable on Île-de-France Mobilités website"]}</a>
            </p>
            <p>
                <img src="https://data.iledefrance-mobilites.fr/favicon.ico" alt="idfm opendata icon" class="w3-margin-right" style="width:24px">
                <a href="https://ref-lignes-stif.5apps.com/line.html?osm_relation=${relation_id}" target="_blank">${i18n_messages["Compare open data and OpenStreetMap"]}</a>
            </p>
          </div>
        </div>
      `;
      document.getElementById("line_external_links").innerHTML = template;
    }
}
