/* ===== 应用入口：导航 / 路由 / 全局搜索 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  var cur = 'home';

  function nav() { return S.get().nav.slice().sort(function (a, b) { return a.order - b.order; }); }

  function renderNav() {
    var box = U.$('#navList');
    box.innerHTML = '';
    nav().filter(function (n) { return n.visible; }).forEach(function (n) {
      var i = el('div', { class: 'nav-item' + (cur === n.id ? ' on' : '') });
      i.appendChild(el('div', { class: 'ni-ic' }, n.icon));
      i.appendChild(el('div', { class: 'ni-tx' }, esc(n.name)));
      var d = U.today();
      var ck = S.get().checkins[n.id];
      if (ck && ck.tasks.length && ((ck.rec || {})[d] || []).length < ck.tasks.length) i.appendChild(el('div', { class: 'ni-dot' }));
      i.onclick = function () { go(n.id); };
      box.appendChild(i);
    });
  }

  function render() {
    var v = U.$('#view');
    v.innerHTML = '';
    var n = nav().filter(function (x) { return x.id === cur; })[0] || { id: 'home', name: '首页', icon: '🏠' };
    U.$('#pageTitle').textContent = n.icon + ' ' + n.name;
    var d = U.today();
    U.$('#pageSub').textContent = d + ' 周' + U.cnWeek(d);
    var fn = W.P[cur];
    try {
      if (fn) fn(v);
      else W.P.__custom(v, n);
    } catch (e) {
      v.appendChild(el('div', { class: 'empty' }, '<span class="ei">⚠️</span>该模块渲染出错：' + esc(e.message)));
      if (window.console) console.error(e);
    }
    renderNav();
    v.scrollTop = 0;
  }

  function go(id) { cur = id; render(); }

  /* ---- 全局搜索 ---- */
  function search() {
    U.modal({ title: '全局搜索', fields: [{ key: 'q', label: '关键词', ph: '搜索单词 / 指令 / 笔记 / 题目 / 影视…' }], okText: '搜索' })
      .then(function (r) {
        if (!r || !r.q) return;
        var q = r.q.toLowerCase(), s = S.get(), out = [];
        (s.prompts || []).forEach(function (p) { if ((p.title + p.body).toLowerCase().indexOf(q) >= 0) out.push({ t: '指令库 · ' + p.title, g: 'ai' }); });
        (s.aiLearn && s.aiLearn.videos || []).forEach(function (p) { if ((p.title + p.desc + (p.tags || []).join('')).toLowerCase().indexOf(q) >= 0) out.push({ t: 'AI学习 · ' + p.title, g: 'ai' }); });
        (s.aiLearn && s.aiLearn.tips || []).forEach(function (p) { if ((p.title + (p.steps || []).join('')).toLowerCase().indexOf(q) >= 0) out.push({ t: 'AI技巧 · ' + p.title, g: 'ai' }); });
        (s.express && s.express.articles || []).forEach(function (p) { if ((p.title + p.text).toLowerCase().indexOf(q) >= 0) out.push({ t: '练嘴文章 · ' + p.title, g: 'express' }); });
        (s.express && s.express.podcasts || []).forEach(function (p) { if ((p.title + p.desc + p.cat).toLowerCase().indexOf(q) >= 0) out.push({ t: '播客 · ' + p.title, g: 'express' }); });
        (s.newsToday || []).forEach(function (p) { if ((p.title + p.summary + p.src + p.cat).toLowerCase().indexOf(q) >= 0) out.push({ t: '时事速览 · ' + p.title, g: 'news' }); });
        (s.newsNotes || []).forEach(function (p) { if ((p.title + p.body).toLowerCase().indexOf(q) >= 0) out.push({ t: '时事 · ' + p.title, g: 'news' }); });
        (s.free || []).forEach(function (p) { if ((p.text || '').toLowerCase().indexOf(q) >= 0) out.push({ t: '随心 · ' + p.text.slice(0, 20), g: 'free' }); });
        (s.stt || []).forEach(function (p) { if ((p.title + p.text).toLowerCase().indexOf(q) >= 0) out.push({ t: '文稿 · ' + p.title, g: 'stt' }); });
        (s.movies || []).forEach(function (p) { if ((p.name + (p.note || '')).toLowerCase().indexOf(q) >= 0) out.push({ t: '影视 · ' + p.name, g: 'movie' }); });
        (s.articles || []).forEach(function (p) { if ((p.title + p.text).toLowerCase().indexOf(q) >= 0) out.push({ t: '英语阅读 · ' + p.title, g: 'english' }); });
        for (var dk in s.words) (s.words[dk] || []).forEach(function (w) { if (w.word.toLowerCase().indexOf(q) >= 0) out.push({ t: '单词 · ' + w.word + '（' + dk + '）', g: 'english' }); });
        (s.kySubjects || []).forEach(function (sj) {
          sj.subs.forEach(function (sb) {
            sb.chapters.forEach(function (ch) {
              if (ch.name.toLowerCase().indexOf(q) >= 0) out.push({ t: '章节 · ' + ch.name, g: 'kaoyan' });
              (ch.points || []).forEach(function (p) { if ((p.title + p.content).toLowerCase().indexOf(q) >= 0) out.push({ t: '知识点 · ' + p.title, g: 'kaoyan' }); });
              ch.qs.forEach(function (qq) { if ((qq.text || '').toLowerCase().indexOf(q) >= 0) out.push({ t: '题目 · ' + qq.text.slice(0, 18), g: 'kaoyan' }); });
            });
          });
        });
        if (!out.length) { U.toast('没有找到相关内容'); return; }
        U.sheet('找到 ' + out.length + ' 条结果', out.slice(0, 12).map(function (o) { return { v: o.g, text: o.t, icon: '📄' }; }))
          .then(function (g) { if (g) go(g); });
      });
  }

  /* ---- 设置 ---- */
  function setting() {
    var s = S.get();
    U.sheet('设置', [
      { v: 'sync', text: '多端同步设置', icon: '🔄' },
      { v: 'tts', text: '朗读发音设置（调自然音）', icon: '🔊' },
      { v: 'display', text: '显示大小（手机/Pad/电脑通用）', icon: '🔍' },
      { v: 'city', text: '城市与天气定位', icon: '📍' },
      { v: 'ai', text: 'AI 工具入口管理', icon: '🤖' },
      { v: 'exp', text: '导出数据备份', icon: '📤' },
      { v: 'imp', text: '导入数据备份', icon: '📥' },
      { v: 'about', text: '关于工作台', icon: 'ℹ️' }
    ]).then(function (a) {
      if (a === 'sync') openSync();
      else if (a === 'tts') openTtsSettings();
      else if (a === 'display') {
        var cur = (S.get().ui && S.get().ui.scale) || 'standard';
        U.sheet('显示大小', [
          { v: 'small', text: '小（紧凑）' + (cur === 'small' ? '  ✓' : ''), icon: '🔸' },
          { v: 'standard', text: '标准' + (cur === 'standard' ? '  ✓' : ''), icon: '🔹' },
          { v: 'large', text: '大' + (cur === 'large' ? '  ✓' : ''), icon: '🔆' },
          { v: 'xlarge', text: '特大' + (cur === 'xlarge' ? '  ✓' : ''), icon: '⭐' }
        ]).then(function (sc) {
          if (!sc) return;
          if (!S.get().ui) S.get().ui = {};
          S.get().ui.scale = sc; S.save(); applyScale(); U.toast('显示大小已设为「' + ({ small: '小', standard: '标准', large: '大', xlarge: '特大' })[sc] + '」');
        });
      }
      else if (a === 'city') U.modal({ title: '城市定位', fields: [{ key: 'c', label: '城市名', value: s.cfg.city }, { key: 'a', label: '纬度', value: s.cfg.lat }, { key: 'o', label: '经度', value: s.cfg.lon }] })
        .then(function (x) { if (x) { s.cfg.city = x.c; s.cfg.lat = +x.a; s.cfg.lon = +x.o; S.save(); render(); } });
      else if (a === 'ai') go('ai');
      else if (a === 'exp') {
        var blob = new Blob([S.exportJSON()], { type: 'application/json' });
        var link = el('a', { href: URL.createObjectURL(blob), download: 'workbench-' + U.today() + '.json' });
        document.body.appendChild(link); link.click(); link.remove(); U.toast('已导出备份');
      }
      else if (a === 'imp') U.pickFile('application/json').then(function (f) { if (!f) return; var fr = new FileReader(); fr.onload = function () { S.importJSON(fr.result); }; fr.readAsText(f); });
      else if (a === 'about') U.modal({
        title: '关于', hideCancel: true, okText: '知道了',
        html: '<div class="small" style="line-height:1.8;color:#6b7285">个人工作台 · 多端 App<br>数据默认保存在本机浏览器（localStorage + IndexedDB）。<br>开启「远程地址同步」后，多台设备填同一个地址即可实时同步；也可随时「导出备份」。<br><br>发音、语音识别、天气需要联网与浏览器权限；AI 功能通过一键复制 + 跳转对应 AI 网站完成。</div>'
      });
    });
  }

  /* ---- 朗读发音设置：挑选自然发音人 + 语速/语调 ---- */
  function openTtsSettings() {
    var S0 = S.get(); if (!S0.tts) S0.tts = {};
    var mask = el('div', { class: 'mask' });
    var box = el('div', { class: 'modal' });
    box.appendChild(el('h3', null, '朗读发音设置'));
    var body = el('div');
    body.appendChild(el('div', { class: 'small muted mb8' }, '朗读生硬多是设备默认发音所致。挑一个自然的声音、调一下语速语调即可明显改善。'));
    var f1 = el('div', { class: 'fld' }); f1.appendChild(el('label', null, '发音人（优先挑自然音）'));
    var sel = el('select', { class: 'inp' }); f1.appendChild(sel); body.appendChild(f1);
    var f2 = el('div', { class: 'fld' });
    var lab2 = el('label', null, '语速 ' + (S0.tts.rate != null ? (+S0.tts.rate).toFixed(2) : '0.95'));
    f2.appendChild(lab2);
    var rate = el('input', { type: 'range', min: '0.5', max: '1.6', step: '0.05', style: 'width:100%' });
    rate.value = S0.tts.rate != null ? S0.tts.rate : 0.95;
    rate.oninput = function () { lab2.textContent = '语速 ' + (+rate.value).toFixed(2); };
    f2.appendChild(rate); body.appendChild(f2);
    var f3 = el('div', { class: 'fld' });
    var lab3 = el('label', null, '语调 ' + (S0.tts.pitch != null ? (+S0.tts.pitch).toFixed(2) : '1.00'));
    f3.appendChild(lab3);
    var pitch = el('input', { type: 'range', min: '0.5', max: '1.8', step: '0.05', style: 'width:100%' });
    pitch.value = S0.tts.pitch != null ? S0.tts.pitch : 1.0;
    pitch.oninput = function () { lab3.textContent = '语调 ' + (+pitch.value).toFixed(2); };
    f3.appendChild(pitch); body.appendChild(f3);
    var f4 = el('div', { class: 'fld', style: 'flex-direction:row;align-items:center;gap:8px' });
    var cb = el('input', { type: 'checkbox', style: 'width:auto' });
    cb.checked = !!S0.tts.zhYoudao;
    f4.appendChild(cb);
    f4.appendChild(el('label', { style: 'margin:0' }, '中文朗读优先用有道在线发音（更自然，需联网）'));
    body.appendChild(f4);
    body.appendChild(el('div', { class: 'small muted mb8' }, '开启后，中文示范朗读 / 中文释义改用有道在线发音（明显比系统机械音自然），逐句播放并带换气停顿；联网失败会自动回退系统音。英文朗读不受影响。'));
    box.appendChild(body);
    var ft = el('div', { class: 'modal-ft' });
    var cancel = el('button', { class: 'btn' }, '取消');
    var test = el('button', { class: 'btn' }, '🔊 试听(英文)');
    var testZh = el('button', { class: 'btn' }, '🔊 试听(中文)');
    var ok = el('button', { class: 'btn pri' }, '保存');
    ft.appendChild(cancel); ft.appendChild(test); ft.appendChild(testZh); ft.appendChild(ok);
    box.appendChild(ft); mask.appendChild(box); U.$('#modalRoot').appendChild(mask);
    function fill() {
      var vs = U.getVoices();
      sel.innerHTML = '';
      sel.appendChild(el('option', { value: '' }, '（自动选最佳自然音）'));
      vs.forEach(function (v) {
        var o = el('option', { value: v.voiceURI }, (v.name || '未知') + ' · ' + (v.lang || ''));
        if ((S0.tts.voiceURI || '') === v.voiceURI) o.selected = true;
        sel.appendChild(o);
      });
      if (!vs.length) sel.appendChild(el('option', { value: '' }, '（本机暂无可选发音，已用系统默认）'));
    }
    fill(); U.onVoicesReady(fill);
    test.onclick = function () { U.speak('Hello, this is a natural pronunciation example.', 'en-US', +rate.value, +pitch.value, sel.value); };
    testZh.onclick = function () { U.speak('今天天气真好，我们一起去公园散散步吧。', 'zh-CN', +rate.value, +pitch.value); };
    cancel.onclick = function () { mask.remove(); };
    ok.onclick = function () {
      S0.tts.voiceURI = sel.value || '';
      S0.tts.rate = +rate.value;
      S0.tts.pitch = +pitch.value;
      S0.tts.zhYoudao = !!cb.checked;
      S.save(); mask.remove(); U.toast('朗读发音设置已保存');
    };
    mask.onclick = function (e) { if (e.target === mask) mask.remove(); };
  }

  function openSync() {
    var c = (S.get().cfg && S.get().cfg.sync) || { mode: 'local', url: '', token: '', auto: true };
    U.modal({ title: '多端同步设置', okText: '保存', html: '<div id="syncBox"></div>' })
      .then(function (ok) {
        if (!ok) return;
        if (window.W && W.PairSync) { W.PairSync.collect(); return; }
        var s = S.get(); if (!s.cfg) s.cfg = {}; if (!s.cfg.sync) s.cfg.sync = {};
        S.save();
      });
    setTimeout(function () {
      var box = document.getElementById('syncBox'); if (!box) return;
      if (window.W && W.PairSync) { W.PairSync.render(box); }
      else box.innerHTML = '<div class="small muted">同步模块未加载</div>';
    }, 30);
  }

  /* ---- 显示大小（自适应缩放，手机/Pad/电脑通用）---- */
  function applyScale() {
    var sc = (S.get().ui && S.get().ui.scale) || 'standard';
    var map = { small: 0.85, standard: 1, large: 1.15, xlarge: 1.32 };
    var z = map[sc] || 1;
    var app = U.$('#app'); if (app) { app.style.zoom = z; document.documentElement.style.setProperty('--ui-scale', z); }
  }

  /* ---- 启动 ---- */
  function checkDeepLink() {
    try {
      var up = new URLSearchParams(location.search);
      var upair = up.get('pair');
      if (!upair) return;
      history.replaceState({}, '', location.pathname); // 清理 URL，避免重复触发
      if (!(window.W && W.PairSync)) return;
      var c0 = W.Sync.cfg();
      if (c0.pairCode) return; // 已绑定则不覆盖
      W.PairSync.setPendingCode(upair);
      setTimeout(function () { openSync(); U.toast('已通过分享链接填入配对码，请输入二次密码加入'); }, 200);
    } catch (e) {}
  }
  function boot() {
    var bind = function (id, fn) { var e = U.$(id); if (e) e.onclick = fn; };
    bind('#sbEdit', function () { go('custom'); });
    bind('#sbLogo', function () { go('home'); });
    bind('#btnToday', function () { go('daily'); });
    bind('#btnSearch', search);
    bind('#btnSetting', setting);
    S.load();
    applyScale();
    var ready = function () { render(); if (window.W && W.Sync) W.Sync.start(); checkDeepLink(); };
    // 换沙箱/新设备：本机若无绑定，先尝试从固定源恢复整套绑定配置，再拉取数据、渲染
    var afterBoot = function () {
      if (window.W && W.Sync) W.Sync.pull().then(ready).catch(ready);
      else ready();
    };
    if (window.W && W.PairSync) {
      W.PairSync.bootstrap().then(afterBoot).catch(afterBoot);
    } else afterBoot();
  }

  W.go = go; W.render = render; W.renderNav = renderNav;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
