import React from 'react';
import { Select, InputLabel, MenuItem } from '@material-ui/core';
// import { t } from '../i18n';
import { Theme, } from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) => ({
  formControl: {
    minWidth: '240px',
    maxWidth: '240px',
    border : '1px',
    background: '#fff',
    marginTop: '5px',
    padding: '0px'
  }
}));

export interface FormSelectItems {
  text: string
}

export interface FormSelect {
  items: FormSelectItems[]
  Label: string
  value: any
  onChange: (evt: any) => any
}

export const FormSelect: React.FC<FormSelect> = ({
  Label,
  value,
  onChange,
  items
}) => {
  const classes = useStyles();

  return (
    <>
      {/* <InputLabel>{Label}</InputLabel> */}
      <Select
        value={value}
        onChange={onChange}
        className={classes.formControl}
      >
        {items.map((item: any, key: number) => 
          <MenuItem key={key} value={key}>{item.text}</MenuItem>
        )}
      </Select>
    </>
  );
}