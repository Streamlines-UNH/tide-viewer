import React, { useState } from 'react';
import './App.css';
import CurrentStrength from './components/CurrentStrength';
import CurrentMap from './components/Map';
import RegionSelection from './components/RegionSelection';
import {Helmet} from "react-helmet";
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

    //console.log( "Updating regions" );

    setRegions({
      "CBOFS": regionSelectionData.CBOFS,
      "DBOFS": regionSelectionData.DBOFS,
      "NYOFS": regionSelectionData.NYOFS,
      "NGOFS": regionSelectionData.NGOFS,
      "RTOFS_EAST": regionSelectionData.RTOFS_EAST,
      "RTOFS_WEST": regionSelectionData.RTOFS_WEST
    });

    
    //console.log( "Updated regions:")
    //for ( var o in regions ) {
      //console.log( "- regions[ " + o + " ] = " + regions[ o ] );
    //}
  }

  const [group, setGroup] = useState(1)
  const changeGroupCallback = event => {
    setGroup(event)
  }
  var groupRange = {min: 1, max:48}
  var title = "Chesapeake Bay Operational Forecast System"

  return (
    <div className="App">
      <CurrentStrength />
      <CurrentMap regions={regions} group={group}/> 
      <RegionSelection regionSelectionCallBack={regionSelectionCallBack} />
      <GroupSlider range={groupRange} groupCallback={changeGroupCallback}/>
      <Helmet>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, user-scalable=no" />
      </Helmet>
    </div>
  );
}

export default App;
