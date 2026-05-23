/* ============================================================
   Lucia Novelli — main.js (shared across all pages)
   ============================================================ */
(function () {
  /* ── Page fade-out on same-origin navigation ── */
  function isSameOrigin(href) {
    try {
      return new URL(href, window.location.href).hostname === window.location.hostname;
    } catch (_) {
      return false;
    }
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
    if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
    if (!isSameOrigin(href)) return;

    /* ── Set language cookie on flag click ── */
    var langLink = link.closest('.lang-flags a, .mobile-lang a');
    if (langLink) {
      var isIt = langLink.getAttribute('href').indexOf('/it') === 0;
      document.cookie = 'lang=' + (isIt ? 'it' : 'en') + ';path=/;max-age=2592000';
    }

    e.preventDefault();
    document.body.style.opacity = '0';
    setTimeout(function () { window.location.href = href; }, 350);
  });

  /* ── Fallback: fade-out on unload ── */
  window.addEventListener('beforeunload', function () {
    document.body.style.opacity = '0';
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

  /* ── Parallax hero ── */
  if (hero) {
    var heroBg = hero.querySelector('.hero-bg');
    if (heroBg) {
      var ticking = false;
      function updateParallax() {
        var offset = window.scrollY * 0.4;
        if (window.scrollY <= hero.offsetHeight + 100) {
          heroBg.style.transform = 'translateY(' + offset + 'px)';
        }
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, { passive: true });
    }
  }

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
      btt.blur();
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

  /* ── Lightbox ── */
  var galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems.length) {
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightbox-img');
    var lbImgNext = document.getElementById('lightbox-img-next');
    var lbCap = document.getElementById('lightbox-caption');
    var lbCount = document.getElementById('lightbox-counter');
    var cur = 0;
    var sliding = false;

    function swapImage(src, alt) {
      lbImg.style.transition = 'none';
      lbImg.src = src;
      lbImg.alt = alt;
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'translateX(0)';
      lbImg.offsetHeight;
      lbImg.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
    }

    function preloadAdjacent(idx) {
      [idx - 1, idx + 1].forEach(function (i) {
        if (i >= 0 && i < galleryItems.length) {
          var el = galleryItems[i];
          var img = el.querySelector('img');
          var src = el.querySelector('source[type="image/webp"]');
          var url = src ? src.srcset : img.src;
          (new Image()).src = url;
        }
      });
    }

    function show(idx, dir) {
      if (sliding) return;
      var wasOpen = lb.classList.contains('open');
      cur = idx;
      var el = galleryItems[idx];
      var img = el.querySelector('img');
      var src = el.querySelector('source[type="image/webp"]');
      var nextSrc = src ? src.srcset : img.src;
      var nextAlt = img.alt;
      lbCap.textContent = el.getAttribute('data-title') || img.alt;
      if (lbCount) lbCount.textContent = (idx + 1) + ' / ' + galleryItems.length;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';

      if (!wasOpen) {
        swapImage(nextSrc, nextAlt);
        lbImgNext.style.opacity = '0';
        lbImgNext.style.transform = 'translateX(0)';
        preloadAdjacent(cur);
        return;
      }

      sliding = true;
      var outX = dir > 0 ? '-50px' : '50px';
      var inFromX = dir > 0 ? '50px' : '-50px';

      var preload = new Image();
      preload.onload = preload.onerror = function () {
        lbImgNext.style.transition = 'none';
        lbImgNext.src = nextSrc;
        lbImgNext.alt = nextAlt;
        lbImgNext.style.transform = 'translateX(' + inFromX + ')';
        lbImgNext.style.opacity = '0';
        lbImgNext.offsetHeight;
        lbImgNext.style.transition = 'transform 0.35s ease, opacity 0.35s ease';

        lbImg.style.transform = 'translateX(' + outX + ')';
        lbImg.style.opacity = '0';
        lbImgNext.style.transform = 'translateX(0)';
        lbImgNext.style.opacity = '1';

        setTimeout(function () {
          swapImage(nextSrc, nextAlt);
          preloadAdjacent(cur);
          sliding = false;
        }, 350);
      };
      preload.src = nextSrc;
    }
    function closeLightbox() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }
    galleryItems.forEach(function (item, i) {
      item.addEventListener('click', function () { show(i, 0); });
    });
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', function () {
      show((cur - 1 + galleryItems.length) % galleryItems.length, -1);
    });
    document.getElementById('lightbox-next').addEventListener('click', function () {
      show((cur + 1) % galleryItems.length, 1);
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') show((cur - 1 + galleryItems.length) % galleryItems.length, -1);
      if (e.key === 'ArrowRight') show((cur + 1) % galleryItems.length, 1);
    });
    var tsX = 0;
    lb.addEventListener('touchstart', function (e) {
      tsX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tsX;
      if (Math.abs(dx) > 50) {
        dx > 0
          ? show((cur - 1 + galleryItems.length) % galleryItems.length, -1)
          : show((cur + 1) % galleryItems.length, 1);
      }
    });
  }
})();
