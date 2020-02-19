import React, { useState } from 'react';
import './App.css';

import CurrentStrength from './components/CurrentStrength';
import Map from './components/Map';
import RegionSelection from './components/RegionSelection';

function App() {
  const [regions, setRegions] = useState({
      "CBOFS": true,
      "DBOFS": false,
      "NYOFS": false,
      "NGOFS": false,
      "RTOFS_EAST": false,
      "RTOFS_WEST": false,
  });

  const regionSelectionCallBack = (regionSelectionData) => {
    setRegions({
      "CBOFS": regionSelectionData.CBOFS,
      "DBOFS": regionSelectionData.DBOFS,
      "NYOFS": regionSelectionData.NYOFS,
      "NGOFS": regionSelectionData.NGOFS,
      "RTOFS_EAST": regionSelectionData.RTOFS_EAST,
      "RTOFS_WEST": regionSelectionData.RTOFS_WEST
    });
  }
  return (
    <div className="App">
      <CurrentStrength />
      <Map regions={regions} /> 
      <RegionSelection regionSelectionCallBack={regionSelectionCallBack} />
    </div>
  );
}

export default App;
