import React from 'react';
import { Button } from '@material-ui/core';
export const CustomButton = function (props: any) {
  return (
    <Button variant="contained" className={props.className ? props.className : 'custom-button'} color="primary" size="medium" onClick={props.onClick}>
      {props.name}
    </Button>
  )
}