/* eslint-disable react/react-in-jsx-scope */

import React, { useState } from 'react';
import { useUIStore, useRoomStore, useAppStore } from '@/hooks';
import { isElectron } from '@/utils/platform';
import { UIStore } from '@/stores/app';
import { CustomButton } from '@/components/custom-button';

import { FormInput } from '@/components/form-input';
import { Theme, FormControl, Tooltip, colors } from '@material-ui/core';
import { t } from '../../i18n';
import { makeStyles } from '@material-ui/core/styles';

import '../home.css'

import logo from '../../assets/logo.b9fe0752.svg'
import footerIcon from '../../assets/footericon.6437adde.svg'
import licon from "../../assets/licon.ab47b1af.svg"

import {
  BrowserRouter as Router,
  Link,
  useLocation,
  useHistory
} from "react-router-dom";


type SessionInfo = {
  roomName: string
  roomType: number
  userName: string
  role: string
}


const useStyles = makeStyles((theme: Theme) => ({
  formControl: {
    minWidth: '240px',
    maxWidth: '240px',
    border: '1px',
    color: 'white'
  }
}));

const roomTypes = isElectron ? UIStore.roomTypes.filter((it: any) => it.value !== 3) : UIStore.roomTypes

export const JoinRoomController = () => {


  const history = useHistory();

  const uiStore = useUIStore();

  const appStore = useAppStore();
  const classes = useStyles();


  const path = new URLSearchParams(useLocation().search);
  let name: any = path.get("roomName")
  let role: any = path.get("userRole")
  let roomType: any = path.get("roomType")

  const defaultState: SessionInfo = {
    roomName: name,
    roomType: roomType,
    role: role,
    userName: '',
  }

  const [session, setSessionInfo] = useState<SessionInfo>(defaultState);
  const [required, setRequired] = useState<any>({} as any);





  const handleSubmit = () => {

    // eslint-disable-next-line no-restricted-globals
    if (!session.userName) {
      setRequired({ ...required, userName: t('home.missing_your_name') });
      return;
    }

    appStore.setRoomInfo({
      ...session,
      roomType: roomTypes[session.roomType].value
    })

    const path = roomTypes[session.roomType].path

    history.push(`/classroom/${path}`)
  }



  return (
    <div className=''>
      <section className="">
        <div className="container">
          <div className="flex-container ">

            <div className="sign-in-page  ">
              <div className='sign-in-logo'>
                <img alt='' className="loginlogo" src={logo} />
              </div>


              <h1 className="tagLine">Join meeting Room</h1>

              <div className="form-group">



                <div className='form-div'>
                  <FormControl className={classes.formControl}>
                    <label className='form-label ' htmlFor="">Your Name</label>
                    <FormInput
                      alphabetical={true}
                      Label={t('home.nickname')}
                      value={session.userName}
                      onChange={(val: string) => {
                        setSessionInfo({
                          ...session,
                          userName: val
                        });
                      }}
                      requiredText={required.userName}
                    />
                  </FormControl>
                </div>






                <div className='form-div'>
                  <CustomButton className="btn-primary" name={t('home.room_join')} onClick={handleSubmit} />
                </div>
              </div>

              <img alt='' src={footerIcon} className="footericon" />
            </div>

            <div className="singIn-tag">
              <div className="sign-in-detail">
                <div className="imgoverlay">
                  <div className="lcontent">
                    <img src={licon} className="img-fluid mb-4" alt="logo" />
                    <h1 className="mb-1 text-white"><span>Smart</span> Meetings</h1>
                    <p>Personalized Video Meeting Rooms</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

    </div>

  )
}