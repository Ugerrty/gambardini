/* ═══════════════════════════════════════════════════════════════
   GAMBARDINI — реестр изделий и построитель чертежей
   Каждое изделие существует в двух состояниях:
   «чертёж» (ортогональная проекция, размеры) и «вещь» (предметный слой).
   Вью-бокс листа: 640 × 460.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Общие определения (градиенты, штриховки) ─────────────── */
  const DEFS = [
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>',
    '<linearGradient id="gbdef-brass-l" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#E7CF97"/><stop offset=".3" stop-color="#C8A765"/>',
    '<stop offset=".62" stop-color="#93753F"/><stop offset="1" stop-color="#6C5426"/></linearGradient>',
    '<radialGradient id="gbdef-brass-r" cx=".38" cy=".32" r=".85">',
    '<stop offset="0" stop-color="#EFDCA9"/><stop offset=".45" stop-color="#C2A160"/>',
    '<stop offset="1" stop-color="#75592B"/></radialGradient>',
    '<linearGradient id="gbdef-nickel-l" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#F1F1EF"/><stop offset=".3" stop-color="#C8CACA"/>',
    '<stop offset=".62" stop-color="#94969A"/><stop offset="1" stop-color="#6E7074"/></linearGradient>',
    '<radialGradient id="gbdef-nickel-r" cx=".38" cy=".32" r=".85">',
    '<stop offset="0" stop-color="#F7F7F5"/><stop offset=".45" stop-color="#C2C4C6"/>',
    '<stop offset="1" stop-color="#74767A"/></radialGradient>',
    '<linearGradient id="gbdef-black-l" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#57575B"/><stop offset=".3" stop-color="#39393D"/>',
    '<stop offset=".62" stop-color="#232327"/><stop offset="1" stop-color="#141416"/></linearGradient>',
    '<radialGradient id="gbdef-black-r" cx=".38" cy=".32" r=".85">',
    '<stop offset="0" stop-color="#606064"/><stop offset=".45" stop-color="#333337"/>',
    '<stop offset="1" stop-color="#101013"/></radialGradient>',
    '<linearGradient id="gbdef-marble" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0" stop-color="#FBFBF9"/><stop offset=".55" stop-color="#EFEFEA"/>',
    '<stop offset="1" stop-color="#E2E2DC"/></linearGradient>',
    '<linearGradient id="gbdef-walnut" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#7C5C3C"/><stop offset=".5" stop-color="#5F452B"/>',
    '<stop offset="1" stop-color="#48331E"/></linearGradient>',
    '<linearGradient id="gbdef-linen" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#F0EDE4"/><stop offset="1" stop-color="#DDD8CB"/></linearGradient>',
    '<pattern id="gbdef-hatch" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">',
    '<line x1="0" y1="0" x2="0" y2="9" stroke="#8A8C90" stroke-width="1.1"/></pattern>',
    '</defs></svg>',
  ].join('');

  function injectDefs() {
    if (document.getElementById('gb-defs-host')) return;
    const host = document.createElement('div');
    host.id = 'gb-defs-host';
    host.innerHTML = DEFS;
    document.body.prepend(host);
  }

  /* ── Чертёжные примитивы ──────────────────────────────────── */
  const AR = 7;

  function arrow(x, y, dir) {
    const a = AR, h = 2.6;
    const d = {
      l: `M${x} ${y} l${a} ${-h} v${h * 2} z`,
      r: `M${x} ${y} l${-a} ${-h} v${h * 2} z`,
      u: `M${x} ${y} l${-h} ${a} h${h * 2} z`,
      d: `M${x} ${y} l${-h} ${-a} h${h * 2} z`,
    }[dir];
    return `<path class="ar" d="${d}"/>`;
  }

  function dimH(x1, x2, y, label, e1, e2) {
    const ext = (x, ey) => ey == null ? '' : `<line class="ln-x" x1="${x}" y1="${ey}" x2="${x}" y2="${y}"/>`;
    return `<g class="dim">${ext(x1, e1)}${ext(x2, e2)}
      <line class="ln-d" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>
      ${arrow(x1, y, 'l')}${arrow(x2, y, 'r')}
      <text class="td" x="${(x1 + x2) / 2}" y="${y - 8}" text-anchor="middle">${label}</text></g>`;
  }

  function dimV(y1, y2, x, label, e1, e2) {
    const ext = (y, ex) => ex == null ? '' : `<line class="ln-x" x1="${ex}" y1="${y}" x2="${x}" y2="${y}"/>`;
    /* подпись — с внешней стороны: слева от линии в левой половине листа */
    const left = x < 320;
    const tx = left ? x - 10 : x + 10;
    const anchor = left ? ' text-anchor="end"' : '';
    return `<g class="dim">${ext(y1, e1)}${ext(y2, e2)}
      <line class="ln-d" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>
      ${arrow(x, y1, 'u')}${arrow(x, y2, 'd')}
      <text class="td" x="${tx}" y="${(y1 + y2) / 2 + 5}"${anchor}>${label}</text></g>`;
  }

  const axisH = (x1, x2, y) => `<line class="ln-a" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
  const axisV = (y1, y2, x) => `<line class="ln-a" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`;

  function wallL(x, y1, y2, w) {
    w = w || 26;
    return `<rect class="hatch" x="${x - w}" y="${y1}" width="${w}" height="${y2 - y1}"/>
      <line class="ln-c" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`;
  }

  function ruler(x, y, mm, k, step) {
    step = step || mm / 5;
    let cells = '';
    for (let i = 0; i < Math.round(mm / step); i++) {
      if (i % 2 === 0) cells += `<rect class="rl-a" x="${x + i * step * k}" y="${y}" width="${step * k}" height="5"/>`;
    }
    return `<g class="rl">${cells}
      <rect class="rl-f" x="${x}" y="${y}" width="${mm * k}" height="5"/>
      <text class="td td-s" x="${x}" y="${y + 20}">0</text>
      <text class="td td-s" x="${x + mm * k}" y="${y + 20}" text-anchor="end">${mm} мм</text></g>`;
  }

  /* ── Реестр изделий ───────────────────────────────────────── */
  const CHAPTERS = [
    { n: 1, rn: 'I', name: 'Крючки' },
    { n: 2, rn: 'II', name: 'Держатели' },
    { n: 3, rn: 'III', name: 'Полки' },
    { n: 4, rn: 'IV', name: 'Настольная серия' },
    { n: 5, rn: 'V', name: 'Скрытая серия' },
  ];

  const PRODUCTS = [

    /* ── ГЛАВА I · КРЮЧКИ ── */
    {
      id: 'gb-01', code: 'GB 01', chapter: 1,
      name: 'Крючок для халата',
      mat: 'литая латунь CW614N', metal: true,
      dims: 'Ø 52 × 60 мм', w: 240, price: 4900,
      mount: 'скрытое крепление, 2 × M4', load: 'до 15 кг',
      note: 'Одна отливка без сварных швов. Розетка закрывает крепёж полностью — снаружи только металл.',
      scale: 'М 1:1', view: 'вид сбоку',
      art() {
        const wx = 150, cy = 220;
        return {
          draw: `${wallL(wx, 60, 388)}
            <rect class="ln-c" x="${wx}" y="142" width="14" height="156"/>
            <path class="ln-c" d="M164 199 H272 M164 241 H272"/>
            <line class="ln-c" x1="164" y1="199" x2="164" y2="241"/>
            <circle class="ln-c" cx="297" cy="${cy}" r="33"/>`,
          dims: `${dimV(142, 298, 112, 'Ø 52', 148, 148)}
            ${dimH(wx, 330, 350, '60', 392, 258)}
            ${axisH(140, 356, cy)}`,
          real: `<rect class="met" data-g="l" x="${wx}" y="142" width="16" height="156" rx="3"/>
            <rect class="met" data-g="l" x="164" y="199" width="122" height="42" rx="8"/>
            <circle class="met" data-g="r" cx="297" cy="${cy}" r="33"/>
            <ellipse class="spec" cx="286" cy="206" rx="14" ry="7"/>`,
          ruler: ruler(112, 420, 50, 3, 10),
        };
      },
    },
    {
      id: 'gb-02', code: 'GB 02', chapter: 1,
      name: 'Крючок двойной',
      mat: 'литая латунь CW614N', metal: true,
      dims: 'Ø 52 × 74 мм', w: 310, price: 6400,
      mount: 'скрытое крепление, 2 × M4', load: 'до 15 кг',
      note: 'Два плеча на общей розетке: халат и полотенце не спорят за место. Литьё, ручная полировка.',
      scale: 'М 1:1', view: 'вид сбоку',
      art() {
        const wx = 150;
        return {
          draw: `${wallL(wx, 60, 388)}
            <rect class="ln-c" x="${wx}" y="142" width="14" height="156"/>
            <path class="ln-c" d="M164 208 H315 Q349 208 349 174 V162"/>
            <path class="ln-c" d="M164 232 H232 Q260 232 260 260 V274"/>
            <circle class="ln-c" cx="349" cy="140" r="23"/>
            <circle class="ln-c" cx="260" cy="296" r="23"/>`,
          dims: `${dimV(142, 298, 112, 'Ø 52', 148, 148)}
            ${dimH(wx, 372, 366, '74', 392, 140)}
            ${axisH(128, 396, 220)}`,
          real: `<rect class="met" data-g="l" x="${wx}" y="142" width="16" height="156" rx="3"/>
            <path class="met-s" data-g="l" stroke-width="26" d="M166 220 H315 Q349 220 349 186 V152"/>
            <path class="met-s" data-g="l" stroke-width="26" d="M166 220 H232 Q260 220 260 248 V284"/>
            <circle class="met" data-g="r" cx="349" cy="140" r="23"/>
            <circle class="met" data-g="r" cx="260" cy="296" r="23"/>`,
          ruler: ruler(112, 420, 50, 3, 10),
        };
      },
    },

    /* ── ГЛАВА II · ДЕРЖАТЕЛИ ── */
    {
      id: 'gb-03', code: 'GB 03', chapter: 2,
      name: 'Держатель для полотенец',
      mat: 'литая латунь CW614N', metal: true,
      dims: '600 × 75 × 25 мм', w: 1140, price: 16900,
      mount: 'скрытое крепление, 4 × M5', load: 'до 8 кг',
      note: 'Цельная штанга Ø 20 мм — не трубка. Вес чувствуется рукой и записан в графе «масса».',
      scale: 'М 1:2,5', view: 'вид спереди',
      art() {
        const y = 221, x1 = 104, x2 = 536;
        return {
          draw: `<circle class="ln-c" cx="${x1 + 20}" cy="${y}" r="22"/>
            <circle class="ln-c" cx="${x2 - 20}" cy="${y}" r="22"/>
            <rect class="ln-c" x="${x1 + 42}" y="${y - 7}" width="${x2 - x1 - 84}" height="14"/>`,
          dims: `${dimH(x1 - 2, x2 + 2, 316, '600', 246, 246)}
            ${dimV(y - 7, y + 7, 584, 'Ø 20', 522, 522)}
            ${axisH(84, 556, y)}`,
          real: `<path class="towel" d="M282 ${y - 6} h76 v118 q0 8 -8 8 h-60 q-8 0 -8 -8 z"/>
            <path class="towel-l" d="M300 ${y + 16} v96 M320 ${y + 16} v102 M340 ${y + 16} v92"/>
            <rect class="met" data-g="l" x="${x1 + 20}" y="${y - 7}" width="${x2 - x1 - 40}" height="14" rx="7"/>
            <circle class="met" data-g="r" cx="${x1 + 20}" cy="${y}" r="22"/>
            <circle class="met" data-g="r" cx="${x2 - 20}" cy="${y}" r="22"/>
            <ellipse class="spec" cx="200" cy="${y - 3}" rx="60" ry="2.2"/>`,
          ruler: ruler(104, 420, 200, 0.72, 50),
        };
      },
    },
    {
      id: 'gb-04', code: 'GB 04', chapter: 2,
      name: 'Кольцо для полотенец',
      mat: 'литая латунь CW614N', metal: true,
      dims: 'Ø 210 × 85 мм', w: 520, price: 7900,
      mount: 'скрытое крепление, 2 × M4', load: 'до 5 кг',
      note: 'Кольцо отливается целиком и полируется по кругу — стык не найти даже пальцем.',
      scale: 'М 1:1,7', view: 'вид спереди',
      art() {
        const cx = 320, cy = 272, ro = 126, t = 14;
        return {
          draw: `<circle class="ln-c" cx="${cx}" cy="113" r="36"/>
            <path class="ln-c" d="M${cx - 16} 147 L${cx - 11} ${cy - ro + 4} M${cx + 16} 147 L${cx + 11} ${cy - ro + 4}"/>
            <circle class="ln-c" cx="${cx}" cy="${cy}" r="${ro}"/>
            <circle class="ln-c" cx="${cx}" cy="${cy}" r="${ro - t}"/>`,
          dims: `${dimH(cx - ro, cx + ro, 434, 'Ø 210', cy + 64, cy + 64)}
            ${axisH(cx - ro - 22, cx + ro + 22, cy)}
            ${axisV(64, cy + ro + 14, cx)}`,
          real: `<circle class="met" data-g="r" cx="${cx}" cy="113" r="36"/>
            <path class="met" data-g="l" d="M${cx - 16} 147 L${cx - 11} ${cy - ro + 8} H${cx + 11} L${cx + 16} 147 Z"/>
            <path class="met" data-g="l" fill-rule="evenodd" d="M${cx} ${cy - ro} a${ro} ${ro} 0 1 0 0.1 0 z M${cx} ${cy - ro + t} a${ro - t} ${ro - t} 0 1 1 -0.1 0 z"/>
            <ellipse class="spec" cx="${cx - 56}" cy="${cy - ro + 30}" rx="24" ry="7" transform="rotate(-38 ${cx - 56} ${cy - ro + 30})"/>`,
          ruler: ruler(112, 448, 100, 1.2, 25),
        };
      },
    },
    {
      id: 'gb-05', code: 'GB 05', chapter: 2,
      name: 'Держатель туалетной бумаги',
      mat: 'литая латунь CW614N', metal: true,
      dims: '145 × 95 × 70 мм', w: 420, price: 9900,
      mount: 'скрытое крепление, 2 × M4', load: '—',
      note: 'Рычаг без пружин и колпачков: рулон меняется одним движением, держатель молчит.',
      scale: 'М 1:1,5', view: 'вид сбоку',
      art() {
        const wx = 150, cy = 210;
        return {
          draw: `${wallL(wx, 70, 380)}
            <rect class="ln-c" x="${wx}" y="150" width="12" height="120"/>
            <path class="ln-c" d="M162 ${cy - 10} H416 Q438 ${cy - 10} 438 ${cy + 8} V${cy + 24}"/>
            <path class="ln-c" d="M162 ${cy + 10} H418 V${cy + 24}"/>
            <ellipse class="ln-c" cx="428" cy="${cy + 26}" rx="12" ry="5"/>
            <circle class="ln-h" cx="300" cy="${cy}" r="118"/>
            <circle class="ln-h" cx="300" cy="${cy}" r="26"/>`,
          dims: `${dimH(wx, 440, 386, '145', 384, 241)}
            ${axisH(132, 460, cy)}`,
          real: `<circle class="roll" cx="300" cy="${cy}" r="118"/>
            <circle class="roll-c" cx="300" cy="${cy}" r="26"/>
            <rect class="met" data-g="l" x="${wx}" y="150" width="14" height="120" rx="3"/>
            <path class="met-s" data-g="l" stroke-width="18" d="M162 ${cy} H428 V${cy + 20}"/>
            <ellipse class="met" data-g="r" cx="428" cy="${cy + 26}" rx="12" ry="6"/>`,
          ruler: ruler(112, 430, 100, 2, 25),
        };
      },
    },
    {
      id: 'gb-06', code: 'GB 06', chapter: 2,
      name: 'Держатель для фена',
      mat: 'литая латунь CW614N', metal: true,
      dims: '110 × 140 × 110 мм', w: 680, price: 12900,
      mount: 'скрытое крепление, 2 × M5', load: 'до 5 кг',
      note: 'Кольцо рассчитано на корпус Ø 45–80 мм. Фен ставится вслепую, одной рукой.',
      scale: 'М 1:1,5', view: 'вид спереди',
      art() {
        const cx = 320, cy = 266, ro = 108, t = 20;
        return {
          draw: `<rect class="ln-c" x="${cx - 46}" y="90" width="92" height="34" rx="6"/>
            <path class="ln-c" d="M${cx - 20} 124 L${cx - 14} ${cy - ro + 4} M${cx + 20} 124 L${cx + 14} ${cy - ro + 4}"/>
            <circle class="ln-c" cx="${cx}" cy="${cy}" r="${ro}"/>
            <circle class="ln-c" cx="${cx}" cy="${cy}" r="${ro - t}"/>`,
          dims: `${dimH(cx - ro + t, cx + ro - t, 418, 'Ø 88', cy + 34, cy + 34)}
            ${axisH(cx - ro - 24, cx + ro + 24, cy)}
            ${axisV(70, cy + ro + 16, cx)}`,
          real: `<rect class="met" data-g="l" x="${cx - 46}" y="90" width="92" height="34" rx="8"/>
            <path class="met" data-g="l" d="M${cx - 20} 124 L${cx - 14} ${cy - ro + 8} H${cx + 14} L${cx + 20} 124 Z"/>
            <path class="met" data-g="l" fill-rule="evenodd" d="M${cx} ${cy - ro} a${ro} ${ro} 0 1 0 0.1 0 z M${cx} ${cy - ro + t} a${ro - t} ${ro - t} 0 1 1 -0.1 0 z"/>
            <ellipse class="spec" cx="${cx - 48}" cy="${cy - ro + 32}" rx="22" ry="7" transform="rotate(-36 ${cx - 48} ${cy - ro + 32})"/>`,
          ruler: ruler(112, 448, 100, 2, 25),
        };
      },
    },

    /* ── ГЛАВА III · ПОЛКИ ── */
    {
      id: 'gb-07', code: 'GB 07', chapter: 3,
      name: 'Полка',
      mat: 'латунь CW614N · мрамор Каррара', metal: true,
      dims: '600 × 120 × 70 мм', w: 4200, price: 24900,
      mount: 'скрытое крепление, 4 × M6', load: 'до 12 кг',
      note: 'Плита каррарского мрамора 20 мм на двух литых кронштейнах. Рисунок прожилок — единственный в партии.',
      scale: 'М 1:2,5', view: 'вид спереди',
      art() {
        const x1 = 104, x2 = 536, ty = 190, t = 15;
        return {
          draw: `<rect class="ln-c" x="${x1}" y="${ty}" width="${x2 - x1}" height="${t}"/>
            <rect class="ln-c" x="160" y="${ty + t}" width="7" height="38"/>
            <rect class="ln-c" x="473" y="${ty + t}" width="7" height="38"/>`,
          dims: `${dimH(x1, x2, 300, '600', ty + 64, ty + 64)}
            ${dimV(ty, ty + t, 578, '20', 540, 540)}`,
          real: `<rect class="marble" x="${x1}" y="${ty}" width="${x2 - x1}" height="${t}" rx="2"/>
            <path class="vein" d="M150 ${ty + 4} q60 8 120 3 t150 5 M370 ${ty + 11} q50 -6 110 -2"/>
            <rect class="met" data-g="l" x="160" y="${ty + t}" width="7" height="38"/>
            <rect class="met" data-g="l" x="473" y="${ty + t}" width="7" height="38"/>`,
          ruler: ruler(104, 420, 200, 0.72, 50),
        };
      },
    },
    {
      id: 'gb-08', code: 'GB 08', chapter: 3,
      name: 'Полка малая',
      mat: 'латунь CW614N · мрамор Каррара', metal: true,
      dims: '300 × 120 × 70 мм', w: 2300, price: 17900,
      mount: 'скрытое крепление, 2 × M6', load: 'до 8 кг',
      note: 'Формат для зеркала и умывальника: парфюм, часы, кольца. Камень тот же, что у большой полки.',
      scale: 'М 1:1,7', view: 'вид спереди',
      art() {
        const x1 = 140, x2 = 500, ty = 190, t = 24;
        return {
          draw: `<rect class="ln-c" x="${x1}" y="${ty}" width="${x2 - x1}" height="${t}"/>
            <rect class="ln-c" x="196" y="${ty + t}" width="9" height="46"/>
            <rect class="ln-c" x="435" y="${ty + t}" width="9" height="46"/>`,
          dims: `${dimH(x1, x2, 310, '300', ty + 78, ty + 78)}
            ${dimV(ty, ty + t, 542, '20', 504, 504)}`,
          real: `<rect class="marble" x="${x1}" y="${ty}" width="${x2 - x1}" height="${t}" rx="2"/>
            <path class="vein" d="M180 ${ty + 6} q70 10 130 4 t120 6 M300 ${ty + 17} q60 -8 120 -3"/>
            <rect class="met" data-g="l" x="196" y="${ty + t}" width="9" height="46"/>
            <rect class="met" data-g="l" x="435" y="${ty + t}" width="9" height="46"/>`,
          ruler: ruler(140, 420, 100, 1.2, 25),
        };
      },
    },

    /* ── ГЛАВА IV · НАСТОЛЬНАЯ СЕРИЯ ── */
    {
      id: 'gb-09', code: 'GB 09', chapter: 4,
      name: 'Салфетница',
      mat: 'литая латунь CW614N', metal: true,
      dims: '190 × 95 × 165 мм', w: 740, price: 6900,
      mount: 'настольный', load: '—',
      note: 'Арка из цельного прутка держит стопку весом, а не зажимом: салфетки выходят по одной.',
      scale: 'М 1:1,5', view: 'вид спереди',
      art() {
        return {
          draw: `<line class="ln-f" x1="120" y1="346" x2="520" y2="346"/>
            <rect class="ln-c" x="168" y="332" width="304" height="14" rx="4"/>
            <path class="ln-c" d="M208 332 V196 Q208 84 320 84 Q432 84 432 196 V332"/>
            <path class="ln-c" d="M224 332 V196 Q224 100 320 100 Q416 100 416 196 V332"/>`,
          dims: `${dimH(168, 472, 402, '190', 350, 350)}
            ${dimV(84, 346, 118, '165', 292, 168)}
            ${axisV(64, 358, 320)}`,
          real: `<g class="paper-n"><path d="M246 324 L252 156 Q320 134 394 156 L400 324 Z"/>
            <path class="paper-l" d="M270 318 L274 172 M322 314 L322 156 M372 318 L368 172"/></g>
            <rect class="met" data-g="l" x="168" y="332" width="304" height="14" rx="6"/>
            <path class="met-t" data-g="l" stroke-width="15" d="M216 332 V196 Q216 92 320 92 Q424 92 424 196 V332"/>
            <ellipse class="shadow" cx="320" cy="352" rx="170" ry="7"/>`,
          ruler: ruler(120, 432, 100, 1.6, 25),
        };
      },
    },
    {
      id: 'gb-10', code: 'GB 10', chapter: 4,
      name: 'Держатель бумажных полотенец',
      mat: 'латунь CW614N · орех американский', metal: true,
      dims: 'Ø 180 × 310 мм', w: 1260, price: 8900,
      mount: 'настольный', load: '—',
      note: 'Основание из массива ореха с выточенным углублением: рулон снимается без наклона стойки.',
      scale: 'М 1:2', view: 'вид спереди',
      art() {
        const cx = 320;
        return {
          draw: `<line class="ln-f" x1="150" y1="400" x2="490" y2="400"/>
            <rect class="ln-c" x="${cx - 90}" y="386" width="180" height="14" rx="5"/>
            <rect class="ln-c" x="${cx - 11}" y="119" width="22" height="267"/>
            <circle class="ln-c" cx="${cx}" cy="104" r="15"/>
            <rect class="ln-h" x="${cx - 60}" y="150" width="120" height="216"/>`,
          dims: `${dimH(cx - 90, cx + 90, 434, 'Ø 180', 404, 404)}
            ${dimV(89, 400, 172, '310', 252, 252)}
            ${axisV(80, 412, cx)}`,
          real: `<g class="rollv"><rect class="roll" x="${cx - 60}" y="150" width="120" height="216" rx="8"/>
            <ellipse class="roll-top" cx="${cx}" cy="152" rx="60" ry="13"/>
            <ellipse class="roll-c" cx="${cx}" cy="152" rx="13" ry="5"/></g>
            <rect class="walnut" x="${cx - 90}" y="386" width="180" height="14" rx="6"/>
            <path class="grain" d="M${cx - 74} 391 h148 M${cx - 58} 396 h116"/>
            <rect class="met" data-g="l" x="${cx - 11}" y="119" width="22" height="267" rx="4"/>
            <circle class="met" data-g="r" cx="${cx}" cy="104" r="15"/>
            <ellipse class="shadow" cx="${cx}" cy="404" rx="110" ry="6"/>`,
          ruler: ruler(150, 434, 100, 1, 25),
        };
      },
    },
    {
      id: 'gb-11', code: 'GB 11', chapter: 4,
      name: 'Мыльница',
      mat: 'латунь CW614N · мрамор Каррара', metal: true,
      dims: '130 × 90 × 30 мм', w: 480, price: 7400,
      mount: 'настольный', load: '—',
      note: 'Плита с выборкой под мыло и незаметным сливом. Камень не боится воды — только времени.',
      scale: 'М 1:0,8', view: 'вид спереди',
      art() {
        const x1 = 158, x2 = 483, ty = 246, t = 62;
        return {
          draw: `<line class="ln-f" x1="120" y1="${ty + t + 18}" x2="520" y2="${ty + t + 18}"/>
            <path class="ln-c" d="M${x1} ${ty + 10} Q${x1} ${ty} ${x1 + 10} ${ty} H${x2 - 10} Q${x2} ${ty} ${x2} ${ty + 10} V${ty + t} H${x1} Z"/>
            <path class="ln-h" d="M${x1 + 34} ${ty + 12} Q320 ${ty + 36} ${x2 - 34} ${ty + 12}"/>
            <rect class="ln-c" x="${x1 + 30}" y="${ty + t}" width="18" height="18"/>
            <rect class="ln-c" x="${x2 - 48}" y="${ty + t}" width="18" height="18"/>`,
          dims: `${dimH(x1, x2, 386, '130', ty + 86, ty + 86)}
            ${dimV(ty, ty + t + 18, 545, '30', 487, 462)}`,
          real: `<path class="marble" d="M${x1} ${ty + 10} Q${x1} ${ty} ${x1 + 10} ${ty} H${x2 - 10} Q${x2} ${ty} ${x2} ${ty + 10} V${ty + t} H${x1} Z"/>
            <path class="vein" d="M200 ${ty + 24} q80 14 150 6 t110 10 M260 ${ty + 48} q90 -10 160 -2"/>
            <path class="marble-d" d="M${x1 + 34} ${ty + 12} Q320 ${ty + 38} ${x2 - 34} ${ty + 12} Q320 ${ty + 22} ${x1 + 34} ${ty + 12} Z"/>
            <rect class="met" data-g="l" x="${x1 + 30}" y="${ty + t}" width="18" height="18"/>
            <rect class="met" data-g="l" x="${x2 - 48}" y="${ty + t}" width="18" height="18"/>
            <ellipse class="shadow" cx="320" cy="${ty + t + 22}" rx="150" ry="6"/>`,
          ruler: ruler(120, 428, 100, 2.5, 25),
        };
      },
    },
    {
      id: 'gb-12', code: 'GB 12', chapter: 4,
      name: 'Стакан',
      mat: 'латунь CW614N · мрамор Каррара', metal: true,
      dims: 'Ø 75 × 105 мм', w: 390, price: 6900,
      mount: 'настольный', load: '—',
      note: 'Выточен из цельного блока, латунное кольцо по верхнему торцу. Пара к мыльнице GB 11.',
      scale: 'М 1:0,8', view: 'вид спереди',
      art() {
        return {
          draw: `<line class="ln-f" x1="150" y1="405" x2="490" y2="405"/>
            <path class="ln-c" d="M223 118 H417 V381 Q417 391 407 391 H233 Q223 391 223 381 Z"/>
            <line class="ln-c" x1="223" y1="146" x2="417" y2="146"/>
            <path class="ln-h" d="M241 146 V375 M399 146 V375"/>`,
          dims: `${dimH(223, 417, 438, 'Ø 75', 409, 409)}
            ${dimV(118, 391, 466, '105', 421, 421)}
            ${axisV(94, 414, 320)}`,
          real: `<path class="marble" d="M223 118 H417 V381 Q417 391 407 391 H233 Q223 391 223 381 Z"/>
            <path class="vein" d="M244 210 q60 16 110 8 t60 12 M258 300 q70 -12 130 -4"/>
            <rect class="met" data-g="l" x="223" y="118" width="194" height="28"/>
            <ellipse class="shadow" cx="320" cy="408" rx="105" ry="6"/>`,
          ruler: ruler(150, 438, 100, 2.6, 25),
        };
      },
    },

    /* ── ГЛАВА V · СКРЫТАЯ СЕРИЯ ── */
    {
      id: 'gb-13', code: 'GB 13', chapter: 5,
      name: 'Крючок скрытого монтажа',
      mat: 'литая латунь CW614N', metal: true,
      dims: 'Ø 40 × 45 мм', w: 210, price: 5900,
      mount: 'врезной, гильза Ø 28 × 38 мм', load: 'до 10 кг',
      note: 'Гильза уходит в стену, снаружи — цилиндр без единого винта. Для стен от 50 мм.',
      scale: 'М 1:1', view: 'вид сбоку · разрез',
      art() {
        return {
          draw: `${wallL(168, 70, 380, 128)}
            <rect class="ln-h" x="54" y="178" width="114" height="84"/>
            <path class="ln-c" d="M168 160 H289 Q303 160 303 174 V266 Q303 280 289 280 H168"/>`,
          dims: `${dimH(168, 303, 340, '45', 386, 286)}
            ${dimH(54, 168, 110, '38', 178, null)}
            ${dimV(160, 280, 342, 'Ø 40', 306, 306)}
            ${axisH(30, 330, 220)}`,
          real: `<rect class="plaster" x="40" y="70" width="128" height="310"/>
            <line class="wallface" x1="168" y1="70" x2="168" y2="380"/>
            <path class="met" data-g="l" d="M168 160 H289 Q303 160 303 174 V266 Q303 280 289 280 H168 Z"/>
            <ellipse class="spec" cx="240" cy="170" rx="42" ry="4"/>`,
          ruler: ruler(112, 420, 50, 3, 10),
        };
      },
    },
    {
      id: 'gb-14', code: 'GB 14', chapter: 5,
      name: 'Крючок откидной',
      mat: 'литая латунь CW614N', metal: true,
      dims: '60 × 60 × 8 мм · вылет 62 мм', w: 340, price: 8400,
      mount: 'скрытое крепление, 2 × M4', load: 'до 8 кг',
      note: 'Сложенный — пластина 8 мм заподлицо с плоскостью стены. Откинутый — полноценный крючок.',
      scale: 'М 1:1', view: 'вид сбоку · два положения',
      art() {
        return {
          draw: `${wallL(150, 60, 388)}
            <rect class="ln-c" x="150" y="130" width="24" height="180" rx="3"/>
            <path class="ln-c" d="M174 204 H320 Q336 204 336 220 Q336 236 320 236 H174"/>
            <path class="ln-h" d="M170 220 V74 Q170 58 186 58 Q202 58 202 74 V220"/>
            <path class="ln-h" d="M186 74 A146 146 0 0 1 332 220"/>
            ${arrow(332, 220, 'd')}
            <circle class="ln-c" cx="186" cy="220" r="10"/>`,
          dims: `${dimH(150, 336, 366, '62', 392, 240)}
            ${dimV(130, 310, 118, '60', 154, 154)}
            ${dimH(150, 174, 100, '8', 130, 130)}`,
          real: `<rect class="met" data-g="l" x="150" y="130" width="24" height="180" rx="3"/>
            <path class="met" data-g="l" d="M174 204 H320 Q336 204 336 220 Q336 236 320 236 H174 Z"/>
            <circle class="met" data-g="r" cx="186" cy="220" r="11"/>
            <ellipse class="spec" cx="250" cy="211" rx="40" ry="3.5"/>`,
          ruler: ruler(112, 420, 50, 3, 10),
        };
      },
    },
    {
      id: 'gb-15', code: 'GB 15', chapter: 5,
      name: 'Держатель полотенец скрытого монтажа',
      mat: 'литая латунь CW614N', metal: true,
      dims: '450 × 18 × 90 мм', w: 980, price: 19900,
      mount: 'врезной, закладные в стене', load: 'до 8 кг',
      note: 'Штанга выходит прямо из стены: ни розеток, ни стоек. Закладные ставятся до чистовой отделки.',
      scale: 'М 1:2,2', view: 'вид спереди',
      art() {
        return {
          draw: `<rect class="ln-c" x="109" y="204" width="8" height="32"/>
            <rect class="ln-c" x="522" y="204" width="8" height="32"/>
            <rect class="ln-c" x="117" y="212" width="405" height="16"/>
            <rect class="ln-h" x="85" y="208" width="24" height="24"/>
            <rect class="ln-h" x="530" y="208" width="24" height="24"/>`,
          dims: `${dimH(117, 522, 312, '450', 240, 240)}
            ${dimV(212, 228, 576, 'Ø 18', 534, 534)}
            ${axisH(70, 570, 220)}`,
          real: `<rect class="slotf" x="109" y="204" width="8" height="32"/>
            <rect class="slotf" x="522" y="204" width="8" height="32"/>
            <rect class="met" data-g="l" x="117" y="212" width="405" height="16" rx="8"/>
            <ellipse class="spec" cx="260" cy="217" rx="70" ry="2"/>`,
          ruler: ruler(117, 420, 200, 0.9, 50),
        };
      },
    },
  ];

  /* ── Сборщик SVG ──────────────────────────────────────────── */
  function svg(p, opts) {
    opts = opts || {};
    const a = p.art();
    const vb = opts.vb || (opts.thumb ? '60 40 520 390' : '0 0 640 460');
    const extras = opts.thumb
      ? ''
      : `<g class="pv-dims" aria-hidden="true">${a.dims}</g><g class="pv-extra" aria-hidden="true">${a.ruler || ''}</g>`;
    return `<svg class="pv-svg" viewBox="${vb}" role="img" aria-label="${p.name} — чертёж и предметный вид">
      <g class="pv-real" aria-hidden="true">${a.real}</g>
      <g class="pv-draw" aria-hidden="true">${a.draw}</g>
      ${extras}</svg>`;
  }

  function fmtPrice(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  function fmtMass(g) {
    return g >= 1000
      ? (g / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' кг'
      : g + ' г';
  }

  /* Отделка металла: brass | nickel | black */
  function applyFinish(scope, finish) {
    scope.querySelectorAll('[data-g]').forEach((el) => {
      const url = `url(#gbdef-${finish}-${el.dataset.g})`;
      if (el.classList.contains('met')) el.setAttribute('fill', url);
      else el.setAttribute('stroke', url);
    });
  }

  const byId = {};
  PRODUCTS.forEach((p) => { byId[p.id] = p; });

  window.GB = { PRODUCTS, CHAPTERS, byId, svg, fmtPrice, fmtMass, applyFinish, injectDefs };
})();
