/* 多端同步：基础模块（远程地址同步 + 轮询）
 * 配对码同步的全部逻辑已移到独立文件 sync-paircode.js（window.W.PairSync），
 * 本文件只负责「远程地址同步」与通用的 cfg()/设备身份，避免主文件过载。
 *
 * 远程全量同步契约：
 *   PUT {url}  body = { updatedAt, data }  headers: Authorization: Bearer <token> 或 X-Master-Key: <token>
 *   GET {url}  返回同样结构
 * 详见 sync-server/README.md。
 */
(function () {
  var W = window.W, S = W.S;
  var META = 'wb_sync_meta';
  var DEV = 'wb_dev_id';
  var NAME = 'wb_dev_name';
  var timer = null;

  function meta() { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } }
  function setMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} }

  function def() {
    return {
      mode: 'local', url: '', token: '', auto: true, interval: 20,
      pairCode: '', pairPass: '', deviceId: devId(), deviceName: devName()
    };
  }
  function cfg() {
    var s = S.get();
    if (!s) return def();
    if (!s.cfg) s.cfg = {};
    if (!s.cfg.sync) s.cfg.sync = def();
    var c = s.cfg.sync;
    if (!c.mode) c.mode = 'local';
    if (typeof c.interval !== 'number' || c.interval <= 0) c.interval = 20;
    if (typeof c.auto !== 'boolean') c.auto = true;
    if (!c.deviceId) c.deviceId = devId();
    if (!c.deviceName) c.deviceName = devName();
    return c;
  }

  function devId() {
    var d = '';
    try { d = localStorage.getItem(DEV); } catch (e) {}
    if (!d) {
      d = 'D' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      try { localStorage.setItem(DEV, d); } catch (e) {}
    }
    return d;
  }
  function devName() {
    var n = '';
    try { n = localStorage.getItem(NAME); } catch (e) {}
    if (!n) {
      var ua = navigator.userAgent || '';
      var plat = /iPad|iPhone|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : '设备';
      n = plat + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      try { localStorage.setItem(NAME, n); } catch (e) {}
    }
    return n;
  }

  function head(token) {
    var h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) { h['Authorization'] = 'Bearer ' + token; h['X-Master-Key'] = token; }
    return h;
  }
  function baseUrl(c) { var u = (c.url || '').trim(); return u ? u.replace(/\/$/, '') : ''; }

  /* ---------- 全量远程同步 ---------- */
  function push() {
    var c = cfg();
    if (c.mode === 'supabase' && window.W && W.SupaSync) return W.SupaSync.push();
    if (c.mode !== 'remote' || !c.url) return Promise.resolve();
    var p = { updatedAt: Date.now(), data: S.exportJSON() };
    return fetch(c.url, { method: 'PUT', headers: head(c.token), body: JSON.stringify(p) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); setMeta({ updatedAt: p.updatedAt }); })
      .catch(function (e) { console.warn('[sync] push failed', e); });
  }
  function pull() {
    var c = cfg();
    if (c.mode === 'supabase' && window.W && W.SupaSync) return W.SupaSync.pull();
    if (c.mode !== 'remote' || !c.url) return Promise.resolve();
    var local = meta().updatedAt || 0;
    return fetch(c.url, { method: 'GET', headers: head(c.token) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rem) {
        if (rem && rem.data && typeof rem.updatedAt === 'number' && rem.updatedAt > local) {
          setMeta({ updatedAt: rem.updatedAt }); S.importJSON(rem.data);
        }
      }).catch(function (e) { console.warn('[sync] pull failed', e); });
  }

  /* ---------- 定时轮询 ---------- */
  function start() {
    stop();
    var c = cfg();
    if (c.auto && c.mode === 'remote' && c.url) {
      var iv = (c.interval && c.interval > 0) ? c.interval : 20;
      timer = setInterval(function () { pull(); }, iv * 1000);
      console.log('[sync] polling every ' + iv + 's (remote)');
    }
    // 配对码轮询交给独立模块
    if (window.W && W.PairSync) W.PairSync.start();
    // 云端同步（Supabase）轮询
    if (window.W && W.SupaSync) W.SupaSync.start();
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } if (window.W && W.PairSync) W.PairSync.stop(); if (window.W && W.SupaSync) W.SupaSync.stop(); }

  W.Sync = {
    push: push, pull: pull, start: start, stop: stop, cfg: cfg,
    devId: devId, devName: devName
  };
})();
