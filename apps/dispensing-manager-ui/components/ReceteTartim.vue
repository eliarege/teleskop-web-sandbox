<script setup lang="ts">
import { ElScrollbar } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { navigateToPage } from '../shared/functions'

const { t } = useI18n()
async function printKey() {
  const { data: key } = await useFetch('/api/recipe/joborder?recipeJB=11428')
  console.log(key.value)
}

const { data: setting } = await useFetch('http://localhost:3000/api/settings')
const a = 0
// const { data: recipeData, pending: waitingForData } = useFetch('/api/recipe?recipeJB=11428&recipeID=3&teleskopType=normal')
const recipeData = ref()
const jobordernum = ref()
const b = ref()
const buttonProps = ref([
  { name: 'logs', label: t('recipe.logs'), link: '', icon: 'description' },
  { name: 'tartim', label: t('recipe.jobOrderMeasurement'), link: '', icon: 'content_paste_search' },
  { name: 'parameters', label: t('recipe.jobOrderParameters'), link: '', icon: 'search' },
  { name: 'tartimrefresh', label: t('recipe.jobOrderMeasurementRefresh'), link: '', icon: 'refresh' },
  { name: 'solvingrefresh', label: t('recipe.jobOrderSolvingRefresh'), link: '', icon: 'refresh' },
  { name: 'close', label: t('close'), link: '', icon: 'close' },
])

/**
 * TODO:
 * Have to have the machine that joborder is running
 * Have to have joborder of the recipe
 * Might to have colors array
 */
const recipeDataTemp = ref()
async function requestJobOrder() {
  if (jobordernum.value) {
    // const { data: recipeDataTemp, pending: waitingForData } = useFetch(`/api/recipe?recipeJB=${jobordernum.value}&recipeID=24&teleskopType=normal`)
    recipeDataTemp.value = await useFetch(`/api/recipe?recipeJB=${jobordernum.value}&recipeID=24&teleskopType=normal`)
    console.log(recipeDataTemp.value.data[0])
    if (!recipeDataTemp.value) recipeData.value = []
    else recipeData.value = recipeDataTemp.value.data[0]
  } else {
    recipeData.value = []
  }
}

function seeAllJoborders() {
  /**
   * Request for all job orders
   */
}

function changePlannedMachine() {
  /**
   * Call put method I guess to change the machine that joborder is planned
   */
}
</script>

<template>
  <!-- <button class="w-50 h-50" @click="printKey()">
  </button> -->
  <div class="flex flex-col gap-5">
    <span class="header-class">
      {{ t('distributionProcessor.a') }} - {{ t('recipe.header') }}
    </span>
    <div class="ml-5">
      {{ t('recipe.infoText') }}
      <div class="flex flex-row items-center gap-5">
        {{ t('joborderNo') }}
        <q-input v-model="jobordernum" clearable />
        <q-btn :label="t('request')" @click="requestJobOrder()" />
        "sometext" --> 11428 can be used as an example
      </div>
      <div class="flex flex-row items-center gap-5 mt-2">
        {{ t('correctionNo') }}
        <q-select
          v-model="b"
          class="w-40"
          filled
          :options="b"
        />
        <q-btn :label="t('allJobOrders')" />
      </div>
    </div>
    <span class="header-class">
      {{ t('recipe.recipeInfo') }}
    </span>
    <div class="ml-5">
      {{ t('plannedMachine') }}
      "-makine ismi-"
      <q-btn :label="`-someicon-${t('recipe.changePlannedMachine')}`" />
    </div>
    <ElScrollbar class="table-wrapper ml-5 mr-5">
      <RecipeTable
        :data="recipeData"
        :show="true"
        title="Title"
        :is-first="true"
        :settings="a"
      />
    </ElScrollbar>
      <div class="footer-buttons gap-5">
        <q-btn
        v-for="button of buttonProps"
        :key="button.name"
        class="e-border"
        outline
        color="primary"
        :label="button.label"
        :icon="button.icon"
        @click="navigateToPage(button.link)"
        />
        <!-- TODO: button operations function that decides what t2o do it can be refresh or redirect to another page  -->
      </div>
  </div>
</template>

<style scoped>

.header-class {
  background-color: gray;
  color: white;
  font-size: large;
  width: 100vw;
  padding-left: 1%;
}
.table-wrapper {
  grid-area: table;
  width: 100vw;
  max-width: 100vw;
  height: 50vh;
}

.footer-buttons {
  background-color: rgb(236, 236, 236);
  position:static;
  height: 10vh;
  width: 100vw;
  bottom: 0px;
  right: 0px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
