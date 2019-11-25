import React, { useEffect } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Fill, Stroke, Style, Text} from 'ol/style';
import MapSource from './../resources/geojson/countries.geojson'

function Map({center, zoom}) {
    console.log(zoom);
    var style = new Style({
        fill: new Fill({
        color: 'rgba(255, 255, 255, 0.6)'
        }),
        stroke: new Stroke({
        color: '#319FD3',
        width: 1
        }),
        text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
            color: '#000'
        }),
        stroke: new Stroke({
            color: '#fff',
            width: 3
        })
        })
    });

    var vectorLayer = new VectorLayer({
        source: new VectorSource({
        url: MapSource,
        format: new GeoJSON()
        }),
        style: function(feature) {
        style.getText().setText(feature.get('name'));
        return style;
        }
    });

    var map = new OlMap({
        target: null,
        layers: [vectorLayer],
        view: new View({
        center: center,
        zoom: zoom
        })
    });
    
    useEffect(() => {
        console.log("useEffect");
        map.setTarget("map");
    });

    return (
        <React.Fragment>
            <div id="map" className="map">
            </div>
        </React.Fragment>
    );
}

export default Map;