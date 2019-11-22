import React from 'react';
import './App.css';

import CurrentStrength from './components/CurrentStrength';
import Map from './components/Map';
import MapControls from './components/MapControls';
import ThemeSelector from './components/ThemeSelector'

function App() {
  return (
    <div className="App">
      <CurrentStrength />
      <Map />
      <MapControls />
      <ThemeSelector />
    </div>
  );
}

export default App;
