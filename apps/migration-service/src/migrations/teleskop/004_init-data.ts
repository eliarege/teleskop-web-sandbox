import type { Knex } from 'knex'
import { TeleskopSettings } from './legacy-migrations/enums'

export async function up(knex: Knex) {
  // #region TFTELESKOPSETTINGS

  const settings = [
    { ID: TeleskopSettings.UserManagentActive, VALUE: '0' },
    { ID: TeleskopSettings.PhaseModeActive, VALUE: '0' },
    { ID: TeleskopSettings.CustomErpPrmOptimization, VALUE: '0' },
    { ID: TeleskopSettings.AllowedCharsForJobOrder, VALUE: '+_' },
    { ID: TeleskopSettings.RecipeEnterActive, VALUE: '1' },
    { ID: TeleskopSettings.TimeBasedModeActive, VALUE: '0' },
    { ID: TeleskopSettings.DyehouseNumber, VALUE: '-1' },
    { ID: TeleskopSettings.ProcessUsageActive, VALUE: '0' },
    { ID: TeleskopSettings.SaveIOValuesInDatabase, VALUE: '0' },
    { ID: TeleskopSettings.StoreRequestsInDatabase, VALUE: '0' },
    { ID: TeleskopSettings.CommandOptimisationParameterCount, VALUE: '10' },
    { ID: TeleskopSettings.EditorSelectedCommandIcons, VALUE: '' },
    { ID: TeleskopSettings.InitialWaterTemperature, VALUE: '' },
    { ID: TeleskopSettings.IntegrationDatabaseActive, VALUE: '' },
    { ID: TeleskopSettings.IntegrationDatabaseConnectionString, VALUE: '' },
    { ID: TeleskopSettings.JoborderBarcodeType, VALUE: '' },
    { ID: TeleskopSettings.PhaseBigIconsEnabled, VALUE: '' },
    { ID: TeleskopSettings.PhaseSmallIconsVisible, VALUE: '' },
  ]

  const existingSettings = await knex('TFTELESKOPSETTINGS')
    .select('ID')
    .whereIn('ID', settings.map(s => s.ID))

  const existingSettingIds = new Set(existingSettings.map(s => s.ID))

  const toInsertSettings = settings.filter(s => !existingSettingIds.has(s.ID))
  if (toInsertSettings.length > 0) {
    await knex('TFTELESKOPSETTINGS').insert(toInsertSettings)
  }

  // #endregion

  // #region BFMACHGROUP

  const machGroups = [
    { groupid: 0, groupname: 'Kumas HT', grouptype: 0, mmvisible: true },
    { groupid: 1, groupname: 'Kumas OF', grouptype: 1, mmvisible: true },
    { groupid: 2, groupname: 'Bobin', grouptype: 2, mmvisible: true },
    { groupid: 3, groupname: 'Numune', grouptype: 3, mmvisible: true },
    { groupid: 4, groupname: 'Flok', grouptype: 4, mmvisible: true },
    { groupid: 5, groupname: 'Diger', grouptype: 9, mmvisible: true },
    { groupid: 6, groupname: 'Diger', grouptype: 9, mmvisible: true },
    { groupid: 7, groupname: 'Diger', grouptype: 9, mmvisible: true },
    { groupid: 8, groupname: 'Diger', grouptype: 9, mmvisible: true },
    { groupid: 9, groupname: 'Diger', grouptype: 9, mmvisible: true },
  ]

  const existingMachGroups = await knex('BFMACHGROUP')
    .select('GROUPID')
    .whereIn(
      'GROUPID',
      machGroups.map(g => g.groupid),
    )

  const existingGroupIds = new Set(existingMachGroups.map(g => g.GROUPID))

  const toInsertGroups = machGroups.filter(
    g => !existingGroupIds.has(g.groupid),
  )

  if (toInsertGroups.length > 0) {
    await knex('BFMACHGROUP').insert(toInsertGroups)
  }

  // #endregion

  // #region BFWaterTypes

  const waterTypes = [
    { waterTypeId: 1, waterTypeName: '', waterTypeNameEn: '' },
    { waterTypeId: 2, waterTypeName: '', waterTypeNameEn: '' },
    { waterTypeId: 3, waterTypeName: '', waterTypeNameEn: '' },
    { waterTypeId: 4, waterTypeName: '', waterTypeNameEn: '' },
    { waterTypeId: 5, waterTypeName: '', waterTypeNameEn: '' },
    { waterTypeId: 6, waterTypeName: '', waterTypeNameEn: '' },
  ]

  const existingWaterTypes = await knex('BFWaterTypes')
    .select('waterTypeId')
    .whereIn(
      'waterTypeId',
      waterTypes.map(w => w.waterTypeId),
    )

  const existingWaterTypeIds = new Set(existingWaterTypes.map(w => w.waterTypeId))

  const toInsertWaterTypes = waterTypes.filter(
    w => !existingWaterTypeIds.has(w.waterTypeId),
  )

  if (toInsertWaterTypes.length > 0) {
    await knex('BFWaterTypes').insert(toInsertWaterTypes)
  }

  // #endregion

  // #region BFUNITS

  const units = [
    { UNITID: 1, UNITNAME: 'gr/lt' },
    { UNITID: 2, UNITNAME: '%' },
    { UNITID: 3, UNITNAME: 'gr' },
    { UNITID: 4, UNITNAME: 'ml/lt' },
  ]

  const existingUnits = await knex('BFUNITS')
    .select('UNITID')
    .whereIn(
      'UNITID',
      units.map(u => u.UNITID),
    )

  const existingUnitIds = new Set(existingUnits.map(u => u.UNITID))

  const toInsertUnits = units.filter(
    u => !existingUnitIds.has(u.UNITID),
  )

  if (toInsertUnits.length > 0) {
    await knex('BFUNITS').insert(toInsertUnits)
  }

  // #endregion

  // #region TFTeleskopUsers

  const users = [
    {
      userId: 0,
      userLoginName: 'VARSAYILAN',
      userName: 'VARSAYILAN',
      userSurname: 'VARSAYILAN',
      userPass: '',
      userEditor: '1',
      userMachines: '1',
      userArchive: '1',
      userMonitor: '1',
      userReport: '1',
      userUsers: '0',
      userCommunicationDriver: '0',
      userEmail: null,
      userPlanningBoard: '00',
    },
    {
      userId: 1,
      userLoginName: 'Eliar',
      userName: 'Eliar',
      userSurname: 'Eliar',
      userPass: '810080a267233bda0a1514a2d1a5558d',
      userEditor: 'FF',
      userMachines: 'FF',
      userArchive: '1',
      userMonitor: '1',
      userReport: '1',
      userUsers: 'F',
      userCommunicationDriver: '3',
      userEmail: null,
      userPlanningBoard: '3F',
    },
    {
      userId: 100,
      userLoginName: 'Geçici Kullanici',
      userName: 'Geçici Kullanici',
      userSurname: 'Geçici Kullanici',
      userPass: '',
      userEditor: 'FF',
      userMachines: 'FF',
      userArchive: '1',
      userMonitor: '1',
      userReport: '1',
      userUsers: 'F',
      userCommunicationDriver: '3',
      userEmail: null,
      userPlanningBoard: '00',
    },
  ]

  const existingTeleskopUsers = await knex('TFTeleskopUsers')
    .select('userId')
    .whereIn(
      'userId',
      users.map(u => u.userId),
    )

  const existingTeleskopUserIds = new Set(existingTeleskopUsers.map(u => u.userId))

  const toInsertTeleskopUsers = users.filter(
    u => !existingTeleskopUserIds.has(u.userId),
  )

  if (toInsertTeleskopUsers.length > 0) {
    await knex('TFTeleskopUsers').insert(toInsertTeleskopUsers)
  }

  // #endregion

  // #region BFUSERS

  const bfUsers = [
    {
      userID: 0,
      userName: 'VARSAYILAN',
      userSurname: 'VARSAYILAN',
      userPass: '1111',
      userMode: '0x110050',
      userInfo: null,
      userActive: 1,
      userDeleted: 0,
      userMode2: '0x00000017',
      userType: 1,
    },
    {
      userID: 1,
      userName: 'ELIAR',
      userSurname: 'YETKILISI',
      userPass: '35427',
      userMode: '0x1ffff',
      userInfo: null,
      userActive: 1,
      userDeleted: 0,
      userMode2: '0x00000017',
      userType: 1,
    },
    {
      userID: 100,
      userName: 'GECICI',
      userSurname: 'KULLANICI',
      userPass: '1984',
      userMode: '0x1ffff',
      userInfo: null,
      userActive: 1,
      userDeleted: 0,
      userMode2: '0x00000017',
      userType: 1,
    },
  ]

  const existingUsers = await knex('BFUSERS')
    .select('userID')
    .whereIn(
      'userID',
      bfUsers.map(u => u.userID),
    )

  const existingUserIds = new Set(existingUsers.map(u => u.userID))

  const toInsertBfUsers = bfUsers.filter(
    u => !existingUserIds.has(u.userID),
  )

  if (toInsertBfUsers.length > 0) {
    await knex('BFUSERS').insert(toInsertBfUsers)
  }

  // #endregion

  // #region DYTFSETTINGS

  const dyTfSettings = [
    { settingId: 1, settingValue: '144' },
    { settingId: 2, settingValue: '80*80' },
  ]

  const existingDyTfSettings = await knex('DYTFSETTINGS')
    .select('settingId')
    .whereIn(
      'settingId',
      dyTfSettings.map(s => s.settingId),
    )

  const existingDyTfSettingIds = new Set(existingDyTfSettings.map(s => s.settingId))

  const toInsertDyTfSettings = dyTfSettings.filter(
    s => !existingDyTfSettingIds.has(s.settingId),
  )

  if (toInsertDyTfSettings.length > 0) {
    await knex('DYTFSETTINGS').insert(toInsertDyTfSettings)
  }

  // #endregion

  // #region BFTREATMENTPARAMETERGROUPS

  const treatmentParameterGroups = [
    {
      ID: 1,
      GROUPNAME: 'Eliar',
      TEMPERATURECONTROLCOMMAND: null,
    },
  ]

  const existingTreatmentParameterGroup = await knex('BFTREATMENTPARAMETERGROUPS')
    .select('ID')
    .whereIn('ID', treatmentParameterGroups.map(g => g.ID))

  const existingIds = new Set(existingTreatmentParameterGroup.map(g => g.ID))

  const toInsert = treatmentParameterGroups.filter(
    g => !existingIds.has(g.ID),
  )

  if (toInsert.length > 0) {
    const query = knex('BFTREATMENTPARAMETERGROUPS').insert(toInsert).toSQL()
    await knex.raw(`
      SET IDENTITY_INSERT BFTREATMENTPARAMETERGROUPS ON;
      ${query.sql};
      SET IDENTITY_INSERT BFTREATMENTPARAMETERGROUPS OFF;
    `, query.bindings)
  }

  // #endregion

  // #region DYTFELIARUSER

  const eliarUsers = [
    {
      USERNAME: 'q',
      FULLNAME: 'q',
      DESCRIPTION: 'q',
      PASSWORD: 'q',
      ISSUPERUSER: 1,
    },
  ]

  const existingEliarUser = await knex('DYTFELIARUSER')
    .select('USERNAME')
    .whereIn(
      'USERNAME',
      eliarUsers.map(u => u.USERNAME),
    )

  const existingUsernames = new Set(existingEliarUser.map(u => u.USERNAME))

  const toInsertEliarUsers = eliarUsers.filter(
    u => !existingUsernames.has(u.USERNAME),
  )

  if (toInsertEliarUsers.length > 0) {
    await knex('DYTFELIARUSER').insert(toInsertEliarUsers)
  }

  // #endregion

  // #region BFRECIPETYPES

  const recipeTypes = [
    {
      ID: 1,
      TYPENAME: 'Boyama',
    },
  ]

  const existingRecipes = await knex('BFRECIPETYPES')
    .select('ID')
    .whereIn('ID', recipeTypes.map(r => r.ID))

  const existingRecipeIds = new Set(existingRecipes.map(r => r.ID))

  const toInsertRecipeTypes = recipeTypes.filter(
    r => !existingRecipeIds.has(r.ID),
  )

  if (toInsertRecipeTypes.length > 0) {
    const query = knex('BFRECIPETYPES').insert(toInsertRecipeTypes).toSQL()
    await knex.raw(`
      SET IDENTITY_INSERT BFRECIPETYPES ON;
      ${query.sql};
      SET IDENTITY_INSERT BFRECIPETYPES OFF;
    `, query.bindings)
  }

  // #endregion

  // #region TFDBCLEANDATE

  const cleanDateRow = {
    LAST_BACONSUMPTIONTIMESTAMP_CLEANDATE: '2004-02-10 09:16:00',
    LAST_BAMASTERPRGHEADER_CLEANDATE: '2004-02-10 09:16:00',
    LAST_BAMASTERCOMMANDS_CLEANDATE: '2004-02-10 09:16:00',
    LAST_BADATA_CLEANDATE: '2004-02-10 09:16:00',
  }

  const existingDbCleanDate = await knex('TFDBCLEANDATE')
    .count<{ count: number }[]>('* as count')
    .first()

  if (!existingDbCleanDate || Number(existingDbCleanDate.count) === 0) {
    await knex('TFDBCLEANDATE').insert(cleanDateRow)
  }

  // #endregion

  // #region BFPROCESSTYPES

  const processTypes = [
    {
      PROCESSCODE: 0,
      PROCESSNAME: 'Dyeing',
      NOTE: null,
      BOYAPRGMI: 1,
    },
  ]

  const existingProcessTypes = await knex('BFPROCESSTYPES')
    .select('PROCESSCODE')
    .whereIn(
      'PROCESSCODE',
      processTypes.map(p => p.PROCESSCODE),
    )

  const existingCodes = new Set(existingProcessTypes.map(p => p.PROCESSCODE))

  const toInsertProcessTypes = processTypes.filter(
    p => !existingCodes.has(p.PROCESSCODE),
  )

  if (toInsertProcessTypes.length > 0) {
    await knex('BFPROCESSTYPES').insert(toInsertProcessTypes)
  }

  // #endregion

  // #region BFGRUP

  const bfGrup = [
    {
      GRUPNO: 0,
      GRUPNAME: 'Genel',
      NOTE: null,
    },
  ]

  const existingGroups = await knex('BFGRUP')
    .select('GRUPNO')
    .whereIn(
      'GRUPNO',
      bfGrup.map(g => g.GRUPNO),
    )

  const existingNos = new Set(existingGroups.map(g => g.GRUPNO))

  const toInsertGroup = bfGrup.filter(
    g => !existingNos.has(g.GRUPNO),
  )

  if (toInsertGroup.length > 0) {
    await knex('BFGRUP').insert(toInsertGroup)
  }

  // #endregion

  // #region TFCOMDRIVERSETTINGS

  const comDriverSettingsRow = {
    COMDRIVERCOMPUTERNAME: null,
    IP: null,
    SERVERPORT: null,
    REQUESTNAME: null,
    REQUESTPATH: null,
    ACTPATH: null,
    REQTYPE: null,
    DYESTUFFDISPENSER: 1,
    LAST_BATCHKEY: null,
    COMPANY_NAME: 'Has Örme',
  }

  const existingComDriverSettings = await knex('TFCOMDRIVERSETTINGS')
    .count<{ count: number }[]>('* as count')
    .first()

  if (!existingComDriverSettings || Number(existingComDriverSettings.count) === 0) {
    await knex('TFCOMDRIVERSETTINGS').insert(comDriverSettingsRow)
  }

  // #endregion

  // #region TFDBVERSION

  const dbVersionRow = {
    DBVERSION: '3.4.32.0',
    appMajor: 0,
    appMinor: 10,
  }

  const existingDbVersion = await knex('TFDBVERSION')
    .count<{ count: number }[]>('* as count')
    .first()

  if (!existingDbVersion || Number(existingDbVersion.count) === 0) {
    await knex('TFDBVERSION').insert(dbVersionRow)
  }

  // #endregion
}

export async function down() {
  // No rollback needed for initial data
}
