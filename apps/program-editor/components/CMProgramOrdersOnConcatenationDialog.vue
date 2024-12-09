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
const { dark } = useQuasar()
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
              :class="dark.isActive ? 'border-white' : 'border-black'"
              class="border-1 rounded p-2 m-2 items-center cursor-grab"
            >
              {{ `${element.programNo} - ${element.name}` }}
            </div>
          </template>
        </Sortable>
      </q-card-section>

      <q-card-actions
        class="q-pa-md"
        align="right"
        :class="dark.isActive ? 'bg-dark-3' : 'bg-gray-1'"
      >
        <q-btn
          v-close-popup
          :label="t('cancel')"
          flat
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('ok')"
          color="primary"
          @click="onDialogOK(programs)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
