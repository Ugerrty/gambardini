/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI v3 — общий каркас: скролл, шапка,
   переключатель «Чёрный / Белый», появления.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const doc = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* QA-режим для тестовых снимков */
  if (location.search.indexOf('motion=off') > -1) doc.classList.add('qa');

  /* ── Плавный скролл ───────────────────────────────────────── */
  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    doc.classList.add('lenis');
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  window.gbLenis = lenis;

  /* ── Шапка ────────────────────────────────────────────────── */
  const header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-solid', (window.scrollY || 0) > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (lenis) lenis.on('scroll', onScroll);
  onScroll();

  /* ── Мобильное меню ───────────────────────────────────────── */
  const burger = document.querySelector('.nav-burger');
  const nav = document.querySelector('.site-nav');
  if (burger && nav) {
    const setNav = (open) => {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
      document.body.classList.toggle('nav-open', open);
      if (window.gbLenis) open ? gbLenis.stop() : gbLenis.start();
    };

    burger.addEventListener('click', () => {
      setNav(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', (e) => {
      if (!nav.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setNav(false); burger.focus(); return; }
      if (e.key === 'Tab') {
        const items = [burger, ...nav.querySelectorAll('a')];
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* при переходе на десктоп шторку закрываем, чтобы не залипла */
    matchMedia('(min-width: 861px)').addEventListener('change', (m) => {
      if (m.matches) setNav(false);
    });
  }

  /* ── «Чёрный / Белый» — сигнатура сайта ───────────────────── */
  function syncFin() {
    const white = doc.classList.contains('fin-w');
    document.querySelectorAll('[data-fin]').forEach((b) => {
      b.setAttribute('aria-pressed', String((b.dataset.fin === 'w') === white));
    });
    document.dispatchEvent(new CustomEvent('gb:fin', { detail: { white } }));
  }
  function setFin(f) {
    doc.classList.toggle('fin-w', f === 'w');
    try { localStorage.setItem('gb-fin', f); } catch (e) { /* приватный режим */ }
    syncFin();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fin]');
    if (b) setFin(b.dataset.fin);
  });
  syncFin();
  window.gbSetFin = setFin;

  /* ── Логотип-заставка: подгоняем кегль под ширину листа ────── */
  function fitWordmark() {
    const box = document.querySelector('.hero-wordmark');
    const el = box && box.querySelector('span');
    if (!el) return;
    const target = box.clientWidth;
    if (!target) return;
    /* меряем при опорном кегле — работает с любым шрифтом,
       включая случай, когда Montserrat ещё не загрузился */
    el.style.fontSize = '100px';
    const measured = el.getBoundingClientRect().width;
    if (!measured) { el.style.fontSize = ''; return; }
    /* 0.97 — запас на разницу метрик, пока подгружается Montserrat */
    const size = Math.min(100 * (target / measured) * 0.97, 116);
    el.style.fontSize = size.toFixed(2) + 'px';
  }
  fitWordmark();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(fitWordmark));
  }
  window.addEventListener('load', fitWordmark);
  window.addEventListener('resize', fitWordmark, { passive: true });

  /* ── Появления ────────────────────────────────────────────── */
  const revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealed.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          if (el.dataset.delay) el.style.setProperty('--reveal-delay', el.dataset.delay + 'ms');
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach((el) => io.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('is-in'));
  }
})();
