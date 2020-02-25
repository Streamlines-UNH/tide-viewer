import React, { useState } from 'react';
import './App.css';
import CurrentStrength from './components/CurrentStrength';
import CurrentMap from './components/Map';
import RegionSelection from './components/RegionSelection';
import GroupSlider from './components/GroupSlider';


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

  const [group, setGroup] = useState(1)
  const changeGroupCallback = event => {
    setGroup(event)
  }

  return (
    <div className="App">
      <CurrentStrength />
      <CurrentMap regions={regions} group={group}/> 
      <RegionSelection regionSelectionCallBack={regionSelectionCallBack} />
      <GroupSlider groupCallback={changeGroupCallback}/>
    </div>
  );
}

export default App;
