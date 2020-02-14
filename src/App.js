import React, { } from 'react';
import './App.css';

import CurrentStrength from './components/CurrentStrength';
import Map from './components/Map';

function App() {

  return (
    <div className="App">
      <CurrentStrength />
      <Map/> 
    </div>
  );
}

export default App;
