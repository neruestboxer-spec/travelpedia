/* ============================================================
   HALAMAN ADMINISTRASI (khusus Admin — juga dicek di server)
   Keuangan · Transaksi · Supplier · Payroll · Karyawan · Pengguna · Pengaturan · Log
   ============================================================ */
const METODE = ['Transfer Bank BCA', 'Transfer Bank Mandiri', 'Transfer Bank BRI', 'Transfer Bank BNI', 'QRIS', 'Tunai', 'Kas Kecil', 'Lainnya'];

function periodRange(kind) {
  const t = today(), d = parseYmd(t), y = d.getFullYear(), m = d.getMonth();
  const f = (yy, mm, dd) => ymd(new Date(yy, mm, dd));
  return {
    bulan: [f(y, m, 1), t], lalu: [f(y, m - 1, 1), f(y, m, 0)], tiga: [f(y, m - 2, 1), t],
    tahun: [f(y, 0, 1), t], semester: [f(y, m - 5, 1), t]
  }[kind] || [f(y, m, 1), t];
}

/* ======================= KEUANGAN & LABA/RUGI ======================= */
Pages.finance = async (c) => {
  const st = { kind: c.query.p || 'bulan', from: c.query.from || '', to: c.query.to || '' };
  if (!st.from) [st.from, st.to] = periodRange(st.kind);
  c.view.innerHTML = pageHead({ over: 'Administrasi / <b>Keuangan & Laba/Rugi</b>', title: 'Keuangan & Laba/Rugi',
    badges: `<span class="chip chip-neutral">Tahun Fiskal ${today().slice(0, 4)}</span><span class="chip chip-primary">${icon('shield')} Akses Khusus Admin</span>`,
    desc: 'Konsolidasi arus kas, analisis laba operasional, valuasi piutang customer, dan pengeluaran beban rekanan tour secara terintegrasi.',
    actions: `<select class="select" id="fp" style="width:auto">${opts([{ value: 'bulan', label: 'Bulan Ini' }, { value: 'lalu', label: 'Bulan Lalu' }, { value: 'tiga', label: '3 Bulan Terakhir' }, { value: 'semester', label: '6 Bulan Terakhir' }, { value: 'tahun', label: 'Tahun Ini' }, { value: 'custom', label: 'Rentang Kustom' }], st.kind)}</select>
      <input class="input" type="date" id="ff" value="${st.from}" style="width:auto"><input class="input" type="date" id="ft" value="${st.to}" style="width:auto">
      <button class="btn btn-outline" id="fx">${icon('download')} Unduh Rekap (.csv)</button><button class="btn btn-primary" onclick="window.print()">${icon('printer')} Cetak Laporan</button>` }) + '<div id="fin"></div>';
  let data;
  const load = async () => {
    App.setQuery({ p: st.kind, from: st.from, to: st.to });
    $('#fin').innerHTML = loadingView();
    const f = data = await API.call('getFinance', { from: st.from, to: st.to });
    if (!c.alive()) return;
    const totBeban = Object.values(f.beban).reduce((s, v) => s + v, 0);
    const dist = f.distribusi, nb = f.n_booking;
    const trendChip = (v, inv) => v === null ? '<span class="ink2">Tidak ada pembanding</span>' : `<span class="${(v >= 0) !== !!inv ? 'c-success' : 'c-danger'}">${icon(v >= 0 ? 'trending-up' : 'trending-down', 'ic-sm')} ${v >= 0 ? '+' : ''}${v}%</span><span class="ink2">vs periode lalu</span>`;
    const colors = { Supplier: '#E8731A', Operasional: '#F2A33A', Gaji: '#8A7265', Lainnya: '#D9C8B4' };
    const topMax = Math.max(1, ...f.top_trips.map(t => t.omzet));
    $('#fin').innerHTML = `<div class="stats">
      ${statCard({ label: 'Total pemasukan', value: rp(f.pemasukan), money: true, ic: 'trending-up', foot: trendChip(f.tren_masuk) })}
      ${statCard({ label: 'Total pengeluaran', value: rp(f.pengeluaran), money: true, ic: 'arrow-down-left', foot: trendChip(f.tren_keluar, true) })}
      ${statCard({ label: 'Laba bersih operasional', value: rp(f.laba), money: true, ic: 'wallet', hl: true, foot: `${chip(f.laba >= 0 ? 'SURPLUS SEHAT' : 'DEFISIT', f.laba >= 0 ? 'success' : 'danger')}<span class="mono">Margin: ${f.margin}%</span>` })}
      ${statCard({ label: 'Piutang berjalan', value: rp(f.piutang), money: true, ic: 'clock', foot: `${chip(f.n_piutang + ' Booking menunggu', 'warn')}<a href="#/bookings?piutang=1" class="small">Detail</a>` })}
    </div>
    <div class="grid-63 mt-6"><div class="card"><div class="card-head"><div><div class="label-xs">Tren keuangan 6 bulan</div><h3 class="mt-1">Pemasukan vs Pengeluaran per Bulan</h3></div><div class="legend"><span><i style="background:#E8731A"></i>Pemasukan</span><span><i style="background:#D9C8B4"></i>Pengeluaran</span></div></div>
      <div class="card-body chart">${barChart(f.trend.map(t => ({ label: BULAN[Number(t.bulan.slice(5)) - 1] + (t.bulan.slice(0, 4) !== today().slice(0, 4) ? ' ' + t.bulan.slice(2, 4) : ''), values: [t.pemasukan, t.pengeluaran] })), { names: ['Pemasukan', 'Pengeluaran'], height: 260 })}</div>
      <div class="card-foot" style="justify-content:space-between"><span class="small ink2">Laba 6 bulan: <b class="mono">${rp(f.trend.reduce((s, t) => s + t.pemasukan - t.pengeluaran, 0))}</b></span><a href="#/transactions">Lihat Rincian Transaksi ${icon('arrow-right', 'ic-sm')}</a></div></div>
    <div class="card"><div class="card-head"><div><div class="label-xs">Distribusi pembayaran</div><h3 class="mt-1">Status Booking Periode Ini</h3></div><span class="chip chip-neutral">Auto-Sync</span></div><div class="card-body">
      <div class="center">${donut([{ label: 'Lunas', value: dist['Lunas'].n, color: '#E8731A' }, { label: 'DP', value: dist['DP'].n, color: '#F6A867' }, { label: 'Belum Bayar', value: dist['Belum Bayar'].n, color: '#9A4600' }], { size: 180, center: nb, sub: 'TOTAL BOOKING' })}</div>
      ${[['Lunas Penuh', 'Lunas', '#E8731A'], ['DP Bertahap', 'DP', '#F6A867'], ['Menunggu Tagihan', 'Belum Bayar', '#9A4600']].map(([l, k, col]) => `<div class="dist-row"><span><span class="dot" style="color:${col}"></span> <b>${l}</b><div class="xs ink2">${dist[k].n} Booking (${nb ? Math.round(dist[k].n / nb * 1000) / 10 : 0}%)</div></span><span class="mono">${rp(dist[k].nilai)}</span></div>`).join('')}
      <a class="btn btn-secondary btn-block mt-3" href="#/bookings?piutang=1">Lihat Detail Piutang & Tagihan ${icon('arrow-right')}</a></div></div></div>
    <div class="grid-2 mt-6"><div class="card"><div class="card-head"><div><div class="label-xs">Katalog trip populer</div><h3 class="mt-1">Kontribusi Omzet (Top ${f.top_trips.length || 0} Paket)</h3></div></div><div class="card-body">
      ${f.top_trips.length ? f.top_trips.map((t, i) => `<div class="hbar"><div class="meta"><span><b>${i + 1}. ${esc(t.nama)}</b> <span class="ink2 small">${t.pax} Pax • ${t.booking} booking</span></span><span class="mono">${rp(t.omzet)}</span></div>${progress(t.omzet / topMax * 100)}</div>`).join('') : emptyView('Belum ada booking di periode ini.', 'compass')}</div>
      <div class="card-foot" style="justify-content:space-between"><span class="small ink2">Berdasarkan nilai booking pada periode</span><a href="#/trips">Kelola Trip & Harga ${icon('arrow-right', 'ic-sm')}</a></div></div>
    <div class="card"><div class="card-head"><div><div class="label-xs">Struktur pengeluaran</div><h3 class="mt-1">Beban per Kategori</h3></div><div class="right"><div class="label-xs">Total beban</div><div class="mono bold">${rp(totBeban)}</div></div></div><div class="card-body">
      <div class="progress" style="height:10px;display:flex">${Object.entries(f.beban).map(([k, v]) => totBeban ? `<span style="width:${v / totBeban * 100}%;background:${colors[k] || '#ccc'};border-radius:0" data-tip="${esc(k)}: ${rp(v)}"></span>` : '').join('')}</div>
      ${Object.entries(f.beban).map(([k, v]) => `<div class="dist-row mt-2"><span><span class="dot" style="color:${colors[k] || '#ccc'}"></span> <b>${esc(k)}</b><div class="xs ink2">${{ Supplier: 'Hotel, kapal, transport, maskapai', Operasional: 'Lapangan, retribusi, konsumsi, kantor', Gaji: 'Payroll staf & honor tour leader', Lainnya: 'Biaya bank, administrasi, lain-lain' }[k] || ''}</div></span><span class="right"><span class="mono">${rp(v)}</span><div class="xs ink2">${totBeban ? Math.round(v / totBeban * 1000) / 10 : 0}%</div></span></div>`).join('')}</div>
      <div class="card-foot" style="justify-content:space-between"><span class="small ink2">Periode ${tgl(f.from)} – ${tgl(f.to)}</span><a href="#/suppliers">Rekap Data Supplier ${icon('arrow-right', 'ic-sm')}</a></div></div></div>
    <div class="card mt-6"><div class="card-head"><div><div class="row small c-success bold"><span class="dot"></span> SINKRONISASI OTOMATIS KAS AKTIF</div><h3 class="mt-1">Transaksi Terbaru (Buku Kas Periode Ini)</h3></div><a class="btn btn-dark btn-sm" href="#/transactions?from=${f.from}&to=${f.to}">Buka Buku Kas Lengkap ${icon('arrow-right', 'ic-sm')}</a></div>
      ${trxTable(f.transaksi)}</div>
    <div class="callout mt-6"><div class="ic-wrap">${icon('shield-check')}</div><div class="grow"><b>Kepatuhan Audit & Rekonsiliasi Kas</b><div class="small ink2 mt-1">Pembayaran customer dan payroll final tercatat otomatis ke Buku Kas. Pengeluaran supplier & operasional dicatat manual oleh Admin di menu Transaksi.</div></div>
      <div class="row wrap"><a class="btn btn-outline btn-sm" href="#/transactions">Buku Transaksi</a><a class="btn btn-outline btn-sm" href="#/payroll">Payroll</a><a class="btn btn-outline btn-sm" href="#/suppliers">Supplier</a></div></div>`;
    bindTips($('#fin'));
  };
  $('#fp').onchange = e => { st.kind = e.target.value; if (st.kind !== 'custom') { [st.from, st.to] = periodRange(st.kind); $('#ff').value = st.from; $('#ft').value = st.to; load(); } };
  $('#ff').onchange = e => { st.kind = 'custom'; $('#fp').value = 'custom'; st.from = e.target.value; load(); };
  $('#ft').onchange = e => { st.kind = 'custom'; $('#fp').value = 'custom'; st.to = e.target.value; load(); };
  $('#fx').onclick = () => {
    const f = data; if (!f) return;
    const rows = [['LAPORAN LABA/RUGI', tgl(f.from) + ' – ' + tgl(f.to)], [], ['Total Pemasukan', f.pemasukan], ['Total Pengeluaran', f.pengeluaran], ['Laba Bersih', f.laba], ['Margin (%)', f.margin], ['Piutang Berjalan', f.piutang], [], ['BEBAN PER KATEGORI'], ...Object.entries(f.beban), [], ['TREN 6 BULAN'], ['Bulan', 'Pemasukan', 'Pengeluaran', 'Laba'], ...f.trend.map(t => [t.bulan, t.pemasukan, t.pengeluaran, t.pemasukan - t.pengeluaran]), [], ['TRIP TERLARIS'], ['Trip', 'Pax', 'Booking', 'Omzet'], ...f.top_trips.map(t => [t.nama, t.pax, t.booking, t.omzet])];
    downloadCsv('Laporan_Keuangan_' + f.from + '_' + f.to + '.csv', rows);
  };
  await load();
};

function trxTable(rows, { actions } = {}) {
  if (!rows.length) return emptyView('Belum ada transaksi pada periode ini.', 'banknote');
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal & Ref ID</th><th>Jenis</th><th>Kategori</th><th>Keterangan / Uraian</th><th>Entitas Terkait</th><th class="num">Nominal (IDR)</th><th>Dicatat</th>${actions ? '<th></th>' : ''}</tr></thead><tbody>
    ${rows.map(t => `<tr><td><div class="mono small">${tgl(t.tanggal)}</div><div class="sub mono">${esc(t.kode)}</div></td>
      <td>${chip(t.jenis.toUpperCase(), t.jenis === 'Pemasukan' ? 'success' : 'neutral')}</td><td class="small">${esc(t.kategori)}</td>
      <td style="max-width:280px"><div class="small">${esc(t.keterangan)}</div>${t.otomatis ? `<span class="chip chip-primary mt-1">${icon('zap')} Otomatis</span>` : ''}${t.metode ? `<div class="sub">${esc(t.metode)}</div>` : ''}</td>
      <td class="small">${t.booking_kode ? `<a class="code" href="#/bookings/${t.id_booking}">${icon('ticket', 'ic-sm')} ${esc(t.booking_kode)}</a>` : t.supplier_nama ? `<span class="c-primary row">${icon('building', 'ic-sm')} ${esc(t.supplier_nama)}</span>` : '<span class="muted">—</span>'}</td>
      <td class="num bold ${t.jenis === 'Pemasukan' ? 'c-success' : ''}">${t.jenis === 'Pemasukan' ? '+ ' : '- '}${rp(t.nominal)}</td>
      <td><div class="row" title="${esc(t.dicatat_oleh)}">${avatar(t.dicatat_oleh, 'sm')}<span class="small hide-sm">${esc(String(t.dicatat_oleh).split(' ')[0])}</span></div></td>
      ${actions ? `<td class="nowrap">${t.otomatis ? '<span class="xs muted">dari modul asal</span>' : `<button class="btn btn-ghost btn-icon btn-sm" data-et="${t.id}">${icon('edit')}</button><button class="btn btn-ghost btn-icon btn-sm" data-dt="${t.id}">${icon('trash')}</button>`}</td>` : ''}</tr>`).join('')}
  </tbody></table></div>`;
}

/* ======================= TRANSAKSI KEUANGAN ======================= */
Pages.transactions = async (c) => {
  const q = c.query;
  const st = { q: q.q || '', jenis: q.jenis || '', kategori: q.kategori || '', from: q.from || '', to: q.to || '', page: 1, size: 10 };
  if (!st.from && !st.to) [st.from, st.to] = periodRange('bulan');
  c.view.innerHTML = pageHead({ over: 'Administrasi / <b>Transaksi Keuangan</b>', title: 'Transaksi Keuangan', badges: '<span class="chip chip-primary">Buku Besar Kas</span>',
    desc: 'Pencatatan kas masuk dan keluar terpusat untuk operasional, pelunasan vendor, serta pembayaran otomatis dari booking customer.',
    actions: `<button class="btn btn-outline" id="tx-exp">${icon('download')} Ekspor (.csv)</button><button class="btn btn-outline" id="tx-in">${icon('plus-circle')} Pemasukan Lain</button><button class="btn btn-primary" id="tx-out">${icon('minus-circle')} Catat Pengeluaran</button>` }) +
    `<div class="stats" id="tx-stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"></div>
    <div class="card mt-6"><div class="filters">
      <div class="input-icon">${icon('search')}<input class="input" id="x-q" placeholder="Cari transaksi, no. ref, nama, booking ID..." value="${esc(st.q)}"></div>
      <select class="select" id="x-j">${opts(['Pemasukan', 'Pengeluaran'], st.jenis, 'Semua Jenis Kas')}</select>
      <select class="select" id="x-k"><option value="">Semua Kategori</option></select>
      <input class="input" type="date" id="x-f" value="${st.from}"><input class="input" type="date" id="x-t" value="${st.to}">
      <button class="btn btn-secondary btn-sm" id="x-r">${icon('refresh', 'ic-sm')} Reset</button></div><div id="tx-table" style="border-top:1px solid var(--divider)"></div></div>`;
  let meta = null;
  const load = async () => {
    App.setQuery({ q: st.q, jenis: st.jenis, kategori: st.kategori, from: st.from, to: st.to });
    $('#tx-table').innerHTML = loadingView();
    const r = await API.call('listTransactions', st);
    if (!c.alive()) return;
    meta = r;
    const ks = st.jenis ? r.kategori[st.jenis] : [...r.kategori.Pemasukan, ...r.kategori.Pengeluaran];
    $('#x-k').innerHTML = opts(ks, st.kategori, 'Semua Kategori');
    const s = r.stats;
    $('#tx-stats').innerHTML = statCard({ label: 'Total pemasukan (gross inflow)', value: rp(s.pemasukan), money: true, ic: 'trending-up', foot: `<span class="c-danger">● ${s.n_masuk} transaksi</span><span>${tgl(st.from)} – ${tgl(st.to)}</span>` }) +
      statCard({ label: 'Total pengeluaran operasional', value: rp(s.pengeluaran), money: true, ic: 'trending-down', foot: `<span>● ${s.n_keluar} transaksi vendor & operasional</span>` }) +
      statCard({ label: 'Surplus kas bersih', value: `<span class="${s.saldo >= 0 ? 'c-primary' : 'c-danger'}">${rp(s.saldo)}</span>`, money: true, hl: true, ic: 'wallet', foot: `${chip(s.saldo >= 0 ? 'Surplus Sehat' : 'Defisit', s.saldo >= 0 ? 'success' : 'danger')}<span>Margin ${s.pemasukan ? Math.round(s.saldo / s.pemasukan * 1000) / 10 : 0}%</span>` });
    $('#tx-table').innerHTML = trxTable(r.rows, { actions: true }) + (r.rows.length ? pager(r, (p, sz) => { st.page = p; if (sz) st.size = sz; load(); }) : '');
    $$('[data-et]').forEach(b => b.onclick = () => trxForm(r.rows.find(t => t.id === b.dataset.et), meta, load));
    $$('[data-dt]').forEach(b => b.onclick = async () => {
      if (!await confirmDialog({ title: 'Hapus transaksi?', message: 'Transaksi akan ditandai terhapus dan tidak dihitung di laporan.', danger: true, confirmText: 'Hapus' })) return;
      try { await API.call('deleteTransaction', { id: b.dataset.dt }); toast('Transaksi dihapus.'); load(); } catch (e) { toast(e.message, 'error'); }
    });
  };
  $('#x-q').oninput = debounce(e => { st.q = e.target.value.trim(); st.page = 1; load(); }, 400);
  $('#x-j').onchange = e => { st.jenis = e.target.value; st.kategori = ''; st.page = 1; load(); };
  $('#x-k').onchange = e => { st.kategori = e.target.value; st.page = 1; load(); };
  $('#x-f').onchange = e => { st.from = e.target.value; st.page = 1; load(); };
  $('#x-t').onchange = e => { st.to = e.target.value; st.page = 1; load(); };
  $('#x-r').onclick = () => App.go('#/transactions');
  $('#tx-in').onclick = () => trxForm({ jenis: 'Pemasukan' }, meta, load);
  $('#tx-out').onclick = () => trxForm({ jenis: 'Pengeluaran' }, meta, load);
  $('#tx-exp').onclick = e => withBusy(e.currentTarget, async () => {
    const r = await API.call('listTransactions', { ...st, page: 1, size: 200 });
    downloadCsv('Buku_Kas_' + st.from + '_' + st.to + '.csv', [['Tanggal', 'Kode', 'Jenis', 'Kategori', 'Keterangan', 'Metode', 'Booking', 'Supplier', 'Nominal', 'Otomatis', 'Dicatat Oleh'],
      ...r.rows.map(t => [t.tanggal, t.kode, t.jenis, t.kategori, t.keterangan, t.metode, t.booking_kode, t.supplier_nama, t.jenis === 'Pemasukan' ? t.nominal : -t.nominal, t.otomatis ? 'Ya' : '', t.dicatat_oleh])]);
  });
  await load();
};

async function trxForm(t, meta, onSaved) {
  if (!meta) meta = await API.call('listTransactions', { size: 1 });
  let jenis = t.jenis || 'Pengeluaran';
  const m = modal({ title: t.id ? 'Ubah Transaksi' : (jenis === 'Pemasukan' ? 'Catat Pemasukan Lain' : 'Catat Pengeluaran'), sub: t.id ? `<span class="mono">${esc(t.kode)}</span>` : 'Transaksi tercatat ke Buku Kas & laporan laba/rugi',
    body: `<form id="tf" class="form-grid" novalidate>
      ${field('Jenis Kas', `<div class="seg" id="tj">${['Pemasukan', 'Pengeluaran'].map(v => `<button type="button" class="${jenis === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div>`, { cls: 'c-6' })}
      ${field('Tanggal', `<input class="input" type="date" name="tanggal" required value="${esc(t.tanggal || today())}">`, { req: true, cls: 'c-6' })}
      ${field('Kategori', `<select class="select" name="kategori" required id="tk"></select>`, { req: true, cls: 'c-6' })}
      ${field('Nominal', moneyInput('nominal', t.nominal, 'required'), { req: true, cls: 'c-6' })}
      <div class="c-12 field" id="sup-wrap">${field('Supplier / Vendor', `<select class="select" name="id_supplier">${opts(meta.suppliers.map(s => ({ value: s.id, label: s.nama + ' (' + s.jenis + ')' })), t.id_supplier, '— Pilih supplier —')}</select>`)}</div>
      ${field('Metode / Rekening', `<select class="select" name="metode">${opts(METODE, t.metode || 'Transfer Bank BCA')}</select>`, { cls: 'c-6' })}
      ${field('Keterangan / Uraian', `<input class="input" name="keterangan" required value="${esc(t.keterangan || '')}" placeholder="DP sewa kapal batch 25 Nov">`, { req: true, cls: 'c-6' })}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="tf-save">Simpan Transaksi</button>' });
  bindMoney(m.el);
  const f = m.$('#tf');
  const sync = () => {
    m.$('#tk').innerHTML = opts(meta.kategori[jenis], t.kategori || (jenis === 'Pengeluaran' ? 'Operasional' : 'Pemasukan Lain'));
    m.$('#sup-wrap').style.display = jenis === 'Pengeluaran' ? '' : 'none';
  };
  m.$$('#tj button').forEach(b => b.onclick = () => { jenis = b.dataset.v; m.$$('#tj button').forEach(x => x.classList.toggle('on', x === b)); t.kategori = ''; sync(); });
  sync();
  m.$('#tf-save').onclick = e => {
    if (!validate(f)) return;
    const d = formData(f); d.jenis = jenis; d.nominal = moneyVal(d.nominal); if (jenis !== 'Pengeluaran') d.id_supplier = ''; if (t.id) d.id = t.id;
    withBusy(e.currentTarget, async () => {
      try { await API.call('saveTransaction', d); toast('Transaksi tersimpan.'); m.close(); onSaved && onSaved(); } catch (err) { toast(err.message, 'error'); }
    });
  };
}

/* ======================= SUPPLIER ======================= */
const SUP_JENIS = ['Hotel', 'Transportasi', 'Maskapai', 'Kapal', 'Guide', 'Lainnya'];
const SUP_IC = { Hotel: 'bed', Transportasi: 'plane', Maskapai: 'plane-takeoff', Kapal: 'ship', Guide: 'user', Lainnya: 'package' };
Pages.suppliers = async (c) => {
  const st = { q: '', jenis: '', status: '' };
  c.view.innerHTML = `<div class="card" style="padding:20px 24px;margin-bottom:20px">${pageHead({ title: 'Data Supplier & Rekanan', badges: '<span class="chip chip-primary">' + icon('shield') + ' Akses Admin</span><span class="chip chip-neutral" id="sup-count"></span>',
    desc: 'Kelola direktori mitra vendor (Hotel & Resort, Armada Transportasi & Kapal Phinisi, Maskapai, serta Vendor Perlengkapan) terintegrasi dengan pembukuan pengeluaran operasional trip.',
    actions: `<button class="btn btn-outline" id="s-exp">${icon('download')} Unduh Rekap (.csv)</button><button class="btn btn-dark" id="s-add">${icon('plus-circle')} Tambah Supplier Baru</button>` }).replace('class="page-head"', 'class="page-head" style="margin:0"')}</div>
    <div class="stats" id="s-stats"></div><div class="card mt-6"><div class="filters"><div class="input-icon">${icon('search')}<input class="input" id="sq" placeholder="Cari nama vendor, kode, PIC, wilayah..."></div><div class="pills" id="sp"></div>
    <select class="select" id="ss">${opts(['Aktif', 'Nonaktif'], '', 'Semua Status Operasional')}</select></div><div id="s-table" style="border-top:1px solid var(--divider)"></div></div>
    <div class="grid-2 mt-6"><div class="card"><div class="card-head"><h3>${icon('refresh')} Alur Pembayaran Vendor & Rekonsiliasi</h3></div><div class="card-body small ink2">Setiap pengeluaran ke supplier dicatat lewat tombol <b>Catat Bayar</b> dan otomatis masuk ke <b>Buku Kas</b> kategori <b>Supplier</b>, terhubung ke data vendor.
      <div class="grid-2 mt-4" style="grid-template-columns:repeat(3,1fr)">${[['01', 'Penerbitan PO', 'PIC trip mengajukan alokasi armada/hotel.'], ['02', 'Verifikasi Invoice', 'Admin cek kecocokan manifest & tarif.'], ['03', 'Disbursement', 'Transfer & catat di sistem.']].map(([n, t, d]) => `<div class="inner"><div class="label-xs c-primary">Langkah ${n}</div><div class="bold mt-1" style="color:var(--ink)">${t}</div><div class="xs mt-1">${d}</div></div>`).join('')}</div></div></div>
    <div class="card"><div class="card-head"><h3>${icon('calendar')} MOU Mendekati Jatuh Tempo (H-60)</h3></div><div class="card-body" id="s-mou"></div></div></div>`;
  let all = [], stats;
  const draw = () => {
    const rows = all.filter(s => (!st.q || (s.nama + s.kode + s.pic + s.wilayah + s.layanan).toLowerCase().includes(st.q.toLowerCase())) && (!st.jenis || s.jenis === st.jenis) && (!st.status || s.status === st.status));
    $('#sp').innerHTML = [['', 'Semua Kategori', all.length], ...SUP_JENIS.filter(j => stats.per_jenis[j]).map(j => [j, j, stats.per_jenis[j]])].map(([v, l, n]) => `<button class="pill ${st.jenis === v ? 'on' : ''}" data-j="${v}">${l} <span class="count">(${n})</span></button>`).join('');
    $$('#sp [data-j]').forEach(b => b.onclick = () => { st.jenis = b.dataset.j; draw(); });
    $('#s-table').innerHTML = `<div class="row-between" style="padding:12px 20px"><span class="small"><b>Direktori Rekanan Terjadwal</b> <span class="tag-mono">${rows.length} Supplier</span></span><span class="small ink2 hide-sm">Pengeluaran dihitung dari Buku Kas</span></div>` +
      (rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Nama Vendor & Kode</th><th>Kategori Mitra</th><th>Kontak PIC & Rekening</th><th>Layanan / Alokasi</th><th class="num">Pengeluaran</th><th>Status MOU</th><th></th></tr></thead><tbody>
      ${rows.map(s => `<tr class="${s.status === 'Nonaktif' ? 'muted-row' : ''}"><td><div class="bold">${esc(s.nama)}</div><div class="row mt-1"><span class="tag-mono">${esc(s.kode)}</span><span class="sub">${esc(s.wilayah || '')}</span></div></td>
        <td>${chip(s.jenis, 'primary', SUP_IC[s.jenis])}</td><td class="small"><div>${esc(s.pic || '-')}</div><div class="mono sub">${esc(s.kontak || '')}</div><div class="mono sub">${esc(s.rekening || '')}</div></td>
        <td class="small" style="max-width:200px">${esc(s.layanan || '-')}</td><td class="num"><div class="bold">${rp(s.total_pengeluaran)}</div><div class="sub">Bln ini: ${rpShort(s.pengeluaran_bulan_ini)}</div></td>
        <td>${s.mou_sisa_hari !== null && s.mou_sisa_hari <= 60 ? chip(s.mou_sisa_hari < 0 ? 'MOU Kedaluwarsa' : 'Perlu Perpanjangan', 'danger', 'alert') : chip(s.status_mou || 'Kontrak Aktif', s.status === 'Aktif' ? 'success' : 'neutral')}${s.mou_sampai ? `<div class="sub">s/d ${tgl(s.mou_sampai)}</div>` : ''}</td>
        <td class="nowrap right"><button class="btn btn-secondary btn-xs" data-pay="${s.id}">${icon('banknote', 'ic-sm')} Catat Bayar</button> <button class="btn btn-ghost btn-icon btn-sm" data-ed="${s.id}">${icon('edit')}</button><button class="btn btn-ghost btn-icon btn-sm" data-del="${s.id}">${icon('trash')}</button></td></tr>`).join('')}
      </tbody></table></div>` : emptyView('Tidak ada supplier yang cocok.', 'building'));
    $$('[data-ed]').forEach(b => b.onclick = () => supplierForm(all.find(s => s.id === b.dataset.ed), load));
    $$('[data-pay]').forEach(b => b.onclick = () => { const s = all.find(x => x.id === b.dataset.pay); trxForm({ jenis: 'Pengeluaran', kategori: 'Supplier', id_supplier: s.id, keterangan: 'Pembayaran ' + s.nama }, null, load); });
    $$('[data-del]').forEach(b => b.onclick = async () => {
      const s = all.find(x => x.id === b.dataset.del);
      if (!await confirmDialog({ title: 'Hapus supplier?', message: `<b>${esc(s.nama)}</b> akan ditandai terhapus. Riwayat transaksi tetap tersimpan.`, danger: true, confirmText: 'Hapus' })) return;
      try { await API.call('deleteSupplier', { id: s.id }); toast('Supplier dihapus.'); load(); } catch (e) { toast(e.message, 'error'); }
    });
  };
  const load = async () => {
    $('#s-table').innerHTML = loadingView();
    const r = await API.call('listSuppliers', {});
    if (!c.alive()) return;
    all = r.rows; stats = r.stats;
    $('#sup-count').innerHTML = `<span class="dot" style="color:var(--danger)"></span> ${stats.aktif} Vendor Aktif`;
    const pj = stats.per_jenis;
    $('#s-stats').innerHTML = statCard({ label: 'Kapasitas mitra · total supplier aktif', value: stats.aktif, unit: 'Vendor', ic: 'building', foot: `<span class="row wrap">${SUP_JENIS.filter(j => pj[j]).map(j => `<span class="chip chip-neutral">${pj[j]} ${j}</span>`).join('')}</span>` }) +
      statCard({ label: 'Arus kas keluar · realisasi beban bulan ini', value: rp(stats.beban_bulan_ini), money: true, ic: 'trending-up', foot: '<a href="#/transactions?jenis=Pengeluaran&kategori=Supplier">Lihat transaksi ' + icon('arrow-right', 'ic-sm') + '</a>' }) +
      statCard({ label: 'Legalitas · MOU perlu review', value: stats.mou_review, unit: 'Kontrak', ic: 'shield-check', foot: `<span>${stats.total - stats.mou_review} kontrak aman</span>` }) +
      statCard({ label: 'Total rekanan terdaftar', value: stats.total, unit: 'Supplier', ic: 'users', foot: `<span>${stats.total - stats.aktif} nonaktif</span>` });
    const due = all.filter(s => s.mou_sisa_hari !== null && s.mou_sisa_hari <= 60).sort((a, b) => a.mou_sisa_hari - b.mou_sisa_hari);
    $('#s-mou').innerHTML = due.length ? due.map(s => `<div class="feed-item"><div class="row"><div class="datebox"><div class="m">${BULAN[parseYmd(s.mou_sampai).getMonth()]}</div><div class="d">${parseYmd(s.mou_sampai).getDate()}</div></div><div><div class="bold">${esc(s.nama)}</div><div class="xs ink2">${s.mou_sisa_hari < 0 ? 'Kedaluwarsa ' + Math.abs(s.mou_sisa_hari) + ' hari lalu' : 'Tersisa ' + s.mou_sisa_hari + ' hari'}</div></div></div><button class="btn btn-dark btn-xs" data-ed2="${s.id}">Perbarui</button></div>`).join('') : emptyView('Semua MOU masih berlaku > 60 hari.', 'check-circle');
    $$('[data-ed2]').forEach(b => b.onclick = () => supplierForm(all.find(s => s.id === b.dataset.ed2), load));
    draw();
  };
  $('#sq').oninput = debounce(e => { st.q = e.target.value.trim(); draw(); }, 200);
  $('#ss').onchange = e => { st.status = e.target.value; draw(); };
  $('#s-add').onclick = () => supplierForm({}, load);
  $('#s-exp').onclick = () => downloadCsv('Supplier_' + today() + '.csv', [['Kode', 'Nama', 'Jenis', 'PIC', 'Kontak', 'Email', 'Rekening', 'Wilayah', 'Layanan', 'Status MOU', 'MOU Sampai', 'Total Pengeluaran', 'Status'],
    ...all.map(s => [s.kode, s.nama, s.jenis, s.pic, s.kontak, s.email, s.rekening, s.wilayah, s.layanan, s.status_mou, s.mou_sampai, s.total_pengeluaran, s.status])]);
  await load();
};
function supplierForm(s, onSaved) {
  const m = modal({ title: s.id ? 'Ubah Data Supplier' : 'Tambah Supplier Baru', sub: s.id ? `<span class="mono">${esc(s.kode)}</span>` : 'Kode supplier dibuat otomatis', size: 'lg',
    body: `<form id="sf" class="form-grid" novalidate>
      ${field('Nama Vendor / Perusahaan', `<input class="input" name="nama" required value="${esc(s.nama || '')}">`, { req: true, cls: 'c-8' })}
      ${field('Kategori Mitra', `<select class="select" name="jenis">${opts(SUP_JENIS, s.jenis || 'Hotel')}</select>`, { cls: 'c-4' })}
      ${field('Nama PIC', `<input class="input" name="pic" value="${esc(s.pic || '')}">`, { cls: 'c-4' })}
      ${field('Telepon / WhatsApp', `<input class="input mono" name="kontak" value="${esc(s.kontak || '')}">`, { cls: 'c-4' })}
      ${field('Email', `<input class="input" type="email" name="email" value="${esc(s.email || '')}">`, { cls: 'c-4' })}
      ${field('Rekening Pembayaran', `<input class="input mono" name="rekening" value="${esc(s.rekening || '')}" placeholder="BCA 8820-119-001 a/n ...">`, { cls: 'c-6' })}
      ${field('Wilayah Operasi', `<input class="input" name="wilayah" value="${esc(s.wilayah || '')}" placeholder="Labuan Bajo, NTT">`, { cls: 'c-6' })}
      ${field('Layanan / Alokasi Trip', `<input class="input" name="layanan" value="${esc(s.layanan || '')}" placeholder="KM Navigasi Bahari I & II — Liveaboard Labuan Bajo">`)}
      ${field('Status MOU', `<select class="select" name="status_mou">${opts(['Kontrak Aktif', 'Draft MOU', 'Perlu Perpanjangan', 'Tanpa Kontrak'], s.status_mou || 'Kontrak Aktif')}</select>`, { cls: 'c-4' })}
      ${field('MOU Berlaku Sampai', `<input class="input" type="date" name="mou_sampai" value="${esc(s.mou_sampai || '')}">`, { cls: 'c-4' })}
      ${field('Status Operasional', `<select class="select" name="status">${opts(['Aktif', 'Nonaktif'], s.status || 'Aktif')}</select>`, { cls: 'c-4' })}
      ${field('Alamat', `<input class="input" name="alamat" value="${esc(s.alamat || '')}">`)}
      ${field('Catatan', `<textarea class="textarea" name="catatan" rows="2">${esc(s.catatan || '')}</textarea>`)}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="sf-save">Simpan Supplier</button>' });
  m.$('#sf-save').onclick = e => {
    const f = m.$('#sf'); if (!validate(f)) return;
    const d = formData(f); if (s.id) d.id = s.id;
    withBusy(e.currentTarget, async () => { try { await API.call('saveSupplier', d); toast('Supplier tersimpan.'); m.close(); onSaved(); } catch (err) { toast(err.message, 'error'); } });
  };
}

/* ======================= PAYROLL ======================= */
Pages.payroll = async (c) => {
  const st = { periode: c.query.periode || today().slice(0, 7), q: '' };
  c.view.innerHTML = `<div class="callout" style="margin-bottom:20px"><div class="ic-wrap">${icon('clock')}</div><div><b>Siklus Payroll</b><div class="small ink2 mt-1">Payroll berstatus <b>Draft</b> dapat diubah. Setelah <b>Final</b>, gaji tercatat otomatis sebagai pengeluaran kategori Gaji di Buku Kas dan slip dapat dilihat karyawan. Membuka kunci payroll Final wajib disertai alasan dan tercatat di Log Aktivitas.</div></div></div>
  ${pageHead({ over: 'Administrasi / <b>Payroll & Penggajian</b>', title: 'Payroll & Penggajian Karyawan', badges: `<span class="chip chip-primary">AKSES KHUSUS ADMIN</span>`,
    desc: 'Hitung gaji bersih (Gaji Pokok + Tunjangan + Bonus/Komisi − Potongan), finalkan, dan cetak slip gaji digital.',
    actions: `<input class="input" type="month" id="per" value="${st.periode}" style="width:auto"><button class="btn btn-outline" id="p-exp">${icon('download')} Unduh Rekap (.csv)</button><span id="p-acts" class="row wrap"></span>` })}
  <div class="stats" id="p-stats"></div>
  <div class="card mt-6"><div class="card-head"><div><h3>${icon('calculator')} Rincian Komponen Payroll Staf & Tour Leader</h3><div class="sub" id="p-sub"></div></div><div class="input-icon" style="width:260px">${icon('search')}<input class="input" id="pq" placeholder="Cari karyawan..."></div></div><div id="p-table"></div></div>
  <div class="grid-2 mt-6"><div class="card"><div class="card-head"><h3>${icon('calculator')} Formula & Ketentuan Standar Penggajian</h3><span class="chip chip-neutral">v1.0 Live</span></div><div class="card-body">
    <div class="inner row-between"><span class="label-xs">Rumus perhitungan</span><span class="mono c-primary bold">Gaji Bersih = Pokok + Tunjangan + Bonus − Potongan</span></div>
    <div class="grid-2 mt-4"><div class="inner small"><div class="bold row">${icon('shield-check', 'ic-sm')} Audit Hak Akses (RBAC)</div><div class="ink2 mt-1">Karyawan hanya dapat melihat slip miliknya di menu <i>Slip Gaji Saya</i>. Data payroll terkunci khusus Admin di server.</div></div>
      <div class="inner small"><div class="bold row">${icon('folder', 'ic-sm')} Arsip Cloud</div><div class="ink2 mt-1">PDF slip otomatis diarsipkan ke folder Drive <span class="mono">/Slip Gaji (PDF)/</span> saat diunduh.</div></div></div>
    <div class="label-xs mt-4">Tahapan penyaluran gaji bulan ini</div><div class="stepper mt-2">${[['1. Generate & Tinjau', 'Buat draft untuk semua karyawan aktif'], ['2. Finalisasi Admin', 'Kunci data & posting ke Buku Kas'], ['3. Transfer & Slip', 'Transfer & bagikan slip PDF']].map(([a, b]) => `<div class="step" style="padding:10px 12px"><div class="grow"><div class="bold small">${a}</div><div class="xs ink2">${b}</div></div></div>`).join('')}</div></div></div>
  <div class="card"><div class="card-head"><h3>${icon('chart')} Komposisi Beban Payroll</h3></div><div class="card-body" id="p-comp"></div></div></div>`;
  let data;
  const load = async () => {
    App.setQuery({ periode: st.periode });
    $('#p-table').innerHTML = loadingView();
    const r = data = await API.call('listPayroll', { periode: st.periode });
    if (!c.alive()) return;
    const s = r.stats, n = r.rows.length;
    const diff = s.prev_total ? Math.round((s.total - s.prev_total) / s.prev_total * 1000) / 10 : null;
    $('#p-sub').textContent = `Periode ${bulanLabel(st.periode)} • ${n} karyawan`;
    $('#p-acts').innerHTML = (s.belum_dibuat ? `<button class="btn btn-secondary" id="p-gen">${icon('plus')} Generate Draft (${s.belum_dibuat})</button>` : '') +
      (s.draft ? `<button class="btn btn-primary" id="p-fin">${icon('lock')} Proses & Finalkan (${s.draft})</button>` : '');
    $('#p-stats').innerHTML = statCard({ label: 'Total beban payroll', value: rp(s.total), money: true, ic: 'banknote', foot: diff === null ? `<span>${n} karyawan</span>` : `${chip((diff >= 0 ? '+' : '') + diff + '%', diff > 0 ? 'warn' : 'success')}<span class="mono">vs ${rpShort(s.prev_total)}</span>` }) +
      statCard({ label: 'Status verifikasi batch', value: s.final, unit: '/ ' + n + ' Final', ic: 'check-circle', extra: progress(n ? s.final / n * 100 : 0), foot: `<span>${s.draft} masih Draft</span>${s.belum_dibuat ? `<span class="c-danger">${s.belum_dibuat} belum dibuat</span>` : ''}` }) +
      statCard({ label: 'Rata-rata gaji bersih (THP)', value: rp(s.rata), money: true, ic: 'calculator', foot: '<span>Formula pokok + tunjangan + bonus − potongan</span>' }) +
      statCard({ label: 'Disbursement buku kas', value: s.final ? 'Tercatat' : 'Menunggu', ic: 'landmark', foot: `<span>${s.final} posting kategori Gaji</span><a href="#/transactions?kategori=Gaji&jenis=Pengeluaran" class="small">Lihat ${icon('arrow-right', 'ic-sm')}</a>` });
    const tot = s.pokok + s.tunjangan + s.bonus + s.potongan || 1;
    $('#p-comp').innerHTML = [['Gaji Pokok', s.pokok, '#6B5B4B'], ['Tunjangan', s.tunjangan, '#E8D7C9'], ['Bonus / Insentif Trip', s.bonus, '#E8731A'], ['Potongan', s.potongan, '#B5371F']].map(([l, v, col]) =>
      `<div class="hbar"><div class="meta"><span><span class="dot" style="color:${col}"></span> ${l}</span><span class="mono">${rp(v)}</span></div><div class="progress"><span style="width:${v / tot * 100}%;background:${col}"></span></div></div>`).join('');
    draw();
    if ($('#p-gen')) $('#p-gen').onclick = e => withBusy(e.currentTarget, async () => { try { const x = await API.call('generatePayroll', { periode: st.periode }); toast(x.dibuat + ' draft payroll dibuat.'); load(); } catch (err) { toast(err.message, 'error'); } });
    if ($('#p-fin')) $('#p-fin').onclick = async () => {
      const ids = data.rows.filter(p => p.status === 'Draft').map(p => p.id);
      const tot2 = data.rows.filter(p => p.status === 'Draft').reduce((a, p) => a + p.gaji_bersih, 0);
      if (!await confirmDialog({ title: 'Finalkan payroll ' + bulanLabel(st.periode) + '?', message: `${ids.length} payroll senilai <b>${rp(tot2)}</b> akan dikunci dan dicatat sebagai pengeluaran Gaji di Buku Kas. Slip langsung dapat dilihat karyawan.`, confirmText: 'Finalkan Sekarang' })) return;
      try { const x = await API.call('finalizePayroll', { ids }); toast(x.difinalkan + ' payroll difinalkan.'); load(); } catch (err) { toast(err.message, 'error'); }
    };
  };
  const draw = () => {
    const rows = data.rows.filter(p => !st.q || (p.nama + p.kode + p.jabatan).toLowerCase().includes(st.q.toLowerCase()));
    const sum = k => rows.reduce((a, p) => a + p[k], 0);
    $('#p-table').innerHTML = rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan & Jabatan</th><th class="num">Gaji Pokok</th><th class="num">Tunjangan</th><th class="num">Bonus & Insentif</th><th class="num">Potongan</th><th class="num">Take Home Pay</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(p => `<tr><td><div class="row">${avatar(p.nama, 'sm')}<div><div class="bold">${esc(p.nama)}</div><div class="sub">${esc(p.jabatan)}</div><div class="sub mono">NIK: ${esc(p.kode)}</div></div></div></td>
        <td class="num">${rp(p.gaji_pokok)}</td><td class="num">${rp(p.tunjangan)}</td><td class="num">${rp(p.bonus)}</td><td class="num ${p.potongan ? 'c-danger' : 'muted'}">${rp(p.potongan)}${p.keterangan ? `<div class="sub" style="font-family:var(--font)">${esc(p.keterangan.slice(0, 30))}</div>` : ''}</td>
        <td class="num bold c-primary" style="font-size:15px">${rp(p.gaji_bersih)}</td><td>${p.status === 'Final' ? chip('FINAL', 'success', 'lock') : chip('DRAFT', 'warn')}</td>
        <td class="nowrap right">${p.status === 'Draft' ? `<button class="btn btn-secondary btn-xs" data-ed="${p.id}">${icon('edit', 'ic-sm')} Ubah</button> <button class="btn btn-ghost btn-xs" data-f1="${p.id}">${icon('lock', 'ic-sm')} Finalkan</button>`
          : `<button class="btn btn-ghost btn-icon btn-sm" data-slip="${p.id}" title="Lihat slip">${icon('eye')}</button><button class="btn btn-ghost btn-icon btn-sm" data-pdf="${p.id}" title="Unduh PDF">${icon('download')}</button><button class="btn btn-ghost btn-icon btn-sm" data-ul="${p.id}" title="Buka kunci">${icon('unlock')}</button>`}</td></tr>`).join('')}
      </tbody><tfoot><tr><td>Subtotal (${rows.length} Karyawan)</td><td class="num">${rp(sum('gaji_pokok'))}</td><td class="num">${rp(sum('tunjangan'))}</td><td class="num">${rp(sum('bonus'))}</td><td class="num c-danger">${rp(sum('potongan'))}</td><td class="num c-primary">${rp(sum('gaji_bersih'))}</td><td colspan="2"></td></tr></tfoot></table></div>`
      : emptyView(data.stats.belum_dibuat ? `Belum ada payroll untuk ${bulanLabel(st.periode)}. Klik <b>Generate Draft</b> untuk membuat dari data karyawan aktif.` : 'Tidak ada data.', 'wallet');
    $$('[data-ed]').forEach(b => b.onclick = () => payrollForm(data.rows.find(p => p.id === b.dataset.ed), load));
    $$('[data-f1]').forEach(b => b.onclick = async () => {
      const p = data.rows.find(x => x.id === b.dataset.f1);
      if (!await confirmDialog({ title: 'Finalkan payroll ' + esc(p.nama) + '?', message: `Gaji bersih ${rp(p.gaji_bersih)} akan dikunci & dicatat di Buku Kas.`, confirmText: 'Finalkan' })) return;
      try { await API.call('finalizePayroll', { ids: [p.id] }); toast('Payroll difinalkan.'); load(); } catch (e) { toast(e.message, 'error'); }
    });
    $$('[data-ul]').forEach(b => b.onclick = async () => {
      const alasan = await confirmDialog({ title: 'Buka kunci payroll Final?', message: 'Status kembali menjadi Draft dan transaksi Gaji di Buku Kas dibatalkan. Tindakan ini tercatat di Log Aktivitas.', confirmText: 'Buka Kunci', danger: true, input: { label: 'Alasan membuka kunci', required: true } });
      if (!alasan) return;
      try { await API.call('unlockPayroll', { id: b.dataset.ul, alasan }); toast('Payroll dibuka kembali (Draft).'); load(); } catch (e) { toast(e.message, 'error'); }
    });
    bindSlipButtons($('#p-table'));
  };
  $('#per').onchange = e => { if (e.target.value) { st.periode = e.target.value; load(); } };
  $('#pq').oninput = debounce(e => { st.q = e.target.value.trim(); if (data) draw(); }, 200);
  $('#p-exp').onclick = () => data && downloadCsv('Payroll_' + st.periode + '.csv', [['Periode', 'NIK', 'Nama', 'Jabatan', 'Bank', 'Rekening', 'Gaji Pokok', 'Tunjangan', 'Bonus', 'Potongan', 'Gaji Bersih', 'Status', 'Keterangan'],
    ...data.rows.map(p => [p.periode, p.kode, p.nama, p.jabatan, p.bank, p.rekening, p.gaji_pokok, p.tunjangan, p.bonus, p.potongan, p.gaji_bersih, p.status, p.keterangan])]);
  await load();
};
function payrollForm(p, onSaved) {
  const m = modal({ title: 'Ubah Komponen Payroll', sub: `${esc(p.nama)} • ${bulanLabel(p.periode)}`,
    body: `<form id="pf" class="form-grid" novalidate>
      ${field('Gaji Pokok', moneyInput('gaji_pokok', p.gaji_pokok), { cls: 'c-6' })}
      ${field('Tunjangan (transport, makan, komunikasi)', moneyInput('tunjangan', p.tunjangan), { cls: 'c-6' })}
      ${field('Bonus / Komisi / Insentif Trip', moneyInput('bonus', p.bonus), { cls: 'c-6' })}
      ${field('Potongan (kasbon, PPh, BPJS)', moneyInput('potongan', p.potongan), { cls: 'c-6' })}
      ${field('Keterangan', `<input class="input" name="keterangan" value="${esc(p.keterangan || '')}" placeholder="Fee 4 batch liveaboard; kasbon angs. 1/3">`)}
      <div class="c-12 total-box row-between"><span class="label-xs">Gaji bersih (take home pay)</span><span class="big" id="net">${rp(p.gaji_bersih)}</span></div></form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="pf-save">Simpan Draft</button>' });
  bindMoney(m.el);
  const f = m.$('#pf');
  const calc = () => { const d = formData(f); const n = moneyVal(d.gaji_pokok) + moneyVal(d.tunjangan) + moneyVal(d.bonus) - moneyVal(d.potongan); m.$('#net').textContent = rp(n); m.$('#net').style.color = n < 0 ? 'var(--danger)' : ''; };
  m.$$('[data-money]').forEach(el => el.addEventListener('input', calc));
  m.$('#pf-save').onclick = e => {
    const d = formData(f);
    ['gaji_pokok', 'tunjangan', 'bonus', 'potongan'].forEach(k => d[k] = moneyVal(d[k]));
    d.id = p.id;
    withBusy(e.currentTarget, async () => { try { await API.call('savePayroll', d); toast('Payroll tersimpan.'); m.close(); onSaved(); } catch (err) { toast(err.message, 'error'); } });
  };
}

/* ======================= KARYAWAN ======================= */
const DIVISI = ['Operasional', 'Lapangan', 'Keuangan', 'Marketing', 'Reservasi', 'Lainnya'];
Pages.employees = async (c) => {
  const st = { q: '', status_kerja: '', divisi: '' };
  c.view.innerHTML = pageHead({ over: 'Administrasi / <b>Data Karyawan & Kontrak</b>', title: 'Data Karyawan & Kontrak Kerja',
    badges: '<span class="chip chip-danger"><span class="dot"></span>Akses Khusus Admin</span>',
    desc: 'Kelola master profil karyawan, penugasan divisi, status perjanjian kerja (PKWT/PKWTT/Freelance), arsip dokumen kontrak Google Drive, dan rekening payroll.',
    actions: `<button class="btn btn-outline" id="e-exp">${icon('download')} Unduh Direktori (.csv)</button><button class="btn btn-primary" id="e-add">${icon('user-plus')} Tambah Karyawan Baru</button>` }) +
    `<div class="stats" id="e-stats"></div><div class="card mt-6"><div class="filters"><div class="input-icon">${icon('search')}<input class="input" id="eq" placeholder="Cari nama karyawan, NIK, jabatan, email..."></div>
      <div class="pills" id="ep"></div><select class="select" id="ek">${opts(['PKWTT', 'PKWT', 'Freelance'], '', 'Semua Status Kontrak')}</select></div><div id="e-table" style="border-top:1px solid var(--divider)"></div></div>
    <div class="grid-2 mt-6"><div class="card"><div class="card-head"><h3>${icon('folder')} Integrasi Cloud Drive & Legalitas Dokumen</h3><span class="chip chip-success">Privat</span></div><div class="card-body"><div class="grid-2" style="grid-template-columns:repeat(3,1fr)">
      ${[['1', 'Auto-Arsip Kontrak', 'Berkas kontrak diunggah ke folder Drive privat /Travelpedia/Karyawan/.'], ['2', 'Strict RBAC Privacy', 'Hanya Admin yang dapat membuka dokumen sensitif (gaji, KTP, kontrak).'], ['3', 'Audit Otomatis H-60', 'Kontrak PKWT/Freelance yang berakhir ≤ 60 hari ditandai otomatis.']].map(([n, t, d]) => `<div class="inner"><span class="section-num" style="width:22px;height:22px;font-size:11px">${n}</span><div class="bold small mt-2">${t}</div><div class="xs ink2 mt-1">${d}</div></div>`).join('')}</div></div></div>
    <div class="card"><div class="card-head"><h3>${icon('clock')} Mendekati Jatuh Tempo (H-60)</h3></div><div class="card-body" id="e-due"></div></div></div>`;
  let all = [], users = [];
  const draw = () => {
    const rows = all.filter(e => (!st.q || (e.nama + e.kode + e.jabatan + e.email + e.divisi).toLowerCase().includes(st.q.toLowerCase())) && (!st.status_kerja || e.status_kerja === st.status_kerja) && (!st.divisi || e.divisi === st.divisi));
    const divs = [...new Set(all.map(e => e.divisi))];
    $('#ep').innerHTML = [['', 'Semua Karyawan', all.length], ...divs.map(d => [d, d, all.filter(e => e.divisi === d).length])].map(([v, l, n]) => `<button class="pill ${st.divisi === v ? 'on' : ''}" data-d="${v}">${l} <span class="count">(${n})</span></button>`).join('');
    $$('#ep [data-d]').forEach(b => b.onclick = () => { st.divisi = b.dataset.d; draw(); });
    $('#e-table').innerHTML = rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan & NIK</th><th>Jabatan & Divisi</th><th>Status Hubungan Kerja</th><th>Masa Berlaku & Bergabung</th><th class="num">Gaji Pokok & Rekening</th><th>Dokumen Kontrak (Drive)</th><th></th></tr></thead><tbody>
      ${rows.map(e => { const k = e.kontrak_sisa_hari; const warn = k !== null && k <= 60;
        return `<tr class="${e.status === 'Nonaktif' ? 'muted-row' : ''}"><td><div class="row">${avatar(e.nama)}<div><div class="bold">${esc(e.nama)} <span class="dot" style="color:${e.status === 'Aktif' ? (warn ? 'var(--warning)' : 'var(--success)') : 'var(--muted)'}"></span></div><div class="sub mono c-primary">${esc(e.kode)}</div><div class="sub">${esc(e.email || (e.akun ? e.akun.email : ''))}</div></div></div></td>
        <td><div style="font-weight:500">${esc(e.jabatan)}</div><div class="sub">${esc(e.divisi)}</div>${e.akun ? `<div class="mt-1">${chip('Akun: ' + e.akun.peran, 'info')}</div>` : ''}</td>
        <td>${chip(e.status_kerja + (e.status_kerja === 'PKWTT' ? ' (Tetap)' : e.status_kerja === 'PKWT' ? ' (Kontrak)' : ' Mitra'), e.status_kerja === 'PKWTT' ? 'success' : e.status_kerja === 'PKWT' ? 'warn' : 'info')}</td>
        <td class="small"><div>${tgl(e.tanggal_masuk)}</div>${e.kontrak_sampai ? (warn ? `<div class="mt-1">${chip(k < 0 ? 'Berakhir ' + Math.abs(k) + ' hari lalu' : 'Sisa ' + k + ' hari', 'danger', 'alert')}</div><div class="sub">s/d ${tgl(e.kontrak_sampai)}</div>` : `<div class="sub row">${icon('calendar', 'ic-sm')} Hingga ${tgl(e.kontrak_sampai)}</div>`) : '<div class="sub c-success">∞ Permanen</div>'}</td>
        <td class="num"><div class="bold">${rp(e.gaji_pokok)}</div><div class="sub">${esc(e.bank)} ${esc(e.rekening)}</div></td>
        <td>${e.berkas.length ? e.berkas.map(f => `<button class="btn btn-secondary btn-xs" data-view="${f.id}">${icon('file', 'ic-sm')} ${esc(f.name.slice(0, 20))}</button>`).join(' ') : `<button class="btn btn-outline btn-xs" data-up="${e.id}">${icon('upload', 'ic-sm')} Unggah</button>`}</td>
        <td class="nowrap"><button class="btn btn-ghost btn-icon btn-sm" data-ed="${e.id}">${icon('edit')}</button>${e.berkas.length ? `<button class="btn btn-ghost btn-icon btn-sm" data-up="${e.id}" title="Unggah berkas lain">${icon('upload')}</button>` : ''}<button class="btn btn-ghost btn-icon btn-sm" data-del="${e.id}">${icon('trash')}</button></td></tr>`; }).join('')}
      </tbody></table></div>` : emptyView('Tidak ada karyawan yang cocok.', 'idcard');
    $$('[data-view]').forEach(b => b.onclick = () => viewFile(b.dataset.view, b));
    $$('[data-ed]').forEach(b => b.onclick = () => employeeForm(all.find(e => e.id === b.dataset.ed), users, load));
    $$('[data-up]').forEach(b => b.onclick = async () => {
      const ff = await pickFile(); if (!ff) return;
      withBusy(b, async () => { try { await API.call('uploadEmployeeFile', { id: b.dataset.up, jenis: 'Kontrak', file: { name: ff.name, mime: ff.mime, base64: ff.base64 } }); toast('Dokumen kontrak tersimpan di Drive.'); load(); } catch (e) { toast(e.message, 'error'); } });
    });
    $$('[data-del]').forEach(b => b.onclick = async () => {
      const e = all.find(x => x.id === b.dataset.del);
      if (!await confirmDialog({ title: 'Hapus karyawan?', message: `<b>${esc(e.nama)}</b> akan ditandai terhapus. Riwayat payroll tetap tersimpan.`, danger: true, confirmText: 'Hapus' })) return;
      try { await API.call('deleteEmployee', { id: e.id }); toast('Karyawan dihapus.'); load(); } catch (err) { toast(err.message, 'error'); }
    });
  };
  const load = async () => {
    $('#e-table').innerHTML = loadingView();
    const r = await API.call('listEmployees', {});
    if (!c.alive()) return;
    all = r.rows; users = r.users;
    const s = r.stats;
    $('#e-stats').innerHTML = statCard({ label: 'Total personil terdaftar', value: s.total, unit: 'Karyawan', ic: 'users', foot: `<span>Beban gaji pokok ${rpShort(s.beban_gaji)}/bln</span>` }) +
      statCard({ label: 'Status perjanjian kerja', value: 3, unit: 'Kategori Legal', ic: 'file-text', extra: `<div class="grid-2" style="grid-template-columns:repeat(3,1fr);gap:6px">${[['PKWTT', s.pkwtt], ['PKWT', s.pkwt], ['Mitra', s.freelance]].map(([l, n]) => `<div class="inner center" style="padding:6px"><div class="bold">${n}</div><div class="xs ink2">${l}</div></div>`).join('')}</div>` }) +
      statCard({ label: 'Kontrak jatuh tempo', value: `<span class="${s.jatuh_tempo ? 'c-danger' : ''}">${s.jatuh_tempo}</span>`, unit: 'Perlu Adendum', ic: 'bell', foot: chip('Perhatian HR (H-60)', 'warn') }) +
      statCard({ label: 'Arsip digital Google Drive', value: `${s.berkas}/${all.length}`, unit: 'Terarsip', ic: 'folder', foot: '<span>/Travelpedia/Karyawan</span>' });
    const due = all.filter(e => e.kontrak_sisa_hari !== null && e.kontrak_sisa_hari <= 60 && e.status === 'Aktif').sort((a, b) => a.kontrak_sisa_hari - b.kontrak_sisa_hari);
    $('#e-due').innerHTML = due.length ? due.map(e => `<div class="feed-item"><div><div class="bold">${esc(e.nama)} <span class="mono xs ink2">(${esc(e.kode)})</span></div><div class="small c-danger">${esc(e.status_kerja)} berakhir: ${tgl(e.kontrak_sampai)} (${e.kontrak_sisa_hari < 0 ? 'lewat ' + Math.abs(e.kontrak_sisa_hari) : 'tersisa ' + e.kontrak_sisa_hari} hari)</div><div class="xs ink2">${esc(e.jabatan)}</div></div><button class="btn btn-primary btn-xs" data-ad="${e.id}">Perbarui Adendum</button></div>`).join('') : emptyView('Tidak ada kontrak yang mendekati jatuh tempo.', 'check-circle');
    $$('[data-ad]').forEach(b => b.onclick = () => employeeForm(all.find(e => e.id === b.dataset.ad), users, load));
    draw();
  };
  $('#eq').oninput = debounce(e => { st.q = e.target.value.trim(); draw(); }, 200);
  $('#ek').onchange = e => { st.status_kerja = e.target.value; draw(); };
  $('#e-add').onclick = () => employeeForm({}, users, load);
  $('#e-exp').onclick = () => downloadCsv('Direktori_Karyawan_' + today() + '.csv', [['NIK', 'Nama', 'Email', 'HP', 'Jabatan', 'Divisi', 'Status Kerja', 'Tgl Masuk', 'Kontrak Sampai', 'Gaji Pokok', 'Bank', 'Rekening', 'Status'],
    ...all.map(e => [e.kode, e.nama, e.email, e.hp, e.jabatan, e.divisi, e.status_kerja, e.tanggal_masuk, e.kontrak_sampai, e.gaji_pokok, e.bank, e.rekening, e.status])]);
  await load();
};
function employeeForm(e, users, onSaved) {
  const m = modal({ title: e.id ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru', sub: e.id ? `<span class="mono">${esc(e.kode)}</span>` : 'NIK karyawan (EMP-xxx) dibuat otomatis', size: 'lg',
    body: `<form id="ef" class="form-grid" novalidate>
      ${field('Nama Lengkap', `<input class="input" name="nama" required value="${esc(e.nama || '')}">`, { req: true, cls: 'c-6' })}
      ${field('Email', `<input class="input" type="email" name="email" value="${esc(e.email || '')}">`, { cls: 'c-6' })}
      ${field('Jabatan', `<input class="input" name="jabatan" required value="${esc(e.jabatan || '')}" placeholder="Senior Tour Leader">`, { req: true, cls: 'c-6' })}
      ${field('Divisi', `<select class="select" name="divisi">${opts(DIVISI, e.divisi || 'Operasional')}</select>`, { cls: 'c-3' })}
      ${field('No. HP', `<input class="input mono" name="hp" value="${esc(e.hp || '')}">`, { cls: 'c-3' })}
      ${field('Status Hubungan Kerja', `<select class="select" name="status_kerja">${opts([{ value: 'PKWTT', label: 'PKWTT (Tetap)' }, { value: 'PKWT', label: 'PKWT (Kontrak)' }, { value: 'Freelance', label: 'Freelance / Mitra' }], e.status_kerja || 'PKWT')}</select>`, { cls: 'c-4' })}
      ${field('Tanggal Bergabung', `<input class="input" type="date" name="tanggal_masuk" required value="${esc(e.tanggal_masuk || today())}">`, { req: true, cls: 'c-4' })}
      ${field('Kontrak Berlaku Sampai', `<input class="input" type="date" name="kontrak_sampai" value="${esc(e.kontrak_sampai || '')}">`, { cls: 'c-4', hint: 'Kosongkan untuk PKWTT (permanen).' })}
      ${field('Gaji Pokok', moneyInput('gaji_pokok', e.gaji_pokok), { cls: 'c-4' })}
      ${field('Bank', `<input class="input" name="bank" value="${esc(e.bank || '')}" placeholder="BCA">`, { cls: 'c-4' })}
      ${field('No. Rekening', `<input class="input mono" name="rekening" value="${esc(e.rekening || '')}">`, { cls: 'c-4' })}
      ${field('Tautkan Akun Login', `<select class="select" name="id_user">${opts(users.map(u => ({ value: u.id, label: u.nama + ' — ' + u.email })), e.id_user, '— Tidak ditautkan —')}</select>`, { cls: 'c-8', hint: 'Wajib ditautkan agar karyawan dapat melihat slip gaji di menu Slip Gaji Saya.' })}
      ${field('Status', `<select class="select" name="status">${opts(['Aktif', 'Nonaktif'], e.status || 'Aktif')}</select>`, { cls: 'c-4' })}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="ef-save">Simpan Karyawan</button>' });
  bindMoney(m.el);
  m.$('#ef-save').onclick = ev => {
    const f = m.$('#ef'); if (!validate(f)) return;
    const d = formData(f); d.gaji_pokok = moneyVal(d.gaji_pokok); if (e.id) d.id = e.id;
    withBusy(ev.currentTarget, async () => { try { await API.call('saveEmployee', d); toast('Data karyawan tersimpan.'); m.close(); onSaved(); } catch (err) { toast(err.message, 'error'); } });
  };
}

/* ======================= MANAJEMEN PENGGUNA ======================= */
Pages.users = async (c) => {
  const rows = await API.call('listUsers');
  if (!c.alive()) return;
  c.view.innerHTML = pageHead({ over: 'Administrasi / <b>Manajemen Pengguna</b>', title: 'Manajemen Pengguna', badges: `<span class="chip chip-neutral">${rows.length} Akun</span>`,
    desc: 'Hanya akun yang terdaftar di sini yang dapat login. Atur peran (Admin/Karyawan), aktifkan/nonaktifkan, dan reset kata sandi.',
    actions: `<button class="btn btn-primary" id="u-add">${icon('user-plus')} Tambah Pengguna</button>` }) +
    `<div class="grid-main"><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Karyawan Terkait</th><th>Login Terakhir</th><th></th></tr></thead><tbody>
    ${rows.map(u => `<tr class="${u.aktif ? '' : 'muted-row'}"><td><div class="row">${avatar(u.nama, 'sm')}<div><div class="bold">${esc(u.nama)} ${u.id === App.user.id ? chip('Anda', 'info') : ''}</div><div class="sub">${esc(u.email)}</div></div></div></td>
      <td>${chip(u.peran, u.peran === 'Admin' ? 'primary' : 'neutral', u.peran === 'Admin' ? 'shield' : 'user')}</td><td>${u.aktif ? chip('Aktif', 'success') : chip('Nonaktif', 'danger')}</td>
      <td class="small">${esc(u.karyawan || '—')}</td><td class="small mono">${esc(u.terakhir_login || 'Belum pernah')}</td>
      <td class="nowrap right"><button class="btn btn-ghost btn-sm" data-ed="${u.id}">${icon('edit', 'ic-sm')} Ubah</button><button class="btn btn-ghost btn-sm" data-rs="${u.id}">${icon('key', 'ic-sm')} Reset Sandi</button></td></tr>`).join('')}
    </tbody></table></div></div>
    <div class="card"><div class="card-head"><h3>${icon('shield-check')} Matriks Hak Akses</h3></div><div class="card-body small"><table class="table" style="font-size:12.5px"><thead><tr><th>Modul</th><th>Admin</th><th>Karyawan</th></tr></thead><tbody>
      ${[['Dashboard operasional', 'L', 'L'], ['Customer', 'LTUH', 'LTU'], ['Booking & Jadwal', 'LTUH', 'LTU'], ['Pembayaran customer', 'LTUH', 'LTU'], ['Trip & Harga', 'LTUH', 'L'], ['Supplier', 'LTUH', 'L'], ['Keuangan & Payroll', 'LTUH', '—'], ['Slip gaji', 'Semua', 'Milik sendiri'], ['Pengguna & Pengaturan', 'LTUH', '—'], ['Log aktivitas', 'L', '—']].map(r => `<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td></tr>`).join('')}
    </tbody></table><div class="xs ink2 mt-3">L=Lihat, T=Tambah, U=Ubah, H=Hapus. Divalidasi di server pada setiap permintaan.</div></div></div></div>`;
  $('#u-add').onclick = () => userForm({});
  $$('[data-ed]').forEach(b => b.onclick = () => userForm(rows.find(u => u.id === b.dataset.ed)));
  $$('[data-rs]').forEach(b => b.onclick = () => {
    const u = rows.find(x => x.id === b.dataset.rs);
    const pw = genPass();
    const m = modal({ title: 'Reset Kata Sandi', sub: esc(u.email), size: 'sm', body: field('Kata sandi baru', `<div class="row"><input class="input mono" id="np" value="${pw}"><button class="btn btn-outline btn-icon" id="cp" title="Salin">${icon('copy')}</button></div>`, { hint: 'Sampaikan ke pengguna secara pribadi. Sesi lama otomatis berakhir.' }),
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="rs">Reset Sandi</button>' });
    m.$('#cp').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(m.$('#np').value); toast('Disalin.', 'info'); };
    m.$('#rs').onclick = e => withBusy(e.currentTarget, async () => { try { await API.call('resetPassword', { id: u.id, password: m.$('#np').value }); toast('Kata sandi direset.'); m.close(); } catch (err) { toast(err.message, 'error'); } });
  });
};
function genPass() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let s = ''; const a = new Uint32Array(10); crypto.getRandomValues(a); a.forEach(n => s += c[n % c.length]); return 'Tp-' + s; }
function userForm(u) {
  const m = modal({ title: u.id ? 'Ubah Pengguna' : 'Tambah Pengguna', sub: u.id ? esc(u.email) : 'Akun baru langsung dapat login',
    body: `<form id="uf" class="form-grid" novalidate>
      ${field('Nama', `<input class="input" name="nama" required value="${esc(u.nama || '')}">`, { req: true })}
      ${field('Email (untuk login)', `<input class="input" type="email" name="email" required value="${esc(u.email || '')}">`, { req: true })}
      ${field('Peran', `<select class="select" name="peran">${opts(['Karyawan', 'Admin'], u.peran || 'Karyawan')}</select>`, { cls: 'c-6' })}
      <div class="c-6 field"><label>Status</label><label class="checkbox" style="height:40px"><input type="checkbox" name="aktif" ${u.id ? (u.aktif ? 'checked' : '') : 'checked'}> Akun aktif</label></div>
      ${u.id ? '' : field('Kata Sandi Awal', `<div class="row"><input class="input mono" name="password" required value="${genPass()}"><button type="button" class="btn btn-outline btn-icon" id="rg">${icon('refresh')}</button></div>`, { req: true, hint: 'Minimal 8 karakter. Minta pengguna menggantinya setelah login pertama.' })}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="uf-save">Simpan</button>' });
  if (m.$('#rg')) m.$('#rg').onclick = () => m.$('[name=password]').value = genPass();
  m.$('#uf-save').onclick = e => {
    const f = m.$('#uf'); if (!validate(f)) return;
    const d = formData(f); if (u.id) d.id = u.id;
    withBusy(e.currentTarget, async () => {
      try {
        await API.call('saveUser', d); m.close();
        if (!u.id) modal({ title: 'Akun dibuat ✓', size: 'sm', body: `<p class="mt-0">Sampaikan kredensial berikut ke <b>${esc(d.nama)}</b>:</p><div class="inner mono">Email: ${esc(d.email)}<br>Sandi: ${esc(d.password)}</div>`, foot: '<button class="btn btn-primary" data-close>Selesai</button>' });
        else toast('Pengguna diperbarui.');
        App.route();
      } catch (err) { toast(err.message, 'error'); }
    });
  };
}

/* ======================= PENGATURAN ======================= */
const SETTING_GROUPS = [
  ['Identitas Perusahaan', 'building', ['NAMA_PERUSAHAAN', 'NAMA_LEGAL', 'IZIN_USAHA', 'ALAMAT', 'TELEPON', 'EMAIL_KANTOR', 'WHATSAPP_CS', 'LOGO_URL']],
  ['Booking & Pembayaran', 'ticket', ['FORMAT_KODE_BOOKING', 'H_PELUNASAN', 'MIN_DP_PERSEN', 'REKENING_1', 'REKENING_2', 'SYARAT_PEMBAYARAN', 'KIRIM_EMAIL_OTOMATIS']],
  ['Dokumen & Tanda Tangan', 'file-text', ['TTD_NAMA', 'TTD_JABATAN']],
  ['Keamanan', 'lock', ['SESI_JAM']]
];
Pages.settings = async (c) => {
  const [rows, info] = await Promise.all([API.call('getSettings'), API.call('systemInfo')]);
  if (!c.alive()) return;
  const map = {}; rows.forEach(r => map[r.kunci] = r);
  const known = new Set(SETTING_GROUPS.flatMap(g => g[2]));
  const others = rows.filter(r => !known.has(r.kunci));
  const ctl = r => r.kunci === 'KIRIM_EMAIL_OTOMATIS' ? `<select class="select" name="${r.kunci}">${opts([{ value: 'true', label: 'Ya, kirim otomatis' }, { value: 'false', label: 'Tidak' }], r.nilai)}</select>`
    : r.kunci === 'SYARAT_PEMBAYARAN' || r.kunci === 'ALAMAT' ? `<textarea class="textarea" name="${r.kunci}" rows="2">${esc(r.nilai)}</textarea>`
    : `<input class="input ${['FORMAT_KODE_BOOKING', 'H_PELUNASAN', 'MIN_DP_PERSEN', 'SESI_JAM'].includes(r.kunci) ? 'mono' : ''}" name="${r.kunci}" value="${esc(r.nilai)}">`;
  const label = k => k.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, x => x.toUpperCase());
  c.view.innerHTML = pageHead({ over: 'Administrasi / <b>Pengaturan Sistem</b>', title: 'Pengaturan Sistem', desc: 'Identitas perusahaan untuk dokumen, aturan booking & pembayaran, dan keamanan sesi.',
    actions: `<button class="btn btn-primary" id="st-save">${icon('save')} Simpan Pengaturan</button>` }) +
    `<div class="grid-main"><form id="sf" class="stack" novalidate>${[...SETTING_GROUPS, ...(others.length ? [['Lainnya', 'settings', others.map(r => r.kunci)]] : [])].map(([t, ic, keys]) =>
      `<div class="card"><div class="card-head"><h3>${icon(ic)} ${t}</h3></div><div class="card-body"><div class="form-grid">${keys.filter(k => map[k]).map(k => field(label(k), ctl(map[k]), { cls: ['ALAMAT', 'SYARAT_PEMBAYARAN', 'REKENING_1', 'REKENING_2', 'IZIN_USAHA'].includes(k) ? 'c-12' : 'c-6', hint: esc(map[k].keterangan) })).join('')}</div></div></div>`).join('')}</form>
    <div class="stack sticky"><div class="card"><div class="card-head"><h3>${icon('database')} Informasi Sistem</h3><span class="chip chip-neutral">v${esc(info.versi)}</span></div><div class="card-body">
      <dl class="kv"><dt>Sisa kuota email hari ini</dt><dd class="mono">${info.kuota_email}</dd><dt>Backup terakhir</dt><dd class="mono">${esc(info.backup_terakhir)}</dd><dt>Backup mingguan</dt><dd>${info.trigger_backup ? chip('Terpasang', 'success') : chip('Belum dipasang', 'warn')}</dd>
        <dt>Customer</dt><dd class="mono">${info.jumlah.customer}</dd><dt>Booking</dt><dd class="mono">${info.jumlah.booking}</dd><dt>Transaksi</dt><dd class="mono">${info.jumlah.transaksi}</dd><dt>Pengguna</dt><dd class="mono">${info.jumlah.pengguna}</dd></dl>
      ${info.trigger_backup ? '' : '<div class="inner mt-3 xs">Jalankan fungsi <span class="mono">installBackupTrigger()</span> sekali dari editor Apps Script untuk mengaktifkan backup otomatis tiap Minggu 02:00.</div>'}
      <button class="btn btn-secondary btn-block mt-4" id="bk">${icon('database')} Backup Spreadsheet Sekarang</button>
      <a class="btn btn-outline btn-block mt-2" target="_blank" rel="noopener" href="${esc(info.spreadsheet_url)}">${icon('external')} Buka Database (Sheets)</a>
      <a class="btn btn-outline btn-block mt-2" target="_blank" rel="noopener" href="${esc(info.folder_url)}">${icon('folder')} Buka Folder Drive</a></div></div>
      <div class="callout"><div class="ic-wrap">${icon('info')}</div><div class="small ink2">Format kode booking mendukung token <span class="mono">{YYYY} {YY} {MM} {NNNN}</span>. Nomor urut direset per tahun.</div></div></div></div>`;
  $('#st-save').onclick = e => withBusy(e.currentTarget, async () => {
    try {
      const r = await API.call('saveSettings', { settings: formData($('#sf')) });
      if (r.diubah.length) { toast('Pengaturan disimpan: ' + r.diubah.length + ' perubahan.'); const me = await API.call('me'); App.settings = me.settings; } else toast('Tidak ada perubahan.', 'info');
    } catch (err) { toast(err.message, 'error'); }
  });
  $('#bk').onclick = e => withBusy(e.currentTarget, async () => {
    try { const r = await API.call('runBackup'); toast('Backup dibuat di folder Drive /Backup.'); if (r.url) window.open(r.url, '_blank'); } catch (err) { toast(err.message, 'error'); }
  });
};

/* ======================= LOG AKTIVITAS ======================= */
Pages.audit = async (c) => {
  const st = { q: '', modul: '', from: '', to: '', page: 1, size: 25 };
  c.view.innerHTML = pageHead({ over: 'Administrasi / <b>Log Aktivitas</b>', title: 'Log Aktivitas (Audit Trail)', desc: 'Siapa mengubah apa dan kapan. Tambah, ubah, hapus, perubahan status, pembayaran, cetak dokumen, dan login tercatat otomatis.' }) +
    `<div class="card"><div class="filters"><div class="input-icon">${icon('search')}<input class="input" id="aq" placeholder="Cari pengguna, aksi, kode data, keterangan..."></div>
    <select class="select" id="am"><option value="">Semua Modul</option></select><input class="input" type="date" id="af"><input class="input" type="date" id="at"></div><div id="a-table" style="border-top:1px solid var(--divider)"></div></div>`;
  const tone = a => /HAPUS|DITOLAK|BATAL/.test(a) ? 'danger' : /TAMBAH|PEMBAYARAN|FINALKAN/.test(a) ? 'success' : /UBAH|BUKA|RESET/.test(a) ? 'warn' : /LOGIN|LOGOUT/.test(a) ? 'info' : 'neutral';
  const load = async () => {
    $('#a-table').innerHTML = loadingView();
    const r = await API.call('listAudit', st);
    if (!c.alive()) return;
    if ($('#am').options.length <= 1) $('#am').innerHTML = opts(r.modul, st.modul, 'Semua Modul');
    $('#a-table').innerHTML = r.rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Waktu (WIB)</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>ID Data</th><th>Keterangan</th></tr></thead><tbody>
      ${r.rows.map(a => `<tr><td class="mono small nowrap">${esc(a.waktu)}</td><td><div class="row">${avatar(a.nama_user, 'sm')}<span class="small">${esc(a.nama_user)}</span></div></td><td>${chip(a.aksi, tone(a.aksi))}</td><td class="small">${esc(a.modul)}</td><td class="mono small">${esc(a.id_data)}</td><td class="small" style="max-width:380px">${esc(a.keterangan)}</td></tr>`).join('')}
      </tbody></table></div>` + pager(r, (p, sz) => { st.page = p; if (sz) st.size = sz; load(); }) : emptyView('Tidak ada log untuk filter ini.', 'history');
  };
  $('#aq').oninput = debounce(e => { st.q = e.target.value.trim(); st.page = 1; load(); }, 400);
  $('#am').onchange = e => { st.modul = e.target.value; st.page = 1; load(); };
  $('#af').onchange = e => { st.from = e.target.value; st.page = 1; load(); };
  $('#at').onchange = e => { st.to = e.target.value; st.page = 1; load(); };
  await load();
};
