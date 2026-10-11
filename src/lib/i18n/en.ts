// Celestial — English dictionary
import type { LocaleDict } from './types';

export const en: LocaleDict = {
  code: 'en',
  dir: 'ltr',
  label: 'English',
  fontClass: 'font-sans',

  appName: 'Celestial',
  tagline: 'A journey through time',

  viewMonth: 'Month',
  viewWeek: 'Week',
  viewYear: 'Year',
  viewDay: 'Day',
  viewAgenda: 'Agenda',
  today: 'Today',
  search: 'Search',
  settings: 'Settings',
  refresh: 'Refresh',
  prevWeek: 'Previous week',
  nextWeek: 'Next week',
  thisWeek: 'This week',
  close: 'Close',
  save: 'Save',
  cancel: 'Cancel',
  remove: 'Remove',
  retry: 'Retry',
  clearAll: 'Clear all',
  download: 'Download',
  import: 'Import',
  importEvents: 'Import events',
  imported: 'Imported',
  loading: 'Loading…',
  error: 'Something went wrong',
  noEvents: 'No events on this day',
  emptyDayHint: 'Click any day to see its events',
  emptyAgendaHint: 'Try another month or enable more event sources',
  emptySearchHint: 'Try a different search term',
  moreEvents: '{n} more',
  upcoming: 'Upcoming',
  past: 'Past',
  allDay: 'All day',
  dayOff: 'Day off',
  dayOffNotice: 'Official holiday — day off',
  weekend: 'Weekend',

  systemGregorian: 'Gregorian',
  systemJalali: 'Shamsi (Jalali)',
  systemImperial: 'Persian Imperial',
  systemImperialHint: 'Ancient royal calendar — Shahanshahi era of Cyrus the Great (559 BCE): year = Jalali + 1180; 30-day months, 5 Andarjah days, devotional day names',
  calendarSystem: 'Calendar system',
  language: 'Language',
  weekStart: 'Week starts on',
  weekStartSat: 'Saturday',
  weekStartSun: 'Sunday',
  weekStartMon: 'Monday',
  showWeekNumbers: 'Week numbers',

  // Date converter dialog
  converter: 'Convert date',
  converterDesc: 'Convert any date between the Gregorian, Jalali and Imperial calendars.',
  converterOpen: 'Open date converter',
  converterToday: 'Use today',
  converterGo: 'Show in calendar',
  converterInvalid: 'Invalid date',
  shortcutConverter: 'Date converter',

  // iOS Add-to-Home-Screen hint
  iosInstallHint: 'Install: Share → Add to Home Screen',

  // Header artwork theme (round 13)
  headerTheme: 'Header theme',
  themeSeasonal: 'Seasonal',
  themeCelestial: 'Celestial',
  themeMagical: 'Magical',
  themeShahanshahi: 'Shahanshahi',
  themeJapanese: 'Japanese',
  themeKorean: 'Korean',
  themeChinese: 'Chinese',

  // Hijri year visibility + horoscope
  showHijri: 'Show Hijri year',
  showHoroscope: 'Daily horoscope',
  horoscopeTitle: 'Horoscope',
  horoscopeMood: 'Mood',
  horoscopeLuckyNumber: 'Lucky number',
  horoscopeLuckyColor: 'Lucky color',
  horoscopeAdvice: 'Advice',

  // week-number column labels
  weekNumCol: 'Wk',
  weekNumLabel: 'Week {n}',

  // Round 14: extra calendar systems
  systemImperialSolar: 'Shahanshahi year (Shamsi)',
  systemImperialSolarHint: 'Imperial year with the standard solar (Jalali) months and days',
  systemAncient: 'Ancient (Fasli)',
  systemAncientHint: '30-day months + Andarjah, with ancient Zoroastrian month names',
  eraAncient: 'Ancient era',

  // Round 14: royal month names toggle
  royalMonthNames: 'Royal (ancient) month names',
  royalMonthNamesHint: 'Use the ancient month names (Amordad, Spandarmad) in the Imperial calendars',

  // Round 14: weekly day-off option
  weekendDay: 'Weekly day off',
  weekendAuto: 'Auto (follow language)',
  weekendNone: 'None',
  weekendFriday: 'Friday',
  weekendSaturday: 'Saturday',
  weekendSunday: 'Sunday',

  // Round 14: sun times card
  sunTimesTitle: 'Sun times',
  sunDawn: 'Dawn',
  sunSunrise: 'Sunrise',
  sunNoon: 'Solar noon',
  sunSunset: 'Sunset',
  sunDusk: 'Dusk',
  sunLocation: 'Location',
  sunUseMyLocation: 'Use my location',
  sunLocating: 'Locating…',
  sunLocError: 'Location unavailable',
  sunPolarNight: 'Polar night',
  sunMidnightSun: 'Midnight sun',

  // Round 14: world clock
  worldClockTitle: 'World clock',
  worldClockAdd: 'Add city',
  worldClockEmpty: 'Add time zones to compare times around the world.',
  worldClockTomorrow: 'next day',
  worldClockYesterday: 'previous day',

  // Round 14: city names (sun location + world clock)
  cityTehran: 'Tehran',
  cityTokyo: 'Tokyo',
  citySeoul: 'Seoul',
  cityBeijing: 'Beijing',
  cityNewYork: 'New York',
  cityLondon: 'London',
  cityParis: 'Paris',
  cityDubai: 'Dubai',
  citySydney: 'Sydney',
  cityLosAngeles: 'Los Angeles',

  // Round 14: APK download
  apkDownload: 'Get the Android app (APK)',
  apkHint: 'Download and install the Android version on your phone.',

  eventSources: 'Event & holiday sources',
  srcInternational: 'International events',
  srcUs: 'United States holidays',
  srcJapan: 'Japan holidays',
  srcPersianCultural: 'Persian cultural events',
  srcPersianReligious: 'Persian religious events',
  srcPersianNational: 'Iranian national holidays',
  srcImported: 'Imported events',
  onlineSources: 'Online sources',
  onlineHint: 'Fetch public holidays live from the internet (Nager.Date). Falls back to the built-in dataset offline.',
  religiousHiddenHolidayNote: 'Religious events are hidden, but official holidays still appear as days off.',

  importTitle: 'Import events',
  importHint: 'Upload a JSON, TXT, CSV or iCalendar (.ics) file with your events. Jalali (e.g. 1405-07-01) and Gregorian (2026-10-01) dates are auto-detected. ICS has no day-off flag — mark day-offs after import.',
  importChooseFile: 'Choose file',
  importParsing: 'Parsing file…',
  importResult: 'events imported',
  importInvalid: 'No valid events found in the file',
  sampleFiles: 'Sample files',
  importFormatJson: 'JSON format',
  importFormatTxt: 'TXT format',
  importFormatCsv: 'CSV format',
  importedEventsList: 'Imported events',
  noImportedEvents: 'No imported events yet',
  deleteImported: 'Delete imported events',
  eventTitle: 'Title',
  eventDescription: 'Description',
  eventDate: 'Date',

  timeSync: 'Time sync (NTP)',
  timeSyncOk: 'In sync',
  timeSyncOff: 'Device clock',
  timeSyncChecking: 'Syncing…',
  timeSyncFailed: 'Sync failed',
  ntpServer: 'NTP server',
  offset: 'Offset',
  syncNow: 'Sync now',
  deviceClock: 'Device time',
  serverClock: 'Celestial time',

  footerNote: 'Celestial — Gregorian · Shamsi · Persian Imperial, with love for all calendars.',
  seasonSpring: 'Spring',
  seasonSummer: 'Summer',
  seasonAutumn: 'Autumn',
  seasonWinter: 'Winter',
  eraGregorian: 'CE',
  eraJalali: 'SH',
  eraImperial: 'Shahanshahi',
  hijriLabel: 'AH',
  secondaryDate: 'Secondary date',
  eventsCount: 'events',
  holidayBadge: 'Holiday',
  religiousBadge: 'Religious',
  culturalBadge: 'Cultural',
  nationalBadge: 'National',
  categoryLabel: 'Category',
  todayIs: 'Today is',
  quickAdd: 'Quick add',
  none: 'None',
  days: 'days',
  months: 'months',
  years: 'years',
  andarjah: 'Andarjah',
  dayNameLabel: 'Devotional day',
  yearOverview: 'Year overview',
  goToday: 'Go to today',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  selectDate: 'Select date',

  moonPhaseTitle: 'Moon phase',
  moonNew: 'New Moon',
  moonWaxingCrescent: 'Waxing Crescent',
  moonFirstQuarter: 'First Quarter',
  moonWaxingGibbous: 'Waxing Gibbous',
  moonFull: 'Full Moon',
  moonWaningGibbous: 'Waning Gibbous',
  moonLastQuarter: 'Last Quarter',
  moonWaningCrescent: 'Waning Crescent',
  moonIllumination: 'Illumination',
  moonAge: 'Moon age',

  addEvent: 'Add event',
  addEventTitle: 'New event',
  addEventDate: 'Date',
  addEventName: 'Title',
  addEventNamePh: 'e.g. Family gathering',
  addEventDesc: 'Description',
  addEventHoliday: 'Mark as day off',
  addEventSaved: 'Event added',
  sourceManual: 'Manual',

  shortcuts: 'Shortcuts',
  shortcutsPrev: 'Previous',
  shortcutsNext: 'Next',
  shortcutsNote: 'Arrow keys are physical: ← always goes to the previous period, even in right-to-left mode.',

  exportIcs: 'Export .ics',
  exportIcsDone: 'Exported {n} events',

  seasonMarEquinox: 'March equinox',
  seasonJunSolstice: 'June solstice',
  seasonSepEquinox: 'September equinox',
  seasonDecSolstice: 'December solstice',
  seasonOccursAt: 'Occurs at {t}',
  seasonNoteEqual: 'Day and night are about equal',
  seasonNoteLongest: 'Longest day of the year (N. hemisphere)',
  seasonNoteShortest: 'Shortest day of the year (N. hemisphere)',

  importFormatIcs: 'Calendar file (.ics) — Google/Apple/Outlook exports; yearly RRULE and multi-day events supported',

  addEventYearly: 'Repeats every year',
  addEventYearlyHint: 'Birthdays, anniversaries',
  recurringYearly: 'Repeats yearly',

  editEvent: 'Edit event',
  eventUpdated: 'Event updated',
  deleteEvent: 'Delete event',
  saveChanges: 'Save changes',

  nextDayOff: 'Next day off: {name} · in {n} days',
  nextDayOffToday: 'Next day off today: {name}',

  eventColor: 'Color',
  eventColorNone: 'Default',
  eventColorHint: "Personalize this event's dot",

  statsTitle: 'Year in numbers',
  statsTotal: '{n} events',
  statsDayOffs: '{n} day-offs',
  statsBusiest: 'Busiest: {month}',
  statsRecurring: '{n} recurring',

  installApp: 'Install app',
  installDone: 'Celestial installed — see you on your home screen',
  offlineReady: 'Offline-ready',

  zodiacAries: 'Aries',
  zodiacTaurus: 'Taurus',
  zodiacGemini: 'Gemini',
  zodiacCancer: 'Cancer',
  zodiacLeo: 'Leo',
  zodiacVirgo: 'Virgo',
  zodiacLibra: 'Libra',
  zodiacScorpio: 'Scorpio',
  zodiacSagittarius: 'Sagittarius',
  zodiacCapricorn: 'Capricorn',
  zodiacAquarius: 'Aquarius',
  zodiacPisces: 'Pisces',
  zodiacChipDesc: 'Zodiac of {month}: {sign}',

  // Offline indicator (PWA round 2)
  offlineTitle: 'Offline',
  offlineDesc: 'Showing cached and built-in data',

  // Event notifications (opt-in, settings toggle)
  settingsNotifications: 'Event notifications',
  notifDesc: 'Notify me about today\u2019s holidays and events',
  notifPermissionDenied: 'Notification permission was denied by the browser',
  notifGranted: 'Notifications enabled',
  notifTest: 'Send test notification',
  notifTitle: 'Celestial — {date}',
  notifBody: 'Today: {names}',

  // Backup / restore (settings → data section)
  settingsDataSection: 'Data',
  backupDesc: 'Export or restore your events and settings',
  exportData: 'Export data',
  importBackup: 'Import backup',
  backupExported: 'Backup downloaded ({count} events)',
  backupImported: 'Restored {count} events',
  backupImportError: 'Invalid backup file',
  backupReplaceConfirm: 'Replace all existing events with the backup? This cannot be undone.',

  // Print (month view toolbar + shortcuts dialog)
  printMonth: 'Print',
  printDesc: 'Print the current month',
  shortcutPrint: 'Print current view',
};

// Gregorian month names (en)
export const enGregorianMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Jalali month names (en transliteration)
export const enJalaliMonths = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
];

// Weekdays short (en), index 0=Sunday
export const enWeekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const enWeekdaysLong = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
