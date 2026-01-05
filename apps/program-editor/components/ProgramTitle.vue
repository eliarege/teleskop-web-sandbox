<script lang="ts" setup>
const route = useRoute()
const editor = useEditorStore()
const machine = useMachineStore()

const isMachinePage = computed(() => route.name === 'index-machine')
const isProgramPage = computed(() => route.name === 'index-program-editor')
</script>

<template>
  <div v-if="isMachinePage && machine.currentMachine.id">
    {{ machine.currentMachine.id }} -
    <TruncatedText
      :text="machine.currentMachine.name"
      :max-length="30"
    />
  </div>

  <div v-if="isProgramPage && editor.program.programNo">
    {{ editor.program.programNo }} -
    <TruncatedText
      :text="editor.program.name"
      :max-length="30"
    />
  </div>
</template>
