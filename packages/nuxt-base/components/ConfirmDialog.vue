<script setup lang="ts">
import type { QBtnProps, QCard, QDialogProps } from 'quasar'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'

type ButtonAction = {
  label: string
  value: string
  props?: QBtnProps
}

const props = defineProps<{
  title?: string
  message?: string
  okActions?: ButtonAction[]
  cancelLabel?: string
  noTransition?: boolean
  dialogProps?: QDialogProps
  noCloseButton?: boolean
}>()
defineEmits(useDialogPluginComponent.emits)
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const card = useTemplateRef<InstanceType<typeof QCard>>('card')

const { activate } = useFocusTrap(card)

watch(card, async () => {
  await nextTick()
  activate()
})

const title = computed(() => props.title || t('base.confirm'))
const message = computed(() => props.message || t('base.confirmMessage'))
const cancelLabel = computed(() => props.cancelLabel || t('base.cancel'))
const okActions = computed(() => props.okActions || [{ label: t('base.confirm'), value: 'confirm' }])
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    v-bind="props.dialogProps"
    @hide="onDialogHide"
  >
    <q-card ref="card" class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6 flex">
          {{ title }}
          <q-space />
          <q-btn
            v-if="!props.noCloseButton"
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
        {{ message }}
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn
          no-caps
          class="bg-gray-200"
          unelevated
          text-color="black"
          :label="cancelLabel"
          @click="onDialogCancel"
        />
        <q-btn
          v-for="action in okActions"
          :key="action.value"
          color="primary"
          no-caps
          v-bind="action.props"
          :label="action.label"
          @click="onDialogOK(action.value)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
