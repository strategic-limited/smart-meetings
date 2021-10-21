import { EduLogger } from './../logger';
import { LocalUserRenderer, RemoteUserRenderer } from './renderer/index';
import { EventEmitter } from 'events';
import { IMediaService, RTCWrapperProvider, RTCProviderInitParams, CameraOption, MicrophoneOption, PrepareScreenShareParams, StartScreenShareParams } from './interfaces';
import { AgoraElectronRTCWrapper } from './electron';
import { AgoraWebRtcWrapper } from './web';
import AgoraRTC, { ITrack, ILocalTrack } from 'agora-rtc-sdk-ng';

enum ElectronFillMode {
  fillContentMode = 0,
  fitContentMode = 1
}

type JoinOption = {
  channel: string
  token?: string | null
  uid: number
  info?: string
}

export class MediaService extends EventEmitter implements IMediaService {
  sdkWrapper!: RTCWrapperProvider;

  cameraTestRenderer?: LocalUserRenderer;

  cameraRenderer?: LocalUserRenderer;

  microphoneTrack?: ILocalTrack;

  screenRenderer?: LocalUserRenderer;

  remoteUsersRenderer: RemoteUserRenderer[] = [];

  screenShareIds: any[] = []

  constructor(rtcProvider: RTCProviderInitParams) {
    super();
    EduLogger.info(`[rtcProvider] appId: ${rtcProvider.appId}, platform: ${rtcProvider.platform}`)
    if (rtcProvider.platform === 'electron') {
      const electronLogPath = rtcProvider.electronLogPath as any;
      this.sdkWrapper = new AgoraElectronRTCWrapper({
        logPath: electronLogPath.logPath,
        videoSourceLogPath: electronLogPath.videoSourceLogPath,
        AgoraRtcEngine: rtcProvider.agoraSdk,
        appId: rtcProvider.appId,
      })
      //@ts-ignore
      window.ipc && window.ipc.once("initialize", (events: any, args: any) => {
        const logPath = args[0]
        const videoSourceLogPath = args[2];
        //@ts-ignore
        window.videoSourceLogPath = videoSourceLogPath;
        //@ts-ignore
        window.logPath = logPath
        console.log(`[media-service] set logPath: ${logPath}, ${videoSourceLogPath}`)
        this.electron.setAddonLogPath({logPath, videoSourceLogPath})
        this.electron.enableLogPersist()
      })
    } else {
      this.sdkWrapper = new AgoraWebRtcWrapper({
        uploadLog: true,
        agoraWebSdk: rtcProvider.agoraSdk,
        webConfig: {
          mode: 'live',
          codec: rtcProvider.codec,
          role: 'host',
        },
        appId: rtcProvider.appId
      })
    }
    this.sdkWrapper.on('watch-rtt', (evt: any) => {
      this.fire('watch-rtt', evt)
    })
    this.sdkWrapper.on('network-quality', (quality: any) => {
      // console.log("[media-service] network quality >>>>>>>>>>>", quality)
      this.fire('network-quality', quality)
    })
    this.sdkWrapper.on('connection-state-change', (curState: any) => {
      // console.log("[media-service] connection-state-change >>>>>>>>>>>", curState)
      this.fire('connection-state-change', {curState})
    })
    this.sdkWrapper.on('volume-indication', ({totalVolume}: any) => {
      this.fire('volume-indication', {totalVolume})
    })
    this.sdkWrapper.on('exception', (err: any) => {
      this.fire('exception', err)
    })
    this.sdkWrapper.on('user-unpublished', (evt: any) => {
      const user = evt.user
      if (evt.mediaType === 'audio') return
      EduLogger.debug("sdkwrapper user-unpublished", user)
      const userIndex = this.remoteUsersRenderer.findIndex((it: any) => it.uid === user.uid)
      if (userIndex !== -1) {
        const userRenderer = this.remoteUsersRenderer[userIndex]
        this.remoteUsersRenderer.splice(userIndex, 1)
        this.fire('user-unpublished', {
          remoteUserRender: userRenderer
        })
      }
    })
    this.sdkWrapper.on('user-published', (evt: any) => {
      const user = evt.user
      console.log(user , "This is users here")
      EduLogger.debug("sdkwrapper user-published", user)
      const userIndex = this.remoteUsersRenderer.findIndex((it: any) => it.uid === user.uid)
      if (userIndex === -1) {
        this.remoteUsersRenderer.push(new RemoteUserRenderer({
          context: this,
          uid: +user.uid,
          videoTrack: user.videoTrack,
          sourceType: 'default',
        }))
      } else {
        if (user.videoTrack) {
          this.remoteUsersRenderer[userIndex].videoTrack = user.videoTrack
        }
      }
      this.fire('user-published', {
        remoteUserRender: this.remoteUsersRenderer[userIndex]
      })
    })
    this.sdkWrapper.on('rtcStats', (evt: any) => {
      this.fire('rtcStats', evt)
    })
    this.cameraRenderer = undefined
    this.screenRenderer = undefined
    this.remoteUsersRenderer = []
    AgoraRTC.onCameraChanged = (info) => {
      this.fire('video-device-changed', (info))
    }
    AgoraRTC.onMicrophoneChanged = (info) => {
      this.fire('audio-device-changed', (info))
    }
    AgoraRTC.onAudioAutoplayFailed = () => {
      this.fire('audio-autoplay-failed')
    }
  }

  private fire(...params: any[]) {
    const [message, ...args] = params
    if (!['volume-indication', 'watch-rtt', 'network-quality'].includes(message)) {
      EduLogger.info(args[0], args)
    }
    this.emit(message, ...args)
  }

  get isWeb (): boolean {
    return this.sdkWrapper instanceof AgoraWebRtcWrapper
  }

  get isElectron (): boolean {
    return this.sdkWrapper instanceof AgoraElectronRTCWrapper
  }

  getTestCameraLabel(): string {
    const defaultLabel = '';
    if (this.isWeb) {
      if (this.web.cameraTestTrack) {
        return this.web.cameraTestTrack.getTrackLabel()
      }
    }
    if (this.isElectron) {
      const deviceId = this.electron.client.getCurrentVideoDevice()
      const videoDeviceList = this.electron.client.getVideoDevices()
      const videoDevice: any = videoDeviceList.find((d: any) => d.deviceid === deviceId)
      if (videoDevice) {
        return videoDevice.devicename
      }
    }
    return defaultLabel
  }

  getTestMicrophoneLabel(): string {
    const defaultLabel = '';
    if (this.isWeb) {
      if (this.web.microphoneTestTrack) {
        return this.web.microphoneTestTrack.getTrackLabel()
      }
    }
    if (this.isElectron) {
      const deviceId = this.electron.client.getCurrentAudioRecordingDevice()
      const audioDeviceList = this.electron.client.getAudioRecordingDevices()
      const audioDevice: any = audioDeviceList.find((d: any) => d.deviceid === deviceId)
      if (audioDevice) {
        return audioDevice.devicename
      }
    }
    return defaultLabel
  }

  getCameraLabel(): string {
    const defaultLabel = '';
    if (this.isWeb) {
      if (this.web.cameraTrack) {
        return this.web.cameraTrack.getTrackLabel()
      }
    }
    if (this.isElectron) {
      const deviceId = this.electron.client.getCurrentVideoDevice()
      const videoDeviceList = this.electron.client.getVideoDevices()
      const videoDevice: any = videoDeviceList.find((d: any) => d.deviceid === deviceId)
      if (videoDevice) {
        return videoDevice.devicename
      }
    }
    return defaultLabel
  }

  getSpeakerLabel(): string {
    if (this.isElectron) {
      const deviceItem = this.electron.client.getPlaybackDeviceInfo()[0]
      return deviceItem.devicename
    }

    return ''
  }

  getMicrophoneLabel(): string {
    const defaultLabel = '';
    if (this.isWeb) {
      if (this.web.microphoneTrack) {
        return this.web.microphoneTrack.getTrackLabel()
      }
    }
    if (this.isElectron) {
      const deviceId = this.electron.client.getCurrentAudioRecordingDevice()
      const audioDeviceList = this.electron.client.getAudioRecordingDevices()
      const audioDevice: any = audioDeviceList.find((d: any) => d.deviceid === deviceId)
      if (audioDevice) {
        return audioDevice.devicename
      }
    }
    return defaultLabel
  }

  changePlaybackVolume(volume: number): void {
    if (this.isWeb) {
      this.sdkWrapper.changePlaybackVolume(volume)
    }
    if (this.isElectron) {
      this.sdkWrapper.changePlaybackVolume(volume)
    }
  }
  
  async muteLocalVideo(val: boolean): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.muteLocalVideo(val)
    }
    if (this.isElectron) {
      await this.sdkWrapper.muteLocalVideo(val)
    }
  }

  async muteLocalAudio(val: boolean): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.muteLocalAudio(val)
    }
    if (this.isElectron) {
      await this.sdkWrapper.muteLocalAudio(val)
    }
  }

  async muteRemoteVideo(uid: any, val: boolean): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.muteRemoteVideo(uid, val)
    }
    if (this.isElectron) {
      await this.sdkWrapper.muteRemoteVideo(uid, val)
    }
  }

  async muteRemoteAudio(uid: any, val: boolean): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.muteRemoteAudio(uid, val)
    }
    if (this.isElectron) {
      await this.sdkWrapper.muteRemoteAudio(uid, val)
    }
  }

  async muteRemoteVideoByClient(client: any, uid: any, val: boolean): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.muteRemoteVideoByClient(client, uid, val)
    } else {
      throw 'electron not implemented'
    }
  }
  async muteRemoteAudioByClient(client: any, uid: any, val: boolean): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.muteRemoteAudioByClient(client, uid, val)
    } else {
      throw 'electron not implemented'
    }
  }

  get web (): AgoraWebRtcWrapper {
    return (this.sdkWrapper as AgoraWebRtcWrapper)
  }

  get electron (): AgoraElectronRTCWrapper {
    return (this.sdkWrapper as AgoraElectronRTCWrapper)
  }

  init() {
    if (this.isWeb) {
      this.sdkWrapper.init()
    }

    if (this.isElectron) {
      this.sdkWrapper.init()
    }
  }

  release () {
    if (this.isWeb) {
      this.sdkWrapper.release()
    }

    if (this.isElectron) {
      this.sdkWrapper.release()
    }
  }

  async join(option: JoinOption): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.join(option)
    }
    if (this.isElectron) {
      await this.sdkWrapper.join(option)
    }
  }

  async leave(): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.leave()
    }
    if (this.isElectron) {
      await this.sdkWrapper.leave()
    }
  }

  async joinChannel(option: JoinOption): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.joinChannel(option)
    } else {
      throw 'electron no implement'
    }
  }

  async leaveChannel(option: JoinOption): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.leaveChannel(option)
    } else {
      throw 'electron no implement'
    }
  }

  // async publishChannel(): Promise<any> {
  //   if (this.isWeb) {
  //     await this.sdkWrapper.publishChannel()
  //   } else {
  //     throw 'electron no implement'
  //   }
  // }

  // async unpublishChannel(): Promise<any> {
  //   if (this.isWeb) {
  //     await this.sdkWrapper.unpublishChannel()
  //   } else {
  //     throw 'electron no implement'
  //   }
  // }

  async publish(): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.publish()
    }
    if (this.isElectron) {
      await this.sdkWrapper.publish()
    }
  }

  async unpublish(): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.unpublish()
    }
    if (this.isElectron) {
      await this.sdkWrapper.unpublish()
    }
  }

  async openCamera(option?: CameraOption): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.openCamera(option)
      if (!this.web.cameraTrack) return
      if (!this.cameraRenderer) {
        this.cameraRenderer = new LocalUserRenderer({
          context: this,
          uid: 0,
          sourceType: 'default',
          videoTrack: this.web.cameraTrack
        })
      } else {
        this.cameraRenderer.videoTrack = this.web.cameraTrack
      }
    }
    if (this.isElectron) {
      await this.sdkWrapper.openCamera()

      if (!this.cameraRenderer) {
        this.cameraRenderer = new LocalUserRenderer({
          context: this,
          uid: 0,
          sourceType: 'default',
        })
      }
    }
  }

  async changeCamera(deviceId: string): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.changeCamera(deviceId)
    }
    if (this.isElectron) {
      await this.sdkWrapper.changeCamera(deviceId)
    }
  }

  async closeCamera() {
    if (this.isWeb) {
      await this.sdkWrapper.closeCamera()
    }
    if (this.isElectron) {
      await this.sdkWrapper.closeCamera()
    }
    if (this.cameraRenderer) {
      this.cameraRenderer.stop()
      this.cameraRenderer = undefined
    }
  }

  async openMicrophone(option?: MicrophoneOption): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.openMicrophone(option)
      this.microphoneTrack = this.web.microphoneTrack
    }
    if (this.isElectron) {
      await this.sdkWrapper.openMicrophone(option)
      //@ts-ignore
      this.microphoneTrack = {}
    }
  }

  async changeMicrophone(deviceId: string): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.changeMicrophone(deviceId)
    }
    if (this.isElectron) {
      await this.sdkWrapper.changeMicrophone(deviceId)
    }
  }

  async closeMicrophone() {
    await this.sdkWrapper.closeMicrophone()
    this.microphoneTrack = undefined
  }

  async openTestCamera(option: CameraOption): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.openTestCamera(option)
      if (!this.web.cameraTestTrack) return

      if (!this.cameraTestRenderer) {
  
        this.cameraTestRenderer = new LocalUserRenderer({
          context: this,
          uid: 0,
          sourceType: 'default',
          videoTrack: this.web.cameraTestTrack
        })
      } else {
  
        this.cameraTestRenderer.videoTrack = this.web.cameraTestTrack
      }
    }
    if (this.isElectron) {
      await this.sdkWrapper.openTestCamera()

      if (!this.cameraTestRenderer) {
        this.cameraTestRenderer = new LocalUserRenderer({
          context: this,
          uid: 0,
          sourceType: 'default',
        })
      }
    }
  }

  closeTestCamera() {
    this.sdkWrapper.closeTestCamera()
    if (this.cameraTestRenderer) {
      this.cameraTestRenderer.stop()
      this.cameraTestRenderer = undefined
    }
  }

  async changeTestCamera(deviceId: string): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.changeTestCamera(deviceId)
    }
    if (this.isElectron) {
      await this.sdkWrapper.changeTestCamera(deviceId)
    }
  }

  async changeTestResolution(config: any) {
    if (this.isWeb) {
      await this.web.changeTestResolution(config)
    }
    if (this.isElectron) {
      await this.electron.changeTestResolution(config)
    }
  }

  async openTestMicrophone(option?: MicrophoneOption): Promise<any> {
    await this.sdkWrapper.openTestMicrophone(option)
  }

  closeTestMicrophone() {
    this.sdkWrapper.closeTestMicrophone()
  }

  async changeTestMicrophone(id: string): Promise<any> {
    await this.sdkWrapper.changeTestMicrophone(id)
  }

  async getCameras(): Promise<any> {
    if (this.isWeb) {
      return await this.web.getCameras()
    }

    if (this.isElectron) {
      return await this.electron.getCameras()
    }
  }

  async getMicrophones(): Promise<any> {
    if (this.isWeb) {
      return await this.web.getMicrophones()
    }

    if (this.isElectron) {
      return await this.electron.getMicrophones()
    }
  }

  async prepareScreenShare(params: PrepareScreenShareParams = {}): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.prepareScreenShare(params)
      this.screenRenderer = new LocalUserRenderer({
        context: this,
        uid: 0,
        videoTrack: this.web.screenVideoTrack as ITrack,
        sourceType: 'screen',
      })
    }
    if (this.isElectron) {
      let items = await this.sdkWrapper.prepareScreenShare()
      return items
    }
  }

  async startScreenShare(option: StartScreenShareParams): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.startScreenShare(option)
    }
    if (this.isElectron) {
      await this.sdkWrapper.startScreenShare(option)
      this.screenRenderer = new LocalUserRenderer({
        context: this,
        uid: 0,
        videoTrack: undefined,
        sourceType: 'screen',
      })
    }
  }

  async stopScreenShare(): Promise<any> {
    if (this.isWeb) {
      await this.sdkWrapper.stopScreenShare()
    }
    if (this.isElectron) {
      await this.sdkWrapper.stopScreenShare()
    }
  }

  async changeResolution(config: any) {
    if (this.isWeb) {
      await this.web.changeResolution(config)
    }
    if (this.isElectron) {
      await this.electron.changeResolution(config)
    }
  }

  getPlaybackVolume(): number {
    if (this.isElectron) {
      return +(this.electron.client.getAudioPlaybackVolume() / 255 * 100).toFixed(1) 
    }
    return 100;
  }

  reset(): void {
    if (this.isWeb) {
      this.web.reset()
    }
    if (this.isElectron) {
      this.electron.reset()
    }
  }
}