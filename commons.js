function get_parameter_from_url(param_name) {
    param_name = param_name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + param_name + "=([^&#]*)"),
        results = regex.exec(location.href);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//detect language, get the appropriate translation file, translate html content
var available_languages = ["ca", "cs", "de", "en", "es", "fr", "hu", "it", "pl", "pt"];
var current_language = "en"; //also used to get Osmose issue and Wikipedia extract
var i18n_messages = {}
async function load_translation_strings(){
    var user_language = navigator.language;
    if (available_languages.includes(user_language)){
        var i18n_file = `i18n/${user_language}.json`;
        current_language = user_language;
    } else {
        var i18n_file = "i18n/en.json"
    }

    await fetch(i18n_file).then(function(data) {
            return data.json()
        })
        .then(function(data) {
            i18n_messages = data
        })
        .catch(function(error) {
            console.error(`error loading ${i18n_file}: ${error}`);
        });

    var html_elements_to_translate = document.querySelectorAll("[data-i18n]");
    html_elements_to_translate.forEach(function(elem) {
        elem.textContent = i18n_messages[elem.getAttribute("data-i18n")]
    });
}

function mutualised_display_credits(osm_type, osm_id) {
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
        <h6 class="w3-text-junglebus"><i class="fa fa-edit fa-fw w3-margin-right"></i><a href="https://openstreetmap.org/${osm_type}/${osm_id}" target="_blank">${i18n_messages["See on OpenStreetMap"]}</a></h6>
        	<img src="img/osm.svg" alt="OSM Logo" class="w3-left w3-margin-right" style="width:60px">
      		<p>${i18n_messages["This information comes from"]} <a href="https://openstreetmap.org/" target="_blank">OpenStreetMap</a>, ${i18n_messages["the free and collaborative map"]}. ${i18n_messages["Join the community to complete or correct the detail of this route!"]}</p><br>
        </div>
      </div>
    `
    return template
}

function mutualised_display_error(error_message){
    var template = `
    <div class="w3-panel w3-pale-red w3-leftbar w3-border-red">
        ${error_message}
    </div>
    `
    return template
}

async function mutualised_get_and_display_wikidata_info(tags) {
    var wikidata_id = tags["wikidata"];

    var operator_wikidata_id = tags["operator:wikidata"];
    var network_wikidata_id = tags["network:wikidata"];
    if (tags["wikipedia"]) {
        var wikipedia_url = `https://fr.wikipedia.org/wiki/${tags["wikipedia"]}?uselang=en-US`;
        var wikipedia_id = tags["wikipedia"].split(":")[1];
        var wikipedia_lang = tags["wikipedia"].split(":")[0];
    }

    var images = []
    if (wikidata_id) {
        var wikidata_url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidata_id}.json`
        var wikidata_response = await fetch(wikidata_url);
        var wikidata_data = await wikidata_response.json();
        var wikidata_content = wikidata_data['entities'][wikidata_id]
        if (wikidata_content['sitelinks']['enwiki']) {
            var wikipedia_url = wikidata_content['sitelinks']['enwiki']['url'];
            var wikipedia_id = wikidata_content['sitelinks']['enwiki']['title'];
            var wikipedia_lang = "en";
        }
        if (wikidata_content['sitelinks'][current_language + 'wiki']) {
            var wikipedia_url = wikidata_content['sitelinks'][current_language + 'wiki']['url'];
            var wikipedia_id = wikidata_content['sitelinks'][current_language + 'wiki']['title'];
            var wikipedia_lang = current_language;
        }
        if (wikidata_content['claims']['P18']) { //image
            var image_name = wikidata_content['claims']['P18'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P154']) { //logo
            var image_name = wikidata_content['claims']['P154'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P137']) { //operator
            var operator_wikidata_id = wikidata_content['claims']['P137'][0]['mainsnak']['datavalue']['value']['id']
        }
        if (wikidata_content['claims']['P361']) { //network
            var network_wikidata_id = wikidata_content['claims']['P361'][0]['mainsnak']['datavalue']['value']['id']
        }
    }
    if (network_wikidata_id) {
        var wikidata_url = `https://www.wikidata.org/wiki/Special:EntityData/${network_wikidata_id}.json`
        var wikidata_response = await fetch(wikidata_url);
        var wikidata_data = await wikidata_response.json();
        var wikidata_content = wikidata_data['entities'][network_wikidata_id]
        if (wikidata_content['claims']['P154']) { //logo
            var image_name = wikidata_content['claims']['P154'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P18']) { //image
            var image_name = wikidata_content['claims']['P18'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
    }
    if (operator_wikidata_id) {
        var wikidata_url = `https://www.wikidata.org/wiki/Special:EntityData/${operator_wikidata_id}.json`
        var wikidata_response = await fetch(wikidata_url);
        var wikidata_data = await wikidata_response.json();
        var wikidata_content = wikidata_data['entities'][operator_wikidata_id]
        if (wikidata_content['claims']['P154']) { //logo
            var image_name = wikidata_content['claims']['P154'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
        if (wikidata_content['claims']['P18']) { //image
            var image_name = wikidata_content['claims']['P18'][0]['mainsnak']['datavalue']['value']
            var image_url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${image_name}?width=150`
            images.push(image_url)
        }
    }

    if (wikipedia_id) {
        var wikipedia_api_url = `https://${wikipedia_lang}.wikipedia.org/api/rest_v1/page/summary/${wikipedia_id}`
        var wikipedia_response = await fetch(wikipedia_api_url);
        var wikipedia_data = await wikipedia_response.json();
        var wikipedia_extract = wikipedia_data['extract'];
        if (wikipedia_extract) {
            var wikipedia = {
                "url": wikipedia_url,
                "image": images[0],
                "extract": wikipedia_extract
            }
            document.getElementById("wikipedia_placeholder").innerHTML = _display_wikipedia_extract(wikipedia);
        }
    }

    wikidata_id = wikidata_id || network_wikidata_id || operator_wikidata_id;
    if (images.length > 0) {
        var wikidata_and_commons = {
            "images_list": images,
            "url": `https://www.wikidata.org/wiki/${wikidata_id}`
        }
        document.getElementById("commons_placeholder").innerHTML = _display_images(wikidata_and_commons);
    }
}

function _display_wikipedia_extract(wikipedia_info) {
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Wikipedia"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-wikipedia-w fa-fw w3-margin-right"></i><a href="${wikipedia_info['url']}" target="_blank">${i18n_messages["Read more on Wikipedia"]} </a></h6>
          <p>`
    if (wikipedia_info['image']) {
        template += `<img src="${wikipedia_info['image']}" alt="image from wikimedia commons" class="w3-left w3-circle w3-margin-right" style="width:150px">`;

    }
    template += `${wikipedia_info['extract']} ...</p>
        </div>
      </div>
    `
    return template
}

function _display_images(commons_images) {
    var template = `
      <div class="w3-container w3-card w3-white w3-margin-bottom">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Images"]}</b></h5>
          <h6 class="w3-text-junglebus"><i class="fa fa-wikipedia-w fa-fw w3-margin-right"></i><a href="${commons_images['url']}" target="_blank">${i18n_messages["See on Wikidata"]} </a></h6>`

    for (var image of commons_images['images_list']) {
        template += `<img src="${image}" alt="image from wikimedia commons" title="image from wikimedia commons" class="">   `
    }
    template += `
        </div>
      </div>
    `
    return template
}

async function mutualised_get_osmose_issues(osm_type, osm_id) {
    var osmose_base_url = "https://osmose.openstreetmap.fr/" + current_language;
    var osmose_url = `${osmose_base_url}/api/0.3/issues?osm_type=${osm_type}&osm_id=${osm_id}&full=true`
    var osmose_response = await fetch(osmose_url);
    var osmose_data = await osmose_response.json();
    var issues = osmose_data['issues'];
    osmose_to_display = [];
    for (const issue of issues) {
        var osmose_map_url = `${osmose_base_url}/map/#item=${issue['item']}&zoom=17&lat=${issue['lat']}&lon=${issue['lon']}&issue_uuid=${issue['id']}`
        osmose_to_display.push({
            "osmose_issue_id": `${osmose_base_url}/error/${issue['id']}`,
            "osmose_text": issue['title']['auto'],
            "osmose_map": osmose_map_url
        })
    }
    return osmose_to_display
}

function mutualised_display_osmose_issues(issues) {
    var template = `
      <div class="w3-container w3-card w3-white w3-leftbar w3-border-red">
        <div class="w3-container">
          <h5 class="w3-opacity"><b>${i18n_messages["Issues"]}</b></h5>
          <ul>`

    for (var issue of issues) {
        template += `<li>${issue['osmose_text']} : <a href="${issue['osmose_issue_id']}" target="_blank">${i18n_messages["Osmose"]}</a> / <a href="${issue['osmose_map']}" target="_blank">${i18n_messages["Osmose Map"]}</a>`
    }
    template += `
        </ul>
        </div>
      </div>
    `
    return template
}