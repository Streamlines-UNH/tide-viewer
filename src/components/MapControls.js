import React, { useEffect } from 'react';
import ZoomSlider from 'ol/control/ZoomSlider';
import Zoom from 'ol/control/Zoom';

export function MapControls({map}) {
    useEffect(() => {
        map.addControl(ZoomControls);
        map.addControl(ZoomSliders);
    });

    const ZoomSliders = new ZoomSlider({
       vertical: 1,
       horizontal: 0,
    });

    const ZoomControls = new Zoom({

    });

    return (
        <div id="map-controls">
            <p>test</p>
        </div>
    );
}

export default MapControls;