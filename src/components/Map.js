import React, { useEffect } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import * as olProj from 'ol/proj';
import olms from 'ol-mapbox-style';
import MapStyle from '../resources/MapStyle.json';
import Zoom from 'ol/control/Zoom';

function Map() { 
     const ZoomControls = new Zoom({
 
     });

    var streamlines = new VectorTileLayer({
        source: new VectorTileSource({
            format: new MVT(),
            url: 'https://p648saeyvc.execute-api.us-east-1.amazonaws.com/Prod/api/CBOFS/1/{z}/{x}/{y}.mvt'
        })
    })

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

    olms(map, MapStyle);

    useEffect(() => {
        map.addControl(ZoomControls);
        map.setTarget("map");
    });

    return (
        <React.Fragment>
            <div id="map" className="map"></div>
        </React.Fragment>
    );
}

export default Map;
