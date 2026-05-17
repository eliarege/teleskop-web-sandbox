import type { OptionMap } from '~/shared/types'

export const Unit = {
  Percent: 0,
  GramPerLiter: 1,
  CcPerLiter: 2,
  Gram: 3,
  Cc: 4,
  Kilogram: 5,
  Liter: 6,
} as const

export const RecipeTypeOption = {
  Chemical: 0,
  Dye: 1,
  Salt: 2,
  All: 3,
} as const

export const RecipeGroup = {
  Dyeing: 0,
  Washing: 1,
  Addition: 2,
  Other: 3,
} as const

export const ProgramType = {
  Bleach: 0,
  Dyeing: 1,
  Washing: 2,
  Soften: 3,
  Addition: 4,
  Extraction: 5,
  Enzyme: 6,
  Other: 7,
} as const

export function getUnitOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: Unit.Percent, name: t('units.0') },
    { id: Unit.GramPerLiter, name: t('units.1') },
    { id: Unit.CcPerLiter, name: t('units.2') },
    { id: Unit.Gram, name: t('units.3') },
    { id: Unit.Cc, name: t('units.4') },
    { id: Unit.Kilogram, name: t('units.5') },
    { id: Unit.Liter, name: t('units.6') },
  ]
}

export function getRecipeTypeOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: RecipeTypeOption.Chemical, name: t('recipeTypes.0') },
    { id: RecipeTypeOption.Dye, name: t('recipeTypes.1') },
    { id: RecipeTypeOption.Salt, name: t('recipeTypes.2') },
    { id: RecipeTypeOption.All, name: t('recipeTypes.3') },
  ]
}

export function getRecipeGroupOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: RecipeGroup.Dyeing, name: t('recipeGroups.0') },
    { id: RecipeGroup.Washing, name: t('recipeGroups.1') },
    { id: RecipeGroup.Addition, name: t('recipeGroups.2') },
    { id: RecipeGroup.Other, name: t('recipeGroups.3') },
  ]
}

export function getProgramTypeOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: ProgramType.Bleach, name: t('programTypes.0') },
    { id: ProgramType.Dyeing, name: t('programTypes.1') },
    { id: ProgramType.Washing, name: t('programTypes.2') },
    { id: ProgramType.Soften, name: t('programTypes.3') },
    { id: ProgramType.Addition, name: t('programTypes.4') },
    { id: ProgramType.Extraction, name: t('programTypes.5') },
    { id: ProgramType.Enzyme, name: t('programTypes.6') },
    { id: ProgramType.Other, name: t('programTypes.7') },
  ]
}
