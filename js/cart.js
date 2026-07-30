/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI — корзина и оформление заказа.
   Товары и данные получателя хранятся через gbStore и переживают
   закрытие сайта (если пользователь не отказался от cookies).
   Финал оформления — письмо с полным заказом: оплата по ссылке
   или счёту приходит в ответ (бэкенда у сайта нет).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.GB || !window.gbStore) return;

  const KEY = 'gb-cart';
  const CO_KEY = 'gb-co';
  const P = GB.byId;
  let items = load();
  let view = 'list';               /* 'list' | 'form' */

  function load() {
    let raw = null;
    try { raw = JSON.parse(gbStore.get(KEY) || '[]'); } catch (e) { raw = []; }
    if (!Array.isArray(raw)) raw = [];
    /* чистим битые записи: товар мог исчезнуть из каталога */
    return raw.filter((it) => it && P[it.id] && (it.fin === 'b' || it.fin === 'w'))
      .map((it) => ({ id: it.id, fin: it.fin, qty: Math.min(99, Math.max(1, it.qty | 0 || 1)) }));
  }
  function save() { gbStore.set(KEY, JSON.stringify(items)); }

  function loadCo() {
    try { return JSON.parse(gbStore.get(CO_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveCo(d) { gbStore.set(CO_KEY, JSON.stringify(d)); }

  const count = () => items.reduce((s, it) => s + it.qty, 0);
  const sum = () => items.reduce((s, it) => s + P[it.id].price * it.qty, 0);
  const finName = (f) => (f === 'w' ? 'белый' : 'чёрный');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const SHIP = { courier: 'курьер по Москве', transport: 'транспортная компания по России' };
  const PAY = { card: 'картой по ссылке', invoice: 'счёт для юрлица' };

  /* ── Кнопка в шапке ───────────────────────────────────────── */
  const controls = document.querySelector('.header-controls');
  const burger = controls && controls.querySelector('.nav-burger');
  if (controls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cart-btn';
    b.id = 'cart-btn';
    b.innerHTML = '<span class="cart-lbl">Корзина</span><span class="cart-n" id="cart-n" aria-hidden="true">0</span>';
    controls.insertBefore(b, burger || null);
    b.addEventListener('click', () => openCart());
  }

  /* ── Шторка ───────────────────────────────────────────────── */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="cart-layer" id="cart-layer" role="dialog" aria-modal="true" aria-label="Корзина" hidden>' +
      '<aside class="cart-panel" data-lenis-prevent>' +
        '<header class="cart-head">' +
          '<button class="cart-back" type="button" id="cart-back" aria-label="Назад в корзину" hidden>←</button>' +
          '<span class="t-label" id="cart-title">Корзина</span>' +
          '<span class="cart-head-n" id="cart-head-n"></span>' +
          '<button class="cart-close" type="button" id="cart-close" aria-label="Закрыть корзину">×</button>' +
        '</header>' +
        '<div class="cart-body" id="cart-body" data-lenis-prevent></div>' +
        '<footer class="cart-foot" id="cart-foot"></footer>' +
      '</aside>' +
    '</div>');

  const layer = document.getElementById('cart-layer');
  const body = document.getElementById('cart-body');
  const foot = document.getElementById('cart-foot');
  const backBtn = document.getElementById('cart-back');
  const nEl = document.getElementById('cart-n');
  let lastFocus = null;
  let closeTimer = null;

  function thumb(p, fin) {
    const src = (fin === 'w' ? p.imgW : p.imgB).replace('.webp', '-sm.webp');
    return '<img src="' + src + '" alt="" loading="lazy" decoding="async">';
  }

  function orderText() {
    const d = loadCo();
    const lines = items.map((it, i) => {
      const p = P[it.id];
      return (i + 1) + '. ' + p.code + ' · ' + p.name + ' · ' + finName(it.fin) +
        ' · ' + it.qty + ' шт · ' + GB.fmtPrice(p.price * it.qty);
    });
    let t = 'Здравствуйте!\n\nЗаказ с сайта GAMBARDINI:\n\n' + lines.join('\n') +
      '\n\nИтого: ' + GB.fmtPrice(sum());
    if (d.name || d.phone || d.city) {
      t += '\n\nПолучатель: ' + (d.name || '—') +
        '\nТелефон: ' + (d.phone || '—') +
        (d.email ? '\nE-mail: ' + d.email : '') +
        '\nГород: ' + (d.city || '—') +
        (d.addr ? '\nАдрес: ' + d.addr : '') +
        '\nДоставка: ' + (SHIP[d.ship] || SHIP.courier) +
        '\nОплата: ' + (PAY[d.pay] || PAY.card) +
        (d.comment ? '\nКомментарий: ' + d.comment : '');
    } else {
      t += '\n\nГород и удобный способ доставки: ';
    }
    return t;
  }

  function mailtoHref() {
    return 'mailto:hello@gambardini.ru?subject=' +
      encodeURIComponent('Заказ GAMBARDINI — ' + count() + ' шт, ' + GB.fmtPrice(sum())) +
      '&body=' + encodeURIComponent(orderText());
  }

  function renderHead() {
    if (nEl) {
      nEl.textContent = String(count());
      nEl.classList.toggle('has', count() > 0);
    }
    const btn = document.getElementById('cart-btn');
    if (btn) btn.setAttribute('aria-label', 'Корзина, товаров: ' + count());
    document.getElementById('cart-title').textContent = view === 'form' ? 'Оформление' : 'Корзина';
    document.getElementById('cart-head-n').textContent = count() ? count() + ' шт' : '';
    backBtn.hidden = view !== 'form';
  }

  function renderList() {
    if (!items.length) {
      body.innerHTML = '<div class="cart-empty">' +
        '<p class="cart-empty-t">Корзина пуста</p>' +
        '<p>Добавьте предметы из&nbsp;каталога — корзина сохранится на&nbsp;этом устройстве.</p>' +
        '<a class="btn btn--ghost" href="catalog.html">В каталог</a></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = '<ul class="cart-list">' + items.map((it, i) => {
      const p = P[it.id];
      return '<li class="cart-item" data-i="' + i + '">' +
        '<span class="cart-thumb">' + thumb(p, it.fin) + '</span>' +
        '<span class="cart-info">' +
          '<span class="cart-name">' + p.name + '</span>' +
          '<span class="cart-meta">' + p.code + ' · <i class="cart-dot cart-dot--' + it.fin + '"></i>' + finName(it.fin) + '</span>' +
          '<span class="cart-qty" aria-label="Количество">' +
            '<button type="button" data-act="dec" aria-label="Меньше">−</button>' +
            '<b>' + it.qty + '</b>' +
            '<button type="button" data-act="inc" aria-label="Больше">+</button>' +
          '</span>' +
        '</span>' +
        '<span class="cart-side">' +
          '<b class="cart-price">' + GB.fmtPrice(p.price * it.qty) + '</b>' +
          '<button class="cart-rm" type="button" data-act="rm" aria-label="Убрать из корзины">×</button>' +
        '</span>' +
      '</li>';
    }).join('') + '</ul>';

    foot.innerHTML =
      '<div class="cart-sum-row"><span class="t-label">Итого</span><b class="cart-sum">' + GB.fmtPrice(sum()) + '</b></div>' +
      '<p class="cart-note">Оплата после подтверждения заказа — картой по&nbsp;ссылке или по&nbsp;счёту.</p>' +
      '<button class="btn btn--ink cart-send" type="button" id="cart-checkout">Оформить заказ</button>' +
      '<p class="cart-alt">Или сразу: <button class="pm-copy" type="button" id="cart-copy" aria-live="polite">скопировать заказ</button> · <a href="tel:+74951203874">по&nbsp;телефону</a></p>';
  }

  function renderForm() {
    const d = loadCo();
    const field = (k, label, opts) => {
      opts = opts || {};
      return '<label class="co-field">' +
        '<span class="t-label">' + label + (opts.req ? '&nbsp;*' : '') + '</span>' +
        '<input name="' + k + '" type="' + (opts.type || 'text') + '"' +
        (opts.req ? ' required' : '') +
        (opts.ac ? ' autocomplete="' + opts.ac + '"' : '') +
        (opts.ph ? ' placeholder="' + opts.ph + '"' : '') +
        ' value="' + esc(d[k] || '') + '"></label>';
    };
    const radios = (k, legend, map, def) => {
      const cur = map[d[k]] ? d[k] : def;
      return '<fieldset class="co-group"><legend class="t-label">' + legend + '</legend>' +
        Object.keys(map).map((v) =>
          '<label class="co-opt"><input type="radio" name="' + k + '" value="' + v + '"' +
          (v === cur ? ' checked' : '') + '><span>' + map[v] + '</span></label>').join('') +
        '</fieldset>';
    };
    body.innerHTML =
      '<form class="co-form" id="cart-form" novalidate="false">' +
        field('name', 'Имя и фамилия', { req: true, ac: 'name' }) +
        field('phone', 'Телефон', { req: true, type: 'tel', ac: 'tel', ph: '+7' }) +
        field('email', 'E-mail', { type: 'email', ac: 'email' }) +
        field('city', 'Город', { req: true, ac: 'address-level2' }) +
        field('addr', 'Адрес — улица, дом, квартира', { ac: 'street-address' }) +
        radios('ship', 'Доставка', { courier: 'Курьер по Москве', transport: 'Транспортная по России' }, 'courier') +
        radios('pay', 'Оплата', { card: 'Картой по ссылке', invoice: 'Счёт для юрлица' }, 'card') +
        '<label class="co-field"><span class="t-label">Комментарий</span>' +
        '<textarea name="comment" rows="2">' + esc(d.comment || '') + '</textarea></label>' +
      '</form>';

    foot.hidden = false;
    foot.innerHTML =
      '<div class="cart-sum-row"><span class="t-label">Итого</span><b class="cart-sum">' + GB.fmtPrice(sum()) + '</b></div>' +
      '<button class="btn btn--ink cart-send" type="submit" form="cart-form">Отправить заказ</button>' +
      '<p class="cart-note">Откроется готовое письмо — просто отправьте его. В&nbsp;ответ подтвердим наличие, посчитаем доставку и&nbsp;пришлём ссылку на&nbsp;оплату или счёт.</p>' +
      '<p class="cart-alt">Почта не&nbsp;настроена? <button class="pm-copy" type="button" id="cart-copy" aria-live="polite">Скопируйте заказ</button> и&nbsp;пришлите в&nbsp;любой мессенджер.</p>';
  }

  function render() {
    if (view === 'form' && !items.length) view = 'list';
    renderHead();
    if (view === 'form') renderForm();
    else renderList();
  }

  /* данные формы сохраняем на каждый ввод */
  function collectCo() {
    const form = document.getElementById('cart-form');
    if (!form) return loadCo();
    const d = {};
    ['name', 'phone', 'email', 'city', 'addr', 'comment'].forEach((k) => {
      const el = form.elements[k];
      if (el) d[k] = el.value.trim();
    });
    ['ship', 'pay'].forEach((k) => {
      const el = form.querySelector('input[name="' + k + '"]:checked');
      if (el) d[k] = el.value;
    });
    return d;
  }
  body.addEventListener('input', () => {
    if (view === 'form') saveCo(collectCo());
  });
  body.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = document.getElementById('cart-form');
    if (!form.reportValidity()) return;
    saveCo(collectCo());
    window.location.href = mailtoHref();
  });

  body.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const row = e.target.closest('.cart-item');
    const i = Number(row.dataset.i);
    if (!items[i]) return;
    if (act.dataset.act === 'inc') items[i].qty = Math.min(99, items[i].qty + 1);
    if (act.dataset.act === 'dec') items[i].qty = Math.max(1, items[i].qty - 1);
    if (act.dataset.act === 'rm') items.splice(i, 1);
    save();
    render();
  });

  /* кнопки в пересобираемом футере — через делегирование */
  let copyTimer = null;
  layer.addEventListener('click', (e) => {
    if (e.target === layer) { closeCart(); return; }
    if (e.target.closest('#cart-checkout')) {
      view = 'form';
      render();
      const first = body.querySelector('input');
      if (first) first.focus({ preventScroll: true });
      return;
    }
    const copyBtn = e.target.closest('#cart-copy');
    if (copyBtn) {
      const base = copyBtn.textContent;
      const flash = (t) => {
        copyBtn.textContent = t;
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => { copyBtn.textContent = base; }, 2800);
      };
      const text = orderText() + '\n\n→ hello@gambardini.ru';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => flash('скопировано — вставьте в любой мессенджер'),
          () => flash('не вышло — напишите на hello@gambardini.ru')
        );
      } else flash('не вышло — напишите на hello@gambardini.ru');
    }
  });
  backBtn.addEventListener('click', () => { view = 'list'; render(); });

  function openCart() {
    view = 'list';
    render();
    lastFocus = document.activeElement;
    clearTimeout(closeTimer);
    layer.hidden = false;
    layer.removeAttribute('aria-hidden');
    document.body.classList.add('cart-open');
    if (window.gbLenis) gbLenis.stop();
    void layer.offsetWidth;               /* rAF в фоновой вкладке не идёт */
    layer.classList.add('is-open');
    const c = document.getElementById('cart-close');
    if (c) c.focus({ preventScroll: true });
  }
  function closeCart() {
    if (layer.hidden) return;
    layer.classList.remove('is-open');
    document.body.classList.remove('cart-open');
    if (window.gbLenis) gbLenis.start();
    layer.setAttribute('aria-hidden', 'true');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => { layer.hidden = true; }, 440);
  }

  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => {
    if (layer.hidden) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {
      const f = layer.querySelectorAll('button:not([hidden]), a[href], input, textarea');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!layer.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function add(id, fin, qty) {
    if (!P[id]) return;
    fin = fin === 'w' ? 'w' : 'b';
    qty = Math.min(99, Math.max(1, qty | 0 || 1));
    const hit = items.find((it) => it.id === id && it.fin === fin);
    if (hit) hit.qty = Math.min(99, hit.qty + qty);
    else items.push({ id, fin, qty });
    save();
    render();
    /* пульс счётчика в шапке */
    if (nEl) {
      nEl.classList.remove('bump');
      void nEl.offsetWidth;
      nEl.classList.add('bump');
    }
  }

  window.gbCart = { add, open: openCart, close: closeCart, count };
  render();
})();
