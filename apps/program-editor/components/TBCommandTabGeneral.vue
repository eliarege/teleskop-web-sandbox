<script setup lang="ts">
const editor = useEditorStore()
const { t } = useI18n()
</script>

<template>
  <q-tab-panel name="general" class="tab-panel-class">
    <table>
      <tr>
        <td>{{ t('command.commandNo') }}</td>
        <td>{{ editor.selectedCommand?.commandNo }}</td>
      </tr>
      <tr>
        <td>{{ t('command.name') }}</td>
        <td>{{ editor.selectedCommand?.name }}</td>
      </tr>
      <tr>
        <td>{{ t('command.type') }}</td>
        <td>{{ editor.selectedCommand?.commandType }}</td>
      </tr>
      <tr>
        <td>{{ t('command.createDate') }}</td>
        <td>{{ "" }}</td>
      </tr>
      <tr>
        <td>{{ t('command.transportType') }}</td>
        <td>{{ "" }}</td>
      </tr>
      <tr>
        <td>{{ t('command.canWorkManually') }}</td>
        <td>{{ editor.selectedCommand?.isRunManual ? t('command.yes') : t('command.no') }}</td>
      </tr>
      <tr>
        <td>{{ t('command.suggestionList') }}</td>
        <td>{{ editor.selectedCommand?.adviceList }}</td>
      </tr>
      <tr>
        <td>{{ t('command.nonParallelCommands') }}</td>
        <td>{{ editor.selectedCommand?.dontUseList }}</td>
      </tr>
    </table>
  </q-tab-panel>
</template>
