/**
 * This module is part of Unroll tool by Jungle Bus.
 * It gets structured data about a bus station by its id
 * needs osmtogeojson (from https://github.com/tyrasd/osmtogeojson)
 */
var bus_station_data = (function () {
    var data_last_check;
    var bus_station_tags;
    var bus_station_shape;
    var stops = [];

    return {
        get_data_age: function () {
            return data_last_check;
        },
        get_tags: function () {
            return bus_station_tags;
        },
        get_shape: function () {
            return bus_station_shape;
        },
        get_stops: function () {
            return stops;
        },
        init_from_overpass: async function (bus_station_id) {
            try {
            var osm_id = bus_station_id.substr(1)
            if (bus_station_id.startsWith("w")) {
                var osm_type = "way";
                var overpass_url = `https://overpass-api.de/api/interpreter?data=[out:json];way(id:${osm_id})->.station;(node(area.station)[highway=bus_stop];)->.stops;rel(bn)["route"="bus"];out body;.stops out body;.station out geom;`
            } else {
                var osm_type = "area";
                var overpass_url = `https://overpass-api.de/api/interpreter?data=[out:json];rel(id:${osm_id});map_to_area->.station;(node(area.station)[highway=bus_stop];)->.stops;rel(bn)["route"="bus"];out body;.stops out body;.station out geom;`
            }

            var overpass_response = await fetch(overpass_url);
            overpass_data = await overpass_response.json();

            data_last_check = overpass_data['osm3s']['timestamp_osm_base'];

            var other_relations = []
            var stops_ = {}
            for (i = 0; i < overpass_data['elements'].length; i++) {
                if (overpass_data['elements'][i]['id'] == osm_id && overpass_data['elements'][i]['type'] == osm_type) {
                    var bus_station = overpass_data['elements'][i];
                    bus_station_tags = bus_station['tags'];
                } else if (overpass_data['elements'][i]['type'] == 'area') {
                    var bus_station = overpass_data['elements'][i];
                    bus_station_tags = bus_station['tags'];
                } else if (overpass_data['elements'][i]['type'] == "relation") {
                    other_relations.push(overpass_data['elements'][i]);
                } else if (overpass_data['elements'][i]['type'] == "node") {
                    var stop_id = overpass_data['elements'][i]['id'];
                    stops_[stop_id] = overpass_data['elements'][i];
                    overpass_data['elements'][i]['route_list'] = [];
                    stops.push(overpass_data['elements'][i]);
                }
            }

            var data_as_geojson = osmtogeojson(overpass_data);
            bus_station_shape = data_as_geojson['features'].find(feature => feature['id'] == osm_type + '/' + osm_id);

            for (i = 0; i < other_relations.length; i++) {
                route_tags = {
                    'ref': other_relations[i]['tags']['ref'],
                    'destination': other_relations[i]['tags']['to'],
                    'colour': other_relations[i]['tags']['colour']
                }
                route_members_id = other_relations[i]['members'].filter(member => member['role'].startsWith("platform")).map(member => member['ref'])
                for (j = 0; j < stops.length; j++) {
                    if (route_members_id.includes(stops[j]['id'])) {
                        stops[j]['route_list'].push(route_tags)
                    }
                }

            }

            if (bus_station_tags['amenity'] != 'bus_station') {
                return "This is not a bus_station"
            }

            return "ok"

            } catch (error) {
                console.error(error)
                return "Oops, something went wrong"
            }
        }
    }
}());
