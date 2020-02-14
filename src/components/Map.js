import React, { useEffect } from "react";
import OlMap from "ol/Map";
import View from "ol/View";
import VectorTileLayer from "ol/layer/VectorTile";
import {Image} from "ol/layer";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";
import MapControls from "./MapControls";
import * as olProj from "ol/proj";
import olms from "ol-mapbox-style";
import ImageCanvas from "ol/source/ImageCanvas"
import MapStyle from "../resources/MapStyle.json";


function Map({ center, zoom }) {
	var seed = 2;
	function random() {
		var x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	}

	var particles = []
	function Particle() {
		this.x = 0;
		this.y = 0;
		this.ix = 0;
		this.iy = 0;
		this.age = 0;
		this.life = 40;
		this.size = 0;
		this.depth = 0;
		this.vy = 0;
	}
	Particle.prototype = {
		constructor: Particle,
		update: function() {
			if (this.age > this.life) {
				this.y = this.iy
				this.x = this.ix
				this.age = 0
			} else {
				this.age += 1
				this.y += 0.1
			}
		}
	};
	window.requestAnimFrame = (function() {
		return (
			window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 1000 / 60);
			}
		);
	})();
	for (var i = 0; i < 20000; i++) {
		var particle = new Particle();
		particle.x = -180+360*random();
		particle.y = -90+180*random()
		particle.ix = particle.x;
		particle.iy = particle.y;
		particle.depth = (Math.random() * 10) | 0;
		particle.vy = particle.depth * 0.25 + 1 / Math.random();
		particles.push(particle);
	}
	var streamlines = new VectorTileLayer({
		source: new VectorTileSource({
			format: new MVT(),
			url: "http://localhost:8000/services/out/tiles/{z}/{x}/{y}.pbf"
		})
	});
	const map = new OlMap({
		target: null,
		controls: [streamlines],
		layers: [streamlines],
		view: new View({
			constrainResolution: true,
			center: olProj.fromLonLat([-75.5, 37.5]),
			zoom: 8
		})
	});
	var render = false
	var renderer = null
	var canvasFunction = function(extent, resolution, pixelRatio, size, projection) {
		var canvas = document.createElement('canvas');

		var context = canvas.getContext('2d');
		var canvasWidth = size[0], canvasHeight = size[1];
		canvas.setAttribute('width', canvasWidth);
		canvas.setAttribute('height', canvasHeight);

		var mapExtent = map.getView().calculateExtent(map.getSize())
		var canvasOrigin = map.getPixelFromCoordinate([extent[0], extent[3]]);
		var mapOrigin = map.getPixelFromCoordinate([mapExtent[0], mapExtent[3]]);
		var delta = [mapOrigin[0]-canvasOrigin[0], mapOrigin[1]-canvasOrigin[1]]
		var p, point, pixel, cX, cY;

		function animate() {
			//console.log(0)
			context.clearRect(0, 0, canvas.width, canvas.height);
			if (render){
				for (var i = 0, l = particles.length; i < l; i++) {
					context.beginPath()
					p = particles[i];
					point = olProj.transform([p.x, p.y], 'EPSG:4326', 'EPSG:3857');
					pixel = map.getPixelFromCoordinate(point);
					cX = pixel[0] + delta[0]
					cY = pixel[1] + delta[1]
					context.fillRect(cX,cY,1,1)
					p.update()
				}
				map.render()
			}
		}
		renderer = animate
		return canvas;

	}
	console.log(zoom);

	olms(map, MapStyle);

	useEffect(() => {
		console.log("useEffect");
		console.log("map zoom: " + map.getView().getZoom());
		map.setTarget("map");
	});
	var s1 = new ImageCanvas({
		canvasFunction: canvasFunction,
		projection: 'EPSG:3857'
	})

	var canvasLayer = new Image({
		source: s1
	});
	map.addLayer(canvasLayer)
	map.on("movestart", function(event){
		render=false
	})
	map.on("moveend", function(event){
		render=true
	})
	// hacky fps
	//setInterval(function(){console.log("")}, 1000)
	setInterval(function(){if(render){renderer()}}, 30)

	return (
		<React.Fragment>
		<div id="map" className="map" />
		<MapControls map={map} />
		<script src="particles.js" />
		</React.Fragment>
	);
}

export default Map;

