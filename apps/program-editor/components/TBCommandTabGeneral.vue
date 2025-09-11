<script setup lang="ts">
import { MoveParallel } from '~/shared/constants'
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{
  machineId: number
  command: MachineCommand
}>()

const { t } = useI18n()
const { mt } = useProjectTranslations()
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
          <td>{{ mt(props.command.name, props.machineId) }}</td>
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
          <td>{{ t('command.transportType._') }}</td>
          <td>{{ t(`command.transportType.${MoveParallel[props.command.moveParallel]}`) }}</td>
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
