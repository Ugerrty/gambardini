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
  onScroll();

  const burger = document.querySelector('.nav-burger');
  const nav = document.querySelector('.site-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
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
