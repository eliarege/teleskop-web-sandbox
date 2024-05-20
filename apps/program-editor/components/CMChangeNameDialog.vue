<script setup lang="ts">
const props = defineProps({
  name: String,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const programName = ref(props.name)

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <div class="w-full m-5 bg-white">
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm"> {{ t('changeNameDialog._') }}</span>
        </q-card-section>
        <q-card-section>
          <div class="flex  gap-5 items-center justify-center">
            <span> {{ t('changeNameDialog.enterNewName') }}</span>
            <q-input v-model="programName" dense />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            :label="t('cancel')"
            outline
            color="black"
            icon="close"
            @click="onDialogCancel"
          />
          <q-btn
            outline
            :label="t('change')"
            @click="onDialogOK(programName)"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>
