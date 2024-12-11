<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{ command: MachineCommand }>()
const { t } = useI18n()
const parameterTab = ref(0)
</script>

<template>
  <q-card>
    <q-tabs
      v-model="parameterTab"
      dense
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab
        v-for="parameter in props.command.parameters"
        :key="parameter.index"
        :name="parameter.index"
        :label="`${parameter.name}`"
      />
    </q-tabs>
    <q-tab-panels v-model="parameterTab">
      <q-tab-panel
        v-for="parameter in props.command.parameters"
        :key="parameter.index"
        :name="parameter.index"
        class="tab-panel-class"
      >
        <table>
          <tbody>
            <tr>
              <td>{{ t('command.parameter.name') }}</td>
              <td>{{ props.command.parameters[parameter.index].name }}</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.type') }}</td>
              <td>{{ props.command.parameters[parameter.index].type }}</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.value') }}</td>
              <td>{{ props.command.parameters[parameter.index].value }}</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.lowerLimit') }}</td>
              <td>{{ props.command.parameters[parameter.index].minValue }}</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.upperLimit') }}</td>
              <td>{{ props.command.parameters[parameter.index].maxValue }}</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.unit') }}</td>
              <td /> <!-- TODO: Add Unit -->
            </tr>
            <tr>
              <td>{{ t('command.parameter.visibilityLevel') }}</td>
              <td>Tanımlı</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.containsFormula') }}</td>
              <td>Evet</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.temp/time') }}</td>
              <td /> <!-- TODO: Add Temp/Time -->
            </tr>
            <tr>
              <td>{{ t('command.parameter.isDefault') }}</td>
              <td>Hayır</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.belongsToFunction') }}</td>
              <td>Evet</td>
            </tr>
            <tr>
              <td>{{ t('command.parameter.selectableList') }}</td>
              <td>
                <tr v-for="selection in props.command.parameters[parameter.index].selections" :key="selection.name">
                  <td>{{ selection.name }} ({{ selection.value }})</td>
                </tr>
              </td>
            </tr>
          </tbody>
        </table>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>
