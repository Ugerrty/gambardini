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
