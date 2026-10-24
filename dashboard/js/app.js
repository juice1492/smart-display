// Core shell: router, demo clock, idle/ambient, toasts, sheets, helpers.
import { formatNyStatus } from './parse.js';

(function () {
  'use strict';
  var D = window.DATA;
  var App = window.App = { state: D, views: {}, current: null, mode: 'day', calMode: 'normal' };
  var $ = App.$ = function (s, r) { return (r || document).querySelector(s); };
  App.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ------------------------------------------------------------ events
  var handlers = {};
  App.on = function (e, fn) { (handlers[e] = handlers[e] || []).push(fn); };
  App.emit = function (e, a) { (handlers[e] || []).forEach(function (fn) { fn(a); }); };

  // ------------------------------------------------------------ time (demo clock)
  var offset = 0;
  App.now = function () { return new Date(Date.now() + offset); };
  App.setTime = function (h, m) {
    if (h == null) offset = 0;
    else { var d = new Date(); d.setHours(h, m, 0, 0); offset = d - Date.now(); }
    lastMin = -1;
    App.emit('time');
    App.rerender();
  };
  // Used when the device clock is still in 1969. `date` is the server's notion of now.
  App.setAnchor = function (date) {
    if (!date || isNaN(date.getTime())) return;
    offset = date.getTime() - Date.now();
    lastMin = -1;
    App.emit('time');
  };
  App.dayStart = function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  App.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  App.sameDay = function (a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
  App.isNight = function () { var h = App.now().getHours(); return h >= 22 || h < 6; };

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  App.fmt = {
    time: function (d, ampm) {
      var h = d.getHours(), m = d.getMinutes();
      var s = (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m;
      return ampm === false ? s : s + ' ' + (h >= 12 ? 'PM' : 'AM');
    },
    // "4 PM", "3:45 PM"
    hour: function (d) {
      var h = d.getHours(), m = d.getMinutes();
      return (h % 12 || 12) + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + (h >= 12 ? 'PM' : 'AM');
    },
    ampm: function (d) { return d.getHours() >= 12 ? 'PM' : 'AM'; },
    range: function (a, b) {
      var same = App.fmt.ampm(a) === App.fmt.ampm(b);
      return (same ? App.fmt.time(a, false) : App.fmt.time(a)) + ' – ' + App.fmt.time(b);
    },
    day: function (d) { return DAYS[d.getDay()]; },
    dayShort: function (d) { return DAYS[d.getDay()].slice(0, 3); },
    month: function (d) { return MONTHS[d.getMonth()]; },
    monthShort: function (d) { return MON_SHORT[d.getMonth()]; },
    mins: function (m) {
      m = Math.max(0, Math.round(m));
      if (m < 60) return m + ' min';
      var h = Math.floor(m / 60), r = m % 60;
      return h + ' hr' + (r ? ' ' + r + ' min' : '');
    },
    rel: function (d) {
      var t = App.dayStart(App.now()), x = App.dayStart(d), diff = Math.round((x - t) / 864e5);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';
      if (diff === -1) return 'Yesterday';
      return DAYS[d.getDay()];
    }
  };
  App.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ------------------------------------------------------------ icons + people
  App.icon = function (name, size, cls) {
    size = size || 24;
    return '<svg class="i ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (window.ICONS[name] || '') + '</svg>';
  };
  App.person = function (id) {
    if (id === 'family' || id === 'any') return D.family;
    for (var i = 0; i < D.people.length; i++) if (D.people[i].id === id) return D.people[i];
    return D.family;
  };
  App.pstyle = function (p) {
    if (typeof p === 'string') p = App.person(p);
    return '--c:' + p.color + ';--c-rgb:' + p.rgb + ';--c-ink:' + p.ink;
  };
  App.avatar = function (p, size, cls) {
    if (typeof p === 'string') p = App.person(p);
    size = size || 48;
    return '<span class="avatar ' + (cls || '') + '" style="' + App.pstyle(p) + ';width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.46) + 'px">' + (p.id === 'family' ? '★' : p.name[0]) + '</span>';
  };
  App.dots = function (ids, size) {
    return '<span class="dots">' + ids.map(function (id) { return '<i style="' + App.pstyle(id) + (size ? ';width:' + size + 'px;height:' + size + 'px' : '') + '"></i>'; }).join('') + '</span>';
  };

  // ------------------------------------------------------------ calendar helpers
  App.events = function () {
    var list = D.events.slice();
    var today = App.dayStart(App.now());
    if (App.calMode === 'busy') list = list.concat(D.busyExtras);
    if (App.calMode === 'empty') list = list.filter(function (e) { return e.allDay || !App.sameDay(e.start, today); });
    return list;
  };
  App.isFamily = function (e) { return !!(e.people && D.people.length && e.people.length >= D.people.length); };
  App.evColor = function (e) { return App.isFamily(e) ? D.family : App.person(e.people[0]); };
  App.timedOn = function (day, pid) {
    var s = App.dayStart(day), e = App.addDays(s, 1);
    return App.events().filter(function (ev) {
      return !ev.allDay && ev.start < e && ev.end > s && (!pid || ev.people.indexOf(pid) > -1);
    }).sort(function (a, b) { return a.start - b.start || b.end - a.end; });
  };
  App.allDayOn = function (day, pid) {
    var s = App.dayStart(day), e = App.addDays(s, 1);
    return App.events().filter(function (ev) {
      return ev.allDay && ev.start < e && ev.end > s && (!pid || ev.people.indexOf(pid) > -1);
    });
  };
  App.leaveBy = function (e) { return e.travel ? new Date(+e.start - e.travel * 60000) : e.start; };
  // The next thing someone needs to act on: earliest upcoming "leave by" today.
  App.nextEvent = function () {
    var now = App.now();
    var list = App.timedOn(now).filter(function (e) { return e.start > now; });
    list.sort(function (a, b) { return App.leaveBy(a) - App.leaveBy(b); });
    return list[0] || null;
  };
  App.findEvent = function (id) {
    return App.events().filter(function (e) { return e.id === id; })[0];
  };

  // ------------------------------------------------------------ chores + weather helpers
  App.currentRoutine = function () {
    var h = App.now().getHours();
    for (var i = 0; i < D.routines.length; i++) if (h >= D.routines[i].from && h < D.routines[i].to) return D.routines[i];
    return D.routines[2];
  };
  var WX_LABELS = { sun: 'Sunny', moon: 'Clear', partly: 'Partly cloudy', cloud: 'Overcast', rain: 'Rain' };
  function nyWall(date) {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    var map = {};
    fmt.formatToParts(date).forEach(function (p) { if (p.type !== 'literal') map[p.type] = p.value; });
    var hour = +map.hour;
    if (hour === 24) hour = 0;
    return { y: +map.year, m: +map.month, d: +map.day, h: hour, min: +map.minute };
  }
  function wallKey(w) { return w.y * 10000 + w.m * 100 + w.d; }
  function hourClock(h) { return (h % 12 || 12) + ' ' + (h >= 12 ? 'PM' : 'AM'); }
  // WMO code → icon name. Night (before 6 and from 8pm, New York) uses the moon for clear sky.
  function condFromCode(code, hour) {
    code = Math.round(code);
    var night = hour < 6 || hour >= 20;
    if (code === 0 || code === 1) return night ? 'moon' : 'sun';
    if (code === 2) return 'partly';
    if (code === 3 || code === 45 || code === 48) return 'cloud';
    if (code >= 51) return 'rain';
    return 'cloud';
  }
  function wxLabel(code, cond) {
    code = Math.round(code);
    if (code === 45 || code === 48) return 'Fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Snow';
    if (code >= 95) return 'Thunderstorm';
    return WX_LABELS[cond] || 'Cloudy';
  }
  function hourIndex(hours, now) {
    var target = wallKey(now) * 100 + now.h;
    var best = 0, bestKey = -1;
    for (var i = 0; i < hours.length; i++) {
      var k = wallKey(hours[i]) * 100 + hours[i].h;
      if (k <= target && k >= bestKey) { bestKey = k; best = i; }
    }
    return best;
  }
  function rainAdvice() {
    var soccer = App.timedOn(App.now()).filter(function (e) { return /soccer/i.test(e.title) && e.start > App.now(); })[0];
    return soccer ? 'Pack a rain jacket for soccer' : 'Grab a rain jacket';
  }
  function liveWeather(W) {
    var now = nyWall(App.now());
    var hours = W.hours;
    var idx = hourIndex(hours, now);
    var slot = hours[idx];
    var temp = Math.round(W.current.temp);
    var code = W.current.code;
    var iconHour = W.current.h == null ? now.h : W.current.h;
    var cond = condFromCode(code, iconHour);
    var today = wallKey(now);
    var hi = -Infinity, lo = Infinity, anyToday = false;
    for (var i = 0; i < hours.length; i++) {
      if (wallKey(hours[i]) !== today) continue;
      anyToday = true;
      if (hours[i].temp > hi) hi = hours[i].temp;
      if (hours[i].temp < lo) lo = hours[i].temp;
    }
    if (!anyToday) {
      hi = -Infinity; lo = Infinity;
      for (var j = 0; j < hours.length; j++) {
        if (hours[j].temp > hi) hi = hours[j].temp;
        if (hours[j].temp < lo) lo = hours[j].temp;
      }
    }
    var rainAt = -1;
    for (var r = idx; r < hours.length; r++) {
      if (wallKey(hours[r]) !== today) break;
      if (hours[r].precip >= 50) { rainAt = r; break; }
    }
    var summary, advice;
    if (rainAt === idx) {
      var stop = rainAt + 1;
      while (stop < hours.length && wallKey(hours[stop]) === today && hours[stop].precip >= 50) stop++;
      summary = stop < hours.length && wallKey(hours[stop]) === today
        ? 'Rain until ' + hourClock(hours[stop].h)
        : 'Rain through this evening';
      advice = 'Umbrella weather';
    } else if (rainAt > -1) {
      summary = 'Rain from ' + hourClock(hours[rainAt].h);
      advice = rainAdvice();
    } else {
      summary = temp < 55 ? 'Clear and cool' : 'Dry all day';
      advice = temp < 55 ? 'Jacket weather' : 'Light layers';
    }
    return {
      temp: temp, cond: cond, label: wxLabel(code, cond),
      hi: Math.round(hi), lo: Math.round(lo),
      summary: summary, advice: advice, hour: iconHour
    };
  }
  App.weatherNow = function () {
    var W = D.weather;
    if (W.live) return liveWeather(W);
    var h = App.now().getHours();
    var rainAt = -1;
    for (var i = h; i < 24; i++) if (W.p[i] >= 50) { rainAt = i; break; }
    var summary, advice;
    if (rainAt === h) {
      var stop = h; while (stop < 24 && W.p[stop] >= 50) stop++;
      summary = 'Rain until ' + App.fmt.hour(new Date(2000, 0, 1, stop));
      advice = 'Umbrella weather';
    } else if (rainAt > -1) {
      summary = 'Rain from ' + App.fmt.hour(new Date(2000, 0, 1, rainAt));
      advice = rainAdvice();
    } else {
      summary = W.t[h] < 12 ? 'Clear and cool' : 'Dry all day';
      advice = W.t[h] < 12 ? 'Jacket weather' : 'Light layers';
    }
    return { temp: W.t[h], cond: W.c[h], label: WX_LABELS[W.c[h]], hi: W.hi, lo: W.lo, summary: summary, advice: advice, hour: h };
  };
  App.hourly = function (count) {
    var W = D.weather, out = [], i;
    if (W.live) {
      var idx = hourIndex(W.hours, nyWall(App.now()));
      for (i = 0; i < count && idx + i < W.hours.length; i++) {
        var slot = W.hours[idx + i];
        var x = slot.h;
        out.push({
          h: x, t: Math.round(slot.temp), c: condFromCode(slot.code, x), p: slot.precip,
          label: i === 0 ? 'Now' : ((x % 12 || 12) + (x >= 12 ? 'p' : 'a'))
        });
      }
      return out;
    }
    var h = App.now().getHours();
    for (i = 0; i < count; i++) {
      var hx = (h + i) % 24;
      out.push({ h: hx, t: W.t[hx], c: W.c[hx], p: W.p[hx], label: i === 0 ? 'Now' : ((hx % 12 || 12) + (hx >= 12 ? 'p' : 'a')) });
    }
    return out;
  };
  // Next 5 daily rows (weather.days[1..5]). Index 0 is today and stays off the strip.
  App.forecastDays = function () {
    var W = D.weather;
    if (!W || !W.days || !W.days.length) return [];
    var out = [];
    for (var i = 1; i < W.days.length && out.length < 5; i++) {
      var day = W.days[i];
      var date = new Date(day.y, day.m - 1, day.d);
      out.push({
        label: App.fmt.dayShort(date),
        cond: condFromCode(day.code, 12),
        hi: Math.round(day.hi),
        lo: Math.round(day.lo),
        precip: day.precip
      });
    }
    return out;
  };

  // ------------------------------------------------------------ router
  App.register = function (name, view) { App.views[name] = view; };
  // Views are built once and kept laid out (hidden with content-visibility), so switching tabs
  // only has to paint. A view is rebuilt when its data changed ('data'/'time' events) or, for
  // time-sensitive views (minutely: true), when the minute has rolled over since it was built.
  function minuteKey() { return Math.floor(App.now().getTime() / 60000); }
  function build(name, opts) {
    var view = App.views[name];
    view.show($('#view-' + name), opts || {});
    view._built = true; view._dirty = false; view._min = minuteKey();
  }
  App.go = function (name, opts) {
    opts = opts || {};
    if (!App.views[name]) name = 'home';
    if (App.current && App.current !== name && App.views[App.current].hide) App.views[App.current].hide();
    App.$$('.view').forEach(function (v) { v.classList.toggle('is-active', v.dataset.view === name); });
    App.$$('.rail-item').forEach(function (b) { b.classList.toggle('is-active', b.dataset.go === name); });
    App.current = name;
    var view = App.views[name];
    if (!view._built || view._dirty || opts.rerender || (view.minutely && view._min !== minuteKey())) build(name, opts);
    else if (view.resume) view.resume($('#view-' + name));
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  };
  // Build a hidden view and lay it out now (cached by content-visibility; no paint happens).
  function prebuild(name) {
    var el = $('#view-' + name), view = App.views[name];
    build(name);
    if (view.hide) view.hide();
    el.classList.add('is-warming');
    el.offsetHeight;
    el.classList.remove('is-warming');
  }
  // Pre-build (startup) and re-build (after data changes) hidden views in the background, one per
  // slot, so navigating to them never pays the rebuild cost.
  var refreshTimer = null;
  function refreshStale(delay) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function next() {
      var name = Object.keys(App.views).filter(function (k) {
        var v = App.views[k];
        return k !== App.current && (!v._built || v._dirty);
      })[0];
      if (!name) return;
      prebuild(name);
      refreshTimer = setTimeout(next, 400);
    }, delay);
  }
  function markStale() {
    Object.keys(App.views).forEach(function (k) { App.views[k]._dirty = true; });
    if (App.current && App.views[App.current]) App.rerender();
    refreshStale(400);
  }
  App.on('data', markStale);
  App.on('time', markStale);
  App.rerender = function () {
    if (App.current) App.views[App.current].show($('#view-' + App.current), { rerender: true });
  };

  // ------------------------------------------------------------ toasts (single, with undo)
  var toastTimer;
  App.toast = function (html, opts) {
    opts = opts || {};
    var box = $('#toasts');
    box.innerHTML = '';
    clearTimeout(toastTimer);
    var ms = opts.ms || 5000;
    var t = document.createElement('div');
    t.className = 'toast' + (opts.tone ? ' toast--' + opts.tone : '') + (opts.undo ? '' : ' toast--plain');
    t.style.setProperty('--ms', ms + 'ms');
    t.innerHTML = (opts.icon ? App.icon(opts.icon, 26) : '') + '<span class="toast-msg">' + html + '</span>' +
      (opts.undo ? '<button class="toast-undo">' + App.icon('undo', 22) + 'Undo</button>' : '');
    box.appendChild(t);
    t.classList.add('is-in');
    function kill() { t.remove(); }
    toastTimer = setTimeout(kill, ms);
    if (opts.undo) t.querySelector('.toast-undo').addEventListener('click', function () { clearTimeout(toastTimer); opts.undo(); kill(); });
  };

  // ------------------------------------------------------------ sheets (modal cards)
  App.sheet = function (html, opts) {
    opts = opts || {};
    var layer = $('#sheetLayer');
    layer.innerHTML = '<div class="sheet-scrim"></div><div class="sheet ' + (opts.cls || '') + '">' +
      '<button class="sheet-x" data-close aria-label="Close">' + App.icon('x', 28) + '</button>' + html + '</div>';
    layer.classList.add('is-open');
    function close() {
      if (!layer.classList.contains('is-open')) return;
      layer.classList.remove('is-open');
      if (opts.onClose) opts.onClose();
      layer.innerHTML = '';
    }
    App.closeSheet = close;
    layer.querySelector('.sheet-scrim').addEventListener('click', close);
    App.$$('[data-close]', layer).forEach(function (b) { b.addEventListener('click', close); });
    if (opts.onMount) opts.onMount(layer.querySelector('.sheet'), close);
    return close;
  };
  App.closeSheet = function () {};

  // Stage-local coordinates for an element's center (stage may be scaled on desktop)
  App.centerOf = function (el) {
    var stage = $('#stage').getBoundingClientRect(), r = el.getBoundingClientRect(), k = stage.height / 800;
    return { x: (r.left + r.width / 2 - stage.left) / k, y: (r.top + r.height / 2 - stage.top) / k };
  };

  // ------------------------------------------------------------ press-and-hold
  App.hold = function (el, ms, cb) {
    var t = null;
    el.style.setProperty('--hold', ms + 'ms');
    el.addEventListener('pointerdown', function () {
      if (cb.enabled && !cb.enabled()) return;
      el.classList.add('is-holding');
      t = setTimeout(function () { t = null; el.classList.remove('is-holding'); cb.done(); }, ms);
    });
    function cancel(e) {
      if (!t) return;
      clearTimeout(t); t = null;
      el.classList.remove('is-holding');
      if (cb.cancel && e.type === 'pointerup') cb.cancel();
    }
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointerleave', cancel);
    el.addEventListener('pointercancel', cancel);
  };

  // ------------------------------------------------------------ modes: day / ambient / night
  App.setMode = function (m) {
    var stage = $('#stage');
    App.mode = m;
    stage.dataset.mode = m;
    App.emit('mode', m);
  };

  // ------------------------------------------------------------ idle
  App.idle = { home: 60, ambient: 120 };
  var idleSec = 0;
  function onIdleTick() {
    idleSec++;
  }
  App.resetIdle = function () { idleSec = 0; };

  // ------------------------------------------------------------ stage scaling
  // Designed at 1280×800. Screens wider than 16:10 (e.g. 1920×1080 frames) widen the stage to their
  // aspect instead of pillarboxing; narrower screens letterbox as before.
  var STAGE_H = 800, STAGE_MIN_W = 1280;
  function fit() {
    var stage = $('#stage');
    var w = Math.max(STAGE_MIN_W, Math.round(STAGE_H * window.innerWidth / window.innerHeight));
    stage.style.setProperty('--stage-w', w + 'px');
    var s = Math.min(window.innerWidth / w, window.innerHeight / STAGE_H);
    stage.style.transform = Math.abs(s - 1) < 0.01 ? '' : 'scale(' + s + ')';
  }

  // ------------------------------------------------------------ clock tick
  var lastMin = -1;
  function tick() {
    var n = App.now();
    App.emit('second', n);
    if (n.getMinutes() !== lastMin) {
      lastMin = n.getMinutes();
      $('#railClock').innerHTML = '<b>' + App.fmt.time(n, false) + '</b><span>' + App.fmt.ampm(n) + '</span>';
      App.emit('minute', n);
    }
    onIdleTick();
  }

  // ------------------------------------------------------------ boot
  App.start = function () {
    fit();
    window.addEventListener('resize', fit);
    // Switch tabs the instant a finger lands (pointerdown), not on release. Keyboard "clicks"
    // (detail === 0) still work.
    $('#rail').addEventListener('pointerdown', function (e) {
      var b = e.target.closest('[data-go]');
      if (b && e.button === 0) App.go(b.dataset.go);
    });
    $('#rail').addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (b && e.detail === 0) App.go(b.dataset.go);
    });
    document.addEventListener('pointerdown', App.resetIdle, true);
    window.addEventListener('hashchange', function () { App.go(location.hash.slice(1)); });
    App.go(location.hash.slice(1) || 'home');
    tick();
    setInterval(tick, 1000);
    App.emit('ready');
    App.paintStatus();
    refreshStale(1500);
  };
  App.paintStatus = function () {
    var el = $('#frameStatus');
    if (!el || !D.sources) return;
    var cal = D.sources.calendar || { source: 'sample', updated: null };
    var wx = D.sources.weather || { source: 'sample' };
    var shop = D.sources.shopping || { source: 'sample' };
    var live = cal.source === 'live';
    el.classList.toggle('is-live', live);
    var text = 'calendar ' + cal.source;
    if (wx.source !== 'live') text += ' · weather sample';
    if (shop.source !== 'live') text += ' · shopping sample';
    if (cal.updated) {
      var when = formatNyStatus(cal.updated, App.now());
      if (when) text += ' · ' + when;
    }
    el.innerHTML = '<i></i><span>' + text + '</span>';
  };
  App.openEvent = function (e) {
    if (!e) return;
    App.sheet(
      '<div class="sheet-pad"><div class="label">' + App.fmt.day(e.start) + ' · ' + App.fmt.month(e.start) + ' ' + e.start.getDate() + '</div>' +
      '<h2 class="serif sheet-h">' + App.esc(e.title) + '</h2>' +
      '<p class="sheet-p">' + (e.allDay ? 'All day' : App.fmt.range(e.start, e.end)) + (e.loc ? ' · ' + App.esc(e.loc) : '') + '</p>' +
      (e.notes ? '<p class="serif" style="font-size:32px;line-height:1.25">' + App.esc(e.notes) + '</p>' : '') +
      '</div>'
    );
  };
  App.on('data', function () { App.paintStatus(); });
  App.on('minute', function () { App.paintStatus(); });
  // Data files and the photo manifest load before first paint. A hung request must not
  // leave the frame blank: loadFrameData times out and falls back on its own.
  function boot() {
    App.start();
    if (typeof window.loadFrameData !== 'function') return;
    window.loadFrameData().then(function () { App.emit('data'); }, function () { App.emit('data'); });
  }
  // Views register as later modules evaluate. Defer boot until that has finished.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})();
