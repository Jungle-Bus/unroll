var network = get_parameter_from_url('network');
var ref = get_parameter_from_url('ref');
var ref_stif = get_parameter_from_url('ref:FR:STIF');

var qa = get_parameter_from_url('qa');

main()

async function main(){
    await load_translation_strings();

    if (network && ref){
        var overpass_url = `
        https://overpass-api.de/api/interpreter?data=[out:json];relation[type=route_master]
        [~"network|operator"~"${network}",i]
        ["ref"="${ref}"];out ids;`
    
        fetch(overpass_url)
        .then(function(data) {
            return data.json()
        })
        .then(function(data) {
            if (data['elements'].length > 0){
                var route_id = data['elements'][0]['id'];
                if (qa){
                    window.location.href = `route.html?line=${route_id}&qa=${qa}`;
                } else {
                    window.location.href = `route.html?line=${route_id}`;
                }
                
            } else {
                status = i18n_messages["No route has been found :("];
                document.getElementById("message").innerHTML = display_error(status);
            }
        })
        .catch(function(error) {
            console.error(error.message);
            status = i18n_messages["Oops, something went wrong!"]
            document.getElementById("message").innerHTML = display_error(status);
        });
    
    } 
    else if (ref_stif) {
        function isNumeric(str) {
            return /^\d+$/.test(str);
        }

        if (ref_stif.startsWith('C')) {
            window.location.href = `https://me-deplacer.iledefrance-mobilites.fr/fiches-horaires/bus/line:IDFM:${ref_stif}`;
        } else if (isNumeric(ref_stif)) {
            window.location.href = `https://data.iledefrance-mobilites.fr/explore/dataset/arrets/table/?q=${ref_stif}`;
        } 
        else {
            message = i18n_messages["You must provide a ref:FR:STIF reference to use this feature, or search for a route on the home page."];
            document.getElementById("message").innerHTML = display_error(message);
        }
    }
    else {
        status = i18n_messages["Search some route on the home page."]
        document.getElementById("message").innerHTML = display_error(status);
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
