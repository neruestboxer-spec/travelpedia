/* ============================================================
   HALAMAN OPERASIONAL (Admin & Karyawan)
   Dashboard · Customer · Booking · Dokumen · Jadwal · Trip · Slip · Profil
   ============================================================ */

/* ======================= DASHBOARD ======================= */
Pages.dashboard = async (c) => {
  const d = await API.call('getDashboard');
  API._memo['getDashboard{}'] = { t: Date.now(), v: d };
  if (!c.alive()) return;
  App.setNotif(d.notifikasi, d.pengingat);
  const k = d.kartu, u = App.user;
  const now = new Date();
  const pctIsi = k.kuota_30 ? Math.round(k.terisi_30 / k.kuota_30 * 1000) / 10 : 0;
  const tren = k.tren_booking === null ? '' : `<span class="chip ${k.tren_booking >= 0 ? 'chip-success' : 'chip-danger'}">${icon(k.tren_booking >= 0 ? 'trending-up' : 'trending-down')}${k.tren_booking >= 0 ? '+' : ''}${k.tren_booking}% vs lalu</span>`;

  let html = `<div class="card" style="padding:20px 24px;margin-bottom:20px"><div class="page-head" style="margin:0">
    <div class="grow"><h1>Halo, ${esc(u.nama)} <span class="chip chip-primary"><span class="dot"></span>Operasional Aktif</span></h1>
    <div class="desc row wrap">${icon('calendar', 'ic-sm')} Ringkasan operasional harian dan pemantauan keberangkatan aktif — <b>${HARI[now.getDay()]}, ${tgl(today())}</b></div></div>
    <div class="actions"><button class="btn btn-secondary" id="exp-daily">${icon('download')} Ekspor Laporan Harian</button>
    <a class="btn btn-primary" href="#/bookings/new">${icon('plus')} Booking Baru</a></div></div></div>
  <div class="stats">
    ${statCard({ label: 'Booking bulan ini', value: k.booking_bulan_ini, unit: 'Pemesanan', ic: 'ticket', foot: `${tren}<span class="mono">${k.peserta_bulan_ini} Peserta</span>` })}
    ${statCard({ label: 'Keberangkatan aktif (30H)', value: k.keberangkatan_30, unit: 'Jadwal Trip', ic: 'plane-takeoff',
      extra: `<div class="row-between small mono"><span>${k.terisi_30} / ${k.kuota_30} Kuota Terisi</span><span class="c-primary">${pctIsi}%</span></div>${progress(pctIsi)}` })}
    ${statCard({ label: 'Menunggu pembayaran', value: rp(k.piutang), money: true, ic: 'clock',
      foot: `<span class="chip chip-danger">${k.n_piutang} Tagihan Aktif</span><a href="#/bookings?piutang=1" class="small">Lihat Piutang ${icon('arrow-right', 'ic-sm')}</a>` })}
    ${statCard({ label: 'Customer baru bulan ini', value: k.customer_baru, unit: 'Orang', ic: 'user-plus', foot: `<span>Total ${num(k.customer_total)} customer</span><a href="#/customers" class="small">Lihat ${icon('arrow-right', 'ic-sm')}</a>` })}
  </div>
  <div class="grid-2 mt-6">
    <div class="card"><div class="card-head tinted"><h3>${icon('calendar-check')} Keberangkatan Terdekat</h3><span class="chip chip-outline">${d.keberangkatan.length} Jadwal Siap</span></div>
      <div class="card-body">${d.keberangkatan.length ? d.keberangkatan.map(x => `
        <div class="dep-row" onclick="App.go('#/departures?focus=${x.id}&m=${x.tanggal_berangkat.slice(0, 7)}')">
          <div class="datebox"><div class="m">${tglPendek(x.tanggal_berangkat).split(' ')[0]} ${BULAN[parseYmd(x.tanggal_berangkat).getMonth()]}</div><div class="d">${HARI[parseYmd(x.tanggal_berangkat).getDay()].slice(0, 3)}</div></div>
          <div class="grow"><div class="bold">${esc(x.trip_nama)}</div><div class="xs mono ink2 mt-1">${esc(x.kode)} • ${x.terisi} / ${x.kuota} Pax${x.tour_leader ? ' • TL ' + esc(x.tour_leader) : ''}</div></div>
          ${chipDep(x)}</div>`).join('') : emptyView('Belum ada jadwal keberangkatan mendatang.', 'calendar')}</div>
      <div class="card-foot"><a href="#/departures">Lihat Semua Jadwal Keberangkatan ${icon('arrow-right', 'ic-sm')}</a></div></div>
    <div class="card"><div class="card-head tinted"><h3>${icon('ticket')} Booking Terbaru</h3><span class="small ink2">Real-time feed</span></div>
      <div class="card-body">${d.booking_terbaru.length ? d.booking_terbaru.map(b => `
        <div class="feed-item" onclick="App.go('#/bookings/${b.id}')">
          <div class="grow"><div class="small"><span class="mono bold">${esc(b.kode)}</span> • <b>${esc(b.customer_nama)}</b></div>
          <div class="small ink2 mt-1">${esc(b.trip_nama)} (${b.jumlah_peserta} Pax)</div></div>
          <div class="right"><div class="mono small ${b.sisa ? 'c-danger' : ''}">${b.sisa && b.terbayar ? 'Sisa ' + rp(b.sisa) : rp(b.total)}</div><div class="mt-1">${chipBayar(b.status_bayar)}</div></div></div>`).join('') : emptyView('Belum ada booking.', 'ticket')}</div>
      <div class="card-foot"><a href="#/bookings">Buka Daftar Lengkap Pemesanan ${icon('arrow-right', 'ic-sm')}</a></div></div>
  </div>
  <div class="card mt-6"><div class="card-head tinted"><div><h3>${icon('bell')} Pengingat Pembayaran & Jatuh Tempo Piutang</h3>
    <div class="sub">Reservasi dengan pelunasan tertunda yang jatuh tempo dalam 14 hari.</div></div>
    <span class="chip chip-neutral" style="font-size:12px;padding:6px 12px">Total Piutang: <span class="mono c-primary">${rp(d.total_piutang_pengingat)}</span></span></div>
    ${d.pengingat.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Kode Booking</th><th>Nama Customer</th><th>WhatsApp</th><th class="num">Total Tagihan</th><th class="num">Sisa Tagihan</th><th>Jatuh Tempo</th><th class="right">Aksi</th></tr></thead><tbody>
      ${d.pengingat.map(b => { const late = b.jatuh_tempo < today(); const dd = daysBetween(today(), b.jatuh_tempo);
        return `<tr><td><a class="code" href="#/bookings/${b.id}">${esc(b.kode)}</a></td><td class="bold">${esc(b.customer_nama)}</td><td class="mono small">${esc(fmtHp(b.customer_hp))}</td>
        <td class="num">${rp(b.total)}</td><td class="num c-danger bold">${rp(b.sisa)}</td>
        <td>${late ? chip(tgl(b.jatuh_tempo) + ' (Terlewat)', 'danger', 'clock') : dd <= 3 ? chip(tgl(b.jatuh_tempo) + (dd === 1 ? ' (Besok)' : dd === 0 ? ' (Hari ini)' : ''), 'warn', 'clock') : `<span class="mono small">${tgl(b.jatuh_tempo)}</span>`}</td>
        <td class="right"><a class="btn btn-secondary btn-xs" target="_blank" rel="noopener" href="${waLink(b.customer_hp, reminderText(b))}">${icon('whatsapp', 'ic-sm')} Kirim Pengingat WA</a></td></tr>`; }).join('')}
    </tbody></table></div>` : emptyView('Tidak ada piutang yang mendekati jatuh tempo.', 'check-circle')}
  </div>`;

  if (d.keuangan) {
    const f = d.keuangan, dist = f.distribusi;
    const tot = f.n_booking || 0;
    const pct = n => tot ? Math.round(n / tot * 100) : 0;
    html += `<div class="card mt-6"><div class="card-head tinted"><div><h3>${icon('chart')} Pratinjau Analitik & Keuangan</h3><div class="sub">Agregasi performa kas dan konversi reservasi terkini</div></div><span class="chip chip-outline">Akses Khusus Admin</span></div>
      <div class="card-body"><div class="grid-63">
        <div><div class="row-between"><b>Pemasukan vs Pengeluaran (6 Bulan)</b><div class="legend"><span><i style="background:#E8731A"></i>Pemasukan</span><span><i style="background:#D9C8B4"></i>Pengeluaran</span></div></div>
          <div class="chart mt-4 inner">${barChart(f.trend.map(t => ({ label: BULAN[Number(t.bulan.slice(5)) - 1], values: [t.pemasukan, t.pengeluaran] })), { names: ['Pemasukan', 'Pengeluaran'] })}</div>
          <div class="row-between small mt-2"><span class="ink2">Skala: Rupiah (IDR)</span><span class="c-primary">Laba bulan ini: <b class="mono">${rp(f.laba)}</b> (margin ${f.margin}%)</span></div></div>
        <div><b>Distribusi Pembayaran Booking Bulan Ini</b>
          <div class="donut-wrap mt-4">${donut([{ label: 'Lunas', value: dist['Lunas'].n, color: '#2E9E5B' }, { label: 'DP / Cicilan', value: dist['DP'].n, color: '#F2A33A' }, { label: 'Belum Bayar', value: dist['Belum Bayar'].n, color: '#B5371F' }], { center: tot, sub: 'Booking' })}
          <div class="grow">${[['Lunas', '#2E9E5B', 'Lunas'], ['DP / Cicilan', '#F2A33A', 'DP'], ['Belum Bayar', '#B5371F', 'Belum Bayar']].map(([l, col, key]) =>
            `<div class="dist-row"><span><span class="dot" style="color:${col}"></span> ${l}</span><span class="mono">${pct(dist[key].n)}% (${dist[key].n})</span></div>`).join('')}</div></div>
          ${f.top_trips.length ? `<div class="mt-4"><div class="label-xs">Trip terlaris bulan ini</div>${f.top_trips.slice(0, 3).map((t, i) => `<div class="row-between small mt-2"><span>${i + 1}. ${esc(t.nama)}</span><span class="mono">${t.pax} pax</span></div>`).join('')}</div>` : ''}
        </div></div></div>
      <div class="card-foot" style="justify-content:space-between"><span class="small ink2">Data diperbarui saat halaman dibuka</span><a href="#/finance">Buka Modul Laporan Keuangan & Laba Rugi ${icon('arrow-right', 'ic-sm')}</a></div></div>`;
  }
  c.view.innerHTML = html;
  $('#exp-daily').onclick = () => {
    const rows = [['LAPORAN HARIAN', tgl(today())], [], ['KEBERANGKATAN TERDEKAT'], ['Tanggal', 'Kode', 'Trip', 'Terisi', 'Kuota', 'Tour Leader']];
    d.keberangkatan.forEach(x => rows.push([x.tanggal_berangkat, x.kode, x.trip_nama, x.terisi, x.kuota, x.tour_leader]));
    rows.push([], ['PENGINGAT PEMBAYARAN'], ['Kode', 'Customer', 'HP', 'Total', 'Sisa', 'Jatuh Tempo']);
    d.pengingat.forEach(b => rows.push([b.kode, b.customer_nama, b.customer_hp, b.total, b.sisa, b.jatuh_tempo]));
    rows.push([], ['BOOKING TERBARU'], ['Kode', 'Customer', 'Trip', 'Pax', 'Total', 'Status Bayar']);
    d.booking_terbaru.forEach(b => rows.push([b.kode, b.customer_nama, b.trip_nama, b.jumlah_peserta, b.total, b.status_bayar]));
    downloadCsv('Laporan_Harian_' + today() + '.csv', rows);
  };
};

function reminderText(b) {
  const s = App.settings || {};
  return `Halo ${b.customer_nama}, kami dari ${s.NAMA_PERUSAHAAN || 'Travelpedia'} mengingatkan sisa pembayaran booking *${b.kode}* (${b.trip_nama}, berangkat ${tgl(b.berangkat)}) sebesar *${rp(b.sisa)}* dengan jatuh tempo *${tgl(b.jatuh_tempo)}*.` +
    (s.REKENING_1 ? `\n\nPembayaran dapat ditransfer ke:\n${s.REKENING_1}${s.REKENING_2 ? '\n' + s.REKENING_2 : ''}` : '') + `\n\nMohon cantumkan kode booking pada berita transfer. Terima kasih 🙏`;
}

/* ======================= CUSTOMER ======================= */
const CUST_KATEGORI = ['Individual', 'Family Tour', 'Honeymoon', 'Corporate', 'VIP', 'Komunitas'];

Pages.customers = async (c) => {
  const st = { q: c.query.q || '', kategori: c.query.kategori || '', page: 1, size: 10 };
  c.view.innerHTML = pageHead({
    over: 'Operasional / <b>Data Customer</b>', title: 'Customer',
    desc: 'Kelola data identitas, kontak, dan riwayat perjalanan customer. Cari berdasarkan nama atau nomor HP.',
    actions: `<button class="btn btn-outline" id="c-exp">${icon('download')} Unduh (.csv)</button><a class="btn btn-primary" href="#/customers/new">${icon('user-plus')} Tambah Customer</a>`
  }) + `<div class="stats" id="c-stats" style="grid-template-columns:repeat(3,minmax(0,1fr))"></div>
  <div class="card mt-6"><div class="filters">
    <div class="input-icon">${icon('search')}<input class="input" id="c-q" placeholder="Cari nama, No. HP, email, atau kode customer..." value="${esc(st.q)}"></div>
    <select class="select" id="c-kat">${opts(CUST_KATEGORI, st.kategori, 'Semua Kategori')}</select>
  </div><div id="c-table">${loadingView()}</div></div>`;
  let last;
  const load = async () => {
    App.setQuery({ q: st.q, kategori: st.kategori });
    $('#c-table').innerHTML = loadingView();
    const r = last = await API.call('listCustomers', st);
    if (!c.alive()) return;
    $('#c-stats').innerHTML = statCard({ label: 'Total customer', value: num(r.stats.total), unit: 'Orang', ic: 'users' }) +
      statCard({ label: 'Customer baru bulan ini', value: r.stats.baru_bulan_ini, unit: 'Orang', ic: 'user-plus' }) +
      statCard({ label: 'Memiliki tagihan aktif', value: r.stats.punya_tagihan, unit: 'Customer', ic: 'clock' });
    $('#c-table').innerHTML = r.rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Kontak</th><th>Kota</th><th>Kategori</th><th class="num">Booking</th><th class="num">Sisa Tagihan</th><th>Terdaftar</th><th></th></tr></thead><tbody>
      ${r.rows.map(x => `<tr class="clickable" data-id="${x.id}"><td><div class="row">${avatar(x.nama, 'sm')}<div><div class="bold">${esc(x.nama)}</div><div class="sub mono">${esc(x.kode)} ${x.ada_berkas ? '· ' + icon('check-circle', 'ic-sm') + ' ' + esc(x.jenis_identitas) : ''}</div></div></div></td>
        <td><div class="mono small">${esc(fmtHp(x.hp))}</div><div class="sub">${esc(x.email || '-')}</div></td><td>${esc(x.kota || '-')}</td><td>${chip(x.kategori, 'primary')}</td>
        <td class="num">${x.total_booking}</td><td class="num ${x.sisa_tagihan ? 'c-danger' : 'muted'}">${x.sisa_tagihan ? rp(x.sisa_tagihan) : '—'}</td><td class="small ink2">${tgl(x.tanggal)}</td>
        <td class="right nowrap"><a class="btn btn-ghost btn-icon btn-sm" target="_blank" rel="noopener" href="${waLink(x.hp, '')}" onclick="event.stopPropagation()" title="WhatsApp">${icon('whatsapp')}</a>${icon('chevron-right', 'muted')}</td></tr>`).join('')}
      </tbody></table></div>` + pager(r, (p, sz) => { st.page = p; if (sz) st.size = sz; load(); })
      : emptyView(st.q ? `Tidak ada customer yang cocok dengan "<b>${esc(st.q)}</b>".` : 'Belum ada data customer.', 'users', '<a class="btn btn-primary" href="#/customers/new">Tambah Customer</a>');
    $$('#c-table tr[data-id]').forEach(tr => tr.onclick = () => App.go('#/customers/' + tr.dataset.id));
  };
  $('#c-q').addEventListener('input', debounce(e => { st.q = e.target.value.trim(); st.page = 1; load(); }, 400));
  $('#c-kat').onchange = e => { st.kategori = e.target.value; st.page = 1; load(); };
  $('#c-exp').onclick = async e => withBusy(e.currentTarget, async () => {
    const r = await API.call('listCustomers', { ...st, page: 1, size: 200 });
    downloadCsv('Customer_' + today() + '.csv', [['Kode', 'Nama', 'HP', 'Email', 'Kota', 'Kategori', 'Total Booking', 'Sisa Tagihan', 'Terdaftar'],
      ...r.rows.map(x => [x.kode, x.nama, x.hp, x.email, x.kota, x.kategori, x.total_booking, x.sisa_tagihan, x.tanggal])]);
  });
  await load();
};

Pages.customerForm = async (c) => {
  const id = c.params[0];
  let x = { kategori: 'Individual', jenis_identitas: 'e-KTP', kewarganegaraan: 'WNI', jenis_kelamin: 'Laki-laki', preferensi: {}, berkas: [] };
  if (id) { x = await API.call('getCustomer', { id }); if (!c.alive()) return; }
  const pref = x.preferensi || {};
  const queued = [];
  c.view.innerHTML = `
  ${pageHead({ back: { href: id ? '#/customers/' + id : '#/customers', label: id ? 'Kembali ke Detail Customer' : 'Kembali ke Daftar Customer' },
    title: id ? 'Ubah Data Customer' : 'Tambah Customer Baru', badges: id ? `<span class="tag-mono">${esc(x.kode)}</span>` : '',
    desc: 'Lengkapi data identitas, kontak aktif, dan berkas identitas resmi untuk keperluan manifest tiket, voucher hotel, dan reservasi tur.' })}
  <div class="callout">${'<div class="ic-wrap">' + icon('shield-check') + '</div>'}<div><b>Validasi Identitas & Keamanan Berkas Manifest</b> <span class="chip chip-primary">KTP / PASPOR</span>
    <div class="small ink2 mt-1">Nama lengkap wajib sesuai fisik e-KTP / Paspor tanpa gelar akademik. Berkas identitas disimpan di folder Google Drive privat dan hanya dapat dibuka lewat aplikasi.</div></div></div>
  <form id="cf" novalidate>
  <div class="card mt-4"><div class="card-head"><div class="row"><span class="section-num">1</span><div><h3>Data Pribadi & Kontak Utama</h3><div class="sub">Informasi pemesan untuk komunikasi & manifest perjalanan</div></div></div><span class="chip chip-primary">Wajib Dilengkapi</span></div>
    <div class="card-body"><div class="form-grid">
      ${field('Nama Lengkap (Sesuai KTP / Paspor)', `<input class="input" name="nama" required value="${esc(x.nama || '')}" style="text-transform:uppercase" placeholder="BUDI SANTOSO">`, { req: true, cls: 'c-8', right: 'HURUF KAPITAL', hint: 'Pastikan ejaan sama persis dengan kartu identitas aktif.' })}
      ${field('Kategori Customer', `<select class="select" name="kategori">${opts(CUST_KATEGORI, x.kategori)}</select>`, { req: true, cls: 'c-4', hint: 'Menentukan penanganan & katalog paket.' })}
      ${field('Nomor WhatsApp / HP Aktif', `<div class="input-icon">${icon('phone')}<input class="input mono" name="hp" required inputmode="tel" value="${esc(x.hp || '')}" placeholder="081298765432"></div>`, { req: true, cls: 'c-4', hint: 'Untuk invoice & pengingat via WhatsApp.' })}
      ${field('Alamat Email (Korespondensi)', `<div class="input-icon">${icon('mail')}<input class="input" type="email" name="email" value="${esc(x.email || '')}" placeholder="nama@email.com"></div>`, { cls: 'c-4', hint: 'Tujuan pengiriman invoice & konfirmasi booking.' })}
      ${field('Jenis Kelamin', `<div class="seg" id="jk">${['Laki-laki', 'Perempuan'].map(v => `<button type="button" class="${x.jenis_kelamin === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div><input type="hidden" name="jenis_kelamin" value="${esc(x.jenis_kelamin || '')}">`, { cls: 'c-4' })}
      ${field('Tempat Lahir', `<input class="input" name="tempat_lahir" value="${esc(x.tempat_lahir || '')}" placeholder="Surabaya">`, { cls: 'c-4' })}
      ${field('Tanggal Lahir', `<input class="input" type="date" name="tanggal_lahir" value="${esc(x.tanggal_lahir || '')}">`, { cls: 'c-4', right: '<span id="age-chip"></span>', hint: 'Kategori tiket: Infant (&lt;2 th), Child (2–11 th), Adult (12+ th).' })}
      ${field('Kewarganegaraan', `<select class="select" name="kewarganegaraan">${opts(['WNI', 'WNA'], x.kewarganegaraan)}</select>`, { cls: 'c-4', hint: 'WNA memerlukan paspor & KITAS valid.' })}
      ${field('Alamat Lengkap KTP & Domisili', `<textarea class="textarea" name="alamat" rows="3" placeholder="Jl. ... RT/RW, Kel., Kec.">${esc(x.alamat || '')}</textarea>`, { cls: 'c-8' })}
      <div class="c-4" style="display:flex;flex-direction:column;gap:16px">
        ${field('Kota / Kabupaten', `<input class="input" name="kota" value="${esc(x.kota || '')}" placeholder="Jakarta Selatan">`)}
        ${field('Kode Pos', `<input class="input mono" name="kode_pos" value="${esc(x.kode_pos || '')}" inputmode="numeric">`)}
      </div>
    </div></div></div>

  <div class="card mt-4"><div class="card-head"><div class="row"><span class="section-num">2</span><div><h3>Dokumen Identitas Resmi (KTP / Paspor)</h3><div class="sub">Sinkronisasi berkas manifest penerbangan dan hotel</div></div></div><span class="chip chip-primary">${icon('folder')} Google Drive</span></div>
    <div class="card-body"><div class="form-grid">
      ${field('Jenis Identitas Utama', `<select class="select" name="jenis_identitas">${opts(['e-KTP', 'Paspor', 'KIA', 'SIM', 'KITAS'], x.jenis_identitas)}</select>`, { cls: 'c-4' })}
      ${field('Nomor Identitas (NIK / No. Paspor)', `<input class="input mono" name="no_identitas" value="${esc(x.no_identitas || '')}" placeholder="3174081408860003">`, { cls: 'c-8', right: '<span id="nik-ok"></span>', hint: 'NIK e-KTP wajib tepat 16 digit angka tanpa pemisah.' })}
      <div class="c-12"><div class="label-xs" style="margin-bottom:8px">Unggah Berkas Fisik / Foto Berkas Resmi</div>
        <div class="drop" id="drop"><div class="ic-wrap">${icon('upload-cloud')}</div><b>Tarik & lepas foto KTP / Paspor di sini, atau <span class="c-primary">klik untuk memilih berkas</span></b>
        <div class="small ink2 mt-1">Foto dikompres otomatis sebelum diunggah · Format: JPG, PNG, PDF · Maks. 5 MB</div></div>
        <div id="files" class="mt-3"></div></div>
    </div></div></div>

  <div class="card mt-4"><div class="card-head"><div class="row"><span class="section-num">3</span><div><h3>Preferensi Perjalanan & Catatan Khusus</h3><div class="sub">Katering, akomodasi hotel, dan ground handling</div></div></div><span class="chip chip-primary">Hospitality</span></div>
    <div class="card-body"><div class="form-grid">
      ${field('Preferensi Makanan & Alergi', `<input class="input" name="pref_makanan" value="${esc(pref.makanan || '')}" placeholder="Halal only · alergi seafood">`, { cls: 'c-6', right: 'Otomatis ke manifest' })}
      ${field('Preferensi Kursi & Tipe Kamar', `<input class="input" name="pref_kamar" value="${esc(pref.kamar || '')}" placeholder="Aisle seat · Double bed · Non-smoking">`, { cls: 'c-6', right: 'Subject to availability' })}
      ${field('Kontak Darurat', `<input class="input" name="kontak_darurat" value="${esc(x.kontak_darurat || '')}" placeholder="Nama, hubungan, No. HP">`, { cls: 'c-12' })}
      ${field('Catatan Tambahan untuk Tour Leader & Ground Handling', `<textarea class="textarea" name="catatan" rows="3">${esc(x.catatan || '')}</textarea>`, { cls: 'c-12', hint: 'Catatan ini tampil di detail customer dan booking.' })}
    </div></div></div>

  <div class="card mt-4 sticky-bar" style="position:sticky;bottom:12px;z-index:5;box-shadow:var(--sh-3)"><div class="row-between wrap" style="padding:14px 20px">
    <div class="row small ink2">${icon('info', 'ic-sm')} Kolom bertanda <span class="c-danger">*</span> wajib diisi.</div>
    <div class="row wrap"><a class="btn btn-ghost" href="${id ? '#/customers/' + id : '#/customers'}">Batal</a>
      <button type="button" class="btn btn-secondary" id="save-book">${icon('ticket')} Simpan & Buat Booking</button>
      <button type="submit" class="btn btn-primary">${icon('check-circle')} Simpan Data Customer</button></div></div></div>
  </form>`;
  const f = $('#cf');
  $$('#jk button').forEach(b => b.onclick = () => { $$('#jk button').forEach(x => x.classList.remove('on')); b.classList.add('on'); f.jenis_kelamin.value = b.dataset.v; });
  const ageChip = () => {
    const v = f.tanggal_lahir.value; if (!v) { $('#age-chip').innerHTML = ''; return; }
    const age = Math.floor(daysBetween(v, today()) / 365.25);
    $('#age-chip').innerHTML = chip(age + ' Tahun • ' + (age < 2 ? 'Infant' : age < 12 ? 'Child' : 'Dewasa'), 'orange');
  };
  const nikChk = () => {
    const v = f.no_identitas.value.trim();
    $('#nik-ok').innerHTML = f.jenis_identitas.value === 'e-KTP' && v ? (/^\d{16}$/.test(v) ? chip('Format 16 Digit Terverifikasi', 'success', 'check-circle') : chip(v.length + '/16 digit', 'danger')) : '';
  };
  f.tanggal_lahir.onchange = ageChip; f.no_identitas.oninput = nikChk; f.jenis_identitas.onchange = nikChk; ageChip(); nikChk();

  const renderFiles = () => {
    $('#files').innerHTML = (x.berkas || []).map(b => `<div class="file-item"><div class="ext">${fileExt(b.name)}</div><div class="grow"><div class="bold small">${esc(b.name)} ${chip('Tersimpan', 'success')}</div><div class="xs mono ink2">${fileSize(b.size)} • ${esc(b.jenis || '')} • Google Drive</div></div>
      <button type="button" class="btn btn-ghost btn-icon btn-sm" data-view="${b.id}">${icon('eye')}</button></div>`).join('') +
      queued.map((q, i) => `<div class="file-item"><div class="ext">${fileExt(q.name)}</div><div class="grow"><div class="bold small">${esc(q.name)} ${chip('Menunggu disimpan', 'warn')}</div><div class="xs mono ink2">${fileSize(q.size)} • ${esc(q.jenis)}</div></div>
      <button type="button" class="btn btn-ghost btn-icon btn-sm" data-unq="${i}">${icon('trash')}</button></div>`).join('');
    $$('[data-view]').forEach(b => b.onclick = () => viewFile(b.dataset.view, b));
    $$('[data-unq]').forEach(b => b.onclick = () => { queued.splice(Number(b.dataset.unq), 1); renderFiles(); });
  };
  renderFiles();
  const addFile = async (file) => {
    const ff = file ? await readFileForUpload(file).catch(e => { toast(e.message, 'error'); return null; }) : await pickFile();
    if (!ff) return;
    ff.jenis = f.jenis_identitas.value === 'Paspor' ? 'Paspor' : f.jenis_identitas.value;
    queued.push(ff); renderFiles();
  };
  const drop = $('#drop');
  drop.onclick = () => addFile();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('drag'); };
  drop.ondragleave = () => drop.classList.remove('drag');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('drag'); if (e.dataTransfer.files[0]) addFile(e.dataTransfer.files[0]); };

  const save = async (btn, thenBook) => {
    if (!validate(f)) return;
    const d = formData(f);
    d.preferensi = { makanan: d.pref_makanan, kamar: d.pref_kamar };
    delete d.pref_makanan; delete d.pref_kamar;
    if (id) d.id = id;
    await withBusy(btn, async () => {
      try {
        const r = await API.call('saveCustomer', d);
        for (const q of queued.splice(0)) {
          await API.call('uploadCustomerFile', { id: r.id, jenis: q.jenis, file: { name: q.name, mime: q.mime, base64: q.base64 } });
        }
        toast(id ? 'Data customer diperbarui.' : `Customer ${r.kode} berhasil ditambahkan.`);
        App.go(thenBook ? '#/bookings/new?customer=' + r.id : '#/customers/' + r.id);
      } catch (e) { toast(e.message, 'error'); }
    });
  };
  f.onsubmit = e => { e.preventDefault(); save(e.submitter); };
  $('#save-book').onclick = e => save(e.currentTarget, true);
};

Pages.customerDetail = async (c) => {
  const x = await API.call('getCustomer', { id: c.params[0] });
  if (!c.alive()) return;
  const pref = x.preferensi || {};
  const totSisa = x.bookings.filter(b => b.status_booking !== 'Dibatalkan').reduce((s, b) => s + Math.max(0, b.total - b.terbayar), 0);
  const totNilai = x.bookings.filter(b => b.status_booking !== 'Dibatalkan').reduce((s, b) => s + b.total, 0);
  c.view.innerHTML = `${pageHead({ back: { href: '#/customers', label: 'Kembali ke Daftar Customer' },
    title: esc(x.nama), badges: `<span class="tag-mono">${esc(x.kode)}</span> ${chip(x.kategori, 'primary')}`,
    desc: `Terdaftar ${tglJam(x.tanggal)} oleh ${esc(x.dibuat_oleh || '-')}`,
    actions: `<a class="btn btn-outline" target="_blank" rel="noopener" href="${waLink(x.hp, 'Halo ' + x.nama + ', ')}">${icon('whatsapp')} WhatsApp</a>
      <a class="btn btn-outline" href="#/customers/${x.id}/edit">${icon('edit')} Ubah</a>
      ${App.isAdmin() ? `<button class="btn btn-danger" id="del">${icon('trash')} Hapus</button>` : ''}
      <a class="btn btn-primary" href="#/bookings/new?customer=${x.id}">${icon('plus')} Buat Booking</a>` })}
  <div class="stats">
    ${statCard({ label: 'Total booking', value: x.bookings.length, unit: 'Reservasi', ic: 'ticket' })}
    ${statCard({ label: 'Nilai transaksi', value: rp(totNilai), money: true, ic: 'banknote' })}
    ${statCard({ label: 'Sisa tagihan', value: rp(totSisa), money: true, ic: 'clock' })}
    ${statCard({ label: 'Pembayaran tercatat', value: x.payments.length, unit: 'Transaksi', ic: 'check-circle' })}
  </div>
  <div class="grid-main mt-6"><div class="stack">
    <div class="card"><div class="card-head"><h3>${icon('ticket')} Riwayat Booking</h3><a class="btn btn-secondary btn-sm" href="#/bookings/new?customer=${x.id}">${icon('plus')} Booking Baru</a></div>
      ${x.bookings.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Trip</th><th>Berangkat</th><th class="num">Pax</th><th class="num">Total</th><th class="num">Sisa</th><th>Bayar</th><th>Status</th></tr></thead><tbody>
        ${x.bookings.map(b => `<tr class="clickable" onclick="App.go('#/bookings/${b.id}')"><td class="code">${esc(b.kode)}</td><td>${esc(b.trip)}</td><td class="small">${tgl(b.berangkat)}</td><td class="num">${b.pax}</td>
        <td class="num">${rp(b.total)}</td><td class="num ${b.total - b.terbayar > 0 ? 'c-danger' : 'muted'}">${rp(Math.max(0, b.total - b.terbayar))}</td><td>${chipBayar(b.status_bayar)}</td><td>${chipBooking(b.status_booking)}</td></tr>`).join('')}
      </tbody></table></div>` : emptyView('Customer ini belum memiliki booking.', 'ticket')}</div>
    <div class="card"><div class="card-head"><h3>${icon('banknote')} Riwayat Pembayaran</h3></div>
      ${x.payments.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>ID Transaksi</th><th>Booking</th><th>Tanggal</th><th>Jenis</th><th>Metode</th><th class="num">Nominal</th></tr></thead><tbody>
        ${x.payments.map(p => `<tr><td class="code">${esc(p.kode)}</td><td class="mono small">${esc(p.booking)}</td><td class="small">${tgl(p.tanggal)}</td><td>${chip(p.jenis, p.jenis === 'Pelunasan' ? 'success' : 'warn')}</td><td class="small">${esc(p.metode)}</td><td class="num">${rp(p.nominal)}</td></tr>`).join('')}
      </tbody></table></div>` : emptyView('Belum ada pembayaran.', 'banknote')}</div>
  </div>
  <div class="stack">
    <div class="card"><div class="card-head"><h3>${icon('user')} Profil & Kontak</h3></div><div class="card-body">
      <div class="row">${avatar(x.nama, 'lg')}<div><div class="bold">${esc(x.nama)}</div><div class="small ink2">${esc(x.jenis_kelamin || '')}${x.tanggal_lahir ? ' • ' + Math.floor(daysBetween(x.tanggal_lahir, today()) / 365.25) + ' Tahun' : ''}</div></div></div>
      <dl class="kv mt-4"><dt>WhatsApp</dt><dd class="mono">${esc(fmtHp(x.hp))}</dd><dt>Email</dt><dd>${esc(x.email || '-')}</dd>
        <dt>TTL</dt><dd>${esc(x.tempat_lahir || '-')}, ${tgl(x.tanggal_lahir)}</dd><dt>Warga negara</dt><dd>${esc(x.kewarganegaraan || '-')}</dd>
        <dt>Alamat</dt><dd>${esc([x.alamat, x.kota, x.kode_pos].filter(Boolean).join(', ') || '-')}</dd>
        <dt>Kontak darurat</dt><dd>${esc(x.kontak_darurat || '-')}</dd></dl></div></div>
    <div class="card"><div class="card-head"><h3>${icon('idcard')} Identitas & Berkas</h3><button class="btn btn-secondary btn-sm" id="up">${icon('upload')} Unggah</button></div><div class="card-body">
      <dl class="kv"><dt>${esc(x.jenis_identitas || 'Identitas')}</dt><dd class="mono">${esc(maskId(x.no_identitas) || '-')}</dd></dl>
      <div class="mt-3" id="berkas">${x.berkas.length ? x.berkas.map(b => `<div class="file-item"><div class="ext">${fileExt(b.name)}</div><div class="grow"><div class="small bold" style="word-break:break-all">${esc(b.name)}</div><div class="xs mono ink2">${esc(b.jenis || '')} • ${fileSize(b.size)}</div></div><button class="btn btn-ghost btn-icon btn-sm" data-view="${b.id}">${icon('eye')}</button></div>`).join('') : '<div class="small ink2">Belum ada berkas identitas.</div>'}</div></div></div>
    <div class="card"><div class="card-head"><h3>${icon('star')} Preferensi & Catatan</h3></div><div class="card-body small">
      <dl class="kv"><dt>Makanan</dt><dd>${esc(pref.makanan || '-')}</dd><dt>Kursi/Kamar</dt><dd>${esc(pref.kamar || '-')}</dd></dl>
      ${x.catatan ? `<div class="inner mt-3" style="white-space:pre-wrap">${esc(x.catatan)}</div>` : ''}</div></div>
  </div></div>`;
  $$('[data-view]').forEach(b => b.onclick = () => viewFile(b.dataset.view, b));
  $('#up').onclick = async e => {
    const btn = e.currentTarget;
    const ff = await pickFile(); if (!ff) return;
    const jenis = x.jenis_identitas === 'Paspor' ? 'Paspor' : (x.jenis_identitas || 'KTP');
    await withBusy(btn, async () => {
      try { await API.call('uploadCustomerFile', { id: x.id, jenis, file: { name: ff.name, mime: ff.mime, base64: ff.base64 } }); toast('Berkas tersimpan di Google Drive.'); App.route(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };
  if ($('#del')) $('#del').onclick = async () => {
    if (!await confirmDialog({ title: 'Hapus customer?', message: `Data <b>${esc(x.nama)}</b> akan ditandai terhapus (soft delete) dan dapat dipulihkan dari spreadsheet.`, confirmText: 'Hapus', danger: true })) return;
    try { await API.call('deleteCustomer', { id: x.id }); toast('Customer dihapus.'); App.go('#/customers'); } catch (e) { toast(e.message, 'error'); }
  };
};

/* ======================= BOOKING: DAFTAR ======================= */
Pages.bookings = async (c) => {
  const q = c.query;
  const st = { q: q.q || '', id_trip: q.trip || '', status_booking: q.status || '', status_bayar: q.bayar || '', from: q.from || '', to: q.to || '', piutang: q.piutang ? 1 : '', page: 1, size: 10 };
  const trips = await API.cached('listTrips', {}, 120000);
  if (!c.alive()) return;
  c.view.innerHTML = pageHead({
    over: 'Operasional / <b>Daftar Booking</b>', title: 'Daftar Booking',
    desc: 'Kelola reservasi tiket dan tur, pantau status kuota kursi, jatuh tempo tagihan, dan penerbitan dokumen invoice.',
    actions: `<button class="btn btn-secondary" id="b-exp">${icon('download')} Unduh Rekap</button><a class="btn btn-primary" href="#/bookings/new">${icon('plus')} Booking Baru</a>`
  }) + `<div class="stats" id="b-stats"></div>
  <div class="card mt-6"><div class="filters">
    <div class="input-icon">${icon('search')}<input class="input" id="f-q" placeholder="Cari kode booking (TP-xxxx), customer, No. HP..." value="${esc(st.q)}"></div>
    <select class="select" id="f-trip">${opts(trips.rows.map(t => ({ value: t.id, label: t.nama })), st.id_trip, 'Paket Trip: Semua')}</select>
    <select class="select" id="f-status">${opts(['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'], st.status_booking, 'Reservasi: Semua')}</select>
    <select class="select" id="f-bayar">${opts([{ value: 'Lunas', label: 'Lunas' }, { value: 'DP', label: 'DP / Sebagian' }, { value: 'Belum Bayar', label: 'Belum Bayar' }], st.status_bayar, 'Bayar: Semua')}</select>
    <input class="input" type="date" id="f-from" value="${esc(st.from)}" title="Tanggal order dari"><input class="input" type="date" id="f-to" value="${esc(st.to)}" title="sampai">
    <label class="checkbox small"><input type="checkbox" id="f-piutang" ${st.piutang ? 'checked' : ''}> Hanya piutang</label>
    <button class="btn btn-ghost btn-sm" id="f-reset">${icon('refresh', 'ic-sm')} Reset</button>
  </div><div id="b-table" style="border-top:1px solid var(--divider)"></div></div>
  <div class="callout mt-6"><div class="ic-wrap">${icon('info')}</div><div><b>Panduan Operasional Pemesanan</b><div class="small ink2 mt-1">Setiap booking berstatus DP memiliki batas pelunasan <b>H-${App.settings.H_PELUNASAN || 7} keberangkatan</b>. Gunakan tombol WhatsApp di setiap baris untuk mengirim pengingat tagihan langsung ke customer.</div></div></div>`;
  const load = async () => {
    App.setQuery({ q: st.q, trip: st.id_trip, status: st.status_booking, bayar: st.status_bayar, from: st.from, to: st.to, piutang: st.piutang });
    $('#b-table').innerHTML = loadingView();
    const r = await API.call('listBookings', st);
    if (!c.alive()) return;
    const s = r.stats, pct = s.nilai ? Math.round(s.terkumpul / s.nilai * 100) : 0;
    $('#b-stats').innerHTML =
      statCard({ label: 'Total booking bulan ini', value: s.bulan_ini, unit: 'Pemesanan', ic: 'ticket', foot: `<span class="${s.tren >= 0 ? 'c-success' : 'c-danger'}">${icon(s.tren >= 0 ? 'trending-up' : 'trending-down', 'ic-sm')} ${s.tren >= 0 ? '+' : ''}${s.tren}% dari bln lalu</span><span class="mono">${s.peserta_bulan_ini} Peserta</span>` }) +
      statCard({ label: 'Status pembayaran', value: rpShort(s.terkumpul), unit: '/ ' + rpShort(s.nilai), money: true, ic: 'banknote', extra: progress(pct), foot: `<span class="c-primary">${pct}% Terkumpul</span><span class="mono">Piutang ${rpShort(s.piutang)}</span>` }) +
      statCard({ label: 'Menunggu konfirmasi', value: s.menunggu, unit: 'Booking', ic: 'clock', foot: s.jatuh_tempo ? `<span class="chip chip-warn">${icon('alert')} ${s.jatuh_tempo} Jatuh Tempo ≤ 3 hari</span>` : '<span>Tidak ada tagihan mendesak</span>' }) +
      statCard({ label: 'Keberangkatan aktif (30 hari)', value: s.keberangkatan_30, unit: 'Jadwal Trip', ic: 'plane-takeoff', foot: '<a href="#/departures">Lihat kalender ' + icon('arrow-right', 'ic-sm') + '</a>' });
    $('#b-table').innerHTML = r.rows.length ? `<div class="table-wrap"><table class="table"><thead><tr>
      <th class="sortable" data-sort="kode">Kode & Tgl Order</th><th>Customer</th><th>Paket Trip & Destinasi</th><th class="center">Peserta</th><th class="num sortable" data-sort="sisa">Total & Sisa Tagihan</th><th>Status Bayar</th><th>Status Reservasi</th><th></th></tr></thead><tbody>
      ${r.rows.map(b => `<tr class="clickable" data-id="${b.id}">
        <td><div class="code">${esc(b.kode)}</div><div class="sub row">${icon('clock', 'ic-sm')} ${tglJam(b.tanggal)}</div></td>
        <td><div class="bold">${esc(b.customer_nama)}</div><div class="sub mono">${esc(fmtHp(b.customer_hp))} · <span class="tag-mono">${esc(b.customer_kode)}</span></div></td>
        <td><div style="font-weight:500">${esc(b.trip_nama)}</div><div class="sub">${rentang(b.berangkat, b.pulang)}</div><div class="sub c-primary">• ${esc(b.paket_nama || b.trip_tipe)}</div></td>
        <td class="center"><span class="chip chip-neutral mono">${b.jumlah_peserta} Pax</span></td>
        <td class="num"><div class="bold">${rp(b.total)}</div><div class="sub ${b.sisa ? 'c-danger' : 'muted'}">Sisa: ${rp(b.sisa)}</div></td>
        <td>${chipBayar(b.status_bayar)}${b.terlambat ? `<div class="xs c-danger mt-1">Tempo ${tglPendek(b.jatuh_tempo)} terlewat</div>` : ''}</td>
        <td>${chipBooking(b.status_booking)}</td>
        <td class="right nowrap">${b.sisa && b.status_booking !== 'Dibatalkan' ? `<a class="btn btn-ghost btn-icon btn-sm" title="Kirim pengingat WA" target="_blank" rel="noopener" href="${waLink(b.customer_hp, reminderText(b))}" onclick="event.stopPropagation()">${icon('whatsapp')}</a>` : ''}${icon('chevron-right', 'muted')}</td></tr>`).join('')}
      </tbody></table></div>` + pager(r, (p, sz) => { st.page = p; if (sz) st.size = sz; load(); })
      : emptyView('Tidak ada booking yang cocok dengan filter.', 'ticket', '<a class="btn btn-primary" href="#/bookings/new">Buat Booking Baru</a>');
    $$('#b-table tr[data-id]').forEach(tr => tr.onclick = () => App.go('#/bookings/' + tr.dataset.id));
    $$('#b-table th[data-sort]').forEach(th => th.onclick = () => { const k = th.dataset.sort; st.sort = { key: k, dir: st.sort && st.sort.key === k && st.sort.dir === 'desc' ? 'asc' : 'desc' }; load(); });
  };
  const bind = (id, key, ev = 'change') => $(id).addEventListener(ev, e => { st[key] = e.target.type === 'checkbox' ? (e.target.checked ? 1 : '') : e.target.value; st.page = 1; load(); });
  $('#f-q').addEventListener('input', debounce(e => { st.q = e.target.value.trim(); st.page = 1; load(); }, 400));
  bind('#f-trip', 'id_trip'); bind('#f-status', 'status_booking'); bind('#f-bayar', 'status_bayar'); bind('#f-from', 'from'); bind('#f-to', 'to'); bind('#f-piutang', 'piutang');
  $('#f-reset').onclick = () => App.go('#/bookings');
  $('#b-exp').onclick = e => withBusy(e.currentTarget, async () => {
    const r = await API.call('listBookings', { ...st, page: 1, size: 200 });
    downloadCsv('Rekap_Booking_' + today() + '.csv', [['Kode', 'Tanggal Order', 'Customer', 'HP', 'Trip', 'Paket', 'Berangkat', 'Pulang', 'Pax', 'Total', 'Terbayar', 'Sisa', 'Status Bayar', 'Status Booking', 'Jatuh Tempo'],
      ...r.rows.map(b => [b.kode, b.tanggal, b.customer_nama, b.customer_hp, b.trip_nama, b.paket_nama, b.berangkat, b.pulang, b.jumlah_peserta, b.total, b.terbayar, b.sisa, b.status_bayar, b.status_booking, b.jatuh_tempo])]);
  });
  await load();
};

/* ======================= BOOKING: BARU (3 LANGKAH) ======================= */
const ADDON_PRESET = [
  { nama: 'Asuransi Perjalanan', harga: 75000, perPax: true, ket: 'Proteksi evakuasi darurat, kecelakaan & keterlambatan bagasi.' },
  { nama: 'Sewa Alat Snorkeling Pro', harga: 150000, perPax: true, ket: 'Fin, mask & snorkel dry top premium selama trip.' },
  { nama: 'Upgrade Kamar Single', harga: 500000, perPax: false, ket: 'Kamar privat tanpa sharing (per booking).' }
];
Pages.bookingNew = async (c) => {
  const fd = await API.cached('bookingFormData', {}, 30000);
  if (!c.alive()) return;
  const S = { step: 1, customer: null, trip: null, dep: null, price: null, pax: 1, peserta: [], addons: [], diskon: 0,
    scheme: 'dp', nominal: 0, metode: 'Transfer Bank BCA', tanggal: today(), file: null, kirim_email: true, catatan: '' };
  if (c.query.customer) { try { S.customer = await API.call('getCustomer', { id: c.query.customer }); S.step = 2; } catch (e) { /* abaikan */ } }
  if (c.query.departure) {
    const dep = fd.departures.find(d => d.id === c.query.departure);
    if (dep) { S.dep = dep; S.trip = fd.trips.find(t => t.id === dep.id_trip); }
  }
  if (!c.alive()) return;
  const minDp = fd.settings.MIN_DP_PERSEN || 30;

  const calc = () => {
    const p = S.price;
    const sub = p ? (p.satuan === 'trip' ? p.harga : p.harga * S.pax) : 0;
    const add = S.addons.reduce((s, a) => s + a.harga * a.qty, 0);
    const total = Math.max(0, sub + add - S.diskon);
    let bayar = S.scheme === 'lunas' ? total : S.scheme === 'tempo' ? 0 : S.nominal;
    return { sub, add, total, bayar, sisa: Math.max(0, total - bayar), minDp: Math.ceil(total * minDp / 100) };
  };
  const syncAddons = () => S.addons.forEach(a => { if (a.perPax) a.qty = S.pax; });

  const render = () => {
    if (S.scheme === 'dp' && !S.nominalManual && S.price) S.nominal = calc().minDp;
    const k = calc();
    const steps = [['Data Customer & Pemesan', S.customer ? esc(S.customer.nama) + ' — ' + esc(S.customer.kode) : 'Pilih atau tambah customer'],
      ['Paket Trip & Keberangkatan', S.dep ? esc(S.trip.nama.split(' (')[0]) + ' — ' + tglPendek(S.dep.tanggal_berangkat) : 'Pilih trip, jadwal & paket'],
      ['Manifest, Add-ons & DP', 'Data peserta & skema finansial']];
    c.view.innerHTML = `${pageHead({ over: 'Operasional / Booking / <b>Buat Booking Baru</b>', title: 'Buat Booking Baru', badges: '<span class="chip chip-primary">Kode dibuat otomatis saat disimpan</span>',
      actions: `<a class="btn btn-outline" href="#/bookings">${icon('arrow-left')} Batal / Kembali ke Daftar Booking</a>` })}
    <div class="stepper">${steps.map((s, i) => { const n = i + 1, cls = n < S.step ? 'done' : n === S.step ? 'cur' : '';
      return `<div class="step ${cls}" data-step="${n}"><div class="n">${n < S.step ? icon('check') : n}</div><div class="grow"><div class="l1">Langkah ${n}${n < S.step ? ' • Selesai' : n === S.step ? ' • Tahap saat ini' : ''}</div><div class="l2">${s[0]}</div><div class="xs ink2" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s[1]}</div></div></div>`; }).join('')}</div>
    <div class="grid-main mt-6"><div id="step-body" class="stack"></div>
      <div class="sticky"><div class="card"><div class="card-head"><h3>${icon('receipt')} Ringkasan Tagihan</h3><span class="chip chip-neutral">Live Quote</span></div><div class="card-body">
        ${S.price ? `<div class="sum-row"><span><b>${esc(S.trip.nama)}</b><div class="xs mono ink2">${esc(S.price.nama_paket)}<br>${S.price.satuan === 'trip' ? '1 trip (flat)' : S.pax + ' Pax × ' + rp(S.price.harga)}</div></span><span class="v">${rp(k.sub)}</span></div>` : '<div class="small ink2">Pilih paket trip untuk melihat harga.</div>'}
        ${S.addons.map(a => `<div class="sum-row"><span>${esc(a.nama)}<div class="xs mono ink2">${a.qty} × ${rp(a.harga)}</div></span><span class="v">${rp(a.harga * a.qty)}</span></div>`).join('')}
        ${S.diskon ? `<div class="sum-row"><span>Potongan / Diskon</span><span class="v c-success">- ${rp(S.diskon)}</span></div>` : ''}
        <div class="total-box mt-3"><div class="label-xs">Total Nilai Tagihan (IDR)</div><div class="big">${rp(k.total)}</div></div>
        ${S.step === 3 ? `<div class="inner mt-3"><div class="row-between"><span class="label-xs" style="color:var(--danger-ink)">Skema Finansial</span>${chip(S.scheme === 'lunas' ? 'LUNAS' : S.scheme === 'tempo' ? 'TEMPO' : 'DOWN PAYMENT', 'orange')}</div>
          <div class="sum-row mt-2"><span>Bayar Sekarang</span><span class="v">${rp(k.bayar)}</span></div><div class="sum-row"><span>Sisa Piutang</span><span class="v c-danger">${rp(k.sisa)}</span></div></div>
          <button class="btn btn-dark btn-block mt-4" id="submit">${icon('check-circle')} Simpan & Terbitkan Booking</button>` : ''}
        ${S.step > 1 ? `<button class="btn btn-ghost btn-block mt-2" id="prev">${icon('chevron-left')} Kembali ke Langkah ${S.step - 1}</button>` : ''}
        ${S.dep ? `<div class="small ink2 mt-3 row" style="align-items:flex-start">${icon('lock', 'ic-sm')} <span>Kuota dicek ulang & dikunci oleh server saat booking disimpan. Sisa saat ini: <b>${S.dep.sisa} kursi</b> pada ${esc(S.dep.kode)}.</span></div>` : ''}
      </div></div></div></div>`;
    $$('.step.done').forEach(s => s.onclick = () => { S.step = Number(s.dataset.step); render(); });
    if ($('#prev')) $('#prev').onclick = () => { S.step--; render(); };
    if ($('#submit')) $('#submit').onclick = submit;
    [step1, step2, step3][S.step - 1]();
  };

  /* --- Langkah 1: customer --- */
  const step1 = () => {
    $('#step-body').innerHTML = `<div class="card"><div class="card-head"><div><h3>${icon('user')} Pilih Pemesan / Customer</h3><div class="sub">Cari berdasarkan nama, No. HP, atau kode customer</div></div>
      <button class="btn btn-secondary btn-sm" id="new-c">${icon('user-plus')} Customer Baru</button></div><div class="card-body">
      <div class="input-icon">${icon('search')}<input class="input" id="cq" placeholder="Ketik minimal 2 huruf..." autocomplete="off"></div>
      <div id="cres" class="mt-4"></div></div></div>`;
    const show = rows => {
      $('#cres').innerHTML = rows.length ? rows.map(x => `<div class="feed-item" data-id="${x.id}"><div class="row">${avatar(x.nama, 'sm')}<div><div class="bold">${esc(x.nama)}</div><div class="xs mono ink2">${esc(x.kode)} • ${esc(fmtHp(x.hp))}${x.email ? ' • ' + esc(x.email) : ''}</div></div></div>
        <div class="row">${x.sisa_tagihan ? chip('Sisa ' + rpShort(x.sisa_tagihan), 'warn') : ''}${chip(x.kategori, 'primary')}${icon('chevron-right', 'muted')}</div></div>`).join('') : emptyView('Customer tidak ditemukan. Tambahkan sebagai customer baru.', 'user-plus');
      $$('#cres [data-id]').forEach(el => el.onclick = async () => {
        el.style.opacity = '.5';
        try { S.customer = await API.call('getCustomer', { id: el.dataset.id }); S.step = 2; render(); } catch (e) { toast(e.message, 'error'); el.style.opacity = ''; }
      });
    };
    const search = debounce(async q => { $('#cres').innerHTML = loadingView('Mencari...'); const r = await API.call('listCustomers', { q, size: 8 }); show(r.rows); }, 350);
    $('#cq').oninput = e => search(e.target.value.trim());
    API.call('listCustomers', { size: 6 }).then(r => { if ($('#cres') && !$('#cq').value) show(r.rows); });
    $('#new-c').onclick = () => quickCustomer(cu => { S.customer = cu; S.step = 2; render(); });
    setTimeout(() => $('#cq') && $('#cq').focus(), 50);
  };

  /* --- Langkah 2: trip, jadwal, paket --- */
  const step2 = () => {
    const trips = fd.trips.filter(t => t.prices.length);
    const deps = S.trip ? fd.departures.filter(d => d.id_trip === S.trip.id) : [];
    $('#step-body').innerHTML = `<div class="card"><div class="card-head"><div><h3>${icon('compass')} Pilih Paket Wisata</h3><div class="sub">Hanya trip berstatus aktif yang memiliki harga</div></div></div><div class="card-body"><div class="opt-grid">
      ${trips.map(t => `<label class="opt-card ${S.trip && S.trip.id === t.id ? 'on' : ''}" data-trip="${t.id}"><input type="radio" name="trip" ${S.trip && S.trip.id === t.id ? 'checked' : ''}>
        <div class="tag-mono">${esc(t.kode)}</div><div class="bold mt-2" style="padding-right:22px">${esc(t.nama)}</div><div class="xs ink2 mt-1">${esc(t.destinasi)} • ${esc(t.durasi)}</div>
        <div class="row-between mt-3"><span class="mono small c-primary">${rpShort(t.harga_min)}${t.harga_max > t.harga_min ? ' – ' + rpShort(t.harga_max) : ''}</span>${chip(t.jadwal_aktif + ' jadwal', t.jadwal_aktif ? 'success' : 'neutral')}</div></label>`).join('') || emptyView('Belum ada trip aktif dengan harga.', 'compass')}
    </div></div></div>
    ${S.trip ? `<div class="card"><div class="card-head"><div><h3>${icon('calendar')} Jadwal & Batch Keberangkatan</h3><div class="sub">${esc(S.trip.nama)}</div></div>
      <button class="btn btn-secondary btn-sm" id="add-dep">${icon('plus')} Jadwal Baru</button></div><div class="card-body"><div class="opt-grid">
      ${deps.length ? deps.map(d => { const dis = d.sisa <= 0; return `<label class="opt-card ${S.dep && S.dep.id === d.id ? 'on' : ''} ${dis ? 'disabled' : ''}" data-dep="${d.id}"><input type="radio" name="dep" ${S.dep && S.dep.id === d.id ? 'checked' : ''} ${dis ? 'disabled' : ''}>
        <div class="bold">${rentang(d.tanggal_berangkat, d.tanggal_pulang)}</div><div class="xs mono ink2 mt-1">${esc(d.kode)}${d.tour_leader ? ' • TL ' + esc(d.tour_leader) : ''}</div>
        <div class="row-between mt-3"><span class="mono small">${d.terisi}/${d.kuota} terisi</span>${chipDep(d)}</div>${progress(d.okupansi, 'mt-2')}</label>`; }).join('') : '<div class="small ink2">Belum ada jadwal terbuka untuk trip ini. Tambahkan jadwal baru.</div>'}
    </div></div></div>` : ''}
    ${S.dep ? `<div class="card"><div class="card-head"><div><h3>${icon('tag')} Varian / Tier Harga</h3><div class="sub">Harga dihitung ulang oleh server saat disimpan</div></div></div><div class="card-body"><div class="opt-grid">
      ${S.trip.prices.map(p => `<label class="opt-card ${S.price && S.price.id === p.id ? 'on' : ''}" data-price="${p.id}"><input type="radio" name="price" ${S.price && S.price.id === p.id ? 'checked' : ''}>
        <div class="tag-mono">${esc(p.kode)}</div><div class="bold mt-2" style="padding-right:22px">${esc(p.nama_paket)}</div><div class="xs ink2">${esc(p.tipe)}${p.min_pax ? ' • min ' + p.min_pax + ' pax' : ''}</div>
        <div class="mono bold c-primary mt-2">${rp(p.harga)} <span class="xs ink2">/ ${esc(p.satuan)}</span></div>${p.status === 'On Request' ? chip('On Request', 'warn') : ''}</label>`).join('')}
    </div></div><div class="card-foot" style="justify-content:flex-end"><button class="btn btn-primary" id="next2" ${S.price ? '' : 'disabled'}>Lanjut ke Manifest & Pembayaran ${icon('arrow-right')}</button></div></div>` : ''}`;
    $$('[data-trip]').forEach(el => el.onclick = e => { e.preventDefault(); const t = fd.trips.find(x => x.id === el.dataset.trip); if (S.trip !== t) { S.trip = t; S.dep = null; S.price = null; } render(); });
    $$('[data-dep]').forEach(el => el.onclick = e => { e.preventDefault(); const d = fd.departures.find(x => x.id === el.dataset.dep); if (d.sisa <= 0) return; S.dep = d; if (S.pax > d.sisa) S.pax = d.sisa; render(); });
    $$('[data-price]').forEach(el => el.onclick = e => { e.preventDefault(); S.price = S.trip.prices.find(x => x.id === el.dataset.price); if (S.price.min_pax && S.pax < S.price.min_pax) S.pax = Math.min(S.price.min_pax, S.dep.sisa); syncAddons(); render(); });
    if ($('#add-dep')) $('#add-dep').onclick = () => departureForm({ id_trip: S.trip.id }, async dep => {
      API.clear(); const nfd = await API.cached('bookingFormData', {}, 30000); Object.assign(fd, nfd);
      S.trip = fd.trips.find(t => t.id === dep.id_trip); S.dep = fd.departures.find(d => d.id === dep.id) || null; render();
    });
    if ($('#next2')) $('#next2').onclick = () => { S.step = 3; render(); };
  };

  /* --- Langkah 3: manifest, add-on, pembayaran --- */
  const step3 = () => {
    if (!S.customer) { S.step = 1; return render(); }
    if (!S.price) { S.step = 2; return render(); }
    while (S.peserta.length < S.pax) S.peserta.push({ nama: S.peserta.length === 0 ? S.customer.nama : '', hubungan: S.peserta.length === 0 ? 'Pemesan Utama' : '', gender: '', usia: '', identitas: '', catatan: '' });
    S.peserta.length = S.pax;
    const k = calc();
    if (S.scheme === 'dp' && !S.nominalManual) S.nominal = k.minDp;
    const hasEmail = !!S.customer.email;
    $('#step-body').innerHTML = `
    <div class="card"><div class="card-head tinted"><div><div class="label-xs">Langkah 3 · Formulir Isian Final</div><h3 class="mt-1" style="font-size:20px">${icon('file-text')} Rincian Peserta, Layanan & Pembayaran</h3></div>${chip('Reservasi Terproteksi', 'success', 'shield-check')}</div>
      <div class="card-body"><div class="row-between"><h3 style="font-size:16px"><span class="tag-mono">3A</span> Manifest Peserta</h3><span class="small ink2">Sisa kursi: <b>${S.dep.sisa}</b></span></div>
        <div class="row wrap mt-3 gap-lg"><div class="field"><label>Jumlah Kuota Dipesan (Pax) <span class="req">*</span></label>
          <div class="qty"><button type="button" id="pax-m">${icon('minus')}</button><input id="pax" value="${S.pax}" inputmode="numeric"><button type="button" id="pax-p">${icon('plus')}</button></div></div>
          <div class="small ink2" style="max-width:360px">Peserta #01 otomatis diisi dari data pemesan. Nama wajib sesuai KTP/Paspor untuk manifest.</div></div>
        <div class="mt-4" id="pax-list">${S.peserta.map((p, i) => `<div class="pax-card"><div class="row-between"><div class="row"><span class="pax-badge">PAX #${String(i + 1).padStart(2, '0')}</span><b class="small">${i === 0 ? 'Peserta Utama (Pemesan)' : 'Peserta Tambahan'}</b></div></div>
          <div class="form-grid mt-3">${field('Nama Lengkap Sesuai ID', `<input class="input" data-p="${i}" data-k="nama" value="${esc(p.nama)}" style="text-transform:uppercase">`, { cls: 'c-4', req: true })}
          ${field('Hubungan', `<input class="input" data-p="${i}" data-k="hubungan" value="${esc(p.hubungan)}" placeholder="Istri / Anak / Teman">`, { cls: 'c-3' })}
          ${field('Gender', `<select class="select" data-p="${i}" data-k="gender">${opts(['L', 'P'], p.gender, '-')}</select>`, { cls: 'c-2', })}
          ${field('Usia', `<input class="input mono" data-p="${i}" data-k="usia" value="${esc(p.usia)}" inputmode="numeric" placeholder="th">`, { cls: 'c-3' })}
          ${field('No. KTP / Paspor', `<input class="input mono" data-p="${i}" data-k="identitas" value="${esc(p.identitas)}">`, { cls: 'c-4' })}
          ${field('Catatan Khusus / Makanan / Medis', `<input class="input" data-p="${i}" data-k="catatan" value="${esc(p.catatan)}" placeholder="Vegetarian, mabuk laut ringan, dll">`, { cls: 'c-8' })}</div></div>`).join('')}</div>

        <div class="label-xs mt-6">Layanan Tambahan (Add-on Services)</div>
        <div class="opt-grid mt-2">${ADDON_PRESET.map((a, i) => { const on = S.addons.find(x => x.nama === a.nama);
          return `<label class="opt-card ${on ? 'on' : ''}" data-addon="${i}"><input type="checkbox" ${on ? 'checked' : ''}><div class="bold small" style="padding-right:24px">${esc(a.nama)}</div><div class="mono small c-primary">+${rp(a.harga)}${a.perPax ? ' /pax' : ''}</div><div class="xs ink2 mt-1">${esc(a.ket)}</div></label>`; }).join('')}</div>
        <div class="form-grid mt-3">
          ${field('Add-on lain (nama)', '<input class="input" id="ao-n" placeholder="mis. Dokumentasi drone privat">', { cls: 'c-6' })}
          ${field('Harga', moneyInput('ao_h', '', 'id="ao-h"'), { cls: 'c-4' })}
          <div class="c-2" style="display:flex;align-items:flex-end"><button class="btn btn-outline btn-block" id="ao-add" type="button">${icon('plus')} Tambah</button></div>
          ${field('Potongan / Diskon / Kode Promo', moneyInput('diskon', S.diskon, 'id="disk"'), { cls: 'c-6' })}
        </div>
      </div></div>

    <div class="card"><div class="card-body"><div class="row-between"><h3 style="font-size:16px"><span class="tag-mono">3B</span> Skema Finansial & Metode Pembayaran</h3><span class="chip chip-neutral">Mata Uang: IDR</span></div>
      <div class="opt-grid mt-4" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        ${[['lunas', 'Langsung Lunas', 'Pembayaran 100% penuh di muka.', 'Total Bayar Sekarang', k.total],
          ['dp', 'Down Payment (DP)', 'Minimal DP ' + minDp + '% atau nominal fleksibel.', 'Batas Minimum (' + minDp + '%)', k.minDp],
          ['tempo', 'Belum Bayar (Tempo)', 'Terbitkan booking, pembayaran menyusul.', 'Bayar Sekarang', 0]].map(([v, t, d, l, n]) =>
          `<label class="opt-card ${S.scheme === v ? 'on' : ''}" data-scheme="${v}"><input type="radio" name="scheme" ${S.scheme === v ? 'checked' : ''}>${v === 'dp' ? '<span class="chip chip-orange" style="position:absolute;top:-10px;left:12px">REKOMENDASI</span>' : ''}
          <div class="bold" style="padding-right:24px">${t}</div><div class="xs ink2 mt-1">${d}</div><div class="xs ink2 mt-3">${l}</div><div class="mono bold">${rp(n)}</div></label>`).join('')}
      </div>
      ${S.scheme !== 'tempo' ? `<div class="form-grid mt-4">
        ${field('Nominal Pembayaran yang Diterima', moneyInput('nominal', k.bayar, 'id="nom" ' + (S.scheme === 'lunas' ? 'readonly' : '')), { cls: 'c-6', req: true, right: k.total ? 'Persentase: ' + (Math.round(k.bayar / k.total * 1000) / 10) + '%' : '', hint: S.scheme === 'dp' && k.bayar < k.minDp ? '<span class="c-danger">Di bawah minimal DP ' + minDp + '% (' + rp(k.minDp) + ').</span>' : 'Sesuai mutasi rekening atau slip transfer.' })}
        ${field('Metode Penerimaan Dana', `<select class="select" id="met">${opts(['Transfer Bank BCA', 'Transfer Bank Mandiri', 'Transfer Bank BRI', 'Transfer Bank BNI', 'QRIS', 'Tunai', 'Lainnya'], S.metode)}</select>`, { cls: 'c-6', hint: 'Tercatat otomatis ke Buku Kas sebagai pemasukan.' })}
        ${field('Tanggal Pembayaran', `<input class="input" type="date" id="tglbayar" value="${S.tanggal}">`, { cls: 'c-6' })}
        <div class="c-6 field"><label>Bukti Transfer / Slip Setoran <small class="muted">PDF, PNG, JPG · maks 5 MB</small></label>
          ${S.file ? `<div class="file-item"><div class="ext">${fileExt(S.file.name)}</div><div class="grow"><div class="small bold">${esc(S.file.name)}</div><div class="xs mono ink2">${fileSize(S.file.size)} • siap diunggah</div></div><button type="button" class="btn btn-ghost btn-icon btn-sm" id="rm-file">${icon('trash')}</button></div>`
            : `<button type="button" class="btn btn-outline" id="pick-file">${icon('upload')} Pilih Berkas Bukti</button>`}</div>
      </div>` : ''}
      <div class="grid-2 mt-4"><div class="inner row"><div class="ico" style="color:var(--primary-700)">${icon('banknote')}</div><div><div class="label-xs">Sisa Pelunasan Booking</div><div class="mono bold c-danger" style="font-size:18px">${rp(k.sisa)}</div></div></div>
        <div class="inner row"><div style="color:var(--primary-700)">${icon('clock')}</div><div><div class="label-xs">Jatuh Tempo Pelunasan</div><div class="bold">${tgl(maxDate(addDays(S.dep.tanggal_berangkat, -(fd.settings.H_PELUNASAN || 7)), today()))} <span class="small ink2">(H-${fd.settings.H_PELUNASAN || 7})</span></div></div></div></div>
    </div></div>

    <div class="card"><div class="card-body"><h3 style="font-size:16px"><span class="tag-mono">3C</span> Notifikasi & Catatan</h3>
      <div class="grid-2 mt-4"><label class="opt-card ${S.kirim_email && hasEmail ? 'on' : ''} ${hasEmail ? '' : 'disabled'}" id="em-card"><input type="checkbox" id="em" ${S.kirim_email && hasEmail ? 'checked' : ''} ${hasEmail ? '' : 'disabled'}>
        <div class="bold small row">${icon('mail', 'ic-sm')} Email Invoice & Konfirmasi Otomatis</div><div class="xs ink2 mt-1">${hasEmail ? 'PDF invoice dikirim ke <b>' + esc(S.customer.email) + '</b>' : 'Customer belum memiliki email.'}</div></label>
        <div class="opt-card" style="cursor:default"><div class="bold small row">${icon('whatsapp', 'ic-sm')} Pengingat WhatsApp</div><div class="xs ink2 mt-1">Setelah tersimpan, kirim ringkasan & pengingat tempo ke <b>${esc(fmtHp(S.customer.hp))}</b> dari halaman detail.</div></div></div>
      ${field('Catatan Booking (internal)', `<textarea class="textarea" id="cat" rows="2" placeholder="Permintaan khusus, info penjemputan, dsb.">${esc(S.catatan)}</textarea>`, { cls: 'mt-4' })}
    </div></div>`;
    bindMoney($('#step-body'));
    $$('[data-p]').forEach(el => el.oninput = el.onchange = () => { S.peserta[el.dataset.p][el.dataset.k] = el.value; });
    const setPax = n => { n = Math.max(1, Math.min(S.dep.sisa, n || 1)); if (n !== S.pax) { S.pax = n; syncAddons(); render(); } };
    $('#pax-m').onclick = () => setPax(S.pax - 1); $('#pax-p').onclick = () => { if (S.pax >= S.dep.sisa) toast('Kuota tersisa hanya ' + S.dep.sisa + ' kursi.', 'error'); setPax(S.pax + 1); };
    $('#pax').onchange = e => setPax(Number(e.target.value));
    $$('[data-addon]').forEach(el => el.onclick = e => {
      e.preventDefault(); const a = ADDON_PRESET[el.dataset.addon];
      const i = S.addons.findIndex(x => x.nama === a.nama);
      if (i >= 0) S.addons.splice(i, 1); else S.addons.push({ nama: a.nama, harga: a.harga, qty: a.perPax ? S.pax : 1, perPax: a.perPax });
      render();
    });
    $('#ao-add').onclick = () => { const n = $('#ao-n').value.trim(), h = moneyVal($('#ao-h').value); if (!n || !h) return toast('Isi nama & harga add-on.', 'error'); S.addons.push({ nama: n, harga: h, qty: 1 }); render(); };
    $('#disk').onchange = e => { S.diskon = moneyVal(e.target.value); render(); };
    $$('[data-scheme]').forEach(el => el.onclick = e => { e.preventDefault(); S.scheme = el.dataset.scheme; S.nominalManual = false; S.nominal = S.scheme === 'dp' ? calc().minDp : 0; render(); });
    if ($('#nom')) $('#nom').onchange = e => { S.nominal = Math.min(moneyVal(e.target.value), calc().total); S.nominalManual = true; render(); };
    if ($('#met')) $('#met').onchange = e => S.metode = e.target.value;
    if ($('#tglbayar')) $('#tglbayar').onchange = e => S.tanggal = e.target.value;
    if ($('#pick-file')) $('#pick-file').onclick = async () => { const ff = await pickFile(); if (ff) { S.file = ff; render(); } };
    if ($('#rm-file')) $('#rm-file').onclick = () => { S.file = null; render(); };
    if ($('#em')) $('#em').onchange = e => { S.kirim_email = e.target.checked; $('#em-card').classList.toggle('on', e.target.checked); };
    $('#cat').oninput = e => S.catatan = e.target.value;
  };

  const submit = async () => {
    const k = calc();
    if (S.peserta.some(p => !p.nama.trim())) { toast('Nama setiap peserta wajib diisi.', 'error'); $$('[data-k="nama"]').forEach(el => el.classList.toggle('invalid', !el.value.trim())); return; }
    if (S.scheme === 'dp' && (!k.bayar || k.bayar >= k.total)) { toast('Nominal DP harus lebih dari 0 dan kurang dari total. Pilih "Langsung Lunas" untuk pembayaran penuh.', 'error'); return; }
    if (S.scheme === 'dp' && k.bayar < k.minDp && !await confirmDialog({ title: 'DP di bawah minimal', message: `Nominal DP ${rp(k.bayar)} di bawah minimal ${minDp}% (${rp(k.minDp)}). Tetap simpan?`, confirmText: 'Tetap Simpan' })) return;
    const payload = {
      id_customer: S.customer.id, id_departure: S.dep.id, id_price: S.price.id, jumlah_peserta: S.pax,
      addons: S.addons.map(a => ({ nama: a.nama, harga: a.harga, qty: a.qty })), diskon: S.diskon, peserta: S.peserta, catatan: S.catatan,
      kirim_email: S.kirim_email && !!S.customer.email,
      pembayaran: k.bayar > 0 ? { nominal: k.bayar, jenis: k.bayar >= k.total ? 'Pelunasan' : 'DP', metode: S.metode, tanggal: S.tanggal,
        file: S.file ? { name: S.file.name, mime: S.file.mime, base64: S.file.base64 } : null } : null
    };
    await withBusy($('#submit'), async () => {
      try {
        const r = await API.call('createBooking', payload, { invalidate: true });
        toast(`Booking ${r.kode} berhasil diterbitkan${r.email_terkirim ? ' & email konfirmasi terkirim' : ''}.`);
        App.go('#/bookings/' + r.id);
      } catch (e) {
        toast(e.message, 'error');
        if (e.code === 409) { API.clear(); Object.assign(fd, await API.cached('bookingFormData')); S.dep = fd.departures.find(d => d.id === S.dep.id) || null; if (!S.dep) S.step = 2; render(); }
      }
    });
  };
  render();
};
function maxDate(a, b) { return a > b ? a : b; }

function quickCustomer(onDone) {
  const m = modal({ title: 'Tambah Customer Baru', sub: 'Data singkat — lengkapi profil & berkas KTP nanti di menu Customer.',
    body: `<form id="qc" class="form-grid" novalidate>
      ${field('Nama Lengkap (sesuai KTP)', '<input class="input" name="nama" required style="text-transform:uppercase">', { req: true })}
      ${field('No. HP / WhatsApp', '<input class="input mono" name="hp" required inputmode="tel" placeholder="0812...">', { req: true, cls: 'c-6' })}
      ${field('Email', '<input class="input" type="email" name="email">', { cls: 'c-6' })}
      ${field('Kategori', `<select class="select" name="kategori">${opts(CUST_KATEGORI, 'Individual')}</select>`, { cls: 'c-6' })}
      ${field('Kota', '<input class="input" name="kota">', { cls: 'c-6' })}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="qc-save">Simpan & Pilih</button>' });
  m.$('#qc-save').onclick = e => {
    const f = m.$('#qc'); if (!validate(f)) return;
    withBusy(e.currentTarget, async () => {
      try { const r = await API.call('saveCustomer', formData(f)); toast('Customer ' + r.kode + ' ditambahkan.'); m.close(); onDone(await API.call('getCustomer', { id: r.id })); }
      catch (err) { toast(err.message, 'error'); }
    });
  };
}

/* ======================= BOOKING: DETAIL ======================= */
Pages.bookingDetail = async (c) => {
  const b = await API.call('getBooking', { id: c.params[0] });
  if (!c.alive()) return;
  const dep = b.departure || {}, admin = App.isAdmin(), batal = b.status_booking === 'Dibatalkan';
  const pct = b.total ? Math.round(b.terbayar / b.total * 100) : 0;
  const late = b.terlambat, hTempo = b.jatuh_tempo ? daysBetween(today(), b.jatuh_tempo) : null;
  const peserta = b.peserta.length ? b.peserta : [{ nama: b.customer_nama, hubungan: 'Pemesan Utama' }];
  const lengkap = b.peserta.filter(p => p.nama && p.identitas).length;
  c.view.innerHTML = `
  <div class="page-head"><div class="grow"><div class="over">Operasional / Booking / <b>${esc(b.kode)}</b></div>
    <h1>Detail Reservasi: <span class="mono">${esc(b.kode)}</span></h1>
    <div class="row wrap mt-3">${chipBooking(b.status_booking)} ${chipBayar(b.status_bayar)}
      ${b.sisa && !batal ? chip('Sisa Piutang: ' + rp(b.sisa) + ' (Jatuh Tempo ' + tgl(b.jatuh_tempo) + ')', late ? 'danger' : 'warn', 'calendar') : ''}</div></div>
    <div class="actions"><a class="btn btn-outline" href="#/bookings">${icon('arrow-left')} Kembali ke Daftar</a>
      <a class="btn btn-outline" href="#/bookings/${b.id}/doc">${icon('printer')} Cetak Invoice</a>
      <button class="btn btn-outline" id="chg-status">${icon('refresh')} Ubah Status</button>
      ${admin ? `<button class="btn btn-danger btn-icon" id="del-b" title="Hapus booking">${icon('trash')}</button>` : ''}
      ${b.sisa && !batal ? `<button class="btn btn-dark" id="go-pay">${icon('card')} + Catat Pelunasan</button>` : ''}</div></div>
  ${batal ? `<div class="callout callout-danger mb-4" style="margin-bottom:20px"><div class="ic-wrap">${icon('x-circle')}</div><div><b>Booking dibatalkan</b><div class="small ink2 mt-1">Kursi sudah dikembalikan ke kuota jadwal. Pembayaran yang sudah masuk tetap tercatat; proses refund dicatat manual di Transaksi Keuangan oleh Admin.</div></div></div>` : ''}
  <div class="info-cards">
    <div class="card card-body"><div class="row-between"><span class="label-xs">${icon('calendar', 'ic-sm')} Jadwal & Trip</span>${dep.tanggal_berangkat ? chip('H-' + Math.max(0, daysBetween(today(), dep.tanggal_berangkat)), 'primary') : ''}</div>
      <div class="bold mt-2">${esc(b.trip_nama)}</div><div class="small ink2 mt-1">${rentang(b.berangkat, b.pulang)}</div>
      <div class="small ink2 mt-1">TL: <b>${esc(dep.tour_leader || '-')}</b></div><div class="inner mt-3 small">Armada: <b>${esc(dep.armada || '-')}</b></div></div>
    <div class="card card-body"><div class="row-between"><span class="label-xs">${icon('user', 'ic-sm')} Customer / Pemesan</span><span class="tag-mono">${esc(b.customer_kode)}</span></div>
      <a class="row mt-2" href="#/customers/${b.id_customer}" style="color:inherit">${avatar(b.customer_nama, 'sm')}<div><div class="bold">${esc(b.customer_nama)}</div><div class="xs ink2">${esc(b.customer.kategori || 'Individual')}</div></div></a>
      <div class="small mt-2 row">${icon('phone', 'ic-sm')} <span class="mono">${esc(fmtHp(b.customer_hp))}</span></div><div class="small row mt-1">${icon('mail', 'ic-sm')} ${esc(b.customer_email || '-')}</div>
      <div class="inner mt-3 small row-between"><span>Verifikasi Identitas</span>${b.customer.berkas_count ? chip('Ada berkas', 'success', 'check-circle') : chip('Belum ada', 'warn')}</div></div>
    <div class="card card-body"><div class="row-between"><span class="label-xs">${icon('receipt', 'ic-sm')} Status Tagihan</span>${late ? chip('Terlewat ' + Math.abs(hTempo) + ' hari', 'danger') : ''}</div>
      <div class="label-xs mt-2" style="text-transform:none;letter-spacing:0">Sisa tagihan (due)</div><div class="mono bold c-danger" style="font-size:20px">${rp(b.sisa)}</div>
      <div class="row-between small mt-2"><span>Terbayar: <b class="mono">${rp(b.terbayar)}</b></span><span class="mono">${pct}%</span></div>${progress(pct, 'mt-1')}
      <div class="inner mt-3 small row-between"><span>Batas Akhir</span><b class="mono ${late ? 'c-danger' : ''}">${tgl(b.jatuh_tempo)}</b></div></div>
    <div class="card card-body"><div class="row-between"><span class="label-xs">${icon('users', 'ic-sm')} Kesiapan Lapangan</span><b class="c-primary">${b.peserta.length}/${b.jumlah_peserta} Pax</b></div>
      <dl class="kv mt-3"><dt>Batch</dt><dd class="mono">${esc(dep.kode || '-')}</dd><dt>Paket</dt><dd>${esc(b.paket_nama)}</dd><dt>Manifest</dt><dd>${lengkap === b.jumlah_peserta ? chip('Lengkap', 'success') : chip(lengkap + '/' + b.jumlah_peserta + ' ber-ID', 'warn')}</dd></dl>
      <div class="inner mt-3 small">Meeting point: <b>${esc(dep.meeting_point || '-')}</b></div></div>
  </div>
  <div class="grid-main mt-6"><div class="stack">
    <div class="tabs"><button class="tab on" data-tab="1">${icon('ship')} 1. Rincian Layanan & Manifest Peserta</button><button class="tab" data-tab="2">${icon('file-text')} 2. Riwayat Transaksi & Bukti Bayar (${b.payments.length})</button></div>
    <div id="tab1" class="stack">
      <div class="card"><div class="card-head tinted"><h3>${icon('compass')} Paket Perjalanan & Spesifikasi Layanan</h3><span class="tag-mono">BATCH: ${esc(dep.kode || '-')}</span></div><div class="card-body">
        <div class="grid-2"><div class="inner"><div class="label-xs">${icon('pin', 'ic-sm')} Titik Kumpul</div><div class="bold mt-1">${esc(dep.meeting_point || '-')}</div><div class="small ink2">${tgl(b.berangkat)}</div></div>
          <div class="inner"><div class="label-xs">${icon('tag', 'ic-sm')} Paket & Harga</div><div class="bold mt-1">${esc(b.paket_nama)}</div><div class="small mono ink2">${b.jumlah_peserta} × ${rp(b.harga_satuan)}</div></div></div>
        ${b.addons.length ? `<div class="label-xs mt-4">Layanan Tambahan</div><div class="feat mt-2">${b.addons.map(a => `<span>${icon('plus-circle', 'ic-sm')} ${esc(a.nama)} × ${a.qty}</span>`).join('')}</div>` : ''}
        ${b.trip && b.trip.include.length ? `<div class="label-xs mt-4">${icon('check-circle', 'ic-sm')} Fasilitas Termasuk</div><div class="feat mt-2">${b.trip.include.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        ${b.catatan ? `<div class="inner mt-4 small"><b>Catatan:</b> ${esc(b.catatan)}</div>` : ''}</div></div>
      <div class="card"><div class="card-head"><div><h3>${icon('users')} Daftar Manifest Peserta (${b.jumlah_peserta} Pax)</h3><div class="sub">Sesuai KTP / Paspor untuk tiket & manifest kapal/hotel</div></div>
        <div class="row">${!batal ? `<button class="btn btn-outline btn-sm" id="edit-pax">${icon('edit', 'ic-sm')} Ubah Data Peserta</button>` : ''}<button class="btn btn-secondary btn-sm" id="exp-pax">${icon('download', 'ic-sm')} Ekspor (.csv)</button></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>No</th><th>Nama Lengkap Sesuai KTP</th><th>Relasi</th><th>Gender & Usia</th><th>No. Identitas</th><th>Catatan Medis / Alergi</th><th>Status Dokumen</th></tr></thead><tbody>
        ${peserta.map((p, i) => `<tr><td class="mono">${String(i + 1).padStart(2, '0')}</td><td><div class="bold">${esc(p.nama)}</div><div class="sub mono">PAX-ID: ${esc(b.kode.replace(/^\w+-/, ''))}-${String(i + 1).padStart(2, '0')}</div></td>
          <td>${i === 0 ? chip(p.hubungan || 'Pemesan Utama', 'primary') : esc(p.hubungan || '-')}</td><td class="small">${esc([p.gender, p.usia ? p.usia + ' Thn' : ''].filter(Boolean).join(' / ') || '-')}</td>
          <td class="mono small">${esc(maskId(p.identitas) || '-')}</td><td class="small">${p.catatan ? chip(p.catatan, 'warn') : '<span class="muted">-</span>'}</td><td>${p.identitas ? chip('ID Valid', 'success', 'check-circle') : chip('Belum ada ID', 'neutral')}</td></tr>`).join('')}
        </tbody></table></div></div></div>
    <div id="tab2" class="stack hidden">
      <div class="card"><div class="card-head"><div><h3>${icon('landmark')} Riwayat Pembayaran Customer & Mutasi Kas</h3><div class="sub">Setiap pembayaran otomatis tercatat sebagai pemasukan di Buku Kas</div></div><span class="chip chip-neutral">${b.payments.length} Transaksi</span></div>
        ${late && b.sisa ? `<div class="card-body" style="padding-bottom:0"><div class="callout callout-danger"><div class="ic-wrap">${icon('alert')}</div><div><b class="c-danger">Peringatan Jatuh Tempo</b><div class="small mt-1">Sisa tagihan ${rp(b.sisa)} telah melewati jatuh tempo (${tgl(b.jatuh_tempo)}). Keberangkatan dalam ${Math.max(0, daysBetween(today(), b.berangkat))} hari. Segera konfirmasi pelunasan ke pemesan.</div></div></div></div>` : ''}
        ${b.payments.length ? `<div class="table-wrap mt-3"><table class="table"><thead><tr><th>ID Transaksi</th><th>Tanggal</th><th>Jenis Bayar</th><th class="num">Nominal</th><th>Metode</th><th>Dicatat</th><th>Bukti Bayar</th>${admin ? '<th></th>' : ''}</tr></thead><tbody>
          ${b.payments.map(p => `<tr><td class="code">${esc(p.kode)}</td><td class="small mono">${tgl(p.tanggal)}<div class="sub">${esc(String(p.dicatat_pada).slice(11))} WIB</div></td><td>${chip(p.jenis, p.jenis === 'Pelunasan' ? 'success' : 'warn')}</td>
            <td class="num bold">${rp(p.nominal)}</td><td class="small">${esc(p.metode)}</td><td class="small">${esc(p.dicatat_oleh)}</td>
            <td>${p.bukti.length ? p.bukti.map(f => `<button class="btn btn-secondary btn-xs" data-view="${f.id}">${icon('file', 'ic-sm')} ${esc(f.name.slice(0, 18))}</button>`).join('') : '<span class="muted small">—</span>'}</td>
            ${admin ? `<td><button class="btn btn-ghost btn-icon btn-sm" data-delpay="${p.id}" title="Hapus pembayaran">${icon('trash')}</button></td>` : ''}</tr>`).join('')}
        </tbody></table></div>` : emptyView('Belum ada pembayaran tercatat untuk booking ini.', 'banknote')}</div></div>
  </div>
  <div class="stack">
    <div class="card"><div class="card-head"><h3>${icon('receipt')} Rangkuman Finansial</h3><span class="mono small ink2">IDR (Rp)</span></div><div class="card-body">
      <div class="sum-row"><span>${esc(b.paket_nama)} (${b.jumlah_peserta} Pax)</span><span class="v">${rp(b.total - b.biaya_tambahan + b.diskon)}</span></div>
      ${b.addons.map(a => `<div class="sum-row"><span>${esc(a.nama)} (${a.qty})</span><span class="v">${rp(a.harga * a.qty)}</span></div>`).join('')}
      ${b.diskon ? `<div class="sum-row"><span>Diskon</span><span class="v c-success">- ${rp(b.diskon)}</span></div>` : ''}
      <div class="sum-row bold" style="border-top:1px solid var(--divider);margin-top:6px;padding-top:10px"><span>TOTAL HARGA KONTRAK</span><span class="v">${rp(b.total)}</span></div>
      <div class="sum-row ink2"><span>Pembayaran Diterima</span><span class="v">- ${rp(b.terbayar)}</span></div>
      <div class="total-box mt-3 center"><div class="label-xs" style="color:var(--danger-ink)">Sisa Pelunasan (Balance Due)</div><div class="big">${rp(b.sisa)}</div>
        ${b.sisa ? `<div class="small ${late ? 'c-danger' : 'ink2'} mt-1">${icon('calendar', 'ic-sm')} Jatuh Tempo: ${tgl(b.jatuh_tempo)}${late ? ' (Terlewat)' : ''}</div>` : `<div class="small c-success mt-1">${icon('check-circle', 'ic-sm')} Tagihan lunas</div>`}</div>
      ${b.sisa && !batal ? `<a class="btn btn-secondary btn-block mt-3" target="_blank" rel="noopener" href="${waLink(b.customer_hp, reminderText(b))}">${icon('whatsapp')} Kirim Tagihan & Rekening (WhatsApp)</a>` : ''}
      <button class="btn btn-outline btn-block mt-2" id="mail-inv" ${b.customer_email ? '' : 'disabled title="Customer belum punya email"'}>${icon('mail')} Kirim Email ${b.sisa ? 'Pengingat & Invoice' : 'Invoice'}</button>
      ${b.payments.length ? `<a class="btn btn-ghost btn-block mt-2" href="#/bookings/${b.id}/doc?jenis=kuitansi">${icon('receipt')} Lihat Kuitansi</a>` : ''}
    </div></div>
    ${b.sisa && !batal ? `<div class="card" id="pay-card"><div class="card-head"><h3>${icon('plus-circle')} Catat Pembayaran Baru</h3><span class="small c-primary bold">Formulir Kas</span></div><div class="card-body"><form id="pay" class="stack" novalidate>
      <div><div class="label-xs">Tipe Pembayaran</div><div class="grid-2 mt-2">
        <label class="opt-card on" data-pt="full"><input type="radio" name="tipe" value="full" checked><div class="bold small">Pelunasan Penuh</div><div class="xs mono c-primary">${rp(b.sisa)}</div></label>
        <label class="opt-card" data-pt="part"><input type="radio" name="tipe" value="part"><div class="bold small">${b.terbayar ? 'Cicilan Parsial' : 'DP / Parsial'}</div><div class="xs ink2">Nominal bebas</div></label></div></div>
      ${field('Rekening Tujuan / Metode', `<select class="select" name="metode">${opts(['Transfer Bank BCA', 'Transfer Bank Mandiri', 'Transfer Bank BRI', 'Transfer Bank BNI', 'QRIS', 'Tunai', 'Lainnya'], 'Transfer Bank BCA')}</select>`)}
      ${field('Tanggal', `<input class="input" type="date" name="tanggal" value="${today()}" max="${today()}">`)}
      ${field('Nominal Diterima (IDR)', moneyInput('nominal', b.sisa, 'readonly'), { req: true })}
      <div class="field"><label>Unggah Bukti Bayar</label><div class="drop" id="pay-drop" style="padding:16px"><div class="row" style="justify-content:center">${icon('upload-cloud')} <b class="small">Pilih File Bukti Bayar</b></div><div class="xs ink2 mt-1">JPG, PNG, atau PDF (Maks. 5 MB)</div></div><div id="pay-file" class="mt-2"></div></div>
      ${field('Catatan Staf / Referensi', '<input class="input" name="catatan" placeholder="Contoh: Transfer via m-BCA a.n Budi Santoso">')}
      ${b.customer_email ? '<label class="checkbox small"><input type="checkbox" name="kirim_kuitansi"> Kirim kuitansi PDF ke email customer</label>' : ''}
      <button class="btn btn-dark btn-block" type="submit">${icon('shield-check')} Verifikasi & Simpan Pembayaran</button></form></div></div>` : ''}
    <div class="card"><div class="card-head"><h3>${icon('history')} Log Aktivitas Terbaru</h3><span class="small ink2">${b.log.length} Catatan</span></div><div class="card-body">
      ${b.log.length ? `<div class="timeline">${b.log.map(l => `<div class="tl-item"><div class="t">${esc(l.aksi)}${l.ket ? ' — <span style="font-weight:400">' + esc(l.ket) + '</span>' : ''}</div><div class="m">${esc(l.waktu)} WIB • ${esc(l.oleh)}</div></div>`).join('')}</div>` : '<div class="small ink2">Belum ada log.</div>'}
    </div></div>
  </div></div>`;

  $$('.tab').forEach(t => t.onclick = () => { $$('.tab').forEach(x => x.classList.toggle('on', x === t)); $('#tab1').classList.toggle('hidden', t.dataset.tab !== '1'); $('#tab2').classList.toggle('hidden', t.dataset.tab !== '2'); });
  $$('[data-view]').forEach(el => el.onclick = () => viewFile(el.dataset.view, el));
  $('#exp-pax').onclick = () => downloadCsv('Manifest_' + b.kode + '.csv', [['No', 'Nama', 'Relasi', 'Gender', 'Usia', 'No Identitas', 'Catatan'], ...peserta.map((p, i) => [i + 1, p.nama, p.hubungan, p.gender, p.usia, p.identitas, p.catatan])]);
  if ($('#go-pay')) $('#go-pay').onclick = () => { $('#pay-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#pay [name=metode]').focus(), 400); };
  $('#mail-inv').onclick = e => withBusy(e.currentTarget, async () => {
    try { await API.call('emailDocument', { id: b.id, jenis: 'invoice' }); toast('Invoice terkirim ke ' + b.customer_email); } catch (err) { toast(err.message, 'error'); }
  });
  $('#chg-status').onclick = () => {
    const m = modal({ title: 'Ubah Status Booking', sub: esc(b.kode) + ' — saat ini: ' + esc(b.status_booking), size: 'sm',
      body: `<div class="stack">${['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'].map(s => `<label class="opt-card ${s === b.status_booking ? 'on' : ''}" data-s="${s}"><input type="radio" name="st" value="${s}" ${s === b.status_booking ? 'checked' : ''}>${chipBooking(s)}
        <div class="xs ink2 mt-1">${{ Menunggu: 'Booking tercatat, menunggu pembayaran/konfirmasi.', Dikonfirmasi: 'Reservasi dikunci & siap berangkat.', Selesai: 'Perjalanan telah selesai dilaksanakan.', Dibatalkan: 'Kursi dikembalikan ke kuota jadwal.' }[s]}</div></label>`).join('')}
        ${field('Alasan / catatan (tercatat di log)', '<input class="input" id="st-alasan">')}</div>`,
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="st-save">Simpan Status</button>' });
    m.$$('[data-s]').forEach(el => el.onclick = () => { m.$$('[data-s]').forEach(x => x.classList.toggle('on', x === el)); el.querySelector('input').checked = true; });
    m.$('#st-save').onclick = async e => {
      const s = m.$('input[name=st]:checked').value;
      if (s === b.status_booking) return m.close();
      if (s === 'Dibatalkan' && !await confirmDialog({ title: 'Batalkan booking?', message: `${b.jumlah_peserta} kursi akan dikembalikan ke kuota ${esc(dep.kode || '')}.`, confirmText: 'Ya, batalkan', danger: true })) return;
      withBusy(e.currentTarget, async () => {
        try { await API.call('updateBooking', { id: b.id, status_booking: s, alasan: m.$('#st-alasan').value }, { invalidate: true }); toast('Status booking diperbarui.'); m.close(); App.route(); }
        catch (err) { toast(err.message, 'error'); }
      });
    };
  };
  if ($('#edit-pax')) $('#edit-pax').onclick = () => manifestEditor(b, dep);
  if ($('#del-b')) $('#del-b').onclick = async () => {
    if (!await confirmDialog({ title: 'Hapus booking?', message: `Booking <b>${esc(b.kode)}</b> beserta ${b.payments.length} pembayarannya akan dihapus (soft delete) dan kursi dikembalikan. Transaksi kas terkait ikut ditandai terhapus.`, confirmText: 'Hapus Booking', danger: true })) return;
    try { await API.call('deleteBooking', { id: b.id }, { invalidate: true }); toast('Booking dihapus.'); App.go('#/bookings'); } catch (e) { toast(e.message, 'error'); }
  };
  $$('[data-delpay]').forEach(el => el.onclick = async () => {
    const alasan = await confirmDialog({ title: 'Hapus pembayaran?', message: 'Pembayaran & transaksi kas terkait akan ditandai terhapus. Status bayar booking dihitung ulang.', confirmText: 'Hapus', danger: true, input: { label: 'Alasan penghapusan', required: true } });
    if (!alasan) return;
    try { await API.call('deletePayment', { id: el.dataset.delpay, alasan }, { invalidate: true }); toast('Pembayaran dihapus.'); App.route(); } catch (e) { toast(e.message, 'error'); }
  });
  const pf = $('#pay');
  if (pf) {
    bindMoney(pf);
    let payFile = null;
    $$('[data-pt]', pf).forEach(el => el.onclick = e => {
      e.preventDefault(); $$('[data-pt]', pf).forEach(x => x.classList.toggle('on', x === el)); el.querySelector('input').checked = true;
      const nom = pf.nominal; const full = el.dataset.pt === 'full';
      nom.readOnly = full; nom.value = full ? num(b.sisa) : ''; if (!full) nom.focus();
    });
    const showF = () => { $('#pay-file').innerHTML = payFile ? `<div class="file-item"><div class="ext">${fileExt(payFile.name)}</div><div class="grow small bold">${esc(payFile.name)}<div class="xs mono ink2">${fileSize(payFile.size)}</div></div><button type="button" class="btn btn-ghost btn-icon btn-sm" id="pf-rm">${icon('trash')}</button></div>` : '';
      if ($('#pf-rm')) $('#pf-rm').onclick = () => { payFile = null; showF(); }; };
    $('#pay-drop').onclick = async () => { const ff = await pickFile(); if (ff) { payFile = ff; showF(); } };
    pf.onsubmit = async e => {
      e.preventDefault();
      const d = formData(pf), nominal = moneyVal(d.nominal);
      if (!nominal) { pf.nominal.classList.add('invalid'); return toast('Isi nominal pembayaran.', 'error'); }
      if (nominal > b.sisa) return toast('Nominal melebihi sisa tagihan ' + rp(b.sisa), 'error');
      const jenis = nominal >= b.sisa ? 'Pelunasan' : (b.terbayar ? 'Cicilan' : 'DP');
      await withBusy(e.submitter, async () => {
        try {
          const r = await API.call('addPayment', { id_booking: b.id, nominal, jenis, metode: d.metode, tanggal: d.tanggal, catatan: d.catatan, kirim_kuitansi: !!d.kirim_kuitansi,
            file: payFile ? { name: payFile.name, mime: payFile.mime, base64: payFile.base64 } : null }, { invalidate: true });
          toast(`Pembayaran ${r.kode} tercatat${r.email_terkirim ? ' & kuitansi terkirim' : ''}.`);
          App.route();
        } catch (err) { toast(err.message, 'error'); }
      });
    };
  }
};

function manifestEditor(b, dep) {
  const list = (b.peserta.length ? b.peserta : [{ nama: b.customer_nama, hubungan: 'Pemesan Utama' }]).map(p => ({ ...p }));
  let pax = b.jumlah_peserta;
  const maxPax = b.jumlah_peserta + (dep.sisa || 0);
  const m = modal({ title: 'Ubah Data Peserta & Manifest', sub: `${esc(b.kode)} • maksimal ${maxPax} pax (sisa kuota ${dep.sisa || 0})`, size: 'xl', body: '<div id="me"></div>',
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="me-save">Simpan Manifest</button>' });
  const draw = () => {
    while (list.length < pax) list.push({ nama: '', hubungan: '', gender: '', usia: '', identitas: '', catatan: '' });
    list.length = pax;
    m.$('#me').innerHTML = `<div class="row-between wrap"><div class="field"><label>Jumlah Peserta</label><div class="qty"><button type="button" id="mm">${icon('minus')}</button><input id="mv" value="${pax}" readonly><button type="button" id="mp">${icon('plus')}</button></div></div>
      ${pax !== b.jumlah_peserta ? `<div class="callout" style="padding:10px 14px"><div class="small">Mengubah pax akan menghitung ulang total tagihan: <b class="mono">${b.jumlah_peserta} → ${pax} pax</b> × ${rp(b.harga_satuan)}</div></div>` : ''}</div>
      <div class="table-wrap mt-4"><table class="table"><thead><tr><th>#</th><th>Nama sesuai ID *</th><th>Relasi</th><th>Gender</th><th>Usia</th><th>No. KTP/Paspor</th><th>Catatan</th></tr></thead><tbody>
      ${list.map((p, i) => `<tr><td class="mono">${i + 1}</td>${['nama', 'hubungan', 'gender', 'usia', 'identitas', 'catatan'].map(k => `<td><input class="input ${k === 'identitas' || k === 'usia' ? 'mono' : ''}" style="height:34px;min-width:${k === 'nama' ? 180 : k === 'gender' || k === 'usia' ? 60 : 120}px" data-i="${i}" data-k="${k}" value="${esc(p[k] || '')}"></td>`).join('')}</tr>`).join('')}
      </tbody></table></div>`;
    m.$$('[data-i]').forEach(el => el.oninput = () => list[el.dataset.i][el.dataset.k] = el.value);
    m.$('#mm').onclick = () => { if (pax > 1) { pax--; draw(); } };
    m.$('#mp').onclick = () => { if (pax < maxPax) { pax++; draw(); } else toast('Kuota jadwal tidak mencukupi.', 'error'); };
  };
  draw();
  m.$('#me-save').onclick = e => {
    if (list.some(p => !String(p.nama).trim())) return toast('Nama setiap peserta wajib diisi.', 'error');
    withBusy(e.currentTarget, async () => {
      try { await API.call('updateBooking', { id: b.id, peserta: list, jumlah_peserta: pax }, { invalidate: true }); toast('Manifest diperbarui.'); m.close(); App.route(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };
}

/* ======================= DOKUMEN (Invoice / Kuitansi / Voucher) ======================= */
Pages.bookingDoc = async (c) => {
  const id = c.params[0];
  const st = { jenis: c.query.jenis || 'invoice', opsi: { manifest: false, rekening: true, syarat: true } };
  c.view.innerHTML = `
  <div class="card" style="padding:14px 18px;margin-bottom:20px"><div class="row-between wrap">
    <div class="row wrap"><a class="btn btn-secondary" href="#/bookings/${id}">${icon('arrow-left')} Detail Booking</a><div><div class="bold">Pratinjau Dokumen Transaksi</div><div class="xs mono ink2" id="doc-name">—</div></div></div>
    <div class="seg" id="doc-tabs">${[['invoice', 'Invoice Tagihan'], ['kuitansi', 'Kuitansi Pembayaran'], ['voucher', 'Manifest (Voucher)']].map(([v, l]) => `<button class="${st.jenis === v ? 'on' : ''}" data-j="${v}">${l}</button>`).join('')}</div>
    <div class="row wrap"><button class="btn btn-outline btn-sm" id="d-pdf">${icon('download')} Unduh PDF</button><button class="btn btn-secondary btn-sm" id="d-mail">${icon('send')} Kirim Email</button><button class="btn btn-primary btn-sm" id="d-print">${icon('printer')} Cetak Dokumen</button></div>
  </div></div>
  <div class="grid-main"><div class="doc-stage"><div class="row small ink2" style="margin-bottom:12px">${icon('file-text', 'ic-sm')} Tampilan Lembar A4 Resmi • 210 × 297 mm</div><div id="doc-box">${loadingView('Menyusun dokumen...')}</div></div>
  <div class="stack"><div class="card"><div class="card-head"><h3>${icon('settings')} Parameter Cetak</h3><span class="chip chip-neutral">Live Preview</span></div><div class="card-body stack">
      <label class="checkbox"><input type="checkbox" data-o="manifest"> Rincian Manifest Peserta</label>
      <label class="checkbox"><input type="checkbox" data-o="rekening" checked> Rekening Bank Pembayaran</label>
      <label class="checkbox"><input type="checkbox" data-o="syarat" checked> Syarat & Ketentuan Pembayaran</label>
      <button class="btn btn-secondary btn-block" id="d-refresh">${icon('refresh')} Perbarui Lembar Pratinjau</button></div></div>
    <div class="card"><div class="card-head"><h3>${icon('folder')} Arsip Cloud Dokumen</h3></div><div class="card-body small">
      <div class="label-xs">Direktori Penyimpanan</div><div class="mono mt-1">/Travelpedia/Invoice &amp; Kuitansi (PDF)/</div>
      <div class="label-xs mt-3">Nama Berkas</div><div class="mono mt-1 c-primary" id="doc-file">—</div>
      <div class="ink2 mt-3">PDF tersimpan otomatis ke Google Drive privat setiap kali diunduh atau dikirim lewat email.</div></div></div>
    <div class="card card-body small"><div class="row bold">${icon('shield-check')} Integritas Dokumen & Audit Trail</div><div class="ink2 mt-2">Setiap unduhan, cetak, dan pengiriman email tercatat otomatis di Log Aktivitas atas nama ${esc(App.user.nama)}.</div></div>
  </div></div>`;
  let cur = null;
  const load = async () => {
    $('#doc-box').innerHTML = loadingView('Menyusun dokumen...');
    try {
      cur = await API.call('renderDocument', { id, jenis: st.jenis, opsi: st.opsi });
      if (!c.alive()) return;
      $('#doc-name').textContent = cur.fileName.replace('.pdf', '');
      $('#doc-file').textContent = cur.fileName;
      $('#doc-box').innerHTML = '<iframe class="doc-frame" id="doc-frame" sandbox="allow-same-origin allow-modals" title="Pratinjau dokumen"></iframe>';
      $('#doc-frame').srcdoc = cur.html;
      $('#d-mail').disabled = !cur.email;
      $('#d-mail').title = cur.email ? 'Kirim ke ' + cur.email : 'Customer belum memiliki email';
    } catch (e) { $('#doc-box').innerHTML = errorView(e.message); cur = null; }
  };
  $$('#doc-tabs button').forEach(b => b.onclick = () => { st.jenis = b.dataset.j; $$('#doc-tabs button').forEach(x => x.classList.toggle('on', x === b)); App.setQuery({ jenis: st.jenis }); load(); });
  $$('[data-o]').forEach(el => el.onchange = () => { st.opsi[el.dataset.o] = el.checked; });
  $('#d-refresh').onclick = load;
  $('#d-print').onclick = () => { const f = $('#doc-frame'); if (f) f.contentWindow.print(); };
  $('#d-pdf').onclick = e => withBusy(e.currentTarget, async () => {
    try { const r = await API.call('exportDocument', { id, jenis: st.jenis, opsi: st.opsi }); downloadB64(r.base64, r.fileName, r.mime); toast('PDF diunduh & diarsipkan ke Drive.'); } catch (err) { toast(err.message, 'error'); }
  });
  $('#d-mail').onclick = e => withBusy(e.currentTarget, async () => {
    try { await API.call('emailDocument', { id, jenis: st.jenis, opsi: st.opsi }); toast('Dokumen terkirim ke ' + cur.email); } catch (err) { toast(err.message, 'error'); }
  });
  await load();
};

/* ======================= JADWAL KEBERANGKATAN ======================= */
Pages.departures = async (c) => {
  const now = new Date();
  const st = { m: c.query.m || ymd(now).slice(0, 7), view: c.query.view || 'cal', id_trip: '', status: '', tipe: '' };
  const tripsRes = await API.cached('listTrips', {}, 120000);
  if (!c.alive()) return;
  c.view.innerHTML = pageHead({
    title: 'Jadwal Keberangkatan', badges: '<span class="chip chip-primary"><span class="dot"></span>Live Sync</span>',
    desc: 'Pantau kuota kursi, status keberangkatan aktif, dan ketersediaan tour leader untuk semua paket trip.',
    actions: `<div class="seg" id="vw"><button data-v="cal" class="${st.view === 'cal' ? 'on' : ''}">${icon('calendar', 'ic-sm')} Kalender (Bulan)</button><button data-v="list" class="${st.view === 'list' ? 'on' : ''}">${icon('list', 'ic-sm')} Daftar / List View</button></div>
      <button class="btn btn-outline" id="exp-man">${icon('download')} Unduh Manifest (.csv)</button><button class="btn btn-dark" id="add-dep">${icon('plus')} Tambah Jadwal Baru</button>`
  }) + `<div class="stats" id="d-stats"></div>
  <div class="card mt-6"><div class="filters">
    <div class="row"><button class="btn btn-outline btn-icon" id="pm">${icon('chevron-left')}</button><div class="bold" style="min-width:150px;text-align:center;font-size:17px" id="mlabel"></div><button class="btn btn-outline btn-icon" id="nm">${icon('chevron-right')}</button>
    <button class="btn btn-secondary btn-sm" id="tm">Hari Ini</button></div>
    <select class="select" id="ft">${opts(tripsRes.rows.map(t => ({ value: t.id, label: t.nama })), '', 'Semua Destinasi / Trip')}</select>
    <select class="select" id="fs">${opts([{ value: 'Tersedia', label: 'Tersedia' }, { value: 'Kritis', label: 'Sisa ≤ 2 Kursi' }, { value: 'Penuh', label: 'Kuota Penuh' }, { value: 'Selesai', label: 'Selesai' }, { value: 'Dibatalkan', label: 'Dibatalkan' }], '', 'Semua Status Kuota')}</select>
    <select class="select" id="fj">${opts(['Open Trip', 'Private Trip', 'Family Tour', 'Corporate'], '', 'Semua Jenis Trip')}</select>
    <div class="legend" style="margin-left:auto"><span class="label-xs">Legenda:</span><span><i style="background:var(--tint);border:1px solid #F7D9BD"></i>Tersedia</span><span><i style="background:var(--primary)"></i>Sisa ≤ 2</span><span><i style="background:var(--ink)"></i>Penuh</span><span><i style="background:#E8DED2"></i>Selesai</span></div>
  </div><div id="d-body" style="border-top:1px solid var(--divider)"></div></div>
  <div class="callout mt-6"><div class="ic-wrap">${icon('refresh')}</div><div class="grow"><b>Status Jadwal & Manifest</b><div class="small ink2 mt-1">Kuota diperbarui otomatis setiap booking dibuat/dibatalkan. Klik kartu keberangkatan untuk melihat daftar peserta, tour leader, dan armada.</div></div></div>`;
  let data;
  const load = async () => {
    App.setQuery({ m: st.m, view: st.view });
    $('#mlabel').textContent = bulanLabel(st.m);
    $('#d-body').innerHTML = loadingView();
    const first = st.m + '-01', last = addDays(ymd(new Date(Number(st.m.slice(0, 4)), Number(st.m.slice(5)), 1)), -1);
    data = await API.call('listDepartures', { from: addDays(first, -7), to: addDays(last, 7), id_trip: st.id_trip, status: st.status, tipe: st.tipe, month: st.m });
    if (!c.alive()) return;
    const s = data.stats, pct = s.kuota ? Math.round(s.terisi / s.kuota * 1000) / 10 : 0;
    $('#d-stats').innerHTML =
      statCard({ label: 'Jadwal aktif bulan ini', value: s.bulan_ini, unit: 'Keberangkatan', ic: 'calendar-check', foot: `<span>Periode ${BULAN[Number(st.m.slice(5)) - 1]} ${st.m.slice(0, 4)}</span><span class="row"><span class="chip chip-neutral">Open: ${s.open}</span><span class="chip chip-neutral">Private: ${s.private}</span></span>` }) +
      statCard({ label: 'Total kuota & keterisian', value: s.terisi, unit: '/ ' + s.kuota + ' Kursi', ic: 'seat', extra: progress(pct, 'dark'), foot: `<span class="c-primary">${pct}% Okupansi</span><span>${s.kuota - s.terisi} Kursi Tersisa</span>` }) +
      statCard({ label: 'Status kuota kritis', value: s.penuh + s.kritis, unit: 'Perlu Atensi', ic: 'alert', foot: `<span class="row"><span class="chip chip-dark">${s.penuh} Penuh</span><span class="chip chip-orange">${s.kritis} Sisa ≤ 2</span></span>` }) +
      statCard({ label: 'Berangkat 7 hari ke depan', value: s.minggu_ini, unit: 'Trip Terjadwal', ic: 'plane-takeoff', foot: `<span>${tglPendek(today())} – ${tglPendek(addDays(today(), 7))}</span>` });
    st.view === 'cal' ? drawCal() : drawList();
    if (c.query.focus) { const d = data.rows.find(x => x.id === c.query.focus); c.query.focus = null; if (d) departureModal(d, load); }
  };
  const evCls = d => d.status_tampil === 'Penuh' ? 'full' : d.status_tampil === 'Selesai' ? 'done' : d.status_tampil === 'Dibatalkan' ? 'cancel' : '';
  const drawCal = () => {
    const y = Number(st.m.slice(0, 4)), mo = Number(st.m.slice(5)) - 1;
    const first = new Date(y, mo, 1), startOff = (first.getDay() + 6) % 7;
    const start = new Date(y, mo, 1 - startOff);
    const days = Math.ceil((startOff + new Date(y, mo + 1, 0).getDate()) / 7) * 7;
    const byDate = {};
    data.rows.forEach(d => (byDate[d.tanggal_berangkat] = byDate[d.tanggal_berangkat] || []).push(d));
    let h = '<div class="cal">' + ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'].map(d => `<div class="cal-head">${d}</div>`).join('');
    for (let i = 0; i < days; i++) {
      const dt = new Date(start); dt.setDate(start.getDate() + i);
      const key = ymd(dt), out = dt.getMonth() !== mo, isT = key === today();
      const evs = byDate[key] || [];
      h += `<div class="cal-cell ${out ? 'out' : ''} ${isT ? 'today' : ''}"><div class="dn">${isT ? `<b>${dt.getDate()}</b> <span class="c-primary xs bold">HARI INI</span>` : (dt.getDate() === 1 ? dt.getDate() + ' ' + BULAN[dt.getMonth()] : String(dt.getDate()).padStart(2, '0'))}</div>
        ${evs.map(d => `<div class="ev ${evCls(d)}" data-id="${d.id}"><div class="row-between" style="gap:4px"><div class="t">${esc(d.trip_nama)}</div>${d.status_tampil === 'Penuh' ? '<span class="chip chip-dark" style="font-size:9px;padding:0 6px">PENUH</span>' : d.status_tampil === 'Kritis' ? `<span class="chip chip-orange" style="font-size:9px;padding:0 6px">SISA ${d.sisa}</span>` : d.status_tampil === 'Selesai' ? '<span class="chip chip-neutral" style="font-size:9px;padding:0 6px">SELESAI</span>' : ''}</div>
          <div class="k"><span>${d.terisi}/${d.kuota} Kursi</span><span>${esc(d.tour_leader ? 'TL: ' + d.tour_leader.split(' ')[0] : '')}</span></div></div>`).join('')}</div>`;
    }
    $('#d-body').innerHTML = h + '</div>';
    $$('.ev').forEach(el => el.onclick = () => departureModal(data.rows.find(x => x.id === el.dataset.id), load));
  };
  const drawList = () => {
    const rows = data.rows.filter(d => d.tanggal_berangkat.slice(0, 7) === st.m);
    $('#d-body').innerHTML = rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Kode Batch</th><th>Tanggal Perjalanan</th><th>Trip</th><th>Tour Leader</th><th>Kuota & Okupansi</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(d => `<tr class="clickable ${d.status_tampil === 'Selesai' ? 'muted-row' : ''}" data-id="${d.id}"><td class="code">${esc(d.kode)}</td><td><div>${rentang(d.tanggal_berangkat, d.tanggal_pulang)}</div><div class="sub">${hari(d.tanggal_berangkat)} – ${hari(d.tanggal_pulang)}</div></td>
        <td><div class="bold">${esc(d.trip_nama)}</div><div class="sub">${esc(d.trip_tipe)} • ${esc(d.armada || '-')}</div></td><td>${d.tour_leader ? `<div class="row">${avatar(d.tour_leader, 'sm')}${esc(d.tour_leader)}</div>` : '<span class="muted">Belum ditugaskan</span>'}</td>
        <td style="min-width:150px"><div class="row-between small mono"><span>${d.terisi}/${d.kuota} Pax</span><span>${d.okupansi}%</span></div>${progress(d.okupansi, d.status_tampil === 'Selesai' ? 'grey' : '')}</td><td>${chipDep(d)}</td><td>${icon('chevron-right', 'muted')}</td></tr>`).join('')}
      </tbody></table></div>` : emptyView('Tidak ada jadwal keberangkatan di bulan ini.', 'calendar', '<button class="btn btn-primary" onclick="document.getElementById(\'add-dep\').click()">Tambah Jadwal</button>');
    $$('#d-body tr[data-id]').forEach(tr => tr.onclick = () => departureModal(data.rows.find(x => x.id === tr.dataset.id), load));
  };
  const shiftM = n => { const d = new Date(Number(st.m.slice(0, 4)), Number(st.m.slice(5)) - 1 + n, 1); st.m = ymd(d).slice(0, 7); load(); };
  $('#pm').onclick = () => shiftM(-1); $('#nm').onclick = () => shiftM(1); $('#tm').onclick = () => { st.m = today().slice(0, 7); load(); };
  $('#ft').onchange = e => { st.id_trip = e.target.value; load(); };
  $('#fs').onchange = e => { st.status = e.target.value; load(); };
  $('#fj').onchange = e => { st.tipe = e.target.value; load(); };
  $$('#vw button').forEach(b => b.onclick = () => { st.view = b.dataset.v; $$('#vw button').forEach(x => x.classList.toggle('on', x === b)); st.view === 'cal' ? drawCal() : drawList(); App.setQuery({ m: st.m, view: st.view }); });
  $('#add-dep').onclick = () => departureForm({}, () => { API.clear(); load(); });
  $('#exp-man').onclick = e => withBusy(e.currentTarget, async () => {
    const deps = data.rows.filter(d => d.tanggal_berangkat.slice(0, 7) === st.m);
    const rows = [['Kode Batch', 'Tanggal', 'Trip', 'Kode Booking', 'Pemesan', 'No', 'Nama Peserta', 'Relasi', 'Gender', 'Usia', 'Identitas', 'Catatan', 'Status Bayar']];
    for (const d of deps) {
      const r = await API.call('listBookings', { id_departure: d.id, size: 200 });
      r.rows.filter(b => b.status_booking !== 'Dibatalkan').forEach(b => (b.peserta.length ? b.peserta : [{ nama: b.customer_nama }]).forEach((p, i) =>
        rows.push([d.kode, d.tanggal_berangkat, d.trip_nama, b.kode, b.customer_nama, i + 1, p.nama, p.hubungan, p.gender, p.usia, p.identitas, p.catatan, b.status_bayar])));
    }
    downloadCsv('Manifest_' + st.m + '.csv', rows);
  });
  await load();
};

async function departureModal(d, reload) {
  const m = modal({ title: esc(d.trip_nama), sub: `<span class="mono">${esc(d.kode)}</span> • ${rentang(d.tanggal_berangkat, d.tanggal_pulang)}`, size: 'lg',
    body: `<div class="grid-2"><div class="inner"><div class="label-xs">Kuota & Okupansi</div><div class="row-between mt-2"><b class="mono" style="font-size:20px">${d.terisi}/${d.kuota}</b>${chipDep(d)}</div>${progress(d.okupansi, 'mt-2')}<div class="small ink2 mt-2">${d.sisa} kursi tersisa • ${d.okupansi}% terisi</div></div>
      <div class="inner"><dl class="kv"><dt>Tour Leader</dt><dd>${esc(d.tour_leader || '-')}</dd><dt>Armada</dt><dd>${esc(d.armada || '-')}</dd><dt>Meeting point</dt><dd>${esc(d.meeting_point || '-')}</dd><dt>Jenis</dt><dd>${esc(d.trip_tipe)}</dd></dl></div></div>
      ${d.catatan ? `<div class="inner mt-3 small">${esc(d.catatan)}</div>` : ''}
      <div class="label-xs mt-4">Booking pada jadwal ini</div><div id="dm-b" class="mt-2">${loadingView()}</div>`,
    foot: `${App.isAdmin() ? `<button class="btn btn-danger" id="dm-del" style="margin-right:auto">${icon('trash')} Hapus</button>` : ''}<button class="btn btn-outline" id="dm-edit">${icon('edit')} Ubah Jadwal</button>
      ${d.sisa > 0 && d.status_tampil !== 'Selesai' && d.status_tampil !== 'Dibatalkan' ? `<a class="btn btn-primary" href="#/bookings/new?departure=${d.id}" data-close>${icon('plus')} Buat Booking</a>` : ''}` });
  m.$('#dm-edit').onclick = () => { m.close(); departureForm(d, () => { API.clear(); reload(); }); };
  if (m.$('#dm-del')) m.$('#dm-del').onclick = async () => {
    if (!await confirmDialog({ title: 'Hapus jadwal?', message: 'Jadwal hanya dapat dihapus jika tidak memiliki booking aktif.', danger: true, confirmText: 'Hapus' })) return;
    try { await API.call('deleteDeparture', { id: d.id }); toast('Jadwal dihapus.'); m.close(); API.clear(); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  try {
    const r = await API.call('listBookings', { id_departure: d.id, size: 100 });
    const el = m.$('#dm-b'); if (!el) return;
    el.innerHTML = r.rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Kode</th><th>Pemesan</th><th class="num">Pax</th><th>Bayar</th><th>Status</th></tr></thead><tbody>
      ${r.rows.map(b => `<tr class="clickable" onclick="App.go('#/bookings/${b.id}')"><td class="code">${esc(b.kode)}</td><td>${esc(b.customer_nama)}<div class="sub mono">${esc(fmtHp(b.customer_hp))}</div></td><td class="num">${b.jumlah_peserta}</td><td>${chipBayar(b.status_bayar)}</td><td>${chipBooking(b.status_booking)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="small ink2">Belum ada booking.</div>';
    $$('tr.clickable', el).forEach(tr => tr.addEventListener('click', () => m.close()));
  } catch (e) { m.$('#dm-b').innerHTML = `<div class="small c-danger">${esc(e.message)}</div>`; }
}

async function departureForm(d, onSaved) {
  const trips = (await API.cached('listTrips', {}, 120000)).rows.filter(t => t.aktif || t.id === d.id_trip);
  const durDays = t => { const n = parseInt(String(t && t.durasi || '1'), 10); return isNaN(n) ? 0 : Math.max(0, n - 1); };
  const m = modal({ title: d.id ? 'Ubah Jadwal Keberangkatan' : 'Tambah Jadwal Keberangkatan', sub: d.id ? `<span class="mono">${esc(d.kode)}</span>` : 'Kode batch dibuat otomatis',
    body: `<form id="df" class="form-grid" novalidate>
      ${field('Trip / Paket Wisata', `<select class="select" name="id_trip" required ${d.id ? 'disabled' : ''}>${opts(trips.map(t => ({ value: t.id, label: t.nama })), d.id_trip, '— Pilih trip —')}</select>`, { req: true })}
      ${field('Tanggal Berangkat', `<input class="input" type="date" name="tanggal_berangkat" required value="${esc(d.tanggal_berangkat || '')}">`, { req: true, cls: 'c-6' })}
      ${field('Tanggal Pulang', `<input class="input" type="date" name="tanggal_pulang" required value="${esc(d.tanggal_pulang || '')}">`, { req: true, cls: 'c-6', hint: 'Terisi otomatis dari durasi trip.' })}
      ${field('Kuota Kursi', `<input class="input mono" type="number" min="1" name="kuota" required value="${esc(d.kuota || '')}">`, { req: true, cls: 'c-4', hint: d.id ? 'Terisi saat ini: ' + d.terisi : '' })}
      ${field('Tour Leader', `<input class="input" name="tour_leader" value="${esc(d.tour_leader || '')}" placeholder="Nama TL">`, { cls: 'c-8' })}
      ${field('Kapal / Armada / Mitra', `<input class="input" name="armada" value="${esc(d.armada || '')}" placeholder="KM Navigasi Bahari I — PT Bahari Komodo">`)}
      ${field('Catatan', `<textarea class="textarea" name="catatan" rows="2">${esc(d.catatan || '')}</textarea>`)}
      ${d.id && App.isAdmin() ? field('Status Jadwal', `<select class="select" name="status">${opts(['Aktif', 'Dibatalkan'], d.status)}</select>`) : ''}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="df-save">Simpan Jadwal</button>' });
  const f = m.$('#df');
  const fill = () => {
    const t = trips.find(x => x.id === f.id_trip.value);
    if (t && !d.id) { if (!f.kuota.value) f.kuota.value = t.kapasitas || ''; if (f.tanggal_berangkat.value) f.tanggal_pulang.value = addDays(f.tanggal_berangkat.value, durDays(t)); }
  };
  f.id_trip.onchange = fill; f.tanggal_berangkat.onchange = fill;
  m.$('#df-save').onclick = e => {
    if (!validate(f)) return;
    const data = formData(f); data.id_trip = d.id_trip || data.id_trip; if (d.id) data.id = d.id;
    withBusy(e.currentTarget, async () => {
      try { const r = await API.call('saveDeparture', data, { invalidate: true }); toast(d.id ? 'Jadwal diperbarui.' : `Jadwal ${r.kode} ditambahkan.`); m.close(); onSaved && onSaved(r); }
      catch (err) { toast(err.message, 'error'); }
    });
  };
}

/* ======================= TRIP & HARGA ======================= */
const TRIP_KATEGORI = ['Bahari', 'Gunung', 'Budaya', 'Kota', 'Religi', 'Alam', 'Lainnya'];
const coverCls = k => ({ Gunung: 'g2', Bahari: 'g3', Budaya: 'g4' }[k] || '');
const coverIcon = k => ({ Bahari: 'ship', Gunung: 'mountain', Budaya: 'landmark' }[k] || 'compass');
function lazyCovers(root) {
  $$('[data-cover]', root).forEach(async el => {
    try { const f = await fetchFile(el.dataset.cover); el.insertAdjacentHTML('afterbegin', `<img src="data:${f.mime};base64,${f.base64}" alt="">`); } catch (e) { /* abaikan */ }
  });
}

Pages.trips = async (c) => {
  const admin = App.isAdmin();
  const st = { q: '', kategori: '', status: '' };
  c.view.innerHTML = pageHead({ over: 'Travelpedia / Master Data & Katalog / <b>Trip & Daftar Harga</b>', title: 'Trip & Daftar Harga',
    desc: 'Kelola master katalog paket destinasi wisata, durasi, variasi tier harga, berkas brosur digital, dan status ketersediaan operasional.' + (admin ? '' : ' <b>(Mode lihat saja)</b>'),
    actions: `<button class="btn btn-outline" id="t-exp">${icon('download')} Unduh Katalog</button>${admin ? `<a class="btn btn-dark" href="#/trips/new">${icon('plus-circle')} Tambah Trip Baru</a>` : ''}` }) +
    `<div class="stats" id="t-stats"></div><div class="card mt-6"><div class="filters">
      <div class="input-icon">${icon('search')}<input class="input" id="tq" placeholder="Cari nama trip, destinasi, atau kode..."></div>
      <select class="select" id="tk">${opts(TRIP_KATEGORI, '', 'Semua Kategori')}</select><select class="select" id="ts">${opts(['Aktif', 'Nonaktif'], '', 'Semua Status')}</select></div></div>
    <div id="t-list" class="stack mt-6"></div>
    <div class="callout mt-6"><div class="ic-wrap">${icon('info')}</div><div><b>Panduan Pengelolaan Master Trip</b><div class="small ink2 mt-1">Trip berstatus <b>Aktif</b> otomatis muncul di formulir Buat Booking dan Jadwal Keberangkatan. Perubahan harga tidak memengaruhi booking yang sudah tersimpan (harga dikunci saat booking dibuat).</div></div></div>`;
  let all = [];
  const draw = () => {
    const rows = all.filter(t => (!st.q || (t.nama + t.destinasi + t.kode).toLowerCase().includes(st.q.toLowerCase())) && (!st.kategori || t.kategori === st.kategori) && (!st.status || (st.status === 'Aktif') === t.aktif));
    $('#t-list').innerHTML = rows.length ? rows.map(t => {
      const foto = t.berkas.find(f => f.mime.startsWith('image/'));
      const brosur = t.berkas.find(f => f.mime === 'application/pdf');
      return `<div class="card"><div class="card-head" style="border:0;padding-bottom:0"><div class="row wrap"><span class="tag-mono" style="font-size:13px">${esc(t.kode)}</span>${chip(t.kategori, 'primary')}<span class="chip chip-outline">${icon('clock')} ${esc(t.durasi)}</span>${chip(t.tipe, 'neutral')}</div>${t.aktif ? chip('AKTIF OPERASIONAL', 'success') : chip('NONAKTIF', 'neutral')}</div>
      <div class="trip-card"><div><div class="cover ${coverCls(t.kategori)}" ${foto ? `data-cover="${foto.id}"` : ''}>${icon(coverIcon(t.kategori))}<div class="cap">${icon('image', 'ic-sm')} ${foto ? 'Foto Resmi' : 'Belum ada foto'}</div></div>
          <div class="inner mt-3"><div class="label-xs">Tautan Media & Berkas</div>${brosur ? `<div class="file-item mt-2" style="background:#fff"><div class="ext">PDF</div><div class="grow small bold" style="word-break:break-all">${esc(brosur.name)}</div><button class="btn btn-ghost btn-xs" data-view="${brosur.id}">Buka</button></div>` : '<div class="small ink2 mt-2">Belum ada brosur PDF.</div>'}
          <div class="small ink2 mt-2">${icon('folder', 'ic-sm')} ${t.berkas.length} berkas di Google Drive</div></div></div>
        <div class="grow"><h2 style="font-size:20px">${esc(t.nama)}</h2>
          <div class="row wrap small ink2 mt-2"><span class="row">${icon('pin', 'ic-sm')} ${esc(t.destinasi)}</span>${t.kapasitas ? `<span class="row">${icon('users', 'ic-sm')} Kapasitas: ${t.kapasitas} Pax</span>` : ''}</div>
          ${t.meeting_point ? `<div class="small ink2 mt-1 row">${icon('plane', 'ic-sm')} Titik Kumpul: ${esc(t.meeting_point)}</div>` : ''}
          <div class="feat mt-3">${t.include.slice(0, 5).map(x => `<span>${icon('check', 'ic-sm')} ${esc(x)}</span>`).join('')}</div>
          <div class="card mt-4" style="box-shadow:none"><div class="table-wrap"><table class="table"><thead><tr><th>Kode Tier</th><th>Varian Paket</th><th>Kategori Pax</th><th class="num">Harga Resmi</th><th>Masa Berlaku</th><th>Status</th></tr></thead><tbody>
          ${t.prices.length ? t.prices.map((p, i) => `<tr><td class="mono small ${i === 1 ? 'c-primary' : ''}">${esc(p.kode)}</td><td>${esc(p.nama_paket)}${p.min_pax ? `<div class="sub">Min ${p.min_pax} pax</div>` : ''}</td><td class="small">${esc(p.tipe)}</td><td class="num bold">${rp(p.harga)}</td><td class="small">${p.berlaku_sampai ? 's/d ' + tgl(p.berlaku_sampai) : '-'}</td><td>${chip(p.status, p.status === 'Tersedia' ? 'primary' : p.status === 'On Request' ? 'warn' : 'neutral')}</td></tr>`).join('')
            : `<tr><td colspan="6" class="small ink2">Belum ada varian harga.${admin ? ' Tambahkan di Detail Trip.' : ''}</td></tr>`}</tbody></table></div></div></div></div>
      <div class="card-foot" style="justify-content:space-between;flex-wrap:wrap"><span class="small ink2 row">${icon('history', 'ic-sm')} Diperbarui ${esc(t.diperbarui || '-')} oleh <b>${esc(t.diperbarui_oleh || '-')}</b></span>
        <div class="row wrap">${admin ? `<a class="btn btn-outline btn-sm" href="#/trips/${t.id}/edit">Ubah Trip</a><a class="btn btn-outline btn-sm" href="#/trips/${t.id}?tab=harga">Kelola Harga</a>` : ''}
        <button class="btn btn-dark btn-sm" data-newdep="${t.id}">${icon('calendar', 'ic-sm')} + Buat Jadwal</button><a class="btn btn-ghost btn-sm" href="#/trips/${t.id}">Detail Trip ${icon('arrow-right', 'ic-sm')}</a></div></div></div>`;
    }).join('') : `<div class="card">${emptyView('Tidak ada trip yang cocok.', 'compass', admin ? '<a class="btn btn-primary" href="#/trips/new">Tambah Trip</a>' : '')}</div>`;
    $$('[data-view]').forEach(el => el.onclick = () => viewFile(el.dataset.view, el));
    $$('[data-newdep]').forEach(el => el.onclick = () => departureForm({ id_trip: el.dataset.newdep }, () => { API.clear(); App.route(); }));
    lazyCovers($('#t-list'));
  };
  const r = await API.call('listTrips', {});
  API._memo['listTrips{}'] = { t: Date.now(), v: r };
  if (!c.alive()) return;
  all = r.rows;
  const s = r.stats;
  $('#t-stats').innerHTML = statCard({ label: 'Total paket wisata', value: s.total, unit: 'Destinasi', ic: 'compass', foot: `<span>${s.aktif} aktif</span>` }) +
    statCard({ label: 'Varian tier harga', value: s.varian, unit: 'Paket Harga', ic: 'tag', foot: '<span>Reguler, Superior, Private, dll</span>' }) +
    statCard({ label: 'Rentang harga paket', value: rpShort(s.harga_min) + ' – ' + rpShort(s.harga_max).replace('Rp ', ''), money: true, ic: 'banknote' }) +
    statCard({ label: 'Berkas brosur & media', value: s.total ? Math.round(s.berkas / s.total * 100) + '%' : '0%', ic: 'folder', foot: `<span>${s.berkas} trip memiliki berkas di Drive</span>` });
  $('#tq').oninput = debounce(e => { st.q = e.target.value.trim(); draw(); }, 200);
  $('#tk').onchange = e => { st.kategori = e.target.value; draw(); };
  $('#ts').onchange = e => { st.status = e.target.value; draw(); };
  $('#t-exp').onclick = () => {
    const rows = [['Kode Trip', 'Nama', 'Destinasi', 'Kategori', 'Tipe', 'Durasi', 'Kode Tier', 'Varian', 'Kategori Pax', 'Harga', 'Berlaku Sampai', 'Status']];
    all.forEach(t => (t.prices.length ? t.prices : [{}]).forEach(p => rows.push([t.kode, t.nama, t.destinasi, t.kategori, t.tipe, t.durasi, p.kode, p.nama_paket, p.tipe, p.harga, p.berlaku_sampai, p.status])));
    downloadCsv('Katalog_Trip_' + today() + '.csv', rows);
  };
  draw();
};

Pages.tripDetail = async (c) => {
  const t = await API.call('getTrip', { id: c.params[0] });
  if (!c.alive()) return;
  const admin = App.isAdmin(), s = t.stats;
  const tab = c.query.tab || 'jadwal';
  const foto = t.berkas.filter(f => f.mime.startsWith('image/')), docs = t.berkas.filter(f => !f.mime.startsWith('image/'));
  c.view.innerHTML = `<div class="card" style="padding:20px 24px;margin-bottom:20px"><div class="page-head" style="margin:0"><div class="grow">
      <a class="back-link" href="#/trips">${icon('arrow-left', 'ic-sm')} Kembali ke Master Trip</a>
      <h1>${esc(t.nama)}</h1><div class="row wrap mt-2"><span class="tag-mono">${esc(t.kode)}</span>${t.aktif ? chip('Aktif Operasional', 'success') : chip('Nonaktif', 'neutral')}${chip(t.kategori, 'primary')}<span class="small ink2 row">${icon(coverIcon(t.kategori), 'ic-sm')} ${esc(t.tipe)} • ${esc(t.destinasi)}</span></div></div>
    <div class="actions">${docs[0] ? `<button class="btn btn-secondary" data-view="${docs[0].id}">${icon('download')} Brosur & Materi</button>` : ''}${admin ? `<a class="btn btn-secondary" href="#/trips/${t.id}/edit">${icon('edit')} Ubah Data Trip</a>` : ''}
      <button class="btn btn-primary" id="add-batch">${icon('plus-circle')} Tambah Batch Jadwal</button></div></div></div>
  <div class="stats">
    ${statCard({ label: 'Spesifikasi tur', value: esc(t.destinasi.split(',')[0]), ic: 'compass', extra: `<dl class="kv small"><dt>Durasi</dt><dd>${esc(t.durasi)}</dd><dt>Kapasitas</dt><dd>${t.kapasitas || '-'} pax</dd><dt>Meeting</dt><dd>${esc(t.meeting_point || '-')}</dd></dl>` })}
    ${statCard({ label: 'Okupansi keseluruhan', value: `<span class="c-primary">${s.okupansi}%</span>`, ic: 'seat', extra: `<div class="row-between small"><span>${s.terisi} Terisi / ${s.kuota} Kursi</span><span>${s.batch_aktif} Batch Aktif</span></div>${progress(s.okupansi)}` })}
    ${statCard({ label: 'Omzet terkunci', value: rp(s.omzet), money: true, ic: 'banknote', extra: `<dl class="kv small"><dt>Rentang harga</dt><dd class="mono">${rpShort(t.harga_min)} – ${rpShort(t.harga_max).replace('Rp ', '')}</dd><dt>Booking aktif</dt><dd>${s.booking}</dd></dl>` })}
    ${statCard({ label: 'Aset promosi & berkas', value: 'Google Drive', ic: 'folder', extra: `<div class="small ink2">${foto.length} foto • ${docs.length} dokumen/brosur</div>` })}
  </div>
  <div class="tabs mt-6">${[['jadwal', 'calendar', 'Jadwal Batch & Alokasi Kuota', t.departures.length], ['harga', 'tag', 'Master Varian & Tier Harga', t.prices.length], ['fasilitas', 'list', 'Fasilitas, Rundown & Kebijakan'], ['galeri', 'image', 'Galeri Media & Materi Promosi', t.berkas.length]]
    .map(([k, ic, l, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-t="${k}">${icon(ic)} ${l}${n !== undefined ? ` <span class="badge">${n}</span>` : ''}</button>`).join('')}</div>
  <div id="tab-body" class="mt-4"></div>`;
  $$('[data-view]').forEach(el => el.onclick = () => viewFile(el.dataset.view, el));
  $('#add-batch').onclick = () => departureForm({ id_trip: t.id }, () => { API.clear(); App.route(); });
  const tabs = {
    jadwal: () => {
      let fl = 'all';
      const draw = () => {
        const rows = t.departures.filter(d => fl === 'all' || (fl === 'open' && ['Tersedia', 'Kritis'].includes(d.status_tampil)) || (fl === 'kritis' && ['Kritis', 'Penuh'].includes(d.status_tampil)) || (fl === 'selesai' && d.status_tampil === 'Selesai'));
        $('#tab-body').innerHTML = `<div class="card"><div class="filters"><span class="label-xs">Filter status:</span><div class="pills">${[['all', 'Semua'], ['open', 'Terbuka'], ['kritis', 'Kuota Kritis / Penuh'], ['selesai', 'Selesai']].map(([k, l]) => `<button class="pill ${fl === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div></div>
          ${rows.length ? `<div class="table-wrap" style="border-top:1px solid var(--divider)"><table class="table"><thead><tr><th>Kode Batch</th><th>Tanggal Perjalanan</th><th>Kapal / Mitra Armada</th><th>Tour Leader</th><th>Kuota & Okupansi</th><th>Status</th></tr></thead><tbody>
          ${rows.map(d => `<tr class="clickable ${d.status_tampil === 'Selesai' ? 'muted-row' : ''}" data-id="${d.id}"><td class="code">${esc(d.kode)}</td><td>${rentang(d.tanggal_berangkat, d.tanggal_pulang)}<div class="sub">${hari(d.tanggal_berangkat)} – ${hari(d.tanggal_pulang)}</div></td><td class="small">${esc(d.armada || '-')}</td>
            <td>${d.tour_leader ? `<div class="row">${avatar(d.tour_leader, 'sm')}${esc(d.tour_leader)}</div>` : '-'}</td><td style="min-width:150px"><div class="row-between small mono"><span>${d.terisi}/${d.kuota} Pax</span><span class="c-primary">${d.okupansi}%</span></div>${progress(d.okupansi, d.status_tampil === 'Selesai' ? 'grey' : '')}</td><td>${chipDep(d)}</td></tr>`).join('')}
          </tbody><tfoot><tr><td colspan="2">Total Kapasitas Terjadwal: ${s.kuota} Kursi</td><td colspan="2">Total Terisi: <span class="c-primary">${s.terisi} Pax (${s.okupansi}%)</span></td><td colspan="2" class="num">Revenue terkunci: ${rp(s.omzet)}</td></tr></tfoot></table></div>`
            : emptyView('Belum ada batch jadwal untuk filter ini.', 'calendar')}</div>`;
        $$('[data-f]').forEach(b => b.onclick = () => { fl = b.dataset.f; draw(); });
        $$('#tab-body tr[data-id]').forEach(tr => tr.onclick = () => departureModal(t.departures.find(d => d.id === tr.dataset.id), () => App.route()));
      };
      draw();
    },
    harga: () => {
      $('#tab-body').innerHTML = `<div class="grid-2"><div class="card"><div class="card-head"><div><h3>${icon('tag')} Varian Tier Harga Trip</h3><div class="sub">Paket kamar & alokasi kabin yang ditawarkan</div></div>${admin ? `<button class="btn btn-secondary btn-sm" id="add-price">${icon('plus')} Tambah Varian Tier</button>` : ''}</div><div class="card-body">
        ${t.prices.length ? t.prices.map((p, i) => `<div class="tier ${i === 1 ? 'best' : ''}"><div class="ti">${icon(p.satuan === 'trip' ? 'ship' : 'bed')}</div><div class="grow"><div class="bold row wrap">${esc(p.nama_paket)} <span class="tag-mono">${esc(p.kode)}</span>${p.status !== 'Tersedia' ? chip(p.status, 'warn') : ''}</div><div class="small ink2">${esc(p.tipe)}${p.catatan ? ' • ' + esc(p.catatan) : ''}${p.berlaku_sampai ? ' • s/d ' + tgl(p.berlaku_sampai) : ''}</div></div>
          <div class="right"><div class="mono bold c-primary">${rp(p.harga)}</div><div class="xs ink2">/ ${esc(p.satuan)}${p.min_pax ? ' (min. ' + p.min_pax + ' pax)' : ''}</div></div>
          ${admin ? `<div class="row"><button class="btn btn-ghost btn-icon btn-sm" data-ep="${p.id}">${icon('edit')}</button><button class="btn btn-ghost btn-icon btn-sm" data-dp="${p.id}">${icon('trash')}</button></div>` : ''}</div>`).join('') : emptyView('Belum ada varian harga.', 'tag')}
        <div class="small ink2 mt-4">*Perubahan harga tidak memengaruhi booking yang sudah tersimpan.</div></div></div>
        <div class="card"><div class="card-head"><h3>${icon('info')} Cara Kerja Harga</h3></div><div class="card-body small ink2 stack">
          <div>• Satuan <b>pax</b>: total = harga × jumlah peserta.</div><div>• Satuan <b>trip</b>: harga flat per booking (mis. charter kapal penuh).</div><div>• Status <b>Nonaktif</b> menyembunyikan varian dari formulir booking.</div><div>• Minimal pax divalidasi server saat booking dibuat.</div></div></div></div>`;
      if ($('#add-price')) $('#add-price').onclick = () => priceForm(t, {});
      $$('[data-ep]').forEach(b => b.onclick = () => priceForm(t, t.prices.find(p => p.id === b.dataset.ep)));
      $$('[data-dp]').forEach(b => b.onclick = async () => {
        if (!await confirmDialog({ title: 'Hapus varian harga?', message: 'Booking lama tetap menyimpan harga saat dibuat.', danger: true, confirmText: 'Hapus' })) return;
        try { await API.call('deletePrice', { id: b.dataset.dp }, { invalidate: true }); toast('Varian dihapus.'); App.route(); } catch (e) { toast(e.message, 'error'); }
      });
    },
    fasilitas: () => {
      $('#tab-body').innerHTML = `<div class="grid-2"><div class="card"><div class="card-head"><h3>${icon('file-text')} Deskripsi & Highlight Itinerary</h3></div><div class="card-body" style="white-space:pre-wrap;line-height:22px">${esc(t.deskripsi || 'Belum ada deskripsi.')}</div></div>
        <div class="card"><div class="card-head"><h3>${icon('shield-check')} SOP & Ketentuan Operasional</h3></div><div class="card-body stack">
          <div class="inner" style="background:#F2FAF5;border-color:#CFE9DA"><div class="bold c-success row">${icon('check-circle', 'ic-sm')} Fasilitas Termasuk (Inclusive)</div><ul class="list-dot small mt-2">${t.include.map(x => `<li>${esc(x)}</li>`).join('') || '<li>-</li>'}</ul></div>
          <div class="inner" style="background:#FFF4F2;border-color:#F6CFCB"><div class="bold c-danger row">${icon('x-circle', 'ic-sm')} Tidak Termasuk (Exclusion)</div><ul class="list-dot small mt-2">${t.exclude.map(x => `<li>${esc(x)}</li>`).join('') || '<li>-</li>'}</ul></div>
          <div class="inner" style="background:#FFF7E8;border-color:#F5DDB0"><div class="bold row" style="color:var(--warning-ink)">${icon('info', 'ic-sm')} Ketentuan Pembayaran & Pembatalan</div><div class="small mt-2" style="white-space:pre-wrap">${esc(t.kebijakan || 'DP minimal ' + (App.settings.MIN_DP_PERSEN || 30) + '%. Pelunasan maksimal H-' + (App.settings.H_PELUNASAN || 7) + ' sebelum keberangkatan.')}</div></div>
          ${admin ? `<a class="small" href="#/trips/${t.id}/edit">Edit Rundown Lengkap & Syarat ${icon('chevron-right', 'ic-sm')}</a>` : ''}</div></div></div>`;
    },
    galeri: () => {
      $('#tab-body').innerHTML = `<div class="card"><div class="card-head"><div><h3>${icon('image')} Galeri Media & Materi Promosi</h3><div class="sub">Disimpan di folder Google Drive privat /Trip</div></div>${admin ? `<div class="row"><button class="btn btn-secondary btn-sm" data-up="Foto">${icon('image')} Unggah Foto</button><button class="btn btn-secondary btn-sm" data-up="Brosur">${icon('file-text')} Unggah Brosur PDF</button></div>` : ''}</div><div class="card-body">
        ${foto.length ? `<div class="gallery">${foto.map(f => `<div class="thumb" data-cover="${f.id}" data-v="${f.id}">${icon('image')}<div class="nm">${esc(f.name)}</div>${admin ? `<button class="btn btn-outline btn-icon btn-xs del" data-rm="${f.id}">${icon('trash', 'ic-sm')}</button>` : ''}</div>`).join('')}</div>` : '<div class="small ink2">Belum ada foto.</div>'}
        <div class="label-xs mt-6">Brosur & Dokumen</div><div class="mt-2">${docs.length ? docs.map(f => `<div class="file-item"><div class="ext">${fileExt(f.name)}</div><div class="grow"><div class="small bold">${esc(f.name)}</div><div class="xs mono ink2">${fileSize(f.size)} • ${esc(f.at || '')}</div></div><button class="btn btn-ghost btn-sm" data-v="${f.id}">${icon('eye')} Buka</button>${admin ? `<button class="btn btn-ghost btn-icon btn-sm" data-rm="${f.id}">${icon('trash')}</button>` : ''}</div>`).join('') : '<div class="small ink2">Belum ada brosur.</div>'}</div></div></div>`;
      lazyCovers($('#tab-body'));
      $$('[data-v]').forEach(el => el.onclick = e => { if (e.target.closest('[data-rm]')) return; viewFile(el.dataset.v, el.tagName === 'BUTTON' ? el : null); });
      $$('[data-up]').forEach(b => b.onclick = async () => {
        const ff = await pickFile({ accept: b.dataset.up === 'Foto' ? 'image/*' : 'application/pdf' }); if (!ff) return;
        withBusy(b, async () => { try { await API.call('uploadTripFile', { id: t.id, jenis: b.dataset.up, file: { name: ff.name, mime: ff.mime, base64: ff.base64 } }, { invalidate: true }); toast('Berkas tersimpan di Google Drive.'); App.setQuery({ tab: 'galeri' }); App.route(); } catch (e) { toast(e.message, 'error'); } });
      });
      $$('[data-rm]').forEach(b => b.onclick = async e => {
        e.stopPropagation();
        if (!await confirmDialog({ title: 'Hapus berkas?', message: 'Berkas dipindahkan ke Sampah Google Drive.', danger: true, confirmText: 'Hapus' })) return;
        try { await API.call('removeTripFile', { id: t.id, fileId: b.dataset.rm }, { invalidate: true }); toast('Berkas dihapus.'); App.setQuery({ tab: 'galeri' }); App.route(); } catch (err) { toast(err.message, 'error'); }
      });
    }
  };
  $$('.tab').forEach(b => b.onclick = () => { $$('.tab').forEach(x => x.classList.toggle('on', x === b)); App.setQuery({ tab: b.dataset.t }); tabs[b.dataset.t](); });
  (tabs[tab] || tabs.jadwal)();
};

function priceForm(t, p) {
  const yr = today().slice(0, 4);
  const m = modal({ title: p.id ? 'Ubah Varian Harga' : 'Tambah Varian Tier Harga', sub: esc(t.nama),
    body: `<form id="pf" class="form-grid" novalidate>
      ${field('Nama Paket / Tipe Kamar', `<input class="input" name="nama_paket" required value="${esc(p.nama_paket || '')}" placeholder="Superior Private Cabin">`, { req: true })}
      ${field('Kategori Pax', `<input class="input" name="tipe" value="${esc(p.tipe || 'Open Trip / Pax')}">`, { cls: 'c-6' })}
      ${field('Satuan Harga', `<select class="select" name="satuan">${opts([{ value: 'pax', label: 'Per pax' }, { value: 'trip', label: 'Per trip (flat)' }, { value: 'kamar', label: 'Per kamar' }], p.satuan || 'pax')}</select>`, { cls: 'c-6' })}
      ${field('Harga Resmi (Nett)', moneyInput('harga', p.harga, 'required'), { req: true, cls: 'c-6' })}
      ${field('Minimal Pax', `<input class="input mono" type="number" min="0" name="min_pax" value="${p.min_pax || 0}">`, { cls: 'c-6' })}
      ${field('Berlaku Dari', `<input class="input" type="date" name="berlaku_dari" value="${esc(p.berlaku_dari || yr + '-01-01')}">`, { cls: 'c-6' })}
      ${field('Berlaku Sampai', `<input class="input" type="date" name="berlaku_sampai" value="${esc(p.berlaku_sampai || yr + '-12-31')}">`, { cls: 'c-6' })}
      ${field('Status', `<select class="select" name="status">${opts(['Tersedia', 'On Request', 'Nonaktif'], p.status || 'Tersedia')}</select>`, { cls: 'c-6' })}
      ${field('Catatan Fasilitas Khusus', `<input class="input" name="catatan" value="${esc(p.catatan || '')}" placeholder="Ensuite bathroom, ocean view">`, { cls: 'c-6' })}</form>`,
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" id="pf-save">Simpan Varian</button>' });
  bindMoney(m.el);
  m.$('#pf-save').onclick = e => {
    const f = m.$('#pf'); if (!validate(f)) return;
    const d = formData(f); d.harga = moneyVal(d.harga); d.id_trip = t.id; if (p.id) d.id = p.id;
    withBusy(e.currentTarget, async () => {
      try { await API.call('savePrice', d, { invalidate: true }); toast('Varian harga tersimpan.'); m.close(); App.setQuery({ tab: 'harga' }); App.route(); } catch (err) { toast(err.message, 'error'); }
    });
  };
}

Pages.tripForm = async (c) => {
  const id = c.params[0];
  let t = { tipe: 'Open Trip', kategori: 'Bahari', include: [], exclude: [], aktif: true };
  if (id) { t = await API.call('getTrip', { id }); if (!c.alive()) return; }
  const inc = [...t.include], exc = [...t.exclude];
  c.view.innerHTML = `${pageHead({ back: { href: id ? '#/trips/' + id : '#/trips', label: 'Kembali ke Katalog Trip' }, over: id ? 'Mode Edit' : 'Tambah Baru',
    title: 'Kelola Master Trip & Paket', desc: id ? `ID Master: <span class="mono">${esc(t.kode)}</span> • Terakhir diubah ${esc(t.diperbarui || '-')} oleh ${esc(t.diperbarui_oleh || '-')}` : 'Varian harga & galeri dikelola di halaman detail setelah trip disimpan.',
    actions: `<label class="checkbox card" style="padding:10px 14px"><input type="checkbox" id="aktif" ${t.aktif ? 'checked' : ''}><span><b>Status Publikasi: Aktif</b><div class="xs ink2">Bisa di-booking oleh staf</div></span></label>` })}
  <form id="tf" novalidate class="stack">
  <div class="card"><div class="card-head"><div><h3>${icon('compass')} Informasi Pokok & Deskripsi Trip</h3><div class="sub">Identitas destinasi, durasi, dan kurasi layanan</div></div><span class="chip chip-neutral">Langkah 01</span></div><div class="card-body"><div class="form-grid">
    ${field('Nama Trip / Destinasi Utama', `<input class="input" name="nama" required value="${esc(t.nama || '')}" placeholder="Eksplorasi Labuan Bajo & Komodo 3H2M">`, { req: true, cls: 'c-8' })}
    ${field('Durasi Standar', `<input class="input" name="durasi" required value="${esc(t.durasi || '')}" placeholder="3 Hari 2 Malam">`, { req: true, cls: 'c-4', hint: 'Angka pertama dipakai menghitung tanggal pulang.' })}
    ${field('Destinasi / Wilayah Operasi', `<input class="input" name="destinasi" required value="${esc(t.destinasi || '')}" placeholder="Labuan Bajo & Taman Nasional Komodo">`, { req: true, cls: 'c-6' })}
    ${field('Kategori', `<select class="select" name="kategori">${opts(TRIP_KATEGORI, t.kategori)}</select>`, { cls: 'c-3' })}
    ${field('Kapasitas Standar (Pax)', `<input class="input mono" type="number" min="0" name="kapasitas" value="${t.kapasitas || ''}">`, { cls: 'c-3' })}
    ${field('Tipe Pelaksanaan Trip', `<div class="seg" id="tipe">${['Open Trip', 'Private Trip', 'Family Tour', 'Corporate'].map(v => `<button type="button" class="${t.tipe === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div><input type="hidden" name="tipe" value="${esc(t.tipe)}">`, { cls: 'c-8' })}
    ${field('Meeting Point', `<input class="input" name="meeting_point" value="${esc(t.meeting_point || '')}" placeholder="Bandara Komodo (LBJ) 09:30 WITA">`, { cls: 'c-4' })}
    ${field('Deskripsi Lengkap & Highlight Itinerary', `<textarea class="textarea" name="deskripsi" rows="6">${esc(t.deskripsi || '')}</textarea>`, { cls: 'c-12' })}
  </div></div></div>
  <div class="grid-2"><div class="card"><div class="card-head"><h3><span class="dot" style="color:var(--primary)"></span> Fasilitas Sudah Termasuk (Include)</h3></div><div class="card-body"><div id="inc"></div>
      <div class="row mt-3"><input class="input" id="inc-in" placeholder="+ Tambah fasilitas termasuk..."><button type="button" class="btn btn-secondary" id="inc-add">Tambah</button></div></div></div>
    <div class="card"><div class="card-head"><h3><span class="dot" style="color:var(--muted)"></span> Fasilitas Belum Termasuk (Exclude)</h3></div><div class="card-body"><div id="exc"></div>
      <div class="row mt-3"><input class="input" id="exc-in" placeholder="+ Tambah fasilitas belum termasuk..."><button type="button" class="btn btn-secondary" id="exc-add">Tambah</button></div></div></div></div>
  <div class="card"><div class="card-head"><h3>${icon('shield-check')} Ketentuan Pembayaran & Pembatalan</h3></div><div class="card-body">
    <textarea class="textarea" name="kebijakan" rows="3" placeholder="Deposit 30% non-refundable. Pelunasan H-7.">${esc(t.kebijakan || '')}</textarea></div></div>
  <div class="card" style="position:sticky;bottom:12px;z-index:5;box-shadow:var(--sh-3)"><div class="row-between wrap" style="padding:14px 20px"><span class="small ink2 row">${icon('info', 'ic-sm')} ${id ? 'Perubahan tercatat di Log Aktivitas.' : 'Setelah disimpan, lanjutkan menambah varian harga & foto.'}</span>
    <div class="row"><a class="btn btn-ghost" href="${id ? '#/trips/' + id : '#/trips'}">Batal / Buang Perubahan</a><button class="btn btn-primary" type="submit">${icon('send')} Simpan & Publikasikan Trip</button></div></div></div></form>`;
  const f = $('#tf');
  $$('#tipe button').forEach(b => b.onclick = () => { $$('#tipe button').forEach(x => x.classList.remove('on')); b.classList.add('on'); f.tipe.value = b.dataset.v; });
  const list = (arr, el) => {
    $(el).innerHTML = arr.map((x, i) => `<div class="file-item" style="background:var(--inner)"><span class="grow small">${esc(x)}</span><button type="button" class="btn btn-ghost btn-icon btn-xs" data-i="${i}">${icon('x', 'ic-sm')}</button></div>`).join('') || '<div class="small ink2">Belum ada item.</div>';
    $$('[data-i]', $(el)).forEach(b => b.onclick = () => { arr.splice(Number(b.dataset.i), 1); list(arr, el); });
  };
  const adder = (arr, el, inp) => { const v = $(inp).value.trim(); if (v) { arr.push(v); $(inp).value = ''; list(arr, el); } };
  list(inc, '#inc'); list(exc, '#exc');
  $('#inc-add').onclick = () => adder(inc, '#inc', '#inc-in'); $('#exc-add').onclick = () => adder(exc, '#exc', '#exc-in');
  $('#inc-in').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); adder(inc, '#inc', '#inc-in'); } };
  $('#exc-in').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); adder(exc, '#exc', '#exc-in'); } };
  f.onsubmit = async e => {
    e.preventDefault(); if (!validate(f)) return;
    const d = formData(f); d.include = inc; d.exclude = exc; d.aktif = $('#aktif').checked; if (id) d.id = id;
    await withBusy(e.submitter, async () => {
      try { const r = await API.call('saveTrip', d, { invalidate: true }); toast('Trip tersimpan.'); App.go('#/trips/' + r.id + (id ? '' : '?tab=harga')); } catch (err) { toast(err.message, 'error'); }
    });
  };
};

/* ======================= SLIP GAJI SAYA ======================= */
Pages.slips = async (c) => {
  const r = await API.call('mySlips');
  if (!c.alive()) return;
  c.view.innerHTML = pageHead({ title: 'Slip Gaji Saya', badges: '<span class="chip chip-neutral">' + icon('lock') + ' Rahasia</span>',
    desc: 'Slip gaji elektronik resmi yang telah difinalkan oleh Admin. Hanya Anda yang dapat melihat slip milik Anda.',
    actions: App.isAdmin() ? `<a class="btn btn-secondary" href="#/payroll">${icon('wallet')} Buka Modul Payroll</a>` : '' }) +
    (!r.employee ? `<div class="card">${emptyView('Akun Anda belum terhubung ke data karyawan.<br>Hubungi Admin untuk menautkan akun di menu <b>Data Karyawan</b>.', 'idcard')}</div>` :
      `<div class="card card-body row" style="margin-bottom:20px">${avatar(r.employee.nama, 'lg')}<div><div class="bold" style="font-size:18px">${esc(r.employee.nama)}</div><div class="small ink2">${esc(r.employee.jabatan)} • ${esc(r.employee.divisi)} • <span class="mono">${esc(r.employee.kode)}</span></div></div></div>
      <div class="card">${r.rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Periode</th><th class="num">Gaji Pokok</th><th class="num">Tunjangan</th><th class="num">Bonus</th><th class="num">Potongan</th><th class="num">Take Home Pay</th><th>Difinalkan</th><th></th></tr></thead><tbody>
        ${r.rows.map(p => `<tr><td class="bold">${bulanLabel(p.periode)}</td><td class="num">${rp(p.gaji_pokok)}</td><td class="num">${rp(p.tunjangan)}</td><td class="num">${rp(p.bonus)}</td><td class="num c-danger">${rp(p.potongan)}</td><td class="num bold c-primary">${rp(p.gaji_bersih)}</td><td class="small ink2">${esc(p.difinalkan_pada)}</td>
        <td class="right nowrap"><button class="btn btn-secondary btn-sm" data-slip="${p.id}">${icon('eye', 'ic-sm')} Lihat</button> <button class="btn btn-dark btn-sm" data-pdf="${p.id}">${icon('download', 'ic-sm')} PDF</button></td></tr>`).join('')}
      </tbody></table></div>` : emptyView('Belum ada slip gaji yang difinalkan.', 'receipt')}</div>`);
  bindSlipButtons(c.view);
};
function bindSlipButtons(root) {
  $$('[data-slip]', root).forEach(b => b.onclick = () => withBusy(b, async () => {
    try {
      const r = await API.call('slipDocument', { id: b.dataset.slip });
      const m = modal({ title: 'Slip Gaji Elektronik', sub: esc(r.fileName), size: 'lg', body: '<iframe class="doc-frame" style="height:640px" sandbox="allow-same-origin allow-modals" id="slip-f"></iframe>',
        foot: `<button class="btn btn-outline" data-close>Tutup</button><button class="btn btn-outline" id="slip-print">${icon('printer')} Cetak</button><button class="btn btn-dark" id="slip-pdf">${icon('download')} Unduh PDF</button>` });
      m.$('#slip-f').srcdoc = r.html;
      m.$('#slip-print').onclick = () => m.$('#slip-f').contentWindow.print();
      m.$('#slip-pdf').onclick = e => slipPdf(b.dataset.slip, e.currentTarget);
    } catch (e) { toast(e.message, 'error'); }
  }));
  $$('[data-pdf]', root).forEach(b => b.onclick = () => slipPdf(b.dataset.pdf, b));
}
function slipPdf(id, btn) {
  return withBusy(btn, async () => {
    try { const r = await API.call('slipDocument', { id, format: 'pdf' }); downloadB64(r.base64, r.fileName, r.mime); toast('Slip gaji PDF diunduh.'); } catch (e) { toast(e.message, 'error'); }
  });
}

/* ======================= PROFIL & AKUN ======================= */
Pages.profile = async (c) => {
  const u = App.user;
  c.view.innerHTML = pageHead({ title: 'Profil & Akun', desc: 'Informasi akun login Anda dan pengaturan keamanan.' }) + `
  <div class="grid-2"><div class="card"><div class="card-head"><h3>${icon('user')} Informasi Akun</h3></div><div class="card-body">
    <div class="row">${avatar(u.nama, 'lg')}<div><div class="bold" style="font-size:18px">${esc(u.nama)}</div><div class="small ink2">${esc(u.email)}</div></div></div>
    <dl class="kv mt-4"><dt>Peran</dt><dd>${chip(u.peran, u.peran === 'Admin' ? 'primary' : 'neutral')}</dd><dt>Jabatan</dt><dd>${esc(u.jabatan || '-')}</dd>
      <dt>Data karyawan</dt><dd>${u.id_employee ? chip('Terhubung', 'success') : chip('Belum terhubung', 'warn')}</dd><dt>Perangkat</dt><dd>${localStorage.getItem('tp_token') ? 'Diingat' : 'Sesi sementara'}</dd></dl>
    <div class="inner mt-4 small ink2">Hak akses diperiksa di server untuk setiap permintaan. ${u.peran === 'Karyawan' ? 'Menu keuangan, payroll, dan pengaturan khusus Admin.' : 'Anda memiliki akses penuh.'}</div>
    <button class="btn btn-danger mt-4" onclick="App.logout()">${icon('logout')} Keluar dari Sistem</button></div></div>
  <div class="card"><div class="card-head"><h3>${icon('key')} Ganti Kata Sandi</h3></div><div class="card-body"><form id="pw" class="stack" novalidate>
    ${field('Kata Sandi Lama', '<input class="input" type="password" name="lama" required autocomplete="current-password">', { req: true })}
    ${field('Kata Sandi Baru', '<input class="input" type="password" name="baru" required minlength="8" autocomplete="new-password">', { req: true, hint: 'Minimal 8 karakter. Kombinasikan huruf besar, kecil, dan angka.' })}
    ${field('Ulangi Kata Sandi Baru', '<input class="input" type="password" name="ulang" required autocomplete="new-password">', { req: true })}
    <button class="btn btn-primary" type="submit">${icon('save')} Simpan Kata Sandi Baru</button>
    <div class="small ink2">Setelah diganti, sesi di perangkat lain otomatis berakhir.</div></form></div></div></div>`;
  $('#pw').onsubmit = async e => {
    e.preventDefault(); const f = e.target; if (!validate(f)) return;
    const d = formData(f);
    if (d.baru.length < 8) return toast('Kata sandi baru minimal 8 karakter.', 'error');
    if (d.baru !== d.ulang) return toast('Ulangi kata sandi tidak sama.', 'error');
    await withBusy(e.submitter, async () => {
      try { const r = await API.call('changePassword', { lama: d.lama, baru: d.baru }); API.setToken(r.token, !!localStorage.getItem('tp_token')); f.reset(); toast('Kata sandi berhasil diganti.'); } catch (err) { toast(err.message, 'error'); }
    });
  };
};
