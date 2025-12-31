<script setup lang="ts">
import ExampleDialog from '~/components/ExampleDialog.vue'
import ExamplePageComponent from '~/components/ExamplePageComponent.vue'

const $q = useQuasar()
const result = ref<string | null>(null)

function onBtnClick() {
  $q.dialog({
    component: ExampleDialog,
    componentProps: {
      data: result.value ?? `42`,
    },
  })
    .onOk((data: string) => {
      result.value = data
      console.log('Dialog OK with data:', data)
    })
}
</script>

<template>
  <div>
    <q-btn
      label="Open Example Dialog"
      color="primary"
      class="m-4"
      @click="onBtnClick"
    />
    <div v-if="result !== null" class="q-mt-md">
      Result from dialog: {{ result }}
    </div>
    <ExamplePageComponent />
  </div>
</template>
