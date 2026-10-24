// Pure parsers for /frame/data/*.json. No DOM, no sample data.
// A parsed file replaces the sample entirely. Callers must not concatenate.

export function parseWhen(v) {
  if (typeof v !== 'string') return null;
  var s = v.trim();
  // Wall-clock digits only. A trailing Z or offset is ignored so either form
  // still yields the clock time written in the file (the frame is America/New_York).
  var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (!m) return null;
  var d = new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, 0);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return d;
}

export function parseGenerated(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && isFinite(v)) {
    var ms = v < 1e12 ? v * 1000 : v;
    var d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v !== 'string') return null;
  var s = v.trim();
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) {
    var p = Date.parse(s);
    return isNaN(p) ? null : new Date(p);
  }
  return parseWhen(s);
}

export function parseHttpDate(v) {
  if (typeof v !== 'string' || !v.trim()) return null;
  var p = Date.parse(v);
  return isNaN(p) ? null : new Date(p);
}

var NY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function nyDateParts(date) {
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit', hourCycle: 'h23'
  });
  var map = {};
  var parts = fmt.formatToParts(date);
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].type !== 'literal') map[parts[i].type] = parts[i].value;
  }
  var month = +map.month;
  return { y: +map.year, m: month, d: +map.day, mon: NY_MONTHS[month - 1] || '' };
}

// Footer clock. Always America/New_York, so an offset stamp like
// 2026-10-24T14:45:00-04:00 reads 2:45 PM even if the device zone is wrong.
export function formatNyTime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
  var hour = '', minute = '', period = '';
  var parts = fmt.formatToParts(date);
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].type === 'hour') hour = parts[i].value;
    else if (parts[i].type === 'minute') minute = parts[i].value;
    else if (parts[i].type === 'dayPeriod') period = parts[i].value;
  }
  if (!hour || !minute) return '';
  return hour + ':' + minute + (period ? ' ' + period : '');
}

export function formatNyStatus(date, now) {
  var time = formatNyTime(date);
  if (!time) return '';
  if (!(now instanceof Date) || isNaN(now.getTime())) return time;
  var a = nyDateParts(date);
  var b = nyDateParts(now);
  if (a.y === b.y && a.m === b.m && a.d === b.d) return time;
  return a.mon + ' ' + a.d + ' ' + time;
}

// Device clocks on this frame can boot in 1969 until NTP. Don't use that year
// to decide which events are "today". Returns null when the device clock is fine.
export function clockAnchor(deviceNow, generated, dateHeader) {
  if (!deviceNow || isNaN(deviceNow.getTime()) || deviceNow.getFullYear() >= 2024) return null;
  return parseGenerated(generated) || parseHttpDate(dateHeader) || null;
}

function text(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

function safeColor(v) {
  if (typeof v !== 'string') return null;
  var s = v.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s)) return s;
  return null;
}

function peopleOf(raw) {
  if (raw.people == null) return [];
  if (typeof raw.people === 'string' && raw.people.trim()) return [raw.people.trim()];
  if (!Array.isArray(raw.people)) return [];
  var out = [];
  for (var i = 0; i < raw.people.length; i++) {
    if (typeof raw.people[i] === 'string' && raw.people[i].trim()) out.push(raw.people[i].trim());
  }
  return out;
}

function placeOf(raw) {
  var loc = text(raw.loc);
  if (loc) return loc;
  return text(raw.location);
}

function travelOf(raw) {
  var v = raw.travelMinutes != null ? raw.travelMinutes : raw.travel;
  if (v == null || v === '') return 0;
  if (typeof v === 'string' && v.trim() && isFinite(+v)) v = +v;
  if (typeof v === 'number' && isFinite(v) && v > 0) return v;
  return 0;
}

function calendarIdOf(raw) {
  if (typeof raw.calendar === 'string' && raw.calendar.trim()) return raw.calendar.trim();
  if (typeof raw.calendar === 'number' && isFinite(raw.calendar)) return String(raw.calendar);
  return '';
}

function eventFrom(raw, index) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  var title = text(raw.title);
  if (!title) return null;
  var start = parseWhen(raw.start);
  if (!start) return null;
  var allDay = raw.allDay === true;
  var end = parseWhen(raw.end);
  if (!end) {
    if (!allDay) return null;
    end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
  } else if (end <= start) {
    if (!allDay) return null;
    end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
  }
  var ev = {
    id: text(raw.id) || ('e' + (index + 1)),
    title: title,
    start: start,
    end: end,
    people: peopleOf(raw),
    allDay: allDay
  };
  var loc = placeOf(raw);
  if (loc) ev.loc = loc;
  var notes = text(raw.notes);
  if (notes) ev.notes = notes;
  var travel = travelOf(raw);
  if (travel) ev.travel = travel;
  var cal = calendarIdOf(raw);
  if (cal) ev.calendar = cal;
  return ev;
}

function calendarsOf(raw) {
  if (!Array.isArray(raw)) return [];
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var c = raw[i];
    if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
    var id = text(c.id) || (typeof c.id === 'number' && isFinite(c.id) ? String(c.id) : '') || text(c.name) || ('cal' + (i + 1));
    var name = text(c.name) || id;
    out.push({ id: id, name: name, color: safeColor(c.color) });
  }
  return out;
}

// ok means the file is a calendar object. events may be empty — that is live
// data, and the screen must say "No events" rather than keep the sample.
export function adoptCalendar(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json) || !Array.isArray(json.events)) {
    return { ok: false, events: [], calendars: [], name: '', generated: null };
  }
  var events = [];
  for (var i = 0; i < json.events.length; i++) {
    var ev = eventFrom(json.events[i], i);
    if (ev) events.push(ev);
  }
  var calendars = calendarsOf(json.calendars);
  var name = text(json.name) || text(json.title);
  return {
    ok: true,
    events: events,
    calendars: calendars,
    name: name,
    generated: parseGenerated(json.generated),
    columns: columnsFor(events, calendars, name)
  };
}

export function columnsFor(events, calendars, name) {
  var cols = [];
  if (Array.isArray(calendars) && calendars.length) {
    for (var i = 0; i < calendars.length; i++) {
      var c = calendars[i];
      cols.push({ id: c.id, name: c.name, color: safeColor(c.color), kind: 'calendar', all: false });
    }
  }
  if (cols.length === 1) {
    cols[0].all = true;
    cols[0].kind = 'all';
    return cols;
  }
  if (cols.length > 1) return cols;

  var seen = [];
  var list = events || [];
  for (var e = 0; e < list.length; e++) {
    var people = list[e].people || [];
    for (var p = 0; p < people.length; p++) {
      if (seen.indexOf(people[p]) === -1) seen.push(people[p]);
    }
  }
  if (seen.length > 1) {
    return seen.map(function (id) {
      return { id: id, name: id, color: null, kind: 'person', all: false };
    });
  }
  var label = name || (seen.length === 1 ? seen[0] : 'Calendar');
  return [{ id: '*', name: label, color: null, kind: 'all', all: true }];
}

// Events with no person and no calendar id are included, never dropped.
// One column (all: true) receives every event. Extra columns split by id.
export function eventsInColumn(events, column, columns) {
  var list = events || [];
  if (!column || column.all || column.kind === 'all') return list.slice();
  var mine = [];
  var loose = [];
  var first = columns && columns.length && String(columns[0].id) === String(column.id);
  for (var i = 0; i < list.length; i++) {
    var ev = list[i];
    if (column.kind === 'person') {
      if (!ev.people || !ev.people.length) loose.push(ev);
      else if (ev.people.indexOf(column.id) !== -1) mine.push(ev);
    } else if (ev.calendar == null || ev.calendar === '') {
      loose.push(ev);
    } else if (String(ev.calendar) === String(column.id)) {
      mine.push(ev);
    }
  }
  return first ? loose.concat(mine) : mine;
}

export function eventsOverlapping(events, rangeStart, rangeEnd) {
  var out = [];
  var list = events || [];
  for (var i = 0; i < list.length; i++) {
    var ev = list[i];
    if (!ev || !ev.start || !ev.end) continue;
    if (ev.start < rangeEnd && ev.end > rangeStart) out.push(ev);
  }
  out.sort(function (a, b) { return a.start - b.start || a.end - b.end; });
  return out;
}

function num(v) { return typeof v === 'number' && isFinite(v); }

function parseStamp(v) {
  if (typeof v !== 'string') return null;
  var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (!m) return null;
  var hh = +m[4], mm = +m[5];
  if (hh > 23 || mm > 59) return null;
  var d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return { y: +m[1], m: +m[2], d: +m[3], h: hh, min: mm };
}

export function adoptWeather(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return { ok: false };
  if (json.timezone != null && json.timezone !== 'America/New_York') return { ok: false };
  var cu = json.current_units || {};
  var hu = json.hourly_units || {};
  if (cu.temperature_2m != null && cu.temperature_2m !== '°F') return { ok: false };
  if (hu.temperature_2m != null && hu.temperature_2m !== '°F') return { ok: false };
  var current = json.current;
  var hourly = json.hourly;
  if (!current || typeof current !== 'object' || Array.isArray(current)) return { ok: false };
  if (!hourly || typeof hourly !== 'object' || Array.isArray(hourly)) return { ok: false };
  if (!num(current.temperature_2m) || !num(current.weather_code)) return { ok: false };
  var times = hourly.time;
  var temps = hourly.temperature_2m;
  var codes = hourly.weather_code;
  var pops = hourly.precipitation_probability;
  if (!Array.isArray(times) || !Array.isArray(temps) || !Array.isArray(codes)) return { ok: false };
  if (pops != null && !Array.isArray(pops)) return { ok: false };
  var n = times.length;
  if (!n || temps.length !== n || codes.length !== n) return { ok: false };
  if (pops && pops.length !== n) return { ok: false };
  var hours = [];
  for (var i = 0; i < n; i++) {
    var stamp = parseStamp(times[i]);
    if (!stamp) return { ok: false };
    if (temps[i] == null && codes[i] == null) continue;
    if (!num(temps[i]) || !num(codes[i])) return { ok: false };
    var precip = pops && pops[i] != null ? pops[i] : 0;
    if (!num(precip) || precip < 0 || precip > 100) return { ok: false };
    hours.push({ y: stamp.y, m: stamp.m, d: stamp.d, h: stamp.h, temp: temps[i], code: codes[i], precip: precip });
  }
  if (!hours.length) return { ok: false };
  var cur = parseStamp(current.time);
  return {
    ok: true,
    generated: parseGenerated(json.generated),
    weather: {
      live: true,
      current: { temp: current.temperature_2m, code: current.weather_code, h: cur ? cur.h : null },
      hours: hours,
      days: parseDaily(json)
    }
  };
}

// Next days for the Today strip. Index 0 is today. Missing or unusable daily
// data yields [] and does not reject the current/hourly forecast.
function parseDay(v) {
  if (typeof v !== 'string') return null;
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return null;
  var d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}

function parseDaily(json) {
  var daily = json.daily;
  if (!daily || typeof daily !== 'object' || Array.isArray(daily)) return [];
  var units = json.daily_units || {};
  if (units.temperature_2m_max != null && units.temperature_2m_max !== '°F') return [];
  if (units.temperature_2m_min != null && units.temperature_2m_min !== '°F') return [];
  var times = daily.time;
  var hi = daily.temperature_2m_max;
  var lo = daily.temperature_2m_min;
  var codes = daily.weather_code;
  var pops = daily.precipitation_probability_max;
  if (!Array.isArray(times) || !Array.isArray(hi) || !Array.isArray(lo) || !Array.isArray(codes)) return [];
  if (pops != null && !Array.isArray(pops)) return [];
  var n = Math.min(times.length, hi.length, lo.length, codes.length);
  if (pops) n = Math.min(n, pops.length);
  var days = [];
  for (var i = 0; i < n; i++) {
    var day = parseDay(times[i]);
    if (!day || !num(hi[i]) || !num(lo[i]) || !num(codes[i])) continue;
    var precip = null;
    if (pops && pops[i] != null) {
      if (!num(pops[i]) || pops[i] < 0 || pops[i] > 100) continue;
      precip = pops[i];
    }
    days.push({
      y: day.y, m: day.m, d: day.d,
      hi: hi[i], lo: lo[i], code: codes[i], precip: precip
    });
  }
  return days;
}

export function adoptShopping(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json) || !Array.isArray(json.items)) {
    return { ok: false, items: [], generated: null };
  }
  var items = [];
  for (var i = 0; i < json.items.length; i++) {
    var raw = json.items[i];
    if (!raw || typeof raw !== 'object') continue;
    var title = text(raw.title) || text(raw.name);
    if (!title) continue;
    items.push({ title: title, done: raw.done === true });
  }
  return { ok: true, items: items, generated: parseGenerated(json.generated) };
}
