<script setup lang="ts">
defineProps({
  refreshType: {
    type: String as () => 'solving' | 'weighing',
    required: true,
  },
})
defineEmits([
  ...useDialogPluginComponent.emits,
])

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <div class="w-full m-5 bg-white">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="help"
            color="white"
          />
          {{ t(`recipe.refresh.${refreshType}._`) }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('no')"
            outline
            icon="close"
            @click="onDialogCancel"
          />
          <q-btn
            :label="t('yes')"
            outline
            icon="check"
            @click="onDialogOK"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>
