/* ============================================================
   UI HELPERS — format, komponen, modal, toast, tabel, grafik
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function num(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function rp(n) { const v = Math.round(Number(n) || 0); return (v < 0 ? '-Rp ' : 'Rp ') + num(Math.abs(v)); }
function rpShort(n) {
  const v = Number(n) || 0, a = Math.abs(v);
  if (a >= 1e9) return 'Rp ' + (v / 1e9).toFixed(1).replace('.', ',') + 'M';
  if (a >= 1e6) return 'Rp ' + (v / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + 'jt';
  if (a >= 1e3) return 'Rp ' + Math.round(v / 1e3) + 'rb';
  return rp(v);
}
function parseYmd(s) { const p = String(s).slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function today() { return ymd(new Date()); }
function addDays(s, n) { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 86400000); }
function tgl(s) { if (!s) return '-'; const d = parseYmd(s); return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); }
function tglPendek(s) { if (!s) return '-'; const d = parseYmd(s); return d.getDate() + ' ' + BULAN[d.getMonth()]; }
function tglJam(s) { if (!s) return '-'; return tgl(s) + (String(s).length > 10 ? ' · ' + String(s).slice(11, 16) : ''); }
function hari(s) { return HARI[parseYmd(s).getDay()]; }
function rentang(a, b) {
  if (!a) return '-';
  const da = parseYmd(a), db = parseYmd(b || a);
  if (da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear()) return da.getDate() + ' – ' + db.getDate() + ' ' + BULAN[db.getMonth()] + ' ' + db.getFullYear();
  return tglPendek(a) + ' – ' + tgl(b);
}
function bulanLabel(ym) { const p = ym.split('-'); return BULAN_PANJANG[Number(p[1]) - 1] + ' ' + p[0]; }
function initials(n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function avatar(n, size) {
  const c = 'c' + ((String(n || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0) % 5) + 1);
  return `<div class="avatar ${size || ''} ${c}">${esc(initials(n))}</div>`;
}
function debounce(fn, ms = 300) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function waLink(hp, text) {
  let n = String(hp || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(text || '');
}
function fmtHp(hp) { return String(hp || '').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3'); }
function maskId(s) { s = String(s || ''); return s.length > 10 ? s.slice(0, 6) + '******' + s.slice(-4) : s; }

/* ---------- Chip status ---------- */
function chip(text, tone, ic) { return `<span class="chip chip-${tone || 'neutral'}">${ic ? icon(ic) : ''}${esc(text)}</span>`; }
function chipBayar(s) {
  if (s === 'Lunas') return chip('LUNAS', 'success', 'check-circle');
  if (s === 'DP') return chip('DP / SEBAGIAN', 'warn', 'banknote');
  return chip('BELUM BAYAR', 'danger', 'alert');
}
function chipBooking(s) {
  const m = { 'Dikonfirmasi': 'success', 'Menunggu': 'warn', 'Selesai': 'info', 'Dibatalkan': 'danger' };
  return `<span class="chip chip-${m[s] || 'neutral'}"><span class="dot"></span>${esc(String(s || '').toUpperCase())}</span>`;
}
function chipDep(d) {
  const s = d.status_tampil;
  if (s === 'Penuh') return chip('KUOTA PENUH', 'dark');
  if (s === 'Kritis') return chip('SISA ' + d.sisa + ' KURSI', 'orange');
  if (s === 'Selesai') return chip('SELESAI', 'neutral');
  if (s === 'Dibatalkan') return chip('DIBATALKAN', 'danger');
  return chip('TERSEDIA', 'primary');
}

/* ---------- Toast ---------- */
function toast(msg, type = 'success') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = icon(type === 'error' ? 'alert-circle' : type === 'info' ? 'info' : 'check-circle') + `<div>${esc(msg)}</div>`;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, type === 'error' ? 5500 : 3200);
}

/* ---------- Modal ---------- */
function modal({ title, sub, body, foot, size, onOpen, dismissable = true }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${size || ''}" role="dialog" aria-modal="true">
    <div class="modal-head"><div><h3>${title || ''}</h3>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
    <button class="icon-btn" data-close aria-label="Tutup">${icon('x')}</button></div>
    <div class="modal-body">${body || ''}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  document.body.appendChild(back);
  document.body.style.overflow = 'hidden';
  const close = () => { back.remove(); if (!$('.modal-back')) document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape' && dismissable) close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('mousedown', e => { if (e.target === back && dismissable) close(); });
  $$('[data-close]', back).forEach(b => b.addEventListener('click', close));
  const m = { el: back, close, $: s => $(s, back), $$: s => $$(s, back) };
  if (onOpen) onOpen(m);
  const first = $('input:not([type=hidden]):not([type=checkbox]), select, textarea', back);
  if (first && window.innerWidth > 767) setTimeout(() => first.focus(), 50);
  return m;
}
function confirmDialog({ title, message, confirmText = 'Ya, lanjutkan', danger = false, input = null }) {
  return new Promise(resolve => {
    const m = modal({
      title, size: 'sm',
      body: `<p class="mt-0" style="color:var(--ink-2);line-height:22px">${message}</p>` +
        (input ? `<div class="field mt-3"><label>${esc(input.label)}${input.required ? ' <span class="req">*</span>' : ''}</label><textarea class="textarea" id="cfm-in" placeholder="${esc(input.placeholder || '')}"></textarea></div>` : ''),
      foot: `<button class="btn btn-outline" data-close>Batal</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="cfm-ok">${esc(confirmText)}</button>`
    });
    let done = false;
    m.$('#cfm-ok').onclick = () => {
      let val = true;
      if (input) {
        val = m.$('#cfm-in').value.trim();
        if (input.required && !val) { m.$('#cfm-in').classList.add('invalid'); return; }
      }
      done = true; m.close(); resolve(val);
    };
    const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) resolve(false); } });
    obs.observe(document.body, { childList: true });
  });
}

/* ---------- Tombol loading ---------- */
async function withBusy(btn, fn) {
  if (!btn) return fn();
  const html = btn.innerHTML, w = btn.offsetWidth;
  btn.disabled = true; btn.style.minWidth = w + 'px';
  btn.innerHTML = '<span class="spinner"></span>';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = html; btn.style.minWidth = ''; }
}

/* ---------- Form ---------- */
function formData(form) {
  const o = {};
  $$('[name]', form).forEach(el => {
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
    else o[el.name] = el.value.trim();
  });
  return o;
}
function validate(form) {
  let ok = true;
  $$('[required]', form).forEach(el => {
    const bad = !String(el.value || '').trim();
    el.classList.toggle('invalid', bad);
    if (bad && ok) { ok = false; el.focus(); }
  });
  $$('input[type=email]', form).forEach(el => {
    if (el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) { el.classList.add('invalid'); if (ok) el.focus(); ok = false; }
  });
  if (!ok) toast('Lengkapi kolom yang ditandai merah.', 'error');
  return ok;
}
function opts(list, val, placeholder) {
  return (placeholder !== undefined ? `<option value="">${esc(placeholder)}</option>` : '') +
    list.map(o => { const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
}
function field(label, control, { req, hint, cls = 'c-12', right } = {}) {
  return `<div class="field ${cls}"><label><span>${label}${req ? ' <span class="req">*</span>' : ''}</span>${right ? `<small class="muted">${right}</small>` : ''}</label>${control}${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
}
/** Input rupiah: tampil dengan titik ribuan. */
function moneyInput(name, val, attrs = '') {
  return `<div class="input-prefix"><span>Rp</span><input class="input mono" name="${name}" inputmode="numeric" data-money value="${val ? num(val) : ''}" ${attrs}></div>`;
}
function bindMoney(root) {
  $$('[data-money]', root).forEach(el => {
    el.addEventListener('input', () => {
      const pos = el.value.length - el.selectionStart;
      const raw = el.value.replace(/\D/g, '');
      el.value = raw ? num(raw) : '';
      el.setSelectionRange(el.value.length - pos, el.value.length - pos);
    });
  });
}
function moneyVal(v) { return Number(String(v || '').replace(/\D/g, '')) || 0; }

/* ---------- Berkas ---------- */
function pickFile({ accept = 'image/*,application/pdf', maxMB = 5 } = {}) {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return resolve(null);
      try { resolve(await readFileForUpload(f, maxMB)); } catch (e) { toast(e.message, 'error'); resolve(null); }
    };
    inp.click();
  });
}
async function readFileForUpload(f, maxMB = 5) {
  const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!okTypes.includes(f.type)) throw new Error('Format harus JPG, PNG, WEBP, atau PDF.');
  let blob = f, mime = f.type, name = f.name;
  if (f.type.startsWith('image/')) {
    // Kompres foto di sisi klien (maks 1600px, JPEG 82%)
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const out = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
    if (out && out.size < f.size) { blob = out; mime = 'image/jpeg'; name = name.replace(/\.\w+$/, '') + '.jpg'; }
    URL.revokeObjectURL(img.src);
  }
  if (blob.size > maxMB * 1024 * 1024) throw new Error('Ukuran berkas maksimal ' + maxMB + ' MB.');
  const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  return { name, mime, size: blob.size, base64, preview: mime.startsWith('image/') ? URL.createObjectURL(blob) : null };
}
function b64ToBlob(b64, mime) {
  const bin = atob(b64), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
function downloadB64(b64, name, mime) {
  const url = URL.createObjectURL(b64ToBlob(b64, mime));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const _fileCache = {};
async function fetchFile(fileId) {
  if (_fileCache[fileId]) return _fileCache[fileId];
  const f = await API.call('getFile', { fileId });
  _fileCache[fileId] = f;
  return f;
}
async function viewFile(fileId, btn) {
  await withBusy(btn, async () => {
    try {
      const f = await fetchFile(fileId);
      const url = URL.createObjectURL(b64ToBlob(f.base64, f.mime));
      if (f.mime.startsWith('image/')) {
        modal({ title: esc(f.name), size: 'lg', body: `<img src="${url}" style="width:100%;border-radius:12px">`,
          foot: `<button class="btn btn-outline" data-close>Tutup</button><a class="btn btn-primary" href="${url}" download="${esc(f.name)}">${icon('download')} Unduh</a>` });
      } else {
        const w = window.open(url, '_blank');
        if (!w) downloadB64(f.base64, f.name, f.mime);
      }
    } catch (e) { toast(e.message, 'error'); }
  });
}
function fileExt(name) { return (String(name).split('.').pop() || '').toUpperCase().slice(0, 4); }
function fileSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

/* ---------- CSV ---------- */
function downloadCsv(name, rows) {
  const csv = rows.map(r => r.map(v => { const s = String(v === undefined || v === null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* ---------- Tampilan umum ---------- */
function loadingView(text = 'Memuat data...') { return `<div class="loading-page"><div><span class="spinner"></span><span>${esc(text)}</span></div></div>`; }
function emptyView(text, ic = 'search', action = '') {
  return `<div class="empty"><div class="ic-wrap">${icon(ic)}</div><div>${text}</div>${action ? `<div class="mt-3">${action}</div>` : ''}</div>`;
}
function errorView(msg, retry) {
  return `<div class="card"><div class="empty"><div class="ic-wrap" style="background:#FCE0DC;color:var(--danger-ink)">${icon('alert')}</div>
    <div class="bold">Gagal memuat data</div><div class="mt-1">${esc(msg)}</div>
    ${retry ? `<button class="btn btn-outline mt-4" onclick="App.route()">${icon('refresh')} Coba lagi</button>` : ''}</div></div>`;
}
function statCard({ label, value, unit, ic, foot, money, hl, extra }) {
  return `<div class="stat ${hl ? 'hl' : ''}"><div class="top"><div class="lbl">${label}</div>${ic ? `<div class="ico">${icon(ic)}</div>` : ''}</div>
    <div class="val ${money ? 'money' : ''}">${value}${unit ? ` <small>${unit}</small>` : ''}</div>${extra || ''}${foot ? `<div class="foot">${foot}</div>` : ''}</div>`;
}
function progress(pct, cls) { return `<div class="progress ${cls || ''}"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></div>`; }
function pageHead({ over, title, badges = '', desc, actions = '', back }) {
  return `<div class="page-head"><div class="grow">
    ${back ? `<a class="back-link" href="${back.href}">${icon('arrow-left', 'ic-sm')} ${esc(back.label)}</a>` : ''}
    ${over ? `<div class="over">${over}</div>` : ''}
    <h1>${title} ${badges}</h1>${desc ? `<div class="desc">${desc}</div>` : ''}</div>
    ${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
}
function pager(res, onGo) {
  const id = 'pg' + Math.random().toString(36).slice(2, 7);
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    $$('[data-p]', el).forEach(b => b.onclick = () => onGo(Number(b.dataset.p)));
    const sz = $('select', el); if (sz) sz.onchange = () => onGo(1, Number(sz.value));
  });
  const { page, pages, total, size } = res;
  const from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
  let nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  return `<div class="pager" id="${id}"><div>Menampilkan <b>${from}–${to}</b> dari <b>${total}</b> data</div>
    <div class="row wrap"><span class="hide-sm">Tampilkan:</span><select class="select" style="width:auto;height:32px">${opts([10, 25, 50, 100], size)}</select>
    <div class="pages"><button class="pg" data-p="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${icon('chevron-left', 'ic-sm')}<span class="hide-sm">Sebelumnya</span></button>
    ${nums.map(n => `<button class="pg ${n === page ? 'on' : ''}" data-p="${n}">${n}</button>`).join('')}
    <button class="pg" data-p="${page + 1}" ${page >= pages ? 'disabled' : ''}><span class="hide-sm">Berikutnya</span>${icon('chevron-right', 'ic-sm')}</button></div></div></div>`;
}

/* ---------- Grafik SVG ---------- */
let _tip;
function showTip(e, html) {
  if (!_tip) { _tip = document.createElement('div'); _tip.className = 'bar-tip'; document.body.appendChild(_tip); }
  _tip.innerHTML = html; _tip.style.display = 'block';
  const x = Math.min(e.clientX + 14, window.innerWidth - _tip.offsetWidth - 8);
  _tip.style.left = x + 'px'; _tip.style.top = (e.clientY - _tip.offsetHeight - 10) + 'px';
}
function hideTip() { if (_tip) _tip.style.display = 'none'; }
function bindTips(root) {
  $$('[data-tip]', root).forEach(el => {
    el.addEventListener('mousemove', e => showTip(e, el.dataset.tip));
    el.addEventListener('mouseleave', hideTip);
  });
}
/** Grafik batang berkelompok. data: [{label, values:[a,b]}], colors, names */
function barChart(data, { colors = ['#E8731A', '#D9C8B4'], names = [], height = 220, highlightLast = true } = {}) {
  const W = 640, H = height, padL = 44, padB = 26, padT = 10;
  const max = Math.max(1, ...data.flatMap(d => d.values));
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const gw = (W - padL) / data.length, bw = Math.min(26, gw / (data[0].values.length + 1.4));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (H - padT - padB) * (1 - i / 4);
    s += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" stroke="#F1E8DB" stroke-dasharray="${i ? '3 4' : ''}"/>`;
    s += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end">${rpShort(top * i / 4).replace('Rp ', '')}</text>`;
  }
  data.forEach((d, gi) => {
    const gx = padL + gi * gw + (gw - bw * d.values.length - 4 * (d.values.length - 1)) / 2;
    d.values.forEach((v, vi) => {
      const h = (H - padT - padB) * (v / top), x = gx + vi * (bw + 4), y = H - padB - h;
      const tip = `<b>${esc(d.label)}</b><br>${esc(names[vi] || '')}: ${rp(v)}`;
      s += `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 0.5)}" rx="4" fill="${colors[vi]}" data-tip="${esc(tip)}" style="cursor:pointer"/>`;
    });
    const last = highlightLast && gi === data.length - 1;
    s += `<text x="${padL + gi * gw + gw / 2}" y="${H - 6}" text-anchor="middle" style="${last ? 'font-weight:700;fill:#2A2118' : ''}">${esc(d.label)}</text>`;
  });
  return s + '</svg>';
}
/** Donat. segs: [{label, value, color}] */
function donut(segs, { size = 170, center = '', sub = '' } = {}) {
  const total = segs.reduce((s, x) => s + x.value, 0);
  const r = 62, c = 2 * Math.PI * r;
  let off = 0, s = `<svg viewBox="0 0 170 170" width="${size}" height="${size}" role="img"><circle cx="85" cy="85" r="${r}" fill="none" stroke="#F1E8DB" stroke-width="20"/>`;
  if (total) segs.forEach(x => {
    const len = c * x.value / total;
    if (len > 0) s += `<circle cx="85" cy="85" r="${r}" fill="none" stroke="${x.color}" stroke-width="20" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 85 85)" data-tip="${esc(x.label + ': ' + x.value)}"/>`;
    off += len;
  });
  s += `<text x="85" y="84" text-anchor="middle" style="font-size:26px;font-weight:700;fill:#2A2118">${esc(center)}</text><text x="85" y="104" text-anchor="middle" style="font-size:11px">${esc(sub)}</text></svg>`;
  return s;
}
