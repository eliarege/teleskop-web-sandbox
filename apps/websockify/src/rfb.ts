import type { Buffer } from 'node:buffer'
import { logger as parentLogger } from './logger'

export type MessageType = 'client' | 'server'

export enum ClientMessageType {
  SetPixelFormat = 0,
  SetEncodings = 2,
  FramebufferUpdateRequest = 3,
  KeyEvent = 4,
  PointerEvent = 5,
  ClientCutText = 6,
}

export enum HandshakeState {
  /** Server sends protocol version */
  ProtocolVersionServer = 1,
  /** Client sends protocol version */
  ProtocolVersionClient,
  /** Server sends security types */
  SecurityServer,
  /** Client picks security type */
  SecurityClient,
  /** TightVNC Only: Server sends capabilities. (Tunnel types, auth types) */
  TightServerCapabilities,
  /** TightVNC Only: Client picks tunnel type */
  TightTunnelClient,
  /** TightVNC Only: Client picks auth type */
  TightSecurityClient,
  /** Server sends authentication challenge */
  AuthenticationServer,
  /** Client sends authentication response */
  AuthenticationClient,
  /** Server sends security result */
  SecurityResult,
  /** Client tells that its initialised */
  ClientInitialisation,
  /** Servers tells that its initialised */
  ServerInitialisation,
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
  if (msg.type !== 'client') {
    throw new HandshakeError(`Expected message from client. [${action}]`)
  }
  logger.debug(action)
  return msg
}

function expectServer(msg: Message, action: string) {
  if (msg.type !== 'server') {
    throw new HandshakeError(`Expected message from server. [${action}]`)
  }
  logger.debug(action)
  return msg
}

function getSecurityTypeString(type: SecurityType): string {
  return Object.entries(SecurityType).find(e => e[1])?.[0] || `Unknown [${type}]`
}

/**
 * Yields next handshake state
 * Expects socket message
 * Returns the handshake result as boolean
 */
export function* createRFBHandshakeProxy(): Generator<HandshakeState, boolean, Message> {
  expectServer(yield HandshakeState.ProtocolVersionServer, 'Server sent protocol version')
  const rfbVersion = interceptProtocolVersion(expectClient(yield HandshakeState.ProtocolVersionClient, 'Client sent protocol version'))
  let securityType = SecurityType.None

  if (rfbVersion >= 3.7) {
    // Server sends supported list, client decides
    const securityTypes = expectServer(yield HandshakeState.SecurityServer, 'Server sent list of security types')
    const numberOfSecurityTypes = securityTypes.data.readUInt8(0)
    if (numberOfSecurityTypes > 0) {
      securityType = expectClient(yield HandshakeState.SecurityServer, 'Client selected security type').data.readUInt8(0)
    }
  } else {
    securityType = expectServer(yield HandshakeState.SecurityServer, 'Server sent auth scheme').data.readUint32BE(0)
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
    const cap = expectServer(yield HandshakeState.TightServerCapabilities, 'Server sent capabilities')
    const tunnelCount = cap.data.readUInt32BE(0)
    if (tunnelCount) {
      expectClient(yield HandshakeState.TightTunnelClient, 'Client selected tunnel type')
    }
    const authOffset = 16 * tunnelCount + 4
    const authTypeCount = cap.data.readUInt32BE(authOffset)
    if (authTypeCount) {
      securityType = expectClient(yield HandshakeState.TightSecurityClient, 'Client selected auth type').data.readUInt32BE(0)
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
    expectServer(yield HandshakeState.AuthenticationServer, 'Server sent auth challenge')
    expectClient(yield HandshakeState.AuthenticationClient, 'Client sent credentials')
  }

  // If RFB version is below 3.7, there is no security response if there is no authentication
  if (securityType !== SecurityType.None || (securityType === SecurityType.None && rfbVersion >= 3.7)) {
    const authResponse = expectServer(yield HandshakeState.SecurityResult, 'Server sent auth response')
    const authSuccess = interceptAuthResponse(authResponse)
    if (!authSuccess)
      return false
  }

  expectClient(yield HandshakeState.ClientInitialisation, 'Client Initialization')
  expectServer(yield HandshakeState.ServerInitialisation, 'Server Initialization')

  return true
}
