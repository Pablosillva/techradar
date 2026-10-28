import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PANELS, STACK, TITLE, SUBTITLE, FOOTER, BG_CODE } from './data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

/* ---------------------------------------------------------------- ícones */
const iconCache = new Map();
function rawSvg(name) {
  if (!iconCache.has(name)) iconCache.set(name, read(path.join('icons', name + '.svg')));
  return iconCache.get(name);
}

/** devolve { vb, inner } de um svg do simple-icons */
function parseIcon(name) {
  const s = rawSvg(name);
  const vb = /viewBox="([^"]+)"/.exec(s)[1];
  const inner = s
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .trim();
  return { vb, inner };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** svg de ícone com a cor pedida */
function icon(name, size, color, cls = '') {
  const { vb, inner } = parseIcon(name);
  const body = inner.replace(/\sfill="[^"]*"/g, '');
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="${vb}" fill="${color}" aria-hidden="true">${body}</svg>`;
}

/** Chrome: o path do simple-icons é o logo real dividido em 4 subpaths */
function chromeIcon(size) {
  const { vb } = parseIcon('googlechrome');
  const inner = rawSvg('googlechrome')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '');
  const d = /\sd="([^"]*)"/.exec(inner)[1];
  const parts = d.split(/(?=[Mm])/).filter(Boolean);
  const cols = ['#EA4335', '#34A853', '#FBBC05', '#4285F4'];
  return (
    `<svg class="ic" width="${size}" height="${size}" viewBox="${vb}" aria-hidden="true">` +
    parts.map((p, i) => `<path fill="${cols[i] || '#4285F4'}" d="${p.trim()}"/>`).join('') +
    `</svg>`
  );
}

/** Edge: silhueta preenchida com o gradiente oficial */
function edgeIcon(size, gid) {
  const { vb, inner } = parseIcon('microsoftedge');
  return `<svg class="ic" width="${size}" height="${size}" viewBox="${vb}" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#0C3C7C"/><stop offset=".45" stop-color="#0F7CBD"/>
      <stop offset=".8" stop-color="#2BC0E4"/><stop offset="1" stop-color="#3FE0C0"/>
    </linearGradient></defs>
    <path fill="url(#${gid})" d="${/\sd="([^"]*)"/.exec(inner)[1]}"/></svg>`;
}

function brandIcon(name, size, gid) {
  if (name === 'googlechrome') return chromeIcon(size);
  if (name === 'microsoftedge') return edgeIcon(size, gid);
  const map = {
    windows: '#3AA9E8',
    visualstudiocode: '#29A8F5',
    git: '#F05033',
    github: '#DCE6F2',
    react: '#61DAFB',
    typescript: '#3A8FD4',
    nodedotjs: '#6FBF4B',
    postgresql: '#4A82C4',
  };
  return icon(name, size, map[name] || '#00D9FF');
}

/* ---------------------------------------------------------------- helpers */
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(20260711);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

/* ------------------------------------------------- realce de sintaxe git */
const GIT_SUBS = new Set(['init', 'clone', 'status', 'add', 'commit', 'log', 'diff', 'branch',
  'switch', 'merge', 'pull', 'push', 'fetch', 'stash', 'pop', 'restore', 'remote', 'ls', 'show']);
function gitHtml(code) {
  const tokens = code.split(/(\s+)/);
  let html = '';
  for (const t of tokens) {
    if (/^\s+$/.test(t)) { html += ' '; continue; }
    if (t === 'git') html += `<i class="tk-bin">git</i>`;
    else if (t.startsWith('-')) html += `<i class="tk-flag">${esc(t)}</i>`;
    else if (GIT_SUBS.has(t)) html += `<i class="tk-sub">${esc(t)}</i>`;
    else html += `<i class="tk-arg">${esc(t)}</i>`;
  }
  return `<span class="gitcode">${html}</span>`;
}

/* ------------------------------------------------------------- keycaps */
function keysHtml(keys, seps) {
  const out = [];
  keys.forEach((k, i) => {
    if (i > 0) out.push(`<span class="sep">${esc(seps && seps[i - 1] ? seps[i - 1] : ' + ')}</span>`);
    const sym = /^[←↑↓→/+\-` ]+$/.test(k) && !/^[a-zA-Z]/.test(k);
    out.push(`<span class="cap${sym ? ' cap-sym' : ''}">${esc(k)}</span>`);
  });
  return out.join('');
}

function rowHtml(item, n) {
  const cmd = item.code ? gitHtml(item.code) : keysHtml(item.keys, item.seps);
  return `<div class="row"><div class="cmd">${cmd}</div>` +
    `<div class="desc"><span class="tick">›</span>${esc(item.desc)}</div>` +
    `<span class="rowid">${String(n).padStart(2, '0')}</span></div>`;
}

/* -------------------------------------------------------------- painéis */
function panelHtml(p, gi) {
  const iconSvg = brandIcon(p.icon, 62, 'ed' + gi);
  const extra = (p.extraIcons || [])
    .map((n) => `<span class="ghostic">${brandIcon(n, 34, 'gx' + gi + n)}</span>`)
    .join('');
  const half = Math.ceil(p.items.length / 2);
  const colA = p.items.slice(0, half).map((it, i) => rowHtml(it, i + 1)).join('');
  const colB = p.items.slice(half).map((it, i) => rowHtml(it, half + i + 1)).join('');
  const n = p.items.length;
  const count = n === 1 ? '1 ITEM' : `${n} ITENS`;

  const flow = p.flow
    ? `<div class="flow">` +
      p.flow.map((s, i) =>
        (i ? `<span class="farrow"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : '') +
        `<span class="fchip${i === p.flow.length - 1 ? ' fchip-end' : ''}">${i === p.flow.length - 1
          ? `<span class="fgi">${brandIcon('github', 15, 'fg' + gi)}</span>` : ''}${esc(s)}</span>`
      ).join('') +
      `</div>`
    : '';

  return `<section class="panel${p.flow ? ' has-flow' : ''}" style="--acc:${p.accent}">
    <span class="brk brk-tl"></span><span class="brk brk-tr"></span>
    <span class="brk brk-bl"></span><span class="brk brk-br"></span>
    <header class="phead">
      <span class="picon">${iconSvg}</span>
      <span class="ptx">
        <h2 class="ptitle">${esc(p.title)}</h2>
        <p class="pkick"><span class="kdot"></span>${esc(p.kicker)}<span class="ksep">/</span>${count}</p>
      </span>
      ${extra ? `<span class="pghost">${extra}</span>` : ''}
      <span class="pnum">${p.id}</span>
    </header>
    <div class="pdiv"><span></span></div>
    <div class="cols"><div class="col">${colA}</div><div class="col">${colB}</div></div>
    ${flow}
  </section>`;
}

/* -------------------------------------------------- textura de fundo */
function bgCode() {
  let out = '';
  for (let gy = 0; gy < 17; gy++) {
    for (let gx = 0; gx < 7; gx++) {
      if (rnd() < 0.24) continue;
      const x = 70 + gx * 552 + Math.round(rnd() * 120);
      const y = 74 + gy * 124 + Math.round(rnd() * 26);
      const op = (0.034 + rnd() * 0.038).toFixed(3);
      const fs = (13 + rnd() * 6).toFixed(1);
      out += `<span class="bgcode" style="left:${x}px;top:${y}px;opacity:${op};font-size:${fs}px">${esc(pick(BG_CODE))}</span>`;
    }
  }
  return out;
}

function circuits() {
  let s = '';
  const seed = mulberry32(77);
  const corner = (ox, oy, sx, sy) => {
    let d = `M ${ox} ${oy}`;
    let x = ox, y = oy;
    for (let i = 0; i < 5; i++) {
      const len = 90 + seed() * 260;
      x += len * sx; d += ` L ${Math.round(x)} ${Math.round(y)}`;
      const dy = (60 + seed() * 200) * sy;
      const dx = (70 + seed() * 230) * sx;
      d += ` L ${Math.round(x + dx)} ${Math.round(y + dy)}`;
      x += dx; y += dy;
      s += `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="4"/>`;
      s += `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="11" fill="none"/>`;
    }
    return `<path d="${d}"/>`;
  };
  s += corner(0, 0, 1, 1);
  s += corner(3840, 120, -1, 1);
  s += corner(0, 2160, 1, -1);
  s += corner(3840, 2040, -1, -1);
  return s;
}

function leftRail() {
  let dots = '';
  for (let i = 0; i < 26; i++) {
    const y = 118 + i * 76;
    const on = i % 3 !== 2;
    dots += `<rect x="443" y="${y}" width="${on ? 7 : 4}" height="${on ? 7 : 4}" rx="1.5"/>`;
  }
  let chips = '';
  for (let i = 0; i < 9; i++) {
    const y = 118 + i * 76;
    const w = 18 + Math.round(rnd() * 44);
    chips += `<rect x="${30 + Math.round(rnd() * 20)}" y="${y - 5}" width="${w}" height="6" rx="3"/>`;
  }
  return `<div class="rail-dots">${dots}</div><div class="rail-chips">${chips}</div>
    <div class="rail-term">
      <div class="rt-bar"><i></i><i></i><i></i></div>
      <div class="rt-lines">
        <span style="width:78%"></span><span style="width:92%"></span><span style="width:56%"></span>
        <span style="width:84%"></span><span style="width:41%"></span><span style="width:66%"></span>
      </div>
    </div>`;
}

function stackStrip() {
  return STACK.map((s, i) =>
    `<span class="stackitem">${brandIcon(s.icon, 34, 'st' + i)}<span class="stacklabel">${esc(s.label)}</span></span>`
  ).join('<span class="stackdiv"></span>');
}

/* ------------------------------------------------------------------ CSS */
const W = 3840, H = 2160;
const L = 500, R = 3720;
const PT = 302, PH = 816, GAPY = 52, GAPX = 60;
const PW = (R - L - GAPX) / 2;

const css = `
@font-face{font-family:'JetBrains Mono';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, 'fonts', 'jetbrains-mono-latin.woff2')).toString('base64')}) format('woff2');font-weight:100 800;font-style:normal;font-display:block;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#080D18;}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:'JetBrains Mono',ui-monospace,Consolas,monospace;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}
.ic{display:block;}
.stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#080D18;}

/* ---------------- fundo ---------------- */
.bg{position:absolute;inset:0;}
.glow-a{position:absolute;left:-6%;top:-22%;width:62%;height:78%;
  background:radial-gradient(closest-side,rgba(0,150,220,.16),rgba(0,150,220,0) 72%);}
.glow-b{position:absolute;right:-8%;bottom:-24%;width:66%;height:80%;
  background:radial-gradient(closest-side,rgba(96,74,220,.15),rgba(96,74,220,0) 72%);}
.glow-c{position:absolute;left:22%;top:-16%;width:56%;height:46%;
  background:radial-gradient(closest-side,rgba(0,217,255,.11),rgba(0,217,255,0) 70%);}
.glow-d{position:absolute;left:26%;bottom:-14%;width:48%;height:42%;
  background:radial-gradient(closest-side,rgba(34,197,94,.075),rgba(34,197,94,0) 70%);}
.grid-fine{position:absolute;inset:0;
  background-image:linear-gradient(rgba(148,190,230,.030) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(148,190,230,.030) 1px,transparent 1px);
  background-size:48px 48px;}
.grid-bold{position:absolute;inset:0;
  background-image:linear-gradient(rgba(148,190,230,.055) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(148,190,230,.055) 1px,transparent 1px);
  background-size:240px 240px;}
.hline{position:absolute;left:0;right:0;top:50%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(0,217,255,.10) 22%,rgba(0,217,255,.10) 78%,transparent);}
.vline{position:absolute;top:0;bottom:0;left:50%;width:1px;
  background:linear-gradient(180deg,transparent,rgba(0,217,255,.09) 26%,rgba(0,217,255,.09) 74%,transparent);}
.bgcode{position:absolute;white-space:nowrap;color:#9FC4E8;font-weight:400;letter-spacing:.2px;}
.circuits{position:absolute;inset:0;fill:none;stroke:#00D9FF;stroke-width:1.4;opacity:.085;
  stroke-linejoin:round;stroke-linecap:round;}
.vignette{position:absolute;inset:0;
  background:radial-gradient(120% 92% at 50% 44%,rgba(0,0,0,0) 38%,rgba(2,5,12,.55) 100%);}
.edge-top,.edge-bot{position:absolute;left:0;right:0;height:2px;}
.edge-top{top:0;background:linear-gradient(90deg,transparent,rgba(0,217,255,.34) 28%,rgba(0,217,255,.34) 72%,transparent);}
.edge-bot{bottom:0;background:linear-gradient(90deg,transparent,rgba(0,217,255,.20) 28%,rgba(0,217,255,.20) 72%,transparent);}
.corner{position:absolute;width:56px;height:56px;border-color:rgba(0,217,255,.30);}
.c-tl{left:30px;top:30px;border-left:2px solid;border-top:2px solid;}
.c-tr{right:30px;top:30px;border-right:2px solid;border-top:2px solid;}
.c-bl{left:30px;bottom:30px;border-left:2px solid;border-bottom:2px solid;}
.c-br{right:30px;bottom:30px;border-right:2px solid;border-bottom:2px solid;}

/* ---------------- trilho lateral silencioso ---------------- */
.rail-dots,.rail-chips{position:absolute;top:0;left:0;width:460px;height:${H}px;}
.rail-dots rect{fill:rgba(148,190,230,.16);}
.rail-chips rect{fill:rgba(0,217,255,.20);}
.rail-term{position:absolute;left:62px;top:1188px;width:334px;height:352px;border-radius:12px;
  border:1px solid rgba(148,190,230,.10);background:rgba(17,24,39,.22);}
.rt-bar{height:34px;border-bottom:1px solid rgba(148,190,230,.09);display:flex;align-items:center;gap:7px;padding-left:14px;}
.rt-bar i{width:8px;height:8px;border-radius:50%;background:rgba(148,190,230,.16);}
.rt-lines{padding:20px 20px;display:flex;flex-direction:column;gap:15px;}
.rt-lines span{display:block;height:7px;border-radius:4px;background:rgba(148,190,230,.10);}
.rail-sep{position:absolute;left:468px;top:120px;bottom:120px;width:1px;
  background:linear-gradient(180deg,transparent,rgba(0,217,255,.16) 18%,rgba(0,217,255,.16) 82%,transparent);}

/* ---------------- cabeçalho ---------------- */
.hud-header{position:absolute;left:${L}px;top:92px;width:${R - L}px;height:196px;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;}
.hterm{justify-self:start;display:flex;flex-direction:column;gap:12px;}
.hterm .l1{font-size:19px;color:#8FA6C2;letter-spacing:.4px;}
.hterm .l1 .p{color:#00D9FF;} .hterm .l1 .c{color:#E2E8F0;}
.hterm .l1 .cur{display:inline-block;width:11px;height:19px;background:#00D9FF;vertical-align:-3px;margin-left:6px;opacity:.8;}
.hterm .l2{display:flex;gap:9px;}
.hterm .chip{font-size:13px;letter-spacing:1.6px;color:#6E86A3;border:1px solid rgba(110,134,163,.28);
  border-radius:5px;padding:5px 10px;}
.hcenter{justify-self:center;text-align:center;}
.hmain{font-size:60px;font-weight:800;letter-spacing:12px;color:#F1F6FC;
  text-shadow:0 0 42px rgba(0,217,255,.30),0 4px 30px rgba(0,0,0,.6);white-space:nowrap;}
.hsub{margin-top:16px;font-size:19px;font-weight:500;letter-spacing:7px;color:#5FD3F0;}
.hsub i{color:#2C4A66;font-style:normal;}
.hstack{justify-self:end;display:flex;align-items:center;gap:18px;}
.stackitem{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:11px;
  background:rgba(255,255,255,.028);border:1px solid rgba(148,190,230,.11);}
.stacklabel{font-size:15px;font-weight:600;letter-spacing:1.8px;color:#9DB3D0;}
.stackdiv{width:1px;height:24px;background:rgba(148,190,230,.16);}

/* ---------------- grade de painéis ---------------- */
.grid{position:absolute;left:${L}px;top:${PT}px;width:${R - L}px;height:${PH * 2 + GAPY}px;
  display:grid;grid-template-columns:${PW}px ${PW}px;grid-template-rows:${PH}px ${PH}px;gap:${GAPY}px ${GAPX}px;}
.panel{position:relative;padding:46px 50px 44px;border-radius:20px;overflow:hidden;
  background:linear-gradient(158deg,rgba(23,33,54,.93) 0%,rgba(14,21,37,.90) 52%,rgba(10,16,29,.93) 100%);
  border:1px solid #1E293B;
  box-shadow:0 30px 80px rgba(0,0,0,.52), inset 0 1px 0 rgba(150,185,225,.07),
             inset 0 0 90px rgba(0,80,130,.05);}
.panel::before{content:'';position:absolute;left:0;right:0;top:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--acc) 18%,var(--acc) 40%,transparent 78%);opacity:.55;}
.panel::after{content:'';position:absolute;left:-10%;top:-40%;width:120%;height:100%;
  background:radial-gradient(60% 70% at 12% 0%,color-mix(in srgb,var(--acc) 16%,transparent),transparent 70%);
  opacity:.5;pointer-events:none;}
.brk{position:absolute;width:22px;height:22px;opacity:.75;}
.brk-tl{left:14px;top:14px;border-left:2px solid var(--acc);border-top:2px solid var(--acc);}
.brk-tr{right:14px;top:14px;border-right:2px solid var(--acc);border-top:2px solid var(--acc);}
.brk-bl{left:14px;bottom:14px;border-left:2px solid var(--acc);border-bottom:2px solid var(--acc);}
.brk-br{right:14px;bottom:14px;border-right:2px solid var(--acc);border-bottom:2px solid var(--acc);}

.phead{position:relative;display:flex;align-items:center;gap:22px;height:62px;}
.picon{position:relative;display:flex;align-items:center;justify-content:center;width:62px;height:62px;
  border-radius:13px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);
  box-shadow:inset 0 0 26px rgba(0,217,255,.07);}
.ptx{display:flex;flex-direction:column;gap:9px;}
.ptitle{font-size:37px;font-weight:800;letter-spacing:.6px;color:#F4F8FD;line-height:1;white-space:nowrap;
  text-shadow:0 2px 22px rgba(0,0,0,.5);}
.pkick{display:flex;align-items:center;gap:11px;font-size:13.5px;font-weight:600;letter-spacing:2.6px;color:#5F7794;}
.kdot{width:6px;height:6px;border-radius:50%;background:var(--acc);box-shadow:0 0 10px var(--acc);}
.ksep{color:#31465E;}
.pghost{margin-left:auto;display:flex;gap:12px;opacity:.85;}
.ghostic{display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);}
.pnum{font-size:64px;font-weight:800;letter-spacing:-1px;color:var(--acc);opacity:.16;line-height:1;margin-right:2px;}

.pdiv{position:relative;height:1px;margin:24px 0 0;background:linear-gradient(90deg,#1E293B,rgba(30,41,59,.25));}
.pdiv span{position:absolute;left:0;top:-1px;width:132px;height:3px;background:var(--acc);opacity:.85;
  box-shadow:0 0 16px var(--acc);}

.cols{position:relative;display:grid;grid-template-columns:1fr 1fr;column-gap:56px;height:617px;margin-top:22px;}
.panel.has-flow .cols{height:539px;}
.col{position:relative;display:flex;flex-direction:column;justify-content:space-between;}
.col + .col::before{content:'';position:absolute;left:-28px;top:4px;bottom:4px;width:1px;
  background:linear-gradient(180deg,transparent,rgba(30,41,59,.95) 12%,rgba(30,41,59,.95) 88%,transparent);}

.row{position:relative;display:flex;flex-direction:column;gap:5px;}
.rowid{position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:13px;font-weight:600;
  letter-spacing:1.6px;color:rgba(150,190,232,.22);}
.cmd{display:flex;align-items:center;height:32px;}
.cap{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 11px;border-radius:7px;
  background:linear-gradient(180deg,#2C3849 0%,#222C3D 100%);
  border:1px solid #3A4759;border-bottom-color:#1B2432;
  box-shadow:0 2px 0 rgba(6,10,18,.85), inset 0 1px 0 rgba(255,255,255,.07);
  font-size:17px;font-weight:600;letter-spacing:.3px;color:#E8EFF8;white-space:nowrap;}
.cap-sym{color:#9FD9EE;font-weight:500;padding:0 13px;}
.sep{font-size:15px;font-weight:400;color:#55697F;padding:0 7px;white-space:pre;}
.desc{display:flex;align-items:center;font-size:17px;font-weight:400;letter-spacing:.1px;color:#9DB3D0;line-height:24px;white-space:nowrap;}
.tick{color:var(--acc);opacity:.7;margin-right:9px;font-weight:700;}

.gitcode{display:inline-block;height:32px;line-height:30px;padding:0 13px;border-radius:7px;
  background:linear-gradient(180deg,rgba(34,197,94,.10),rgba(34,197,94,.04));
  border:1px solid rgba(34,197,94,.26);font-size:17px;font-weight:600;letter-spacing:.3px;white-space:nowrap;}
.tk-bin{color:#4ADE80;font-style:normal;font-weight:700;}
.tk-sub{color:#F1F6FC;font-style:normal;}
.tk-flag{color:#FBBF5C;font-style:normal;}
.tk-arg{color:#B9CADF;font-style:normal;font-weight:400;}

.flow{position:relative;display:flex;align-items:center;gap:10px;margin-top:22px;padding-top:20px;
  border-top:1px solid rgba(30,41,59,.9);}
.fchip{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:700;letter-spacing:2.2px;
  color:#A8BDD6;background:rgba(255,255,255,.035);border:1px solid rgba(148,190,230,.16);
  border-radius:6px;padding:8px 13px;}
.fchip-end{color:#7EE2A4;border-color:rgba(34,197,94,.42);background:rgba(34,197,94,.10);}
.fgi{display:flex;align-items:center;}
.farrow{display:flex;align-items:center;color:#3F6E52;}

/* ---------------- rodapé ---------------- */
.hud-footer{position:absolute;left:${L}px;top:2018px;width:${R - L}px;height:80px;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;}
.fleft{justify-self:start;font-size:16px;letter-spacing:1.4px;color:#4F657E;}
.fleft .p{color:#2F6B52;}
.fcenter{display:flex;align-items:center;gap:20px;}
.fcenter .dm{color:var(--c,#00D9FF);opacity:.55;font-size:15px;}
.fcenter .tx{font-size:21px;font-weight:700;letter-spacing:7px;color:#C3D4E6;white-space:nowrap;}
.fright{justify-self:end;font-size:16px;letter-spacing:2.4px;color:#435A73;}
`;

/* ------------------------------------------------------------------ HTML */
const panels = PANELS.map((p, i) => panelHtml(p, i)).join('\n');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Developer Workspace — Cheat Sheet</title>
<style>${css}</style></head>
<body><div class="stage">
  <div class="bg">
    <div class="grid-fine"></div><div class="grid-bold"></div>
    <div class="glow-a"></div><div class="glow-b"></div><div class="glow-c"></div><div class="glow-d"></div>
    <div class="hline"></div><div class="vline"></div>
    <div class="bgwrap">${bgCode()}</div>
    <svg class="circuits" viewBox="0 0 ${W} ${H}">${circuits()}</svg>
    ${leftRail()}
    <div class="rail-sep"></div>
    <div class="vignette"></div>
    <div class="edge-top"></div><div class="edge-bot"></div>
    <i class="corner c-tl"></i><i class="corner c-tr"></i><i class="corner c-bl"></i><i class="corner c-br"></i>
  </div>

  <header class="hud-header">
    <div class="hterm">
      <div class="l1"><span class="p">C:\\workspace&gt;</span> <span class="c">code .</span><span class="cur"></span></div>
      <div class="l2"><span class="chip">POWERSHELL</span><span class="chip">WSL2</span><span class="chip">GIT BASH</span></div>
    </div>
    <div class="hcenter">
      <div class="hmain">${TITLE}</div>
      <div class="hsub">${SUBTITLE.split('•').join('<i>•</i>')}</div>
    </div>
    <div class="hstack">${stackStrip()}</div>
  </header>

  <main class="grid">
${panels}
  </main>

  <footer class="hud-footer">
    <div class="fleft"><span class="p">$</span> git status --short --branch</div>
    <div class="fcenter"><span class="dm">◆</span><span class="tx">${FOOTER}</span><span class="dm">◆</span></div>
    <div class="fright">8K ULTRA HD · 7680 × 4320 · 16:9</div>
  </footer>
</div></body></html>`;

const out = path.join(__dirname, 'wallpaper.html');
fs.writeFileSync(out, html, 'utf8');
console.log('gerado:', out, (html.length / 1024).toFixed(0) + ' KB');