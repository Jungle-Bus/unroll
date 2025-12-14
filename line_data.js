/**
 * This module is part of Unroll tool by Jungle Bus.
 * It gets structured data about a public transport line by its id
 * needs osmtogeojson (from https://github.com/tyrasd/osmtogeojson)
 */
var line_data = (function() {
    var data_last_check;
    var line_tags;
    var trips = [];

    return {
        get_data_age: function(){
            return data_last_check;
        },
        get_trips_number: function(){
            return trips.length;
        },
        get_tags: function(){
            return line_tags;
        },
        get_trips: function(){
            return trips;
        },
        /**
         * fetch and process data
         * return a status
         */
        init_from_overpass: async function(line_id){
            try {
                var overpass_url = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];relation(${line_id});(._;>>;);out;`
                var overpass_response = await fetch(overpass_url);
                overpass_data = await overpass_response.json();
    
                data_last_check = overpass_data['osm3s']['timestamp_osm_base'];
                
                // extract tags and re-structure Overpass response
                var other_relations = {}
                for (i = 0; i < overpass_data['elements'].length; i++) {
                    if (overpass_data['elements'][i]['id'] == line_id) {
                        var relation = overpass_data['elements'][i];
                        line_tags = relation['tags'];
                    } else if (overpass_data['elements'][i]['type'] == "relation") {
                        var relation_id = overpass_data['elements'][i]['id'];
                        other_relations[relation_id] = overpass_data['elements'][i];
                    }
                }
                
                if (line_tags['type'] == 'route') {
                    return "This is not a public transport line, it is a trip. Try again using its parent relation"
                } else if (line_tags['type'] != 'route_master') {
                    return "This is not a public transport line"
                }
    
                //extract trips info, and convert stops and shapes to geojson
                var data_as_geojson = osmtogeojson(overpass_data);
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
                    
                    var mode = route['tags']['route'];
                    if (["subway", "tram", "train", "railway", "aerialway"].includes(mode)){
                        var stop_list_as_geojson = stop_position_list_as_geojson
                    } else {
                        var stop_list_as_geojson = platform_list_as_geojson
                    }
    
                    trips.push({
                        "id": route_id,
                        "tags": route["tags"],
                        "shape": geojson_feature,
                        "stop_list" : stop_list_as_geojson,
                    });
                }
                return "ok"

            } catch (error) {
                console.error(error)
                return "Oops, something went wrong"
            }
        }
    }
}());
