// Today: clock, date, weather, and today's events. No per-person lanes.
import { eventsOverlapping } from '../parse.js';

(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null };

  function row(e, now) {
    var past = !e.allDay && e.end <= now;
    var when = e.allDay ? 'All day' : App.fmt.time(e.start);
    return '<button class="ev-row' + (past ? ' is-past' : '') + '" data-ev="' + App.esc(e.id) + '">' +
      '<span class="ev-when num">' + when + '</span>' +
      '<span class="ev-main"><b>' + App.esc(e.title) + '</b>' +
      (e.loc ? '<span class="ev-loc">' + App.esc(e.loc) + '</span>' : '') +
      '</span></button>';
  }

  function forecast() {
    var days = App.forecastDays();
    if (!days.length) return '';
    return '<div class="today-forecast">' + days.map(function (d) {
      var rain = d.precip != null && d.precip >= 20
        ? Math.round(d.precip) + '%'
        : '';
      return '<div class="today-fc">' +
        '<span class="today-fc-day">' + App.esc(d.label) + '</span>' +
        App.icon(d.cond, 48) +
        '<span class="today-fc-temps num"><b>' + d.hi + '°</b> <span>' + d.lo + '°</span></span>' +
        '<span class="today-fc-rain">' + rain + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function paint(el) {
    var now = App.now();
    var w = App.weatherNow();
    var day = App.dayStart(now);
    var events = eventsOverlapping(D.events, day, App.addDays(day, 1));
    el.innerHTML = '<div class="today">' +
      '<div class="today-clock">' +
      '<div class="today-time num">' + App.fmt.time(now, false) + '<span>' + App.fmt.ampm(now) + '</span></div>' +
      '<div class="today-date"><b>' + App.fmt.day(now) + '</b> ' + App.fmt.month(now) + ' ' + now.getDate() + ', ' + now.getFullYear() + '</div>' +
      '</div>' +
      '<div class="today-wx">' +
      '<div class="today-wx-temp">' + App.icon(w.cond, 64) + '<span class="num">' + w.temp + '°</span></div>' +
      '<div class="today-wx-meta"><b>' + App.esc(w.label) + '</b><span>High ' + w.hi + '°    Low ' + w.lo + '°</span></div>' +
      '<div class="today-wx-say">' + App.esc(w.summary) + '</div>' +
      '</div>' +
      forecast() +
      '<div class="today-agenda">' +
      '<div class="label">Today</div>' +
      (events.length ? events.map(function (e) { return row(e, now); }).join('') : '<div class="empty-note">No events</div>') +
      '</div></div>';
  }

  App.register('home', {
    minutely: true,
    show: function (el) {
      V.el = el;
      if (!el._bound) {
        el._bound = true;
        el.addEventListener('click', function (e) {
          var t = e.target.closest('[data-ev]');
          if (!t) return;
          var id = t.getAttribute('data-ev');
          for (var i = 0; i < D.events.length; i++) {
            if (D.events[i].id === id) { App.openEvent(D.events[i]); return; }
          }
        });
      }
      paint(el);
    }
  });

  App.on('minute', function () {
    if (App.current === 'home' && V.el) paint(V.el);
  });
})();
