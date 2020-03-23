import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
import GetTile from './../Utils'
import StreamlinesGL from './../render/StreamlinesWebGL'
import config from './../config'


function CurrentMap(props) {
	const mapRef = useRef();
	// define the default view
	var baseURL = useRef(`${config.API_URL}/CBOFS/1`)
	// save data to this ref to access it between effects
	var updateRef = useRef(null)

	//
	function refresh_function(level) {
		return function() {
			for (const key of Object.keys(updateRef.current.zxyGraphics)) {
				if (key.startsWith(`${level}`)){
					var c = key.split("/")[1]
					var r = key.split("/")[2]
					var url = `${baseURL.current}/${level}/${c}/${r}`
					GetTile({
						uri: url,
						z: level,
						x: c,
						y: r
					}, updateRef.current.fetch(level, r, c));
				}
			}
		}
	}

	// 2 use effects; first is loaded on initial render
	// second is called when the group slider is changed
	// we could re-render the entire Map but 
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
						var CustomLayerView2D = BaseLayerViewGL2D.createSubclass(StreamlinesGL(watchUtils, props.pause));

						// Subclass the layer view from GraphicsLayer, to take advantage of its
						// watchable graphics property.
						var StreamlinesLayer = GraphicsLayer.createSubclass({
							createLayerView: function(view) {
								if (view.type === "2d") {
									return new CustomLayerView2D({
										view: view,
										layer: this
									});
								}
							}
						});
						updateRef.current = {baseURL: "", zxyGraphics: {}, view: null, fetch: null, timer: null}
						var map = new Map()
						var slLayer = new StreamlinesLayer()

						var openLayer = new OpenStreetMapLayer()
						// copy the function that is called when a tile enters view
						openLayer.realFetchTile = openLayer.fetchTile
						// save the tile data at each zxy
						var graphicsTimer;
						map.layers.add(openLayer);

						// Define the mapview
						updateRef.current.view = new MapView({
							container: "viewDiv",
							map: map,
							center: [-75.5, 37.3],
							zoom: 9
						});

						map.layers.add(slLayer);

						// callback function that will reset the layer on zoom/pan
						function redraw(z) {
							return function(){
								var g = []
								for (const key of Object.keys(updateRef.current.zxyGraphics)) {
									if (key.startsWith(`${z}`)){
										for (var i = 0; i < updateRef.current.zxyGraphics[key].length; i++){
											g.push(updateRef.current.zxyGraphics[key][i])
										}
									}
								}
								map.layers.remove(slLayer)
								slLayer = new StreamlinesLayer({
									graphics: g
								});
								map.layers.add(slLayer)
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
						updateRef.current.fetch = function(z, r, c) {
							return function(err, result) {
								if (err) return;
								// modify the geojson to something the renderer can use
								updateRef.current.zxyGraphics[`${z}/${c}/${r}`] = result.features.map(function(trip) {
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
								})
								// after we are done fetching new tiles recompute the graphics layer
								clearTimeout(graphicsTimer)
								graphicsTimer = setTimeout(redraw(z), 200)
							}
						}
						// arcgis will call this function when a tile comes into view
						// so we can hijack that call and get the tiles from our API
						// then return the saved function from earlier

						openLayer.fetchTile = function(z, r, c, op) {
							if (z > 9) {
								return openLayer.realFetchTile(z, r, c, op)
							}
							var url = `${baseURL.current}/${z}/${c}/${r}`
							GetTile({
								uri: url,
								z: z,
								x: c,
								y: r
							}, updateRef.current.fetch(z, r, c));
							return openLayer.realFetchTile(z, r, c, op)
						}

						// return a deconstructor
						return () => {
							if (updateRef.current.view) {
								updateRef.current.view.container = null;
							}
						};
					});
		}, [baseURL, props.pause]
	);

	useEffect(() => {
		// update the url to the new selected group
		baseURL.current = `${config.API_URL}/CBOFS/${props.group}`
		// exit if the map is not ready yet
		if(updateRef.current == null || updateRef.current.view == null) {
			return
		}
		var level = updateRef.current.view.zoom
		// wait for slider to stop before re-render to new group
		clearTimeout(updateRef.current.timer)
		updateRef.current.timer = setTimeout(refresh_function(level), 200)
	}, [props.group])

	return <div className="webmap" id="viewDiv" ref={mapRef} />;
}

export default CurrentMap;
