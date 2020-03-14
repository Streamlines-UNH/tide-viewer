import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import PauseIcon from '@material-ui/icons/Pause';
import ToggleButton from '@material-ui/lab/ToggleButton';


const useStyles = makeStyles({
    root: {
        width: 100,
        position: "absolute",
        bottom: 5,
        left: 20,
    },
    button: {
        backgroundColor: '#3f51b5',
        border: 0,
        borderRadius: 3,
        color: 'white',
        height: 40,
        padding: '0 15px',
        '&:hover': {backgroundColor: "#7f87b5"},
        "&.Mui-selected": {
            backgroundColor: "#7f87b5"
        },
        "&.Mui-selected:hover": {
            backgroundColor: '#3f51b5'
        }
    },
});

export default function Switches(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(false);

  const handlePause = (event, newValue) => {
      props.pauseCallback(newValue);
      setValue(newValue)
  };

  return (
    <div className={classes.root}>
      <ToggleButton
        className={classes.button}
        value="check"
        selected={value}
        onChange={(event) => {
            handlePause(event, !value);
        }}>
        <PauseIcon />
      </ToggleButton>

    </div>
  );
}

