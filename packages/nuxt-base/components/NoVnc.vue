<script lang="ts" setup>
import type { NoVncEvents } from '@novnc/novnc/lib/rfb'
import RFB from '@novnc/novnc/lib/rfb'
import { nextTick, onMounted, onUnmounted, ref, toRef, watch } from 'vue'

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

  /**
   * Connection timeout
   */
  connectionTimeout?: number

  /**
   * A function that is called whenever a key event is about to be sent to the server. The
   * function is called with three arguments: the NoVncClient keysym (`number`), the physical key
   * code (`string` or `null`), and a `boolean` indicating if the key is being pressed or released.
   * The function must return `true` to allow the event to be sent to the server, or `false` to
   * block it.
   */
  keyFilter?: (keysym: number, code: string | null, down: boolean) => boolean
}

interface ConnectionDetails {
  viewOnly: boolean
}

const props = withDefaults(defineProps<NoVncProps>(), {
  url: 'ws://localhost:6080/websockify',
  credentials: () => ({}),
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
  connectionTimeout: 10000,
})

const emit = defineEmits<{
  (e: 'connect'): void
  (e: 'disconnect', clean: boolean): void
  (e: 'clipboard', content: string): void
  (e: 'error', error: Error): void
}>()

const screen = ref<HTMLElement | undefined>()
const { t } = useI18n()

type Status = 'connected' | 'connecting' | 'disconnected' | 'error'
const status = ref<Status>('connecting')

const overlayMessage = computed(() => {
  switch (status.value) {
    case 'connecting':
      return t('vnc.connecting')
    case 'disconnected':
      return t('vnc.disconnected')
    case 'error':
      return t('vnc.error')
    default:
      return ''
  }
})

const AUTH_FAILED_ERR = 'VNC Authentication Failed'

let rfb: RFB | null = null

function authenticate(socket: WebSocket, token: string): Promise<ConnectionDetails> {
  return new Promise((resolve, reject) => {
    const onClose = (ev: CloseEvent) => {
      detach()
      reject(new Error(`${AUTH_FAILED_ERR}: ${ev.reason}`))
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

async function initRFB() {
  status.value = 'connecting'
  let socket: WebSocket
  let viewOnly = props.viewOnly
  if (props.auth) {
    const token = await until(() => props.token)
      .toBeTruthy({
        timeout: props.tokenTimeout,
        throwOnTimeout: true,
      })
    socket = new WebSocket(props.url)
    const response = await authenticate(socket, token)
    viewOnly = response.viewOnly
  } else {
    socket = new WebSocket(props.url)
  }
  if (!screen.value) {
    throw new Error('RFB container is not mounted')
  }
  rfb = new RFB(screen.value, socket, {
    credentials: {
      username: props.credentials.username || '',
      password: props.credentials.password || '',
      target: props.credentials.target || '',
    },
    keyFilter: props.keyFilter,
  })
  rfb.addEventListener('connect', () => {
    status.value = 'connected'
    emit('connect')
  })
  rfb.addEventListener('disconnect', (e: NoVncEvents['disconnect']) => {
    status.value = e.detail.clean ? 'disconnected' : 'error'
    rfb = null
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
}

async function connect() {
  try {
    await initRFB()
  } catch (err) {
    status.value = 'error'
    console.error(err)
    emit('error', err as Error)
  }
}

function disconnect() {
  rfb?.disconnect()
  rfb = null
}

async function reconnect() {
  disconnect()
  await connect()
}

onMounted(async () => {
  await nextTick()
  await connect()
})

onUnmounted(() => {
  disconnect()
})

const reactiveOptions = [
  'focusOnClick',
  'clipViewport',
  'dragViewport',
  'scaleViewport',
  'resizeSession',
  'showDotCursor',
  'background',
  'qualityLevel',
  'compressionLevel',
] as const satisfies (keyof RFB)[]

reactiveOptions.forEach((key) => {
  watch(() => props[key], (newValue) => {
    if (rfb) {
      (rfb as any)[key] = newValue
    }
  })
})

function wrap<T extends any[] = any[]>(callback: (rfb: RFB, ...args: T) => void) {
  return (...args: T) => {
    if (rfb)
      callback(rfb, ...args)
  }
}

defineExpose({
  /**
   * Connection status
   */
  status: readonly(status),
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
  <div ref="screen" :style="{ backgroundColor: props.background }">
    <div v-show="status !== 'connected'" class="novnc-overlay">
      <div class="novnc-overlay-message space-y-2">
        <div>{{ overlayMessage }}</div>
        <LoadingSpinner
          v-if="status === 'connecting'"
          :with-wrapper="false"
          inner-color="#0D75FD"
          outer-color="#0D75FD"
        />
        <q-btn
          v-if="status !== 'connecting'"
          color="primary"
          size="sm"
          @click="reconnect"
        >
          {{ status === 'error' ? t('vnc.retry') : t('vnc.reconnect') }}
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.novnc-overlay {
  z-index: 20;
  position: absolute;
  color: white;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
}
.novnc-overlay-message {
  max-width: 60%;
  text-align: center;
}
</style>
