import { color as d3Color } from 'd3-color'

/**
 *  Calculates the luminance value of a given color.
 */
export function calculateLuminance(color: string) {
  const colorToRGB = d3Color(color)!.rgb()
  const sRGB = {
    r: colorToRGB.r / 255,
    g: colorToRGB.g / 255,
    b: colorToRGB.b / 255,
  }
  function sRGBtoLin(colorChannel: number) {
    if (colorChannel <= 0.04045) {
      return colorChannel / 12.92
    } else {
      return ((colorChannel + 0.055) / 1.055) ** 2.4
    }
  }
  return (0.2126 * sRGBtoLin(sRGB.r) + 0.7152 * sRGBtoLin(sRGB.g) + 0.0722 * sRGBtoLin(sRGB.b))
}
/**
 * Determines the appropriate text color for a given background color.
 */
export function determineTextColor(bgColor: string) {
  return calculateLuminance(bgColor) > 0.5 ? 'black' : 'white'
}
