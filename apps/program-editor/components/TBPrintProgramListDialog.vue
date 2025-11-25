<script setup lang="ts">
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { enGB, tr } from 'date-fns/locale'

const props = defineProps<{
  machineName: string
}>()

const $q = useQuasar()
const { t, locale } = useI18n()

const editor = useEditorStore()
const { $commandManager } = useNuxtApp()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()
const machineOption = ref<string>('1')

const selectMachineDialog = () => $commandManager.executeCommand('selectMachine', { $q })

function getProcessTypeName(typeValue: number): string {
  return editor.allProcessTypes.find(pt => pt.value === typeValue)?.label || ''
}

function formatDate(date: string | Date): string {
  const dateLocale = locale.value === 'tr' ? tr : enGB
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: dateLocale })
}

async function printProgramList() {
  try {
    const machines = machineOption.value === '1'
      ? [editor.machine]
      : editor.selectedMachines

    const doc = new jsPDF()
    let startY = 10

    for (const machine of machines) {
      const programs = await editor.fetchAllPrograms(machine.id)

      if (!programs.length)
        continue

      // Makine bilgileri
      doc.setFontSize(14)
      doc.text(`${machine.id} - ${machine.name}`, 14, startY + 7)

      // Program tablosu
      autoTable(doc, {
        startY: startY + 12,
        head: [[
          t('printProgramListDialog.programNo'),
          t('printProgramListDialog.programName'),
          t('printProgramListDialog.duration'),
          t('printProgramListDialog.stepCount'),
          t('printProgramListDialog.type'),
          t('printProgramListDialog.updatedAt'),
        ]],
        body: programs.map(p => [
          p.programNo,
          p.name,
          formatDuration(p.duration),
          p.stepCount,
          getProcessTypeName(p.type),
          formatDate(p.updatedAt),
        ]),
        margin: { top: startY + 12 },
      })

      startY = (doc as any).lastAutoTable.finalY + 15

      // Yeni sayfa kontrolü
      if (startY > 250 && machine !== machines[machines.length - 1]) {
        doc.addPage()
        startY = 10
      }
    }

    doc.save('program_list.pdf')
    onDialogCancel()
  } catch (error) {
    $q.notify({ type: 'negative', message: t('printError') })
  }
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    persistent
  >
    <q-card class="w-120 select-none">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('printProgramListDialog.title') }}
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
      </q-card-section>

      <q-card-section>
        <div class="text-body1 q-mb-md">
          {{ t('printProgramListDialog.message') }}
        </div>

        <div class="q-mb-sm">
          <label class="text-subtitle2 text-grey-8 dark:text-grey-3 q-mb-xs block">
            {{ t('printProgramListDialog.machineOption') }}
          </label>
          <div class="q-gutter-sm">
            <q-radio
              v-model="machineOption"
              val="1"
              :label="t('printProgramListDialog.thisMachine', { machineName: props.machineName })"
              dense
            />
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <q-radio
                  v-model="machineOption"
                  val="2"
                  :label="t('printProgramListDialog.selectedMachines')"
                  dense
                />
                <q-btn
                  :label="t('printProgramListDialog.selectMachine')"
                  :disable="machineOption !== '2'"
                  color="primary"
                  size="sm"
                  outline
                  dense
                  @click="selectMachineDialog()"
                />
              </div>

              <!-- Selected machines display -->
              <div v-if="editor.selectedMachines.length > 0" class="pl-6 pt-1">
                <div class="text-xs text-grey-6 dark:text-grey-4 cursor-help">
                  <span class="font-medium">
                    {{ t('printProgramListDialog.machinesSelected', { count: editor.selectedMachines.length }) }}
                  </span>
                  <q-tooltip
                    class="bg-white text-dark shadow-4 text-body2"
                    anchor="top middle"
                    self="bottom middle"
                  >
                    <div class="q-pa-sm">
                      <div class="text-weight-medium q-mb-xs">
                        {{ t('printProgramListDialog.selectedMachinesList') }}:
                      </div>
                      <div
                        v-for="machine in editor.selectedMachines"
                        :key="machine.id"
                        class="q-mb-xs"
                      >
                        • {{ machine.name }}
                      </div>
                    </div>
                  </q-tooltip>
                </div>
              </div>
              <div v-else class="pl-6 pt-1">
                <div class="text-xs text-grey-6 dark:text-grey-4 italic">
                  {{ t('printProgramListDialog.noMachinesSelected') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('print')"
          color="primary"
          :disable="machineOption === '2' && editor.selectedMachines.length === 0"
          @click="printProgramList(machineOption)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
