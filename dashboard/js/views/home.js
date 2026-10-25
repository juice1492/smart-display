// Today: weekday, date and time, up to three events still to start, current weather.
import { upcomingTimed } from '../parse.js';

(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null };

  function mark(cond) {
    if (cond === 'sun') return '<span class="wx-orb"></span>';
    if (cond === 'moon') return '<span class="wx-orb is-moon"></span>';
    return App.icon(cond, 96);
  }

  function paint(el) {
    var now = App.now();
    var w = App.weatherNow();
    var upcoming = upcomingTimed(D.events, now, 3);
    var events = upcoming.events.map(function (e) {
      return '<button class="today-ev" data-ev="' + App.esc(e.id) + '">' +
        '<b>' + App.esc(e.title) + '</b>' +
        '<span class="num">' + App.fmt.time(e.start) + '</span></button>';
    }).join('');
    if (!events) events = '<div class="today-empty">No events</div>';
    else if (upcoming.more) events += '<button class="today-more" data-more="1">+' + upcoming.more + ' more</button>';
    el.innerHTML = '<div class="today">' +
      '<h1 class="today-day serif">' + App.fmt.day(now) + '</h1>' +
      '<p class="today-when">' + App.fmt.month(now) + ' ' + now.getDate() + ' · ' + App.fmt.time(now) + '</p>' +
      '<div class="today-rule"></div>' +
      '<div class="today-events">' + events + '</div>' +
      '<div class="today-split"></div>' +
      '<div class="today-wx">' +
      '<div class="today-wx-temp">' + mark(w.cond) + '<span class="num">' + w.temp + '°</span></div>' +
      '<div class="today-wx-cond">' + App.esc(w.label) + '</div>' +
      '<div class="today-wx-range">High ' + w.hi + '°  Low ' + w.lo + '°</div>' +
      '<div class="today-wx-pop">' + App.esc(w.summary) + '</div>' +
      '</div></div>';
  }

  App.register('home', {
    minutely: true,
    show: function (el) {
      V.el = el;
      if (!el._bound) {
        el._bound = true;
        el.addEventListener('click', function (e) {
          if (e.target.closest('[data-more]')) { App.go('calendar'); return; }
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
