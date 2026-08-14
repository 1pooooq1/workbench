/* 多端同步模块（独立模块，挂在 window.W.PairSync）
 * 仅保留「Supabase 云端同步」一种方式：
 *   - Supabase URL + Anon Key 当云端地址（第一步）
 *   - 配对码 + 二次密码 当云端钥匙（第二步，三端填同一配对码即共享同一份数据）
 * 数据在本地用 Web Crypto 加密后才上云（见 sync-supabase.js），云端只见密文。
 * 已删除「同步服务器地址 / 固定源 / 远程地址同步」等自建服务器相关功能。
 * 依赖：W.Sync.cfg() 提供 { mode,url,token,pairCode,pairPass,deviceId,deviceName,auto,interval }
 *       加解密与云端读写由 sync-supabase.js（window.W.SupaSync）负责。
 */
(function () {
  var W = window.W, S = W.S, U = W.U;
  var QR = window.qrcode;
  var timer = null;
  var META = 'wb_sync_meta';
  // 配对码字符集：去掉易混淆的 I O 0 1
  var PAIR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var PAIR_LEN = 8;
  var pendingCode = '';   // 通过分享链接/扫码获得的待填入配对码（加入前临时保存）

  /* ---------- 基础工具 ---------- */
  function cfg() { return W.Sync.cfg(); }
  function ls() { try { return JSON.parse(localStorage.getItem('wb_supabase')) || {}; } catch (e) { return {}; } }
  function setLs(o) { try { localStorage.setItem('wb_supabase', JSON.stringify(o)); } catch (e) {} }
  function meta() { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch (e) { return {}; } }
  function setMeta(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} }
  function genCode(n) {
    n = n || PAIR_LEN; var out = '', i, a;
    if (window.crypto && window.crypto.getRandomValues) {
      a = new Uint32Array(n); window.crypto.getRandomValues(a);
      for (i = 0; i < n; i++) out += PAIR_CHARS[a[i] % PAIR_CHARS.length];
    } else { for (i = 0; i < n; i++) out += PAIR_CHARS[Math.floor(Math.random() * PAIR_CHARS.length)]; }
    return out;
  }

  function el(t, o, txt) {
    o = o || {}; var e = document.createElement(t);
    for (var k in o) {
      if (k === 'class') e.className = o[k];
      else if (k === 'style') e.style.cssText = o[k];
      else if (k === 'value') e.value = o[k];
      else if (k === 'type') e.type = o[k];
      else if (k === 'placeholder') e.placeholder = o[k];
      else if (k === 'id') e.id = o[k];
      else e.setAttribute(k, o[k]);
    }
    if (txt != null) e.textContent = txt;
    return e;
  }
  // 显示/隐藏眼睛按钮
  function eyeToggle(input) {
    var b = el('button', { class: 'btn ic', type: 'button' }, '👁');
    b.onclick = function () {
      if (input.type === 'password') { input.type = 'text'; b.textContent = '🙈'; }
      else { input.type = 'password'; b.textContent = '👁'; }
    };
    b.style.position = 'absolute';
    b.style.right = '6px';
    b.style.top = '50%';
    b.style.transform = 'translateY(-50%)';
    b.style.border = 'none';
    b.style.background = 'transparent';
    b.style.cursor = 'pointer';
    b.style.fontSize = '16px';
    b.style.padding = '2px 4px';
    b.style.lineHeight = '1';
    return b;
  }
  function btn(t, cls, fn) { var b = el('button', { class: 'btn ' + (cls || 'sm'), type: 'button' }, t); b.onclick = fn; return b; }
  function lbl(t) { return el('label', { class: 'lbl' }, t); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // 把配对码 + 二次密码写入配置并设为 Supabase 模式
  function applyPair(code, pass) {
    var c = cfg();
    c.mode = 'supabase';
    c.pairCode = code;
    c.pairPass = pass;
    if (pass) c.pairPass = pass;
    S.save();
  }

  /* ---------- 轮询（统一交由 SupaSync 负责） ---------- */
  function start() {
    stop();
    // Supabase 的定时轮询由 W.SupaSync.start() 负责（W.Sync.start 会调用它），
    // 这里不再单独启动定时器，避免双重轮询。
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  /* ---------- 创建 / 加入配对码（Supabase 模式） ---------- */
  function createUI() {
    U.modal({ title: '创建配对码', fields: [
      { key: 'code', label: '配对码（留空随机生成 ' + PAIR_LEN + ' 位，或自定义 4-16 位字母数字）', ph: '如 ABCD1234' },
      { key: 'pass', label: '二次同步密码（必填，其它设备也需输入）', ph: '设置一个密码', type: 'password' },
      { key: 'name', label: '本机名称（可选）', ph: '如 我的iPad' }
    ], okText: '创建' }).then(function (r) {
      if (!r) return;
      if (!r.pass) { U.toast('请填写二次密码'); return; }
      var code = (r.code || '').trim().toUpperCase();
      if (code && !/^[A-Z0-9]{4,16}$/.test(code)) { U.toast('配对码需为 4-16 位字母数字'); return; }
      if (!code) code = genCode();
      applyPair(code, r.pass);
      if (r.name) { var c2 = cfg(); c2.deviceName = r.name; try { localStorage.setItem('wb_dev_name', r.name); } catch (e) {} S.save(); }
      if (window.W && W.SupaSync && ls().url) {
        W.SupaSync.push().then(function () { U.toast('配对码已创建并上传：' + code); var b = document.getElementById('syncBox'); if (b) render(b); })
          .catch(function () { U.toast('配对码已创建：' + code + '（请先在上方保存 Supabase 配置）'); var b = document.getElementById('syncBox'); if (b) render(b); });
      } else {
        U.toast('配对码已创建：' + code + '（请先在上方保存 Supabase 配置）');
        var b = document.getElementById('syncBox'); if (b) render(b);
      }
    });
  }
  function joinUI() {
    var box = document.getElementById('syncBox'); if (!box) return;
    var code = (box.querySelector('#ppin').value || '').trim().toUpperCase();
    var pass = box.querySelector('#ppass').value || '';
    if (!code) { U.toast('请输入配对码'); return; }
    if (!pass) { U.toast('请输入二次密码'); return; }
    pendingCode = ''; // 已消费
    applyPair(code, pass);
    if (window.W && W.SupaSync && ls().url) {
      W.SupaSync.pull().then(function () { return W.SupaSync.push(); })
        .then(function () { U.toast('已加入并同步数据'); var b = document.getElementById('syncBox'); if (b) render(b); })
        .catch(function () { U.toast('已保存，但云端暂无数据或拉取失败'); var b = document.getElementById('syncBox'); if (b) render(b); });
    } else {
      U.toast('已保存配对码（请先在上方保存 Supabase 配置）');
      var b = document.getElementById('syncBox'); if (b) render(b);
    }
  }

  /* ---------- 分享链接 / 二维码（仅携带配对码，新设备打开自动填码） ---------- */
  function shareLink() {
    var c = cfg();
    if (!c.pairCode) return '';
    var base = (location.origin || '') + (location.pathname || '/');
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'pair=' + encodeURIComponent(c.pairCode);
  }
  function copyLink() {
    var link = shareLink();
    if (!link) { U.toast('请先创建或加入配对码'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () { U.toast('已复制配对链接'); }).catch(function () { U.toast(link); });
    } else { U.toast(link); }
  }
  function showQR() {
    var c = cfg();
    if (!c.pairCode) { U.toast('请先创建或加入配对码'); return; }
    var link = shareLink();
    var svg = '';
    try { var qr = QR(0, 'M'); qr.addData(link); qr.make(); svg = qr.createSvgTag({ cellSize: 6, margin: 8 }); } catch (e) { svg = ''; }
    var html = '<div style="text-align:center">' + (svg || '生成失败') +
      '<div class="small muted" style="margin-top:8px">用另一台设备扫码，将自动打开本工作台并填入配对码；<b>二次密码仍需手动输入</b>（双重安全）。</div>' +
      '<div style="margin-top:10px;display:flex;gap:6px">' +
        '<input id="shareLink" class="inp" style="flex:1;min-width:0" readonly value="' + esc(link) + '">' +
        '<button class="btn sm" id="copyLinkBtn">复制</button>' +
      '</div></div>';
    U.modal({ title: '配对二维码 / 分享链接', html: html, okText: '关闭' });
    setTimeout(function () {
      var b = document.getElementById('copyLinkBtn');
      if (b) b.onclick = function () { copyLink(); };
    }, 60);
  }
  function scanUI() {
    if (!('BarcodeDetector' in window)) { U.toast('当前浏览器不支持扫码，请手动输入配对码'); return; }
    U.modal({ title: '扫码加入', html: '<video id="scanVid" playsinline style="width:100%;border-radius:10px;background:#000"></video><div class="small muted" style="margin-top:6px">将二维码对准摄像头</div>', okText: '取消' })
      .then(function () { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); });
    var vid = document.getElementById('scanVid'); if (!vid) return;
    var stream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function (s) {
      stream = s; vid.srcObject = s; vid.play(); loop();
    }).catch(function (e) { U.toast('无法打开摄像头：' + (e && e.message || e)); });
    function loop() {
      if (!vid.srcObject) return;
      var cv = document.createElement('canvas'); cv.width = vid.videoWidth || 320; cv.height = vid.videoHeight || 240;
      var ctx = cv.getContext('2d'); ctx.drawImage(vid, 0, 0, cv.width, cv.height);
      try {
        var bd = new BarcodeDetector();
        bd.detect(cv).then(function (res) {
          if (res && res[0]) {
            if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
            var v = res[0].rawValue, code = '';
            var parts = v.split('|');
            if (parts[0] === 'WBPAIR' && parts[1]) code = parts[1].toUpperCase();
            else { try { var u = new URL(v); var p = u.searchParams.get('pair'); if (p) code = p.toUpperCase(); } catch (e) {} }
            if (code) {
              pendingCode = code;
              var box = document.getElementById('syncBox');
              if (box) { var pin = box.querySelector('#ppin'); if (pin) pin.value = code; }
              U.toast('已填入配对码，请继续输入密码');
            } else U.toast('不是有效的配对码');
          } else requestAnimationFrame(loop);
        }).catch(function () { requestAnimationFrame(loop); });
      } catch (e) { requestAnimationFrame(loop); }
    }
  }

  /* ---------- UI：渲染同步设置面板 ---------- */
  function render(box) {
    var c = cfg();
    var lsc = ls();
    box.innerHTML = '';

    box.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:12px;line-height:1.7' }, '用 Supabase 永久多端同步，无需自建服务器：① 填写 Supabase URL + Anon Key 并保存；② 创建或输入「配对码 + 二次密码」当云端钥匙。手机 / Pad / 电脑 输入同一配对码即共享同一份数据。数据在本地加密后才上传，云端只见密文。'));

    /* 已启用状态 */
    if (c.mode === 'supabase' && c.pairCode && lsc.url) {
      var st = el('div', { style: 'padding:8px 10px;margin-bottom:12px;border-radius:10px;background:#eaf7ea;border:1px solid #bfe3bf;color:#1b6b2f;font-size:13px;line-height:1.6' });
      st.innerHTML = '☁️ 已启用云端同步（Supabase）<br><span style="color:#2f7d3f">配对码 <b>' + esc(c.pairCode) + '</b>。数据已加密上云，关闭重开自动恢复。其它设备输入同一配对码即可同步。</span>';
      box.appendChild(st);
    }

    /* 第一步：Supabase 配置 */
    (function () {
      var supa = el('div', { style: 'padding:12px;margin-bottom:14px;border-radius:12px;background:#f3f0ff;border:1px solid #ddd6ff' });
      supa.appendChild(el('div', { style: 'font-weight:700;color:#5b3df0;margin-bottom:6px' }, '☁️ 第一步：Supabase 云端配置'));
      supa.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:8px;line-height:1.6' }, '在 https://supabase.com 建项目 → SQL Editor 执行建表 SQL（见站内 SUPABASE_SETUP.md）→ Project Settings → API 复制下面两项。'));

      supa.appendChild(lbl('Supabase URL'));
      var urlWrap = el('div', { style: 'position:relative;margin-bottom:8px' });
      var urlInput = el('input', { id: 'psub', class: 'inp', style: 'width:100%', value: lsc.url || '', placeholder: 'Supabase URL（如 https://xxxx.supabase.co）' });
      urlWrap.appendChild(urlInput);
      supa.appendChild(urlWrap);

      supa.appendChild(lbl('Anon Key'));
      var keyWrap = el('div', { style: 'position:relative;margin-bottom:8px' });
      var keyInput = el('input', { id: 'psak', class: 'inp', style: 'width:100%;padding-right:34px', type: 'password', value: lsc.anonKey || '', placeholder: 'Supabase Anon Key（公开只读 key，sb_publish...）' });
      keyWrap.appendChild(keyInput);
      keyWrap.appendChild(eyeToggle(keyInput));
      supa.appendChild(keyWrap);

      supa.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:8px' }, '注意：不要用 SECRET KEY，只用 anon / publishable key。'));
      var srow = el('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' });
      srow.appendChild(btn('💾 保存 Supabase 配置', 'sm pri', function () {
        var url = urlInput.value.trim();
        var key = keyInput.value.trim();
        if (!url || !key) { U.toast('请填写 Supabase URL 与 Anon Key'); return; }
        setLs({ url: url, anonKey: key });
        U.toast('Supabase 配置已保存');
        var c2 = cfg();
        if (c2.pairCode && window.W && W.SupaSync) { W.SupaSync.push().then(function () { U.toast('已上传当前数据到云端'); }); }
      }));
      supa.appendChild(srow);
      box.appendChild(supa);
    })();

    /* 第二步：配对码（云端钥匙） */
    (function () {
      var pair = el('div', { style: 'padding:12px;margin-bottom:14px;border-radius:12px;background:#eef6ff;border:1px solid #cfe3ff' });
      pair.appendChild(el('div', { style: 'font-weight:700;color:#1c64d4;margin-bottom:6px' }, '🔑 第二步：配对码（云端钥匙）'));
      pair.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:8px;line-height:1.6' }, '创建或输入「配对码 + 二次密码」。三端（手机/Pad/电脑）填同一配对码即共享同一份数据，永久有效、不会过期。'));

      var prows = el('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:10px' });
      prows.appendChild(btn('🔗 创建新配对码', 'sm pri', createUI));
      prows.appendChild(btn('📷 生成接入二维码', 'sm', showQR));
      prows.appendChild(btn('🔗 复制配对链接', 'sm', copyLink));
      pair.appendChild(prows);

      pair.appendChild(lbl('配对码'));
      var codeWrap = el('div', { style: 'position:relative;margin-bottom:8px' });
      var codeInput = el('input', { id: 'ppin', class: 'inp', style: 'width:100%;padding-right:34px', value: pendingCode || c.pairCode || '', placeholder: '配对码' });
      codeWrap.appendChild(codeInput);
      codeWrap.appendChild(eyeToggle(codeInput));
      pair.appendChild(codeWrap);

      pair.appendChild(lbl('二次密码'));
      var passWrap = el('div', { style: 'position:relative;margin-bottom:8px' });
      var passInput = el('input', { id: 'ppass', class: 'inp', style: 'width:100%;padding-right:34px', type: 'password', value: c.pairPass || '', placeholder: '二次同步密码（创建时设置的）' });
      passWrap.appendChild(passInput);
      passWrap.appendChild(eyeToggle(passInput));
      pair.appendChild(passWrap);

      var pjoin = el('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;margin-bottom:8px' });
      pjoin.appendChild(btn('🚀 保存配对码并启用同步', 'sm pri', joinUI));
      pjoin.appendChild(btn('⬇ 立即从云端拉取', 'sm', function () {
        if (!(window.W && W.SupaSync && ls().url)) { U.toast('请先保存 Supabase 配置'); return; }
        W.SupaSync.pull().then(function () { U.toast('已从云端拉取'); });
      }));
      pair.appendChild(pjoin);

      if (pendingCode) {
        pair.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:8px;color:#1b6b2f' }, '已从分享链接/扫码带入配对码 ' + pendingCode + '，请输入二次密码后点「保存配对码并启用同步」'));
      }
      box.appendChild(pair);
    })();

    /* 已连接设备 */
    (function () {
      var devBox = el('div', { style: 'padding:12px;margin-bottom:14px;border-radius:12px;background:#f1f8f3;border:1px solid #cdebd5' });
      devBox.appendChild(el('div', { style: 'font-weight:700;color:#1b7a3d;margin-bottom:6px' }, '📱 已连接设备'));
      var masterHint = el('div', { class: 'small', style: 'margin-bottom:8px;color:#1b6b2f' }, '💡 同步方式：所有设备「先拉后推、互相合并」，你在任何设备上的改动都会上传云端，也会自动合并其它设备的改动。主机标识目前仅作展示，不再限制上传。');
      devBox.appendChild(masterHint);
      var devList = el('div', { id: 'devList', class: 'small muted', style: 'margin-bottom:8px' }, '（暂无记录，点下方刷新按钮）');
      devBox.appendChild(devList);
      var drow = el('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' });
      drow.appendChild(btn('🔄 刷新设备列表', 'sm', refreshDevs));
      devBox.appendChild(drow);
      box.appendChild(devBox);
      function renderDevices(ds, extra) {
        devList.innerHTML = '';
        if (!ds || !ds.length) {
          devList.innerHTML = '<span style="color:#1b6b2f">已记录本机设备；其它设备需各自打开并同步后才会显示。</span>';
        } else {
          ds.forEach(function (d) {
            var line = el('div', { class: 'row', style: 'gap:6px;margin-bottom:6px;align-items:center;flex-wrap:wrap' });
            line.appendChild(el('span', { class: 'small' },
              (d.isMe ? '🟢 ' : '⚪ ') + esc(d.name || d.id) + ' · ' + (d.platform || '') +
              (d.lastSeen ? ' · ' + new Date(d.lastSeen).toLocaleString() : '') +
              (d.isMaster ? ' · ⭐主机' : '') + (d.isMe ? '（本机）' : '')));
            var setBtn = btn(d.isMaster ? '✅ 已是主机' : '设为主机', 'sm' + (d.isMaster ? ' pri' : ''), function () { setMaster(d.id); });
            if (d.isMaster) setBtn.disabled = true;
            line.appendChild(setBtn);
            devList.appendChild(line);
          });
        }
        var le = (W.SupaSync && W.SupaSync.lastError) ? W.SupaSync.lastError() : '';
        if (le) devList.appendChild(el('div', { class: 'small', style: 'margin-top:6px;color:#c0392b' }, '⚠️ 上次同步出错：' + le + '（请检查 Supabase 表是否建好、URL/Key 是否正确）'));
        if (extra) devList.appendChild(el('div', { class: 'small', style: 'margin-top:6px;color:#666' }, extra));
      }
      function refreshDevs() {
        devList.textContent = '加载中…';
        if (!(window.W && W.SupaSync && ls().url && c.pairCode)) { devList.textContent = '请先保存 Supabase 配置并创建配对码'; return; }

        // 第一步：零延迟显示本机设备（不依赖网络）
        W.SupaSync.listDevices().then(function (localDs) {
          renderDevices(localDs, '正在连接云端获取其它设备…');

          // 第二步：异步拉远程设备列表，15 秒超时；超时仍保留本机列表
          function timeoutPromise(ms) {
            return new Promise(function (_, reject) { setTimeout(function () { reject(new Error('请求超时，请检查网络或重试')); }, ms); });
          }
          return Promise.race([
            W.SupaSync.fetchRemoteMeta().then(function (rem) {
              if (rem && rem.devices && rem.devices.length) {
                var m = meta();
                m.devices = rem.devices;
                setMeta(m);
              }
            }).catch(function () {}).then(function () {
              return W.SupaSync.listDevices();
            }),
            timeoutPromise(15000)
          ]);
        }).then(function (ds) {
          renderDevices(ds, null);
        }).catch(function (e) {
          // 超时或网络错误：保留本机列表，只追加提示
          W.SupaSync.listDevices().then(function (localDs) {
            renderDevices(localDs, '⚠️ 刷新云端设备失败：' + (e && e.message || e) + '。请检查网络或稍后再试。');
          });
        });
      }
      function setMaster(id) {
        if (!(window.W && W.SupaSync)) return;
        W.SupaSync.setMaster(id).then(function () { U.toast('已设为主机'); refreshDevs(); })
          .catch(function (e) { U.toast('设置失败：' + (e && e.message || e)); });
      }
    })();

    /* 公共开关 */
    box.appendChild(lbl('自动同步（每隔一段时间自动上传/拉取）'));
    var sa = el('input', { id: 'psa', type: 'checkbox', style: 'margin-bottom:10px' }); if (c.auto !== false) sa.checked = true; box.appendChild(sa);
    box.appendChild(lbl('轮询间隔（秒，云端有新数据时自动刷新）'));
    box.appendChild(el('input', { id: 'psi', class: 'inp', type: 'number', min: '5', step: '5', style: 'width:100%;margin-bottom:10px', value: c.interval || 20 }));
  }

  /* 由 app.js 的「保存」按钮调用：读取面板并保存 */
  function collect() {
    var box = document.getElementById('syncBox'); if (!box) return;
    var url = (box.querySelector('#psub').value || '').trim();
    var key = (box.querySelector('#psak').value || '').trim();
    if (url && key) setLs({ url: url, anonKey: key });
    var c = cfg();
    var code = (box.querySelector('#ppin').value || '').trim().toUpperCase();
    var pass = box.querySelector('#ppass').value || '';
    if (code) c.pairCode = code;
    if (pass) c.pairPass = pass;
    if (c.pairCode && url && key) c.mode = 'supabase';
    c.auto = box.querySelector('#psa').checked;
    c.interval = parseInt(box.querySelector('#psi').value, 10) || 20;
    S.save();
    U.toast('同步设置已保存');
    if (window.W && W.PairSync) W.PairSync.start();
    if (window.W && W.Sync) W.Sync.start();
    if (window.W && W.SupaSync && c.pairCode && ls().url) {
      W.SupaSync.push().then(function () { U.toast('已上传当前数据到云端'); });
    }
  }

  /* 启动引导：Supabase 模式下无需固定源，直接按已保存配置恢复 */
  function bootstrap() { return Promise.resolve(); }
  function setPendingCode(cc) { pendingCode = (cc || '').toUpperCase(); }

  W.PairSync = {
    render: render, collect: collect,
    start: start, stop: stop,
    create: function (o) { return createUI(o); }, join: joinUI,
    pull: function () { return (window.W && W.SupaSync) ? W.SupaSync.pull() : Promise.resolve(); },
    push: function () { return (window.W && W.SupaSync) ? W.SupaSync.push() : Promise.resolve(); },
    devicesModal: function () { U.toast('云端同步无需设备管理'); },
    qrData: function () { return 'WBPAIR|' + (cfg().pairCode || ''); },
    scheduleArchive: function () {}, genCode: genCode, PAIR_LEN: PAIR_LEN,
    bootstrap: bootstrap, setPendingCode: setPendingCode, shareLink: shareLink
  };
})();
