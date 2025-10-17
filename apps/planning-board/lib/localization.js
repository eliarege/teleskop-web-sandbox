export const enLocalization = {
  Object: {
    planparam: 'Plan Parameters',
    recipe: 'Recipe',
    process: 'Process Information',
    theoretical: 'Theoretical Program',
    note: 'Notes',
    datepicker: 'Date Picker',
    rules: 'Rules',
    search: 'Job Order Search',
    scheduleConflict: 'Event can\'t be scheduled on this machine!',
    beforeNow: 'You can not schedule this event before current time!',
    missingPrograms: ([expectedPrograms]) =>
      `Programs used in the job order are not available on the machine. Expected programs: ${expectedPrograms.join(', ')}`,
    invalidCapacity: ([requiredCapacity, machineCapacity, tolerance]) =>
      `Machine capacity is insufficient! Required: ${requiredCapacity}, Available: ${machineCapacity} (tolerance: %${tolerance * 100})`,
    capacityWarning: ([requiredCapacity, machineCapacity, tolerance]) =>
      `Machine capacity warning. Required: ${requiredCapacity}, Available: ${machineCapacity} (tolerance: %${tolerance * 100})`,
    unassign: 'Unassigned Job Orders',
    machine: 'Machine Name',
    unassign: 'Unassigned Job Orders',
    scrollToEvent: 'Scroll To Job Order',
    jobOrderDate: 'Creation Date',
    machineSort: 'Machine Sort',
    machineMessage: 'Send Message',
  },
}

export const trLocalization = {
  Object: {
    planparam: 'Plan Parametreleri',
    recipe: 'Reçete',
    process: 'Prosess Bilgileri',
    theoretical: 'Teorik Program',
    note: 'Notlar',
    datepicker: 'Tarih',
    rules: 'Kurallar',
    search: 'İş Emri Arama',
    scheduleConflict: 'Bu iş emrini bu makineye planlayamazsın!',
    beforeNow: 'İş emrini güncel zamandan önceye planlayamazsın!',
    missingPrograms:
      ([expectedPrograms]) => `İş emrinde kullanılan programlar makinede mevcut değil. Olması gereken programlar: ${expectedPrograms.join(', ')}`,
    invalidCapacity:
      ([requiredCapacity, machineCapacity, tolerance]) => `Makine kapasitesi yetersiz. Gerekli: ${requiredCapacity}, mevcut: ${machineCapacity} (tolerans: %${tolerance * 100})`,
    capacityWarning:
      ([requiredCapacity, machineCapacity, tolerance]) => `Makine kapasitesi uyarısı. Gerekli: ${requiredCapacity}, mevcut: ${machineCapacity} (tolerans: %${tolerance * 100})`,
    machine: 'Makine İsmi',
    unassign: 'Planlanmamış İş Emirleri',
    scrollToEvent: 'İş Emrine Git',
    jobOrderDate: 'Oluşturulma Tarihi',
    machineSort: 'Makine Sıralama',
    machineMessage: 'Mesaj Gönder',
  },
}
