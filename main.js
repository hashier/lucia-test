/* ============================================================
   Lucia Novelli — main.js (shared across all pages)
   ============================================================ */
(function () {
  /* ── Page fade-in ── */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  window.addEventListener('load', function () {
    document.body.style.opacity = '1';
  });

  /* ── Page fade-out on navigation ── */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 ||
        href.indexOf('tel:') === 0 || link.target === '_blank') return;
    if (href.indexOf('http') === 0 && href.indexOf('lucianovelli.com') < 0) return;
    e.preventDefault();
    document.body.style.opacity = '0';
    setTimeout(function () { window.location.href = href; }, 350);
  });

  /* ── Nav transparency ── */
  var nav = document.querySelector('.site-nav');
  var hero = document.querySelector('.hero');
  function updateNav() {
    if (!hero || window.scrollY > 80) {
      nav.classList.add('site-nav--solid');
    } else {
      nav.classList.remove('site-nav--solid');
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Hamburger ── */
  var btn = document.querySelector('.hamburger');
  var menu = document.getElementById('mobile-nav');
  btn.addEventListener('click', function () {
    var o = menu.classList.toggle('open');
    btn.classList.toggle('open', o);
    btn.setAttribute('aria-expanded', o);
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Scroll reveal ── */
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
    });
  }

  /* ── Gallery accessibility ── */
  document.querySelectorAll('.gallery-item').forEach(function (item) {
    var title = item.getAttribute('data-title') || (item.querySelector('img') || {}).alt || 'Painting';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', 'View: ' + title);
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });

  /* ── Contact form AJAX ── */
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
        .then(function (r) {
          if (!r.ok) throw new Error();
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
