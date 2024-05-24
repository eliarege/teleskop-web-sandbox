<script setup lang="ts">
import { NoVnc } from 'ui'

interface MachineVncProps {
  currentMachine: {
    id: number
  }
}
const props = defineProps<MachineVncProps>()
const vnc = ref<InstanceType<typeof NoVnc> | null>(null)
const config = useRuntimeConfig()
const vncCredentials = {
  password: '123456',
}
function onDisconnect(_clean: boolean) {
  // console.log('disconnected')
}
function onConnect() {
  // console.log('connected')
}
</script>

<template>
  <div class="bg-white w-full h-full">
    <NoVnc
      ref="vnc"
      :url="`${config.public.websockifyUrl}/${props.currentMachine.id}`"
      :credentials="vncCredentials"
      drag-viewport
      resize-session
      class="z-2 absolute"
      @disconnect="onDisconnect"
      @connect="onConnect"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
