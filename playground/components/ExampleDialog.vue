<script lang="ts" setup>
const props = defineProps<{
  data: string
}>()
defineEmits(useDialogPluginComponent.emits)
const data = ref(props.data)
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide, saving, onDialogBeforeHide } = withUnsavedChangesDialogGuard(useDialogPluginComponent(), {
  getState: () => data.value,
})
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @before-hide="onDialogBeforeHide"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6 flex">
          Example Dialog
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
        <div>
          This is an example dialog component. Modify the data below:
        </div>
        <div>
          <NuxtLink
            class="text-gray-4 dark:text-gray-6 text-xs"
            to="/another"
          >
            Link to Another Page
          </NuxtLink>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-h6">
          <q-input v-model="data" label="Enter some data" />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="primary"
          :disable="saving"
          no-caps
          @click="onDialogOK"
        >
          <template v-if="!saving">
            OK
          </template>
          <template v-else>
            <q-spinner />
          </template>
        </q-btn>
        <q-btn
          color="primary"
          no-caps
          :disable="saving"
          @click="onDialogCancel"
        >
          <template v-if="!saving">
            Cancel
          </template>
          <template v-else>
            <q-spinner />
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
