import React, { useState} from 'react';
import './App.css';

import CurrentStrength from './components/CurrentStrength';
import Map from './components/Map';
import ThemeSelector from './components/ThemeSelector';

function App() {
  const center = [0,0];
  const [zoom, setZoom] = useState(1);

  return (
    <div className="App">
      <CurrentStrength />
      <Map center={center} zoom={zoom} /> 
      <ThemeSelector />
    </div>
  );
}

export default App;
