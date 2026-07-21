/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI v3 — каталог: карточки и модальная карточка товара.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.GB) return;

  const P = GB.PRODUCTS;
  let current = 0;
  let lastFocus = null;

  /* ── Карточки: интерьерное фото — главное, рендер на ховере ── */
  function cardMedia(p) {
    if (p.lifeB) {
      return `<span class="p-media p-media--photo">
        <span class="duo m-life">
          <img class="v-b" src="${p.lifeB}" alt="${p.name} в интерьере, чёрный" loading="lazy">
          <img class="v-w" src="${p.lifeW}" alt="${p.name} в интерьере, белый" loading="lazy">
        </span>
        <span class="duo duo--contain m-render">
          <img class="v-b" src="${p.imgB}" alt="" loading="lazy">
          <img class="v-w" src="${p.imgW}" alt="" loading="lazy">
        </span>
      </span>`;
    }
    return `<span class="p-media"><span class="duo duo--contain">
      <img class="v-b" src="${p.imgB}" alt="${p.name}, чёрный" loading="lazy">
      <img class="v-w" src="${p.imgW}" alt="${p.name}, белый" loading="lazy">
    </span></span>`;
  }

  const cards = document.getElementById('cards');
  cards.insertAdjacentHTML('beforeend', P.map((p, i) => `
    <button class="p-card" type="button" data-id="${p.id}" data-reveal data-delay="${(i % 3) * 70}">
      <span class="p-code">${p.code}</span>
      ${cardMedia(p)}
      <span class="p-info">
        <span class="p-name">${p.name}<small>${p.sub}</small></span>
        <span class="p-price">${GB.fmtPrice(p.price)}</span>
      </span>
    </button>`).join(''));

  /* поздние reveal-элементы — наблюдаем вручную */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          if (el.dataset.delay) el.style.setProperty('--reveal-delay', el.dataset.delay + 'ms');
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    cards.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  } else {
    cards.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
  }

  /* ── Модальная карточка ───────────────────────────────────── */
  const layer = document.getElementById('pm-layer');

  function finName() {
    return document.documentElement.classList.contains('fin-w') ? 'белый' : 'чёрный';
  }

  function specRow(dt, dd) {
    return `<div class="row"><dt>${dt}</dt><dd>${dd}</dd></div>`;
  }

  function renderModal(i) {
    const p = P[i];
    document.getElementById('pm-code').textContent = p.code;
    document.getElementById('pm-name').textContent = p.name;
    document.getElementById('pm-sub').textContent = p.sub;
    document.getElementById('pm-price').textContent = GB.fmtPrice(p.price);
    document.getElementById('pm-desc').textContent = p.desc;
    const media = document.getElementById('pm-media');
    const duo = document.getElementById('pm-duo');
    if (p.lifeB) {
      media.classList.add('pm-media--stack');
      duo.className = 'pm-stack';
      duo.innerHTML = `
        <span class="pm-shot duo">
          <img class="v-b" src="${p.lifeB}" alt="${p.name} в интерьере, чёрный">
          <img class="v-w" src="${p.lifeW}" alt="${p.name} в интерьере, белый">
        </span>
        <span class="pm-render duo">
          <img class="v-b" src="${p.imgB}" alt="${p.name}, чёрный">
          <img class="v-w" src="${p.imgW}" alt="${p.name}, белый">
        </span>`;
    } else {
      media.classList.remove('pm-media--stack');
      duo.className = 'duo duo--contain';
      duo.innerHTML = `
        <img class="v-b" src="${p.imgB}" alt="${p.name}, чёрный">
        <img class="v-w" src="${p.imgW}" alt="${p.name}, белый">`;
    }
    document.getElementById('pm-specs').innerHTML = [
      specRow('Артикул', p.code),
      specRow('Размеры', p.dims),
      specRow('Материал', p.steel),
      specRow('Монтаж', p.mount),
      specRow('Цвета', 'чёрный матовый · белый матовый'),
    ].join('');
    syncOrderLink();
  }

  function syncOrderLink() {
    const p = P[current];
    const order = document.getElementById('pm-order');
    const body = 'Здравствуйте!\n\nХочу заказать: ' + p.code + ' · ' + p.name +
      '\nЦвет: ' + finName() + '\nЦена по сайту: ' + GB.fmtPrice(p.price) +
      '\n\nГород и удобный способ доставки: ';
    order.setAttribute('href', 'mailto:hello@gambardini.ru?subject=' +
      encodeURIComponent('Заказ ' + p.code + ' — ' + p.name) +
      '&body=' + encodeURIComponent(body));
  }
  document.addEventListener('gb:fin', syncOrderLink);

  function openModal(i, keepHash) {
    current = (i + P.length) % P.length;
    renderModal(current);
    lastFocus = document.activeElement;
    layer.hidden = false;
    layer.classList.add('is-open');
    document.body.classList.add('pm-open');
    if (window.gbLenis) gbLenis.stop();
    if (!keepHash) {
      try { history.replaceState(null, '', '#' + P[current].id); } catch (e) { /* — */ }
    }
    document.getElementById('pm-close').focus();
  }

  function closeModal() {
    layer.classList.remove('is-open');
    layer.hidden = true;
    document.body.classList.remove('pm-open');
    if (window.gbLenis) gbLenis.start();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* — */ }
    if (lastFocus) lastFocus.focus();
  }

  cards.addEventListener('click', (e) => {
    const card = e.target.closest('.p-card');
    if (!card) return;
    openModal(P.findIndex((p) => p.id === card.dataset.id));
  });

  document.getElementById('pm-close').addEventListener('click', closeModal);
  document.getElementById('pm-next').addEventListener('click', () => {
    openModal(current + 1);
    document.getElementById('pm-close').focus();
  });
  layer.addEventListener('click', (e) => { if (e.target === layer) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (!layer.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') { e.preventDefault(); openModal(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); openModal(current - 1); }
    if (e.key === 'Tab') {
      const f = layer.querySelectorAll('button, a[href]');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── Deep-link #g02 ───────────────────────────────────────── */
  const hash = location.hash.replace('#', '');
  const j = P.findIndex((p) => p.id === hash);
  if (j >= 0) openModal(j, true);
})();
