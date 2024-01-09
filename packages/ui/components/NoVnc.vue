<script lang="ts" setup>
import type { NoVncEvents } from '@novnc/novnc/core/rfb'
import RFB from '@novnc/novnc/core/rfb'
import { nextTick, onBeforeMount, onMounted, ref, toRef, watch } from 'vue'
import type { Ref } from 'vue'

export interface NoVncProps {
  /** WebSocket URL `string` */
  url?: string
  /**
   * An `object` specifying the credentials to provide to the server when authenticating.
   */
  credentials?: {
    /** The user that authenticates */
    username?: string
    /** Password for the user */
    password?: string
    /** Target machine or session */
    target?: string
  }
  /**
   * Enable authentication protocol, will wait for `props.token` to be truthy.
   */
  auth?: boolean
  /**
   * Token used for authentication
   */
  token?: string
  /**
   * Amount of time to wait for token
   */
  tokenTimeout?: number
  /**
   * A `boolean` indicating if the remote server should be shared or if any other connected
   * clients should be disconnected. Enabled by default.
   */
  shared?: boolean
  /**
   * Is a `boolean` indicating if any events (e.g. key presses or mouse movement) should be
   * prevented from being sent to the server. Disabled by default.
   */
  viewOnly?: boolean
  /**
   * Is a `boolean` indicating if keyboard focus should automatically be moved to the remote
   * session when a `mousedown` or `touchstart` event is received. Enabled by default.
   */
  focusOnClick?: boolean
  /**
   * Is a `boolean` indicating if the remote session should be clipped to its container. When
   * disabled scrollbars will be shown to handle the resulting overflow. Disabled by default.
   */
  clipViewport?: boolean
  /**
   * Is a `boolean` indicating if mouse events should control the relative position of a clipped
   * remote session. Only relevant if `clipViewport` is enabled. Disabled by default.
   */
  dragViewport?: boolean
  /**
   * Is a `boolean` indicating if the remote session should be scaled locally so it fits its
   * container. When disabled it will be centered if the remote session is smaller than its
   * container, or handled according to `clipViewport` if it is larger. Disabled by default.
   */
  scaleViewport?: boolean
  /**
   * Is a `boolean` indicating if a request to resize the remote session should be sent whenever
   * the container changes dimensions. Disabled by default.
   */
  resizeSession?: boolean
  /**
   * Is a `boolean` indicating whether a dot cursor should be shown instead of a zero-sized or
   * fully-transparent cursor if the server sets such invisible cursor. Disabled by default.
   */
  showDotCursor?: boolean
  /**
   * Is a valid CSS [background](https://developer.mozilla.org/en-US/docs/Web/CSS/background)
   * style value indicating which background style should be applied to the element containing the
   * remote session screen. The default value is `rgb(40, 40, 40)` (solid gray color).
   */
  background?: string
  /**
   * Is an `int` in range `[0-9]` controlling the desired JPEG quality. Value `0` implies low
   * quality and `9` implies high quality. Default value is `6`.
   */
  qualityLevel?: number
  /**
   * Is an `int` in range `[0-9]` controlling the desired compression level. Value `0` means no
   * compression. Level 1 uses a minimum of CPU resources and achieves weak compression ratios,
   * while level 9 offers best compression but is slow in terms of CPU consumption on the server
   * side. Use high levels with very slow network connections. Default value is `2`.
   */
  compressionLevel?: number
}

interface ConnectionDetails {
  viewOnly: boolean
}

const props = withDefaults(defineProps<NoVncProps>(), {
  url: 'ws://localhost:6080/websockify',
  credentials: () => ({ password: '...' }),
  auth: false,
  tokenTimeout: 3000,
  viewOnly: false,
  focusOnClick: true,
  clipViewport: false,
  dragViewport: false,
  scaleViewport: false,
  resizeSession: false,
  showDotCursor: false,
  background: 'rgb(40, 40, 40)',
  qualityLevel: 6,
  compressionLevel: 2,
})

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'connect'): void
  (e: 'disconnect', clean: boolean): void
  (e: 'clipboard', content: string): void
  (e: 'error', error: Error): void
}>()

const screen = ref<HTMLElement | undefined>()

let rfb: RFB | null = null

function authenticate(socket: WebSocket, token: string): Promise<ConnectionDetails> {
  return new Promise((resolve, reject) => {
    const onClose = (ev: CloseEvent) => {
      detach()
      reject(new Error(`VNC Authentication Failed: ${ev.reason}`))
    }
    const onMessage = (ev: MessageEvent<string>) => {
      detach()
      resolve(JSON.parse(ev.data))
    }
    const onOpen = () => {
      socket.send(`Bearer ${token}`)
      socket.addEventListener('message', onMessage)
    }
    function detach() {
      socket.removeEventListener('close', onClose)
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('open', onOpen)
    }
    socket.addEventListener('open', onOpen)
    socket.addEventListener('close', onClose)
  })
}

function untilTruthy<T>(ref: Ref<T>, timeoutReason = 'Timeout'): Promise<NonNullable<T>> {
  return new Promise((resolve, reject) => {
    let stop: (() => void) | null = null
    const timer = window.setTimeout(() => {
      stop?.()
      reject(new Error(timeoutReason))
    }, props.tokenTimeout)
    stop = watch(ref, (value) => {
      if (value) {
        nextTick(() => stop?.())
        resolve(value!)
        window.clearTimeout(timer)
      }
    }, {
      immediate: true,
    })
  })
}

async function initRFB() {
  let socket: WebSocket
  let viewOnly = props.viewOnly
  if (props.auth) {
    const token = await untilTruthy(toRef(() => props.token))
    socket = new WebSocket(props.url)
    const response = await authenticate(socket, token)
    viewOnly = response.viewOnly
  } else {
    socket = new WebSocket(props.url)
  }
  rfb = new RFB(screen.value!, socket, {
    credentials: props.credentials,
  })
  rfb.addEventListener('connect', () => emit('connect'))
  rfb.addEventListener('disconnect', (e: NoVncEvents['disconnect']) => {
    emit('disconnect', e.detail.clean)
  })
  rfb.addEventListener('clipboard', (e: NoVncEvents['clipboard']) => {
    emit('clipboard', e.detail.text)
  })
  rfb.viewOnly = viewOnly
  rfb.focusOnClick = props.focusOnClick
  rfb.clipViewport = props.clipViewport
  rfb.dragViewport = props.dragViewport
  rfb.scaleViewport = props.scaleViewport
  rfb.resizeSession = props.resizeSession
  rfb.showDotCursor = props.showDotCursor
  rfb.background = props.background
  rfb.qualityLevel = props.qualityLevel
  rfb.compressionLevel = props.compressionLevel
  emit('ready')
}

onMounted(async () => {
  await nextTick()
  try {
    await initRFB()
  } catch (err) {
    emit('error', err as Error)
  }
})

onBeforeMount(() => {
  rfb?.disconnect()
})

watch(() => props.focusOnClick, (newValue) => {
  if (rfb)
    rfb.focusOnClick = newValue
})
watch(() => props.clipViewport, (newValue) => {
  if (rfb)
    rfb.clipViewport = newValue
})
watch(() => props.dragViewport, (newValue) => {
  if (rfb)
    rfb.dragViewport = newValue
})
watch(() => props.scaleViewport, (newValue) => {
  if (rfb)
    rfb.scaleViewport = newValue
})
watch(() => props.resizeSession, (newValue) => {
  if (rfb)
    rfb.resizeSession = newValue
})
watch(() => props.showDotCursor, (newValue) => {
  if (rfb)
    rfb.showDotCursor = newValue
})
watch(() => props.background, (newValue) => {
  if (rfb)
    rfb.background = newValue
})
watch(() => props.qualityLevel, (newValue) => {
  if (rfb)
    rfb.qualityLevel = newValue
})
watch(() => props.compressionLevel, (newValue) => {
  if (rfb)
    rfb.compressionLevel = newValue
})

function wrap<T extends any[] = any[]>(callback: (rfb: RFB, ...args: T) => void) {
  return (...args: T) => {
    if (!rfb)
      throw new Error('RFB is not ready')
    callback(rfb, ...args)
  }
}

defineExpose({
  /**
   * Disconnect from the server.
   */
  disconnect: wrap(rfb => rfb.disconnect()),
  /**
   * Sets the keyboard focus on the remote session. Keyboard events will be sent to the remote
   * server after this point.
   *
   * @param options A {@link FocusOptions} providing options to control how the focus will be
   * performed. Please see {@link HTMLElement.focus} for available options.
   */
  focus: wrap((rfb, options?: FocusOptions) => rfb.focus(options)),
  /**
   * Remove keyboard focus on the remote session. Keyboard events will no longer be sent to the
   * remote server after this point.
   */
  blur: wrap(rfb => rfb.blur()),
  /**
   * Send a key event to the server.
   *
   * @param keysym A `number` specifying the NoVncClient keysym to send. Can be `0` if a valid
   * **`code`** is specified.
   * @param code A `string` specifying the physical key to send. Valid values are those that can
   * be specified to {@link KeyboardEvent.code}. If the physical key cannot be determined then
   * `null` shall be specified.
   * @param down A `boolean` specifying if a press or a release event should be sent. If omitted
   * then both a press and release event are sent.
   */
  sendKey: wrap((rfb, keysym: number, code: string | null, down?: boolean) => rfb.sendKey(keysym, code, down)),

  /**
   * Send ctrl+alt+del sequence
   */
  sendCtrlAltDel: wrap(rfb => rfb.sendCtrlAltDel()),
})
</script>

<template>
  <div ref="screen" />
</template>
