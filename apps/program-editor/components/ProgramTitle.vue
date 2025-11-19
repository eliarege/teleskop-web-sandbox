<script lang="ts" setup>
const editor = useEditorStore()
const route = useRoute()

const isMachinePage = computed(() => route.name === 'index-machine')
const isProgramPage = computed(() => route.name === 'index-program-editor')
</script>

<template>
  <div v-if="isMachinePage && editor.machine.id">
    {{ editor.machine.id }} -
    <TruncatedText
      :text="editor.machine.name"
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
