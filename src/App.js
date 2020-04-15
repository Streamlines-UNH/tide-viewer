import React, { useState } from 'react';
import './App.css';
import CurrentStrength from './components/CurrentStrength';
import CurrentMap from './components/Map';
import RegionSelection from './components/RegionSelection';
import {Helmet} from "react-helmet";
import GroupSlider from './components/GroupSlider';
import PauseButton from './components/PauseButton';


function App() {
  const [region, setRegion] = useState("CBOFS");
  const regionSelectionCallBack = (regionSelectionData) => {
    setRegion(
      regionSelectionData,
    );
  }

  const [group, setGroup] = useState(1)
  const changeGroupCallback = event => {
    setGroup(event)
  }
  var groupRange = {min: 1, max:48}
  var title = "Chesapeake Bay Operational Forecast System"

  const [pause, setPause] = useState(false)
  const pauseCallback = event => {
    console.log(event)
    setPause(event)
  }

  return (
    <div className="App">
      <CurrentStrength />
      <CurrentMap region={region} pause={pause} group={group}/> 
      <RegionSelection regionSelectionCallBack={regionSelectionCallBack} />
      <GroupSlider range={groupRange} groupCallback={changeGroupCallback}/>
      <PauseButton pauseCallback={pauseCallback}/>
      <Helmet>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, user-scalable=no" />
      </Helmet>
    </div>
  );
}

export default App;
