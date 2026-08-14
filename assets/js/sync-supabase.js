/* 云端同步（Supabase）：多端永久同步的后端
 * - 数据用 Web Crypto（AES-GCM + PBKDF2）在本地加密后再上云，云端只存密文，隐私不泄露。
 * - 用「同步码 + 二次密码」当钥匙：三端（手机 / Pad / 电脑）输入同一个同步码即可共享同一份数据。
 * - 依赖浏览器原生 crypto.subtle（HTTPS / localhost 下可用）；不支持的环境自动降级为本地模式。
 * - 后端表结构见 SUPABASE_SETUP.md（建表 SQL + RLS 策略）。
 *
 * 配置来源：localStorage['wb_supabase'] = { url, anonKey }
 * 同步码 / 密码复用 W.Sync.cfg() 的 pairCode / pairPass（与配对码同步同一套钥匙，无需重复记）。
 */
(function () {
  var W = window.W, S = W.S, U = W.U;
  var LS_KEY = 'wb_supabase';
  var TABLE = 'wb_sync';
  var timer = null;
  var META = 'wb_supabase_meta';
  var DIRTY_KEY = 'wb_dirty';
  function clearDirty() { try { localStorage.removeItem(DIRTY_KEY); } catch (e) {} }
  function isDirty() { try { var t = parseInt(localStorage.getItem(DIRTY_KEY) || '0', 10); return t && t > (meta().updatedAt || 0); } catch (e) { return false; } }

  function cfg() { return W.Sync.cfg(); }
  function ls() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
  function setLs(o) { try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {} }
  function meta() { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } }
  function setMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} }

  function hasCrypto() { return !!(window.crypto && window.crypto.subtle); }
  function b64(buf) {
    var bytes = new Uint8Array(buf);
    var len = bytes.byteLength;
    var chunk = 32768;
    var binary = '';
    for (var i = 0; i < len; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, len)));
    }
    return window.btoa(binary);
  }
  function unb64(s) { var b = window.atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; }

  /* ---- 加密 / 解密 ---- */
  function deriveKey(pass, saltBuf) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
      .then(function (k) { return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltBuf, iterations: 100000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); });
  }
  function encrypt(obj, pass) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(pass, salt.buffer).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj)))
        .then(function (ct) { return b64(salt) + ':' + b64(iv) + ':' + b64(ct); });
    });
  }
  function decrypt(blob, pass) {
    var p = String(blob).split(':'); if (p.length !== 3) throw new Error('bad blob');
    return deriveKey(pass, unb64(p[0])).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(unb64(p[1])) }, key, unb64(p[2]))
        .then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)); });
    });
  }

  /* ---- Supabase REST ---- */
  function apiUrl() { var u = (ls().url || '').trim().replace(/\/$/, ''); return u ? u + '/rest/v1/' + TABLE : ''; }
  function headers() { return { 'Content-Type': 'application/json', 'apikey': ls().anonKey || '', 'Authorization': 'Bearer ' + (ls().anonKey || ''), 'Prefer': 'resolution=merge-duplicates' }; }
  function code() { return (cfg().pairCode || '').trim().toUpperCase(); }
  function passphrase() { return code() + ':' + (cfg().pairPass || ''); }
  function plat() {
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Linux/.test(ua)) return 'Linux';
    return '其它设备';
  }
  function myDevice() {
    var c = cfg();
    return { id: c.deviceId, name: (c.deviceName || W.Sync.devName()), platform: plat(), lastSeen: Date.now() };
  }
  function mergeDevice(list, me) {
    list = list || [];
    var found = false, i;
    for (i = 0; i < list.length; i++) { if (list[i].id === me.id) { list[i] = me; found = true; break; } }
    if (!found) list.push(me);
    list.sort(function (a, b) { return (b.lastSeen || 0) - (a.lastSeen || 0); });
    return list.slice(0, 20);
  }

  function push() {
    if (!hasCrypto() || !apiUrl() || !code()) return Promise.resolve();
    var me = myDevice();
    var list = mergeDevice(meta().devices || [], me);
    var m = meta(); m.devices = list; setMeta(m);
    var payload = { updatedAt: Date.now(), data: S.exportJSON(), devices: list };
    return encrypt(payload, passphrase()).then(function (ct) {
      return fetch(apiUrl() + '?code=eq.' + encodeURIComponent(code()), {
        method: 'POST', headers: headers(), body: JSON.stringify([{ code: code(), data: ct, updated_at: Date.now() }])
      }).then(function (r) {
        if (r.ok) { clearDirty(); var m = meta(); m.updatedAt = Date.now(); m.lastError = ''; setMeta(m); return; }
        return r.text().then(function (body) {
          var msg = 'HTTP ' + r.status;
          try { var j = JSON.parse(body); if (j && j.message) msg += ' · ' + j.message; else if (j && j.error) msg += ' · ' + j.error; } catch (e) {}
          if (!body) msg += ' · （服务器无响应体，可能 URL 拼错 / 项目被暂停 / 网络被拦截）';
          throw new Error(msg);
        });
      });
    }).catch(function (e) { console.warn('[supa] push failed', e); var m = meta(); m.lastError = String((e && e.message) || e); setMeta(m); });
  }
  function pull() {
    if (!hasCrypto() || !apiUrl() || !code()) return Promise.resolve();
    var local = meta().updatedAt || 0;
    return fetch(apiUrl() + '?code=eq.' + encodeURIComponent(code()) + '&select=code,data,updated_at', { method: 'GET', headers: headers() })
      .then(function (r) { if (r.ok) return r.json(); return r.text().then(function (body) { var msg = 'HTTP ' + r.status; try { var j = JSON.parse(body); if (j && j.message) msg += ' · ' + j.message; else if (j && j.error) msg += ' · ' + j.error; } catch (e) {} if (!body) msg += ' · （服务器无响应体，可能 URL 拼错 / 项目被暂停 / 网络被拦截）'; throw new Error(msg); }); })
      .then(function (rows) {
        var row = rows && rows[0];
        if (row && row.data && typeof row.updated_at === 'number' && row.updated_at > local) {
          // 本地存在尚未上传到云端的改动时，优先保留本地（由轮询的 push 负责上传），
          // 避免把云端旧数据整体拉下来覆盖掉本机刚新增的记录。
          if (isDirty()) { var mm = meta(); mm.lastError = ''; setMeta(mm); return; }
          return decrypt(row.data, passphrase()).then(function (rem) {
            if (rem && rem.data) {
              S.importJSON(rem.data);
              var m = meta(); m.updatedAt = row.updated_at; m.lastError = '';
              if (rem.devices && rem.devices.length) m.devices = rem.devices;
              setMeta(m);
            }
          });
        }
      }).catch(function (e) { console.warn('[supa] pull failed', e); var m = meta(); m.lastError = String((e && e.message) || e); setMeta(m); });
  }

  function start() {
    stop();
    var c = cfg();
    if (c.auto && c.mode === 'supabase' && apiUrl() && code()) {
      var iv = (c.interval && c.interval > 0) ? c.interval : 20;
      timer = setInterval(function () {
        // 所有设备都先拉（把其它端的改动合并进来）再推（上传本机改动），
        // 这样每台设备既是「主机」也互相同步，避免「非主机只拉不推」导致本机新增记录被云端旧数据覆盖丢失。
        pull().then(function () { return push(); });
      }, iv * 1000);
      console.log('[supa] polling every ' + iv + 's, master=' + amMaster());
    }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function configure(opts) { if (opts && opts.url) { var o = ls(); o.url = opts.url; if (opts.anonKey) o.anonKey = opts.anonKey; setLs(o); } }
  function listDevices() {
    var me = myDevice();
    var list = (meta().devices || []).slice();
    var found = false;
    list = list.map(function (d) { if (d && d.id === me.id) { found = true; return me; } return d; });
    if (!found) list.unshift(me);
    return Promise.resolve(list.map(function (d) {
      return { id: d.id, name: d.name, platform: d.platform, lastSeen: d.lastSeen, isMe: d.id === me.id, isMaster: d.id === masterId() };
    }));
  }
  function masterId() {
    return meta().masterDeviceId || '';
  }
  function amMaster() {
    var mid = masterId();
    if (!mid) return true; // 未指定主机时默认本机可推
    return mid === cfg().deviceId;
  }
  function setMaster(id) {
    var m = meta();
    m.masterDeviceId = id;
    setMeta(m);
    // 把主机标记随设备列表一起推上云
    return push();
  }
  // 仅拉取远程 payload 的 meta（devices / updatedAt），不导入数据，不刷新页面
  function fetchRemoteMeta() {
    if (!hasCrypto() || !apiUrl() || !code()) return Promise.resolve(null);
    return fetch(apiUrl() + '?code=eq.' + encodeURIComponent(code()) + '&select=code,data,updated_at', { method: 'GET', headers: headers() })
      .then(function (r) { if (r.ok) return r.json(); return r.text().then(function (body) { var msg = 'HTTP ' + r.status; try { var j = JSON.parse(body); if (j && j.message) msg += ' · ' + j.message; else if (j && j.error) msg += ' · ' + j.error; } catch (e) {} if (!body) msg += ' · （服务器无响应体）'; throw new Error(msg); }); })
      .then(function (rows) {
        var row = rows && rows[0];
        if (!row || !row.data) return null;
        return decrypt(row.data, passphrase()).then(function (rem) {
          var m = meta(); m.lastError = ''; setMeta(m);
          return { updatedAt: row.updated_at || 0, devices: (rem && rem.devices) || [] };
        });
      }).catch(function (e) { console.warn('[supa] fetchRemoteMeta failed', e); var m = meta(); m.lastError = String((e && e.message) || e); setMeta(m); throw e; });
  }

  W.SupaSync = { configure: configure, push: push, pull: pull, start: start, stop: stop, listDevices: listDevices, fetchRemoteMeta: fetchRemoteMeta, setMaster: setMaster, amMaster: amMaster, masterId: masterId, lastError: function () { return meta().lastError || ''; }, ready: function () { return !!(apiUrl() && code()); } };
})();
