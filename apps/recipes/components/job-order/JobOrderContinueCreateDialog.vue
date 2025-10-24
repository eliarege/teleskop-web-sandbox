<script lang="ts" setup>
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { ContinueJobOrderParams, Machine, RecipeMaster, RecipeProgramMaster, RecipeProgramMasterStep } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'

const q = useQuasar()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
const { t } = useI18n()

const selectedRecipeSteps = ref<RecipeProgramMasterStep[]>([])
const recipeHeader = ref<RecipeProgramMaster>()
const jobOrderParams = ref<ContinueJobOrderParams>({
  jobNo: 0,
  fabricSize: 0,
  fabricWeight: 0,
  flotte: 0,
  volume: 0,
  foulard: 0,
  grammage: 0,
  colorCode: '#ffffff',
  startDate: new Date().toLocaleDateString(),
})
const duplicateJobId = ref(false)
const dataStore = useDataStore()
const machine = ref<number>()

const columns = [
  { name: 'stepNo', label: t('StepNo'), align: 'left', field: 'mainStep' },
  { name: 'materialCode', label: t('materialFields.Code'), align: 'left', field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), align: 'left', field: 'materialName' },
  { name: 'amount', label: t('Amount'), align: 'left', field: 'amount' },
  { name: 'unit', label: t('Unit'), align: 'left', field: 'unit' },
  { name: 'dispenser', label: t('Dispenser'), align: 'left', field: 'dispenser' },
]
const recipes = ref<RecipeMaster[]>([])
const machines = ref<Machine[]>([])

getRecipes()
getMachines()

async function getRecipes() {
  recipes.value = await $fetch('/api/recipes/master/continue')
}
async function getMachines() {
  machines.value = await $fetch('/api/machines')
}

function assignDispensers() {
  selectedRecipeSteps.value.forEach(step => step.dispenserId = dataStore.dispensers![0].dispenserId)
}
async function getRecipeSteps() {
  selectedRecipeSteps.value = await $fetch(`/api/recipes/master/continue/steps/${recipeHeader.value?.recipeId}`)
  assignDispensers()
}

function updateRecipe(val: RecipeProgramMaster | undefined) {
  recipeHeader.value = val
  jobOrderParams.value = {
    jobNo: 0,
    fabricSize: 0,
    fabricWeight: 0,
    flotte: 0,
    volume: 0,
    foulard: 0,
    grammage: 0,
    colorCode: '#ffffff',
    startDate: new Date().toLocaleDateString(),
  }
  getRecipeSteps()
}
async function onStart() {
  const res = await $fetch(`/api/job-orders/create/continue`, { method: 'POST', body: { machineId: machine.value, recipeType: recipeHeader.value?.recipeType, params: jobOrderParams.value, recipe: selectedRecipeSteps.value } })
  if (res.error) {
    duplicateJobId.value = true
  } else {
    dataStore.newJobOrders = true
    onDialogOK()
  }
}
async function onCancel() {
  if (selectedRecipeSteps.value) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.JobOrderCancel'),
        confirmBtn: {
          label: t('Confirm'),
          color: 'positive',
          icon: 'done',
        },
        cancelBtn: {
          label: t('Cancel'),
          icon: 'close',
        },
      },
    }).onOk(() => {
      onDialogCancel()
    })
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    full-height
    @hide="onDialogHide"
  >
    <QCard>
      <div class="text-center pt-5 text-xl">
        <h2>{{ t('NewContinueJobOrder') }}</h2>
      </div>
      <div mx-20>
        <QSelect
          v-model="recipeHeader"
          borderless
          dense
          filled
          emit-value
          map-options
          options-dense
          option-label="recipeName"
          :options="recipes"
          @update:model-value="updateRecipe"
        />
      </div>
      <div v-if="recipeHeader" class="flex flex-row flex-wrap justify-center mt-10">
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.ID') }}
          </span>
          <QInput
            v-model="jobOrderParams.jobNo"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
            :error-message="t('AlreadyExists')"
            :error="duplicateJobId"
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.FabricSize') }}
          </span>
          <QInput
            v-model="jobOrderParams.fabricSize"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.FabricWeight') }}
          </span>
          <QInput
            v-model="jobOrderParams.fabricWeight"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.Flotte') }}
          </span>
          <QInput
            v-model="jobOrderParams.flotte"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.Grammage') }}
          </span>
          <QInput
            v-model="jobOrderParams.grammage"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.Volume') }}
          </span>
          <QInput
            v-model="jobOrderParams.volume"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.Foulard') }}
          </span>
          <QInput
            v-model="jobOrderParams.foulard"
            class="item-input"
            dense
            type="number"
            min="0"
            filled
          />
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.ColorCode') }}
          </span>
          <QInput
            v-model="jobOrderParams.colorCode"
            filled
            dense
            readonly
            :rules="['anyColor']"
            class="item-input"
            hide-bottom-space
          >
            <template #append>
              <QIcon
                name="colorize"
                class="cursor-pointer"
                :style="`color: ${jobOrderParams.colorCode}`"
              >
                <QPopupProxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <QColor v-model="jobOrderParams.colorCode" />
                </QPopupProxy>
              </QIcon>
            </template>
          </QInput>
        </div>
        <div class="row-item">
          <span class="item-label">
            {{ t('jobOrderParams.StartDate') }}
          </span>
          <QInput
            v-model="jobOrderParams.startDate"
            dense
            class="item-input"
            readonly
            filled
          >
            <template #prepend>
              <QIcon name="event" class="cursor-pointer">
                <QPopupProxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <QDate v-model="jobOrderParams.startDate" mask="DD/MM/YYYY HH:mm">
                    <div class="row items-center justify-end">
                      <QBtn
                        v-close-popup
                        :label="t('Close')"
                        color="primary"
                        flat
                      />
                    </div>
                  </QDate>
                </QPopupProxy>
              </QIcon>
            </template>

            <template #append>
              <QIcon name="access_time" class="cursor-pointer">
                <QPopupProxy
                  cover
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <QTime
                    v-model="jobOrderParams.startDate"
                    mask="DD/MM/YYYY HH:mm"
                    format24h
                  >
                    <div class="row items-center justify-end">
                      <q-btn
                        v-close-popup
                        :label="t('Close')"
                        color="primary"
                        flat
                      />
                    </div>
                  </QTime>
                </QPopupProxy>
              </QIcon>
            </template>
          </QInput>
        </div>
      </div>
      <div v-if="selectedRecipeSteps.length > 0" class="row items-start q-gutter-md mx-10">
        <div class="col">
          <h3 flex-center>
            {{ recipeHeader?.recipeName }}
          </h3>
          <QTable
            m-1
            :rows="selectedRecipeSteps"
            :rows-per-page-options="[0]"
            hide-bottom
            :columns
          >
            <template #body="props">
              <QTr>
                <QTd
                  v-for="col in props.cols"
                  :key="col.name"
                  :props="props"
                >
                  <span v-if="col.field === 'unit'">
                    {{ t(`units.${props.row.unit}`) }}
                  </span>
                  <span v-else-if="col.field === 'amount'">
                    <QInput
                      v-model.number="props.row.amount"
                      type="number"
                      min="0"
                      dense
                      borderless
                    />
                  </span>
                  <span v-else-if="col.field === 'dispenser'">
                    <QSelect
                      v-model="props.row.dispenser"
                      borderless
                      dense
                      filled
                      emit-value
                      map-options
                      options-dense
                      option-label="dispenserName"
                      option-value="dispenserId"
                      :options="dataStore.dispensers"
                    />
                  </span>
                  <span v-else>
                    {{ props.row[col.field] }}
                  </span>
                </QTd>
              </QTr>
            </template>
          </QTable>
        </div>
        <div class="col">
          <h4 flex-center mb-2>
            {{ t('Machine') }}
          </h4>
          <QSelect
            v-model="machine"
            borderless
            dense
            filled
            emit-value
            map-options
            options-dense
            option-label="machineName"
            option-value="machineId"
            :options="machines"
          />
        </div>
      </div>
      <div v-if="selectedRecipeSteps.length > 0" class="dialog-button-section">
        <QBtn
          :label="t('Start')"
          type="submit"
          color="primary"
          icon="start"
          @click="onStart"
        />
        <QBtn
          :label="t('Cancel')"
          color="warning"
          icon="cancel"
          @click="onCancel"
        />
      </div>
    </QCard>
  </QDialog>
</template>
