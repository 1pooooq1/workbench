/* ===== 页面模块 C：表达能力 / 运动管理 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  W.P = W.P || {};

  /* ============ 表达能力 ============ */
  /* 跟读：内置示范资源（央视栏目 + 音视频平台，持续更新，不可删） */
  var SHADOW_RES = [
    { id: 'r_xwlb', icon: '📺', name: '央视《新闻联播》', url: 'https://tv.cctv.com/lm/xwlb/', cat: '央视' },
    { id: 'r_ldz', icon: '🎙️', name: '央视《朗读者》', url: 'https://tv.cctv.com/lm/langduzhe/', cat: '央视' },
    { id: 'r_zcr', icon: '🗣️', name: '央视《主持人大赛》', url: 'https://tv.cctv.com/lm/zbrds/', cat: '央视' },
    { id: 'r_zghy', icon: '📖', name: '央视《中国话》/诗词大会', url: 'https://tv.cctv.com/lm/zgscdh/', cat: '央视' },
    { id: 'r_ted', icon: '🎧', name: 'TED 演讲（英文跟读）', url: 'https://www.ted.com/talks', cat: '音视频' },
    { id: 'r_ky', icon: '🎵', name: '每日英语听力', url: 'https://dict.eudic.net/ting/', cat: '音视频' }
  ];
  /* 跟读：内置示范文稿（含标注：**重读** {轻读} / 停顿） */
  var SHADOW_SCRIPTS = [
    { id: 's_demo1', title: '示范·开场自我介绍', builtin: true, mediaUrl: '', text: '大家好，我是今天的分享人。今天想和大家聊一聊，如何把一件事，真正地坚持下来。', marked: '大家好，/我{是}今天{的}分享人。/今天想{和}大家聊一聊，/**如何**把{一}件事，/**真正**{地}坚持下来。/' },
    { id: 's_demo2', title: '示范·新闻播报腔', builtin: true, mediaUrl: '', text: '据报道，近日多部门联合发文，推动一系列惠民举措加快落地，让改革发展成果更好惠及广大群众。', marked: '据报道，/近日**多部门**联合发文，/推动{一}系列**惠民举措**加快落地，/让改革发展成果{更好}惠及**广大群众**。/' }
  ];

  W.P.express = function (v) {
    var s = S.get();
    if (!s.express) s.express = { prompts: [], logs: [], shadowRes: [], scripts: [], shadowLogs: [], articles: [], articleDone: {} };
    if (!s.express.shadowRes) s.express.shadowRes = [];
    if (!s.express.scripts) s.express.scripts = [];
    if (!s.express.shadowLogs) s.express.shadowLogs = [];
    if (!s.express.articles) s.express.articles = [];
    if (!s.express.articleDone) s.express.articleDone = {};

    function isMedia(u) { return /\.(mp4|webm|ogg|m4a|mp3|wav|aac|mov)(\?|#|$)/i.test(u || ''); }
    /* 一键自动标注：停顿 / 重读 / 轻读 */
    function autoMark(text) {
      var t = String(text || '').trim();
      t = t.replace(/([，,、；;：:])/g, '$1/');
      t = t.replace(/([。！？!?])/g, '$1/');
      t = t.replace(/(\d[\d.,%]*)/g, '**$1**');
      t = t.replace(/([《「“][^》」”]+[》」”])/g, '**$1**');
      t = t.replace(/(的|了|着|地|得|之|和|与|而|就|都|也|在|是|把|被|对|向)(?![*}])/g, '{$1}');
      return t;
    }
    function mspan(cls, txt) { var e = document.createElement('span'); if (cls) e.className = cls; e.textContent = txt; return e; }
    /* 把标注串渲染为带样式的 DOM */
    function markToNodes(str) {
      var frag = document.createDocumentFragment();
      var re = /(\*\*[^*]+\*\*|\{[^}]+\}|\/)/g, last = 0, m;
      function plain(t) { if (t) frag.appendChild(document.createTextNode(t)); }
      while ((m = re.exec(str))) {
        plain(str.slice(last, m.index));
        var tok = m[0];
        if (tok === '/') frag.appendChild(mspan('sh-pause', ' ⋯ '));
        else if (tok.slice(0, 2) === '**') frag.appendChild(mspan('sh-strong', tok.slice(2, -2)));
        else frag.appendChild(mspan('sh-light', tok.slice(1, -1)));
        last = re.lastIndex;
      }
      plain(str.slice(last));
      return frag;
    }

    /* 加载原版音视频：直链内联播放，页面链接外部打开 */
    function openPlayer(res) {
      if (!res.url) { U.toast('该资源未填写链接'); return; }
      if (!isMedia(res.url)) { U.open(res.url); return; }
      var tag = /\.(mp3|m4a|wav|aac|ogg)(\?|#|$)/i.test(res.url) ? 'audio' : 'video';
      var rate = 1;
      var box = el('div');
      box.innerHTML = '<' + tag + ' id="sh-media" src="' + res.url + '" controls style="width:100%;border-radius:10px;background:#000"></' + tag + '>';
      var row = el('div', { class: 'row mt8' });
      [0.75, 1, 1.25].forEach(function (r) { row.appendChild(C.btn(r + '×', 'sm', function () { rate = r; var mEl = document.getElementById('sh-media'); if (mEl) mEl.playbackRate = r; U.toast('倍速 ' + r + '×'); })); });
      box.appendChild(row);
      U.modal({ title: '▶ ' + res.name, html: '<div id="sh-player"></div>', okText: '关闭' });
      setTimeout(function () { var r = document.getElementById('sh-player'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    /* 跟读练习台：同步台词 + 标注 + 原版/录音/对比/调速 + 字幕开关 + 片段循环 */
    function openShadow(opt) {
      opt = opt || {};
      var rate = 1, loop = false, showSub = true;
      var rec = null, chunks = [], recording = false, myBlobId = null, started = 0, timer = null;
      var box = el('div');
      box.appendChild(el('div', { class: 'small muted mb8' }, '🎬 ' + esc(opt.title || '跟读练习')));

      /* 原版媒体 */
      var mediaWrap = el('div');
      if (opt.mediaUrl && isMedia(opt.mediaUrl)) {
        var tag = /\.(mp3|m4a|wav|aac|ogg)(\?|#|$)/i.test(opt.mediaUrl) ? 'audio' : 'video';
        mediaWrap.innerHTML = '<' + tag + ' id="sh-orig" src="' + opt.mediaUrl + '" controls style="width:100%;border-radius:10px;background:#000"></' + tag + '>';
      } else if (opt.mediaUrl) {
        mediaWrap.appendChild(C.btn('🌐 打开原版（外部）', 'sm mb8', function () { U.open(opt.mediaUrl); }));
      }
      box.appendChild(mediaWrap);

      /* 台词文本（带标注） */
      var subBox = el('div', { class: 'sh-script' });
      function renderScript() { subBox.innerHTML = ''; subBox.style.display = showSub ? 'block' : 'none'; subBox.appendChild(markToNodes(opt.marked || autoMark(opt.text || ''))); }
      renderScript();
      box.appendChild(subBox);
      box.appendChild(el('div', { class: 'sh-legend' }, '<span class="sh-strong">加粗=重读强调</span>　<span class="sh-light">浅色=轻读弱化</span>　⋯=断句停顿'));

      /* 控制区 */
      var timeEl = el('div', { class: 'spk-score-mini', style: 'margin:8px 0' }, '⏱ 00:00');
      box.appendChild(timeEl);
      var ctl = el('div', { class: 'row mt6' });
      var origEl = function () { return document.getElementById('sh-orig'); };
      ctl.appendChild(C.btn('▶ 原版播放', 'pri sm', function () { var m = origEl(); if (m) { m.playbackRate = rate; m.loop = loop; m.play(); } else if (opt.mediaUrl) U.open(opt.mediaUrl); else U.toast('本文稿无原版音视频，可先加载资源'); }));
      var recBtn = C.btn('🎤 录音跟读', 'sm', function () { toggleRec(); });
      ctl.appendChild(recBtn);
      box.appendChild(ctl);

      var ctl2 = el('div', { class: 'row mt6' });
      ctl2.appendChild(C.btn('🆚 对比回放', 'sm', function () {
        var m = origEl();
        if (m) { m.currentTime = 0; m.playbackRate = rate; m.play(); }
        if (myBlobId) U.Blobs.get(myBlobId).then(function (d) { if (d) { var a = new Audio(d); setTimeout(function () { a.play(); }, m ? 800 : 0); } });
        else U.toast('还没有你的录音');
      }));
      var rateBtn = C.btn('⏩ 调速 1×', 'sm', function () { rate = rate === 1 ? 1.25 : (rate === 1.25 ? 0.75 : 1); this.textContent = '⏩ 调速 ' + rate + '×'; var m = origEl(); if (m) m.playbackRate = rate; });
      ctl2.appendChild(rateBtn);
      var loopBtn = C.btn('🔁 循环 关', 'sm', function () { loop = !loop; this.textContent = '🔁 循环 ' + (loop ? '开' : '关'); var m = origEl(); if (m) m.loop = loop; });
      ctl2.appendChild(loopBtn);
      var subBtn = C.btn('👁 字幕 显示', 'sm', function () { showSub = !showSub; this.textContent = '👁 字幕 ' + (showSub ? '显示' : '隐藏'); renderScript(); });
      ctl2.appendChild(subBtn);
      box.appendChild(ctl2);

      function tick() { var sec = Math.floor((Date.now() - started) / 1000); timeEl.textContent = '⏱ ' + ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2); }
      function toggleRec() {
        if (recording) { try { if (rec && rec.state === 'recording') rec.stop(); } catch (e) { } recording = false; clearInterval(timer); recBtn.textContent = '🎤 录音跟读'; return; }
        if (!navigator.mediaDevices) { U.toast('当前环境不支持录音'); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          rec = new MediaRecorder(stream); chunks = [];
          rec.ondataavailable = function (e) { chunks.push(e.data); };
          rec.onstop = function () {
            var blob = new Blob(chunks, { type: 'audio/webm' }), fr = new FileReader();
            fr.onload = function () { var id = U.uid(); U.Blobs.put(id, fr.result).then(function () { myBlobId = id; U.toast('录音完成，可对比回放或保存'); }); };
            fr.readAsDataURL(blob);
            stream.getTracks().forEach(function (t) { t.stop(); });
          };
          rec.start(); recording = true; started = Date.now(); recBtn.textContent = '⏹ 停止'; timer = setInterval(tick, 500);
        }).catch(function () { U.toast('无法录音，请检查麦克风权限'); });
      }

      var save = el('div', { class: 'row mt8' });
      save.appendChild(C.btn('💾 保存这次跟读', 'pri sm', function () {
        var dur = started ? Math.floor((Date.now() - started) / 1000) : 0;
        var log = { id: U.uid(), title: opt.title || '跟读练习', dur: dur, rate: rate, date: U.today() };
        if (myBlobId) log.blob = myBlobId;
        s.express.shadowLogs.push(log);
        var ck = S.ck('express'); if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '即兴表达练习' });
        var d = U.today(); if (!ck.rec[d]) ck.rec[d] = []; if (ck.rec[d].indexOf(ck.tasks[0].id) < 0) ck.rec[d].push(ck.tasks[0].id);
        if (!s.metrics[d]) s.metrics[d] = {}; s.metrics[d].express = (s.metrics[d].express || 0) + Math.max(1, Math.round(dur / 60));
        S.save(); U.toast('已保存到跟读记录'); W.render();
      }));
      if (opt.scriptId == null && (opt.text || opt.marked)) {
        save.appendChild(C.btn('📑 存为文稿', 'sm', function () {
          s.express.scripts.unshift({ id: U.uid(), title: opt.title || ('跟读文稿 ' + U.today()), text: opt.text || '', marked: opt.marked || autoMark(opt.text || ''), mediaUrl: opt.mediaUrl || '', ts: Date.now() });
          S.save(); U.toast('已存为文稿，可重复练习'); W.render();
        }));
      }
      box.appendChild(save);

      U.modal({ title: '🎤 跟读练习', html: '<div id="sh-stage"></div>', okText: '关闭', wide: true })
        .then(function () { if (recording) { try { rec.stop(); } catch (e) { } } });
      setTimeout(function () { var r = document.getElementById('sh-stage'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    /* 自定义文稿编辑：粘贴 → 一键标注 → 手动调整 → 保存 */
    function scriptEditor(sc) {
      var box = el('div');
      box.appendChild(el('div', { class: 'small muted mb8' }, '粘贴文稿 → 一键自动生成标注（/断句　**重读**　{轻读}）→ 可手动微调 → 保存重复练习'));
      var ti = el('input', { class: 'inp mb8', placeholder: '文稿标题' }); ti.value = sc ? sc.title : '';
      box.appendChild(ti);
      var mu = el('input', { class: 'inp mb8', placeholder: '原版音/视频直链（可空，支持 mp4/mp3…）' }); mu.value = sc ? (sc.mediaUrl || '') : '';
      box.appendChild(mu);
      var ta = el('textarea', { class: 'ta mb8', rows: 5, placeholder: '在此粘贴 / 输入原文稿…' }); ta.value = sc ? sc.text : '';
      box.appendChild(ta);
      var mk = el('textarea', { class: 'ta mb8', rows: 5, placeholder: '标注文本（可手动调整）' }); mk.value = sc ? (sc.marked || '') : '';
      box.appendChild(el('div', { class: 'small muted' }, '标注文本：'));
      box.appendChild(mk);
      var prev = el('div', { class: 'sh-script mb8' });
      function refreshPrev() { prev.innerHTML = ''; prev.appendChild(markToNodes(mk.value || '')); }
      var row = el('div', { class: 'row mb8' });
      row.appendChild(C.btn('✨ 一键自动标注', 'pri sm', function () { mk.value = autoMark(ta.value); refreshPrev(); }));
      row.appendChild(C.btn('🔄 预览', 'sm', function () { refreshPrev(); }));
      box.appendChild(row);
      box.appendChild(el('div', { class: 'small muted' }, '效果预览：'));
      box.appendChild(prev);
      refreshPrev();
      var ops = el('div', { class: 'row' });
      ops.appendChild(C.btn('💾 保存文稿', 'pri sm', function () {
        if (!ta.value.trim()) { U.toast('请先输入文稿'); return; }
        var marked = mk.value.trim() || autoMark(ta.value);
        if (sc) { sc.title = ti.value || sc.title; sc.text = ta.value; sc.marked = marked; sc.mediaUrl = mu.value; }
        else s.express.scripts.unshift({ id: U.uid(), title: ti.value || ('跟读文稿 ' + U.today()), text: ta.value, marked: marked, mediaUrl: mu.value, ts: Date.now() });
        S.save(); U.toast('已保存'); W.render();
        var mask = document.querySelector('#modalRoot .mask'); if (mask) mask.remove();
      }));
      ops.appendChild(C.btn('🎤 直接练习', 'sm', function () {
        openShadow({ title: ti.value || '跟读练习', text: ta.value, marked: mk.value || autoMark(ta.value), mediaUrl: mu.value, scriptId: sc ? sc.id : null });
      }));
      box.appendChild(ops);
      U.modal({ title: sc ? '编辑文稿' : '新建跟读文稿', html: '<div id="sh-edit"></div>', okText: '关闭', wide: true });
      setTimeout(function () { var r = document.getElementById('sh-edit'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    function shadowSection(b) {
      /* 资源入口区 */
      b.appendChild(C.subTitle('资源入口 · 原版音视频', C.btn('＋ 添加资源', 'sm', function () {
        U.modal({ title: '添加资源', fields: [{ key: 'ic', label: '图标', value: '🎬' }, { key: 'n', label: '名称 / 栏目' }, { key: 'u', label: '链接（页面或音视频直链）' }, { key: 'c', label: '分类', value: '自定义' }] })
          .then(function (r) { if (r && r.n) { s.express.shadowRes.push({ id: U.uid(), icon: r.ic || '🎬', name: r.n, url: r.u, cat: r.c || '自定义' }); S.save(); W.render(); } });
      })));
      var resStrip = el('div', { class: 'sh-res' });
      SHADOW_RES.concat(s.express.shadowRes).forEach(function (res) {
        var card = el('div', { class: 'sh-res-card' });
        card.appendChild(el('div', { class: 'sh-res-ic' }, res.icon || '🎬'));
        card.appendChild(el('div', { class: 'sh-res-n' }, esc(res.name)));
        var ops = el('div', { class: 'sh-res-ops' });
        ops.appendChild(C.btn('▶ 加载', 'sm', function () { openPlayer(res); }));
        ops.appendChild(C.btn('🎤 跟读', 'sm', function () { openShadow({ title: res.name, mediaUrl: res.url, text: '', marked: '' }); }));
        if (!res.builtin && s.express.shadowRes.indexOf(res) >= 0) ops.appendChild(C.btn('🗑', 'sm dan', function () { s.express.shadowRes = s.express.shadowRes.filter(function (x) { return x.id !== res.id; }); S.save(); W.render(); }));
        card.appendChild(ops);
        resStrip.appendChild(card);
      });
      b.appendChild(resStrip);

      /* 视频跟读模式说明入口 */
      b.appendChild(C.subTitle('视频跟读模式'));
      b.appendChild(el('div', { class: 'small muted mb8' }, '点资源「🎤 跟读」进入练习台：同步台词、原版播放、录音跟读、对比回放、0.75~1.25× 调速、字幕开关、片段循环。'));

      /* 自定义文稿跟读 */
      b.appendChild(C.subTitle('我的跟读文稿', C.btn('＋ 新建文稿', 'sm', function () { scriptEditor(null); })));
      var all = SHADOW_SCRIPTS.concat(s.express.scripts);
      all.forEach(function (sc) {
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        if (sc.builtin) h.appendChild(el('span', { class: 'tag pri' }, '示范'));
        h.appendChild(el('span', { style: 'font-weight:650;font-size:13px' }, esc(sc.title)));
        h.appendChild(el('div', { class: 'grow' }));
        c.appendChild(h);
        var prev = el('div', { class: 'sh-script mt6' }); prev.appendChild(markToNodes(sc.marked || autoMark(sc.text || ''))); c.appendChild(prev);
        var ops = el('div', { class: 'row mt6' });
        ops.appendChild(C.btn('🎤 练习', 'pri sm', function () { openShadow({ title: sc.title, text: sc.text, marked: sc.marked, mediaUrl: sc.mediaUrl, scriptId: sc.id }); }));
        if (!sc.builtin) {
          ops.appendChild(C.btn('✏️ 编辑', 'sm', function () { scriptEditor(sc); }));
          ops.appendChild(C.btn('🔖 收藏', 'sm', function () {
            var favs = S.get().favs || []; favs.unshift({ id: U.uid(), kind: 'script', ref: sc.id, title: sc.title, sub: '跟读文稿', icon: '📑', ts: Date.now() }); S.save(); U.toast('已收藏');
          }));
          ops.appendChild(C.btn('🗑', 'sm dan', function () { s.express.scripts = s.express.scripts.filter(function (x) { return x.id !== sc.id; }); S.save(); W.render(); }));
        }
        c.appendChild(ops);
        b.appendChild(c);
      });

      /* 跟读记录 */
      b.appendChild(C.subTitle('跟读记录'));
      if (!s.express.shadowLogs.length) b.appendChild(el('div', { class: 'empty' }, '<span class="ei">🎧</span>还没有跟读记录'));
      s.express.shadowLogs.slice().reverse().forEach(function (l) {
        var c = el('div', { class: 'q' });
        c.appendChild(el('div', { class: 'qh' }, '<span class="tag pri">' + l.dur + 's</span><span class="tag">' + (l.rate || 1) + '×</span><span class="small muted">' + l.date + '</span>'));
        c.appendChild(el('div', { class: 'qt' }, esc(l.title)));
        var ops = el('div', { class: 'row mt6' });
        if (l.blob) ops.appendChild(C.btn('▶ 回放', 'sm', function () { U.Blobs.get(l.blob).then(function (d) { if (d) U.modal({ title: '录音回放', html: '<audio controls autoplay src="' + d + '"></audio>', hideCancel: true, okText: '关闭' }); }); }));
        ops.appendChild(C.btn('🗑 删除', 'sm dan', function () { s.express.shadowLogs = s.express.shadowLogs.filter(function (x) { return x.id !== l.id; }); if (l.blob) U.Blobs.del && U.Blobs.del(l.blob); S.save(); W.render(); }));
        c.appendChild(ops);
        b.appendChild(c);
      });
    }

    var PRESET = [
      '请用 1 分钟介绍一本你最近读过的书。',
      '描述一下你理想中的一天是怎样的。',
      '就"努力一定会有回报吗"发表你的看法。',
      '向一位外国朋友介绍你家乡的一道美食。',
      '如果可以掌握一项超能力，你会选什么，为什么？',
      '谈谈你对"延迟满足"的理解，并举一个自己的例子。'
    ];

    function exprCard(p, editable) {
      var c = el('div', { class: 'q' });
      c.appendChild(el('div', { class: 'qt' }, esc(p.text)));
      if (p.cat) c.appendChild(el('div', { class: 'small muted mt6' }, '#' + esc(p.cat)));
      var ops = el('div', { class: 'row mt6' });
      ops.appendChild(C.btn('🎤 开始练习', 'pri sm', function () { practice(p.text); }));
      if (editable) ops.appendChild(C.btn('🗑', 'sm dan', function () { s.express.prompts = s.express.prompts.filter(function (x) { return x.id !== p.id; }); S.save(); W.render(); }));
      c.appendChild(ops);
      return c;
    }

    /* 每日练嘴小文章 */
    function articleSection(b) {
      if (U.stopSpeak) U.stopSpeak(); /* 每次重渲染先停掉上一段朗读，避免按钮状态错乱 */
      var today = U.today();
      var doneIds = s.express.articleDone[today] || [];
      var all = s.express.articles || [];
      if (!all.length) { b.appendChild(el('div', { class: 'empty' }, '<span class="ei">📝</span>还没有小文章，可在设置里恢复默认')); return; }

      var status = el('div', { class: 'ex-art-status' }, doneIds.length >= all.length ? '✅ 今日已完成' : '📝 今日未练习');
      b.appendChild(status);

      /* 今日推荐 + 换一篇（内容可以刷新和推荐） */
      var rec = el('div', { class: 'ex-art-rec' });
      function pickRec() {
        var pool = all.slice();
        if (pool.length > 1) {
          var undone = pool.filter(function (a) { return doneIds.indexOf(a.id) < 0; });
          if (undone.length) pool = undone;
          pool.sort(function () { return Math.random() - 0.5; });
        }
        var a = pool[0];
        if (!a) { rec.innerHTML = '<div class="small muted">暂无可推荐文章，可点「＋ 新增小文章」</div>'; return; }
        rec.innerHTML = '';
        var card = el('div', { class: 'ex-art-card pri' });
        var hd = el('div', { class: 'ex-art-hd' });
        hd.appendChild(el('span', { class: 'ex-art-ic' }, '⭐'));
        hd.appendChild(el('span', { class: 'ex-art-t' }, '今日推荐 · ' + esc(a.title)));
        hd.appendChild(el('span', { class: 'tag' }, (a.words || a.text.length) + '字'));
        card.appendChild(hd);
        card.appendChild(el('div', { class: 'ex-art-body' }, esc(a.text)));
        var ops = el('div', { class: 'ex-art-ops' });
        ops.appendChild(C.btn('🎙️ 跟读录音', 'sm', function () { articlePractice(a); }));
        ops.appendChild(C.btn('🔊 示范朗读', 'sm', function (e) { U.speakToggle(a.text, 'zh-CN', 0.92, e.currentTarget); }));
        ops.appendChild(C.btn('✅ 完成', 'sm ok', function () {
          if (!s.express.articleDone[today]) s.express.articleDone[today] = [];
          if (s.express.articleDone[today].indexOf(a.id) < 0) s.express.articleDone[today].push(a.id);
          S.save(); W.render();
        }));
        card.appendChild(ops);
        rec.appendChild(card);
      }
      b.appendChild(el('div', { class: 'row mb8' }, C.btn('🔄 换一篇推荐', 'sm', function () { if (U.stopSpeak) U.stopSpeak(); pickRec(); })));
      pickRec();
      b.appendChild(rec);

      all.forEach(function (a, i) {
        var isDone = doneIds.indexOf(a.id) >= 0;
        var c = el('div', { class: 'ex-art-card' + (isDone ? ' done' : '') });
        var hd = el('div', { class: 'ex-art-hd' });
        hd.appendChild(el('span', { class: 'ex-art-ic' }, '📝'));
        hd.appendChild(el('span', { class: 'ex-art-t' }, esc(a.title)));
        var lv = a.level || '中级';
        var lvClass = lv === '高级' ? 'red' : (lv === '中级' ? 'warn' : 'ok');
        hd.appendChild(el('span', { class: 'tag ' + lvClass }, esc(lv)));
        hd.appendChild(el('span', { class: 'tag' }, (a.words || a.text.length) + '字'));
        if (isDone) hd.appendChild(el('span', { class: 'tag pri' }, '已完成'));
        c.appendChild(hd);
        c.appendChild(el('div', { class: 'ex-art-body' }, esc(a.text)));

        var ops = el('div', { class: 'ex-art-ops' });
        ops.appendChild(C.btn('🎙️ 跟读录音', 'sm', function () { articlePractice(a); }));
        ops.appendChild(C.btn('🔊 示范朗读', 'sm', function (e) { U.speakToggle(a.text, 'zh-CN', 0.92, e.currentTarget); }));
        ops.appendChild(C.btn('📋 复制', 'sm', function () { U.copy(a.text); U.toast('已复制'); }));
        ops.appendChild(C.btn('✏️ 编辑', 'sm', function () { articleEditor(a); }));
        if (!isDone) {
          ops.appendChild(C.btn('✅ 完成', 'sm ok', function () {
            if (!s.express.articleDone[today]) s.express.articleDone[today] = [];
            if (s.express.articleDone[today].indexOf(a.id) < 0) s.express.articleDone[today].push(a.id);
            S.save(); W.render();
          }));
        }
        c.appendChild(ops);
        b.appendChild(c);
      });

      b.appendChild(C.btn('＋ 新增小文章', 'sm mb8', function () { articleEditor(null); }));
      b.appendChild(C.btn('🔄 恢复默认', 'sm', function () {
        if (confirm('恢复默认会保留你新增的文章，确定继续？')) {
          var base = (window.W && W.EXPRESS_ARTICLES_SEED) || [];
          var have = {};
          all.forEach(function (x) { have[x.id] = true; });
          base.forEach(function (x) { if (!have[x.id]) s.express.articles.unshift(x); });
          S.save(); W.render();
        }
      }));
    }

    function articleEditor(a) {
      U.modal({
        title: a ? '编辑小文章' : '新增小文章',
        fields: [
          { key: 't', label: '标题', value: a ? a.title : '' },
          { key: 'l', label: '难度（初级/中级/高级）', value: a ? (a.level || '中级') : '中级' },
          { key: 'w', label: '字数', value: a ? (a.words || '') : '' },
          { key: 'c', label: '正文', type: 'textarea', value: a ? a.text : '' }
        ],
        okText: '保存'
      }).then(function (v) {
        if (!v || !v.t || !v.c) return;
        if (a) { a.title = v.t; a.level = v.l || '中级'; a.words = +v.w || v.c.length; a.text = v.c; }
        else s.express.articles.unshift({ id: U.uid(), title: v.t, level: v.l || '中级', words: +v.w || v.c.length, text: v.c });
        S.save(); W.render();
      });
    }

    function articlePractice(a) {
      var rec = null, chunks = [], timer = null, started = 0, recording = false, saved = false;
      var box = el('div');
      box.appendChild(el('h3', { style: 'margin:0 0 8px;font-size:15px' }, esc(a.title)));
      box.appendChild(el('div', { class: 'ex-art-body mb8' }, esc(a.text)));
      var ta = el('textarea', { class: 'ta', rows: 3, placeholder: '练习后写下复盘 / 感受…' });
      box.appendChild(ta);
      var timeEl = el('div', { class: 'spk-score-mini', style: 'margin:8px 0' }, '⏱ 00:00');
      box.appendChild(timeEl);
      var recBtn = C.btn('🎙️ 开始录音', 'pri', function () { toggle(); });
      var row = el('div', { class: 'row mt8' });
      row.appendChild(recBtn);
      row.appendChild(C.btn('✅ 完成保存', 'sm', function () { finish(); }));
      box.appendChild(row);

      function tick() { var sec = Math.floor((Date.now() - started) / 1000); timeEl.textContent = '⏱ ' + ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2); }
      function toggle() {
        if (recording) { stop(); return; }
        if (!navigator.mediaDevices) { U.toast('当前环境不支持录音'); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          rec = new MediaRecorder(stream); chunks = [];
          rec.ondataavailable = function (e) { chunks.push(e.data); };
          rec.onstop = function () {
            var blob = new Blob(chunks, { type: 'audio/webm' });
            var fr = new FileReader();
            fr.onload = function () { var id = U.uid(); U.Blobs.put(id, fr.result).then(function () { saveLog(id); }); };
            fr.readAsDataURL(blob);
            stream.getTracks().forEach(function (t) { t.stop(); });
          };
          rec.start(); recording = true; started = Date.now(); recBtn.textContent = '⏹ 停止';
          timer = setInterval(tick, 500);
        }).catch(function () { U.toast('无法录音，请检查麦克风权限'); });
      }
      function stop() { try { if (rec && rec.state === 'recording') rec.stop(); } catch (e) { } recording = false; clearInterval(timer); recBtn.textContent = '🎙️ 开始录音'; }
      function saveLog(blobId) {
        if (saved) return; saved = true;
        var dur = started ? Math.floor((Date.now() - started) / 1000) : 0;
        var log = { id: U.uid(), title: a.title, text: a.text.slice(0, 40) + '…', dur: dur, note: ta.value, date: U.today(), kind: 'article' };
        if (blobId) log.blob = blobId;
        s.express.logs.push(log);
        var today = U.today();
        if (!s.express.articleDone[today]) s.express.articleDone[today] = [];
        if (s.express.articleDone[today].indexOf(a.id) < 0) s.express.articleDone[today].push(a.id);
        var ck = S.ck('express'); if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '即兴表达练习' });
        var d = U.today(); if (!ck.rec[d]) ck.rec[d] = []; if (ck.rec[d].indexOf(ck.tasks[0].id) < 0) ck.rec[d].push(ck.tasks[0].id);
        if (!s.metrics[d]) s.metrics[d] = {}; s.metrics[d].express = (s.metrics[d].express || 0) + Math.max(1, Math.round(dur / 60));
        S.save(); U.toast('已保存练习记录'); W.render();
      }
      function finish() { if (recording) stop(); else saveLog(null); }

      U.modal({ title: '练嘴小文章', html: '<div id="ex-article-practice"></div>', okText: '关闭' })
        .then(function () { if (recording) stop(); else if (!saved) saveLog(null); });
      setTimeout(function () { var r = document.getElementById('ex-article-practice'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    function practice(promptText) {
      var rec = null, chunks = [], timer = null, started = 0, recording = false, saved = false;
      var box = el('div');
      box.appendChild(el('h3', { style: 'margin:0 0 8px;font-size:15px' }, '表达练习'));
      box.appendChild(el('div', { class: 'small muted mb8' }, esc(promptText)));
      var ta = el('textarea', { class: 'ta', rows: 3, placeholder: '练习后写下复盘 / 要点…' });
      box.appendChild(ta);
      var timeEl = el('div', { class: 'spk-score-mini', style: 'margin:8px 0' }, '⏱ 00:00');
      box.appendChild(timeEl);
      var recBtn = C.btn('🎤 开始录音', 'pri', function () { toggle(); });
      var row = el('div', { class: 'row mt8' });
      row.appendChild(recBtn);
      row.appendChild(C.btn('✅ 完成保存', 'sm', function () { finish(); }));
      box.appendChild(row);

      function tick() { var sec = Math.floor((Date.now() - started) / 1000); timeEl.textContent = '⏱ ' + ('0' + Math.floor(sec / 60)).slice(-2) + ':' + ('0' + (sec % 60)).slice(-2); }
      function toggle() {
        if (recording) { stop(); return; }
        if (!navigator.mediaDevices) { U.toast('当前环境不支持录音'); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          rec = new MediaRecorder(stream); chunks = [];
          rec.ondataavailable = function (e) { chunks.push(e.data); };
          rec.onstop = function () {
            var blob = new Blob(chunks, { type: 'audio/webm' });
            var fr = new FileReader();
            fr.onload = function () { var id = U.uid(); U.Blobs.put(id, fr.result).then(function () { saveLog(id); }); };
            fr.readAsDataURL(blob);
            stream.getTracks().forEach(function (t) { t.stop(); });
          };
          rec.start(); recording = true; started = Date.now(); recBtn.textContent = '⏹ 停止';
          timer = setInterval(tick, 500);
        }).catch(function () { U.toast('无法录音，请检查麦克风权限'); });
      }
      function stop() { try { if (rec && rec.state === 'recording') rec.stop(); } catch (e) { } recording = false; clearInterval(timer); recBtn.textContent = '🎤 开始录音'; }
      function saveLog(blobId) {
        if (saved) return; saved = true;
        var dur = started ? Math.floor((Date.now() - started) / 1000) : 0;
        var log = { id: U.uid(), text: promptText, dur: dur, note: ta.value, date: U.today() };
        if (blobId) log.blob = blobId;
        s.express.logs.push(log);
        var ck = S.ck('express'); if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '即兴表达练习' });
        var d = U.today(); if (!ck.rec[d]) ck.rec[d] = []; if (ck.rec[d].indexOf(ck.tasks[0].id) < 0) ck.rec[d].push(ck.tasks[0].id);
        S.save(); U.toast('已保存练习记录'); W.render();
      }
      function finish() { if (recording) stop(); else saveLog(null); }

      U.modal({ title: '表达练习', html: '<div id="ex-practice"></div>', okText: '关闭' })
        .then(function () { if (recording) stop(); else if (!saved) saveLog(null); });
      setTimeout(function () { var r = document.getElementById('ex-practice'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    /* 播客精选 */
    function podcastSection(b) {
      if (!s.express.podcasts) s.express.podcasts = [];
      var cats = ['全部'].concat(s.express.podcasts.map(function (p) { return p.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
      var curCat = W.__podcastCat || '全部';
      if (cats.indexOf(curCat) < 0) curCat = '全部';
      function draw() {
        b.innerHTML = '';
        var tabs = el('div', { class: 'pc-tabs' });
        cats.forEach(function (c) {
          var t = el('button', { class: 'pc-tab' + (c === curCat ? ' on' : '') }, esc(c));
          t.onclick = function () { curCat = c; W.__podcastCat = c; draw(); };
          tabs.appendChild(t);
        });
        b.appendChild(tabs);
        var list = s.express.podcasts.filter(function (p) { return curCat === '全部' || p.cat === curCat; });
        if (!list.length) { b.appendChild(el('div', { class: 'empty' }, '<span class="ei">🎙️</span>该分类下还没有播客')); return; }
        list.forEach(function (p) {
          var c = el('div', { class: 'pc-card' });
          var hd = el('div', { class: 'pc-hd' });
          hd.appendChild(el('div', { class: 'pc-ic' }, p.icon || '🎙️'));
          var tx = el('div', { class: 'pc-tx' });
          tx.appendChild(el('div', { class: 'pc-t' }, esc(p.title)));
          tx.appendChild(el('div', { class: 'pc-d' }, esc(p.desc)));
          hd.appendChild(tx);
          c.appendChild(hd);
          var ft = el('div', { class: 'pc-ft' });
          ft.appendChild(el('span', { class: 'tag pur' }, esc(p.cat)));
          ft.appendChild(el('div', { class: 'grow' }));
          ft.appendChild(C.btn('在喜马拉雅收听 →', 'sm', function () { U.open(p.ximalaya); }));
          if (p.xiaoyuzhou) ft.appendChild(C.btn('小宇宙', 'sm', function () { U.open(p.xiaoyuzhou); }));
          c.appendChild(ft);
          b.appendChild(c);
        });
        var ops = el('div', { class: 'row mt8' });
        ops.appendChild(C.btn('＋ 添加播客', 'sm', function () {
          U.modal({ title: '添加播客', fields: [{ key: 't', label: '播客名称' }, { key: 'd', label: '简介' }, { key: 'c', label: '分类' }, { key: 'x', label: '喜马拉雅链接' }, { key: 'y', label: '小宇宙链接（可空）' }] })
            .then(function (r) { if (r && r.t) { s.express.podcasts.push({ id: U.uid(), title: r.t, desc: r.d, cat: r.c || '其他', icon: '🎙️', ximalaya: r.x, xiaoyuzhou: r.y }); S.save(); draw(); } });
        }));
        b.appendChild(ops);
      }
      draw();
    }

    C.sectionPage(v, {
      id: 'express',
      top: function (m) {
        var logs = s.express.logs || [];
        var mins = logs.reduce(function (a, x) { return a + (x.dur || 0); }, 0);
        var shLogs = s.express.shadowLogs || [];
        var shMins = shLogs.reduce(function (a, x) { return a + (x.dur || 0); }, 0);
        m.appendChild(C.statRow([
          { value: (s.express.prompts || []).length + PRESET.length, label: '表达题目' },
          { value: logs.length, label: '练习次数', color: '#2fbf87' },
          { value: shLogs.length, label: '跟读次数', color: '#f0a020' },
          { value: Math.round((mins + shMins) / 60 * 10) / 10, label: '累计分钟', color: '#5b6cff' }
        ]));
      },
      sections: [
        {
          key: 'ex_articles', icon: '📝', title: '每日练嘴小文章', sub: '短文朗读 · 跟读录音 · 完成打卡',
          open: true,
          render: function (b) { articleSection(b); }
        },
        {
          key: 'ex_podcast', icon: '🎙️', title: '播客精选', sub: '分类收听 · 喜马拉雅 / 小宇宙',
          render: function (b) { podcastSection(b); }
        },
        {
          key: 'ex_preset', icon: '💡', title: '即兴表达题库（预设）', sub: '点「开始练习」计时录音',
          render: function (b) { PRESET.forEach(function (t, i) { b.appendChild(exprCard({ id: 'p' + i, text: t })); }); }
        },
        {
          key: 'ex_my', icon: '✏️', title: '我的表达题目', sub: '自定义题目库',
          render: function (b) {
            b.appendChild(C.btn('＋ 新增题目', 'sm mb8', function () {
              U.modal({ title: '新增题目', fields: [{ key: 't', label: '题目 / 话题' }, { key: 'c', label: '分类（可空）' }] })
                .then(function (v) { if (v) { s.express.prompts.push({ id: U.uid(), text: v.t, cat: v.c }); S.save(); W.render(); } });
            }));
            if (!(s.express.prompts || []).length) b.appendChild(el('div', { class: 'empty' }, '<span class="ei">💬</span>还没有自定义题目'));
            (s.express.prompts || []).forEach(function (p) { b.appendChild(exprCard(p, true)); });
          }
        },
        {
          key: 'ex_log', icon: '🎧', title: '练习记录', sub: '录音回放 / 复盘',
          render: function (b) {
            if (!(s.express.logs || []).length) { b.appendChild(el('div', { class: 'empty' }, '<span class="ei">🎧</span>还没有练习记录')); return; }
            s.express.logs.slice().reverse().forEach(function (l) {
              var c = el('div', { class: 'q' });
              c.appendChild(el('div', { class: 'qh' }, '<span class="tag pri">' + l.dur + 's</span><span class="small muted">' + l.date + '</span><div class="grow"></div>'));
              c.appendChild(el('div', { class: 'qt' }, esc(l.text)));
              if (l.note) c.appendChild(el('div', { class: 'qt small muted' }, esc(l.note)));
              var ops = el('div', { class: 'row mt6' });
              if (l.blob) ops.appendChild(C.btn('▶ 回放', 'sm', function () { U.Blobs.get(l.blob).then(function (d) { if (d) U.modal({ title: '录音回放', html: '<audio controls autoplay src="' + d + '"></audio>', hideCancel: true, okText: '关闭' }); }); }));
              ops.appendChild(C.btn('🤖 AI 点评', 'sm', function () { W.Exam.aiAsk('请针对这段口语表达练习给出改进建议（发音、流畅度、逻辑、用词）：\n题目：' + l.text + '\n我的复盘：' + (l.note || '（无）')); }));
              ops.appendChild(C.btn('🗑', 'sm dan', function () { s.express.logs = s.express.logs.filter(function (x) { return x.id !== l.id; }); S.save(); W.render(); }));
              c.appendChild(ops);
              b.appendChild(c);
            });
          }
        },
        { key: 'ex_res', icon: '🗂️', title: '表达素材库', sub: '多层文件夹（金句 / 模板 / 范文）', render: function (b) { b.appendChild(C.tree('express')); } },
        {
          key: 'ex_shadow', icon: '🎤', title: '跟读练习', sub: '视频跟读 / 自定义文稿 / 调速对比',
          render: function (b) { shadowSection(b); }
        },
        {
          key: 'ex_ck', icon: '✅', title: '表达打卡 & 任务', sub: '每日表达练习',
          render: function (b) { b.appendChild(C.weekcheck('express', { title: '表达练习打卡' })); b.appendChild(C.subTitle('自定义表达任务')); b.appendChild(C.tasklist('express', { addText: '新增表达任务' })); }
        }
      ]
    });
  };

  /* ============ 运动管理 ============ */
  W.P.sport = function (v) {
    var s = S.get();
    if (!s.sport) s.sport = { logs: [] };
    C.sectionPage(v, {
      id: 'sport',
      top: function (m) {
        var logs = s.sport.logs || [];
        var wkStart = U.weekStart(U.today());
        var wk = logs.filter(function (l) { return l.date >= wkStart; });
        var mins = logs.reduce(function (a, x) { return a + (+x.dur || 0); }, 0);
        var kcal = logs.reduce(function (a, x) { return a + (+x.kcal || 0); }, 0);
        m.appendChild(C.statRow([
          { value: wk.length, label: '本周次数', color: '#2fbf87' },
          { value: mins, label: '累计分钟' },
          { value: kcal, label: '消耗 kcal', color: '#f4635e' }
        ]));
      },
      sections: [
        { key: 'sp_ck', icon: '✅', title: '运动打卡', sub: '每日运动习惯', render: function (b) { b.appendChild(C.weekcheck('sport', { title: '运动打卡' })); } },
        {
          key: 'sp_log', icon: '🏃', title: '运动记录', sub: '类型 / 时长 / 消耗',
          render: function (b) {
            b.appendChild(C.btn('＋ 记录一次运动', 'pri mb8', function () {
              U.modal({
                title: '记录运动', fields: [
                  { key: 't', label: '运动类型', value: '跑步' },
                  { key: 'd', label: '时长（分钟）', type: 'number', value: 30 },
                  { key: 'k', label: '消耗（kcal，可空）', type: 'number' },
                  { key: 'n', label: '备注（可空）', type: 'textarea' }
                ]
              }).then(function (v) { if (v) { s.sport.logs.unshift({ id: U.uid(), type: v.t, dur: +v.d || 0, kcal: v.k ? (+v.k) : 0, note: v.n, date: U.today() }); S.save(); W.render(); } });
            }));
            var byType = {};
            (s.sport.logs || []).forEach(function (l) { byType[l.type] = (byType[l.type] || 0) + (+l.dur || 0); });
            var types = Object.keys(byType);
            if (types.length) {
              var cb = C.chartBox('各运动类型累计时长（分钟）');
              cb.appendChild(C.svgBar(types, [{ name: '时长', color: '#2fbf87', data: types.map(function (t) { return byType[t]; }) }]));
              b.appendChild(cb);
            }
            if (!(s.sport.logs || []).length) b.appendChild(el('div', { class: 'empty' }, '<span class="ei">🏃</span>还没有运动记录'));
            s.sport.logs.slice().forEach(function (l) {
              var c = el('div', { class: 'q' });
              var h = el('div', { class: 'qh' });
              h.appendChild(el('span', { class: 'tag pri' }, esc(l.type)));
              h.appendChild(el('span', { class: 'tag' }, l.dur + ' min'));
              if (l.kcal) h.appendChild(el('span', { class: 'tag warn' }, l.kcal + ' kcal'));
              h.appendChild(el('div', { class: 'grow' }));
              h.appendChild(el('span', { class: 'small muted' }, l.date));
              c.appendChild(h);
              if (l.note) c.appendChild(el('div', { class: 'qt small' }, esc(l.note)));
              var ops = el('div', { class: 'row mt6' });
              ops.appendChild(C.btn('🗑', 'sm dan', function () { s.sport.logs = s.sport.logs.filter(function (x) { return x.id !== l.id; }); S.save(); W.render(); }));
              c.appendChild(ops);
              b.appendChild(c);
            });
          }
        },
        { key: 'sp_plan', icon: '📋', title: '运动计划 & 任务', sub: '自定义训练计划', render: function (b) { b.appendChild(C.tasklist('sport', { addText: '新增运动任务' })); } },
        { key: 'sp_video', icon: '🎬', title: '运动教程 / 视频', sub: '健身 / 瑜伽 / 跑步教学（抖音 / B站）', render: function (b) {
          var bar = el('div', { class: 'row mb8' });
          bar.appendChild(C.btn('🔍 抖音运动教程', 'sm', function () { U.open('https://www.douyin.com/search/' + encodeURIComponent('居家健身 教程')); }));
          bar.appendChild(C.btn('📺 B站运动教程', 'sm', function () { U.open('https://search.bilibili.com/all?keyword=' + encodeURIComponent('健身 教程')); }));
          b.appendChild(bar);
          b.appendChild(C.linkgrid('sport_video', { filter: true }));
        } },
        { key: 'sp_res', icon: '🗂️', title: '运动素材库', sub: '计划表 / 照片 / 视频', render: function (b) { b.appendChild(C.tree('sport')); } }
      ]
    });
  };
})();
