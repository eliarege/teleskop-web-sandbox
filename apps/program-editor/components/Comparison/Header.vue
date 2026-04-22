<script setup lang="ts">
import type { ProgramInfoHeader, ProgramStepCommandDiff } from '~/shared/types'

const props = defineProps<{
  programOneHeader: ProgramInfoHeader
  programTwoHeader: ProgramInfoHeader
  diffResults: [ProgramStepCommandDiff | null, ProgramStepCommandDiff | null][]
}>()

const { t } = useI18n()
const machine = useMachineStore()

function editProgram(programNo: number) {
  navigateTo(`/machine/${machine.currentMachine.id}/program/${programNo}`)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Program cards -->
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="(program, i) in [props.programOneHeader, props.programTwoHeader]"
        :key="i"
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-3 dark:border-dark-1 bg-gray-1 dark:bg-dark-3"
      >
        <div class="space-y-0.5 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-5 dark:text-gray-6 shrink-0">#{{ program.programNo }}</span>
            <span class="font-semibold text-sm text-gray-9 dark:text-gray-2 truncate">{{ program.programName }}</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-5 dark:text-gray-6">
            <span>{{ t('comparisonTable.stepCount') }}: {{ program.stepCount }}</span>
            <span v-if="program.programVersion">{{ t('comparisonTable.versionNo') }}: {{ program.programVersion }}</span>
          </div>
        </div>
        <QBtn
          v-if="program.isValid"
          flat
          dense
          no-caps
          size="sm"
          icon="edit"
          :label="t('comparisonTable.edit')"
          class="text-primary shrink-0"
          @click="editProgram(program.programNo)"
        />
      </div>
    </div>
  </div>
</template>
