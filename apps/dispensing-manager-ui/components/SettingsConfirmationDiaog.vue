<script setup lang="ts">
const props = defineProps({
  visible: Boolean,
})
const { t } = useI18n()
const confirm = ref(!!props.visible)
</script>

<template>
  <div class="q-pa-md q-gutter-sm">
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="delete"
            color="white"
            text-color="delete"
          />
          <span class="q-ml-sm"> {{ t('warnings.deleteRow') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('settings.cancel')"
            outline
            color="black"
            icon="close"
          />
          <q-btn
            v-close-popup
            outline
            :label="t('settings.delete')"
            color="red"
            icon="delete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style>
</style>
