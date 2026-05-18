import { RecipeType } from '~/shared/constants'
import { Unit } from '~/shared/enums'

interface RecipeConfig {
  defaultUnitTypeDye: number
  defaultUnitTypeChem: number
}

export function getDefaultDyeUnitType(config: Partial<RecipeConfig>): number {
  return config.defaultUnitTypeDye ?? Unit.Percent
}

export function getDefaultChemicalUnitType(config: Partial<RecipeConfig>): number {
  return config.defaultUnitTypeChem ?? Unit.GramPerLiter
}

export function getDefaultUnitType(config: Partial<RecipeConfig>, type: RecipeType): number {
  return type === RecipeType.DYE
    ? getDefaultDyeUnitType(config)
    : getDefaultChemicalUnitType(config)
}
