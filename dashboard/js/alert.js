// One modal for timed events inside a 30-minute window. All-day events never alert.
import { alertKey, dueAlerts, countdownLabel } from './parse.js';

(function () {
  'use strict';
  var D = window.DATA;
  var LEAD = 30 * 60 * 1000;
  var STORE = 'frame.dismissedAlerts';
  var dismissed = {};
  var latched = [];
  var open = false;
  var audioCtx = null;

  function loadDismissed() {
    try {
      var raw = localStorage.getItem(STORE);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return;
      for (var i = 0; i < arr.length; i++) dismissed[arr[i]] = 1;
    } catch (e) {}
  }

  function remember(key) {
    if (!key) return;
    dismissed[key] = 1;
    try {
      var keys = Object.keys(dismissed);
      if (keys.length > 200) keys = keys.slice(keys.length - 200);
      localStorage.setItem(STORE, JSON.stringify(keys));
    } catch (e) {}
  }

  function chime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      var ctx = audioCtx;
      var play = function () {
        var t = ctx.currentTime;
        var notes = [523.25, 659.25];
        for (var i = 0; i < notes.length; i++) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = notes[i];
          var start = t + i * 0.14;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.05, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.6);
        }
      };
      if (ctx.state === 'suspended' && ctx.resume) {
        ctx.resume().then(play, function () {});
      } else {
        play();
      }
    } catch (e) {}
  }

  function render() {
    var layer = document.getElementById('alertLayer');
    if (!layer) return;
    var now = App.now();
    var html = '<div class="alert-card">' +
      '<button type="button" class="alert-x" aria-label="Dismiss">&#215;</button>' +
      '<p class="alert-kicker">Coming up</p>';
    for (var i = 0; i < latched.length; i++) {
      var ev = latched[i];
      html += '<article class="alert-item">' +
        '<p class="alert-count">' + countdownLabel(ev.start, now) + '</p>' +
        '<h2 class="serif">' + App.esc(ev.title) + '</h2>' +
        '<p class="alert-when">' + App.fmt.time(ev.start) + '</p>' +
        (ev.loc ? '<p class="alert-loc">' + App.esc(ev.loc) + '</p>' : '') +
        (ev.notes ? '<p class="alert-notes">' + App.esc(ev.notes) + '</p>' : '') +
        '</article>';
    }
    html += '<p class="alert-hint">Tap anywhere to close</p>' +
      '<button type="button" class="alert-dismiss">Dismiss</button></div>';
    layer.innerHTML = html;
    layer.hidden = false;
    layer.classList.add('is-open');
  }

  function close() {
    open = false;
    var layer = document.getElementById('alertLayer');
    if (!layer) return;
    layer.classList.remove('is-open');
    layer.hidden = true;
    layer.innerHTML = '';
  }

  function dismiss() {
    for (var i = 0; i < latched.length; i++) remember(alertKey(latched[i]));
    latched = [];
    close();
  }

  function sync() {
    if (!window.App || !D) return;
    var due = dueAlerts(D.events, App.now(), LEAD);
    var added = false;
    var seen = {};
    var known = {};
    var events = D.events || [];
    for (var n = 0; n < events.length; n++) known[alertKey(events[n])] = events[n];
    for (var i = 0; i < due.length; i++) {
      var key = alertKey(due[i]);
      if (!key || dismissed[key]) continue;
      seen[key] = due[i];
    }
    var next = [];
    for (var j = 0; j < latched.length; j++) {
      var keep = alertKey(latched[j]);
      if (!keep || dismissed[keep] || !known[keep]) continue;
      if (seen[keep]) {
        next.push(seen[keep]);
        delete seen[keep];
      } else {
        next.push(known[keep]);
      }
    }
    var fresh = [];
    for (var k in seen) {
      if (Object.prototype.hasOwnProperty.call(seen, k)) fresh.push(seen[k]);
    }
    if (fresh.length) added = true;
    next = next.concat(fresh);
    next.sort(function (a, b) { return a.start - b.start || a.end - b.end; });
    latched = next;
    if (!latched.length) {
      if (open) close();
      return;
    }
    var was = open;
    open = true;
    render();
    if (!was || added) chime();
  }

  function bind() {
    var layer = document.getElementById('alertLayer');
    if (!layer || layer._bound) return;
    layer._bound = true;
    layer.addEventListener('click', dismiss);
  }

  loadDismissed();
  App.on('ready', function () { bind(); sync(); });
  App.on('second', sync);
  App.on('data', sync);
})();
