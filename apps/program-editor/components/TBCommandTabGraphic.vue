<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{ command: MachineCommand }>()
const { t } = useI18n()
const temperature = ref(props.command.isTemperature)
const unload = ref(props.command.isUnload)
</script>

<template>
  <q-tab-panel
    class="tab-panel-class"
    name="name"
  >
    <table>
      <tbody>
        <tr>
          <td>{{ t('command.graphic.x') }}</td>
          <td>{{ props.command.x }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.y') }}</td>
          <td>{{ props.command.y }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.a') }}</td>
          <td>{{ props.command.a }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.maxA') }}</td>
          <td>{{ props.command.maxA }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.b') }}</td>
          <td>{{ props.command.b }}</td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.isTemperature') }}</td>
          <td>
            <q-checkbox
              v-model="temperature"
              disable
              dense
            />
          </td>
        </tr>
        <tr>
          <td>{{ t('command.graphic.isUnload') }}</td>
          <td>
            <q-checkbox
              v-model="unload"
              disable
              dense
            />
          </td>
        </tr>
      </tbody>
    </table>
  </q-tab-panel>
</template>
