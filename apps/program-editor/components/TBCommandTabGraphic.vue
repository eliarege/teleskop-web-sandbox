<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const editor = useEditorStore()
const { t } = useI18n()
const temperature = ref(editor.selectedCommand?.isTemperature)
const unload = ref(editor.selectedCommand?.isUnload)
</script>

<template>
  <table>
    <tr>
      <td>{{ t('command.graphic.x') }}</td>
      <td>{{ editor.selectedCommand?.x }}</td>
    </tr>
    <tr>
      <td>{{ t('command.graphic.y') }}</td>
      <td>{{ editor.selectedCommand?.y }}</td>
    </tr>
    <tr>
      <td>{{ t('command.graphic.a') }}</td>
      <td>{{ editor.selectedCommand?.a }}</td>
    </tr>
    <tr>
      <td>{{ t('command.graphic.maxA') }}</td>
      <td>{{ editor.selectedCommand?.maxA }}</td>
    </tr>
    <tr>
      <td>{{ t('command.graphic.b') }}</td>
      <td>{{ editor.selectedCommand?.b }}</td>
    </tr>
    <tr>
      <td>{{ t('command.graphic.isTemperature') }}</td>
      <td><q-checkbox v-model="temperature" dense /></td>
    </tr>
    <tr>
      <td>{{ t('command.graphic.isUnload') }}</td>
      <td><q-checkbox v-model="unload" dense /></td>
    </tr>
  </table>
</template>

<style lang="postcss" scoped>
  td, th {
    padding: 5px;
    min-width: 200px;
    vertical-align: baseline;
  }
</style>
