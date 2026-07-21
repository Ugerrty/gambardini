/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI — общий каркас: скролл, шапка, темы,
   тумблер «Чертёж / Вещь», появления, ведомость заказа.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const doc = document.documentElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* QA-режим для тестовых снимков: без сцен и скрытых состояний */
  if (location.search.indexOf('motion=off') > -1) doc.classList.add('qa');

  /* ── Плавный скролл (Lenis) ───────────────────────────────── */
  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({ lerp: 0.08 });
    doc.classList.add('lenis');
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  window.gbLenis = lenis;

  /* ── Шапка ────────────────────────────────────────────────── */
  const header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    const y = window.scrollY || 0;
    header.classList.toggle('is-solid', y > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty('--sp', max > 0 ? String(Math.min(y / max, 1)) : '0');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* мобильное меню */
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

  /* ── Тема «День / Вечер» (подпись кнопки живёт в CSS) ─────── */
  document.querySelectorAll('.theme-toggle, .theme-toggle-m').forEach((b) => {
    b.addEventListener('click', () => {
      const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('gb-theme', next); } catch (e) { /* приватный режим */ }
    });
  });

  /* ── Тумблер «Чертёж / Вещь» ──────────────────────────────── */
  function syncModeButtons() {
    const real = doc.classList.contains('mode-real');
    document.querySelectorAll('.mode-toggle [data-mode]').forEach((b) => {
      b.setAttribute('aria-pressed', String((b.dataset.mode === 'real') === real));
    });
  }
  document.querySelectorAll('.mode-toggle [data-mode]').forEach((b) => {
    b.addEventListener('click', () => {
      doc.classList.toggle('mode-real', b.dataset.mode === 'real');
      try { localStorage.setItem('gb-mode', b.dataset.mode); } catch (e) { /* — */ }
      syncModeButtons();
    });
  });
  syncModeButtons();

  /* ── Изделия: чертежи по data-product ─────────────────────── */
  if (window.GB) {
    GB.injectDefs();
    document.querySelectorAll('[data-product]').forEach((el) => {
      const p = GB.byId[el.dataset.product];
      if (!p) return;
      el.classList.add('pv');
      el.innerHTML = GB.svg(p, { thumb: el.hasAttribute('data-thumb') });
      GB.applyFinish(el, 'brass');
    });
  }

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

  /* ── Счётчики цифр ────────────────────────────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !REDUCED && !doc.classList.contains('qa')) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        const el = en.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const t0 = performance.now();
        const dur = 1200;
        function tick(t) {
          const k = Math.min((t - t0) / dur, 1);
          const e = 1 - Math.pow(1 - k, 3); /* power3.out */
          el.textContent = Math.round(target * e).toLocaleString('ru-RU') + suffix;
          if (k < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = parseInt(el.dataset.count, 10).toLocaleString('ru-RU') + (el.dataset.suffix || '');
    });
  }

  /* ── Ведомость заказа (localStorage) ──────────────────────── */
  const order = {
    read() {
      let o;
      try { o = JSON.parse(localStorage.getItem('gb-order')) || {}; }
      catch (e) { return {}; }
      /* выбрасываем позиции, которых нет в каталоге (старые записи) */
      if (window.GB) {
        Object.keys(o).forEach((id) => {
          if (!GB.byId[id] || !(Number(o[id]) > 0)) delete o[id];
        });
      }
      return o;
    },
    write(o) {
      try { localStorage.setItem('gb-order', JSON.stringify(o)); } catch (e) { /* — */ }
      order.badge();
      document.dispatchEvent(new CustomEvent('gb:order'));
    },
    add(id, n) {
      const o = order.read();
      o[id] = Math.min((o[id] || 0) + (n || 1), 99);
      order.write(o);
    },
    setQty(id, q) {
      const o = order.read();
      if (q > 0) o[id] = Math.min(q, 99); else delete o[id];
      order.write(o);
    },
    count() {
      const o = order.read();
      return Object.values(o).reduce((s, n) => s + n, 0);
    },
    badge() {
      const n = order.count();
      document.querySelectorAll('.order-toggle').forEach((b) => {
        b.innerHTML = n > 0
          ? 'Заказ&nbsp;— <span class="order-n num">' + n + '</span>'
          : 'Заказ';
      });
    },
  };
  order.badge();
  window.gbOrder = order;
})();
