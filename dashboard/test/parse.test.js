import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  adoptCalendar, adoptWeather, adoptShopping,
  columnsFor, eventsInColumn, eventsOverlapping,
  clockAnchor, parseWhen, parseGenerated, formatNyTime, formatNyStatus
} from '../js/parse.js';

// The frame's calendar.json. Times have no offset. people is empty.
// location, loc, notes, and travelMinutes may be null.
const FRAME_CALENDAR = {
  generated: '2026-10-24T12:00:00',
  events: [
    {
      title: 'test event',
      start: '2026-10-24T13:30:00',
      end: '2026-10-24T14:30:00',
      allDay: false,
      people: [],
      location: null,
      loc: null,
      notes: null,
      travelMinutes: null
    },
    {
      title: 'afternoon event',
      start: '2026-10-24T15:00:00',
      end: '2026-10-24T16:00:00',
      allDay: false,
      people: [],
      location: null,
      loc: 'Kitchen',
      notes: null,
      travelMinutes: null
    }
  ]
};

const SAMPLE_TITLES = [
  'Pajama Day at school',
  'Gym',
  'Design review',
  'Piano lesson',
  'Soccer practice'
];
const SAMPLE_NAMES = ['Wes', 'Claudia', 'Buzzsaw', 'Skidmark'];

test('frame calendar with nulls and empty people replaces the sample', () => {
  const live = adoptCalendar(FRAME_CALENDAR);
  assert.equal(live.ok, true);
  assert.deepEqual(live.events.map((e) => e.title), ['test event', 'afternoon event']);
  assert.equal(live.events.length, FRAME_CALENDAR.events.length);
  assert.deepEqual(live.events[0].people, []);
  assert.equal(live.events[0].loc, undefined);
  assert.equal(live.events[0].notes, undefined);
  assert.equal(live.events[0].travel, undefined);
  assert.equal(live.events[0].allDay, false);
  assert.equal(live.events[1].loc, 'Kitchen');
  assert.equal(live.events[0].start.getHours(), 13);
  assert.equal(live.events[0].start.getMinutes(), 30);
  assert.equal(live.events[1].start.getHours(), 15);

  for (const title of SAMPLE_TITLES) {
    assert.equal(live.events.some((e) => e.title === title), false);
  }

  assert.equal(live.columns.length, 1);
  assert.equal(live.columns[0].all, true);
  assert.equal(live.columns[0].name, 'Calendar');
  for (const name of SAMPLE_NAMES) {
    assert.equal(live.columns.some((c) => c.name === name), false);
  }

  const shown = eventsInColumn(live.events, live.columns[0], live.columns);
  assert.deepEqual(shown.map((e) => e.title), ['test event', 'afternoon event']);
});

test('a past event stays in the parsed list and on that day', () => {
  const live = adoptCalendar(FRAME_CALENDAR);
  const day = new Date(2026, 9, 24);
  const next = new Date(2026, 9, 25);
  const today = eventsOverlapping(live.events, day, next);
  assert.deepEqual(today.map((e) => e.title), ['test event', 'afternoon event']);
  // 4 PM, after the 1:30 event has ended. It is still today's event.
  const afternoon = new Date(2026, 9, 24, 16, 0, 0);
  assert.equal(today.some((e) => e.end <= afternoon && e.title === 'test event'), true);
});

test('location string is used when loc is null, and travelMinutes is kept', () => {
  const live = adoptCalendar({
    events: [{
      title: 'Dentist',
      start: '2026-10-24T09:00:00',
      end: '2026-10-24T09:30:00',
      allDay: false,
      people: [],
      location: 'Bright Smiles',
      loc: null,
      notes: null,
      travelMinutes: 15
    }]
  });
  assert.equal(live.ok, true);
  assert.equal(live.events[0].loc, 'Bright Smiles');
  assert.equal(live.events[0].travel, 15);
  assert.equal(live.events[0].notes, undefined);
});

test('empty events array is live and empty, not a reason to keep the sample', () => {
  const live = adoptCalendar({ generated: '2026-10-24T12:00:00', events: [] });
  assert.equal(live.ok, true);
  assert.deepEqual(live.events, []);
  assert.equal(live.columns.length, 1);
  assert.equal(eventsInColumn(live.events, live.columns[0], live.columns).length, 0);
});

test('one bad event is skipped and the rest of the file still wins', () => {
  const live = adoptCalendar({
    events: [
      { title: 'ok', start: '2026-10-24T15:00:00', end: '2026-10-24T16:00:00', people: [] },
      { title: '', start: '2026-10-24T17:00:00', end: '2026-10-24T18:00:00' },
      { title: 'also ok', start: '2026-10-25T09:00:00', end: '2026-10-25T10:00:00', people: [null, ''] }
    ]
  });
  assert.equal(live.ok, true);
  assert.deepEqual(live.events.map((e) => e.title), ['ok', 'also ok']);
  assert.deepEqual(live.events[1].people, []);
});

test('a file that is not a calendar does not count as live', () => {
  assert.equal(adoptCalendar(null).ok, false);
  assert.equal(adoptCalendar([]).ok, false);
  assert.equal(adoptCalendar({ generated: '2026-10-24T12:00:00' }).ok, false);
});

test('one calendar is a single full-width column of every event', () => {
  const live = adoptCalendar({
    name: 'Ignored when calendars is set',
    calendars: [{ id: 'home', name: 'Bobby', color: '#2255AA' }],
    events: [
      { title: 'unassigned', start: '2026-10-24T13:30:00', end: '2026-10-24T14:30:00', people: [] },
      { title: 'tagged', start: '2026-10-24T15:00:00', end: '2026-10-24T16:00:00', calendar: 'home', people: [] }
    ]
  });
  assert.equal(live.columns.length, 1);
  assert.equal(live.columns[0].name, 'Bobby');
  assert.equal(live.columns[0].color, '#2255AA');
  assert.equal(live.columns[0].all, true);
  const shown = eventsInColumn(live.events, live.columns[0], live.columns);
  assert.deepEqual(shown.map((e) => e.title), ['unassigned', 'tagged']);
});

test('several calendars become one column each', () => {
  const live = adoptCalendar({
    calendars: [
      { id: 'home', name: 'Home', color: '#2255AA' },
      { id: 'work', name: 'Work', color: '#AA3322' }
    ],
    events: [
      { title: 'Dentist', start: '2026-10-24T13:30:00', end: '2026-10-24T14:30:00', calendar: 'home', people: [] },
      { title: 'Standup', start: '2026-10-24T15:00:00', end: '2026-10-24T15:30:00', calendar: 'work', people: [] },
      { title: 'Loose', start: '2026-10-24T18:00:00', end: '2026-10-24T19:00:00', people: [] }
    ]
  });
  assert.deepEqual(live.columns.map((c) => c.name), ['Home', 'Work']);
  const home = eventsInColumn(live.events, live.columns[0], live.columns);
  const work = eventsInColumn(live.events, live.columns[1], live.columns);
  assert.deepEqual(home.map((e) => e.title), ['Loose', 'Dentist']);
  assert.deepEqual(work.map((e) => e.title), ['Standup']);
});

test('several people become one column each, with no built-in names', () => {
  const live = adoptCalendar({
    events: [
      { title: 'Sam thing', start: '2026-10-24T09:00:00', end: '2026-10-24T10:00:00', people: ['sam'] },
      { title: 'Jo thing', start: '2026-10-24T11:00:00', end: '2026-10-24T12:00:00', people: ['jo'] },
      { title: 'Household', start: '2026-10-24T13:00:00', end: '2026-10-24T14:00:00', people: [] }
    ]
  });
  assert.deepEqual(live.columns.map((c) => c.name), ['sam', 'jo']);
  for (const name of SAMPLE_NAMES) {
    assert.equal(live.columns.some((c) => c.name === name), false);
  }
  const sam = eventsInColumn(live.events, live.columns[0], live.columns);
  assert.deepEqual(sam.map((e) => e.title), ['Household', 'Sam thing']);
  const jo = eventsInColumn(live.events, live.columns[1], live.columns);
  assert.deepEqual(jo.map((e) => e.title), ['Jo thing']);
});

test('root name labels the single column when calendars is absent', () => {
  const live = adoptCalendar({
    name: 'Family',
    events: [{ title: 'Lunch', start: '2026-10-24T12:00:00', end: '2026-10-24T13:00:00', people: [] }]
  });
  assert.equal(live.columns.length, 1);
  assert.equal(live.columns[0].name, 'Family');
});

test('4-digit and 8-digit hex colors are ignored', () => {
  const cols = columnsFor([], [
    { id: 'a', name: 'A', color: '#abcd' },
    { id: 'b', name: 'B', color: '#aabbccdd' }
  ], '');
  assert.equal(cols[0].color, null);
  assert.equal(cols[1].color, null);
});

test('a bad device clock uses generated, then the Date header', () => {
  const boot = new Date(1969, 11, 31, 19, 0, 0);
  const fromFile = clockAnchor(boot, '2026-10-24T13:00:00', 'Sat, 24 Oct 2026 18:00:00 GMT');
  assert.equal(fromFile.getFullYear(), 2026);
  assert.equal(fromFile.getMonth(), 9);
  assert.equal(fromFile.getDate(), 24);
  assert.equal(fromFile.getHours(), 13);

  const fromHeader = clockAnchor(boot, null, 'Sat, 24 Oct 2026 18:05:00 GMT');
  assert.equal(fromHeader.getFullYear(), 2026);

  const fine = new Date(2026, 9, 24, 15, 0, 0);
  assert.equal(clockAnchor(fine, '2026-10-24T13:00:00', null), null);
});

test('shopping list replaces the sample, including an empty list', () => {
  const live = adoptShopping({
    generated: '2026-10-24T08:00:00',
    items: [
      { title: 'Oat milk', done: false },
      { title: 'Eggs', done: true }
    ]
  });
  assert.equal(live.ok, true);
  assert.deepEqual(live.items, [
    { title: 'Oat milk', done: false },
    { title: 'Eggs', done: true }
  ]);
  const empty = adoptShopping({ items: [], generated: '2026-10-24T08:00:00' });
  assert.equal(empty.ok, true);
  assert.deepEqual(empty.items, []);
  assert.equal(adoptShopping({ groceries: [] }).ok, false);
});

test('Open-Meteo Fahrenheit New York weather is accepted', () => {
  const raw = JSON.parse(fs.readFileSync(new URL('../examples/data/weather.json', import.meta.url), 'utf8'));
  const live = adoptWeather(raw);
  assert.equal(live.ok, true);
  assert.equal(live.weather.live, true);
  assert.equal(live.weather.current.temp, raw.current.temperature_2m);
  assert.ok(live.weather.hours.length > 24);

  const celsius = JSON.parse(JSON.stringify(raw));
  celsius.current_units.temperature_2m = '°C';
  assert.equal(adoptWeather(celsius).ok, false);
  assert.deepEqual(live.weather.days, []);
});

test('daily forecast is the next five days and is optional', () => {
  const raw = JSON.parse(fs.readFileSync(new URL('../examples/data/weather.json', import.meta.url), 'utf8'));
  const withDaily = JSON.parse(JSON.stringify(raw));
  withDaily.daily_units = { temperature_2m_max: '°F', temperature_2m_min: '°F' };
  withDaily.daily = {
    time: ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'],
    temperature_2m_max: [70, 68, 65, 60, 58, 55],
    temperature_2m_min: [50, 48, 46, 44, 42, 40],
    weather_code: [0, 1, 3, 61, 2, 0],
    precipitation_probability_max: [0, 10, 19, 40, 80, null]
  };
  const live = adoptWeather(withDaily);
  assert.equal(live.ok, true);
  assert.equal(live.weather.days.length, 6);
  assert.equal(live.weather.days[0].d, 24);
  const next = live.weather.days.slice(1, 6);
  assert.equal(next.length, 5);
  assert.deepEqual(next.map((d) => d.hi), [68, 65, 60, 58, 55]);
  assert.equal(next[2].code, 61);
  assert.equal(next[0].precip, 10);
  assert.equal(next[1].precip, 19);
  assert.equal(next[2].precip, 40);
  assert.equal(next[4].precip, null);
  assert.equal(live.weather.current.temp, raw.current.temperature_2m);

  const missing = JSON.parse(JSON.stringify(raw));
  delete missing.daily;
  const noDaily = adoptWeather(missing);
  assert.equal(noDaily.ok, true);
  assert.deepEqual(noDaily.weather.days, []);

  const broken = JSON.parse(JSON.stringify(raw));
  broken.daily = { time: 'nope' };
  const still = adoptWeather(broken);
  assert.equal(still.ok, true);
  assert.equal(still.weather.hours.length, live.weather.hours.length);
  assert.deepEqual(still.weather.days, []);

  const cDaily = JSON.parse(JSON.stringify(withDaily));
  cDaily.daily_units.temperature_2m_max = '°C';
  const hidden = adoptWeather(cDaily);
  assert.equal(hidden.ok, true);
  assert.deepEqual(hidden.weather.days, []);
});

test('footer time follows calendar generated in America/New_York', () => {
  const later = parseGenerated('2026-10-24T14:45:00-04:00');
  const earlier = parseGenerated('2026-10-24T14:30:00-04:00');
  assert.equal(formatNyTime(later), '2:45 PM');
  assert.equal(formatNyTime(earlier), '2:30 PM');
  const now = new Date('2026-10-24T18:00:00-04:00');
  assert.equal(formatNyStatus(later, now), '2:45 PM');
  const yesterday = parseGenerated('2026-10-23T14:45:00-04:00');
  assert.equal(formatNyStatus(yesterday, now), 'Oct 23 2:45 PM');
});

test('parseWhen accepts the no-offset form used on the server', () => {
  const d = parseWhen('2026-10-24T13:30:00');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getHours(), 13);
  assert.equal(d.getMinutes(), 30);
  const zoned = parseWhen('2026-10-24T13:30:00-04:00');
  assert.equal(zoned.getHours(), 13);
});
