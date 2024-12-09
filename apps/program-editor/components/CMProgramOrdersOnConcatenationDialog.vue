<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { useDialogPluginComponent } from 'quasar'
import type { ProgramTable } from '~/shared/types'

const props = defineProps({
  programs: Array<ProgramTable[]>,
})

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const programs = ref(props.programs)

function moveItemInArray(array: [], from: number, to: number) {
  const item = array.splice(from, 1)[0]
  array.splice(to, 0, item)
}
const options = {
  animation: 150,
  ghostClass: 'bg-blue-2',
}
</script>

<template>
  <q-dialog ref="dialogRef">
    <q-card>
      <q-card-section class="w-100">
        <div class="text-h6 flex">
          {{ t('contextMenu.concatenateProgramsDialog.title') }}
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
        <div class="p-2 ">
          <span> {{ t('contextMenu.concatenateProgramsDialog.warning') }}</span>
        </div>
        <Sortable
          :list="programs"
          item-key="programNo"
          tag="div"
          :options="options"
          @end="event => moveItemInArray(programs, event.oldIndex, event.newIndex)"
        >
          <template #item="{ element }">
            <div
              class="border-1 rounded p-2 m-2 items-center cursor-grab border-gray-4 dark:border-gray-5"
            >
              {{ `${element.programNo} - ${element.name}` }}
            </div>
          </template>
        </Sortable>
      </q-card-section>

      <q-card-actions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <q-btn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          class="q-mr-sm bg-primary"
          :label="t('ok')"
          color="primary"
          @click="onDialogOK(programs)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
