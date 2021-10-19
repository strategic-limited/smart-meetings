import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { VideoPlayer } from '@/components/video-player';
import './video-marquee.scss';
import { AgoraMediaStream } from '@/utils/types';
import { observer } from 'mobx-react';
import { useRoomStore } from '@/hooks';


import { Webcam, Player, Effect, MediaStreamCapture, Dom } from "../../banuba/bin/BanubaSDK"
import { BANUBA_CLIENT_TOKEN } from "../../banuba/BanubaClientToken"


const showScrollbar = () => {
  const $marquee = document.querySelector(".video-marquee .agora-video-view");
  if ($marquee) {
    const clientWidth = $marquee.clientWidth;
    const marqueeLength: number = document.querySelectorAll(".video-marquee .agora-video-view").length;
    const videoMarqueeMark = document.querySelector('.video-marquee-mask')
    if (clientWidth && videoMarqueeMark) {
      const videoMarqueeWidth = videoMarqueeMark.clientWidth;
      const width: number = clientWidth * marqueeLength;
      if (videoMarqueeWidth <= width) {
        return true;
      }
    }
  }
  return false;
}


export const VideoMarquee = observer(() => {

  const { teacherStream, studentStreams } = useRoomStore()

  const marqueeEl = useRef(null);

  const scrollLeft = (current: any, offset: number) => {
    current.scrollLeft += (offset * current.childNodes[1].offsetWidth);
  }

  const handleScrollLeft = (evt: any) => {
    scrollLeft(marqueeEl.current, 1);
  }

  const handleScrollRight = (evt: any) => {
    scrollLeft(marqueeEl.current, -1);
  }

  const ref = useRef<boolean>(false);

  const banubaRef = useRef(null)



  useEffect(() => {
    return () => {
      ref.current = true;
    }
  }, []);

  const [scrollBar, setScrollBar] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (!studentStreams.length) return;
    !ref.current && setScrollBar(showScrollbar());
  }, [studentStreams]);

  useEffect(() => {
    window.addEventListener('resize', (evt: any) => {
      !ref.current && setScrollBar(showScrollbar());
    });
    return () => {
      window.removeEventListener('resize', () => { });
    }
  }, []);




  // componentDidMount
  // useEffect(() => {

  //   const webcam = new Webcam()
  //   Player
  //     .create(
  //       {
  //         clientToken: BANUBA_CLIENT_TOKEN,
  //         locateFile: {
  //           "BanubaSDK.wasm": "webar/BanubaSDK.wasm",
  //           "BanubaSDK.data": "webar/BanubaSDK.data",
  //         },
  //       })
  //     .then((player) => {
  //       player.use(webcam)
  //       player.applyEffect(new Effect("webar/effects/Afro.zip"))
  //       Dom.render(player, "#webar")
  //     })
  //   // componentWillUnmount
  //   return () => {
  //     webcam.stop()
  //     Dom.unmount("#webar")
  //   }

    // async 
    // const player = await Player.create({ clientToken: "xxx-xxx-xxx" })
    // player.use(new Webcam())
    // player.applyEffect(new Effect("octopus.zip"))
    // player.play()

    // const stream = new MediaStreamCapture(player)
    // const video = stream.getVideoTrack()

    // const client = AgoraRTC.createClient({ mode: "live", role: "host", codec: "h264" })
    // await client.join("AGORA APP ID", "CHANNEL NAME", null)
    // await client.publish(video)
  // })

  return (
    <div className="video-marquee-container">
      <div className="main">
        <VideoPlayer
          showClose={false}
          role="teacher"
          {...teacherStream}
        />

        {/* <div id='webar'>

        </div> */}
      </div>

      <div className="video-marquee-mask">
        <div className="video-marquee" ref={marqueeEl}>
          {scrollBar ?
            <div className="scroll-btn-group">
              <div className="icon icon-left" onClick={handleScrollLeft}></div>
              <div className="icon icon-right" onClick={handleScrollRight}></div>
            </div> : null
          }
          {studentStreams.map((studentStream: any, key: number) => (
            <VideoPlayer
              key={key}
              showClose={false}
              role="student"
              {...studentStream}
            />
          ))}
        </div>
      </div>

    </div>
  )
})