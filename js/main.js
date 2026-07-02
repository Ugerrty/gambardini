/* GAMBARDINI · interactions: preloader, smooth scroll, reveals, atelier UI */
(function () {
  'use strict';

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';

  document.body.classList.add('is-loading');
  if (!hasGsap) document.body.classList.add('reveal-fallback');

  /* ───────── Lenis smooth scroll ───────── */
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
  }
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else {
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        scrollTo(id);
      }
    });
  });

  /* ───────── Preloader → hero intro ───────── */
  var pre = document.getElementById('preloader');

  function heroIntro() {
    document.body.classList.remove('is-loading');
    if (!hasGsap) return;
    var tl = gsap.timeline();
    tl.to('.ht-l', {
      y: 0, rotate: 0, duration: 1.1, stagger: 0.045, ease: 'power4.out',
    }, 0.1)
      .fromTo('[data-hero]', { y: 26, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      }, 0.5)
      .fromTo('#nav', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0.7)
      .fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1);
  }

  if (pre && hasGsap && !reduced) {
    var count = { v: 0 };
    var countEl = pre.querySelector('.pre-count');
    var tl = gsap.timeline({
      onComplete: function () { pre.style.display = 'none'; heroIntro(); },
    });
    tl.fromTo('.pre-logo', { opacity: 0, letterSpacing: '0.4em', y: 14 }, {
      opacity: 1, letterSpacing: '0.04em', y: 0, duration: 1.4, ease: 'power3.out',
    }, 0)
      .to('.pre-line', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.3)
      .to(count, {
        v: 100, duration: 1.7, ease: 'power2.inOut',
        onUpdate: function () { countEl.textContent = Math.round(count.v); },
      }, 0)
      .to(pre, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 1.9);
  } else {
    if (pre) pre.style.display = 'none';
    if (hasGsap && !reduced) heroIntro();
    else {
      document.body.classList.remove('is-loading');
      document.querySelectorAll('.ht-l').forEach(function (l) { l.style.transform = 'none'; });
    }
  }

  /* ───────── Nav: shrink + hide on scroll down ───────── */
  var nav = document.getElementById('nav');
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 60);
    if (y > 500 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  if (!hasGsap || reduced) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.style.opacity = 1; });
    return;
  }

  /* ───────── Generic reveals ───────── */
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    gsap.fromTo(el, { y: 54, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.05, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* ───────── Manifesto: word-by-word scrub ───────── */
  var mani = document.querySelector('.manifesto-text');
  if (mani) {
    var words = mani.textContent.trim().split(/\s+/);
    mani.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    gsap.to(mani.querySelectorAll('.w'), {
      opacity: 1, stagger: 0.06, ease: 'none',
      scrollTrigger: { trigger: mani, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
    });
  }

  /* ───────── Counters ───────── */
  document.querySelectorAll('.stat-n').forEach(function (el) {
    var target = parseInt(el.dataset.count, 10);
    var plus = el.dataset.plus || '';
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: function () {
        var n = Math.round(obj.v);
        el.textContent = (n >= 1000 ? n.toLocaleString('ru-RU') : n) + (n === target ? plus : '');
      },
    });
  });

  /* ───────── Quote mark parallax ───────── */
  var citMark = document.querySelector('.cit-mark');
  if (citMark) {
    gsap.fromTo(citMark, { yPercent: -70 }, {
      yPercent: -34, ease: 'none',
      scrollTrigger: { trigger: '.citazione', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* ───────── Card spotlight follows pointer ───────── */
  if (fine) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ───────── Magnetic buttons ───────── */
  if (fine) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var sx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var sy = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        sx((e.clientX - r.left - r.width / 2) * 0.3);
        sy((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', function () { sx(0); sy(0); });
    });
  }

  /* ───────── Custom cursor ───────── */
  if (fine) {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var label = ring.querySelector('.cursor-label');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    var ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    window.addEventListener('pointermove', function (e) {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        label.textContent = el.dataset.cursor;
        ring.classList.add('is-big');
      });
      el.addEventListener('pointerleave', function () { ring.classList.remove('is-big'); });
    });
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('pointerenter', function () { gsap.to(dot, { scale: 2.6, duration: 0.3 }); });
      el.addEventListener('pointerleave', function () { gsap.to(dot, { scale: 1, duration: 0.3 }); });
    });
  }

  /* ───────── Atelier UI ───────── */
  var MODELS = {
    lungo:  { name: 'Держатель для полотенец',   price: '16 900 ₽' },
    uncino: { name: 'Крючок для халата',          price: '4 900 ₽' },
    piano:  { name: 'Полка',                      price: '24 900 ₽' },
    rotolo: { name: 'Держатель туалетной бумаги', price: '9 900 ₽' },
    aria:   { name: 'Держатель для фена',         price: '12 900 ₽' },
    piega:  { name: 'Салфетница',                 price: '6 900 ₽' },
  };
  var nameEl = document.querySelector('.stage-name');
  var priceEl = document.querySelector('.stage-price');

  document.querySelectorAll('.model-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.model-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var key = btn.dataset.model;
      if (window.atelier3d) window.atelier3d.setModel(key);
      var m = MODELS[key];
      if (m && nameEl) {
        gsap.fromTo([nameEl, priceEl], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
        nameEl.textContent = m.name;
        priceEl.textContent = m.price;
      }
    });
  });

  document.querySelectorAll('.finish-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.finish-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      if (window.atelier3d) window.atelier3d.setFinish(btn.dataset.finish);
    });
  });

})();
