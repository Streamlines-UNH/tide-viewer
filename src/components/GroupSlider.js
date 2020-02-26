import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import IconButton from '@material-ui/core/IconButton';
import AddRoundedIcon from '@material-ui/icons/AddRounded';
import RemoveRoundedIcon from '@material-ui/icons/RemoveRounded';

const useStyles = makeStyles({
    root: {
        width: 220,
        position: "absolute",
        bottom: 5,
        right: 0,
    },
    button: {
        width: 30,
        backgroundColor: 'transparent'
    }
});

export default function GroupSlider(props) {
    const classes = useStyles();
    const [value, setValue] = React.useState(1);

    const handleSliderChange = (event, newValue) => {
        props.groupCallback(newValue);
        setValue(newValue)
    };

    const handleAddButton = (event) => {
        if (value === props.range.max) {
            return
        }
        props.groupCallback(value + 1);
        setValue(value + 1)
    }
    const handleMinusButton = (event) => {
        if (value === props.range.min) {
            return
        }
        props.groupCallback(value - 1);
        setValue(value - 1)
    }

    return (
        <div className={classes.root}>
      <Typography id="input-slider" gutterBottom>
        Hour offset: {value}
      </Typography>
      <Grid container alignItems="center">
        <Grid item xs={2}>
          <IconButton className={classes.button} onClick={handleMinusButton}>
            <RemoveRoundedIcon/>
          </IconButton>
        </Grid>
        <Grid item xs={6}>
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            step={1}
            min={props.range.min}
            max={props.range.max}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item xs={3}>
          <IconButton className={classes.button} onClick={handleAddButton}>
            <AddRoundedIcon/>
          </IconButton>
        </Grid>
      </Grid>
    </div>
    );
}
