import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import Input from '@material-ui/core/Input';
import AccessTimeIcon from '@material-ui/icons/AccessTime';

const useStyles = makeStyles({
  root: {
    width: 250,
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  input: {
    width: 42,
  },
});

export default function GroupSlider(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(1);

  const handleSliderChange = (event, newValue) => {
    props.groupCallback(newValue);
    setValue(newValue)
  };

  const handleInputChange = event => {
    props.groupCallback(event.target.value === '' ? '' : Number(event.target.value));
    setValue(event.target.value === '' ? '' : Number(event.target.value))
  };

  const handleBlur = () => {
    if (value < 1) {
      setValue(1);
    } else if (value > 48) {
      setValue(48);
    }
  };

  return (
    <div className={classes.root}>
      <Typography id="input-slider" gutterBottom>
        Hour offset: {value}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <AccessTimeIcon />
        </Grid>
        <Grid item xs>
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            step={1}
            min={1}
            max={48}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={value}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: 1,
              min: 1,
              max: 48,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}
