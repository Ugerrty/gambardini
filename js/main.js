/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI v3 — общий каркас: скролл, шапка,
   переключатель «Чёрный / Белый», появления.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const doc = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Хранилище с учётом согласия ──────────────────────────────
     До выбора и при «Принять» пишем в localStorage (переживает
     закрытие сайта), при «Только сессия» — только sessionStorage.
     Читаем отовсюду: приоритет у localStorage. */
  const CONSENT_KEY = 'gb-ck';
  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  const store = {
    get(k) {
      try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) { /* — */ }
      try { return sessionStorage.getItem(k); } catch (e) { return null; }
    },
    set(k, v) {
      try { sessionStorage.setItem(k, v); } catch (e) { /* — */ }
      if (getConsent() !== '0') {
        try { localStorage.setItem(k, v); } catch (e) { /* — */ }
      }
    },
    del(k) {
      try { localStorage.removeItem(k); } catch (e) { /* — */ }
      try { sessionStorage.removeItem(k); } catch (e) { /* — */ }
    },
  };
  window.gbStore = store;
  window.gbConsent = {
    get: getConsent,
    accept() {
      try { localStorage.setItem(CONSENT_KEY, '1'); } catch (e) { /* — */ }
      /* донести сессионные значения до постоянного хранилища */
      ['gb-fin', 'gb-cart', 'gb-co'].forEach((k) => {
        let v = null;
        try { v = sessionStorage.getItem(k); } catch (e) { /* — */ }
        if (v !== null) { try { localStorage.setItem(k, v); } catch (e) { /* — */ } }
      });
    },
    decline() {
      try { localStorage.setItem(CONSENT_KEY, '0'); } catch (e) { /* — */ }
      /* стираем уже сохранённое: остаётся только текущая сессия */
      ['gb-fin', 'gb-cart', 'gb-co'].forEach((k) => {
        try { localStorage.removeItem(k); } catch (e) { /* — */ }
      });
    },
  };

  /* QA-режим для тестовых снимков */
  if (location.search.indexOf('motion=off') > -1) doc.classList.add('qa');

  /* ── Плавный скролл ───────────────────────────────────────────
     Только десктоп с мышью: на телефонах JS-скролл спорит с нативным
     и даёт рывки — там остаётся системная прокрутка, она плавнее */
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let lenis = null;
  if (!REDUCED && FINE && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    doc.classList.add('lenis');
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  window.gbLenis = lenis;

  /* ── Готовность: запускает медленный отъезд камеры героя.
     Пауза в кадр — иначе класс успевает встать до первой
     отрисовки и переход не проигрывается ─────────────────────── */
  setTimeout(() => doc.classList.add('ready'), 80);

  /* ── Переходы между страницами ────────────────────────────── */
  document.addEventListener('click', (e) => {
    if (REDUCED) return;
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    /* только внутренние переходы между страницами сайта */
    if (!/^[a-z-]+\.html(#.*)?$/.test(href)) return;
    if (href.split('#')[0] === location.pathname.split('/').pop()) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = href; }, 210);
  });
  /* возврат из bfcache — страница должна ожить */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('leaving');
  });

  /* ── Шапка и параллакс героя ──────────────────────────────── */
  const header = document.querySelector('.site-header');
  const heroMedia = document.querySelector('.hero-media');
  function onScroll() {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('is-solid', y > 10);
    /* фото отстаёт от скролла — глубина без пересчёта лейаута.
       Только десктоп: на телефоне transform каждый кадр = рывки */
    if (heroMedia && !REDUCED && FINE && y < window.innerHeight * 1.2) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
    }
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
  /* пилюля тумблера скользит под активную кнопку; размеры зависят
     от шрифта, поэтому после его загрузки и на resize — мгновенная
     подгонка без анимации */
  function syncPill(instant) {
    document.querySelectorAll('.fin-toggle, .split-ui').forEach((g) => {
      const pill = g.querySelector('.fin-pill');
      const on = g.querySelector('button[aria-pressed="true"]');
      if (!pill || !on) return;
      if (instant) pill.style.transition = 'none';
      pill.style.width = on.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + on.offsetLeft + 'px)';
      if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
    });
  }
  function syncFin() {
    const white = doc.classList.contains('fin-w');
    document.querySelectorAll('[data-fin]').forEach((b) => {
      b.setAttribute('aria-pressed', String((b.dataset.fin === 'w') === white));
    });
    syncPill();
    document.dispatchEvent(new CustomEvent('gb:fin', { detail: { white } }));
  }
  function setFin(f) {
    doc.classList.toggle('fin-w', f === 'w');
    store.set('gb-fin', f);
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
  /* Гигантский wordmark футера: кегль ровно по ширине контейнера.
     CSS-clamp — только стартовое приближение: на широких экранах
     трекинг съедал последнюю букву, на узких оставлял поля */
  function fitGiant() {
    document.querySelectorAll('.footer-giant').forEach((p) => {
      const el = p.querySelector('i') || p.querySelector('span');
      if (!el) return;
      const target = p.clientWidth;
      if (!target) return;
      el.style.fontSize = '100px';
      const w = el.getBoundingClientRect().width;
      if (!w) { el.style.fontSize = ''; return; }
      el.style.fontSize = (100 * (target / w) * 0.995).toFixed(2) + 'px';
    });
  }

  const refit = () => { fitWordmark(); fitGiant(); syncPill(true); };
  fitWordmark();
  fitGiant();
  if (document.fonts && document.fonts.ready) {
    /* без rAF: в фоновой вкладке кадры не идут, а мерить можно и так */
    document.fonts.ready.then(() => { refit(); setTimeout(refit, 80); });
  }
  window.addEventListener('load', refit);
  window.addEventListener('resize', refit, { passive: true });

  /* ── Плашка cookies ───────────────────────────────────────── */
  (function ckBar() {
    if (getConsent() !== null) return;    /* выбор уже сделан */

    const bar = document.createElement('div');
    bar.className = 'ck-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookies');
    bar.innerHTML =
      '<p class="ck-text">Мы используем cookies, чтобы сайт запоминал выбранный цвет и&nbsp;товары в&nbsp;корзине. Без аналитики и&nbsp;рекламы.</p>' +
      '<span class="ck-actions">' +
        '<button class="ck-no" type="button">Отказаться</button>' +
        '<button class="ck-ok" type="button">Принять</button>' +
      '</span>';
    document.body.appendChild(bar);
    document.body.classList.add('has-ck');

    setTimeout(() => bar.classList.add('is-in'), 1400);

    function hide() {
      bar.classList.remove('is-in');
      document.body.classList.remove('has-ck');
      setTimeout(() => bar.remove(), 550);
    }
    /* отказ = ничего не храним дольше текущей сессии */
    bar.querySelector('.ck-ok').addEventListener('click', () => { gbConsent.accept(); hide(); });
    bar.querySelector('.ck-no').addEventListener('click', () => { gbConsent.decline(); hide(); });
  })();

  /* ── Появления ────────────────────────────────────────────── */
  const revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealed.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          if (el.dataset.delay) el.style.setProperty('--reveal-delay', el.dataset.delay + 'ms');
          el.classList.add('is-in');
          /* по завершении появления возвращаем элементу его тайминги
             (правило .is-done); таймер — на случай, если transitionend
             не придёт (reduced motion, скрытая вкладка) */
          const done = () => el.classList.add('is-done');
          el.addEventListener('transitionend', done, { once: true });
          setTimeout(done, 1400);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach((el) => io.observe(el));
  } else {
    revealed.forEach((el) => el.classList.add('is-in'));
  }
})();
