<script setup lang="ts">
import type { RecipeMasterStep, RecipeProgramMaster, RecipeVariant } from '~/shared/types'

const props = defineProps({
  recipeMaster: {
    type: Object as PropType<RecipeProgramMaster>,
    required: true,
  },
})
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide } = useDialogPluginComponent()
const { t } = useI18n()
const recipe = ref<RecipeMasterStep[]>([])
const columns = [
  { name: 'orderNo', label: t('recipeFields.OrderNo'), align: 'left', field: 'orderNo' },
  { name: 'type', label: t('materialFields.Type'), align: 'left', field: 'type', format: (val: number) => t(`recipeTypes.${val}`) },
  { name: 'materialCode', label: t('materialFields.Code'), align: 'left', field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), align: 'left', field: 'materialName', style: 'font-weight: 900; font-size: 1.25rem;' },
  { name: 'amount', label: t('Amount'), align: 'left', field: 'amount' },
  { name: 'unit', label: t('jobOrderParams.Unit'), align: 'left', field: 'unit', format: (val: number) => t(`units.${val}`) },
]
const variants = ref<RecipeVariant[]>([])
const variantOptions = ref<RecipeVariant[]>([])
const selectedVariant = ref<RecipeVariant>()
getVariants()
async function getVariants() {
  variants.value = await $fetch(`/api/recipes/variant/${props.recipeMaster.recipeId}`, { query: { machineId: props.recipeMaster.machineId }})
  variantOptions.value = variants.value
}
async function getRecipeSteps() {
  if (selectedVariant.value)
    recipe.value = await $fetch(`/api/recipes/variant/${props.recipeMaster.recipeId}/${selectedVariant.value.variantName}`)
}
function getAllMaterialsFromSteps(program: RecipeMasterStep) {
  const materials = program.steps.flatMap(step =>
    step.materials.map(material => ({
      ...material,
    })),
  )
  return materials.sort((a, b) => a.orderNo - b.orderNo)
}
async function updateVariant(val: RecipeProgramMaster | undefined) {
  if (val) {
    recipe.value = await $fetch(`/api/recipes/variant/${props.recipeMaster.recipeId}/${val.variantName}`)
    getRecipeSteps()
  }
}
function filterVariants(val: any, update: (param: any) => void) {
  update(() => {
    const needle = val.toLowerCase()
    variantOptions.value = variants.value.filter(variant => variant.variantName.toLowerCase().includes(needle))
  })
}
function onCancel() {
  onDialogCancel()
}
async function onSave() {
  if (selectedVariant.value)
    onDialogOK(selectedVariant.value)
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <div class="text-center pt-5 text-xl">
        <h2>{{ t('RecipeVariant') }}: {{ recipeMaster.recipeName }}</h2>
      </div>
      <div
        my-5
        flex-center
      >
        <QSelect
          v-model="selectedVariant"
          w-60
          borderless
          dense
          filled
          use-input
          input-debounce="0"
          clearable
          hide-selected
          fill-input
          emit-value
          map-options
          options-dense
          option-label="variantName"
          :options="variantOptions"
          @filter="(val, doneFn) => filterVariants(val, doneFn)"
          @update:model-value="updateVariant"
        />
      </div>

      <div class="flex-center w-full">
        <div class="col-8">
          <div
            v-for="(program, programIndex) in recipe"
            :key="program.programNo"
            class="row mb-2"
          >
            <div class="col">
              <div class="row flex-center">
                <h3
                  flex-center
                  text-xl
                  font-bold
                  my-3
                >
                  {{ program.programName }}
                </h3>
              </div>
              <QTable
                :rows="getAllMaterialsFromSteps(program)"
                :rows-per-page-options="[0]"
                :columns
                hide-bottom
              />
            </div>
          </div>
        </div>
      </div>
      <div v-if="selectedVariant" class="dialog-button-section">
        <QBtn
          :label="t('Continue')"
          type="submit"
          color="primary"
          icon="play_arrow"
          @click="onSave"
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
