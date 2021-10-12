import React, { useState } from 'react';
import { Theme, FormControl, Tooltip, colors } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { CustomButton } from '@/components/custom-button';
import { RoleRadio } from '@/components/role-radio';
import { CustomIcon } from '@/components/icon';
import { FormInput } from '@/components/form-input';
import { FormSelect } from '@/components/form-select';
import { LangSelect } from '@/components/lang-select';
import { useHistory } from 'react-router-dom';
import { GithubIcon } from '@/components/github-icon';
import { t } from '../i18n';
import { useUIStore, useRoomStore, useAppStore } from '@/hooks';
import { UIStore } from '@/stores/app';
import { GlobalStorage } from '@/utils/custom-storage';
import { EduManager } from '@/sdk/education/manager';
import { isElectron } from '@/utils/platform';
import './home.css'

import logo from '../assets/logo.b9fe0752.svg'
import footerIcon from '../assets/footericon.6437adde.svg'
import licon from "../assets/licon.ab47b1af.svg"

const useStyles = makeStyles((theme: Theme) => ({
  formControl: {
    minWidth: '240px',
    maxWidth: '240px',
    border: '1px',
    color: 'white'
  }
}));

type SessionInfo = {
  roomName: string
  roomType: number
  userName: string
  role: string
}

const defaultState: SessionInfo = {
  roomName: '',
  roomType: 0,
  role: '',
  userName: '',
}

const roomTypes = isElectron ? UIStore.roomTypes.filter((it: any) => it.value !== 3) : UIStore.roomTypes


function HomePage() {
  document.title = t(`home.short_title.title`)

  const classes = useStyles();

  const history = useHistory();

  const uiStore = useUIStore();

  const appStore = useAppStore();

  const handleSetting = (evt: any) => {
    history.push({ pathname: '/setting' })
  }

  const [lock, setLock] = useState<boolean>(false);

  const handleUpload = async (evt: any) => {
    try {
      setLock(true)
      const id = await EduManager.uploadLog('0')
      uiStore.showDialog({
        type: 'feedLog',
        message: `id: ${id}`
      })
      setLock(false)
    } catch (err) {
      uiStore.addToast(t('upload_log_failed'))
      setLock(false)
    }
  }

  const [session, setSessionInfo] = useState<SessionInfo>(defaultState);

  const [required, setRequired] = useState<any>({} as any);

  const handleSubmit = () => {
    if (!session.roomName) {
      setRequired({ ...required, roomName: t('home.missing_room_name') });
      return;
    }

    if (!session.userName) {
      setRequired({ ...required, userName: t('home.missing_your_name') });
      return;
    }

    if (!session.role) {
      setRequired({ ...required, role: t('home.missing_role') });
      return;
    }

    if (!roomTypes[session.roomType]) return;

    appStore.setRoomInfo({
      ...session,
      roomType: roomTypes[session.roomType].value
    })
    console.log(session)
    // console.log(appStore)
    const path = roomTypes[session.roomType].path
    // console.log(path)

    if (session.role === 'assistant') {
      history.push(`/breakout-class/assistant/courses`)
    } else {
      history.push(`/classroom/${path}`)
    }
    // history.push(`/classroom/${path}`)
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
             

                <h1 className="tagLine">Create your meeting Room</h1>

                <div className="form-group">

                  <div className=''>
                    <FormControl className={classes.formControl}>
                      <label className='form-label ' htmlFor=""> Room Name</label>
                      <FormInput
                        alphabetical={true}

                        value={session.roomName}
                        onChange={
                          (val: string) => {
                            setSessionInfo({
                              ...session,
                              roomName: val
                            });
                          }
                        }
                        requiredText={required.roomName}
                      />
                    </FormControl>
                  </div>

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
                    <FormControl className={classes.formControl}>
                      <label className='form-label ' htmlFor=""> Room Type</label>
                      <FormSelect
                        Label={t('home.room_type')}
                        value={session.roomType}
                        onChange={(evt: any) => {
                          setSessionInfo({
                            ...session,
                            roomType: evt.target.value
                          });
                        }}
                        items={roomTypes
                          .map((it: any) => ({
                            value: it.value,
                            text: t(`${it.text}`),
                            path: it.path
                          }))}
                      />
                    </FormControl>
                  </div>


                  <div className='form-div'>
                    <FormControl className={classes.formControl}>
                      <RoleRadio value={session.role} type={session.roomType} onChange={(evt: any) => {
                        setSessionInfo({
                          ...session,
                          role: evt.target.value
                        });
                      }} requiredText={required.role}></RoleRadio>
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
export default React.memo(HomePage);