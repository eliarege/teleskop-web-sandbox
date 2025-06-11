<script setup lang="ts">
import { joinURL, parseHost, parseURL, stringifyParsedURL, withBase, withProtocol } from 'ufo'
import NoVnc from './NoVnc.vue'

const props = defineProps({
  dispenserId: {
    type: Number,
    required: true,
  },
  dispenserName: {
    type: String,
    required: false,
  },
  websockifyUrl: {
    type: String,
    required: true,
  },
})

const { token, enabled } = useKeycloak()

const KeyEnum = {
  'A': 65,
  'Add': 107,
  'Alt': 262144,
  'B': 66,
  'C': 67,
  'Cancel': 3,
  'Capital': 20,
  'CapsLock': 20,
  'Control': 65507,
  'ControlKey': 17,
  'D': 68,
  '0': 48,
  '1': 49,
  '2': 50,
  '3': 51,
  '4': 52,
  '5': 53,
  '6': 54,
  '7': 55,
  '8': 56,
  '9': 57,
  'Delete': 46,
  'Down': 40,
  'E': 69,
  'End': 35,
  'Enter': 13,
  'Escape': 27,
  'F': 70,
  'F1': 112,
  'F10': 121,
  'F11': 122,
  'F12': 123,
  'F13': 124,
  'F14': 125,
  'F15': 126,
  'F16': 127,
  'F17': 128,
  'F18': 129,
  'F19': 130,
  'F2': 113,
  'F20': 131,
  'F21': 132,
  'F22': 133,
  'F23': 134,
  'F24': 135,
  'F3': 114,
  'F4': 115,
  'F5': 116,
  'F6': 117,
  'F7': 118,
  'F8': 119,
  'F9': 120,
  'G': 71,
  'H': 72,
  'I': 73,
  'J': 74,
  'K': 75,
  'KeyCode': 65535,
  'L': 76,
  'LButton': 1,
  'LControlKey': 162,
  'Left': 37,
  'LShiftKey': 160,
  'LWin': 91,
  'LSuper': 65515,
  'M': 77,
  'MButton': 4,
  'Modifiers': -65536,
  'Multiply': 106,
  'N': 78,
  'None': 0,
  'O': 79,
  '~': 192,
  '!': 33,
  '#': 35,
  '$': 36,
  '%': 37,
  '^': 94,
  '&': 38,
  '*': 42,
  '(': 40,
  ')': 41,
  '_': 95,
  '+': 43,
  '{': 123,
  '}': 125,
  '|': 124,
  '"': 34,
  '?': 63,
  '<': 60,
  '>': 62,
  ':': 58,
  ';': 59,
  ',': 44,
  '/': 47,
  '.': 46,
  '=': 61,
  '-': 45,
  '`': 96,
  '\'': 39,
  '[': 91,
  ']': 93,
  '\\': 92,
  '@': 64,
  'P': 80,
  'Q': 81,
  'R': 82,
  'RButton': 2,
  'RControlKey': 163,
  'Return': 13,
  'Right': 39,
  'RShiftKey': 161,
  'RWin': 92,
  'S': 83,
  'Shift': 65536,
  'ShiftKey': 16,
  'Space': 32,
  'T': 84,
  '{bksp}': 65288,
  '{tab}': 9,
  'U': 85,
  'Up': 38,
  'V': 86,
  'W': 87,
  'X': 88,
  'Y': 89,
  'Z': 90,
  'a': 97,
  'b': 98,
  'c': 99,
  'd': 100,
  'e': 101,
  'f': 102,
  'g': 103,
  'h': 104,
  'i': 105,
  'j': 106,
  'k': 107,
  'l': 108,
  'm': 109,
  'n': 110,
  'o': 111,
  'p': 112,
  'q': 113,
  'r': 114,
  's': 115,
  't': 116,
  'u': 117,
  'v': 118,
  'w': 119,
  'x': 120,
  'y': 121,
  'z': 122,
} as Readonly<Record<string, number>>

const vnc = ref<InstanceType<typeof NoVnc> | null>(null)
const isFullScreen = ref(false)
function resolveWebSocketUrl(url: string) {
  const parsed = parseURL(url)
  const protocol = parsed.protocol || window.location.protocol
  const isSecure = protocol === 'https:'

  if (parsed.host) {
    const host = parseHost(parsed.host)
    if (host.hostname === '$host') {
      parsed.host = host.port ? `${window.location.hostname}:${host.port}` : window.location.hostname
      url = stringifyParsedURL(parsed)
    }
  }
  return withProtocol(
    withBase(url, `${window.location.protocol}//${window.location.host}`),
    isSecure ? `wss://` : `ws://`,
  )
}
const disconnected = ref(false)
const websockifyWsUrl = resolveWebSocketUrl(props.websockifyUrl)
function onDisconnect() {
  disconnected.value = true
}
function onConnect() {
  console.log('connected', props.dispenserName)
}

const fnKeys = reactive([
  { class: 'lwin', key: 'Windows' },
  { class: 'ctrl', key: 'Ctrl' },
  { class: 'file-transfer', key: 'FileTransfer' },
  { class: 'full-screen', key: 'FullScreen' },
  { class: 'ctrl-alt-del', key: 'CtrlAltDel' },
])

const ctrlActive = ref(false)
function handleFnKey(key: string) {
  switch (key) {
    case 'Windows':
      vnc.value!.sendKey(KeyEnum.LSuper, null)
      break
    case 'Ctrl':
      ctrlActive.value = !ctrlActive.value
      vnc.value!.sendKey(KeyEnum.Control, null, ctrlActive.value)
      fnKeys.find(val => val.key === 'Ctrl')!.class = ctrlActive.value ? 'ctrl-active' : 'ctrl'
      break
    case 'FileTransfer':
      break
    case 'FullScreen':
      toggleFullScreen()
      break
    case 'CtrlAltDel':
      vnc.value!.sendCtrlAltDel()
      break
  }
}
function toggleFullScreen() {
  isFullScreen.value = !isFullScreen.value
}

function onKeyPress(key: string) {
  vnc.value?.sendKey(KeyEnum[key], null)
}
onBeforeUnmount(() => {
  vnc.value?.disconnect()
})
</script>

<template>
  <div class="w-min m-auto overflow-hidden">
    <div class="modal-wrapper cursor-default">
      <div class="modal-container">
        <div class="wrapper" @click.stop.prevent>
          <div class="machine-screen">
            <div class="screen">
              <span class="z-1 absolute" :class="disconnected ? '' : 'loader'" />
              <NoVnc
                ref="vnc"
                :url="joinURL(websockifyWsUrl, 'dispenser', `${dispenserId}`)"
                :auth="enabled"
                :token="token"
                resize-session
                clip-viewport
                drag-viewport
                class="z-2 absolute h-125 w-200 p-1"
                @disconnect="onDisconnect"
                @connect="onConnect"
              />
            </div>
          </div>
          <div class="machine-keys">
            <div class="fn-keys z-2">
              <div
                v-for="(item, idx) in fnKeys"
                :key="idx"
                :class="item.class"
                @click="handleFnKey(item.key)"
              >
                {{ item.key }}
              </div>
            </div>
          </div>
          <div class="flex justify-center mb-1 z-10">
            <VirtualKeyboard
              @key-press="onKeyPress"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.modal-wrapper {
  @apply justify-center w-auto;

  * {
    @apply font-extrabold text-gray-900;
  }

  .modal-container {
    width: 100%;
    background-color: rgb(50, 50, 50);
    @apply m-1;
  }
}

.wrapper {
  grid-template-columns: auto;
  grid-auto-rows: repeat(auto-fill, minmax(800px, 1fr));
  @apply w-full grid;

  .machine-screen {
    @apply w-full h-full;

    .screen {
      @apply flex justify-center items-center w-800px h-540px mx-7 my-2 border border-gray-300 border-3px rounded;
    }
  }

  .machine-keys {
    grid-template-rows: 0.1fr 0.01fr 0.1fr;
    @apply grid w-full h-full gap-3;

    .fn-keys {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: 1fr;
      grid-template-areas: 'ctrl ctrl-alt-del lwin file-transfer full-screen';
      @apply w-full h-14 justify-items-center px-10 gap-5;

      .lwin {
        grid-area: lwin;
        background: #b2b7b5;
        border-radius: 15px;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .ctrl {
        grid-area: ctrl;
        background: #b2b7b5;
        border-radius: 15px;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }
      .ctrl-active {
        grid-area: ctrl;
        background: #b2b7b5;
        border-radius: 15px;
        opacity: 0.5;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }
      .file-transfer {
        grid-area: file-transfer;
        background: #b2b7b5;
        border-radius: 15px;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .ctrl-alt-del {
        grid-area: ctrl-alt-del;
        background: #b2b7b5;
        border-radius: 15px;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .full-screen {
        grid-area: full-screen;
        background: #b2b7b5;
        border-radius: 15px;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }
    }
  }
}

.loader {
  border-color: #ffffff #ffffff transparent transparent;
  animation: rotation 1s linear infinite;
  @apply w-48px h-48px rounded-1/2 inline-block relative border-3px box-border;
}

.loader::after,
.loader::before {
  border-color: transparent transparent #0d94fc #0d94fc;
  animation: rotationBack 0.5s linear infinite;
  transform-origin: center center;
  @apply absolute left-0 right-0 top-0 bottom-0 m-auto border-3px box-border w-40px h-40px rounded-1/2 content-open-quote;
}

.loader::before {
  border-color: #ffffff #ffffff transparent transparent;
  animation: rotation 1.5s linear infinite;
  @apply w-32px h-32px;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes rotationBack {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(-360deg);
  }
}
</style>
