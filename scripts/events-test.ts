import { expandBuiltinYear } from '../src/lib/events/expand';
import { aggregateEvents, defaultSourceSettings } from '../src/lib/events/index';
import { parseAuto } from '../src/lib/import/parse';

// 2026 spot checks
const inst = expandBuiltinYear(2026);
const nowruz = inst.find(e => e.ruleId === 'pn-nowruz1');
console.log('Nowruz 2026:', nowruz?.iso, '(expect 2026-03-21)');
const yalda = inst.find(e => e.ruleId === 'pc-yalda');
console.log('Yalda 1405:', yalda?.iso, '(Azar 30 1405 => expect 2026-12-21)');
const ashura = inst.find(e => e.ruleId === 'pr-ashura');
console.log('Ashura 1448:', ashura?.iso, '(expect 2026-07-25?)');
const eidFitr = inst.find(e => e.ruleId === 'pr-eid-fitr');
console.log('Eid al-Fitr 2026:', eidFitr?.iso, '(expect 2026-03-20)');
const july4 = inst.find(e => e.ruleId === 'us-independence');
console.log('US Independence 2026:', july4?.iso, '(expect 2026-07-04)');
const jpSports = inst.find(e => e.ruleId === 'jp-sports');
console.log('JP Sports Day 2026:', jpSports?.iso, '(expect 2026-10-12)');
const cs = inst.find(e => e.ruleId === 'pc-charshanbe-suri');
console.log('Charshanbe Suri 1405:', cs?.iso, '(last Tuesday of Esfand 1405 => expect 2027-03-16)');
const total = inst.length;
console.log('Total instances 2026:', total);
const holidays = inst.filter(e => e.isHoliday).length;
console.log('Holiday instances 2026:', holidays);

// aggregate with religious hidden
const agg = await aggregateEvents('2026-01-01', '2026-12-31', { ...defaultSourceSettings, persianReligious: false, online: false }, []);
const hiddenButHoliday = agg.events.filter(e => e.holidayOnly);
console.log('holidayOnly instances (religious hidden):', hiddenButHoliday.length);
console.log('sample holidayOnly:', hiddenButHoliday[0]?.names.en, hiddenButHoliday[0]?.iso);

// import parsers
const csv = parseAuto('t.csv', `date,title,description,holiday
1405-07-01,"فارسی title","توضیح",holiday
2026-12-25,"Xmas","desc",
1405-10-30,"Yalda my own",""
not-a-date,"bad",""`);
console.log('CSV parse:', JSON.stringify(csv, null, 1).slice(0, 400));
const txt = parseAuto('t.txt', `# comment
1405-07-01 | تیرگان جشن | توضیح
2026-10-31 | Halloween | spooky
bad | line`);
console.log('TXT parse:', JSON.stringify(txt, null, 1).slice(0, 400));
const json = parseAuto('t.json', `{"events":[{"date":"1405-01-01","title":"جشن نوروز شخصی","description":"دعوت","calendar":"jalali"}]}`);
console.log('JSON parse:', JSON.stringify(json, null, 1).slice(0, 300));
