/* ============================================================
   Lucia Novelli — main.js (shared across all pages)
   ============================================================ */
(function () {
  'use strict';

  /* ── Nav: solid background once scrolled past the hero ── */
  var nav = document.querySelector('.site-nav');
  var hero = document.querySelector('.hero');
  if (nav) {
    var updateNav = function () {
      nav.classList.toggle('site-nav--solid', !hero || window.scrollY > 80);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  /* ── Mobile menu ── */
  var btn = document.querySelector('.hamburger');
  var menu = document.getElementById('mobile-nav');
  if (btn && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('scroll-locked', open);
    };
    btn.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
    });
  }

  /* ── Scroll reveal (progressive enhancement) ── */
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(
      '.section .label, .section h2, .section .art-grid, .section .about-strip, ' +
      '.section .exhibitions-grid, .section .portfolio-grid, ' +
      '.section .services-grid, .section .contact-grid'
    ).forEach(function (el) {
      el.classList.add('reveal');
      ro.observe(el);
    });
  }

  /* ── Back to top ── */
  var btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', function () {
      btt.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      btt.blur();
    });
  }

  /* ── Gallery lightbox (only on gallery pages) ── */
  var lb = document.getElementById('lightbox');
  var items = document.querySelectorAll('.gallery-item');
  if (lb && items.length) {
    var lbImg = document.getElementById('lightbox-img');
    var lbCap = document.getElementById('lightbox-caption');
    var lbCount = document.getElementById('lightbox-counter');
    var btnClose = document.getElementById('lightbox-close');
    var btnPrev = document.getElementById('lightbox-prev');
    var btnNext = document.getElementById('lightbox-next');
    var cur = 0;
    var lastFocused = null;

    var labelFor = function (el) {
      return el.getAttribute('data-title') || (el.querySelector('img') || {}).alt || 'Painting';
    };

    items.forEach(function (item, i) {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'View: ' + labelFor(item));
      item.addEventListener('click', function () { openAt(i); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(i); }
      });
    });

    function render(idx) {
      cur = (idx + items.length) % items.length;
      var el = items[cur];
      var img = el.querySelector('img');
      var webp = el.querySelector('source[type="image/webp"]');
      lbImg.src = webp ? webp.srcset : (img ? img.src : '');
      lbImg.alt = img ? img.alt : '';
      lbCap.textContent = labelFor(el);
      if (lbCount) lbCount.textContent = (cur + 1) + ' / ' + items.length;
    }
    function openAt(idx) {
      lastFocused = document.activeElement;
      render(idx);
      lb.classList.add('open');
      document.body.classList.add('scroll-locked');
      btnClose.focus();
    }
    function close() {
      lb.classList.remove('open');
      document.body.classList.remove('scroll-locked');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { render(cur - 1); });
    btnNext.addEventListener('click', function () { render(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { render(cur - 1); }
      else if (e.key === 'ArrowRight') { render(cur + 1); }
      else if (e.key === 'Tab') {
        /* Keep focus inside the dialog */
        var f = [btnPrev, btnNext, btnClose];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        var n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1)
                           : (i === f.length - 1 ? 0 : i + 1);
        f[n].focus();
      }
    });

    var tsX = 0;
    lb.addEventListener('touchstart', function (e) { tsX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tsX;
      if (Math.abs(dx) > 50) render(dx > 0 ? cur - 1 : cur + 1);
    });
  }

  /* ── Contact form (AJAX) ── */
  var form = document.querySelector('.contact-form');
  if (form) {
    var lang = document.documentElement.lang || 'en';
    var t = {
      sending: lang === 'it' ? 'Invio in corso…' : 'Sending…',
      success: lang === 'it'
        ? 'Messaggio inviato! Ti risponderemo presto.'
        : "Message sent! We'll be in touch shortly.",
      error: lang === 'it'
        ? 'Qualcosa è andato storto. Scrivici direttamente: info@lucianovelli.com'
        : 'Something went wrong. Please email us: info@lucianovelli.com'
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('[type="submit"]');
      var orig = submitBtn.textContent;
      submitBtn.textContent = t.sending;
      submitBtn.disabled = true;
      fetch(form.action, { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.success) throw new Error(data.error || '');
          var msg = document.createElement('p');
          msg.className = 'form-success';
          msg.textContent = t.success;
          form.replaceWith(msg);
        })
        .catch(function () {
          var err = form.querySelector('.form-error');
          if (!err) {
            err = document.createElement('p');
            err.className = 'form-error';
            form.appendChild(err);
          }
          err.textContent = t.error;
          submitBtn.textContent = orig;
          submitBtn.disabled = false;
        });
    });
  }
})();
