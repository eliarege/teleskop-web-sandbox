export const calculatedValueKeys = [
  'DAKIKADA_TAMBUR_DEVRI', // 0
  'DAKIKADA_TAMBUR_DEVRI_HEDEFI', // 1
  'ANA_KAZAN_SP', // 2
  'ANA_KAZAN_PV', // 3
  'SICAKLIK_HEDEFI', // 4
  'BEKLEME_PV', // 5
  'BEKLEME_SP', // 6
  'NEM_SENSOR_DEGERI_1', // 7
  'NEM_SENSOR_DEGERI_2', // 8
  'SICAKLIK_SENSOR_DEGERI_1', // 9
  'SICAKLIK_SENSOR_DEGERI_2', // 10
  'SICAKLIK_ENVIRONMENT_MIXING_RATIO', // 11
  'SICAKLIK_OUTPUT_MIXING_RATIO', // 12
  'SICAKLIK_MIXING_RATIO', // 13
  'SICAKLIK_PV', // 14
  'KULE_1_HIZI', // 15
  'RESERVED_3', // 16
  'RESERVED_4', // 17
  'RESERVED_5', // 18
  'RESERVED_6', // 19
  'COLOR_SENSOR_R_VALUE', // 20
  'COLOR_SENSOR_G_VALUE', // 21
  'COLOR_SENSOR_B_VALUE', // 22
  'COLOR_SENSOR_TRANSMITTANCE', // 23
  'COLOR_SENSOR_ABSORBANCE', // 24
  'COLOR_SENSOR_DELTA_L', // 25
  'COLOR_SENSOR_X', // 26
  'COLOR_SENSOR_Y', // 27
  'COLOR_SENSOR_DELTA_E', // 28
  'COLOR_SENSOR_RESERVE', // 29
  'COLOR_SENSOR_OUTPUT', // 30
  'FARK_BASINC', // 31
  'GUNLUK_SU_TUKETIMI', // 32
  'SU_TUKETIMI', // 33
  'TIP_1_SU_TUKETIMI', // 34
  'TIP_2_SU_TUKETIMI', // 35
  'TIP_3_SU_TUKETIMI', // 36
  'TIP_4_SU_TUKETIMI', // 37
  'TIP_5_SU_TUKETIMI', // 38
  'TIP_6_SU_TUKETIMI', // 39
  'TIP_7_SU_TUKETIMI', // 40
  'TEORIK_BUHAR_TUKETIMI', // 41
  'ELEKTRIK_TUKETIMI', // 42
  'VIOLET1', // 43
  'BLUE1', // 44
  'GREEN1', // 45
  'YELLOW1', // 46
  'ORANGE1', // 47
  'RED1', // 48
  'SENSOR1_TOTAL', // 49
  'SENSOR1_TEMP', // 50
  'VIOLET10', // 51
  'BLUE10', // 52
  'GREEN10', // 53
  'YELLOW10', // 54
  'ORANGE10', // 55
  'RED10', // 56
  'SENSOR10_TOTAL', // 57
  'SENSOR10_TEMP', // 58
  'COLOR_SENS_17', // 59
  'COLOR_SENS_18', // 60
  'BUHAR_TUKETIMI', // 61
  'SENSOR_PH', // 62
  'SENSOR_PH_SICAKLIK', // 63
  'SENSOR_ICT', // 64
  'SENSOR_ICT_SICAKLIK', // 65
  'SENSOR_SAT_1mm', // 66
  'SENSOR_SAT_10mm', // 67
  'CPT_ILETKENLIK', // 68
  'CPT_SICAKLIK', // 69
  'SENSOR_HUB_STATUS', // 70
]

type AlarmType = {
  type: number
  label: string
  color: string
}

export const alarmTypes: AlarmType[] = [
  { type: 0, label: 'alarmSettings.0sh', color: '#E53935' },
  { type: 1, label: 'alarmSettings.1sh', color: '#1E88E5' },
  { type: 2, label: 'alarmSettings.2sh', color: '#43A047' },
  { type: 3, label: 'alarmSettings.3sh', color: '#8E24AA' },
  { type: 4, label: 'alarmSettings.4', color: '#FB8C00' },
  { type: 5, label: 'alarmSettings.5', color: '#00897B' },
  { type: 6, label: 'alarmSettings.6', color: '#6D4C41' },
  { type: 7, label: 'alarmSettings.7sh', color: '#3949AB' },
  { type: 8, label: 'alarmSettings.8', color: '#FDD835' },
  { type: 9, label: 'alarmSettings.9', color: '#D81B60' },
  { type: 10, label: 'alarmSettings.10', color: '#00ACC1' },
  { type: 11, label: 'alarmSettings.11sh', color: '#7CB342' },
]
