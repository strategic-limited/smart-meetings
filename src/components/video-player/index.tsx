import React from 'react'
import { CustomIcon } from "../icon"
import './index.scss'
import { useRoomStore } from '@/hooks'
import { RendererPlayer } from '../media-player'




import { makeStyles, createStyles, } from '@material-ui/core/styles';
import { Theme, FormControl, } from '@material-ui/core';

import Modal from '@material-ui/core/Modal';
import { FormSelect } from '@/components/form-select';



function rand() {
  return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
  const top = 50 + rand();
  const left = 50 + rand();

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      position: 'absolute',
      width: 500,
      backgroundColor: theme.palette.background.paper,
      // border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
    formControl: {
      minWidth: '240px',
      maxWidth: '240px',
      border: '1px',
      color: 'white'
    }
  }),
);



type VideoPlayerProps = {
  className?: string
  userUuid: string
  streamUuid: string
  showClose: boolean
  account: string
  renderer?: any
  role: string
  audio: boolean
  video: boolean
  local?: boolean
  share?: boolean
  showControls: boolean
  handleClickVideo?: (userUuid: string, isLocal: boolean) => void
  handleClickAudio?: (userUuid: string, isLocal: boolean) => void
}


export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  className,
  showClose,
  streamUuid,
  userUuid,
  account,
  renderer,
  local = true,
  role,
  audio,
  video,
  showControls,
  share = false,
  handleClickVideo,
  handleClickAudio
}) => {

  const roomStore = useRoomStore()
  const [open, setOpen] = React.useState(false);
  const [modalStyle] = React.useState(getModalStyle);
  const [effect, setEffect] = React.useState({name: "Monster Factory", value: "MonsterFactory"});

 




  const handleOpenEffect = () => {
    setOpen(true);
  };

  const handleCloseEffect = () => {
    setOpen(false);
  };


  const EffectTypes : any = [
    {
      name: "None",
      value: "none"

    },

    {
      name: "Afro",
      value: "Afro"

    },

    {
      name: "Glasses",
      value: "Glasses"

    },

    {
      name: "Monster Factory",
      value: "MonsterFactory"

    },

    {
      name: "Police Man",
      value: "PoliceMan"

    },

    {
      name: "Blue BackGround",
      value: "test_BG"

    },
    {
      name: "Spider",
      value: "Spider"

    }
  ] 


  const handleClose = async () => {
    await roomStore.closeStream(userUuid, local)
  }

  const handleAudioClick = async () => {
    if (handleClickAudio) {
      return handleClickAudio(userUuid, local)
    }
    if (audio) {
      await roomStore.muteAudio(userUuid, local)
    } else {
      await roomStore.unmuteAudio(userUuid, local)
    }
  }

  const handleVideoClick = async () => {
    if (handleClickVideo) {
      return handleClickVideo(userUuid, local)
    }
    if (video) {
      await roomStore.muteVideo(userUuid, local)
    } else {
      await roomStore.unmuteVideo(userUuid, local)
    }
  }

  const selectEffect = async (evt: any) => {
    console.log(evt.target.value)
    setEffect(EffectTypes[evt.target.value])
    console.log(effect.value)
     await roomStore.applyEffect(effect.value)
  }
  const classes = useStyles();

  return (
    <div className={`${className ? className : 'agora-video-view'}`}>
      {showClose ? <div className="icon-close" onClick={handleClose}></div> : null}

      {
        share === true ? null :
          <div className={role === 'teacher' ? 'teacher-placeholder' : 'student-placeholder'}>
          </div>
      }


      {share ?
        <RendererPlayer key={renderer && renderer.videoTrack ? renderer.videoTrack.getTrackId() : ''} track={renderer} id={streamUuid} fitMode={true} className="rtc-video" /> :
        <>
          {renderer && video ? <RendererPlayer key={renderer && renderer.videoTrack ? renderer.videoTrack.getTrackId() : ''} track={renderer} id={streamUuid} className="rtc-video" /> : null}
        </>
      }

      {
        account ?
          <div className="video-profile">
            <span className="account">{account}</span>
            {
              showControls ?
                <span className="media-btn">
                  <CustomIcon onClick={handleVideoClick} className={video ? "icons-camera-unmute-s" : "icons-camera-mute-s"} data={"video"} />
                  <CustomIcon onClick={handleAudioClick} className={audio ? "icon-speaker-on" : "icon-speaker-off"} data={"audio"} />
                  <CustomIcon onClick={handleOpenEffect} className="icons-camera-unmute-s" />
                </span> : null
            }
          </div>
          : null
      }

      <Modal
        open={open}
        onClose={handleCloseEffect}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        <div style={modalStyle} className={classes.paper}>
          <h5 id="simple-modal-title">Select Effects</h5>
          <FormControl className={classes.formControl}>
            <label className='form-label ' htmlFor=""> Select Effect</label>
            <FormSelect
              Label='effect'
              value={effect}
              onChange={selectEffect}
              items={EffectTypes
                .map((it: any) => ({
                  value: it.value,
                  text: it.name,
                  path: it.name
                }))}
            />
          </FormControl>
        </div>
      </Modal>
    </div>
  )
}