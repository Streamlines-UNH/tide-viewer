import React, { useEffect } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import {Fill, Stroke, Style, Text} from 'ol/style';
import MapSource from './../resources/geojson/countries.geojson';
import MVT from 'ol/format/MVT';
import MapControls from './MapControls';
import axios from 'axios';

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

    console.log('api get request');
    
    async function getStreamlines () {
        try {
            const response = await axios.get('https://9fv6uekm86.execute-api.us-east-1.amazonaws.com/prod/streamlines');
            console.log('here');
            console.log(atob(response.data.body));
            return atob(response.data.body);
        } catch (error) {

        }
    }


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

    // const streamlines = getStreamlines().then()

    /*var chicago = new VectorLayer({
        source: new VectorSource({
            url: MVTSource,
            format: new MVT()
        })
    })*/

    var test = new VectorTileLayer({
        source: new VectorTileSource({
            format: new MVT(),
            url: 'http://localhost:8000/services/CBOFS/tiles/{z}/{x}/{y}.pbf'
        })
    })

    const map = new OlMap({
        target: null,
        controls: [vectorLayer,test],
        layers: [],
        view: new View({
          center: center,
          zoom: zoom
        })
    });
    
    useEffect(() => {
        console.log("useEffect");
        console.log("map zoom: " + map.getView().getZoom());
        map.setTarget("map");
    });

    return (
        <React.Fragment>
            <div id="map" className="map">
            </div>
            <MapControls map={map} />
        </React.Fragment>
    );
}

export default Map;
