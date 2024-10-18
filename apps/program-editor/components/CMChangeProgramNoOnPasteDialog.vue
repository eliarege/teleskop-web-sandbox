<script setup lang="ts">
import { isDef } from '@teleskop/utils'
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  remains: Array<any>,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const newIds = ref(props.remains!.map(() => ''))
const isOKDisabled = computed(() => {
  return newIds.value.some(id => isDef(id) || id === null || id === '')
})
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"> {{ t('contextMenu.pasteDuplicateKeyWarning', { name: props.programName }) }}</span>
      </q-card-section>
      <q-card-section>
        <div
          v-for="remainder, index in props.remains"
          :key="index"
          class="flex gap-10 ml-5 items-center"
        >
          <InputNumber
            v-model="newIds[index]"
            type="positive-integer"
            :dense="true"
            class="w-20"
            hide-bottom-space
          />
          <span>
            {{ remainder.program.programNo }} - {{ remainder.program.name }}
          </span>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          data-context=""
          color="black"
          icon="close"
          @click="onDialogCancel"
        />
        <q-btn
          v-close-popup
          outline
          :disable="isOKDisabled"
          :label="t('change')"
          @click="onDialogOK(newIds)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
