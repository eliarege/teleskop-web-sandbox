<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  programs: Array<any>,
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
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.concatenateProgramsDialog.warning') }}</span>
      </q-card-section>
      <q-card-section>
        <Sortable
          :list="programs"
          item-key="programNo"
          tag="div"
          :options="options"
          @end="event => moveItemInArray(programs, event.oldIndex, event.newIndex)"
        >
          <template #item="{ element }">
            <div :key="element.programNo" class="border-2 my-2 p-2 items-center flex cursor-grab">
              {{ `${element.programNo} - ${element.name}` }}
            </div>
          </template>
        </Sortable>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          outline
          :label="t('contextMenu.concatenateProgramsDialog.concatenate')"
          icon="check"
          @click="onDialogOK(programs)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
