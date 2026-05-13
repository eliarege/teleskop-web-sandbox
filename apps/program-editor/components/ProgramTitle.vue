<script lang="ts" setup>
const route = useRoute()
const editor = useEditorStore()
const machine = useMachineStore()

const isMachinePage = computed(() => route.name === 'index-machine')
const isProgramPage = computed(() => route.name === 'index-program-editor')
const isDirty = computed(() => editor.hasProgramChanged())
</script>

<template>
  <div v-if="isMachinePage && machine.currentMachine.id" class="flex items-center gap-1">
    <span>{{ machine.currentMachine.id }} -</span>
    <TruncatedText
      :text="machine.currentMachine.name"
      :max-length="30"
    />
  </div>

  <div v-if="isProgramPage && editor.program.programNo" class="flex items-center gap-1">
    <span>{{ editor.program.programNo }} -</span>
    <TruncatedText
      :text="editor.program.name"
      :max-length="30"
    />
    <span v-if="isDirty" class="text-orange-5 text-lg">*</span>
  </div>
</template>
