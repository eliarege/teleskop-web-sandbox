<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{ command: MachineCommand }>()
const { t } = useI18n()
</script>

<template>
  <q-tab-panel name="general" class="tab-panel-class">
    <table>
      <tbody>
        <tr>
          <td>{{ t('command.commandNo') }}</td>
          <td>{{ props.command.commandNo }}</td>
        </tr>
        <tr>
          <td>{{ t('command.name') }}</td>
          <td>{{ props.command.name }}</td>
        </tr>
        <tr>
          <td>{{ t('command.type') }}</td>
          <td>{{ props.command.commandType }}</td>
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
          <td>{{ props.command.isRunManual ? t('command.yes') : t('command.no') }}</td>
        </tr>
        <tr>
          <td>{{ t('command.suggestionList') }}</td>
          <td>{{ props.command.adviceList }}</td>
        </tr>
        <tr>
          <td>{{ t('command.nonParallelCommands') }}</td>
          <td>{{ props.command.dontUseList }}</td>
        </tr>
      </tbody>
    </table>
  </q-tab-panel>
</template>
