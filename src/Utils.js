var VectorTile = require('@mapbox/vector-tile').VectorTile
var Protobuf = require('pbf');
var url = require('url');
var axios = require('axios')

// Get tile from URL and read the pbf file to a GeoJson object
function GetTile(args, callback) {
	if (!args.uri) return callback(new Error('No URI found. Please provide a valid URI to your vector tile.'));
	var parsed = url.parse(args.uri);
	if (parsed.protocol && (parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
		axios.get(args.uri, {
			responseType: 'arraybuffer'
		}).then(response => {
			if (response.status !== 200) {
				return callback(new Error('Error retrieving data'), response);
			}
			readTile(args, response.data, callback);
		});
	}
};

// helper function for GetTile
function readTile(args, buffer, callback) {
	var tile = new VectorTile(new Protobuf(buffer));
	var layers = args.layer || Object.keys(tile.layers);
	if (!Array.isArray(layers))
		layers = [layers]
	var collection = {type: 'FeatureCollection', features: []};
	layers.forEach(function (layerID) {
		var layer = tile.layers[layerID];
		if (layer) {
			for (var i = 0; i < layer.length; i++) {
				var feature = layer.feature(i).toGeoJSON(args.x, args.y, args.z);
				if (layers.length > 1) feature.properties.vt_layer = layerID;
				collection.features.push(feature);
			}
		}
	});
	callback(null, collection);
}

export default GetTile
