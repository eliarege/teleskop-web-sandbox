<script setup lang="ts">

</script>

<template>
  <!-- <RegisteredJobOrders :rows="recipeData[0]" :columns="columns"/> -->
  <!-- <button class="w-100 h-100 flex absolute right-0" @click="fetch()"/> -->
  <!-- <DagitimYonetim /> -->
  <ReceteTartim />
  <!-- <div class="buttons">
    <q-btn color="white" text-color="black" label="Ana Ekran" class="buttons" @click="visMain = true"/>
    <q-dialog v-model="visMain" class="bg-color-gray">
      <DagitimYonetim />
    </q-dialog>
  </div> -->
</template>

<style scoped lang="postcss">
.buttons {
  margin-top: 20vh;
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
