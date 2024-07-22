<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const editor = useEditorStore()
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-row gap-5 p-5">
    <div class="space-y-2">
      <div>{{ t('command.commandNo') }}: </div>
      <div>{{ t('command.name') }}: </div>
      <div>{{ t('command.type') }}: </div>
      <div>{{ t('command.createDate') }}: </div>
      <div>{{ t('command.transportType') }}: </div>
      <div>{{ t('command.canWorkManually') }}: </div>
      <div>{{ t('command.suggestionList') }}: </div>
      <div> {{ t('command.nonParallelCommands') }}:</div>
    </div>
    <div class="space-y-2">
      <div> {{ editor.selectedCommand?.commandNo }}</div>
      <div> {{ editor.selectedCommand?.name }}</div>
      <div> {{ editor.selectedCommand?.commandType }} </div>
      <div> - </div> <!-- TODO: Create Date -->
      <div> - </div> <!-- TODO: Transport Type -->
      <div> {{ editor.selectedCommand?.isRunManual ? t('command.yes') : t('command.no') }} </div>
      <div> {{ editor.selectedCommand?.adviceList }} </div>
      <div> {{ editor.selectedCommand?.dontUseList }} </div>
    </div>
    <QSpace />
    <div class="space-y-2">
      <div> {{ t('command.icon') }}:</div>
    </div>
    <QSpace />
  </div>
</template>
