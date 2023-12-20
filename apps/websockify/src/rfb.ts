import type { Buffer } from 'node:buffer'
import { logger as parentLogger } from './logger'

export enum MessageType {
  Client = 1,
  Server = 2,
}

export enum ClientMessageType {
  SetPixelFormat = 0,
  SetEncodings = 2,
  FramebufferUpdateRequest = 3,
  KeyEvent = 4,
  PointerEvent = 5,
  ClientCutText = 6,
}

export enum ServerMessageType {
  FramebufferUpdate = 0,
  SetColorMapEntries = 1,
  Bell = 2,
  ServerCutText = 3,
}

export enum SecurityType {
  None = 1,
  VNCAuth = 2,
  RA2ne = 6,
  Tight = 16,
  VeNCrypt = 19,
  XVP = 22,
  ARD = 30,
  MSLogonII = 113,
  UnixLogon = 129,
  Plain = 256,
}

export interface Message {
  data: Buffer
  type: MessageType
}

export class HandshakeError extends Error {}

const supportedSecurityTypes = [
  SecurityType.None,
  SecurityType.VNCAuth,
  SecurityType.Tight,
]

const logger = parentLogger.child({ name: 'proxy' })

function interceptProtocolVersion(msg: Message) {
  const TRAILING_ZERO_RE = /^0+/
  // 003.008
  const [major, minor] = msg.data
    .subarray(4, -1)
    .toString('ascii')
    .split('.')
  return Number.parseFloat(
    `${major.replace(TRAILING_ZERO_RE, '')}.${minor.replace(TRAILING_ZERO_RE, '')}`,
  )
}

function interceptAuthResponse(msg: Message): boolean {
  return msg.data.readUInt32BE(0) === 0
}

export function interceptClientMessageType(data: Buffer): ClientMessageType {
  return data.readUInt8(0)
}

function expectClient(msg: Message, action: string) {
  if (msg.type !== MessageType.Client) {
    throw new HandshakeError(`Expected message from client. [${action}]`)
  }
  logger.debug(action)
  return msg
}

function expectServer(msg: Message, action: string) {
  if (msg.type !== MessageType.Server) {
    throw new HandshakeError(`Expected message from server. [${action}]`)
  }
  logger.debug(action)
  return msg
}

function getSecurityTypeString(type: SecurityType): string {
  return Object.entries(SecurityType).find(e => e[1])?.[0] || `Unknown [${type}]`
}

export function* createRFBHandshakeProxy(): Generator<undefined, boolean, Message> {
  expectServer(yield, 'Server sent protocol version')
  const rfbVersion = interceptProtocolVersion(expectClient(yield, 'Client sent protocol version'))
  let securityType = SecurityType.None

  if (rfbVersion >= 3.7) {
    // Server sends supported list, client decides
    const securityTypes = expectServer(yield, 'Server sent list of security types')
    const numberOfSecurityTypes = securityTypes.data.readUInt8(0)
    if (numberOfSecurityTypes > 0) {
      securityType = expectClient(yield, 'Client selected security type').data.readUInt8(0)
    }
  } else {
    securityType = expectServer(yield, 'Server sent auth scheme').data.readUint32BE(0)
  }

  if (!securityType) {
    logger.debug('Security negotiation failed')
    return false
  } else if (!supportedSecurityTypes.includes(securityType)) {
    throw new HandshakeError(`Unsupported security type: ${getSecurityTypeString(securityType)}`)
  }

  // Tight Security Type
  // Read more: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#tight-security-type
  if (securityType === SecurityType.Tight) {
    const cap = expectServer(yield, 'Server sent capabilities')
    const tunnelCount = cap.data.readUInt32BE(0)
    if (tunnelCount) {
      expectClient(yield, 'Client selected tunnel type')
    }
    const authOffset = 16 * tunnelCount + 4
    const authTypeCount = cap.data.readUInt32BE(authOffset)
    if (authTypeCount) {
      securityType = expectClient(yield, 'Client selected auth type').data.readUInt32BE(0)
      if (!supportedSecurityTypes.includes(securityType)) {
        throw new HandshakeError(`Unsupported security type: ${getSecurityTypeString(securityType)}`)
      }
    } else {
      securityType = SecurityType.None
    }
  }

  // VNC Authentication
  // Read more: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#vnc-authentication
  if (securityType === SecurityType.VNCAuth) {
    expectServer(yield, 'Server sent auth challenge')
    expectClient(yield, 'Client sent credentials')
  }

  // If RFB version is below 3.7, there is no security response if there is no authentication
  if (securityType !== SecurityType.None || (securityType === SecurityType.None && rfbVersion >= 3.7)) {
    const authResponse = expectServer(yield, 'Server sent auth response')
    const authSuccess = interceptAuthResponse(authResponse)
    if (!authSuccess)
      return false
  }

  expectClient(yield, 'Client Initialization')
  expectServer(yield, 'Server Initialization')

  return true
}
