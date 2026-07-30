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
  /* srcset рендера: компактная версия для карточек, полная для ретины */
  const R_SIZES = '(max-width: 560px) 80vw, (max-width: 1100px) 40vw, 360px';
  function rset(src) {
    return `srcset="${src.replace('.webp', '-sm.webp')} 750w, ${src} 1500w"`;
  }

  function cardMedia(p) {
    if (p.lifeB) {
      return `<span class="p-media p-media--photo">
        <span class="duo m-life">
          <img class="v-b" src="${p.lifeB}" alt="${p.name} в интерьере, чёрный" loading="lazy" decoding="async">
          <img class="v-w" src="${p.lifeW}" alt="${p.name} в интерьере, белый" loading="lazy" decoding="async">
        </span>
        <span class="duo duo--contain m-render">
          <img class="v-b" src="${p.imgB}" ${rset(p.imgB)} sizes="${R_SIZES}" alt="" loading="lazy" decoding="async">
          <img class="v-w" src="${p.imgW}" ${rset(p.imgW)} sizes="${R_SIZES}" alt="" loading="lazy" decoding="async">
        </span>
      </span>`;
    }
    /* --ds — поэлементный масштаб: мелкие крючки кадрированы
       в исходниках с большими полями и без него тонут в карточке */
    return `<span class="p-media"><span class="duo duo--contain" style="--ds:${p.scale || 1}">
      <img class="v-b" src="${p.imgB}" ${rset(p.imgB)} sizes="${R_SIZES}" alt="${p.name}, чёрный" loading="lazy" decoding="async">
      <img class="v-w" src="${p.imgW}" ${rset(p.imgW)} sizes="${R_SIZES}" alt="${p.name}, белый" loading="lazy" decoding="async">
    </span></span>`;
  }

  const cards = document.getElementById('cards');
  cards.insertAdjacentHTML('beforeend', P.map((p, i) => `
    <button class="p-card" type="button" data-id="${p.id}" data-reveal data-delay="${(i % 3) * 70}">
      <span class="p-code">${p.code}</span>
      <span class="p-idx" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      ${cardMedia(p)}
      <span class="p-info">
        <span class="p-name">${p.name}<small>${p.sub}</small></span>
        <span class="p-price">${GB.fmtPrice(p.price)}</span>
      </span>
    </button>`).join(''));

  /* служебная плитка закрывает пустой хвост сетки из семи позиций
     и ведёт в подбор комплекта */
  cards.insertAdjacentHTML('beforeend',
    '<a class="p-card p-card--cta" href="contacts.html" data-reveal>' +
      '<span class="t-label">Подбор комплекта</span>' +
      '<span class="cta-big t-head">Не уверены, что подойдёт к вашей плитке?</span>' +
      '<span class="cta-note">Пришлите фото ванной — соберём комплект под интерьер и посчитаем доставку.</span>' +
      '<span class="cta-go">Написать нам <i aria-hidden="true">→</i></span>' +
    '</a>');

  /* поздние reveal-элементы — наблюдаем вручную */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          if (el.dataset.delay) el.style.setProperty('--reveal-delay', el.dataset.delay + 'ms');
          el.classList.add('is-in');
          /* вернуть карточке её тайминги ховера (правило .is-done) */
          const done = () => el.classList.add('is-done');
          el.addEventListener('transitionend', done, { once: true });
          setTimeout(done, 1400);
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
    const M_SIZES = '(max-width: 700px) 45vw, 480px';
    if (p.lifeB) {
      media.classList.add('pm-media--stack');
      duo.className = 'pm-stack';
      duo.innerHTML = `
        <span class="pm-shot duo">
          <img class="v-b" src="${p.lifeB}" alt="${p.name} в интерьере, чёрный" decoding="async">
          <img class="v-w" src="${p.lifeW}" alt="${p.name} в интерьере, белый" decoding="async">
        </span>
        <span class="pm-render duo">
          <img class="v-b" src="${p.imgB}" ${rset(p.imgB)} sizes="${M_SIZES}" alt="${p.name}, чёрный" decoding="async">
          <img class="v-w" src="${p.imgW}" ${rset(p.imgW)} sizes="${M_SIZES}" alt="${p.name}, белый" decoding="async">
        </span>`;
    } else {
      media.classList.remove('pm-media--stack');
      duo.className = 'duo duo--contain';
      duo.innerHTML = `
        <img class="v-b" src="${p.imgB}" ${rset(p.imgB)} sizes="${M_SIZES}" alt="${p.name}, чёрный" decoding="async">
        <img class="v-w" src="${p.imgW}" ${rset(p.imgW)} sizes="${M_SIZES}" alt="${p.name}, белый" decoding="async">`;
    }
    document.getElementById('pm-specs').innerHTML = [
      specRow('Артикул', p.code),
      specRow('Размеры', p.dims),
      specRow('Материал', p.steel),
      specRow('Монтаж', p.mount),
      specRow('Цвета', 'чёрный матовый · белый матовый'),
    ].join('');
    const count = document.getElementById('pm-count');
    if (count) {
      count.textContent = String(i + 1).padStart(2, '0') + ' / ' +
        String(P.length).padStart(2, '0');
    }
    syncOrderLink();
  }

  function orderText(p) {
    return 'Здравствуйте!\n\nХочу заказать: ' + p.code + ' · ' + p.name +
      '\nЦвет: ' + finName() + '\nЦена по сайту: ' + GB.fmtPrice(p.price) +
      '\n\nГород и удобный способ доставки: ';
  }
  function syncOrderLink() {
    const p = P[current];
    const order = document.getElementById('pm-order');
    order.setAttribute('href', 'mailto:hello@gambardini.ru?subject=' +
      encodeURIComponent('Заказ ' + p.code + ' — ' + p.name) +
      '&body=' + encodeURIComponent(orderText(p)));
  }
  document.addEventListener('gb:fin', syncOrderLink);

  /* запасной канал: заявка копируется в буфер — для тех, у кого
     не настроен почтовый клиент */
  const copyBtn = document.getElementById('pm-copy');
  let copyTimer = null;
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const flash = (t) => {
      copyBtn.textContent = t;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyBtn.textContent = 'скопировать заявку'; }, 2800);
    };
    const text = orderText(P[current]) + '\n\n→ hello@gambardini.ru';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => flash('скопировано — вставьте в любой мессенджер'),
        () => flash('не вышло — напишите на hello@gambardini.ru')
      );
    } else flash('не вышло — напишите на hello@gambardini.ru');
  });

  const sheet = layer.querySelector('.pm');
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closeTimer = null;
  /* история: открытие кладёт запись поверх чистого URL, чтобы
     системная «Назад» закрывала карточку, а не уводила со страницы */
  let pushed = false;      /* наша запись сейчас в истории */
  let ignorePop = false;   /* закрытие кнопкой уже отработано — popstate глушим */

  function openModal(i, keepHash) {
    const wasOpen = !layer.hidden;
    current = (i + P.length) % P.length;
    renderModal(current);
    /* запоминаем только внешний фокус: при листании внутри карточки
       activeElement — это её же кнопки, и возвращать фокус туда нельзя */
    if (!wasOpen && !layer.contains(document.activeElement)) {
      lastFocus = document.activeElement;
    }

    clearTimeout(closeTimer);
    sheet.classList.remove('is-dragging');
    sheet.style.transform = '';
    layer.hidden = false;
    layer.removeAttribute('aria-hidden');
    document.body.classList.add('pm-open');
    if (window.gbLenis) gbLenis.stop();
    /* синхронный reflow фиксирует исходное состояние перехода.
       rAF здесь ненадёжен: в фоновой вкладке он не выполняется,
       и шторка осталась бы невидимой */
    void layer.offsetWidth;
    layer.classList.add('is-open');

    if (!keepHash) {
      try {
        if (pushed || (history.state && history.state.pm)) {
          history.replaceState({ pm: 1 }, '', '#' + P[current].id);
        } else {
          history.pushState({ pm: 1 }, '', '#' + P[current].id);
          pushed = true;
        }
      } catch (e) { /* — */ }
    } else {
      try { history.replaceState({ pm: 1 }, '', '#' + P[current].id); } catch (e) { /* — */ }
    }
    /* при листании озвучиваем новый товар — фокус на заголовок,
       при первом открытии оставляем его на кнопке закрытия */
    const target = wasOpen ? document.getElementById('pm-name') : document.getElementById('pm-close');
    if (target) target.focus({ preventScroll: true });
  }

  /* собственно закрытие — без работы с историей */
  function doClose() {
    if (layer.hidden) return;
    layer.classList.remove('is-open');
    sheet.classList.remove('is-dragging');
    sheet.style.transform = '';         /* шторка уезжает вниз по CSS */
    document.body.classList.remove('pm-open');
    if (window.gbLenis) gbLenis.start();

    /* возвращаем фокус наружу; если исходный элемент исчез — на карточку товара */
    const back = (lastFocus && document.contains(lastFocus) && !layer.contains(lastFocus))
      ? lastFocus
      : cards.querySelector('.p-card[data-id="' + P[current].id + '"]');
    if (back) back.focus({ preventScroll: true });

    /* из дерева доступности убираем сразу: пока жив aria-modal,
       скринридер не видит страницу под диалогом */
    layer.setAttribute('aria-hidden', 'true');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => { layer.hidden = true; }, REDUCED ? 0 : 480);
  }

  /* закрытие из интерфейса: снимаем и нашу запись в истории */
  function closeModal() {
    if (layer.hidden) return;
    doClose();
    if (pushed) {
      pushed = false;
      ignorePop = true;
      try { history.back(); } catch (e) { /* — */ }
    } else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* — */ }
    }
  }

  /* системная «Назад» закрывает карточку, «Вперёд» возвращает её */
  window.addEventListener('popstate', (e) => {
    if (ignorePop) { ignorePop = false; return; }
    if (e.state && e.state.pm) {
      const id = location.hash.replace('#', '');
      const k = P.findIndex((p) => p.id === id);
      if (k >= 0) { pushed = true; openModal(k, true); }
    } else if (!layer.hidden) {
      pushed = false;
      doClose();
    }
  });

  cards.addEventListener('click', (e) => {
    const card = e.target.closest('.p-card');
    if (!card) return;
    if (!card.dataset.id) return;   /* сервисная CTA-плитка — обычная ссылка */
    openModal(P.findIndex((p) => p.id === card.dataset.id));
  });

  document.getElementById('pm-close').addEventListener('click', closeModal);

  /* Свайп вниз по фото закрывает шторку.
     Тянем за пальцем 1:1, вверх — с сопротивлением; решение принимаем
     по пройденному пути ИЛИ по скорости броска. */
  (function swipeToClose() {
    const grip = document.getElementById('pm-media');
    if (!grip || !sheet) return;
    let startY = 0, dy = 0, active = false;
    /* две последние точки жеста: по ним считаем скорость броска */
    let lastY = 0, lastT = 0, prevY = 0, prevT = 0;

    const reset = () => {
      active = false;
      sheet.classList.remove('is-dragging');
      sheet.style.transform = '';
    };

    const onStart = (e) => {
      if (!layer.classList.contains('is-open')) return;
      if (!matchMedia('(max-width: 700px)').matches) return;
      /* второй палец не должен переустанавливать точку отсчёта */
      if (active || e.touches.length > 1) return;
      active = true;
      dy = 0;
      startY = e.touches[0].clientY;
      lastY = prevY = startY;
      lastT = prevT = performance.now();
      sheet.classList.add('is-dragging');
    };

    const onMove = (e) => {
      if (!active) return;
      if (e.touches.length > 1) { reset(); return; }   /* пошёл зум — отдаём жест */
      const y = e.touches[0].clientY;
      const raw = y - startY;
      /* вверх шторка почти не идёт — мягкое сопротивление */
      dy = raw >= 0 ? raw : raw * 0.18;
      sheet.style.transform = 'translateY(' + dy.toFixed(1) + 'px)';
      /* сдвигаем «окно» не чаще ~40 мс — так prev остаётся точкой
         за момент до броска, а не самим броском */
      const now = performance.now();
      if (now - lastT > 40) { prevY = lastY; prevT = lastT; }
      lastY = y;
      lastT = now;
    };

    const onEnd = (e) => {
      if (!active) return;
      if (e.touches && e.touches.length) return;      /* ещё есть пальцы на экране */
      const travelled = dy;
      /* скорость по последнему отрезку, а не средняя за жест: иначе
         бросок после паузы не распознаётся. performance.now() вместо
         e.timeStamp — последний бывает нулевым у синтетических событий */
      const velocity = (lastY - prevY) / Math.max(1, lastT - prevT);
      reset();
      if (travelled > 110 || (velocity > 0.55 && travelled > 40)) closeModal();
    };

    grip.addEventListener('touchstart', onStart, { passive: true });
    grip.addEventListener('touchmove', onMove, { passive: true });
    grip.addEventListener('touchend', onEnd);
    /* отменённый системой жест (шторка ОС, звонок) не должен закрывать карточку */
    grip.addEventListener('touchcancel', () => { if (active) reset(); });
  })();
  document.getElementById('pm-next').addEventListener('click', () => openModal(current + 1));
  const prevBtn = document.getElementById('pm-prev');
  if (prevBtn) prevBtn.addEventListener('click', () => openModal(current - 1));

  /* «В корзину»: кладём текущий товар в выбранном цвете */
  const addBtn = document.getElementById('pm-add');
  let addTimer = null;
  if (addBtn) addBtn.addEventListener('click', () => {
    if (!window.gbCart) return;
    const fin = document.documentElement.classList.contains('fin-w') ? 'w' : 'b';
    gbCart.add(P[current].id, fin);
    addBtn.textContent = 'В корзине ✓';
    clearTimeout(addTimer);
    addTimer = setTimeout(() => { addBtn.textContent = 'В корзину'; }, 1600);
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
      /* клик по тексту или фото сбрасывает фокус на body —
         тогда Tab уводил из диалога на скрытую страницу */
      if (!layer.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── Deep-link #g02 ───────────────────────────────────────── */
  const hash = location.hash.replace('#', '');
  const j = P.findIndex((p) => p.id === hash);
  if (j >= 0) openModal(j, true);
})();
