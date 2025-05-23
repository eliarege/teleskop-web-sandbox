export default defineI18nLocale(async (locale) => {
  const machineId = 1
  const res = await $fetch(`/api/project-translations?locale=${locale}&machineId=${machineId}`)
  return res.project
})
