<script setup lang="ts">
import { joinURL, parseHost, parseURL, stringifyParsedURL, withBase, withProtocol } from 'ufo'
import MachineVncButton from './MachineVncButton.vue'
import NoVnc from './NoVnc.vue'

const props = defineProps<{
  machineId: number
  machineName: string
  websockifyUrl: string
}>()
const { width } = useWindowSize()
const { token, enabled } = useKeycloak()
const vnc = ref<InstanceType<typeof NoVnc> | null>(null)

const maxFactor = 2.5
const deviceWidth = 278
const devicePadding = 8
const factor = computed(() => Math.min(maxFactor, width.value / (deviceWidth + devicePadding)))

const keysym = {
  XK_F1: 0xFFBE,
  XK_F2: 0xFFBF,
  XK_F3: 0xFFC0,
  XK_F4: 0xFFC1,
  XK_F5: 0xFFC2,
  XK_F6: 0xFFC3,
  XK_F7: 0xFFC4,
  XK_F8: 0xFFC5,
  XK_F9: 0xFFC6,
  XK_F10: 0xFFC7,
  XK_F11: 0xFFC8,
  XK_F12: 0xFFC9,
  XK_BackSpace: 0xFF08,
  XK_Tab: 0xFF09,
  XK_Return: 0xFF0D,
  XK_Escape: 0xFF1B,
  XK_Left: 0xFF51,
  XK_Right: 0xFF53,
  XK_Up: 0xFF52,
  XK_Down: 0xFF54,
  XK_Page_Down: 0xFF56,
  XK_KP_Page_Up: 0xFF55,
  XK_0: 0x0030,
  XK_1: 0x0031,
  XK_2: 0x0032,
  XK_3: 0x0033,
  XK_4: 0x0034,
  XK_5: 0x0035,
  XK_6: 0x0036,
  XK_7: 0x0037,
  XK_8: 0x0038,
  XK_9: 0x0039,
  XK_Period: 0x002E,
  XK_Minus: 0x002D,
  XK_KP_Add: 0xFFAB,
  XK_Home: 0xFF50,
  XK_KP_Insert: 0xFF9E,
  XK_KP_End: 0xFF9C,
  XK_KP_Begin: 0xFF9D,
  XK_KP_Down: 0xFF99,
  XK_KP_Left: 0xFF96,
  XK_KP_Page_Down: 0xFF9B,
} as const

function sendKey(key: keyof typeof keysym) {
  vnc.value!.sendKey(keysym[key], null)
}

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

const websockifyWsUrl = resolveWebSocketUrl(props.websockifyUrl)
</script>

<template>
  <div class="t7-container" :style="{ '--factor': factor }">
    <div class="t7-inner-container">
      <div class="t7-header">
        <div class="t7-eliar-logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 760.9 213.3"
            version="1.1"
          >
            <g>
              <g>
                <g>
                  <g>
                    <path d="m39.8,186.6c18.4,15.9 42.5,25.5 68.7,25.5c46.7,0 86.2,-30.2 100.2,-72.2l-149.1,0l-19.8,46.7z" />
                    <path d="m120.4,1.8l-54.6,127.4l145.7,0c1.6,-7.3 2.5,-14.8 2.5,-22.5c0.1,-54.3 -40.9,-98.9 -93.6,-104.9z" />
                    <path d="m108.5,1.1c-58.2,0 -105.5,47.2 -105.5,105.5c0,28.3 11.3,54.1 29.4,73l76.5,-178.6c-0.1,0.1 -0.2,0.1 -0.4,0.1z" />
                  </g>
                  <path d="m734.1,118.6c14.6,-4.2 22,-14.3 22,-29.8c0,-9.7 -3.2,-17.4 -9.5,-23.2c-6.3,-5.8 -14.8,-8.6 -25.2,-8.6l-78,0l0,98l22.5,0l0,-34.5l43.4,0l24.6,34.5l26.2,0l-26,-36.4zm-15.4,-18.8l-52.8,0l0,-22.2l51.7,0c14,0 15.7,6.5 15.7,11.5c-0.1,4.6 -1.7,10.7 -14.6,10.7z" />
                  <path d="m281.7,114.4l55.1,0l0,-20.7l-55.1,0l0,-16.1l79.3,0l0,-20.6l-101.8,0l0,76c0.5,11.7 9.7,21 21.2,22l84,0l0,-20.6l-82.7,0l0,-20z" />
                  <path d="m572.9,56.9c-9.3,0.2 -13.9,3.2 -18.8,10.9l-47.5,87.2l24.9,0l10.8,-20.2l60.6,0l10.8,20.2l24.9,0l-53.4,-98.1l-12.3,0zm-19.2,57.3l19,-35.1l18.9,35.1l-37.9,0z" />
                  <g>
                    <rect
                      height="18.2"
                      width="22.5"
                      y="56.9"
                      x="479.3"
                    />
                    <rect
                      height="70.7"
                      width="22.5"
                      y="84.3"
                      x="479.3"
                    />
                  </g>
                  <path d="m398.9,56.9l-22.5,0l0,77.9c1.5,11.4 11.3,20.2 23,20.2l0,0l72,0l0,-20.6l-72.5,0l0,-77.5l0,0z" />
                </g>
              </g>
            </g>
          </svg>
        </div>
        <div id="status" />
        <div style="width: 100%">
          <!-- Put logo -->
        </div>
      </div>
      <div class="t7-screen-casing">
        <div class="t7-screen">
          <NoVnc
            ref="vnc"
            :url="joinURL(websockifyWsUrl, machineId.toString())"
            :auth="enabled"
            :token="token"
            scale-viewport
            class="w-full h-full z-2 absolute"
          />
        </div>
      </div>
      <div class="t7-keyboard">
        <div class="t7-function-row">
          <MachineVncButton
            img="../assets/keyboard/f1.svg"
            @click="sendKey('XK_F1')"
          />
          <MachineVncButton
            img="../assets/keyboard/f2.svg"
            @click="sendKey('XK_F2')"
          />
          <MachineVncButton
            img="../assets/keyboard/f3.svg"
            @click="sendKey('XK_F3')"
          />
          <MachineVncButton
            img="../assets/keyboard/f4.svg"
            @click="sendKey('XK_F4')"
          />
          <MachineVncButton
            img="../assets/keyboard/f5.svg"
            @click="sendKey('XK_F5')"
          />
          <MachineVncButton
            img="../assets/keyboard/f6.svg"
            @click="sendKey('XK_F6')"
          />
          <MachineVncButton
            img="../assets/keyboard/f7.svg"
            @click="sendKey('XK_F7')"
          />
          <MachineVncButton
            img="../assets/keyboard/f8.svg"
            @click="sendKey('XK_F8')"
          />
        </div>
        <div class="t7-panel-row">
          <div class="t7-panel-grid t7-startstop-grid">
            <div class="t7-keyinput-container">
              <MachineVncButton
                img="../assets/keyboard/start.svg"
                @click="sendKey('XK_F9')"
              />
              <MachineVncButton
                img="../assets/keyboard/stop.svg"
                @click="sendKey('XK_F10')"
              />
            </div>
          </div>
          <div class="t7-panel-grid t7-numpad-grid">
            <div class="t7-keyinput-container">
              <MachineVncButton
                img="../assets/keyboard/1.svg"
                @click="sendKey('XK_1')"
              />
              <MachineVncButton
                img="../assets/keyboard/2.svg"
                @click="sendKey('XK_2')"
              />
              <MachineVncButton
                img="../assets/keyboard/3.svg"
                @click="sendKey('XK_3')"
              />
              <MachineVncButton
                img="../assets/keyboard/4.svg"
                @click="sendKey('XK_4')"
              />
              <MachineVncButton
                img="../assets/keyboard/5.svg"
                @click="sendKey('XK_5')"
              />
              <MachineVncButton
                img="../assets/keyboard/6.svg"
                @click="sendKey('XK_6')"
              />
              <MachineVncButton
                img="../assets/keyboard/7.svg"
                @click="sendKey('XK_7')"
              />
              <MachineVncButton
                img="../assets/keyboard/8.svg"
                @click="sendKey('XK_8')"
              />
              <MachineVncButton
                img="../assets/keyboard/9.svg"
                @click="sendKey('XK_9')"
              />
              <MachineVncButton
                img="../assets/keyboard/plusminus.svg"
                @click="sendKey('XK_KP_Add')"
              />
              <MachineVncButton
                img="../assets/keyboard/0.svg"
                @click="sendKey('XK_0')"
              />
              <MachineVncButton
                img="../assets/keyboard/dot.svg"
                @click="sendKey('XK_Period')"
              />
            </div>
          </div>
          <div class="t7-panel-grid t7-arrowpad-grid">
            <div class="t7-keyinput-container">
              <MachineVncButton
                img="../assets/keyboard/tab.svg"
                @click="sendKey('XK_Tab')"
              />
              <MachineVncButton
                img="../assets/keyboard/up.svg"
                @click="sendKey('XK_Up')"
              />
              <MachineVncButton
                img="../assets/keyboard/delete.svg"
                @click="sendKey('XK_BackSpace')"
              />
              <MachineVncButton
                img="../assets/keyboard/left.svg"
                @click="sendKey('XK_Left')"
              />
              <MachineVncButton
                img="../assets/keyboard/ok.svg"
                @click="sendKey('XK_Return')"
              />
              <MachineVncButton
                img="../assets/keyboard/right.svg"
                @click="sendKey('XK_Right')"
              />
              <MachineVncButton
                img="../assets/keyboard/esc.svg"
                @click="sendKey('XK_Escape')"
              />
              <MachineVncButton
                img="../assets/keyboard/down.svg"
                @click="sendKey('XK_Down')"
              />
              <MachineVncButton
                img="../assets/keyboard/lock.svg"
                @click="sendKey('XK_F12')"
              />
            </div>
          </div>
          <div class="t7-panel-grid t7-updown-grid">
            <div class="t7-keyinput-container">
              <MachineVncButton
                img="../assets/keyboard/pagedown.svg"
                @click="sendKey('XK_Page_Down')"
              />
              <MachineVncButton
                img="../assets/keyboard/pageup.svg"
                @click="sendKey('XK_KP_Page_Up')"
              />
            </div>
          </div>
        </div>
        <div class="t7-shortcut-row">
          <MachineVncButton
            img="../assets/keyboard/alarms.svg"
            @click="sendKey('XK_KP_Insert')"
          />
          <MachineVncButton
            img="../assets/keyboard/mimic.svg"
            @click="sendKey('XK_KP_End')"
          />
          <MachineVncButton
            img="../assets/keyboard/disp.svg"
            @click="sendKey('XK_KP_Begin')"
          />
          <MachineVncButton
            img="../assets/keyboard/cycle.svg"
            @click="sendKey('XK_KP_Down')"
          />
          <MachineVncButton
            img="../assets/keyboard/man_cmd.svg"
            @click="sendKey('XK_KP_Page_Down')"
          />
          <MachineVncButton
            img="../assets/keyboard/man_ctrl.svg"
            @click="sendKey('XK_KP_Left')"
          />
          <MachineVncButton
            img="../assets/keyboard/dispR.svg"
            @click="sendKey('XK_Home')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.t7-container {
  --factor: 1.2;
  left: 0;
  top: 0;
  display: inline-block;
  width: calc(278px * var(--factor));
  min-width: calc(278px * var(--factor));
  height: calc(354px * var(--factor));
  padding: calc(0.5rem * var(--factor));
  border-radius: calc(3px * var(--factor));
  background-color: #adb5bd;
  position: relative;
  box-shadow:
    rgba(0, 0, 0, 0.19) 0px 10px 20px,
    rgba(0, 0, 0, 0.23) 0px 6px 6px;
}

.t7-inner-container {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding: calc(0.5rem * var(--factor));
  padding-top: 0;
  padding-bottom: calc(0.1rem * var(--factor));
  position: relative;
  display: grid;
  border-radius: calc(3px * var(--factor));
  background-color: hsl(0, 5%, 24%);
  grid-template-rows: calc(1rem * var(--factor)) 16.7fr 14.2fr;
}

.t7-screen-casing {
  width: 100%;
  height: 100%;
  border-radius: calc(2px * var(--factor));
  padding: calc(2px * var(--factor));
  position: relative;
  background-color: #adb5bd;
}

.t7-screen {
  width: 100%;
  aspect-ratio: 4/3;
  position: relative;
  background-color: black;
}

.t7-keyboard {
  width: 100%;
  height: 100%;
  padding: calc(0.4rem * var(--factor));

  display: grid;
  grid-template-rows: 18fr 66fr 15fr;
  grid-row-gap: 1%;
}

.t7-function-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-column-gap: 1%;
}

.t7-panel-row {
  position: relative;
  display: grid;
  grid-template-columns: 3fr 10fr 10fr 3fr;
}

.t7-panel-grid {
  width: 100%;
  height: 100%;
}

.t7-keyinput-container {
  display: grid;
  position: relative;
  height: 80%;
  top: 10%;
}

.t7-startstop-grid .t7-keyinput-container {
  grid-template-rows: 1fr 1fr;
  grid-row-gap: 18%;
  width: 90%;
  left: 0%;
}

.t7-numpad-grid .t7-keyinput-container {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  grid-gap: 5% 8%;
  width: 60%;
  left: 20%;
}

.t7-arrowpad-grid .t7-keyinput-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-gap: 4%;
  width: 70%;
  left: 15%;
}

.t7-updown-grid .t7-keyinput-container {
  grid-template-rows: 1fr 1fr;
  grid-row-gap: 25%;
  width: 70%;
  left: 30%;
}

.t7-shortcut-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-column-gap: 2.5%;
}

.t7-header {
  display: flex;
}

.t7-eliar-logo {
  width: 100%;
  text-align: left;
}

.t7-eliar-logo svg {
  height: 100%;
  padding: calc(4px * var(--factor));
  fill: white;
}
</style>
