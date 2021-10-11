import { EduPeerMessageCmdType, EduTextMessage, EduCustomMessage } from './../interfaces/index';
import { MessageSerializer } from './../core/rtm/message-serializer';
import { EduLogger } from './../core/logger';
import { EventEmitter } from 'events';
import { RTMWrapper } from './../core/rtm/index';
import { MediaService } from '../core/media-service';
import { EduClassroomManager } from '../room/edu-classroom-manager';
import { AgoraEduApi } from '../core/services/edu-api';
import { EduConfiguration, EduUser, EduStream } from '../interfaces';
import { EduClassroomDataController } from '../room/edu-classroom-data-controller';

export type ClassroomInitParams = {
  roomUuid: string
  roomName: string
}

export type ClassRoomAuthorization = string

export class EduManager extends EventEmitter {
  private static enable: boolean = true

  private apiService!: AgoraEduApi;

  public _rtmWrapper?: RTMWrapper;

  public readonly config: EduConfiguration;

  private _classroomMap: Record<string, EduClassroomManager> = {}

  public _ended: boolean = false;

  public _dataBuffer: Record<string, EduClassroomDataController> = {}

  public readonly _mediaService: MediaService;

  constructor(
    config: EduConfiguration
  ) {
    super()
    this.config = config
    const buildOption = {
      platform: this.config.platform,
      agoraSdk: this.config.agoraRtc,
      codec: this.config.codec ? this.config.codec : 'vp8',
      appId: this.config.appId
    } as any
    if (buildOption.platform === 'electron') {
      buildOption.electronLogPath = {
        //@ts-ignore
        logPath: window.logPath,
        //@ts-ignore
        videoSourceLogPath: window.videoSourceLogPath,
      }
    }
    this._mediaService = new MediaService(buildOption)
    this.apiService = new AgoraEduApi(this.config.appId, this.authorization)
  }

  private get rtmWrapper(): RTMWrapper {
    return this._rtmWrapper as RTMWrapper;
  }

  get mediaService(): MediaService {
    return this._mediaService;
  }

  static init(config: EduConfiguration): EduManager {
    return new EduManager(config);
  }

  static enableDebugLog(enable: boolean) {
    this.enable = enable
    if (this.enable) {
      EduLogger.init()
    }
  }
  
  static async uploadLog(roomUuid: string): Promise<any> {
    return await EduLogger.enableUpload(roomUuid)
  }

  get authorization(): string {
    return window.btoa(`${this.config.customerId}:${this.config.customerCertificate}`)
  }

  private async prepareLogin(userUuid: string) {
    let res = await this.apiService.login(userUuid)
    return res
  }

  private fire(evtName: string, ...args: any[]) {
    this.emit(evtName, ...args)
  }

  private _rtmConnectionState = 'DISCONNECTED'

  get rtmConnectionState(): string {
    return this._rtmConnectionState
  }

  async login(userUuid: string) {
    EduLogger.debug(`login userUuid: ${userUuid}`)
    try {
      let {userUuid: uuid, rtmToken} = await this.prepareLogin(userUuid)
      EduLogger.debug(`prepareLogin login userUuid: ${userUuid} success`)
      const rtmWrapper = new RTMWrapper(this.config.agoraRtm)
      rtmWrapper.on('ConnectionStateChanged', async (evt: any) => {
        console.log("[rtm] ConnectionStateChanged", evt)
        if (rtmWrapper.prevConnectionState === 'RECONNECTING'
          && rtmWrapper.connectionState === 'CONNECTED') {
          for (let channel of Object.keys(this._dataBuffer)) {
            const classroom = this._dataBuffer[channel]
            if (classroom) {
              console.log("[syncing] classroom", channel)
              await classroom.syncData(true, 300)
            }
          }
        }
        this.fire('ConnectionStateChanged', evt)
      })
      rtmWrapper.on('MessageFromPeer', (evt: any) => {
        console.log("[rtm] MessageFromPeer", evt)
        const res = MessageSerializer.readMessage(evt.message.text)
        if (res === null) {
          return console.warn('[room] edu-manager is invalid', res)
        }
        const { cmd, version, requestId, data } = res
        EduLogger.info('Raw MessageFromPeer peer cmd', cmd)
        if (version !== 1) {
          return EduLogger.warn('received old version', requestId, data, cmd)
        }
        switch(cmd) {
          case EduPeerMessageCmdType.peer: {
            EduLogger.info(`自定义聊天消息, PeerMessage.${EduPeerMessageCmdType.peer}: `, data, requestId)
            const textMessage: EduTextMessage = MessageSerializer.getEduTextMessage(data)
            this.emit('user-chat-message', {
              message: textMessage
            })
            break;
          }
          // peer private custom message
          case EduPeerMessageCmdType.customMessage: {
            EduLogger.info(`订阅自定义点对点消息，PeerMessage.${EduPeerMessageCmdType.customMessage}: `, data)
            const customMessage: EduCustomMessage = MessageSerializer.getEduCustomMessage(data)
            EduLogger.info(`自定义点对点消息, user-message`, customMessage)
            this.emit('user-message', {
              message: customMessage
            })
            break;
          }
        }
        // this.fire('MessageFromPeer', evt)
      })
      EduLogger.debug(`rtm login userUuid: ${userUuid}, rtmToken: ${rtmToken} success`)
      await rtmWrapper.login({
        userUuid,
        rtmToken,
        appId: this.config.appId,
        uploadLog: true,
      })
      EduLogger.debug(`login userUuid: ${userUuid} success`)
      this._rtmWrapper = rtmWrapper
    } catch (err) {
      throw err
    }
  }

  async logout() {
    if (this.rtmWrapper) {
      this._ended = true
      await this.rtmWrapper.destroyRtm()
      this.removeAllListeners()
      this._rtmWrapper = undefined
    }
  }

  createClassroom(params: ClassroomInitParams): EduClassroomManager {

    const roomUuid = params.roomUuid

    let classroomManager = new EduClassroomManager({
      roomUuid: roomUuid,
      roomName: params.roomName,
      eduManager: this,
      apiService: new AgoraEduApi(this.config.appId, this.authorization),
    })
    this._classroomMap[params.roomUuid] = classroomManager
    this._dataBuffer[params.roomUuid] = new EduClassroomDataController(this._classroomMap[params.roomUuid])
    return this._classroomMap[params.roomUuid]
  }
}