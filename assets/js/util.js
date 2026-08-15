/* ===== 工具层 ===== */
var W = window.W || {};
W.U = (function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  /* 长按手势：移动端 touch / 桌面 mouse 均支持，触发 fn(元素)；短按触发 click */
  function onLongPress(node, fn, ms) {
    ms = ms || 500;
    var timer = null, fired = false, sx = 0, sy = 0;
    function start(e) {
      fired = false; var pt = e.touches ? e.touches[0] : e; sx = pt.clientX; sy = pt.clientY;
      timer = setTimeout(function () { fired = true; fn(node, e); }, ms);
    }
    function move(e) { if (!timer) return; var pt = e.touches ? e.touches[0] : e; if (Math.abs(pt.clientX - sx) > 12 || Math.abs(pt.clientY - sy) > 12) clear(); }
    function clear() { if (timer) { clearTimeout(timer); timer = null; } }
    node.addEventListener('touchstart', start, { passive: true });
    node.addEventListener('touchmove', move, { passive: true });
    node.addEventListener('touchend', clear);
    node.addEventListener('touchcancel', clear);
    node.addEventListener('mousedown', start);
    node.addEventListener('mousemove', move);
    node.addEventListener('mouseup', clear);
    node.addEventListener('mouseleave', clear);
    node._wasLong = function () { return fired; };
    return node;
  }

  /* ---- 日期 ---- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return ymd(new Date()); }
  function parse(s) { var a = String(s).split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function addDay(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); }
  function weekStart(s) { var d = parse(s), w = d.getDay(); w = (w === 0 ? 6 : w - 1); d.setDate(d.getDate() - w); return ymd(d); }
  function weekDays(start) { var a = []; for (var i = 0; i < 7; i++) a.push(addDay(start, i)); return a; }
  function md(s) { var a = s.split('-'); return +a[1] + '/' + +a[2]; }
  function cnWeek(s) { return ['日', '一', '二', '三', '四', '五', '六'][parse(s).getDay()]; }
  function monthKey(s) { return s.slice(0, 7); }
  function weekLabel(start) { return md(start) + ' - ' + md(addDay(start, 6)); }
  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

  /* ---- Toast ---- */
  function toast(msg, ms) {
    var r = $('#toastRoot'); if (!r) return;
    var t = el('div', { class: 'toast' }, esc(msg));
    r.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 320); }, ms || 1600);
  }

  /* ---- 弹窗 ---- */
  function modal(opts) {
    return new Promise(function (resolve) {
      var mask = el('div', { class: 'mask' });
      var box = el('div', { class: 'modal' + (opts.wide ? ' modal-wide' : '') });
      var h = el('h3', null, esc(opts.title || ''));
      box.appendChild(h);
      var body = el('div');
      if (opts.html) body.innerHTML = opts.html;
      var inputs = {};
      (opts.fields || []).forEach(function (f) {
        var wrap = el('div', { class: 'fld' });
        wrap.appendChild(el('label', null, esc(f.label)));
        var ip;
        if (f.type === 'textarea') { ip = el('textarea', { class: 'ta', rows: f.rows || 4, placeholder: f.ph || '' }); ip.value = f.value || ''; }
        else if (f.type === 'select') {
          ip = el('select', { class: 'inp' });
          (f.options || []).forEach(function (o) {
            var op = el('option', { value: o.v }, esc(o.t)); if (o.v === f.value) op.selected = true; ip.appendChild(op);
          });
        } else { ip = el('input', { class: 'inp', type: f.type || 'text', placeholder: f.ph || '' }); ip.value = f.value == null ? '' : f.value; }
        wrap.appendChild(ip); body.appendChild(wrap); inputs[f.key] = ip;
      });
      box.appendChild(body);
      var ft = el('div', { class: 'modal-ft' });
      var cancel = el('button', { class: 'btn' }, opts.cancelText || '取消');
      var ok = el('button', { class: 'btn pri' }, opts.okText || '确定');
      if (opts.hideCancel !== true) ft.appendChild(cancel);
      ft.appendChild(ok); box.appendChild(ft);
      mask.appendChild(box); $('#modalRoot').appendChild(mask);
      function close(v) { mask.remove(); resolve(v); }
      cancel.onclick = function () { close(null); };
      mask.onclick = function (e) { if (e.target === mask) close(null); };
      ok.onclick = function () {
        var out = {};
        for (var k in inputs) out[k] = inputs[k].value.trim ? inputs[k].value.trim() : inputs[k].value;
        if (opts.fields && opts.fields.length && opts.required !== false) {
          var f0 = opts.fields[0];
          if (!out[f0.key]) { toast('请填写' + f0.label); return; }
        }
        close(opts.fields && opts.fields.length ? out : true);
      };
      var first = box.querySelector('input,textarea');
      if (first) setTimeout(function () { first.focus(); }, 60);
    });
  }
  function prompt1(title, label, value, ph) {
    return modal({ title: title, fields: [{ key: 'v', label: label || '内容', value: value || '', ph: ph || '' }] })
      .then(function (r) { return r ? r.v : null; });
  }
  function confirm1(title, text) {
    return modal({ title: title, html: '<div style="font-size:13px;color:#6b7285;line-height:1.6">' + esc(text || '') + '</div>', okText: '确定' })
      .then(function (r) { return !!r; });
  }
  function sheet(title, items) {
    return new Promise(function (resolve) {
      var mask = el('div', { class: 'mask' });
      var box = el('div', { class: 'modal' });
      box.appendChild(el('h3', null, esc(title)));
      items.forEach(function (it) {
        var b = el('button', { class: 'btn blk mb8', style: 'text-align:left;padding:11px' }, (it.icon || '') + ' ' + esc(it.text));
        b.onclick = function () { mask.remove(); resolve(it.v); };
        box.appendChild(b);
      });
      var c = el('button', { class: 'btn blk', style: 'padding:11px' }, '取消');
      c.onclick = function () { mask.remove(); resolve(null); };
      box.appendChild(c);
      mask.appendChild(box); $('#modalRoot').appendChild(mask);
      mask.onclick = function (e) { if (e.target === mask) { mask.remove(); resolve(null); } };
    });
  }

  /* ---- 文件/图片 ---- */
  function pickFile(accept, multiple) {
    return new Promise(function (resolve) {
      var i = el('input', { type: 'file', accept: accept || '*/*', style: 'display:none' });
      if (multiple) i.multiple = true;
      document.body.appendChild(i);
      i.onchange = function () { var fs = Array.prototype.slice.call(i.files); i.remove(); resolve(multiple ? fs : fs[0] || null); };
      i.click();
    });
  }
  function readImage(file, maxW) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height, m = maxW || 900;
          if (w > m) { h = Math.round(h * m / w); w = m; }
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject; img.src = fr.result;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }
  function readAsDataURL(file) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(file); });
  }
  function readFileText(file) {
    return new Promise(function (res, rej) {
      if (file.text) { file.text().then(res).catch(rej); return; }
      var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsText(file);
    });
  }

  /* ---- 通用文档全文提取（PDF / Word / txt） ---- */
  var _docLibs = {};
  function loadDocLib(src) {
    return new Promise(function (res, rej) {
      if (_docLibs[src]) { res(_docLibs[src]); return; }
      var sc = document.createElement('script'); sc.src = src;
      sc.onload = function () { _docLibs[src] = true; res(true); };
      sc.onerror = function () { rej(new Error('加载失败：' + src)); };
      document.head.appendChild(sc);
    });
  }
  function extractDocText(file) {
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'txt' || ext === 'csv' || file.type.indexOf('text/') === 0) return readFileText(file);
    if (ext === 'pdf' || file.type === 'application/pdf') {
      return loadDocLib('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return file.arrayBuffer().then(function (buf) { return window.pdfjsLib.getDocument({ data: buf }).promise; });
      }).then(function (pdf) {
        var parts = [];
        function next(i) {
          if (i >= pdf.numPages) return Promise.resolve(parts.join('\n'));
          return pdf.getPage(i + 1).then(function (page) {
            return page.getTextContent().then(function (tc) { parts.push(tc.items.map(function (it) { return it.str; }).join(' ')); return next(i + 1); });
          });
        }
        return next(0);
      });
    }
    if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return loadDocLib('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js').then(function () {
        return file.arrayBuffer().then(function (buf) { return window.mammoth.extractRawText({ arrayBuffer: buf }); });
      }).then(function (r) { return r.value; });
    }
    if (ext === 'doc') return Promise.reject(new Error('旧版 .doc 暂不支持，请另存为 .docx 或 .txt'));
    return readFileText(file);
  }

  /* ---- 大文件仓库（IndexedDB，失败回退内存）---- */
  var Blobs = (function () {
    var db = null, ready = null;
    var mem = {
      get length() { return 0; },
      set: function (k, v) { try { localStorage.setItem('wbb_' + k, v); } catch (e) { this._m[k] = v; } },
      get: function (k) { try { var v = localStorage.getItem('wbb_' + k); if (v != null) return v; } catch (e) { } return this._m[k] || null; },
      del: function (k) { try { localStorage.removeItem('wbb_' + k); } catch (e) { } delete this._m[k]; },
      _m: {}
    };
    function open() {
      if (ready) return ready;
      ready = new Promise(function (res) {
        try {
          var rq = indexedDB.open('wb-blobs', 1);
          rq.onupgradeneeded = function () { rq.result.createObjectStore('b'); };
          rq.onsuccess = function () { db = rq.result; res(true); };
          rq.onerror = function () { res(false); };
        } catch (e) { res(false); }
      });
      return ready;
    }
    return {
      put: function (id, val) {
        return open().then(function (ok) {
          if (!ok || !db) { mem.set(id, val); return id; }
          return new Promise(function (res) {
            try {
              var tx = db.transaction('b', 'readwrite'); tx.objectStore('b').put(val, id);
              tx.oncomplete = function () { res(id); }; tx.onerror = function () { mem.set(id, val); res(id); };
            } catch (e) { mem.set(id, val); res(id); }
          });
        });
      },
      get: function (id) {
        return open().then(function (ok) {
          if (!ok || !db) return mem.get(id);
          return new Promise(function (res) {
            try {
              var rq = db.transaction('b').objectStore('b').get(id);
              rq.onsuccess = function () { res(rq.result || mem.get(id)); };
              rq.onerror = function () { res(mem.get(id)); };
            } catch (e) { res(mem.get(id)); }
          });
        });
      },
      del: function (id) { mem.del(id); return open().then(function (ok) { if (ok && db) { try { db.transaction('b', 'readwrite').objectStore('b').delete(id); } catch (e) { } } }); }
    };
  })();

  /* ---- 语音 ---- */
  /* 原生 Web Speech API 是否可用（部分 App 内 WebView / UC 等会阉割掉） */
  function ttsSupported() {
    return !!(window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined');
  }
  /* 缓存可用发音人；iOS/Safari 声音为异步加载，需监听 voiceschanged */
  var _voices = [];
  var _voiceCbs = [];
  function loadVoices() {
    try { _voices = window.speechSynthesis.getVoices() || []; } catch (e) { _voices = []; }
    _voiceCbs.forEach(function (c) { try { c(_voices); } catch (e) {} });
  }
  if (ttsSupported()) { loadVoices(); try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
  function getVoices() { return _voices.slice(); }
  function onVoicesReady(cb) { if (!cb) return; if (_voices.length) { try { cb(_voices); } catch (e) {} } _voiceCbs.push(cb); }
  /* 智能优选自然度高的发音人：优先神经网络/增强音色，避开机械默认音（Pico / 旧版） */
  function pickVoice(lang) {
    var vs = _voices.length ? _voices : (ttsSupported() ? (window.speechSynthesis.getVoices() || []) : []);
    if (!vs.length) return null;
    lang = (lang || 'en-US').toLowerCase();
    var pref = lang.split('-')[0];
    var match = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(pref) === 0; });
    if (!match.length) return null;
    /* 优先精确匹配整段语言标签（如 zh-HK 配粤语、zh-CN 配普通话），避免粤语选到普通话嗓音 */
    var exact = match.filter(function (v) { return v.lang && v.lang.toLowerCase() === lang; });
    if (exact.length) match = exact;
    var rank = function (n) {
      n = (n || '').toLowerCase();
      if (/neural|enhanced|natural|premium|online|neural tts/.test(n)) return 4;
      if (/(samantha|google|aria|jenny|daniel|karen|victoria|monica|zira|huihui|yaoyao|tingting|xiaoxiao|云健|晓睿|云希|晓萱|晓妍|晓涵|云扬|晓宁|佳佳|小宇)/.test(n)) return 3;
      if (/(microsoft|apple|siri|united kingdom|united states)/.test(n)) return 2;
      return 0;
    };
    match.sort(function (a, b) { return rank(b.name) - rank(a.name); });
    return match[0];
  }
  /* 应用发音人：优先用全局设置里指定的 voiceURI，否则智能优选；并套用语速/语调 */
  function applyVoice(u, lang, voiceURI) {
    try {
      var s = (W.S && W.S.get()) || {}; var t = s.tts || {};
      var uri = voiceURI || t.voiceURI;
      if (uri) { var f = _voices.filter(function (v) { return v.voiceURI === uri; })[0]; if (f) { u.voice = f; return; } }
      var v = pickVoice(lang); if (v) u.voice = v;
    } catch (e) {}
  }
  function ttsRate(rate) { var s = (W.S && W.S.get()) || {}; var t = s.tts || {}; return (t.rate != null) ? +t.rate : (rate || 1); }
  function ttsPitch() { var s = (W.S && W.S.get()) || {}; var t = s.tts || {}; return (t.pitch != null) ? +t.pitch : 1; }
  /* Chromium on Windows（Edge/Chrome）常见 bug：首次 speak 偶发静音、或 onend 不触发导致队列卡死。
     预热引擎（先 speak 一句空文本）可规避首句静音；看门狗在 onend 不触发时自动续读。 */
  var _primed = false;
  function ensurePrimed() {
    if (_primed || !ttsSupported()) return;
    _primed = true;
    try { var u = new SpeechSynthesisUtterance(''); u.volume = 0; window.speechSynthesis.speak(u); } catch (e) {}
  }
  /* 在线 TTS 兜底：原生朗读不可用时，用网络发音服务自动适配
     优先级：有道词典发音（国内可直连，英/中均支持）→ Google 翻译发音（兜底）
     任一可达即用，全部失败才提示。 */
  function onlineTTS(text, lang, rate) {
    text = String(text || '').trim().slice(0, 200);
    if (!text) return null;
    rate = rate || 1;
    var isZh = /^zh/i.test(lang || 'en-US');
    var urls = [
      'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(text) + '&type=' + (isZh ? '2' : '1'),
      'https://translate.google.cn/translate_tts?client=tw-ob&ie=UTF-8&tl=' + encodeURIComponent(isZh ? 'zh-CN' : 'en') + '&q=' + encodeURIComponent(text)
    ];
    function tryUrl(i) {
      if (i >= urls.length) { toast('当前环境暂不支持朗读，建议用系统浏览器（Safari / Chrome）打开'); return null; }
      try {
        var a = new Audio();
        if (rate !== 1) { try { a.playbackRate = rate; } catch (e) {} } /* 在线音频也支持变速（加速器） */
        a.src = urls[i];
        a.onerror = function () { tryUrl(i + 1); };
        /* 在线音频播放结束后，复位朗读状态（供暂停/继续控制器使用） */
        a.onended = function () { if (_spk.online && _spk.audio === a) _spkDone(); };
        var p = a.play();
        if (p && p.catch) p.catch(function () { tryUrl(i + 1); });
        return a;
      } catch (e) { return tryUrl(i + 1); }
    }
    return tryUrl(0);
  }
  function speak(text, lang, rate, pitch, voiceURI) {
    text = String(text || '').trim();
    if (!text) return false;
    lang = lang || 'en-US';
    var fr = ttsRate(rate), fp = ttsPitch();
    if (_spk.active) { try { stopSpeak(); } catch (e) {} } /* 打断进行中的朗读，避免控制器冲突 */
    var s0 = (W.S && W.S.get()) || {}; var t0 = s0.tts || {};
    if (t0.zhYoudao && /^zh/i.test(lang)) { /* 中文且开启有道优先 → 走更自然的有道在线发音 */
      return !!onlineTTS(text, lang, fr);
    }
    /* 1) 优先原生 Web Speech API（iOS Safari / Android Chrome / 桌面均支持） */
    if (ttsSupported()) {
      try {
        /* iOS：首句有时需先触发 voices 加载，否则不发声 */
        if (window.speechSynthesis.getVoices && !window.speechSynthesis.getVoices().length) {
          try { window.speechSynthesis.getVoices(); } catch (e) {}
        }
        window.speechSynthesis.cancel();
        ensurePrimed(); /* 预热引擎，规避 Windows/Edge 首句静音 */
        var u = new SpeechSynthesisUtterance(text);
        u.lang = lang; u.rate = fr; u.pitch = fp;
        applyVoice(u, lang, voiceURI); /* 智能优选/手动指定自然发音人 */
        u.onerror = function () { onlineTTS(text, lang, fr); }; /* 原生异常 → 在线兜底（带变速） */
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { /* 落到在线兜底 */ }
    }
    /* 2) 兜底：在线 TTS 音频（自动适配无原生朗读的 WebView，支持变速） */
    return onlineTTS(text, lang, fr);
  }
  function SR(lang) {
    var C = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!C) return null;
    var r = new C(); r.lang = lang || 'en-US'; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
    return r;
  }

  /* ---- 其他 ---- */
  function copy(t) {
    try {
      if (navigator.clipboard) { navigator.clipboard.writeText(t); toast('已复制'); return; }
    } catch (e) { }
    var ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('复制失败'); }
    ta.remove();
  }
  function open2(url) { if (!url) return; try { window.open(url, '_blank'); } catch (e) { location.href = url; } }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 300); }; }
  function fmtMin(m) { m = Math.round(m || 0); return m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? (m % 60) + 'm' : '') : m + 'm'; }

  /* ---- 朗读控制器：支持 播放 / 暂停 / 继续 切换（练嘴示范朗读用） ---- */
  /* 长文按句切分、逐句朗读并做轻微语速/语调抖动，避免机械单调；句间短停顿更自然 */
  var _spk = { active: null, paused: false, text: '', lang: '', rate: 1, audio: null, online: false, mode: null, queue: [], qi: 0, busy: false };
  function _spkResetBtn(btn) { if (btn && btn._spkOrig !== undefined) { btn.textContent = btn._spkOrig; btn.classList.remove('on'); } }
  function _spkSetBtn(btn, label) { if (btn) { if (btn._spkOrig === undefined) btn._spkOrig = btn.textContent; btn.textContent = label; btn.classList.add('on'); } }
  function _spkDone() { _spkResetBtn(_spk.active); _spk.active = null; _spk.paused = false; _spk.audio = null; _spk.online = false; _spk.mode = null; _spk.text = ''; _spk.queue = []; _spk.qi = 0; _spk.busy = false; }
  function stopSpeak() {
    if (_spk.online && _spk.audio) { try { _spk.audio.pause(); } catch (e) {} }
    else if (ttsSupported()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    _spkDone();
  }
  function pauseSpeak() {
    if (_spk.online && _spk.audio) { try { _spk.audio.pause(); } catch (e) {} _spk.paused = true; _spkSetBtn(_spk.active, '▶ 继续朗读'); }
    else if (ttsSupported()) { try { window.speechSynthesis.pause(); } catch (e) {} _spk.paused = true; _spkSetBtn(_spk.active, '▶ 继续朗读'); }
  }
  function resumeSpeak() {
    if (_spk.online && _spk.audio) {
      _spk.paused = false; _spkSetBtn(_spk.active, '⏸ 暂停朗读');
      /* 若当前句已播完（处于句间停顿），或已到末尾，则续读下一句而非空 play */
      if (_spk.audio.ended || _spk.qi >= _spk.queue.length) {
        _spk.audio = null;
        if (_spk.mode === 'youdao') { if (_spk.qi < _spk.queue.length) audioChunk(_spk.active, _spk.lang, _spk.rate, _spk.queue[_spk.qi]); else _spkDone(); }
        return;
      }
      try { _spk.audio.play(); } catch (e) {}
      return;
    }
    _spk.paused = false; _spkSetBtn(_spk.active, '⏸ 暂停朗读');
    if (!_spk.busy && _spk.qi < _spk.queue.length) speakNext(_spk.active, _spk.lang, _spk.rate, ttsPitch()); /* 暂停间隙恢复：立即续读下一句 */
    else if (ttsSupported()) { try { window.speechSynthesis.resume(); } catch (e) {} }
  }
  /* 按中英文句末标点 / 换行切分（保留标点），不依赖 lookbehind 以兼容旧浏览器 */
  function splitSentences(text) {
    var raw = text.split(/([。！？!?；;\n]+)/);
    var out = [], buf = '';
    for (var i = 0; i < raw.length; i++) {
      if (i % 2 === 1) { buf += raw[i]; } /* 分隔符并入上一句 */
      else { if (raw[i]) buf += raw[i]; }
      if (i % 2 === 1 || i === raw.length - 1) { if (buf.trim()) out.push(buf.trim()); buf = ''; }
    }
    return out.length > 1 ? out : [text];
  }
  function speakNext(btn, lang, fr, fp) {
    var q = _spk.queue;
    if (_spk.qi >= q.length) { _spkDone(); return; }
    var chunk = q[_spk.qi];
    var u = new SpeechSynthesisUtterance(chunk);
    u.lang = lang;
    /* 逐句语速/语调抖动 + 标点感知停顿，模拟自然重音与呼吸感，显著降低机械感 */
    var r = fr * (0.92 + Math.random() * 0.14);
    var p = fp * (0.94 + Math.random() * 0.12);
    u.rate = Math.min(1.6, Math.max(0.5, r));
    u.pitch = Math.min(1.8, Math.max(0.5, p));
    applyVoice(u, lang);
    _spk.busy = true;
    var wd = setTimeout(function () { /* 看门狗：onend 未触发（Windows/Edge 常见卡死）→ 自动续读 */
      if (_spk.active !== btn || _spk.qi !== _spk.queue.indexOf(chunk)) return;
      if (_spk.paused) return;
      _spk.busy = false; _spk.qi++; speakNext(btn, lang, fr, fp);
    }, 9000 + chunk.length * 70);
    u.onend = function () {
      clearTimeout(wd);
      if (_spk.active !== btn) return;
      _spk.busy = false; _spk.qi++;
      if (_spk.qi >= q.length) { _spkDone(); return; }
      if (_spk.paused) return; /* 暂停间隙：等 resume 触发续读 */
      /* 句末停顿随标点变化：句号/感叹/问号后停顿更长，逗号/分号后更短，贴近真人换气节奏 */
      var last = (chunk || '').slice(-1);
      var base = /[。！？.!?]/.test(last) ? 320 : (/[；;，,]/.test(last) ? 170 : 130);
      var gap = base + Math.round(Math.random() * 140);
      setTimeout(function () { if (_spk.active === btn && !_spk.paused && ttsSupported()) speakNext(btn, lang, fr, fp); }, gap);
    };
    u.onerror = function () {
      clearTimeout(wd);
      if (_spk.active !== btn) return;
      if (_spk.qi === 0) { /* 首句原生即失败 → 整体转在线兜底 */
        _spk.active = null; _spk.text = ''; _spk.busy = false; _spk.online = true;
        _spk.audio = onlineTTS(_spk.text, lang, fr); if (!_spk.audio) { _spkResetBtn(btn); _spkDone(); }
      } else { _spk.busy = false; _spk.qi++; speakNext(btn, lang, fr, fp); } /* 跳过出错句继续 */
    };
    window.speechSynthesis.speak(u);
  }
  /* 有道在线发音逐句播放（中文更自然）：先试有道，失败试 Google 翻译发音，都失败则回退原生或跳过下一句 */
  function audioChunk(btn, lang, fr, chunk) {
    if (chunk == null) { _spkDone(); return; }
    chunk = String(chunk);
    var wd;
    function finish() {
      clearTimeout(wd);
      if (_spk.active !== btn) return;
      _spk.qi++;
      if (_spk.qi >= _spk.queue.length) { _spkDone(); return; }
      if (_spk.paused) return; /* 暂停间隙：等 resume 触发续读 */
      var last = chunk.slice(-1);
      var base = /[。！？.!?]/.test(last) ? 320 : (/[；;，,]/.test(last) ? 170 : 130);
      var gap = base + Math.round(Math.random() * 140);
      setTimeout(function () { if (_spk.active === btn && !_spk.paused) audioChunk(btn, lang, fr, _spk.queue[_spk.qi]); }, gap);
    }
    function fail() {
      clearTimeout(wd);
      if (_spk.active !== btn) return;
      if (_spk.qi === 0) { /* 首句彻底失败 → 回退原生朗读 */
        _spk.mode = 'native'; _spk.online = false;
        if (ttsSupported()) { ensurePrimed(); speakNext(btn, lang, fr, ttsPitch()); } else { _spkResetBtn(btn); _spkDone(); }
        return;
      }
      _spk.qi++; audioChunk(btn, lang, fr, _spk.queue[_spk.qi]); /* 跳过出错句继续 */
    }
    try {
      var a = new Audio();
      if (fr && fr !== 1) { try { a.playbackRate = fr; } catch (e) {} }
      a.src = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(chunk) + '&type=' + (/^zh/i.test(lang) ? '2' : '1');
      _spk.audio = a;
      wd = setTimeout(function () { if (_spk.active !== btn || _spk.paused || _spk.qi !== _spk.queue.indexOf(chunk)) return; _spk.qi++; audioChunk(btn, lang, fr, _spk.queue[_spk.qi]); }, 15000 + chunk.length * 80);
      a.onended = function () { finish(); };
      a.onerror = function () { /* 有道不可达 → 试 Google 翻译发音兜底该句 */
        try {
          var g = new Audio();
          if (fr && fr !== 1) { try { g.playbackRate = fr; } catch (e) {} }
          g.src = 'https://translate.google.cn/translate_tts?client=tw-ob&ie=UTF-8&tl=' + encodeURIComponent(/^zh/i.test(lang) ? 'zh-CN' : 'en') + '&q=' + encodeURIComponent(chunk);
          _spk.audio = g;
          var wd2 = setTimeout(function () { if (_spk.active !== btn || _spk.paused) return; fail(); }, 15000 + chunk.length * 80);
          g.onended = function () { clearTimeout(wd2); finish(); };
          g.onerror = function () { clearTimeout(wd2); fail(); };
          var pg = g.play(); if (pg && pg.catch) pg.catch(function () { clearTimeout(wd2); fail(); });
        } catch (e) { fail(); }
      };
      var p = a.play(); if (p && p.catch) p.catch(function () { if (a.onerror) a.onerror(); });
    } catch (e) { fail(); }
  }
  /* speakToggle(text, lang, rate, btn)：同一段文本点一下在「播放↔暂停↔继续」间切换；换文本则重新播放 */
  function speakToggle(text, lang, rate, btn) {
    text = String(text || '').trim();
    if (!text) return;
    lang = lang || 'en-US';
    var fr = ttsRate(rate), fp = ttsPitch();
    if (_spk.active && _spk.text === text) { _spk.paused ? resumeSpeak() : pauseSpeak(); return; }
    if (_spk.active && _spk.active !== btn) _spkResetBtn(_spk.active); /* 切到别的文章 → 复位旧按钮 */
    _spk.text = text; _spk.lang = lang; _spk.rate = fr; _spk.active = btn; _spk.paused = false;
    _spk.queue = splitSentences(text); _spk.qi = 0;
    var s0 = (W.S && W.S.get()) || {}; var t0 = s0.tts || {};
    if (t0.zhYoudao && /^zh/i.test(lang)) { /* 中文优先有道在线发音（更自然，需联网） */
      _spk.mode = 'youdao'; _spk.online = true;
      _spkSetBtn(btn, '⏸ 暂停朗读');
      audioChunk(btn, lang, fr, _spk.queue[0]);
      return;
    }
    _spk.mode = 'native';
    if (ttsSupported()) {
      try {
        if (window.speechSynthesis.getVoices && !window.speechSynthesis.getVoices().length) { try { window.speechSynthesis.getVoices(); } catch (e) {} }
        window.speechSynthesis.cancel();
        ensurePrimed(); /* 预热引擎，规避 Windows/Edge 首句静音 */
        _spk.online = false;
        _spkSetBtn(btn, '⏸ 暂停朗读');
        speakNext(btn, lang, fr, fp);
        return;
      } catch (e) {}
    }
    /* 在线兜底（无原生朗读的 WebView） */
    _spk.online = true;
    _spkSetBtn(btn, '⏸ 暂停朗读');
    _spk.audio = onlineTTS(text, lang, fr);
    if (!_spk.audio) { _spkResetBtn(btn); _spkDone(); }
  }

  return {
    $: $, $$: $$, el: el, esc: esc, uid: uid, pad: pad, ymd: ymd, today: today, parse: parse, addDay: addDay,
    weekStart: weekStart, weekDays: weekDays, md: md, cnWeek: cnWeek, monthKey: monthKey, weekLabel: weekLabel,
    daysInMonth: daysInMonth, toast: toast, modal: modal, prompt: prompt1, confirm: confirm1, sheet: sheet,
    pickFile: pickFile, readImage: readImage, readAsDataURL: readAsDataURL, readFileText: readFileText, extractDocText: extractDocText, Blobs: Blobs,
    speak: speak, speakToggle: speakToggle, stopSpeak: stopSpeak, ttsOK: ttsSupported, getVoices: getVoices, onVoicesReady: onVoicesReady, SR: SR, copy: copy, open: open2, debounce: debounce, fmtMin: fmtMin, onLongPress: onLongPress
  };
})();
