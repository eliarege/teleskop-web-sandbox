<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{
  machineId: number
  machineName: string
  machineCommand: MachineCommand
}>()

const { t } = useI18n()
const { mt } = useProjectTranslations()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const tab = ref('general')
</script>

<template>
  <div>
    <QDialog
      ref="dialogRef"
      class="select-none dialog-class"
      @hide="onDialogCancel"
    >
      <QCard>
        <QCardSection>
          <div class="text-h6 flex">
            {{ t('menu.commandInfo') }}
            <q-space />
            <q-btn
              class="text-gray-4 dark:text-gray-6"
              icon="close"
              flat
              round
              dense
              @click="onDialogCancel"
            />
          </div>
          <div class="text-h8 color-gray-6 dark:text-gray-4">
            {{ props.machineId }} - {{ props.machineName }}
          </div>
          <div class="text-h8 color-gray-6 dark:text-gray-4">
            {{ props.machineCommand.commandNo }} - {{ mt(props.machineCommand.name, props.machineId) }}
          </div>
        </QCardSection>
        <QCardSection>
          <div class="w-250 min-h-135">
            <q-card>
              <q-tabs
                v-model="tab"
                dense
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab name="general" :label="t('menu.general')" />
                <q-tab name="parameter" :label="t('menu.parameter')" />
                <q-tab name="io" :label="t('menu.io')" />
                <q-tab name="graphic" :label="t('menu.graphic')" />
                <q-tab name="formula" :label="t('menu.formula')" />
              </q-tabs>

              <q-separator />

              <QTabPanels v-model="tab">
                <QTabPanel name="general">
                  <TBCommandTabGeneral :machine-id="props.machineId" :command="props.machineCommand" />
                </QTabPanel>

                <QTabPanel name="parameter">
                  <TBCommandTabParameter :machine-id="props.machineId" :command="props.machineCommand" />
                </QTabPanel>

                <QTabPanel name="io">
                  <TBCommandTabIO :machine-id="props.machineId" :command="props.machineCommand" />
                </QTabPanel>

                <QTabPanel name="graphic">
                  <TBCommandTabGraphic :command="props.machineCommand" />
                </QTabPanel>

                <QTabPanel name="formula">
                  <TBCommandTabFormula :command="props.machineCommand" />
                </QTabPanel>
              </QTabPanels>
            </q-card>
          </div>
        </QCardSection>
        <QCardActions
          align="right"
          class="q-pa-md bg-gray-1 dark:bg-dark-4"
        >
          <QBtn
            class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
            :label="t('menu.close')"
            flat
            @click="onDialogCancel"
          />
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
</template>

<style scoped>
.q-dialog__inner--minimized > div {
  max-width: none !important;
}
</style>
