<script setup lang="ts">
import { joinURL, parseHost, parseURL, stringifyParsedURL, withBase, withProtocol } from 'ufo'
import NoVnc from './NoVnc.vue'
import TbbMachinePanel from './TbbMachinePanel.vue';
import TonelloMachinePanel from './TonelloMachinePanel.vue';

const props = defineProps<{
  machineId: number
  machineName: string
  websockifyUrl: string
  tbbModel?: string
}>()
const { token, enabled } = useKeycloak()
const vnc = ref<InstanceType<typeof NoVnc> | null>(null)

function sendKey(keysym: number) {
  vnc.value!.sendKey(keysym, null)
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

function preventModifierKeys(keysym: number) {
  // Prevent modifier keys from being sent
  const modifierKeysyms = [
    0xFFE1, // Shift_L
    0xFFE2, // Shift_R
    0xFFE3, // Control_L
    0xFFE4, // Control_R
    0xFFE7, // Meta_L
    0xFFE8, // Meta_R
    0xFFE9, // Alt_L
    0xFFEA, // Alt_R
    0xFE03, // Hyper_L
    0xFE04, // Hyper_R
  ]
  return !modifierKeysyms.includes(keysym)
}

const panel = computed(() => {
  switch (props.tbbModel) {
    case 'Tonello':
      return TonelloMachinePanel
    default:
      return TbbMachinePanel
  }
})

</script>

<template>
  <component
    :is="panel"
    :tbb-model="tbbModel"
    @key="sendKey($event)"
  >
    <NoVnc
      ref="vnc"
      :url="joinURL(websockifyWsUrl, machineId.toString())"
      :auth="enabled"
      :token="token"
      scale-viewport
      class="w-full h-full z-2 absolute"
      :key-filter="preventModifierKeys"
    />
  </component>
</template>
