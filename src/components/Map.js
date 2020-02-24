import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
import GetTile from './../Utils'
import StreamlinesGL from './../render/StreamlinesWebGL'


function CurrentMap() {
	const mapRef = useRef();
	useEffect(
		() => {
			// lazy load the required ArcGIS API for JavaScript modules
			// This is how arcgis is build to be imported, (babel)
			loadModules([
				"esri/Map",
				"esri/core/watchUtils",
				"esri/geometry/support/webMercatorUtils",
				"esri/layers/GraphicsLayer",
				"esri/views/MapView",
				"esri/views/2d/layers/BaseLayerViewGL2D",
				"esri/layers/OpenStreetMapLayer"], { css: true })
				.then(([Map,
					watchUtils,
					webMercatorUtils,
					GraphicsLayer,
					MapView,
					BaseLayerViewGL2D,
					OpenStreetMapLayer]) => {

						// This will init the WebGL graphics
						var CustomLayerView2D = BaseLayerViewGL2D.createSubclass(StreamlinesGL(watchUtils));

						// Subclass the layer view from GraphicsLayer, to take advantage of its
						// watchable graphics property.
						var CustomLayer = GraphicsLayer.createSubclass({
							createLayerView: function(view) {
								if (view.type === "2d") {
									return new CustomLayerView2D({
										view: view,
										layer: this
									});
								}
							}
						});

						var map = new Map();

						var openLayer = new OpenStreetMapLayer()
						// copy the function that is called when a tile enters view
						openLayer.realFetchTile = openLayer.fetchTile
						// save the tile data at each zxy
						var zxyGraphics = {}
						var graphicsTimer;
						map.layers.add(openLayer);

						// Define the mapview
						var view = new MapView({
							container: "viewDiv",
							map: map,
							center: [-75.5, 37.3],
							zoom: 9
						});

						var Streamlineslayer = new CustomLayer({});
						map.layers.add(Streamlineslayer);

						// callback function that will reset the layer on zoom/pan
						function redraw_geometry(z) {
							return function(){
								var g = []
								for (const key of Object.keys(zxyGraphics)) {
									if (key.startsWith(`${z}`)){
										for (var i = 0; i < zxyGraphics[key].length; i++){
											g.push(zxyGraphics[key][i])
										}
									}
								}
								map.layers.remove(Streamlineslayer)
								Streamlineslayer = new CustomLayer({
									graphics: g
								});
								map.layers.add(Streamlineslayer)
							}
						}

						// get a gradient based on a 0-1 float between color1 and color2
						var color1 = [255, 0, 0]
						var color2 = [0, 255, 0]
						function color_from_mag(mag) {
							var w1 = mag;
							var w2 = 1 - w1;
							var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
								Math.round(color1[1] * w1 + color2[1] * w2),
								Math.round(color1[2] * w1 + color2[2] * w2)];
							return rgb;
						}
						// arcgis will call this function when a tile comes into view
						// so we can hijack that call and get the tiles from our API
						// then return the saved function from earlier
						openLayer.fetchTile = function(z, r, c, op) {
							var url = `https://p648saeyvc.execute-api.us-east-1.amazonaws.com/Prod/api/CBOFS/9/${z}/${c}/${r}`
							//var url = `http://localhost:8000/services/CBOFS/tiles/${z}/${c}/${r}`
							GetTile({
								uri: url,
								z: z,
								x: c,
								y: r
							}, function (err, result) {
								if (err) return;
								// modify the geojson to something the renderer can use
								zxyGraphics[`${z}/${c}/${r}`] = result.features.map(function(trip) {
									// remap the magnitudes to a color value between color1 and color2
									var mags = trip.properties.magnitudes.substring(1, trip.properties.length)
										.split(',').map(parseFloat)
										.map(color_from_mag)
									// Redefine the lat/long to EPSG:4326 for use in the renderer
									return {
										attributes: {
											color: mags
										},
										geometry: webMercatorUtils.geographicToWebMercator({
											paths: [trip.geometry.coordinates],
											type: "polyline",
											spatialReference: {
												wkid: 4326
											}
										})
									};
								});

								// after we are done fetching new tiles recompute the graphics layer
								clearTimeout(graphicsTimer)
								graphicsTimer = setTimeout(redraw_geometry(z), 200)
							});
							return openLayer.realFetchTile(z, r, c, op)
						}

						// return a deconstructor
						return () => {
							if (view) {
								view.container = null;
							}
						};
					});
		}
	);

	return <div className="webmap" id="viewDiv" ref={mapRef} />;
}

export default CurrentMap;

