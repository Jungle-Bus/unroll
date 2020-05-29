

var line_id = get_parameter_from_url('line');
//var line_id = 6117019 //IDF
//var line_id = 10361922 //Abidjan 

overpass_data = get_line_info_from_overpass(line_id);

function get_line_info_from_overpass(line_id) {
    var overpass_url = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];relation(${line_id});(._;>>;);out;`
    fetch(overpass_url)
        .then(function(data) {
            return data.json()
        })
        .then(function(data) {
            //var relation = data.elements.reverse()[0];
            var other_relations = {}
            for (i = 0; i < data['elements'].length; i++) {
                if (data['elements'][i]['id'] == line_id) {
                    relation = data['elements'][i];
                } else if (data['elements'][i]['type'] == "relation") {
                    var relation_id = data['elements'][i]['id'];
                    other_relations[relation_id] = data['elements'][i];
                }
            }
            
            if (relation['tags']['type'] != 'route_master') {
                console.error("This is not a public transport line")
            }
            
            document.getElementById("credits").innerHTML = display_credits();
            document.getElementById("data_age").textContent = data_age;

            var trip_number = relation['members'].length;
            var data_age = data['osm3s']['timestamp_osm_base'];
            
            document.getElementById("line_title").innerHTML = display_line_title(relation['tags']);
            document.getElementById("line_detail").innerHTML = display_line_details(relation['tags'], trip_number);
            document.getElementById("line_fares").innerHTML = display_line_fares(relation['tags']);
            document.getElementById("line_schedules").innerHTML = display_line_or_route_schedules(relation['tags'], line_id);
            
            var trip_list = document.getElementById("trip_list")
            var data_as_geojson = osmtogeojson(data);
            
            for (i = 0; i < relation['members'].length; i++) {
                var route_id = relation['members'][i]['ref'];
                var route = other_relations[route_id];
                
                var geojson_elems = {}
                for (j = 0; j < data_as_geojson['features'].length; j++) {
                    if (data_as_geojson['features'][j]['id'] == "relation/"+route_id) {
                        var geojson_feature = data_as_geojson['features'][j]
                    } else {
                        geojson_elems[data_as_geojson['features'][j]['id']] = data_as_geojson['features'][j]
                    }
                }
                
                var platform_list_as_geojson = []
                route['members']
                    .filter(member => member['role'].startsWith("platform"))
                    .map(member => platform_list_as_geojson.push(geojson_elems[member['type'] + '/' + member['ref']]));
                
                var stop_position_list_as_geojson = []
                route['members']
                    .filter(member => member['role'].startsWith("stop"))
                    .map(member => stop_position_list_as_geojson.push(geojson_elems[member['type'] + '/' + member['ref']]));
    
                var route_title = document.createElement("h5");
                route_title.innerHTML = display_route_title(route['tags']);
                trip_list.appendChild(route_title);
                
                var mode = route['tags']['route'];
                if (["subway", "tram", "train", "railway"].includes(mode)){
                    stop_list_as_geojson = stop_position_list_as_geojson
                } else {
                    stop_list_as_geojson = platform_list_as_geojson
                }

                var route_map = document.createElement("div");
                route_map.classList.add("w3-container");
                route_map.innerHTML = init_route_map(route['tags'], stop_list_as_geojson, route_id);
                trip_list.appendChild(route_map);
                
                var map_id = "map_" + route_id
                display_route_map(map_id, route['tags']['colour'], geojson_feature, stop_list_as_geojson);
                                
 
                if (route['tags']['interval']){
                    var route_schedule = document.createElement("div");
                    route_schedule.classList.add("w3-container");
                    route_schedule.innerHTML = display_line_or_route_schedules(route['tags'], route_id);
                    trip_list.appendChild(route_schedule);  
                }
            }

            var wikidata_info = get_and_display_wikidata_info(relation['tags'])

        })        
        .catch(function(error) {
            console.error(error.message);
            document.getElementById("error").innerHTML = display_error("Oops, something went wrong!");
        });
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

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        opacity: 0.6,
        attribution: '&copy; Jungle Bus - <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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

function display_credits(){
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
        <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://openstreetmap.org/relation/${line_id}" target="_blank">See on OpenStreetMap </a></h6>
        	<img src="img/osm.svg" alt="Avatar" class="w3-left w3-margin-right w3-margin-top" style="width:60px">
      		<p>This information comes from <a href="https://openstreetmap.org/" target="_blank">OpenStreetMap</a>, the free and collaborative map. Join the community to complete or correct the detail of this route!</p><br>
          
        </div>
      </div>
    `
    return template
}

async function get_and_display_wikidata_info(tags){
    var wikidata_id = tags["wikidata"];

    var operator_wikidata_id = tags["operator:wikidata"];
    var network_wikidata_id = tags["network:wikidata"];
    var wikipedia_lang = "en"
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
        // TODO - we could also get P18 images from operator & network
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

