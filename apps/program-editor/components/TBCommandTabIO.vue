<script setup lang="ts">
import { IO_TYPE } from '~/shared/constants'
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{ command: MachineCommand }>()
const ioTab = ref(0)
const { t } = useI18n()
</script>

<template>
  <q-card>
    <q-tabs
      v-model="ioTab"
      dense
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab
        v-for="io in props.command.ioList"
        :key="io.index"
        :name="io.index"
        :label="io.name"
      />
    </q-tabs>
    <q-tab-panels v-model="ioTab" animated>
      <q-tab-panel
        v-for="io in props.command.ioList"
        :key="io.index"
        :name="io.index"
        class="tab-panel-class"
      >
        <table>
          <tbody>
            <tr>
              <td>{{ t('command.io.name') }}</td>
              <td>{{ io.name }}</td>
            </tr>
            <tr>
              <td>{{ t('command.io.index') }}</td>
              <td>{{ io.index }}</td>
            </tr>
            <tr>
              <td>{{ t('command.io.physicalId') }}</td>
              <td>{{ io.physicalId }}</td>
            </tr>
            <tr>
              <td>{{ t('command.io.type') }}</td>
              <td>{{ IO_TYPE[io.type] }}</td>
            </tr>
            <tr>
              <td>{{ t('command.io.selections') }}</td>
              <td v-if="io.selectable">
                <tr v-for="selection in io.selections" :key="selection.index">
                  <td>
                    {{ selection.physicalId }} - {{ selection.name }}
                  </td>
                </tr>
              </td>
            </tr>
          </tbody>
        </table>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>
