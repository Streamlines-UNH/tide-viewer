import React, { useState} from 'react';
import './App.css';

import CurrentStrength from './components/CurrentStrength';
import Map from './components/Map';
import MapControls from './components/MapControls';
import ThemeSelector from './components/ThemeSelector';

function App() {
  const center = [0,0];
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = event => {
    setZoom(zoom + 1);
    console.log("zoom in");
  }

  return (
    <div className="App">
      <CurrentStrength />
      <Map center={center} zoom={zoom} /> 
      <MapControls handleZoomIn={handleZoomIn} />
      <ThemeSelector />
    </div>
  );
}

export default App;
