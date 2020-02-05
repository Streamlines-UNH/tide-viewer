import React, { useEffect } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import MapControls from './MapControls';
import * as olProj from 'ol/proj';
import olms from 'ol-mapbox-style';
import MapStyle from '../resources/MapStyle.json';

function Map({center, zoom}) {

    console.log(zoom);

    var streamlines = new VectorTileLayer({
        source: new VectorTileSource({
            format: new MVT(),
            url: 'http://localhost:7777/services/CBOFS/tiles/{z}/{x}/{y}.pbf'
        })
    })

    const map = new OlMap({
        target: null,
        controls: [streamlines],
        layers: [streamlines],
        view: new View({
            constrainResolution: true,
            center: olProj.fromLonLat([-62.63922, 38.76539]),
            zoom: 5
        })
    });

    olms(map, MapStyle);
    
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
