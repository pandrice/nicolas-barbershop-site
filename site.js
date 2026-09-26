(function () {
  'use strict';

  /* ── Full-screen menu ───────────────────────────────────────── */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('site-menu');
  if (toggle && menu) {
    var focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var lastFocus = null;

    function getFocusable() {
      return Array.prototype.slice.call(menu.querySelectorAll(focusableSelector))
        .filter(function (el) {
          return el.offsetParent !== null || el === toggle;
        });
    }

    function openMenu() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
      var items = getFocusable();
      if (items.length) items[0].focus();
    }

    function closeMenu() {
      menu.hidden = true;
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) closeMenu();
      else openMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== 'Tab') return;
      var items = getFocusable();
      if (!items.length) return;
      // Include toggle in the trap cycle
      var trap = [toggle].concat(items.filter(function (el) { return el !== toggle; }));
      var first = trap[0];
      var last = trap[trap.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        // Close after in-page nav; external/new-tab still closes overlay
        closeMenu();
      });
    });
  }

  /* ── Soft scroll reveal ─────────────────────────────────────── */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.review-card, .reveal');
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else if ('IntersectionObserver' in window && revealEls.length) {
    revealEls.forEach(function (el) { el.classList.add('reveal-ready'); });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ── Home news (news.json) ──────────────────────────────────── */
  var newsList = document.getElementById('news-list');
  if (newsList) {
    var emptyMsg = 'No current notices — check back for holiday hours and shop updates.';

    function formatDate(iso) {
      if (!iso) return '';
      var parts = String(iso).split('-');
      if (parts.length !== 3) return iso;
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var d = parseInt(parts[2], 10);
      var m = months[parseInt(parts[1], 10) - 1];
      var y = parts[0];
      if (!m || !d) return iso;
      return d + ' ' + m + ' ' + y;
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function renderEmpty() {
      newsList.innerHTML = '<p class="news-empty">' + emptyMsg + '</p>';
    }

    function renderItems(items) {
      if (!items || !items.length) {
        renderEmpty();
        return;
      }
      var html = items.map(function (item) {
        var title = escapeHtml(item.title || 'Update');
        var body = escapeHtml(item.body || '');
        var dateLabel = formatDate(item.date);
        var dateAttr = item.date ? ' datetime="' + escapeHtml(item.date) + '"' : '';
        var timeHtml = dateLabel
          ? '<time class="news-date"' + dateAttr + '>' + escapeHtml(dateLabel) + '</time>'
          : '';
        return (
          '<article class="news-item">' +
            timeHtml +
            '<h3 class="news-title">' + title + '</h3>' +
            (body ? '<p class="news-body">' + body + '</p>' : '') +
          '</article>'
        );
      }).join('');
      newsList.innerHTML = html;
    }

    fetch('news.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('news fetch failed');
        return res.json();
      })
      .then(function (data) {
        var items = Array.isArray(data) ? data : (data && data.items) || [];
        items = items.filter(function (item) {
          return item && (item.title || item.body);
        });
        renderItems(items);
      })
      .catch(function () {
        renderEmpty();
      });
  }
})();
