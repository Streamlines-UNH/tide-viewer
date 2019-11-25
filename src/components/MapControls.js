import React from 'react';

export function MapControls({handleZoomIn}) {
    return (
        <div id="map-controls">
            <button id="zoom-in" type="button" onClick={handleZoomIn}>Zoom In </button>
        </div>
    );
}

export default MapControls;