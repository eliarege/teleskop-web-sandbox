import { Buffer } from 'node:buffer'
import EventEmitter, { once } from 'node:events'
import type { Socket } from 'node:net'
import type { WebSocket } from 'ws'
import type { Logger } from 'pino'
import { DESECBCipher } from './crypto/des'
import type { Machine } from './database'

export interface ProxyContext {
  buffer: Buffer
  bufferSize: number
  emitter: EventEmitter
  client: WebSocket
  server: Socket
  signal: AbortSignal
  machine: Machine
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

export enum ClientMessageType {
  SetPixelFormat = 0,
  SetEncodings = 2,
  FramebufferUpdateRequest = 3,
  KeyEvent = 4,
  PointerEvent = 5,
  ClientCutText = 6,
}

/** Supported security types in order of preference */
// const supportedSecurityTypes = [
//   SecurityType.VNCAuth,
//   SecurityType.None,
//   SecurityType.Tight,
// ]

export class HandshakeError extends Error {}

function interceptProtocolVersion(msg: Buffer) {
  const TRAILING_ZERO_RE = /^0+/
  // 003.008
  const [major, minor] = msg
    .subarray(4, -1)
    .toString('ascii')
    .split('.')

  return Number.parseFloat(
    `${major.replace(TRAILING_ZERO_RE, '')}.${minor.replace(TRAILING_ZERO_RE, '')}`,
  )
}

function getSecurityTypeString(type: SecurityType): string {
  return Object.entries(SecurityType).find(e => e[1] === type)?.[0] || `Unknown [${type}]`
}

export function interceptClientMessageType(data: Buffer): ClientMessageType {
  return data.readUInt8(0)
}

type AwaitResponse =
  | { success: true, data: Buffer }
  | { success: false, reason: string, data?: Buffer }

export class ProxyHandshake {
  private buffer = Buffer.alloc(1024 * 10) // 10 kb
  private bufferSize = 0
  private tightVNC = false
  private rfbVersion = 0
  private securityType = SecurityType.None
  private serverEmitter = new EventEmitter()
  private serverListener: (data: Buffer) => any

  constructor(
    private client: WebSocket,
    private server: Socket,
    private machine: Machine,
    private signal: AbortSignal,
    private logger: Logger,
  ) {
    this.serverListener = (data) => {
      data.copy(this.buffer, this.bufferSize)
      this.bufferSize += data.length
      this.serverEmitter.emit('message', data)
    }
    this.server.on('data', this.serverListener)
  }

  async handshake(): Promise<boolean> {
    try {
      await this.negotiateProtocolVersion()
      await this.negotiateSecurity()
      await this.negotiateAuthentication()
      const ok = await this.handleSecurityResult()
      if (!ok)
        return false
      await this.negotiateClientInit()
      await this.negotiateServerInit()
      return true
    } finally {
      this.destroy()
    }
  }

  destroy() {
    this.server.off('message', this.serverListener)
  }

  /**
   * Docs: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#protocolversion
   */
  private async negotiateProtocolVersion(): Promise<void> {
    let msg: Buffer
    msg = await this.expectServerMsg(12, 'Protocol version')
    this.logger.debug(`Server protocol version: ${msg.subarray(0, -1)}`)
    this.client.send(msg)

    msg = await this.expectClientMsg('Protocol version')
    this.rfbVersion = interceptProtocolVersion(msg)
    this.logger.debug(`Client protocol version: ${msg.subarray(0, -1)}`)
    this.server.write(msg)
  }

  /**
   * Docs: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#security
   */
  private async negotiateSecurity(): Promise<void> {
    let msg: Buffer
    if (this.rfbVersion >= 3.7) {
    // Server sends security types
      msg = await this.expectServerMsg(1, 'Number of security types')
      const numberOfSecurityTypes = msg.readUint8()
      if (numberOfSecurityTypes > 0) {
        msg = await this.expectServerMsg(numberOfSecurityTypes, 'Security types')
        this.client.send(Buffer.from([numberOfSecurityTypes, ...msg]))
        this.logger.debug(`Security types: ${[...msg].map(i => getSecurityTypeString(i as SecurityType)).join(', ')}`)

        // Client selects security type
        msg = await this.expectClientMsg('Selected security type')
        this.securityType = msg.readUint8()
        this.logger.debug(`Selected security type: ${getSecurityTypeString(this.securityType)}`)
        this.server.write(msg)
      }
    } else {
    // Server selects the security type
      msg = await this.expectServerMsg(4, 'Selected security type')
      this.securityType = msg.readUint32BE(0)
    }
  }

  /**
   * Handle authentication based on the selected security type
   *
   * Read more: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#security-types
   */
  private async negotiateAuthentication(): Promise<void> {
    switch (this.securityType) {
      case SecurityType.None:
        return
      case SecurityType.VNCAuth:
        return this.negotiateVncAuth()
      case SecurityType.Tight:
        return this.negotiateTightAuth()
      default:
        throw new HandshakeError(`Unsupported security type: ${getSecurityTypeString(this.securityType)}`)
    }
  }

  /**
   * VNC Authentication
   *
   * Read more: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#vnc-authentication
   */
  private async negotiateVncAuth(): Promise<void> {
    // Server sends auth challenge
    const msg = await this.expectServerMsg(16, 'Auth Challenge')
    this.client.send(msg)
    // We ignore the response and send our challenge response
    await this.expectClientMsg('Auth Challenge Response')

    const cipher = DESECBCipher.importKey(Buffer.from(this.machine.password))
    const result = cipher.encrypt(msg)
    if (!result) {
      throw new HandshakeError('Failed responding to server challenge')
    }
    this.server.write(result)
  }

  /**
   * Tight Security Type
   *
   * Read more: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#tight-security-type
   */
  private async negotiateTightAuth(): Promise<void> {
    this.tightVNC = true
    let msg: Buffer
    // Server sends list of tunnels
    msg = await this.expectServerMsg(4, 'Number of tunnels')
    const numberOfTunnels = msg.readUInt32BE()
    this.logger.debug(`Number of tunnels: ${numberOfTunnels}`)

    if (numberOfTunnels) {
      msg = await this.expectServerMsg(numberOfTunnels * 16, 'Tunnels')
      this.client.send(Buffer.from([0, 0, 0, numberOfTunnels, ...msg]))

      // Client selects tunnel
      msg = await this.expectClientMsg('Selected tunnel')
      this.server.write(msg)
    } else {
      this.client.send(Buffer.from([0, 0, 0, 0]))
    }

    const supportedTypes = [
      { code: 1, type: SecurityType.None },
      { code: 2, type: SecurityType.VNCAuth },
    ]

    // Server sends auth types
    msg = await this.expectServerMsg(4, 'Number of auth types')
    const numberOfAuthTypes = msg.readUInt32BE(0)
    if (numberOfAuthTypes) {
      msg = await this.expectServerMsg(numberOfAuthTypes * 16, 'Auth types')
      this.client.send(Buffer.from([0, 0, 0, numberOfAuthTypes, ...msg]))

      // Client selects auth type
      msg = await this.expectClientMsg('Selected auth type')
      const authTypeCode = msg.readUint32BE(0)
      const authType = supportedTypes.find(cap => cap.code === authTypeCode)
      if (!authType) {
        throw new HandshakeError(`Unsupported type capability selected by client`)
      }
      this.securityType = authType.type
      this.server.write(msg)
    } else {
      this.securityType = SecurityType.None
    }
    await this.negotiateAuthentication()
  }

  /**
   * Docs: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#securityresult
   */
  private async handleSecurityResult(): Promise<boolean> {
    // If RFB version is below 3.7, there is no security response if there is no authentication
    if (this.securityType !== SecurityType.None || (this.securityType === SecurityType.None && this.rfbVersion >= 3.7)) {
      let msg: Buffer
      msg = await this.expectServerMsg(4, 'Auth response')
      const ok = msg.readUInt32BE(0) === 0
      if (!ok) {
        let reason = ''
        const errMsg = [msg]
        if (this.rfbVersion >= 3.8) {
          msg = await this.expectServerMsg(4, 'Failure reason length')
          errMsg.push(msg)
          const reasonLength = msg.readUInt32BE()

          msg = await this.expectServerMsg(reasonLength, 'Failure reason')
          errMsg.push(msg)
          reason = msg.toString()
        }
        this.logger.error(`Server negotiation failed: Reason: ${reason || 'Unknown'}`)
        this.client.send(Buffer.concat(errMsg))
        return false
      } else {
        this.client.send(msg)
      }
    }
    return true
  }

  /**
   * Docs: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#clientinit
   */
  private async negotiateClientInit(): Promise<void> {
    const msg = await this.expectClientMsg('Init')
    this.server.write(msg)
  }

  /**
   * Docs: https://github.com/rfbproto/rfbproto/blob/master/rfbproto.rst#serverinit
   */
  private async negotiateServerInit(): Promise<void> {
    // Server sends init message
    const initMsg = [] as Buffer[]
    let msg: Buffer
    msg = await this.expectServerMsg(20, 'Init')
    initMsg.push(msg)
    msg = await this.expectServerMsg(4, 'Desktop name length')
    initMsg.push(msg)
    const nameLength = msg.readUint32BE()
    msg = await this.expectServerMsg(nameLength, 'Desktop name')
    initMsg.push(msg)
    this.logger.debug(`Desktop name: ${msg}`)

    if (this.tightVNC) {
      msg = await this.expectServerMsg(2, 'TightVNC: Number of server messages')
      const numberOfServerMessages = msg.readUInt16BE()
      initMsg.push(msg)
      msg = await this.expectServerMsg(2, 'TightVNC: Number of client messages')
      const numberOfClientMessages = msg.readUInt16BE()
      initMsg.push(msg)
      msg = await this.expectServerMsg(4, 'TightVNC: Number of encodings') // With padding
      const numberOfEncodings = msg.readUInt16BE()
      initMsg.push(msg)
      msg = await this.expectServerMsg((numberOfServerMessages + numberOfClientMessages + numberOfEncodings) * 16, 'TightVNC: Capabilities')
      initMsg.push(msg)
    }
    this.client.send(Buffer.concat(initMsg))
  }

  /**
   * Wait for message from server. Fails if client sends message or signal is aborted.
   *
   * @param size - Size of bytes expected from server
   * @param action - Log what we expect from server
   * @returns - Returned message
   */
  private async expectServerMsg(size: number, action: string): Promise<Buffer> {
    if (this.signal.aborted) {
      throw new Error('abort')
    }
    const result: AwaitResponse = await Promise.race([
      this.recvUntil(size).then(data => ({
        success: true as const,
        data,
      })),
      once(this.client, 'message').then(([data]) => ({
        success: false as const,
        reason: 'got message from client',
        data,
      })),
      once(this.signal, 'abort').then(() => ({
        success: false as const,
        reason: 'aborted',
      })),
    ])
    if (!result.success) {
      if (result.data) {
        this.logger.debug({ data: result.data }, `Client sent message when waiting for server`)
      }
      throw new HandshakeError(`Expected ${action} from server, but ${result.reason}`)
    } else {
      this.logger.debug(`Server sent ${action}`)
      return result.data
    }
  }

  /**
   * Wait for message from client. Fails if server sends message or signal is aborted.
   *
   * @param action - Log what we expect from clien
   * @returns Returned message
   */
  private async expectClientMsg(action: string): Promise<Buffer> {
    if (this.signal.aborted) {
      throw new Error('abort')
    }
    const result: AwaitResponse = await Promise.race([
      once(this.client, 'message').then(([data]) => ({
        success: true as const,
        data,
      })),
      once(this.serverEmitter, 'message').then(([data]) => ({
        success: false as const,
        reason: 'got message from server',
        data,
      })),
      once(this.signal, 'abort').then(() => ({
        success: false as const,
        reason: 'aborted',
      })),
    ])
    if (!result.success) {
      if (result.data) {
        this.logger.debug({ data: result.data }, `Server sent message when waiting for client`)
      }
      throw new HandshakeError(`Expected "${action}" from client, but ${result.reason}`)
    } else {
      this.logger.debug(`Client sent ${action}`)
      return result.data
    }
  }

  /**
   * Waits until internal buffer reaches given size and returns the awaited slice.
   * `serverEmitter` should dispatch `message` event when `bufferSize` changes.
   *
   * @param size
   * @returns Received buffer
   */
  private async recvUntil(size: number): Promise<Buffer> {
    while (true) {
      if (this.bufferSize >= size) {
        const slice = Buffer.alloc(size)
        // Shift the buffer onto slice
        this.buffer.copy(slice, 0, 0, size)
        this.buffer.copyWithin(0, size, this.bufferSize)
        this.buffer.fill(0, this.bufferSize - size, this.bufferSize)
        this.bufferSize -= size

        return slice
      }
      await once(this.serverEmitter, 'message')
    }
  }
}
