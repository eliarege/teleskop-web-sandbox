<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const editor = useEditorStore()
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
        v-for="parameter in editor.selectedCommand?.parameters"
        :key="parameter.index"
        :name="parameter.index"
        :label="`${parameter.name}`"
      />
    </q-tabs>
    <q-tab-panels v-model="parameterTab" animated>
      <q-tab-panel
        v-for="parameter in editor.selectedCommand?.parameters"
        :key="parameter.index"
        :name="parameter.index"
      >
        <table>
          <tr>
            <td>{{ t('command.parameter.name') }}</td>
            <td>{{ editor.selectedCommand?.parameters[parameter.index].name }}</td>
          </tr>
          <tr>
            <td>{{ t('command.parameter.type') }}</td>
            <td>{{ editor.selectedCommand?.parameters[parameter.index].type }}</td>
          </tr>
          <tr>
            <td>{{ t('command.parameter.defaultValue') }}</td>
            <td>{{ editor.selectedCommand?.parameters[parameter.index].defaultValue }}</td>
          </tr>
          <tr>
            <td>{{ t('command.parameter.lowerLimit') }}</td>
            <td>{{ editor.selectedCommand?.parameters[parameter.index].minValue }}</td>
          </tr>
          <tr>
            <td>{{ t('command.parameter.upperLimit') }}</td>
            <td>{{ editor.selectedCommand?.parameters[parameter.index].maxValue }}</td>
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
              <tr v-for="selection in editor.selectedCommand?.parameters[parameter.index].selections" :key="selection.name">
                <td>{{ selection.name }} ({{ selection.value }})</td>
              </tr>
            </td>
          </tr>
        </table>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<style lang="postcss" scoped>
  td, th {
    padding: 5px;
    min-width: 200px;
    vertical-align: baseline;
  }
</style>
