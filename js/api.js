/* ============================================================
   API CLIENT — semua komunikasi ke Google Apps Script
   POST text/plain (menghindari CORS preflight) { action, token, data }
   ============================================================ */
const Store = {
  get(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v, remember) {
    try {
      (remember ? localStorage : sessionStorage).setItem(k, v);
      (remember ? sessionStorage : localStorage).removeItem(k);
    } catch (e) { /* storage tidak tersedia */ }
  },
  del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { } }
};

const API = {
  token: Store.get('tp_token'),
  _memo: {},

  async call(action, data = {}, opts = {}) {
    if (!CONFIG.GAS_URL || CONFIG.GAS_URL.includes('GANTI_DENGAN')) {
      throw new Error('GAS_URL belum diisi di js/config.js.');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.REQUEST_TIMEOUT_MS);
    let res;
    try {
      const r = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // WAJIB text/plain
        body: JSON.stringify({ action, token: this.token, data }),
        signal: ctrl.signal,
        redirect: 'follow'
      });
      res = await r.json();
    } catch (e) {
      const msg = e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      throw new Error(msg);
    } finally {
      clearTimeout(timer);
    }
    if (!res.success) {
      if (res.code === 401 && action !== 'login') {
        App.sessionExpired(res.message);
      }
      const err = new Error(res.message || 'Terjadi kesalahan.');
      err.code = res.code;
      throw err;
    }
    if (opts.invalidate) this.clear();
    return res.data;
  },

  /** Cache memori singkat untuk data yang sering dibaca (trip, form booking). */
  async cached(action, data = {}, ttlMs = 60000) {
    const key = action + JSON.stringify(data);
    const hit = this._memo[key];
    if (hit && Date.now() - hit.t < ttlMs) return hit.v;
    const v = await this.call(action, data);
    this._memo[key] = { t: Date.now(), v };
    return v;
  },
  clear() { this._memo = {}; },

  setToken(t, remember) {
    this.token = t;
    if (t) Store.set('tp_token', t, remember); else Store.del('tp_token');
  }
};
