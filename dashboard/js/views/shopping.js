// Shopping list from /frame/data/shopping.json. Sample items are the fallback only.
(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null };

  function paint(el) {
    var items = D.shopping || [];
    var open = 0;
    for (var n = 0; n < items.length; n++) if (!items[n].done) open++;
    var html = '<div class="slist"><header class="slist-head"><h1 class="serif">Shopping</h1>' +
      '<div class="slist-count"><span class="num">' + open + '</span> to get</div></header><div class="slist-items">';
    if (!items.length) {
      html += '<div class="empty-note">No items</div>';
    } else {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        html += '<button class="slist-item' + (item.done ? ' is-done' : '') + '" data-i="' + i + '">' +
          '<span class="slist-box">' + (item.done ? App.icon('check', 28) : '') + '</span>' +
          '<b>' + App.esc(item.title) + '</b></button>';
      }
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  App.register('shopping', {
    show: function (el) {
      V.el = el;
      if (!el._bound) {
        el._bound = true;
        el.addEventListener('click', function (e) {
          var t = e.target.closest('[data-i]');
          if (!t || !D.shopping) return;
          var item = D.shopping[+t.getAttribute('data-i')];
          if (!item) return;
          item.done = !item.done;
          paint(el);
        });
      }
      paint(el);
    }
  });
})();
