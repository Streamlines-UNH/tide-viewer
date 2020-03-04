import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

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
        checkedCBOFS: true,
        checkedDBOFS: false,
        checkedNYOFS: false,
        checkedNGOFS: false,
        checkedRTOFSEAST: false,
        checkedRTOFSWEST: false,
    });

    const toggleDrawer = (side, open) => event => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
          return;
        }
    
        setState({ ...state, [side]: open });

        if (!open) {
            props.regionSelectionCallBack({
                "CBOFS": state.checkedCBOFS,
                "DBOFS": state.checkedDBOFS,
                "NYOFS": state.checkedNYOFS,
                "NGOFS": state.checkedNGOFS,
                "RTOFS_EAST": state.checkedRTOFSEAST,
                "RTOFS_WEST": state.checkedRTOFSWEST
            });
        }
    };

    const handleRegionChange = name => event => {
        setState({ ...state, [name]: event.target.checked });
    };

    const sideList = side => (
        <div
          className={classes.list}
          role="presentation"
          onClick={toggleDrawer(side, false)}
          onKeyDown={toggleDrawer(side, false)}
        >
          <FormGroup>
              <FormControlLabel
                control={
                    <Checkbox checked={state.checkedCBOFS} onChange={handleRegionChange('checkedCBOFS')} value="CBOFS"/>
                }
                label="CBOFS"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={state.checkedDBOFS} onChange={handleRegionChange('checkedDBOFS')} value="DBOFS"/>
                    }
                    label="DBOFS"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={state.checkedNGOFS} onChange={handleRegionChange('checkedNGOFS')} value="NGOFS"/>
                    }
                    label="NGOFS"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={state.checkedNYOFS} onChange={handleRegionChange('checkedNYOFS')} value="NYOFS"/>
                    }
                    label="NYOFS"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={state.checkedRTOFSEAST} onChange={handleRegionChange('checkedRTOFSEAST')} value="RTOFS_EAST"/>
                    }
                    label="RTOFS_EAST"
                />
                <FormControlLabel
                    control={
                        <Checkbox checked={state.checkedRTOFSWEST} onChange={handleRegionChange('checkedRTOFSWEST')} value="RTOFS_WEST"/>
                    }
                    label="RTOFS_WEAST"
                />
          </FormGroup>
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