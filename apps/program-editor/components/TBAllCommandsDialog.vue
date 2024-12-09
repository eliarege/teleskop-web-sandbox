<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{
  machineId: number
  machineName: string
  machineCommands: MachineCommand[]
}>()

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
  >
    <QCard>
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('menu.commandList') }}
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
      </QCardSection>
      <QCardSection>
        <div class="w-100 h-140 overflow-auto">
          <QList
            dense
          >
            <QItem
              v-for="command in machineCommands"
              :key="command.commandNo"
              v-ripple
              clickable
              @click="onDialogOK(command)"
            >
              <QItemSection>
                {{ command.commandNo }} - {{ command.name }}
              </QItemSection>
            </QItem>
          </QList>
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
</template>
