export const APP_TOKEN = process.env.REACT_APP_AGORA_APP_TOKEN as string;
export const ENABLE_LOG = process.env.REACT_APP_AGORA_LOG as string;
export const APP_ID: string = process.env.REACT_APP_AGORA_APP_ID as string;
const genToken = (): string => {
  return window.btoa(`${process.env.REACT_APP_AGORA_CUSTOMER_ID}:${process.env.REACT_APP_AGORA_CUSTOMER_CERTIFICATE}`)
}
export const AUTHORIZATION: string = genToken();
export const RoomKeyIdentifier = 'agora_meeting_room';
export const GlobalKeyIdentifier = 'global_identifier';
export const UUIDKeyIdentifier = 'agora_meeting_uuid';
export const SessionKeyIdentifier = 'agora_demo_session_profile';