var line_id = get_parameter_from_url('line');
//var line_id = 6117019 //IDF
//var line_id = 10361922 //Abidjan

var display_osmose_issues = (get_parameter_from_url('qa') == "yes") ? true : false;

unroll_line(line_id)

async function unroll_line(line_id){
    var status = await line_data.init_from_overpass(line_id);
    if (status !="ok"){
        console.error(status);
        document.getElementById("error").innerHTML = display_error(status);
    }

    var data_age = line_data.get_data_age();
    document.getElementById("credits").innerHTML = display_credits(line_id);
    document.getElementById("data_age").textContent = data_age;

    var trip_number = line_data.get_trips_number();
    var line_tags = line_data.get_tags();

    document.getElementById("line_title").innerHTML = display_line_title(line_tags);
    document.getElementById("line_detail").innerHTML = display_line_details(line_tags, trip_number);
    document.getElementById("line_fares").innerHTML = display_line_fares(line_tags);
    document.getElementById("line_schedules").innerHTML = display_line_or_route_schedules(line_tags, line_id);

    get_and_display_wikidata_info(line_tags);

    if (display_osmose_issues){
        var osmose_issues = await get_osmose_issues(line_id)
        if (osmose_issues.length > 0){
            document.getElementById("osmose_issues").innerHTML = display_line_or_route_issues(osmose_issues);
        }
    }

    var trips = line_data.get_trips();
    for (i = 0; i < trips.length; i++) {
        var route_title = document.createElement("h5");
        route = trips[i];
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
            var osmose_issues = await get_osmose_issues(route["id"])
            if (osmose_issues.length > 0){
                var osmose_detail = document.createElement("div");
                osmose_detail.classList.add("w3-container");
                osmose_detail.innerHTML = display_line_or_route_issues(osmose_issues);
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
                data-transport-line-color="${tags['colour']}">
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
        additional_detail += `<p><i class="fa fa-fw fa-wheelchair w3-margin-right w3-large w3-text-junglebus"></i>Wheelchair: ${tags['wheelchair']}</p>`
    }
    if (tags['school'] && tags['school'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-graduation-cap w3-margin-right w3-large w3-text-junglebus"></i>School: ${tags['school']}</p>`
    }
    if (tags['tourism'] && tags['tourism'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-camera-retro w3-margin-right w3-large w3-text-junglebus"></i>Tourism: ${tags['tourism']}</p>`
    }
    if (tags['on_demand'] && tags['on_demand'] != "no"){
        additional_detail += `<p><i class="fa fa-fw fa-phone w3-margin-right w3-large w3-text-junglebus"></i>On demand: ${tags['on_demand']}</p>`
    }
    if (additional_detail){
        additional_detail = "<hr>" + additional_detail + "<hr>"
    }

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>Details</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=remote&relation=${line_id}" target="_blank">Edit details </a></h6>
          <p><i class="fa fa-briefcase fa-fw w3-margin-right w3-large w3-text-junglebus"></i>Network: ${tags['network'] || "??" }</p>
          <p><i class="fa fa-home fa-fw w3-margin-right w3-large w3-text-junglebus"></i>Operator: ${tags['operator'] || "??" }</p>
          ${additional_detail}
          <p><i class="fa fa-fw fa-arrows-h w3-margin-right w3-large w3-text-junglebus"></i>${trip_number || "??" } trips</p>
        </div>
      </div>
    `
    return template
}

function display_line_fares(tags){
    if (tags['charge']){
        var fare = tags['charge']
    } else {
        var fare = "Unknown price"
    }

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>Fares</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=id&relation=${line_id}" target="_blank">Edit Fares </a></h6>
          <p><i class="fa fa-money fa-fw w3-margin-right w3-large w3-text-junglebus"></i>${fare}</p>
        </div>
      </div>
    `
    return template
}

function display_line_or_route_schedules(tags, relation_id){
    if (tags['interval'] && tags['opening_hours']){
        var th = new TransportHours();
        var result = th.tagsToHoursObject(tags);
        var all_intervals = result['allComputedIntervals']
        if (all_intervals == "invalid"){
            var one_liner = '<p><i class="fa fa-calendar fa-fw w3-margin-right"></i>Invalid schedules</p>'
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
        var one_liner = `<p><i class="fa fa-hourglass-start"></i> Every ${tags['interval']} min</p>`
    } else if (tags['opening_hours']) {
        var one_liner = `<p><i class="fa fa-hourglass-start"></i> Runs on ${tags['opening_hours']}</p>`
    } else {
        var one_liner = '<p><i class="fa fa-calendar fa-fw w3-margin-right"></i>Unknown schedules</p>'
    }

    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>Schedules</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://jungle-bus.github.io/Busy-Hours/#/line/${relation_id}" target="_blank">Edit schedules</a></h6>
          ${one_liner}
        </div>
      </div>
    `
    return template
}

function display_line_wikipedia_extract(wikipedia_info){
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>Wikipedia</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-wikipedia-w fa-fw w3-margin-right"></i><a href="${wikipedia_info['url']}" target="_blank">Read more on Wikipedia </a></h6>
          <p>`
    if (wikipedia_info['image']){
        template += `<img src="${wikipedia_info['image']}" alt="image from wikimedia commons" class="w3-left w3-circle w3-margin-right" style="width:150px">`;

    }
    template += `${wikipedia_info['extract']} ...</p>
        </div>
      </div>
    `
    return template
}

function display_line_images(commons_images){
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>Images</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-wikipedia-w fa-fw w3-margin-right"></i><a href="${commons_images['url']}" target="_blank">See on Wikidata </a></h6>`

    for (var image of commons_images['images_list']){
        template += `<img src="${image}" alt="image from wikimedia commons" class="">   `
    }
    template += `
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
            data-transport-line-code="${tags['ref'] || '??'}"
            data-transport-line-color="${tags['colour'] || "grey"}"
            data-transport-destination="${tags['to'] || '??'}">
        </transport-thumbnail>
     </h5>
    `
    return template
}

function display_line_or_route_issues(issues){
    var template = `
      <div class="w3-container w3-card w3-white w3-leftbar w3-border-red">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>Issues</b></h5>
          <ul>`

    for (var issue of issues){
        template += `<li>${issue['osmose_text']} : <a href="${issue['osmose_issue_id']}" target="_blank">Osmose</a> / <a href="${issue['osmose_map']}" target="_blank">Osmose Map</a>`
    }
    template += `
        </ul>
        </div>
      </div>
    `
    return template
}

function create_stop_list_for_a_route(stop_list, route_colour) {
    var route_colour = route_colour || 'grey';
    var inner_html = ''
    for (const stop of stop_list) {

        if (stop != stop_list[stop_list.length - 1]) {
            var border_color = route_colour;
        } else { // remove the border so the stop list ends with a dot
            var border_color = "#FFF";
        }

        inner_html += `<div class="stop_item" style="border-left-color:${border_color};">`;

        inner_html += `
          <span class="stop_dot" style="border-color:${route_colour};"></span>
          <span><sup>${stop['properties']['name'] || 'unamed stop'}</sup></span>

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
          <h5 class="w3-opacity"><b> Map and stops</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://www.openstreetmap.org/edit?editor=remote&relation=${relation_id}" target="_blank">Edit trip </a></h6>
          <p>Origin: ${tags['from'] || '??'}</p>
          <p>Destination: ${tags['to'] || '??'}</p>
          <p>Travel time: ${tags['duration'] || 'unknown'}</p>
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
        layer.bindPopup(`<a href="http://www.openstreetmap.org/${feature.properties.id}" target="_blank">${feature.properties.name || 'unamed stop'}</a>`);
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

function display_credits(relation_id){
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
        <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://openstreetmap.org/relation/${relation_id}" target="_blank">See on OpenStreetMap </a></h6>
        	<img src="img/osm.svg" alt="OSM Logo" class="w3-left w3-margin-right" style="width:60px">
      		<p>This information comes from <a href="https://openstreetmap.org/" target="_blank">OpenStreetMap</a>, the free and collaborative map. Join the community to complete or correct the detail of this route!</p><br>
        </div>
      </div>
    `
    return template
}

async function get_osmose_issues(relation_id){
    var osmose_url = `http://osmose.openstreetmap.fr/en/api/0.3beta/issues?osm_type=relation&osm_id=${relation_id}&full=true`
    var osmose_response = await fetch(osmose_url);
    var osmose_data = await osmose_response.json();
    var issues = osmose_data['issues'];
    osmose_to_display = [];
    for (const issue of issues){
        var osmose_map_url = `https://osmose.openstreetmap.fr/en/map/?item=${issue['item']}&zoom=17&lat=${issue['lat']}&lon=${issue['lon']}`
        osmose_to_display.push({
            "osmose_issue_id": `https://osmose.openstreetmap.fr/en/error/${issue['id']}`,
            "osmose_text": issue['title']['auto'],
            "osmose_map": osmose_map_url
        })
    }
    return osmose_to_display
}

async function get_and_display_wikidata_info(tags){
    var wikidata_id = tags["wikidata"];

    var operator_wikidata_id = tags["operator:wikidata"];
    var network_wikidata_id = tags["network:wikidata"];
    if (tags["wikipedia"]){
        var wikipedia_url = `https://fr.wikipedia.org/wiki/${tags["wikipedia"]}?uselang=en-US`;
        var wikipedia_id = tags["wikipedia"].split(":")[1];
        var wikipedia_lang = tags["wikipedia"].split(":")[0];
    }

    var images = []
    if (wikidata_id){
        var wikidata_url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidata_id}.json`
        var wikidata_response = await fetch(wikidata_url);
        var wikidata_data = await wikidata_response.json();
        var wikidata_content = wikidata_data['entities'][wikidata_id]
        if (wikidata_content['sitelinks']['enwiki']){
            var wikipedia_url = wikidata_content['sitelinks']['enwiki']['url'];
            var wikipedia_id = wikidata_content['sitelinks']['enwiki']['title'];
            var wikipedia_lang = "en"
        }
        if (wikidata_content['claims']['P18']){ //image
            var image_name = wikidata_content['claims']['P18'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P154']){ //logo
            var image_name = wikidata_content['claims']['P154'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P137']){ //operator
            var operator_wikidata_id = wikidata_content['claims']['P137'][0]['mainsnak']['datavalue']['value']['id']
        }
        if (wikidata_content['claims']['P361']){ //network
            var network_wikidata_id = wikidata_content['claims']['P361'][0]['mainsnak']['datavalue']['value']['id']
        }
    }
    if (network_wikidata_id){
        var wikidata_url = `https://www.wikidata.org/wiki/Special:EntityData/${network_wikidata_id}.json`
        var wikidata_response = await fetch(wikidata_url);
        var wikidata_data = await wikidata_response.json();
        var wikidata_content = wikidata_data['entities'][network_wikidata_id]
        if (wikidata_content['claims']['P154']){ //logo
            var image_name = wikidata_content['claims']['P154'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P18']){ //image
            var image_name = wikidata_content['claims']['P18'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
    }
    if (operator_wikidata_id){
        var wikidata_url = `https://www.wikidata.org/wiki/Special:EntityData/${operator_wikidata_id}.json`
        var wikidata_response = await fetch(wikidata_url);
        var wikidata_data = await wikidata_response.json();
        var wikidata_content = wikidata_data['entities'][operator_wikidata_id]
        if (wikidata_content['claims']['P154']){ //logo
            var image_name = wikidata_content['claims']['P154'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P18']){ //image
            var image_name = wikidata_content['claims']['P18'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
    }

    if (wikipedia_id){
        var wikipedia_api_url = `https://${wikipedia_lang}.wikipedia.org/api/rest_v1/page/summary/${wikipedia_id}`
        var wikipedia_response = await fetch(wikipedia_api_url);
        var wikipedia_data = await wikipedia_response.json();
        var wikipedia_extract = wikipedia_data['extract'];
        if (wikipedia_extract){
            var wikipedia = {
                "url": wikipedia_url,
                "image" : images[0],
                "extract": wikipedia_extract
            }
            document.getElementById("line_wikipedia").innerHTML = display_line_wikipedia_extract(wikipedia);
        }
    }

    if (images.length > 0){
        var wikidata_and_commons = {
            "images_list": images,
            "url": `https://www.wikidata.org/wiki/${wikidata_id}`
        }
        document.getElementById("line_commons").innerHTML = display_line_images(wikidata_and_commons);
    }
}

function display_error(error_message){
    var template = `
    <div class="w3-panel w3-pale-red w3-leftbar w3-border-red">
        ${error_message}
    </div>
    `
    return template
}

function get_parameter_from_url(param_name) {
    param_name = param_name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + param_name + "=([^&#]*)"),
        results = regex.exec(location.href);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
