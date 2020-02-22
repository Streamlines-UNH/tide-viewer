import React, { useEffect, useRef } from 'react';
import { loadModules } from 'esri-loader';
import GetTile from './../Utils'
import StreamlinesGL from './../render/StreamlinesWebGL'


function CurrentMap() { 
	const mapRef = useRef();
	useEffect(
		() => {
			// lazy load the required ArcGIS API for JavaScript modules and CSS
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
						openLayer.realFetchTile = openLayer.fetchTile
						var zxyGraphics = {}
						var graphicsTimer;
						map.layers.add(openLayer);

						var view = new MapView({
							container: "viewDiv",
							map: map,
							center: [-76, 37.1],
							zoom: 9
						});

						var layer = new CustomLayer({});
						map.layers.add(layer);
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
						openLayer.fetchTile = function(z, r, c, op) {
						var url = `https://p648saeyvc.execute-api.us-east-1.amazonaws.com/Prod/api/CBOFS/1/${z}/${c}/${r}`
							GetTile({
							uri: url,
							z: z,
							x: c,
							y: r
							}, function (err, result) {
								if (err) return;
								var t = result.features.map(function(trip) {
									var mags = trip.properties.magnitudes.substring(1, trip.properties.length)
										.split(',').map(parseFloat)
										.map(color_from_mag)
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
								zxyGraphics[`${z}/${c}/${r}`] = t
								clearTimeout(graphicsTimer)
								graphicsTimer = setTimeout(function() {
									var g = []
									const keys = Object.keys(zxyGraphics)
									for (const key of keys) {
										if (key.startsWith(`${z}`)){
											for (var i = 0; i < zxyGraphics[key].length; i++){
												g.push(zxyGraphics[key][i])
											}
										}
									}
									map.layers.remove(layer)
									layer = new CustomLayer({
										graphics: g
									});
									map.layers.add(layer)
								}, 200)
							});
							return openLayer.realFetchTile(z, r, c, op)
						}

						return () => {
							if (view) {
								// destroy the map view
								view.container = null;
							}
						};
					});
		}
	);

	return <div className="webmap" id="viewDiv" ref={mapRef} />;
}

export default CurrentMap;

