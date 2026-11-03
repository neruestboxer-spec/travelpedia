/* ============================================================
   APP — login, layout (sidebar/topbar/tabbar), router hash SPA
   ============================================================ */
const Pages = {};

const NAV = [
  { sec: 'OPERASIONAL' },
  { id: 'dashboard', label: 'Dashboard', ic: 'dashboard', href: '#/dashboard' },
  { id: 'customers', label: 'Customer', ic: 'users', href: '#/customers' },
  { id: 'bookings', label: 'Booking', ic: 'ticket', href: '#/bookings' },
  { id: 'departures', label: 'Jadwal Keberangkatan', ic: 'calendar', href: '#/departures' },
  { id: 'trips', label: 'Trip & Daftar Harga', ic: 'compass', href: '#/trips' },
  { id: 'slips', label: 'Slip Gaji Saya', ic: 'receipt', href: '#/slips' },
  { id: 'profile', label: 'Profil & Akun', ic: 'user', href: '#/profile' },
  { sec: 'ADMINISTRASI', admin: true },
  { id: 'finance', label: 'Keuangan', ic: 'chart', href: '#/finance', admin: true },
  { id: 'transactions', label: 'Transaksi Kas', ic: 'banknote', href: '#/transactions', admin: true },
  { id: 'suppliers', label: 'Data Supplier', ic: 'building', href: '#/suppliers', admin: true },
  { id: 'payroll', label: 'Payroll & Penggajian', ic: 'wallet', href: '#/payroll', admin: true },
  { id: 'employees', label: 'Data Karyawan', ic: 'idcard', href: '#/employees', admin: true },
  { id: 'users', label: 'Manajemen Pengguna', ic: 'shield', href: '#/users', admin: true },
  { id: 'settings', label: 'Pengaturan Sistem', ic: 'settings', href: '#/settings', admin: true },
  { id: 'audit', label: 'Log Aktivitas', ic: 'history', href: '#/audit', admin: true }
];

const ROUTES = [
  { re: /^dashboard$/, page: 'dashboard', nav: 'dashboard', crumb: ['Operasional'] },
  { re: /^customers$/, page: 'customers', nav: 'customers', crumb: ['Operasional', 'Customer'] },
  { re: /^customers\/new$/, page: 'customerForm', nav: 'customers', crumb: ['Customer', 'Tambah Baru'] },
  { re: /^customers\/(\w+)\/edit$/, page: 'customerForm', nav: 'customers', crumb: ['Customer', 'Ubah Data'] },
  { re: /^customers\/(\w+)$/, page: 'customerDetail', nav: 'customers', crumb: ['Customer', 'Detail'] },
  { re: /^bookings$/, page: 'bookings', nav: 'bookings', crumb: ['Operasional', 'Booking'] },
  { re: /^bookings\/new$/, page: 'bookingNew', nav: 'bookings', crumb: ['Booking', 'Buat Booking Baru'] },
  { re: /^bookings\/(\w+)\/doc$/, page: 'bookingDoc', nav: 'bookings', crumb: ['Booking', 'Dokumen'] },
  { re: /^bookings\/(\w+)$/, page: 'bookingDetail', nav: 'bookings', crumb: ['Booking', 'Detail Reservasi'] },
  { re: /^departures$/, page: 'departures', nav: 'departures', crumb: ['Operasional', 'Jadwal Keberangkatan'] },
  { re: /^trips$/, page: 'trips', nav: 'trips', crumb: ['Master Data', 'Trip & Daftar Harga'] },
  { re: /^trips\/new$/, page: 'tripForm', nav: 'trips', crumb: ['Trip', 'Tambah Trip'], admin: true },
  { re: /^trips\/(\w+)\/edit$/, page: 'tripForm', nav: 'trips', crumb: ['Trip', 'Ubah Trip'], admin: true },
  { re: /^trips\/(\w+)$/, page: 'tripDetail', nav: 'trips', crumb: ['Trip', 'Detail'] },
  { re: /^slips$/, page: 'slips', nav: 'slips', crumb: ['Operasional', 'Slip Gaji Saya'] },
  { re: /^profile$/, page: 'profile', nav: 'profile', crumb: ['Akun', 'Profil'] },
  { re: /^finance$/, page: 'finance', nav: 'finance', crumb: ['Administrasi', 'Keuangan & Laba/Rugi'], admin: true },
  { re: /^transactions$/, page: 'transactions', nav: 'transactions', crumb: ['Administrasi', 'Transaksi Keuangan'], admin: true },
  { re: /^suppliers$/, page: 'suppliers', nav: 'suppliers', crumb: ['Administrasi', 'Data Supplier'], admin: true },
  { re: /^payroll$/, page: 'payroll', nav: 'payroll', crumb: ['Administrasi', 'Payroll & Penggajian'], admin: true },
  { re: /^employees$/, page: 'employees', nav: 'employees', crumb: ['Administrasi', 'Data Karyawan'], admin: true },
  { re: /^users$/, page: 'users', nav: 'users', crumb: ['Administrasi', 'Manajemen Pengguna'], admin: true },
  { re: /^settings$/, page: 'settings', nav: 'settings', crumb: ['Administrasi', 'Pengaturan Sistem'], admin: true },
  { re: /^audit$/, page: 'audit', nav: 'audit', crumb: ['Administrasi', 'Log Aktivitas'], admin: true }
];

const App = {
  user: null,
  settings: {},
  _nav: 0,

  isAdmin() { return this.user && this.user.peran === 'Admin'; },

  async boot() {
    window.addEventListener('hashchange', () => this.route());
    if (!API.token) return this.renderLogin();
    document.body.innerHTML = `<div class="boot">${loadingView('Menyiapkan ruang kerja...')}</div>`;
    try {
      const me = await API.call('me');
      this.user = me.user; this.settings = me.settings;
      this.renderShell();
      this.route();
    } catch (e) {
      if (e.code !== 401) this.renderLogin(e.message);
    }
  },

  /* ---------------- LOGIN ---------------- */
  renderLogin(error) {
    document.body.innerHTML = `
    <div class="login-page">
      <svg class="route" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
        <path d="M220 830 C 330 880, 460 840, 520 770" fill="none" stroke="#E7CDB5" stroke-width="2" stroke-dasharray="7 9"/>
        <path d="M1080 610 C 1250 560, 1300 420, 1420 355" fill="none" stroke="#E7CDB5" stroke-width="2" stroke-dasharray="7 9"/>
        <path d="M1405 345 l 18 12 -20 6 z" fill="#E7CDB5"/>
      </svg>
      <form class="login-card" id="login-form" novalidate>
        <div class="login-logo"><div class="logo">${icon('plane')}</div></div>
        <div class="center mt-4" style="font-weight:700;font-size:18px">${esc(CONFIG.APP_NAME)} <span class="chip chip-primary" style="vertical-align:2px">ERP</span></div>
        <div class="center ink2 small mt-1">Sistem Manajemen Bisnis Travel</div>
        <h1>Masuk ke Akun Anda</h1>
        <p class="lead">Silakan masukkan kredensial resmi staf untuk mengakses portal operasional.</p>
        <div id="login-alert">${error ? this._loginAlert(error) : ''}</div>
        <div class="field"><label><span>Email Staf</span><small>STAF@ID</small></label>
          <div class="input-icon">${icon('mail')}<input class="input" type="email" name="email" autocomplete="username" placeholder="nama@travelpedia.id" required></div></div>
        <div class="field"><label><span>Kata Sandi</span><small>SEC_KEY</small></label>
          <div class="input-icon">${icon('lock')}<input class="input" type="password" name="password" autocomplete="current-password" placeholder="••••••••" required>
          <button type="button" class="icon-btn tail" id="toggle-pass" aria-label="Tampilkan sandi">${icon('eye')}</button></div></div>
        <div class="row-between mt-4">
          <label class="checkbox"><input type="checkbox" name="remember" checked> Ingat perangkat ini</label>
          <a href="javascript:void 0" id="help-link" class="small">Bantuan Akses?</a>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Masuk ke Aplikasi ${icon('arrow-right')}</button>
        <div class="center small ink2 mt-4">Lupa kata sandi? Hubungi admin ${icon('arrow-up-right', 'ic-sm')}</div>
        <div class="login-badge">${icon('shield-check', 'ic-sm')} Akses Khusus Staf Terdaftar • Google Workspace Connected</div>
      </form>
    </div>`;
    const f = $('#login-form');
    $('#toggle-pass').onclick = () => {
      const p = f.password; p.type = p.type === 'password' ? 'text' : 'password';
      $('#toggle-pass').innerHTML = icon(p.type === 'password' ? 'eye' : 'eye-off');
    };
    $('#help-link').onclick = () => modal({ title: 'Bantuan Akses', size: 'sm',
      body: '<p class="mt-0 ink2" style="line-height:22px">Akun dibuat oleh Admin melalui menu <b>Manajemen Pengguna</b>. Jika lupa kata sandi atau akun dinonaktifkan, hubungi Admin untuk reset.</p>',
      foot: '<button class="btn btn-primary" data-close>Mengerti</button>' });
    f.onsubmit = async e => {
      e.preventDefault();
      const d = formData(f);
      if (!d.email || !d.password) { $('#login-alert').innerHTML = this._loginAlert('Email dan kata sandi wajib diisi.'); return; }
      const btn = $('button[type=submit]', f);
      await withBusy(btn, async () => {
        try {
          const r = await API.call('login', { email: d.email, password: d.password });
          API.setToken(r.token, d.remember);
          this.user = r.user; this.settings = r.settings;
          if (!location.hash || location.hash === '#/' || location.hash === '#') location.hash = '#/dashboard';
          this.renderShell();
          this.route();
        } catch (err) {
          $('#login-alert').innerHTML = this._loginAlert(err.message);
        }
      });
    };
  },
  _loginAlert(msg) {
    return `<div class="login-alert">${icon('alert-circle')}<div><b>Autentikasi Gagal</b>${esc(msg)}</div></div>`;
  },

  /* ---------------- SHELL ---------------- */
  renderShell() {
    const u = this.user, admin = this.isAdmin();
    const s = this.settings || {};
    const brandName = s.NAMA_PERUSAHAAN || CONFIG.APP_NAME;
    let nav = '';
    NAV.forEach(n => {
      if (n.admin && !admin) return;
      if (n.sec) { nav += (n.admin ? '<hr>' : '') + `<div class="nav-sec"><span>${n.sec}</span>${n.admin ? '<span class="chip chip-primary">ADMIN</span>' : ''}</div>`; return; }
      nav += `<a href="${n.href}" data-nav="${n.id}" title="${esc(n.label)}">${icon(n.ic)}<span>${esc(n.label)}</span></a>`;
    });
    document.body.innerHTML = `
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="logo">${s.LOGO_URL ? `<img src="${esc(s.LOGO_URL)}" alt="">` : icon('plane')}</div>
          <div class="txt"><div class="name">${esc(brandName)}</div><div class="tag">${esc(CONFIG.APP_TAGLINE)}</div></div></div>
        <nav class="nav">${nav}</nav>
        <div class="side-foot"><a id="logout-btn">${icon('logout')}<span>Keluar Sistem</span></a></div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn show-sm" id="menu-btn" aria-label="Menu">${icon('menu')}</button>
          <div class="crumbs" id="crumbs"></div>
          <div class="topsearch input-icon">${icon('search')}
            <input class="input" id="gsearch" placeholder="Cari booking, customer, trip..." autocomplete="off">
            <span class="kbd">Ctrl K</span><div class="search-pop hidden" id="gsearch-pop"></div></div>
          <button class="icon-btn" id="bell" aria-label="Notifikasi">${icon('bell')}<span class="count hidden" id="bell-count"></span></button>
          <div class="userchip" id="userchip">${avatar(u.nama)}
            <div class="txt"><div class="nm">${esc(u.nama)} <span class="chip ${admin ? 'chip-primary' : 'chip-neutral'}">${esc(u.peran)}</span></div>
            <div class="em">${esc(u.email)}</div></div></div>
        </header>
        <main class="view" id="view"></main>
      </div>
      <nav class="tabbar">
        <a href="#/dashboard" data-tab="dashboard">${icon('dashboard')}Beranda</a>
        <a href="#/bookings" data-tab="bookings">${icon('ticket')}Booking</a>
        <a href="#/departures" data-tab="departures">${icon('calendar')}Jadwal</a>
        <a href="#/customers" data-tab="customers">${icon('users')}Customer</a>
        <a id="tab-more" data-tab="more">${icon('menu')}Menu</a>
      </nav>
    </div>`;
    $('#logout-btn').onclick = () => this.logout();
    $('#userchip').onclick = () => this.go('#/profile');
    const toggleSide = (open) => {
      const sb = $('#sidebar');
      sb.classList.toggle('open', open);
      const scrim = $('.scrim');
      if (open && !scrim) { const d = document.createElement('div'); d.className = 'scrim'; d.onclick = () => toggleSide(false); document.body.appendChild(d); }
      if (!open && scrim) scrim.remove();
    };
    $('#menu-btn').onclick = () => toggleSide(true);
    $('#tab-more').onclick = () => toggleSide(true);
    $$('.nav a').forEach(a => a.addEventListener('click', () => toggleSide(false)));
    $('#bell').onclick = () => this.showReminders();
    this._bindSearch();
    this.refreshNotif();
  },

  async refreshNotif() {
    try {
      const d = await API.cached('getDashboard', {}, 300000);
      this.setNotif(d.notifikasi, d.pengingat);
    } catch (e) { /* abaikan */ }
  },
  setNotif(n, list) {
    if (list) this._reminders = list;
    const el = $('#bell-count'); if (!el) return;
    el.textContent = n; el.classList.toggle('hidden', !n);
  },
  showReminders() {
    const list = this._reminders || [];
    modal({
      title: 'Pengingat Jatuh Tempo', sub: 'Tagihan customer yang jatuh tempo dalam 14 hari ke depan',
      body: list.length ? list.map(b => `<a class="feed-item" style="display:flex;color:inherit;text-decoration:none" href="#/bookings/${b.id}" data-close>
          <div><div class="bold">${esc(b.kode)} · ${esc(b.customer_nama)}</div><div class="small ink2">${esc(b.trip_nama)}</div></div>
          <div class="right"><div class="mono c-danger bold">${rp(b.sisa)}</div><div class="small ${b.jatuh_tempo < today() ? 'c-danger' : 'ink2'}">Tempo ${tgl(b.jatuh_tempo)}</div></div></a>`).join('')
        : emptyView('Tidak ada tagihan yang mendekati jatuh tempo. 🎉', 'check-circle'),
      foot: `<button class="btn btn-outline" data-close>Tutup</button><a class="btn btn-primary" href="#/bookings?piutang=1" data-close>Lihat Semua Piutang</a>`
    });
  },

  _bindSearch() {
    const inp = $('#gsearch'), pop = $('#gsearch-pop');
    let results = [];
    const run = debounce(async q => {
      if (q.length < 2) { pop.classList.add('hidden'); return; }
      pop.innerHTML = '<div class="grp">Mencari...</div>'; pop.classList.remove('hidden');
      try {
        const [c, b] = await Promise.all([API.call('listCustomers', { q, size: 5 }), API.call('listBookings', { q, size: 5 })]);
        if (inp.value.trim() !== q) return;
        results = [...b.rows.map(x => ({ href: '#/bookings/' + x.id, ic: 'ticket', t: x.kode + ' · ' + x.customer_nama, s: x.trip_nama + ' · ' + tgl(x.berangkat) })),
          ...c.rows.map(x => ({ href: '#/customers/' + x.id, ic: 'user', t: x.nama, s: x.kode + ' · ' + x.hp }))];
        pop.innerHTML = results.length ? (b.rows.length ? '<div class="grp">BOOKING</div>' : '') +
          results.map((r, i) => (i === b.rows.length && c.rows.length ? '<div class="grp">CUSTOMER</div>' : '') +
            `<a href="${r.href}" class="${i === 0 ? 'active' : ''}">${icon(r.ic)}<div class="grow"><div class="bold">${esc(r.t)}</div><div class="xs ink2">${esc(r.s)}</div></div></a>`).join('')
          : '<div class="grp">Tidak ada hasil untuk "' + esc(q) + '"</div>';
      } catch (e) { pop.innerHTML = '<div class="grp">' + esc(e.message) + '</div>'; }
    }, 350);
    inp.addEventListener('input', () => run(inp.value.trim()));
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && results[0]) { this.go(results[0].href); inp.value = ''; pop.classList.add('hidden'); }
      if (e.key === 'Escape') { inp.blur(); pop.classList.add('hidden'); }
    });
    inp.addEventListener('blur', () => setTimeout(() => pop.classList.add('hidden'), 200));
    pop.addEventListener('click', () => { inp.value = ''; pop.classList.add('hidden'); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); }
    });
  },

  /* ---------------- ROUTER ---------------- */
  go(hash) { if (location.hash === hash) this.route(); else location.hash = hash; },
  parseHash() {
    const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => query[k] = v);
    return { path: path || 'dashboard', query };
  },
  setQuery(q) {
    const { path } = this.parseHash();
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined && v !== null)).toString();
    history.replaceState(null, '', '#/' + path + (qs ? '?' + qs : ''));
  },
  async route() {
    if (!this.user) return;
    const { path, query } = this.parseHash();
    let route = ROUTES.find(r => r.re.test(path));
    const view = $('#view');
    if (!view) return;
    if (!route) { location.hash = '#/dashboard'; return; }
    if (route.admin && !this.isAdmin()) {
      view.innerHTML = `<div class="card">${emptyView('<b>Akses ditolak.</b><br>Halaman ini khusus Admin.', 'lock', '<a class="btn btn-primary" href="#/dashboard">Kembali ke Dashboard</a>')}</div>`;
      return;
    }
    const params = path.match(route.re).slice(1);
    const navId = ++this._nav;
    $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === route.nav));
    $$('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === route.nav));
    $('#crumbs').innerHTML = `<span>${esc(this.settings.NAMA_PERUSAHAAN || CONFIG.APP_NAME)}</span>` +
      route.crumb.map((c, i) => icon('chevron-right') + (i === route.crumb.length - 1 ? `<b>${esc(c)}</b>` : `<span>${esc(c)}</span>`)).join('');
    hideTip();
    window.scrollTo(0, 0);
    view.innerHTML = loadingView();
    const ctx = { view, params, query, alive: () => navId === this._nav };
    try {
      await Pages[route.page](ctx);
      if (ctx.alive()) bindTips(view);
    } catch (e) {
      console.error(e);
      if (ctx.alive() && e.code !== 401) view.innerHTML = errorView(e.message, true);
    }
  },

  sessionExpired(msg) {
    API.setToken(null);
    API.clear();
    this.user = null;
    $$('.modal-back').forEach(m => m.remove());
    this.renderLogin(msg || 'Sesi berakhir. Silakan login kembali.');
  },
  async logout() {
    const ok = await confirmDialog({ title: 'Keluar dari sistem?', message: 'Sesi Anda di perangkat ini akan diakhiri.', confirmText: 'Keluar' });
    if (!ok) return;
    try { await API.call('logout'); } catch (e) { /* tetap keluar */ }
    API.setToken(null); API.clear(); this.user = null;
    location.hash = '';
    this.renderLogin();
  }
};

document.addEventListener('DOMContentLoaded', () => App.boot());
