<script setup lang="ts">
import { NoVnc } from 'ui'
import type { MachineDataRaw } from '~/shared/types'

const props = defineProps({
  currentMachine: {
    type: Object as PropType<MachineDataRaw> | null,
    required: true,
  },
})
const { t } = useI18n()
const SymKey = {
  // https://github.com/D-Programming-Deimos/libX11/blob/master/c/X11/keysymdef.h
  F1: 0xFFBE, // XK_F1
  F2: 0xFFBF, // XK_F2
  F3: 0xFFC0, // XK_F3
  F4: 0xFFC1, // XK_F4
  F5: 0xFFC2, // XK_F5
  F6: 0xFFC3, // XK_F6
  F7: 0xFFC4, // XK_F7
  F8: 0xFFC5, // XK_F8
  F9: 0xFFC6, // XK_F9
  F10: 0xFFC7, // XK_F10
  F11: 0xFFC8, // XK_F11
  F12: 0xFFC9, // XK_F12
  Backspace: 0xFF08, // XK_BackSpace
  Tab: 0xFF09, // XK_Tab
  Enter: 0xFF0D, // XK_Return
  Escape: 0xFF1B, // XK_Escape
  ArrowLeft: 0xFF51, // XK_Left
  ArrowRight: 0xFF53, // XK_Right
  ArrowUp: 0xFF52, // XK_Up
  ArrowDown: 0xFF54, // XK_Down
  ArrowPgDown: 0xFF56, // XK_Page_Down
  ArrowPgUp: 0xFF55, // XK_KP_Page_Up
  Zero: 0x0030, // XK_0
  One: 0x0031, // XK_1
  Two: 0x0032, // XK_2
  Three: 0x0033, // XK_3
  Four: 0x0034, // XK_4
  Five: 0x0035, // XK_5
  Six: 0x0036, // XK_6
  Seven: 0x0037, // XK_7
  Eight: 0x0038, // XK_8
  Nine: 0x0039, // XK_9
  Dot: 0x002E, // XK_period
  Subtract: 0x002D, // XK_minus
  Plus: 0xFFAB, // XK_KP_Add
  Home: 0xFF50, // XK_Home
  Insert: 0xFF9E, // XK_KP_Insert
  End: 0xFF9C, // XK_KP_End
  Delete: 0xFF9D, // XK_KP_Begin
  Down: 0xFF99, // XK_KP_Down
  Left: 0xFF96, // XK_KP_Left
  PgDown: 0xFF9B, // XK_KP_Page_Down
} as const
const quasar = useQuasar()
const config = useRuntimeConfig()
const { token } = useKeycloak()
const vnc = ref<InstanceType<typeof NoVnc> | null>(null)
const vncCredentials = {
  password: '123456',
}

function sendKey(key: keyof typeof SymKey) {
  vnc.value!.sendKey(SymKey[key], null)
}

function onDisconnect(_clean: boolean) {
  quasar.notify({
    message: t('vnc-error', { name: props.currentMachine.name }),
    timeout: 4000,
    position: 'top',
    color: 'negative',
  })
  // setTimeout(() => {
  //   window.close()
  // }, 5000)
}
function onConnect() {
  // console.log('connected', props.currentMachine.name)
}
const location = window.location.hostname
function closeTab() {
  window.close()
}
const machine = toRef(props, 'currentMachine')
// #region Keyboard
interface FnKeys {
  class: string
  key: keyof typeof SymKey
}
interface OpKeys extends FnKeys {
  img: string
}

const fnKeys = reactive([
  { class: 'f1', key: 'F1' },
  { class: 'f2', key: 'F2' },
  { class: 'f3', key: 'F3' },
  { class: 'f4', key: 'F4' },
  { class: 'f5', key: 'F5' },
  { class: 'f6', key: 'F6' },
  { class: 'f7', key: 'F7' },
  { class: 'f8', key: 'F8' },
] as FnKeys[])
const opKeys = reactive([
  { class: 'start', key: 'F9', img: '/keyboard/start.svg' },
  { class: 'stop', key: 'F9', img: '/keyboard/stop.svg' },
] as OpKeys[])
const numpad = reactive([
  { class: 'one', key: 'One', img: '/keyboard/1.svg' },
  { class: 'two', key: 'Two', img: '/keyboard/2.svg' },
  { class: 'three', key: 'Three', img: '/keyboard/3.svg' },
  { class: 'four', key: 'Four', img: '/keyboard/4.svg' },
  { class: 'five', key: 'Five', img: '/keyboard/5.svg' },
  { class: 'six', key: 'Six', img: '/keyboard/6.svg' },
  { class: 'seven', key: 'Seven', img: '/keyboard/7.svg' },
  { class: 'eight', key: 'Eight', img: '/keyboard/8.svg' },
  { class: 'nine', key: 'Nine', img: '/keyboard/9.svg' },
  { class: 'plus', key: 'Plus', img: '/keyboard/plusminus.svg' },
  { class: 'zero', key: 'Zero', img: '/keyboard/0.svg' },
  { class: 'dot', key: 'Dot', img: '/keyboard/dot.svg' },
] as OpKeys[])
const arrowKeys = reactive([
  { class: 'arrow-down', key: 'ArrowDown', img: '/keyboard/down.svg' },
  { class: 'arrow-up', key: 'ArrowUp', img: '/keyboard/up.svg' },
  { class: 'arrow-left', key: 'ArrowLeft', img: '/keyboard/left.svg' },
  { class: 'arrow-ok', key: 'Enter', img: '/keyboard/ok.svg' },
  { class: 'arrow-right', key: 'ArrowRight', img: '/keyboard/right.svg' },
  { class: 'arrow-tab', key: 'Tab', img: '/keyboard/tab.svg' },
  { class: 'arrow-del', key: 'Backspace', img: '/keyboard/delete.svg' },
  { class: 'arrow-lock', key: 'F12', img: '/keyboard/lock.svg' },
  { class: 'arrow-esc', key: 'Escape', img: '/keyboard/esc.svg' },
  { class: 'arrow-pg-up', key: 'ArrowPgUp', img: '/keyboard/pageup.svg' },
  { class: 'arrow-pg-down', key: 'ArrowPgDown', img: '/keyboard/pagedown.svg' },
] as OpKeys[])
const bottomKeys = reactive([
  { class: 'alarms', key: 'Insert', img: '/keyboard/alarms.svg' },
  { class: 'mimic', key: 'End', img: '/keyboard/mimic.svg' },
  { class: 'disp-l', key: 'Delete', img: '/keyboard/disp.svg' },
  { class: 'cycle', key: 'Down', img: '/keyboard/cycle.svg' },
  { class: 'man-cmd', key: 'PgDown', img: '/keyboard/man_cmd.svg' },
  { class: 'man-ctrl', key: 'Left', img: '/keyboard/man_ctrl.svg' },
  { class: 'disp-r', key: 'Home', img: '/keyboard/dispR.svg' },
] as OpKeys[])
// #endregion

onMounted(async () => {
  useHead({
    title: machine.value.name,
  })
})
</script>

<template>
  <div class="w-min m-auto overflow-hidden">
    <div class="modal-wrapper cursor-default">
      <div class="modal-container">
        <div class="wrapper" @click.stop.prevent>
          <div class="machine-screen">
            <span class="cursor-pointer absolute border border-gray-300" @click="closeTab()">
              <Icon name="material-symbols:close" color="white" />
            </span>
            <div class="screen">
              <span class="loader z-1 absolute" />
              <NoVnc
                ref="vnc"
                :url="`ws://${location}:${config.public.websockifyPort || '6800'}/${props.currentMachine.id}`"
                :credentials="vncCredentials"
                :auth="config.public.kcEnabled"
                :token="token"
                drag-viewport
                resize-session
                class="z-2 absolute"
                @disconnect="onDisconnect"
                @connect="onConnect"
              />
            </div>
          </div>
          <div class="machine-keys">
            <!-- FN KEYS  -->
            <div class="fn-keys">
              <div
                v-for="(item, idx) in fnKeys"
                :key="idx"
                :class="item.class"
                @click="sendKey(item.key)"
              >
                {{ item.key }}
              </div>
            </div>
            <!-- KEYBOARD  -->
            <div class="middle-keys">
              <!-- START/STOP -->
              <div class="op-keys">
                <div
                  v-for="(item, idx) in opKeys"
                  :key="idx"
                  :class="item.class"
                  @click="sendKey(item.key)"
                >
                  <img :src="item.img">
                </div>
              </div>
              <!-- NUMPAD -->
              <div class="nums">
                <div
                  v-for="(item, idx) in numpad"
                  :key="idx"
                  :class="item.class"
                  @click="sendKey(item.key)"
                >
                  <img :src="item.img">
                </div>
              </div>
              <div class="keys">
                <!-- ARROW KEYS -->
                <div class="arrow-keys">
                  <div
                    v-for="(item, idx) in arrowKeys"
                    :key="idx"
                    :class="item.class"
                    @click="sendKey(item.key)"
                  >
                    <img :src="item.img">
                  </div>
                </div>
              </div>
            </div>
            <!-- BOTTOM KEYS  -->
            <div class="bottom-keys">
              <div
                v-for="(item, idx) in bottomKeys"
                :key="idx"
                :class="item.class"
                @click="sendKey(item.key)"
              >
                <img :src="item.img">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
* {
  @apply font-extrabold text-gray-900;
}

.modal-wrapper {
  @apply flex justify-center h-screen w-auto;

  .modal-container {
    width: 100%;
    background-color: rgb(50, 50, 50);
    @apply h-auto min-h-990px m-auto;
  }
}

.wrapper {
  grid-template-columns: auto;
  grid-auto-rows: repeat(auto-fill, minmax(800px, 1fr));
  @apply w-full h-full grid;

  .machine-screen {
    @apply w-full h-full;

    .screen {
      @apply flex justify-center items-center w-800px h-600px mx-7 my-2 border border-gray-300 border-3px rounded;
    }
  }

  .machine-keys {
    grid-template-rows: 0.1fr 1fr 0.1fr;
    @apply grid w-full h-full gap-3;

    .fn-keys {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: 1fr;
      grid-template-areas: "f1 f2 f3 f4 f5 f6 f7 f8";
      @apply w-full h-14 justify-items-center px-10 gap-5;

      .f1 {
        grid-area: f1;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f2 {
        grid-area: f2;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f3 {
        grid-area: f3;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f4 {
        grid-area: f4;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f5 {
        grid-area: f5;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f6 {
        grid-area: f6;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f7 {
        grid-area: f7;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }

      .f8 {
        grid-area: f8;
        background: #b2b7b5;
        border-radius: 15px 0 15px 0;
        color: #3f3939;
        @apply flex cursor-pointer w-full h-full text-center items-center justify-center;
      }
    }

    .middle-keys {
      grid-template-columns: 0.2fr 250px 1fr;
      grid-template-rows: 210px;
      grid-template-areas: "start-stop numpad keys";
      justify-content: center;
      align-content: center;
      justify-items: center;
      align-items: center;
      @apply grid h-full;

      .op-keys {
        grid-area: start-stop;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(2, 1fr);
        grid-template-areas:
          "START"
          "STOP";
        @apply gap-y-9 w-full flex flex-col justify-center items-center;

        .start {
          grid-area: START;
          @apply cursor-pointer w-full flex justify-center;
        }

        .stop {
          grid-area: STOP;
          @apply cursor-pointer w-full flex justify-center;
        }
      }

      .nums {
        grid-area: numpad;
        display: grid;
        grid-template-columns: repeat(3, 60px);
        grid-template-rows: repeat(4, 50px);
        gap: 0px 0px;
        grid-template-areas:
          "one two three"
          "four five six"
          "seven eight nine"
          "plus zero dot";
        justify-content: center;
        justify-items: center;
        align-items: center;
        @apply gap-x-3 gap-y-1 ml-7;

        .one,
        .two,
        .three,
        .four,
        .five,
        .six,
        .seven,
        .eight,
        .nine,
        .plus,
        .zero,
        .dot {
          @apply cursor-pointer w-full flex justify-center items-center h-full;
        }
      }

      .arrow-keys {
        display: grid;
        grid-template-columns: repeat(3, 1fr) 0.1fr 1fr;
        grid-template-rows: repeat(3, 1fr);
        gap: 0px 7px;
        grid-template-areas:
          "tab up del . pg-up"
          "left ok right . ."
          "esc down lock . pgdown";
        @apply place-items-center;

        .arrow-down {
          grid-area: down;
          @apply cursor-pointer;
        }

        .arrow-up {
          grid-area: up;
          @apply cursor-pointer;
        }

        .arrow-ok {
          grid-area: ok;
          @apply cursor-pointer;
        }

        .arrow-left {
          grid-area: left;
          @apply cursor-pointer;
        }

        .arrow-right {
          grid-area: right;
          @apply cursor-pointer;
        }

        .arrow-tab {
          grid-area: tab;
          @apply cursor-pointer;
        }

        .arrow-del {
          grid-area: del;
          @apply cursor-pointer;
        }

        .arrow-lock {
          grid-area: lock;
          @apply cursor-pointer;
        }

        .arrow-esc {
          grid-area: esc;
          @apply cursor-pointer;
        }

        .arrow-pg-up {
          grid-area: pg-up;
          @apply cursor-pointer;
        }

        .arrow-pg-down {
          grid-area: pgdown;
          /* border-radius: 10px 4px 4px 10px; */
          @apply cursor-pointer overflow-hidden;
        }
      }
    }

    .bottom-keys {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: 60px;
      grid-template-areas: "alarms mimic disp-l cycle man-cmd man-ctrl disp-r";
      justify-content: center;
      align-content: center;
      justify-items: center;
      align-items: center;
      @apply;

      .alarms {
        grid-area: alarms;
        @apply cursor-pointer w-full h-full flex justify-center;
      }

      .mimic {
        grid-area: mimic;
        @apply cursor-pointer w-full h-full flex justify-center;
      }

      .disp-l {
        grid-area: disp-l;
        @apply cursor-pointer w-full h-full flex justify-center;
      }

      .cycle {
        grid-area: cycle;
        @apply cursor-pointer w-full h-full flex justify-center;
      }

      .man-cmd {
        grid-area: man-cmd;
        @apply cursor-pointer w-full h-full flex justify-center;
      }

      .man-ctrl {
        grid-area: man-ctrl;
        @apply cursor-pointer w-full h-full flex justify-center;
      }

      .disp-r {
        grid-area: disp-r;
        @apply cursor-pointer w-full h-full flex justify-center;
      }
    }
  }
}

.loader {
  border-color: #FFFFFF #FFFFFF transparent transparent;
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
  border-color: #FFFFFF #FFFFFF transparent transparent;
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
