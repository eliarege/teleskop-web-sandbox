<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '~/composables/editor'
import type { ProgramInfoHeader } from '~/utils/types'

const props = defineProps<{
  programOneHeader: ProgramInfoHeader
  programTwoHeader: ProgramInfoHeader
}>()

const { t } = useI18n()
const editor = useEditorStore()
const router = useRouter()

function editProgram(programNumber: number) {
  router.push(`/machine/${editor.machine.id}/program/${programNumber}`)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Program Cards -->
    <div
      v-for="(program, index) in [props.programOneHeader, props.programTwoHeader]"
      :key="index"
      class="col-6"
    >
      <q-card>
        <q-card-section class="flex justify-between items-center ">
          <div>
            <div class="text-md">
              {{ t('comparisonTable.programName') }}: {{ program.programName }}
            </div>
            <div class="text-md">
              {{ t('comparisonTable.programNo') }}: {{ program.programNo }}
            </div>
            <div v-if="program.programVersion" class="text-md">
              {{ t('comparisonTable.versionNo') }}: {{ program.programVersion }}
            </div>
            <div class="text-md">
              {{ t('comparisonTable.stepCount') }}: {{ program.stepCount }}
            </div>
          </div>
          <q-btn
            v-if="program.isValid"
            color="primary"
            :label="t('comparisonTable.edit')"
            @click="editProgram(program.programNo)"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

  <style scoped lang="postcss">
.text-md {
  font-weight: bold;
}

.q-card {
  border: 2px solid #3c3a3a;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}
</style>
