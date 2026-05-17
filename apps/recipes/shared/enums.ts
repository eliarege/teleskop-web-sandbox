import type { OptionMap } from '~/shared/types'

export function getUnitOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: 0, name: t('units.0') },
    { id: 1, name: t('units.1') },
    { id: 2, name: t('units.2') },
    { id: 3, name: t('units.3') },
    { id: 4, name: t('units.4') },
    { id: 5, name: t('units.5') },
    { id: 6, name: t('units.6') },
  ]
}

export function getRecipeTypeOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: 0, name: t('recipeTypes.0') },
    { id: 1, name: t('recipeTypes.1') },
    { id: 2, name: t('recipeTypes.2') },
    { id: 3, name: t('recipeTypes.3') },
  ]
}

export function getRecipeGroupOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: 0, name: t('recipeGroups.0') },
    { id: 1, name: t('recipeGroups.1') },
    { id: 2, name: t('recipeGroups.2') },
    { id: 3, name: t('recipeGroups.3') },
  ]
}

export function getProgramTypeOptions(t: (key: string) => string): OptionMap[] {
  return [
    { id: 0, name: t('programTypes.0') },
    { id: 1, name: t('programTypes.1') },
    { id: 2, name: t('programTypes.2') },
    { id: 3, name: t('programTypes.3') },
    { id: 4, name: t('programTypes.4') },
    { id: 5, name: t('programTypes.5') },
    { id: 6, name: t('programTypes.6') },
    { id: 7, name: t('programTypes.7') },
  ]
}
