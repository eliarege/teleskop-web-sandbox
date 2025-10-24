import type { RecipeMasterMaterial } from "~/shared/types"

export function cellStyle(col: any, row: any, pageIndex: number, isSelected: boolean, isDarkMode: boolean, colors: any) {
  let style = 'background-color: '
  if (col.field === 'status') {
    style += colors.jobOrderStatusColors[row.status] || '#FFFFFF'
    style += '; color: black; font-size: medium'
  } else if (isDarkMode) {
    if (isSelected) {
      style += colors.selectedRowDark
    } else if (pageIndex % 2 === 0) {
      style += colors.darkJobOrderCellEven
      style += '; color: black'
    } else {
      style += colors.darkJobOrderCellOdd
    }
  } else {
    if (isSelected) {
      style += colors.selectedRowLight
    } else if (pageIndex % 2 === 0) {
      style += colors.lightJobOrderCellEven
    } else {
      style += colors.lightJobOrderCellOdd
    }
  }
  return style
}
export function capitalizeFirst(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}
export const ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

export function rgbStringToColorCode(rgbString: string | null) {
  if (rgbString) {
    const match = rgbString.match(/\d+/g)
    if (match) {
      const [r, g, b] = match.map(Number)
      return (r << 16) | (g << 8) | b
    }
  }
}
export function colorCodeToRGB(colorCode: number) {
  const r = (colorCode >> 16) & 255
  const g = (colorCode >> 8) & 255
  const b = colorCode & 255
  return `rgb(${r}, ${g}, ${b})`
}
export function getAllMaterialsFromSteps(steps: any) {
  const materials = steps.flatMap((step: any) =>
    step.materials,
  )
  return materials.sort((a: RecipeMasterMaterial, b: RecipeMasterMaterial) => a.orderNo - b.orderNo)
}
