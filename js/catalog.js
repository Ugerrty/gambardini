/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI — каталог: индекс + закреплённый лист,
   перелистывание, отделки, ведомость заказа, спецификация.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.GB) return;

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = GB.PRODUCTS;
  const FIN_LABEL = {
    brass: 'латунь полированная, гальваника 12 мкм',
    nickel: 'никель матовый, гальваника 12 мкм',
    black: 'чёрный, порошковое покрытие',
  };

  let current = 0;
  let finish = 'brass';

  /* ── Элементы ─────────────────────────────────────────────── */
  const idx = document.getElementById('cat-index');
  const sheetBody = document.getElementById('sheet-body');
  const stage = document.getElementById('sheet-stage');
  const ghost = document.getElementById('sheet-ghost');
  const elTitle = document.getElementById('sheet-title');
  const elCode = document.getElementById('sheet-code');
  const elNote = document.getElementById('sheet-note');
  const elPass = document.getElementById('sheet-pass');
  const elFolio = document.getElementById('sheet-folio');
  const addBtn = document.getElementById('add-btn');
  const sheetWrap = document.querySelector('.cat-sheet-wrap');

  /* ── Индекс ───────────────────────────────────────────────── */
  idx.innerHTML = GB.CHAPTERS.map((ch) => `
    <section class="idx-chapter">
      <h2 class="idx-title"><span class="rn" aria-hidden="true">${ch.rn}</span><span class="cn">${ch.name}</span></h2>
      ${P.filter((p) => p.chapter === ch.n).map((p) => `
        <button type="button" class="idx-row" id="row-${p.id}" data-id="${p.id}">
          <span class="code">${p.code}</span>
          <span class="nm">${p.name}<small class="sub t-mono">${p.dims} · ${GB.fmtMass(p.w)}</small></span>
          <span class="pr">${GB.fmtPrice(p.price)}</span>
        </button>`).join('')}
    </section>`).join('');

  /* ── Лист ─────────────────────────────────────────────────── */
  function pad(n) { return String(n).padStart(2, '0'); }

  function passRow(dt, dd, big) {
    return `<div class="pi"><dt>${dt}</dt><dd${big ? ' class="big num"' : ''}>${dd}</dd></div>`;
  }

  function renderSheet(i) {
    const p = P[i];
    elTitle.textContent = p.name;
    elCode.textContent = p.code + ' · ' + p.view;
    stage.innerHTML = GB.svg(p);
    GB.applyFinish(stage, finish);
    elNote.textContent = p.note;
    elPass.innerHTML = [
      passRow('Артикул', p.code),
      passRow('Габариты', p.dims),
      passRow('Материал', p.mat),
      passRow('Покрытие', p.metal ? FIN_LABEL[finish] : '—'),
      passRow('Монтаж', p.mount),
      passRow('Нагрузка', p.load),
      passRow('Масса', GB.fmtMass(p.w)),
      passRow('Цена', GB.fmtPrice(p.price), true),
    ].join('');
    elFolio.textContent = 'лист ' + pad(i + 1) + ' / ' + pad(P.length) + ' · ' + p.scale;
    const wm = document.getElementById('sheet-wm');
    if (wm) wm.textContent = p.code;
    const status = document.getElementById('sheet-status');
    if (status) status.textContent = p.code + ' · ' + p.name + ' · лист ' + (i + 1) + ' из ' + P.length;
    addBtn.textContent = 'В заказ';
    addBtn.classList.remove('is-added');
  }

  function drawIn() {
    if (REDUCED || document.documentElement.classList.contains('mode-real')) return;
    const paths = stage.querySelectorAll('.pv-draw .ln-c');
    paths.forEach((el, i) => {
      if (typeof el.getTotalLength !== 'function') return;
      let L;
      try { L = el.getTotalLength(); } catch (e) { return; }
      if (!L || !isFinite(L)) return;
      el.style.strokeDasharray = L;
      el.style.strokeDashoffset = L;
      const a = el.animate(
        [{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
        { duration: 550, delay: 60 + i * 70, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }
      );
      a.onfinish = () => {
        el.style.strokeDasharray = '';
        el.style.strokeDashoffset = '';
      };
    });
  }

  function select(i, opts) {
    opts = opts || {};
    i = (i + P.length) % P.length;
    const prev = current;
    current = i;
    /* индекс */
    idx.querySelectorAll('.idx-row').forEach((r) => {
      const on = r.dataset.id === P[i].id;
      r.classList.toggle('is-active', on);
      if (on) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });
    if (!opts.keepHash) {
      try { history.replaceState(null, '', '#' + P[i].id); } catch (e) { /* — */ }
    }
    hideGhost();

    if (REDUCED || opts.instant || prev === i) {
      renderSheet(i);
      if (!opts.instant) drawIn();
      return;
    }
    /* снимаем прежние анимации листа — иначе быстрые клики дают двойной рендер */
    sheetBody.getAnimations().forEach((a) => a.cancel());
    const out = sheetBody.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' }
    );
    out.onfinish = () => {
      renderSheet(i);
      sheetBody.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
      );
      drawIn();
    };
  }

  /* призрак-превью при наведении */
  let ghostId = null;
  function showGhost(id) {
    if (id === P[current].id || REDUCED) return;
    if (ghostId !== id) {
      ghostId = id;
      ghost.innerHTML = GB.svg(GB.byId[id], { thumb: true, vb: '0 0 640 460' });
    }
    ghost.classList.add('is-on');
  }
  function hideGhost() {
    ghost.classList.remove('is-on');
  }

  idx.addEventListener('click', (e) => {
    const row = e.target.closest('.idx-row');
    if (!row) return;
    select(P.findIndex((p) => p.id === row.dataset.id));
    if (matchMedia('(max-width: 1100px)').matches && sheetWrap) {
      sheetWrap.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    }
  });
  idx.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.idx-row');
    if (row) showGhost(row.dataset.id);
  });
  idx.addEventListener('mouseout', (e) => {
    if (e.target.closest('.idx-row')) hideGhost();
  });

  document.getElementById('sheet-prev').addEventListener('click', () => select(current - 1));
  document.getElementById('sheet-next').addEventListener('click', () => select(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (document.getElementById('order-layer').classList.contains('is-open')) {
      if (e.key === 'Escape') closeOrder();
      if (e.key.indexOf('Arrow') === 0 || e.key === 'PageDown' || e.key === 'PageUp') e.preventDefault();
      return;
    }
    if (document.body.classList.contains('spec-mode')) return;
    /* ← → листают всегда; ↑ ↓ — только когда фокус внутри каталога,
       чтобы не отбирать у страницы клавиатурный скролл */
    const inCatalog = e.target.closest && e.target.closest('#catalog');
    if (e.key === 'ArrowRight' || (inCatalog && e.key === 'ArrowDown')) { e.preventDefault(); select(current + 1); }
    if (e.key === 'ArrowLeft' || (inCatalog && e.key === 'ArrowUp')) { e.preventDefault(); select(current - 1); }
  });

  /* ── Отделка ──────────────────────────────────────────────── */
  document.querySelectorAll('.finish-btn').forEach((b) => {
    b.addEventListener('click', () => {
      finish = b.dataset.finish;
      document.querySelectorAll('.finish-btn').forEach((x) => {
        x.setAttribute('aria-pressed', String(x === b));
      });
      GB.applyFinish(stage, finish);
      const p = P[current];
      if (p.metal) {
        const dds = elPass.querySelectorAll('dd');
        if (dds[3]) dds[3].textContent = FIN_LABEL[finish];
      }
    });
  });

  /* ── Заказ ────────────────────────────────────────────────── */
  addBtn.addEventListener('click', () => {
    gbOrder.add(P[current].id, 1);
    addBtn.textContent = 'Добавлено';
    addBtn.classList.add('is-added');
    setTimeout(() => {
      addBtn.textContent = 'В заказ';
      addBtn.classList.remove('is-added');
    }, 1400);
  });

  const layer = document.getElementById('order-layer');
  const rowsEl = document.getElementById('order-rows');
  const totalEl = document.getElementById('order-total');
  const mailEl = document.getElementById('order-mail');
  let lastFocus = null;

  function renderOrder() {
    /* сохраняем фокус: пересборка innerHTML иначе его теряет */
    const act = document.activeElement;
    const focusKey = act && (act.dataset.inc || act.dataset.dec || act.dataset.rm)
      ? { attr: act.dataset.inc ? 'data-inc' : (act.dataset.dec ? 'data-dec' : 'data-rm'), id: act.dataset.inc || act.dataset.dec || act.dataset.rm }
      : null;

    const printBtn = document.getElementById('order-print');
    const o = gbOrder.read();
    const ids = Object.keys(o).filter((id) => GB.byId[id]);
    if (!ids.length) {
      rowsEl.innerHTML = '<p class="order-empty">Ведомость пуста. Добавляйте позиции кнопкой «В&nbsp;заказ» на&nbsp;листе изделия.</p>';
      totalEl.innerHTML = '';
      mailEl.removeAttribute('href');
      mailEl.classList.add('is-disabled');
      mailEl.setAttribute('aria-disabled', 'true');
      if (printBtn) printBtn.disabled = true;
      return;
    }
    mailEl.classList.remove('is-disabled');
    mailEl.removeAttribute('aria-disabled');
    if (printBtn) printBtn.disabled = false;
    let total = 0;
    rowsEl.innerHTML = ids.map((id) => {
      const p = GB.byId[id];
      const q = o[id];
      const sum = p.price * q;
      total += sum;
      return `<div class="order-row">
        <span class="code">${p.code}</span>
        <span class="nm">${p.name}</span>
        <span class="qty" aria-label="Количество: ${q}">
          <button type="button" data-dec="${id}" aria-label="Убавить">−</button>
          <b class="num">${q}</b>
          <button type="button" data-inc="${id}" aria-label="Прибавить">+</button>
        </span>
        <span class="sum num">${GB.fmtPrice(sum)}</span>
        <button class="rm" type="button" data-rm="${id}">убрать</button>
      </div>`;
    }).join('');
    totalEl.innerHTML = '<span>Итого по ведомости</span><b class="num">' + GB.fmtPrice(total) + '</b>';

    const lines = ids.map((id) => {
      const p = GB.byId[id];
      return p.code + ' · ' + p.name + ' · ' + o[id] + ' шт. · ' + GB.fmtPrice(p.price * o[id]);
    });
    lines.push('', 'Итого: ' + GB.fmtPrice(total));
    const body = 'Здравствуйте!\n\nПрошу подтвердить наличие и сроки по ведомости:\n\n' + lines.join('\n') + '\n\n— отправлено с сайта gambardini';
    mailEl.setAttribute('href', 'mailto:hello@gambardini.ru?subject=' +
      encodeURIComponent('Заявка — спецификация заказа') + '&body=' + encodeURIComponent(body));

    /* возвращаем фокус на ту же кнопку (или на закрытие) */
    if (focusKey) {
      const back = rowsEl.querySelector('[' + focusKey.attr + '="' + focusKey.id + '"]');
      (back || document.getElementById('order-close')).focus();
    }
  }

  function openOrder() {
    lastFocus = document.activeElement;
    renderOrder();
    layer.hidden = false;
    layer.classList.add('is-open');
    document.body.classList.add('order-open');
    if (window.gbLenis) gbLenis.stop();
    try { history.replaceState(null, '', '#order'); } catch (e) { /* — */ }
    document.getElementById('order-close').focus();
  }
  function closeOrder() {
    layer.classList.remove('is-open');
    layer.hidden = true;
    document.body.classList.remove('order-open');
    if (window.gbLenis) gbLenis.start();
    try { history.replaceState(null, '', '#' + P[current].id); } catch (e) { /* — */ }
    if (lastFocus) lastFocus.focus();
  }

  /* ловушка фокуса внутри модальной ведомости */
  layer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = layer.querySelectorAll('button:not(:disabled), a[href]');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.querySelectorAll('.order-toggle').forEach((b) => {
    b.addEventListener('click', (e) => { e.preventDefault(); openOrder(); });
  });
  document.getElementById('order-close').addEventListener('click', closeOrder);
  layer.addEventListener('click', (e) => { if (e.target === layer) closeOrder(); });
  document.getElementById('order-print').addEventListener('click', () => window.print());

  rowsEl.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rm = e.target.closest('[data-rm]');
    const o = gbOrder.read();
    if (inc) gbOrder.setQty(inc.dataset.inc, (o[inc.dataset.inc] || 0) + 1);
    if (dec) gbOrder.setQty(dec.dataset.dec, (o[dec.dataset.dec] || 0) - 1);
    if (rm) gbOrder.setQty(rm.dataset.rm, 0);
    renderOrder();
  });

  /* ── Спецификация ─────────────────────────────────────────── */
  const specBtn = document.getElementById('spec-toggle');
  specBtn.addEventListener('click', () => {
    const on = document.body.classList.toggle('spec-mode');
    specBtn.setAttribute('aria-pressed', String(on));
    if (window.gbLenis) window.gbLenis.resize();
  });
  document.getElementById('spec-print').addEventListener('click', () => window.print());

  /* ── Старт: deep-link или первый лист ─────────────────────── */
  let start = 0;
  const hash = location.hash.replace('#', '');
  if (hash === 'order') {
    select(0, { instant: true, keepHash: true });
    openOrder();
  } else {
    const j = P.findIndex((p) => p.id === hash);
    start = j >= 0 ? j : 0;
    select(start, { instant: true });
    drawIn();
    if (j >= 0) {
      if (matchMedia('(min-width: 1101px)').matches) {
        /* липкий лист остаётся в кадре — прокручиваем к строке индекса */
        const row = document.getElementById('row-' + hash);
        if (row) row.scrollIntoView({ block: 'center' });
      } else {
        window.scrollTo(0, 0); /* на мобиле лист и так первый */
      }
    }
  }
})();
