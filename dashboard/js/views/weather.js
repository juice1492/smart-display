// Weather tab: five days including today, then today's hourly or day-part blocks.
(function () {
  'use strict';
  var V = { el: null };
  var BANDS = ['Morning', 'Afternoon', 'Evening', 'Night'];

  function band(h) {
    if (h < 5 || h >= 21) return 'Night';
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }

  function dayStrip(days) {
    if (!days.length) return '<p class="wx-missing">No daily forecast</p>';
    return '<div class="fc-strip">' + days.map(function (d) {
      var rain = d.precip != null && d.precip >= 20 ? Math.round(d.precip) + '%' : '';
      return '<div class="fc">' +
        '<span class="fc-day">' + App.esc(d.label) + '</span>' +
        App.icon(d.cond, 40) +
        '<span class="fc-temps num"><b>' + d.hi + '°</b> <span>' + d.lo + '°</span></span>' +
        '<span class="fc-rain">' + rain + '</span></div>';
    }).join('') + '</div>';
  }

  function hourStrip(hours) {
    return '<div class="wx-hours">' + hours.map(function (h) {
      var rain = h.p != null && h.p >= 20 ? Math.round(h.p) + '%' : '';
      return '<div class="wx-hour">' +
        '<span class="wx-hour-l">' + App.esc(h.label) + '</span>' +
        App.icon(h.c, 32) +
        '<span class="wx-hour-t num">' + h.t + '°</span>' +
        '<span class="wx-hour-p">' + rain + '</span></div>';
    }).join('') + '</div>';
  }

  function blockStrip(hours) {
    var groups = { Morning: [], Afternoon: [], Evening: [], Night: [] };
    for (var i = 0; i < hours.length; i++) groups[band(hours[i].h)].push(hours[i]);
    var html = '<div class="wx-blocks">';
    var any = false;
    for (var b = 0; b < BANDS.length; b++) {
      var name = BANDS[b];
      var list = groups[name];
      if (!list.length) continue;
      any = true;
      var sum = 0, maxP = -1, icon = list[0].c;
      for (var j = 0; j < list.length; j++) {
        sum += list[j].t;
        if (list[j].p != null && list[j].p > maxP) maxP = list[j].p;
      }
      var rain = maxP >= 20 ? Math.round(maxP) + '%' : '';
      html += '<div class="wx-block"><span class="wx-block-l">' + name + '</span>' +
        App.icon(icon, 48) +
        '<span class="wx-block-t num">' + Math.round(sum / list.length) + '°</span>' +
        '<span class="wx-block-p">' + rain + '</span></div>';
    }
    html += '</div>';
    return any ? html : '<p class="wx-missing">No hourly forecast</p>';
  }

  function paint(el) {
    var days = App.forecastDays({ includeToday: true, limit: 5 });
    var hours = App.todayHours();
    var width = el.clientWidth;
    if (width < 200) width = 1100;
    var useBlocks = hours.length > 0 && (width - 48) / hours.length < 92;
    var hourly = !hours.length
      ? '<p class="wx-missing">No hourly forecast</p>'
      : (useBlocks ? blockStrip(hours) : hourStrip(hours));
    el.innerHTML = '<div class="wx-screen">' +
      '<h1 class="serif wx-title">Weather</h1>' +
      dayStrip(days) +
      '<div class="wx-hourly">' + hourly + '</div></div>';
  }

  App.register('weather', {
    minutely: true,
    show: function (el) {
      V.el = el;
      paint(el);
    }
  });

  App.on('minute', function () {
    if (App.current === 'weather' && V.el) paint(V.el);
  });
})();
