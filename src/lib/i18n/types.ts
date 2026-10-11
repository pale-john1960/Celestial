// Celestial — i18n types
export type LocaleCode = 'en' | 'ja' | 'fa';

export interface LocaleDict {
  code: LocaleCode;
  dir: 'ltr' | 'rtl';
  label: string; // native language name
  fontClass: string;

  appName: string;
  tagline: string;

  // navigation / views
  viewMonth: string;
  viewWeek: string;
  viewYear: string;
  viewDay: string;
  viewAgenda: string;
  today: string;
  search: string;
  settings: string;
  refresh: string;
  prevWeek: string;
  nextWeek: string;
  thisWeek: string;
  close: string;
  save: string;
  cancel: string;
  remove: string;
  retry: string;
  clearAll: string;
  download: string;
  import: string;
  importEvents: string;
  imported: string;
  loading: string;
  error: string;
  noEvents: string;
  // empty-state hints (day / agenda / search) + hover-preview "+N more"
  emptyDayHint: string;
  emptyAgendaHint: string;
  emptySearchHint: string;
  moreEvents: string;
  upcoming: string;
  past: string;
  allDay: string;
  dayOff: string;
  dayOffNotice: string;
  weekend: string;

  // systems
  systemGregorian: string;
  systemJalali: string;
  systemImperial: string;
  systemImperialHint: string;
  calendarSystem: string;
  language: string;
  weekStart: string;
  weekStartSat: string;
  weekStartSun: string;
  weekStartMon: string;

  // event sources
  eventSources: string;
  srcInternational: string;
  srcUs: string;
  srcJapan: string;
  srcPersianCultural: string;
  srcPersianReligious: string;
  srcPersianNational: string;
  srcImported: string;
  onlineSources: string;
  onlineHint: string;
  religiousHiddenHolidayNote: string;

  // import dialog
  importTitle: string;
  importHint: string;
  importChooseFile: string;
  importParsing: string;
  importResult: string;
  importInvalid: string;
  sampleFiles: string;
  importFormatJson: string;
  importFormatTxt: string;
  importFormatCsv: string;
  importedEventsList: string;
  noImportedEvents: string;
  deleteImported: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: string;

  // time sync
  timeSync: string;
  timeSyncOk: string;
  timeSyncOff: string;
  timeSyncChecking: string;
  timeSyncFailed: string;
  ntpServer: string;
  offset: string;
  syncNow: string;
  deviceClock: string;
  serverClock: string;

  // footer / misc
  footerNote: string;
  seasonSpring: string;
  seasonSummer: string;
  seasonAutumn: string;
  seasonWinter: string;
  eraGregorian: string;
  eraJalali: string;
  eraImperial: string;
  hijriLabel: string;
  secondaryDate: string;
  eventsCount: string;
  holidayBadge: string;
  religiousBadge: string;
  culturalBadge: string;
  nationalBadge: string;
  categoryLabel: string;
  todayIs: string;
  quickAdd: string;
  none: string;
  days: string;
  months: string;
  years: string;
  andarjah: string;
  dayNameLabel: string;
  yearOverview: string;
  goToday: string;
  prevMonth: string;
  nextMonth: string;
  selectDate: string;

  // moon phases
  moonPhaseTitle: string;
  moonNew: string;
  moonWaxingCrescent: string;
  moonFirstQuarter: string;
  moonWaxingGibbous: string;
  moonFull: string;
  moonWaningGibbous: string;
  moonLastQuarter: string;
  moonWaningCrescent: string;
  moonIllumination: string;
  moonAge: string;

  // manual event creation
  addEvent: string;
  addEventTitle: string;
  addEventDate: string;
  addEventName: string;
  addEventNamePh: string;
  addEventDesc: string;
  addEventHoliday: string;
  addEventSaved: string;
  sourceManual: string;

  // keyboard shortcuts
  shortcuts: string;
  shortcutsPrev: string;
  shortcutsNext: string;
  shortcutsNote: string;

  // ICS export
  exportIcs: string;
  exportIcsDone: string;

  // solstice & equinox markers
  seasonMarEquinox: string;
  seasonJunSolstice: string;
  seasonSepEquinox: string;
  seasonDecSolstice: string;
  seasonOccursAt: string;
  seasonNoteEqual: string;
  seasonNoteLongest: string;
  seasonNoteShortest: string;

  // ICS import
  importFormatIcs: string;

  // recurring annual events
  addEventYearly: string;
  addEventYearlyHint: string;
  recurringYearly: string;

  // event editing
  editEvent: string;
  eventUpdated: string;
  deleteEvent: string;
  saveChanges: string;

  // next day off countdown
  nextDayOff: string;
  nextDayOffToday: string;

  // per-event colors (manual & imported)
  eventColor: string;
  eventColorNone: string;
  eventColorHint: string;

  // year insights (stats card in Year view)
  statsTitle: string;
  statsTotal: string;
  statsDayOffs: string;
  statsBusiest: string;
  statsRecurring: string;

  // PWA install
  installApp: string;
  installDone: string;
  offlineReady: string;

  // Persian zodiac month chips (month view toolbar)
  zodiacAries: string;
  zodiacTaurus: string;
  zodiacGemini: string;
  zodiacCancer: string;
  zodiacLeo: string;
  zodiacVirgo: string;
  zodiacLibra: string;
  zodiacScorpio: string;
  zodiacSagittarius: string;
  zodiacCapricorn: string;
  zodiacAquarius: string;
  zodiacPisces: string;
  /** chip a11y label — "{month}" = displayed month name, "{sign}" = sign name */
  zodiacChipDesc: string;

  // Offline indicator (PWA round 2)
  offlineTitle: string;
  offlineDesc: string;

  // Event notifications (opt-in, settings toggle)
  settingsNotifications: string;
  notifDesc: string;
  notifPermissionDenied: string;
  notifGranted: string;
  notifTest: string;
  /** notification title — "{date}" = localized today label */
  notifTitle: string;
  /** notification body — "{names}" = comma-joined event names */
  notifBody: string;

  // Backup / restore (settings → data section)
  settingsDataSection: string;
  backupDesc: string;
  exportData: string;
  importBackup: string;
  /** toast — "{count}" = number of exported events */
  backupExported: string;
  /** toast — "{count}" = number of restored events */
  backupImported: string;
  backupImportError: string;
  backupReplaceConfirm: string;

  // Print (month view toolbar + shortcuts dialog)
  printMonth: string;
  /** aria-label for the print button */
  printDesc: string;
  shortcutPrint: string;
}
