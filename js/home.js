/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI — главная: материализация «чертёж → вещь»,
   шкала операций, разрез скрытого монтажа, лента каталога.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Лента каталога ───────────────────────────────────────── */
  const rail = document.getElementById('strip-rail');
  if (rail && window.GB) {
    rail.innerHTML = GB.PRODUCTS.map((p) => `
      <a class="strip-item" href="catalog.html#${p.id}">
        <div class="pv">${GB.svg(p, { thumb: true })}</div>
        <p class="strip-name">${p.name}</p>
        <p class="strip-meta t-mono"><span>${p.code}</span><span class="price">${GB.fmtPrice(p.price)}</span></p>
      </a>`).join('');
    GB.applyFinish(rail, 'brass');
  }

  const cs = document.getElementById('cs-svg');
  if (cs && window.GB) GB.applyFinish(cs, 'brass');

  /* ── Титульный лист: чертёж прочерчивается при загрузке ───── */
  (function heroDraw() {
    const pv = document.getElementById('hero-pv');
    if (!pv || matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.classList.contains('qa')) return;
    const contours = pv.querySelectorAll('.pv-draw .ln-c, .pv-draw .ln-h');
    const late = pv.querySelectorAll('.pv-dims, .pv-extra');
    late.forEach((g) => { g.style.opacity = '0'; });
    contours.forEach((el, i) => {
      if (typeof el.getTotalLength !== 'function') return;
      let L;
      try { L = el.getTotalLength(); } catch (e) { return; }
      if (!L || !isFinite(L)) return;
      el.style.strokeDasharray = L;
      el.style.strokeDashoffset = L;
      const a = el.animate(
        [{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
        { duration: 700, delay: 200 + i * 110, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }
      );
      a.onfinish = () => {
        el.style.strokeDasharray = '';
        el.style.strokeDashoffset = '';
      };
    });
    late.forEach((g) => {
      g.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 450, delay: 1050, easing: 'ease-out', fill: 'forwards' }
      ).onfinish = () => { g.style.opacity = ''; };
    });
  })();

  /* ── Шкала семи операций: состояние ───────────────────────── */
  const track = document.getElementById('ops-track');
  const OPS = [
    'шлифовка, зерно P80',
    'шлифовка, зерно P120',
    'шлифовка, зерно P240',
    'шлифовка, зерно P400',
    'предполировка, войлок',
    'полировка, паста',
    'зеркальная доводка',
  ];
  let opsCur = -1;
  function opsSet(i) {
    if (!track || i === opsCur) return;
    opsCur = i;
    track.querySelectorAll('i').forEach((c, j) => c.classList.toggle('is-on', j <= i));
    document.getElementById('ops-n').textContent = '0' + (i + 1) + ' / 07';
    document.getElementById('ops-label').textContent = OPS[i];
  }
  opsSet(6); /* дефолт без движения — финальное состояние */

  /* ?motion=off — статический режим для тестовых снимков */
  if (!window.gsap || !window.ScrollTrigger || location.search.indexOf('motion=off') > -1) return;
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  /* ── Сцена героя: только широкий экран + движение ─────────── */
  mm.add('(min-width: 1101px) and (prefers-reduced-motion: no-preference)', () => {
    const heroPv = document.getElementById('hero-pv');
    if (!heroPv) return;
    heroPv.classList.add('pv--scene');
    const draw = heroPv.querySelector('.pv-draw');
    const real = heroPv.querySelector('.pv-real');
    const dims = heroPv.querySelector('.pv-dims');
    const capA = document.getElementById('hero-cap-a');
    const capB = document.getElementById('hero-cap-b');
    gsap.set(real, { opacity: 0 });
    gsap.set(capB, { opacity: 0 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '+=110%',
        scrub: 0.4,
        pin: true,
        anticipatePin: 1,
      },
    });
    tl.to('.hero-hint', { opacity: 0, duration: 0.12 }, 0)
      .to(dims, { opacity: 0, duration: 0.25 }, 0.05)
      .to(draw, { opacity: 0, duration: 0.5 }, 0.2)
      .to(real, { opacity: 1, duration: 0.55 }, 0.32)
      .to(capA, { opacity: 0, duration: 0.18 }, 0.36)
      .to(capB, { opacity: 1, duration: 0.28 }, 0.48);
    return () => {
      /* при выходе из брейкпоинта лист снова подчиняется тумблеру */
      heroPv.classList.remove('pv--scene');
      gsap.set([draw, real, dims, capA, capB, '.hero-hint'], { clearProps: 'opacity' });
    };
  });

  /* ── Сцены, живущие на любой ширине (если движение разрешено) */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    /* шкала операций */
    if (track) {
      opsCur = -1;
      opsSet(0);
      ScrollTrigger.create({
        trigger: track.closest('.chapter'),
        start: 'top 78%',
        end: 'bottom 35%',
        scrub: true,
        onUpdate: (st) => opsSet(Math.min(6, Math.floor(st.progress * 7))),
      });
    }
    /* разрез стены: стена «зарастает», крепёж исчезает */
    if (cs) {
      const tl2 = gsap.timeline({
        scrollTrigger: {
          trigger: '#concealed',
          start: 'top 60%',
          end: 'center 28%',
          scrub: 0.5,
        },
      });
      tl2.to('#cs-section', { opacity: 0, duration: 0.5 }, 0)
        .to('#cs-plain', { opacity: 1, duration: 0.5 }, 0.1)
        .to('#cs-hook-draw', { opacity: 0, duration: 0.4 }, 0.28)
        .to('#cs-hook-real', { opacity: 1, duration: 0.5 }, 0.36)
        .to('#cs-cap-a', { opacity: 0, duration: 0.2 }, 0.32)
        .to('#cs-cap-b', { opacity: 1, duration: 0.28 }, 0.44);
    }
    return () => { opsSet(6); };
  });

  /* пересчёт позиций после полной загрузки и готовности шрифтов */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
