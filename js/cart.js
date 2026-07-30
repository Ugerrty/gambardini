/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI — заявка (корзина без оплаты).
   Хранится через gbStore: переживает закрытие сайта, если
   пользователь не выбрал «только сессия» в плашке cookies.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.GB || !window.gbStore) return;

  const KEY = 'gb-cart';
  const P = GB.byId;
  let items = load();

  function load() {
    let raw = null;
    try { raw = JSON.parse(gbStore.get(KEY) || '[]'); } catch (e) { raw = []; }
    if (!Array.isArray(raw)) raw = [];
    /* чистим битые записи: товар мог исчезнуть из каталога */
    return raw.filter((it) => it && P[it.id] && (it.fin === 'b' || it.fin === 'w'))
      .map((it) => ({ id: it.id, fin: it.fin, qty: Math.min(99, Math.max(1, it.qty | 0 || 1)) }));
  }
  function save() { gbStore.set(KEY, JSON.stringify(items)); }

  const count = () => items.reduce((s, it) => s + it.qty, 0);
  const sum = () => items.reduce((s, it) => s + P[it.id].price * it.qty, 0);
  const finName = (f) => (f === 'w' ? 'белый' : 'чёрный');

  /* ── Кнопка в шапке ───────────────────────────────────────── */
  const controls = document.querySelector('.header-controls');
  const burger = controls && controls.querySelector('.nav-burger');
  if (controls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cart-btn';
    b.id = 'cart-btn';
    b.innerHTML = '<span class="cart-lbl">Заявка</span><span class="cart-n" id="cart-n" aria-hidden="true">0</span>';
    controls.insertBefore(b, burger || null);
    b.addEventListener('click', () => openCart());
  }

  /* ── Шторка ───────────────────────────────────────────────── */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="cart-layer" id="cart-layer" role="dialog" aria-modal="true" aria-label="Заявка" hidden>' +
      '<aside class="cart-panel" data-lenis-prevent>' +
        '<header class="cart-head">' +
          '<span class="t-label">Заявка</span>' +
          '<span class="cart-head-n" id="cart-head-n"></span>' +
          '<button class="cart-close" type="button" id="cart-close" aria-label="Закрыть заявку">×</button>' +
        '</header>' +
        '<div class="cart-body" id="cart-body" data-lenis-prevent></div>' +
        '<footer class="cart-foot" id="cart-foot">' +
          '<div class="cart-sum-row"><span class="t-label">Итого</span><b class="cart-sum" id="cart-sum"></b></div>' +
          '<p class="cart-note">Это заявка, не&nbsp;оплата: в&nbsp;ответ подтвердим наличие, посчитаем доставку и&nbsp;пришлём ссылку на&nbsp;оплату или счёт.</p>' +
          '<a class="btn btn--ink cart-send" id="cart-send" href="mailto:hello@gambardini.ru">Отправить письмом</a>' +
          '<p class="cart-alt">Или: <button class="pm-copy" type="button" id="cart-copy" aria-live="polite">скопировать заявку</button> · <a href="tel:+74951203874">по&nbsp;телефону</a></p>' +
        '</footer>' +
      '</aside>' +
    '</div>');

  const layer = document.getElementById('cart-layer');
  const body = document.getElementById('cart-body');
  const nEl = document.getElementById('cart-n');
  let lastFocus = null;
  let closeTimer = null;

  function thumb(p, fin) {
    const src = (fin === 'w' ? p.imgW : p.imgB).replace('.webp', '-sm.webp');
    return '<img src="' + src + '" alt="" loading="lazy" decoding="async">';
  }

  function orderText() {
    const lines = items.map((it, i) => {
      const p = P[it.id];
      return (i + 1) + '. ' + p.code + ' · ' + p.name + ' · ' + finName(it.fin) +
        ' · ' + it.qty + ' шт · ' + GB.fmtPrice(p.price * it.qty);
    });
    return 'Здравствуйте!\n\nЗаявка с сайта GAMBARDINI:\n\n' + lines.join('\n') +
      '\n\nИтого: ' + GB.fmtPrice(sum()) +
      '\n\nГород и удобный способ доставки: ';
  }

  function render() {
    if (nEl) {
      nEl.textContent = String(count());
      nEl.classList.toggle('has', count() > 0);
    }
    const btn = document.getElementById('cart-btn');
    if (btn) btn.setAttribute('aria-label', 'Заявка, предметов: ' + count());
    document.getElementById('cart-head-n').textContent = count() ? count() + ' шт' : '';

    if (!items.length) {
      body.innerHTML = '<div class="cart-empty">' +
        '<p class="cart-empty-t">Пока пусто</p>' +
        '<p>Добавьте предметы из&nbsp;каталога — заявка сохранится на&nbsp;этом устройстве.</p>' +
        '<a class="btn btn--ghost" href="catalog.html">В каталог</a></div>';
      document.getElementById('cart-foot').hidden = true;
      return;
    }
    document.getElementById('cart-foot').hidden = false;
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
          '<button class="cart-rm" type="button" data-act="rm" aria-label="Убрать из заявки">×</button>' +
        '</span>' +
      '</li>';
    }).join('') + '</ul>';

    document.getElementById('cart-sum').textContent = GB.fmtPrice(sum());
    document.getElementById('cart-send').setAttribute('href',
      'mailto:hello@gambardini.ru?subject=' + encodeURIComponent('Заявка GAMBARDINI — ' + count() + ' шт') +
      '&body=' + encodeURIComponent(orderText()));
  }

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

  let copyTimer = null;
  document.getElementById('cart-copy').addEventListener('click', () => {
    const el = document.getElementById('cart-copy');
    const flash = (t) => {
      el.textContent = t;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { el.textContent = 'скопировать заявку'; }, 2800);
    };
    const text = orderText() + '\n\n→ hello@gambardini.ru';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => flash('скопировано — вставьте в любой мессенджер'),
        () => flash('не вышло — напишите на hello@gambardini.ru')
      );
    } else flash('не вышло — напишите на hello@gambardini.ru');
  });

  function openCart() {
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
  layer.addEventListener('click', (e) => { if (e.target === layer) closeCart(); });
  document.addEventListener('keydown', (e) => {
    if (layer.hidden) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {
      const f = layer.querySelectorAll('button, a[href]');
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
