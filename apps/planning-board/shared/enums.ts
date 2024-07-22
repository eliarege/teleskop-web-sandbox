enum Units {
  Kilogram = 1, // kg
  Liter = 2, // lt
  Second = 3, // saniye
  Minute = 4, // dk
  Celsius = 5, // °C
  Percentage = 6, // %
  PH = 7, // pH
  Millibar = 8, // mbar
  LitersPerMinute = 9, // lt/dk
  MetersPerMinute = 10, // m/dk
  Bar = 11, // bar
  RPM = 12, // rpm
  SiemensPerMeter = 13, // S/m
  Meter = 14, // m
  KilowattHour = 15, // kWh
  CubicCentimeter = 16, // cc
  LitersPerKilogram = 17, // lt/kg
  GramsPerLiter = 18, // gr/lt
  CelsiusPerMinute = 19, // °C/dk
  Centimeter = 20, // cm
  MillisiemensPerCentimeter = 21, // ms/cm
  Kelvin = 22, // K
  GramsPerMetricTon = 23, // gr/mt
  GramsPerMetricTonLime = 24, // gr/mt-lim
  Inch = 25, // inch
  Gram = 26, // gr
  Pound = 27, // lb
  Gallon = 28, // gal
  Fahrenheit = 29, // °F
  Feet = 30, // ft
  GallonsPerMinute = 31, // galon/min
  FeetPerMinute = 32, // ft/min
  GallonsPerPound = 33, // gal/lb
  OuncePerGallon = 34, // oz/gal
  FahrenheitPerMinute = 35, // °F/min
  OuncePerFoot = 36, // oz/ft
}

export enum StartingParameters {
  Correct = 0,
  Invalid = 1,
  Changed = 2,
  NonStartingParameter = 3,
}
export function getUnitById(id: number): string {
  // TODO: I18N!
  switch (id) {
    case Units.Kilogram:
      return 'kg'
    case Units.Liter:
      return 'lt'
    case Units.Second:
      return 'saniye'
    case Units.Minute:
      return 'dk'
    case Units.Celsius:
      return '°C'
    case Units.Percentage:
      return '%'
    case Units.PH:
      return 'pH'
    case Units.Millibar:
      return 'mbar'
    case Units.LitersPerMinute:
      return 'lt/dk'
    case Units.MetersPerMinute:
      return 'm/dk'
    case Units.Bar:
      return 'bar'
    case Units.RPM:
      return 'rpm'
    case Units.SiemensPerMeter:
      return 'S/m'
    case Units.Meter:
      return 'm'
    case Units.KilowattHour:
      return 'kWh'
    case Units.CubicCentimeter:
      return 'cc'
    case Units.LitersPerKilogram:
      return 'lt/kg'
    case Units.GramsPerLiter:
      return 'gr/lt'
    case Units.CelsiusPerMinute:
      return '°C/dk'
    case Units.Centimeter:
      return 'cm'
    case Units.MillisiemensPerCentimeter:
      return 'ms/cm'
    case Units.Kelvin:
      return 'K'
    case Units.GramsPerMetricTon:
      return 'gr/mt'
    case Units.GramsPerMetricTonLime:
      return 'gr/mt-lim'
    case Units.Inch:
      return 'inch'
    case Units.Gram:
      return 'gr'
    case Units.Pound:
      return 'lb'
    case Units.Gallon:
      return 'gal'
    case Units.Fahrenheit:
      return '°F'
    case Units.Feet:
      return 'ft'
    case Units.GallonsPerMinute:
      return 'gal/min'
    case Units.FeetPerMinute:
      return 'ft/min'
    case Units.GallonsPerPound:
      return 'gal/lb'
    case Units.OuncePerGallon:
      return 'oz/gal'
    case Units.FahrenheitPerMinute:
      return '°F/min'
    case Units.OuncePerFoot:
      return 'oz/ft'
    default:
      return ''
  }
}

// @unocss-include
export function setParameterColor(paramStatus: 0 | 1 | 2 | 3) {
  switch (paramStatus) {
    case StartingParameters.Correct:
      return ''
    case StartingParameters.Changed:
      return 'bg-blue-600'
    case StartingParameters.Invalid:
      return 'bg-red-600'
    case StartingParameters.NonStartingParameter:
      return 'bg-green-600'
  }
}
