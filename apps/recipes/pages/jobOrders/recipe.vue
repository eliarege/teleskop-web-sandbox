<script lang="ts" setup>
const route = useRoute()
const router = useRouter()

function onHide() {
  router.push('/jobOrders')
}
</script>

<template>
  <QDialog :model-value="true" full-width @hide="onHide">
    <QCard>
      <RecipeInfo
        :batch-no="route.query.batchNo"
        :correction-no="route.query.correctionNo"
        :machine-id="route.query.machineId"
      />
    </QCard>
  </QDialog>
</template>
