var network = get_parameter_from_url('network');
var ref = get_parameter_from_url('ref');

var qa = get_parameter_from_url('qa');

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
            status = "No route has been found :("
            document.getElementById("message").innerHTML = display_error(status);
        }
    })
    .catch(function(error) {
        console.error(error.message);
        status = "Oops, something went wrong!"
        document.getElementById("message").innerHTML = display_error(status);
    });

} else {
    status = "Search some route on the home page."
    document.getElementById("message").innerHTML = display_error(status);}

function display_error(error_message){
    var template = `
    <div class="w3-panel w3-pale-red w3-leftbar w3-border-red">
        ${error_message}
    </div>
    `
    return template
}


