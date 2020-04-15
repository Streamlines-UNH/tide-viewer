import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';


const useStyles = makeStyles({
    list: {
      width: 250,
    },
    fullList: {
      width: 'auto',
    },
    regionSelectionContainer: {
        position: "absolute",
        top: 10,
        right: 10,
        //backgroundColor: '#f2f3f0',
    }
  });

function RegionSelection(props) {
    const classes = useStyles();
    const [state, setState] = React.useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
        selected: "CBOFS"
    });

    const toggleDrawer = (side, open) => event => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
          return;
        }
        setState({ ...state, [side]: open });
    };

    const handleRegionChange = (event, newValue) => {
        props.regionSelectionCallBack(
            newValue
        );
        setState({selected: newValue})
    };

    const sideList = side => (
        <div
          className={classes.list}
          role="presentation"
          onClick={toggleDrawer(side, false)}
          onKeyDown={toggleDrawer(side, false)}
        >
            <FormControl component="fieldset">
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup aria-label="Region" name="region" value={state.selected} onChange={handleRegionChange}>
                <FormControlLabel value="CBOFS" control={<Radio />} label="CBOFS" />
                <FormControlLabel value="DBOFS" control={<Radio />} label="DBOFS" />
                <FormControlLabel value="NGOFS" control={<Radio />} label="NGOFS" />
                <FormControlLabel value="NYOFS" control={<Radio />} label="NYOFS" />
                <FormControlLabel value="RTOFS_EAST" control={<Radio />} label="RTOFS EAST" />
                <FormControlLabel value="RTOFS_WEST" control={<Radio />} label="RTOFS WEST" />
              </RadioGroup>
            </FormControl>
          <Divider />
        </div>
    );

    return (
        <div className={classes.regionSelectionContainer}>
            <Button onClick={toggleDrawer('right', true)} variant="contained">Region Selector</Button>
            <Drawer anchor="right" open={state.right} onClose={toggleDrawer('right', false)}>
                {sideList('right')}
            </Drawer>
        </div>
    );
}

export default RegionSelection;
