import React, { useState } from 'react';
import { Theme, FormControl, Tooltip } from '@material-ui/core';
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
    <div className='container'>
      <section className="sign-in-page">
        <div className="container bg-white">
          <div className="row no-gutters">


            <div className="col-md-5 align-self-center meeting-section">
              <div className='sign-in-logo'>
                <img alt='' className="loginlogo" src={logo} />
              </div>
              <div className="">

                <h1 className="tagLine">Create your meeting Room</h1>

                <div className="form-group">

                  <div className=''>
                    <FormControl className={classes.formControl}>
                      <FormInput
                        alphabetical={true}
                        Label={t('home.room_name')}
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

                  <div className=''>
                    <FormControl className={classes.formControl}>
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

                  <div className=''>
                    <FormControl className={classes.formControl}>
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


                  <div className=''>
                    <FormControl className={classes.formControl}>
                      <RoleRadio value={session.role} type={session.roomType} onChange={(evt: any) => {
                        setSessionInfo({
                          ...session,
                          role: evt.target.value
                        });
                      }} requiredText={required.role}></RoleRadio>
                    </FormControl>
                  </div>

                  <div>
                    <CustomButton name={t('home.room_join')} onClick={handleSubmit} />
                  </div>


                </div>


              </div>
              <img alt='' src={footerIcon} className="footericon" />
            </div>

            <div className="col-sm-6 text-center">
              {/* <div className="sign-in-detail text-white">
                <div className="imgoverlay">
                  <div className="item">
                    <img src="{licon}" className="img-fluid mb-4" alt="logo" />
                    <h4 className="mb-1 text-white"><span>Smart</span> Meetings</h4>
                    <p></p>
                  </div>
                </div>
              </div> */}
            </div>

          </div>
        </div>
      </section>

    </div>

  )
}
export default React.memo(HomePage);