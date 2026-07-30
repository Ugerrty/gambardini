/* Кадр заставки в середине анимации + проверка таймлайна */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const edge = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const port = 9700 + Math.floor(Math.random() * 200);
const proc = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + tmpdir() + '/gb-pl-' + Date.now(),
  '--no-first-run', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 60; i++) {
  try {
    const d = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
    if (d.webSocketDebuggerUrl) { ws = d.webSocketDebuggerUrl; break; }
  } catch { /* — */ }
  await sleep(250);
}
const W = new WebSocket(ws);
await new Promise((r) => { W.onopen = r; });
let id = 0;
const pend = new Map();
W.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
};
const send = (method, params, sid) => new Promise((r) => {
  const i = ++id; pend.set(i, r);
  W.send(JSON.stringify({ id: i, method, params: params || {}, sessionId: sid }));
});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false }, sessionId);
await send('Page.enable', {}, sessionId);
await send('Page.navigate', { url: 'http://localhost:4174/index.html' }, sessionId);
await sleep(950);
const s1 = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
writeFileSync('_snaps/pl-mid.png', Buffer.from(s1.data, 'base64'));
const info = await send('Runtime.evaluate', {
  expression: "JSON.stringify({hold:document.documentElement.classList.contains('hold'),letters:document.querySelectorAll('.pl-mark i').length})",
  returnByValue: true,
}, sessionId);
console.log('mid:', info.result.value);
await sleep(1500);
const info2 = await send('Runtime.evaluate', {
  expression: "JSON.stringify({ready:document.documentElement.classList.contains('ready'),plGone:!document.querySelector('.preloader')})",
  returnByValue: true,
}, sessionId);
console.log('end:', info2.result.value);
proc.kill();
process.exit(0);
