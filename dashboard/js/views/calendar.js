// Calendar: the next 14 days. Columns come from calendar.json, never a built-in household.
import { columnsFor, eventsInColumn, eventsOverlapping } from '../parse.js';

(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null, scroll: 0 };

  function row(e, now) {
    var past = !e.allDay && e.end <= now;
    var when = e.allDay ? 'All day' : App.fmt.time(e.start);
    return '<button class="ev-row' + (past ? ' is-past' : '') + '" data-ev="' + App.esc(e.id) + '">' +
      '<span class="ev-when num">' + when + '</span>' +
      '<span class="ev-main"><b>' + App.esc(e.title) + '</b>' +
      (e.loc ? '<span class="ev-loc">' + App.esc(e.loc) + '</span>' : '') +
      '</span></button>';
  }

  function daysIn(events) {
    var now = App.now();
    var start = App.dayStart(now);
    var html = '';
    var any = false;
    for (var i = 0; i < 14; i++) {
      var day = App.addDays(start, i);
      var list = eventsOverlapping(events, day, App.addDays(day, 1));
      if (!list.length) continue;
      any = true;
      var head = App.sameDay(day, now) ? 'Today' : (i === 1 ? 'Tomorrow' : App.fmt.day(day));
      html += '<div class="day-h">' + head + ' · ' + App.fmt.monthShort(day) + ' ' + day.getDate() + '</div>' +
        list.map(function (e) { return row(e, now); }).join('');
    }
    return any ? html : '<div class="empty-note">No events</div>';
  }

  function paint(el) {
    var cols = columnsFor(D.events, D.calendars, D.calendarName);
    var start = App.dayStart(App.now());
    var windowEnd = App.addDays(start, 14);
    var upcoming = eventsOverlapping(D.events, start, windowEnd);
    var html = '<div class="agenda"><header class="agenda-head"><h1 class="serif">Next 14 days</h1></header>' +
      '<div class="agenda-cols" style="grid-template-columns:repeat(' + cols.length + ',minmax(0,1fr))">';
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var mine = eventsInColumn(upcoming, col, cols);
      var style = col.color ? ' style="--col:' + col.color + '"' : '';
      html += '<section class="agenda-col"' + style + '><h2>' + App.esc(col.name) + '</h2>' + daysIn(mine) + '</section>';
    }
    html += '</div></div>';
    el.innerHTML = html;
    var sc = el.querySelector('.agenda-cols');
    if (sc) sc.scrollTop = V.scroll;
  }

  App.register('calendar', {
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
        el.addEventListener('scroll', function (e) {
          if (e.target.classList && e.target.classList.contains('agenda-cols')) V.scroll = e.target.scrollTop;
        }, true);
      }
      paint(el);
    }
  });
})();
