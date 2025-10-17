<script setup lang="ts">
import type { MachineCommand } from '~/shared/types'

const props = defineProps<{
  machineId: number
  machineName: string
  machineCommands: MachineCommand[]
}>()

const { t } = useI18n()
const editor = useEditorStore()
const { mt } = useProjectTranslations()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const commandIcons = computed(() =>
  Object.fromEntries(
    props.machineCommands.map(cmd => [
      cmd.commandNo,
      editor.getCommandIcon(cmd.commandNo),
    ]),
  ),
)
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
  >
    <q-card>
      <q-card-section>
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
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ props.machineId }} - {{ props.machineName }}
        </div>
      </q-card-section>

      <q-card-section>
        <div class="w-100 h-140 overflow-auto">
          <q-list
            dense
          >
            <q-item
              v-for="command in machineCommands"
              :key="command.commandNo"
              v-ripple
              clickable
              @click="onDialogOK(command)"
            >
              <q-item-section>
                <div class="flex items-center gap-2">
                  <UnoIcon
                    v-if="commandIcons[command.commandNo]"
                    :class="commandIcons[command.commandNo]?.name"
                    :style="{ color: commandIcons[command.commandNo]?.color }"
                  />
                  <div v-else class="inline-block w-4 h-4" />

                  <div class="flex items-center text-sm">
                    <span class="font-medium">{{ command.commandNo }}</span>
                    <span class="text-gray-6 dark:text-gray-4">&nbsp;/ {{ mt(command.name, props.machineId) }}</span>
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('menu.close')"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
