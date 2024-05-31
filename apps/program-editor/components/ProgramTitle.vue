<script lang="ts" setup>
const editor = useEditorStore()
</script>

<template>
  <div v-if="editor.machine.id" class="space-x-3 text-sm">
    <span>{{ editor.machine.id }}</span>
    <span>-</span>
    <span>{{ editor.machine.name }}</span>
    <span v-if="editor.program.programNo" class="space-x-3 text-sm">
      <span>|</span>
      <span>{{ editor.program.programNo }}</span>
      <span>-</span>
      <span>{{ editor.program.name }}</span>
    </span>
  </div>
</template>
