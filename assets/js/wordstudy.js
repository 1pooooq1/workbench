/* 背单词模块（独立文件，挂在 window.W.P.wordstudy）
 * 功能：
 *   1) 文档词库/分组（单词框）：四六级 / 考研 / 日常生词 / 专业术语 + 自定义；导入文档识别单词，去重放入词框
 *   2) 选词作为今日背诵：从词框多选 → 加入今日计划，选中的单词从词框文件里移除（次日从剩余文件继续）
 *   3) 单词卡片：独立方框；可隐藏/显示英文、真人发音（英/美）、释义、例句；上滑记住 / 下滑陌生（按钮 + 触摸）
 *   4) 背诵模式：浏览 / 拼写自测 / 释义回忆 / 听音拼写（听音→拼写，仿英语听音拼写）
 *   5) 艾宾浩斯：新词 当天/第2/4/7/15 天循环；答错增加频次；熟记归档进熟词库；错题本收纳顽固词
 *   6) 每日目标 + 打卡（同步到每日任务「背单词」）
 * 数据：state.wordGroups / wordPlan / eb / familiar / wrong / wordGoal / wordMode / wordAccent
 */
(function () {
  var W = window.W, S = W.S, U = W.U;
  var REVIEW = [0, 2, 4, 7, 15]; // 艾宾浩斯复习间隔（天）：当天、第2、4、7、15 天循环
  var curTab = 'docs';
  var VIEW = null; // 当前渲染容器，供导出/恢复后整页重渲染

  /* 随机打乱（Fisher–Yates），用于「打乱顺序」背诵 */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function el(t, o, txt) {
    o = o || {}; var e = document.createElement(t);
    for (var k in o) {
      if (k === 'class') e.className = o[k];
      else if (k === 'style') e.style.cssText = o[k];
      else if (k === 'value') e.value = o[k];
      else if (k === 'type') e.type = o[k];
      else if (k === 'placeholder') e.placeholder = o[k];
      else if (k === 'id') e.id = o[k];
      else if (k === 'html') e.innerHTML = o[k];
      else e.setAttribute(k, o[k]);
    }
    if (txt != null) e.textContent = txt;
    return e;
  }
  function btn(t, cls, fn) { var b = el('button', { class: 'btn ' + (cls || 'sm') }, t); if (fn) b.onclick = fn; return b; }
  function phRow(w) {
    if (!w || !w.ph) return null;
    var row = el('div', { class: 'row', style: 'gap:6px;align-items:center;margin:4px 0' });
    row.appendChild(el('span', { class: 'small muted' }, '音标：'));
    var ph = el('span', { style: 'cursor:pointer;color:#5b6cff' }, esc(w.ph));
    ph.title = '点击朗读';
    ph.onclick = function () { U.speak(w.word, S.get().wordAccent, 1); };
    row.appendChild(ph);
    return row;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function empty(msg) { return el('div', { class: 'empty' }, '<span class="ei">📚</span>' + esc(msg)); }
  function sep(t) { return el('div', { class: 'sep', style: 'margin:14px 0 10px;font-weight:700;color:#888' }, t); }
  function stat(label, val) {
    var c = el('div', { style: 'text-align:center;min-width:56px' });
    c.appendChild(el('div', { style: 'font-size:18px;font-weight:700' }, String(val)));
    c.appendChild(el('div', { class: 'small muted' }, label));
    return c;
  }
  function countDue() { var s = S.get(); var n = 0; for (var k in (s.eb || {})) { if (s.eb[k].next && s.eb[k].next <= dayOffset(0)) n++; } return n; }
  function init() {
    var s = S.get();
    // 迁移：旧版把「词框分组」存在 wordDocs，现改名 wordGroups 以避让英语的文档库 wordDocs
    var _raw = S.get();
    if (!_raw.wordGroups && _raw['wordDocs']) {
      var _grp = (_raw['wordDocs'] || []).filter(function (g) { return g && !('type' in g) && Array.isArray(g.words); });
      var _doc = (_raw['wordDocs'] || []).filter(function (g) { return g && ('type' in g); });
      if (_grp.length) { _raw.wordGroups = _grp; _raw['wordDocs'] = _doc; S.save(); }
    }
    if (!_raw.wordGroups) _raw.wordGroups = [];
    if (!s.wordPlan) s.wordPlan = {};
    if (!s.eb) s.eb = {};
    if (!s.familiar) s.familiar = [];
    if (!s.wrong) s.wrong = [];
    if (s.wordGoal == null) s.wordGoal = 30;
    if (!s.wordMode) s.wordMode = 'browse';
    if (!s.wordAccent) s.wordAccent = 'en-US';
    if (!s.wordDone) s.wordDone = {};
    if (!s.wordShuffle) s.wordShuffle = false;
    if (!s.listenShowWord) s.listenShowWord = false;
    if (!s.listenShowMean) s.listenShowMean = false;
    if (!s.listenShowPh) s.listenShowPh = false;
    if (!s.wordSeqCursor) s.wordSeqCursor = {};
    if (!s.aiPassageLen) s.aiPassageLen = 200;
  }
  function dayOffset(n) { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() + n * 86400000; }
  function today() { return U.today(); }

  /* ---------- 单词解析（文件识别）---------- */
  function parseWords(text) {
    var lines = String(text || '').split(/\r?\n/);
    var out = [];
    lines.forEach(function (line) {
      line = line.trim(); if (!line) return;
      // 首个空白分词：前面是单词，其余是释义
      var sp = line.search(/\s/);
      var wordRaw = sp < 0 ? line : line.slice(0, sp);
      var rest = sp < 0 ? '' : line.slice(sp + 1).trim();
      var word = wordRaw.toLowerCase().replace(/[^a-z'-]/g, '');
      if (!word || word.length < 2) return;
      var mean = rest, ex = '';
      // 例句分隔：制表符 / 竖线 / 「例：」 / 「eg:」
      var exParts = rest.split(/\t+|\s*\|\s*/).filter(function (x) { return x.trim(); });
      if (exParts.length >= 2) { mean = exParts[0].trim(); ex = exParts.slice(1).join(' | ').replace(/^(例\s*[:：]|eg\.?\s*)/i, '').trim(); }
      else {
        var mm = rest.split(/例\s*[:：]|eg\.?/i);
        if (mm.length >= 2) { mean = mm[0].trim(); ex = mm.slice(1).join('').trim(); }
      }
      out.push({ word: word, ph: '', mean: mean, ex: ex });
    });
    return out;
  }
  function addWordsFromText(group, text) {
    var ws = parseWords(text);
    var have = {}; (group.words || []).forEach(function (w) { have[w.word] = 1; });
    var added = 0;
    ws.forEach(function (w) { if (!have[w.word]) { group.words.push(w); have[w.word] = 1; added++; } });
    S.save();
    U.toast('已识别并加入 ' + added + ' 个新单词（该词框共 ' + group.words.length + '）');
  }

  /* ---------- 艾宾浩斯调度 ---------- */
  function schedule(key, correct, w) {
    var s = S.get(); if (!s.eb) s.eb = {};
    var e = s.eb[key] || { stage: 0, wrong: 0, next: 0 };
    if (correct) { e.wrong = 0; if (e.stage < REVIEW.length) e.stage++; e.next = dayOffset(REVIEW[Math.min(e.stage - 1, REVIEW.length - 1)]); }
    else { e.wrong = (e.wrong || 0) + 1; e.stage = 0; e.next = dayOffset(1); if (w) addWrong(key, w); }
    s.eb[key] = e;
  }
  function addWrong(key, w) {
    var s = S.get(); if (!s.wrong) s.wrong = [];
    if (!s.wrong.some(function (x) { return x.key === key; })) s.wrong.push({ key: key, word: w.word, ph: w.ph, mean: w.mean });
  }
  function addFamiliar(key, w) {
    var s = S.get(); if (!s.familiar) s.familiar = [];
    if (!s.familiar.some(function (x) { return x.key === key; })) s.familiar.push({ key: key, word: w.word, ph: w.ph, mean: w.mean });
    s.wrong = (s.wrong || []).filter(function (x) { return x.key !== key; });
    // 互通：来自英语生词本的词被「熟悉/熟记归档」后，自动从英语生词本移除
    if (key.indexOf('__wordbook__:') === 0) removeFromWordBook(w.word);
  }
  function wordInfo(key) {
    var p = key.split(':'); var gid = p[0]; var word = p.slice(1).join(':');
    var s = S.get();
    if (gid === '__wordbook__') {
      var wb = (s.wordBook || []).filter(function (x) { return String(x.word || '').toLowerCase() === word.toLowerCase(); })[0];
      if (wb) return { word: String(wb.word || '').toLowerCase(), ph: wb.ph || '', mean: wb.mean || '', ex: wb.ex || '' };
    }
    var g = (s.wordGroups || []).filter(function (x) { return x.id === gid; })[0];
    if (g) { var w = (g.words || []).filter(function (x) { return x.word === word; })[0]; if (w) return w; }
    var f = (s.familiar || []).concat(s.wrong || []).filter(function (x) { return x.key === key; })[0];
    return f || { word: word };
  }

  /* ---------- 打卡（同步每日任务）---------- */
  function checkInEnglish() {
    var s = S.get(); var ck = s.checkins && s.checkins.english; if (!ck) return;
    var tk = (ck.tasks || []).filter(function (t) { return t.name === '背单词'; })[0]; if (!tk) return;
    var d = today(); if (!ck.rec[d]) ck.rec[d] = [];
    if (ck.rec[d].indexOf(tk.id) < 0) { ck.rec[d].push(tk.id); S.save(); }
  }
  function maybeCheckIn() {
    var s = S.get(); var d = today();
    if (s._wordChecked === d) return;
    s._wordChecked = d; checkInEnglish();
    U.toast('🎉 已完成今日背诵目标，已打卡到「每日任务 · 背单词」');
  }

  /* ============ 页面渲染 ============ */
  function render(view) {
    VIEW = view;
    view.innerHTML = '';
    init();
    var s = S.get();
    var done = (s.wordDone && s.wordDone[today()]) || 0;
    var head = el('div', { class: 'card', style: 'padding:12px;margin-bottom:10px' });
    head.appendChild(el('div', { style: 'font-size:15px;font-weight:700;margin-bottom:8px' }, '📚 词框分组与复习计划（从独立背单词合并）'));
    var ov = el('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap' });
    ov.appendChild(stat('每日目标', s.wordGoal || 30));
    ov.appendChild(stat('已完成', done));
    ov.appendChild(stat('待复习', countDue()));
    ov.appendChild(stat('错词', (s.wrong || []).length));
    ov.appendChild(stat('熟词', (s.familiar || []).length));
    head.appendChild(ov);
    view.appendChild(head);
    var bk = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap' });
    bk.appendChild(btn('📤 备份', 'sm', function () { exportWords(); }));
    bk.appendChild(btn('📥 恢复', 'sm', function () { importWords(); }));
    bk.appendChild(el('span', { class: 'small muted', style: 'margin-left:auto' }, '仅备份背单词数据'));
    view.appendChild(bk);
    var tabs = [['docs', '词框分组'], ['study', '今日背诵'], ['review', '复习'], ['wrong', '错题本'], ['fam', '熟词库']];
    var bar = el('div', { class: 'row mb8', style: 'flex-wrap:wrap;gap:6px' });
    tabs.forEach(function (t) { bar.appendChild(btn(t[1], curTab === t[0] ? 'pri sm' : 'sm', function () { curTab = t[0]; render(view); })); });
    view.appendChild(bar);
    if (curTab === 'docs') renderDocs(view);
    else if (curTab === 'study') renderStudy(view);
    else if (curTab === 'review') renderReview(view);
    else if (curTab === 'wrong') renderWrong(view);
    else if (curTab === 'fam') renderFam(view);
  }

  /* ---- 词库 / 分组 ---- */
  /* 英语生词本的「互通」实时镜像：不另存一份，直接读 s.wordBook；选中背诵也不删源 */
  function liveWordBookGroup() {
    var s = S.get();
    return {
      id: '__wordbook__', name: '英语生词本（互通）', cat: '来自英语模块', _live: true,
      words: (s.wordBook || []).map(function (d) { return { word: String(d.word || '').toLowerCase(), ph: d.ph || '', mean: d.mean || '', ex: d.ex || '' }; })
    };
  }
  function removeFromWordBook(word) {
    var s = S.get(); if (!s.wordBook || !s.wordBook.length) return;
    var lw = String(word || '').toLowerCase();
    var nb = s.wordBook.filter(function (x) { return String(x.word || '').toLowerCase() !== lw; });
    if (nb.length !== s.wordBook.length) { s.wordBook = nb; S.save(); }
  }
  function renderDocs(view) {
    var s = S.get();
    var add = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap' });
    add.appendChild(btn('➕ 新建词框', 'pri sm', function () {
      U.modal({ title: '新建词框', fields: [{ key: 'name', label: '词框名称', ph: '如 考研核心词' }, { key: 'cat', label: '分类（可选）', ph: '考研单词 / 专业术语…' }], okText: '创建' })
        .then(function (r) { if (r && r.name) { s.wordGroups.push({ id: U.uid(), name: r.name, cat: r.cat || '', words: [] }); S.save(); render(view); } });
    }));
    add.appendChild(btn('📋 预设分组', 'sm', function () {
      ['四六级', '考研单词', '日常生词', '专业术语'].forEach(function (c) {
        if (!s.wordGroups.some(function (g) { return g.cat === c; })) s.wordGroups.push({ id: U.uid(), name: c, cat: c, words: [] });
      });
      S.save(); U.toast('已创建预设分组'); render(view);
    }));
    add.appendChild(btn('🎓 考研词书', 'pri sm', function () { importKY(); }));
    add.appendChild(btn('📥 英语生词本（互通）', 'sm', function () { selectWords(liveWordBookGroup(), view); }));
    view.appendChild(add);
    view.appendChild(sep('———— 我的词框 ————'));

    var groups = [liveWordBookGroup()].concat(s.wordGroups);
    if (!groups.length) { view.appendChild(empty('还没有词框。先「新建词框」或「预设分组」，再导入文档识别单词。')); return; }

    groups.forEach(function (g) {
      var card = el('div', { class: 'card', style: 'padding:10px' });
      var h = el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:6px' });
      h.appendChild(el('div', { style: 'font-weight:600' }, esc(g.name) + (g.cat ? '  <span class="small muted">· ' + esc(g.cat) + '</span>' : '') + '  <span class="small muted">(' + (g.words || []).length + ' 词)</span>' + (g._live ? '  <span class="small" style="color:#5b6cff">↔ 与英语互通</span>' : '')));
      card.appendChild(h);
      var ops = el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' });
      ops.appendChild(btn('☑ 选词背诵', 'sm pri', function () { selectWords(g, view); }));
      ops.appendChild(btn('🔁 顺序续背', 'sm', function () { seqPick(g, view); }));
      if (!g._live) {
        ops.appendChild(btn('📝 粘贴文本', 'sm', function () {
          U.modal({ title: '导入单词（文档识别）', fields: [{ key: 'src', label: '粘贴文本：每行一个单词，或「单词  释义」用空格分开', ph: 'apple 苹果\nbook 书', type: 'textarea' }], okText: '加入词框' })
            .then(function (r) { if (r && r.src) addWordsFromText(g, r.src); });
        }));
        ops.appendChild(btn('📄 选文档', 'sm', function () { pickFile(g); }));
        ops.appendChild(btn('🗑 删单词', 'sm dan', function () { deleteWords(g, view); }));
        ops.appendChild(btn('✏ 改名', 'sm', function () { U.modal({ title: '改名', fields: [{ key: 'n', label: '名称', value: g.name }], okText: '保存' }).then(function (r) { if (r && r.n) { g.name = r.n; S.save(); render(view); } }); }));
        ops.appendChild(btn('🗑 删除词框', 'sm dan', function () { U.confirm('删除词框「' + g.name + '」及其单词？').then(function (ok) { if (ok) { s.wordGroups = s.wordGroups.filter(function (x) { return x.id !== g.id; }); S.save(); render(view); } }); }));
      } else {
        ops.appendChild(btn('🔄 同步', 'sm', function () { render(view); U.toast('已与英语生词本同步'); }));
        ops.appendChild(btn('🔁 顺序续背', 'sm', function () { seqPick(g, view); }));
        ops.appendChild(btn('ℹ 说明', 'sm', function () { U.toast('英语阅读/背词里收藏的生词，会同步出现在这里；在这里熟记归档后，会自动从英语生词本移除'); }));
      }
      card.appendChild(ops);
      view.appendChild(card);
    });
  }
  function pickFile(g) {
    if (!U.pickFile) { U.toast('当前环境不支持选择文档'); return; }
    U.pickFile('.pdf,.doc,.docx,.txt,.md,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv', true)
      .then(function (f) {
        if (!f) return;
        // PDF / Word 需联网加载解析库；txt / md / csv 直接读取
        U.extractDocText(f).then(function (text) {
          addWordsFromText(g, text);
        }).catch(function (e) { U.toast('解析文档失败：' + ((e && e.message) || e) + '（PDF / Word 需联网加载解析库）'); });
      })
      .catch(function () { U.toast('选择文档失败，可改用粘贴文本'); });
  }

  function openWordPicker(g, title, okText, onOk) {
    var sel = {};
    U.modal({ title: title, html: '<div id="selHost" style="max-height:60vh;overflow:auto"></div>', okText: okText })
      .then(function (ok) {
        if (!ok) return;
        var keys = Object.keys(sel).filter(function (k) { return sel[k]; });
        onOk(keys);
      });
    setTimeout(function () {
      var host = document.getElementById('selHost'); if (!host) return;
      host.innerHTML = '';
      if (!g.words || !g.words.length) { host.appendChild(el('div', { class: 'small muted' }, '词框为空，请先导入单词')); return; }
      var all = el('label', { class: 'row', style: 'gap:6px;margin-bottom:6px' });
      var ac = el('input', { type: 'checkbox' }); all.appendChild(ac); all.appendChild(el('span', {}, '全选'));
      host.appendChild(all);
      g.words.forEach(function (w) {
        var row = el('label', { class: 'row', style: 'gap:6px;margin-bottom:4px' });
        var cb = el('input', { type: 'checkbox' }); sel[w.word] = false;
        cb.onchange = function () { sel[w.word] = cb.checked; };
        row.appendChild(cb);
        row.appendChild(el('span', {}, esc(w.word) + (w.mean ? '  · ' + esc(w.mean) : '') + (w.ex ? '  「' + esc(w.ex) + '」' : '')));
        host.appendChild(row);
      });
      ac.onchange = function () {
        host.querySelectorAll('label.row').forEach(function (lr) {
          if (lr === all) return;
          var c = lr.querySelector('input[type=checkbox]'); if (c) c.checked = ac.checked;
        });
        g.words.forEach(function (w) { sel[w.word] = ac.checked; });
      };
    }, 0);
  }
  function selectWords(g, view) {
    openWordPicker(g, g._live ? '选词作为今日背诵（来自英语生词本，原词保留）' : '选词作为今日背诵（选中的会从词框移除，不再重复出现）', '加入今日背诵', function (keys) {
      if (!keys.length) { U.toast('未选择单词'); return; }
      var s2 = S.get();
      var plan = s2.wordPlan[today()] || (s2.wordPlan[today()] = []);
      var removed = 0;
      keys.forEach(function (k) {
        var w = (g.words || []).filter(function (x) { return x.word === k; })[0];
        if (w) { plan.push({ key: g.id + ':' + w.word, word: w.word, ph: w.ph, mean: w.mean, ex: w.ex, groupId: g.id }); removed++; }
      });
      if (!g._live) { g.words = (g.words || []).filter(function (x) { return keys.indexOf(x.word) < 0; }); }
      S.save();
      U.toast('已加入 ' + removed + ' 词到今日背诵' + (g._live ? '（英语生词本保留）' : '，并从词框移除'));
      curTab = 'study'; render(view);
    });
  }
  /* 顺序自动续背：从当前游标+1 取 N 个（N=每日目标）加入今日计划，并推进游标 */
  function seqPick(g, view) {
    var s = S.get();
    if (!s.wordSeqCursor) s.wordSeqCursor = {};
    var goal = s.wordGoal || 30;
    var words = g.words || [];
    if (!words.length) { U.toast('词框为空，请先导入单词'); return; }
    var cur = s.wordSeqCursor[g.id] || 0;
    if (cur >= words.length) cur = 0; // 背完一轮后从开头循环
    var taken = 0;
    var plan = s.wordPlan[today()] || (s.wordPlan[today()] = []);
    for (var i = cur; i < words.length && taken < goal; i++) {
      var w = words[i];
      plan.push({ key: g.id + ':' + w.word, word: w.word, ph: w.ph, mean: w.mean, ex: w.ex, groupId: g.id });
      taken++;
    }
    s.wordSeqCursor[g.id] = cur + taken;
    if (taken < goal && cur === 0) U.toast('词框不足 ' + goal + ' 词，已全部加入（共 ' + taken + '）');
    else U.toast('已按序加入 ' + taken + ' 词，游标推进到 ' + s.wordSeqCursor[g.id]);
    S.save();
    curTab = 'study'; render(view);
  }
  function deleteWords(g, view) {
    openWordPicker(g, '删除词框中的单词（勾选后删除，不可恢复）', '删除选中', function (keys) {
      if (!keys.length) { U.toast('未选择单词'); return; }
      g.words = (g.words || []).filter(function (x) { return keys.indexOf(x.word) < 0; });
      S.save();
      U.toast('已删除 ' + keys.length + ' 个单词');
      render(view);
    });
  }

  /* ---- 今日背诵（卡片 + 模式）---- */
  function renderStudy(view) {
    var s = S.get();
    var top = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap;align-items:center' });
    top.appendChild(el('span', { class: 'small' }, '模式'));
    [['browse', '浏览'], ['spell', '拼写自测'], ['mean', '释义回忆'], ['listen', '听音拼写']].forEach(function (m) {
      top.appendChild(btn(m[1], s.wordMode === m[0] ? 'pri sm' : 'sm', function () { s.wordMode = m[0]; S.save(); render(view); }));
    });
    view.appendChild(top);
    var shuf = el('label', { class: 'ws-shuf' });
    shuf.appendChild(el('span', {}, '打乱顺序'));
    var shufSw = el('div', { class: 'sw' + (s.wordShuffle ? ' on' : '') });
    shufSw.onclick = function (e) { e.stopPropagation(); s.wordShuffle = !s.wordShuffle; S.save(); render(view); };
    shuf.appendChild(shufSw);
    top.appendChild(shuf);
    top.style.flexWrap = 'wrap';
    var top2 = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap;align-items:center' });
    top2.appendChild(el('span', { class: 'small' }, '发音'));
    top2.appendChild(btn('美式', s.wordAccent === 'en-US' ? 'pri sm' : 'sm', function () { s.wordAccent = 'en-US'; S.save(); render(view); }));
    top2.appendChild(btn('英式', s.wordAccent === 'en-GB' ? 'pri sm' : 'sm', function () { s.wordAccent = 'en-GB'; S.save(); render(view); }));
    var goal = s.wordGoal || 30; var done = (s.wordDone && s.wordDone[today()]) || 0;
    top2.appendChild(el('span', { class: 'small muted' }, '目标 ' + goal + ' · 已完成 ' + done));
    top2.appendChild(btn('⚙目标', 'sm', function () {
      U.modal({ title: '每日背诵目标', fields: [{ key: 'g', label: '目标词数', value: goal, type: 'number' }], okText: '保存' })
        .then(function (r) { if (r) { s.wordGoal = Math.max(1, parseInt(r.g, 10) || 30); S.save(); render(view); } });
    }));
    view.appendChild(top2);
    var aiRow = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap;align-items:center' });
    aiRow.appendChild(btn('✨ AI 生成配套短文', 'pri sm', function () { genPassage(view); }));
    aiRow.appendChild(btn('⚙ AI 设置', 'sm', function () { openAISettings(view); }));
    view.appendChild(aiRow);
    if (s.wordMode === 'listen') {
      var top3 = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap;align-items:center' });
      top3.appendChild(el('span', { class: 'small' }, '显示'));
      top3.appendChild(btn(s.listenShowWord ? '✅单词' : '⬜单词', 'sm', function () { s.listenShowWord = !s.listenShowWord; S.save(); render(view); }));
      top3.appendChild(btn(s.listenShowMean ? '✅释义' : '⬜释义', 'sm', function () { s.listenShowMean = !s.listenShowMean; S.save(); render(view); }));
      top3.appendChild(btn(s.listenShowPh ? '✅音标' : '⬜音标', 'sm', function () { s.listenShowPh = !s.listenShowPh; S.save(); render(view); }));
      view.appendChild(top3);
    }
    view.appendChild(sep('———— 单词卡片 ————'));

    var plan = s.wordPlan[today()] || [];
    if (!plan.length) { view.appendChild(empty('今天还没有背诵计划。去「词库」勾选单词 → 「选词背诵」，选中的单词会从词框文件里移除，今天只练这些。')); return; }

    // 打乱顺序：基于今日计划副本打乱展示顺序，不改变原始计划数据
    var seq = plan.slice(); if (s.wordShuffle) shuffle(seq);
    var pos = 0, strangeQueue = [];
    var host = el('div', { id: 'cardHost' });
    view.appendChild(host);

    function speak(w) { U.speak(w.word, s.wordAccent, 1); }
    function complete(w) {
      w._done = true;
      if (!s.wordDone) s.wordDone = {}; var d = today();
      s.wordDone[d] = (s.wordDone[d] || 0) + 1;
      if (s.wordDone[d] >= (s.wordGoal || 30)) maybeCheckIn();
      S.save();
    }
    function resolve(w, correct, archive) {
      if (archive) { addFamiliar(w.key, w); }
      else {
        schedule(w.key, correct, w);
        if (!correct) { w._s = (w._s || 0) + 1; if (w._s <= 2) strangeQueue.push(w); }
      }
      complete(w); renderCard();
    }
    function markFamiliar(w) { addFamiliar(w.key, w); complete(w); U.toast('已标记熟悉'); renderCard(); }
    function archiveWord(w) { addFamiliar(w.key, w); complete(w); renderCard(); }
    function markReview(w) {
      var e = s.eb[w.key] || { stage: 0, wrong: 0, next: 0 };
      e.next = dayOffset(1); s.eb[w.key] = e; S.save();
      w._done = false; if (strangeQueue.indexOf(w) < 0) strangeQueue.push(w);
      U.toast('已加入待复习（明天再看）'); renderCard();
    }
    function del(w) {
      var i = plan.indexOf(w); if (i >= 0) plan.splice(i, 1);
      w._done = true; S.save(); renderCard();
    }
    function renderCard() {
      if (pos < seq.length && !seq[pos]._done) return renderOne(seq[pos]);
      pos++;
      if (pos < seq.length) return renderCard();
      if (strangeQueue.length) { var w = strangeQueue.shift(); w._done = false; seq.push(w); pos = seq.length - 1; return renderCard(); }
      summary();
    }
    function renderOne(w) {
      host.innerHTML = '';
      var card = el('div', { class: 'card', style: 'padding:12px' });
      card.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:6px' }, '进度 ' + (pos + 1) + '/' + plan.length + (s.wordShuffle ? ' · 已打乱' : '') + '　· ' + esc(w.word)));
      if (s.wordMode === 'spell') {
        var ph = el('div', { style: 'font-size:22px;font-weight:700;margin:6px 0;filter:blur(9px);user-select:none' }, esc(w.word));
        card.appendChild(ph);
        var phs = phRow(w); if (phs) card.appendChild(phs);
        if (w.mean) card.appendChild(el('div', { class: 'small', style: 'margin-bottom:6px' }, '释义：' + esc(w.mean)));
        var inp = el('input', { class: 'inp', style: 'margin:8px 0', placeholder: '输入英文拼写' });
        card.appendChild(inp);
        var check = btn('检查', 'pri ws-fab', function () {
          var v = inp.value.trim().toLowerCase(); if (!v) { U.toast('先拼写'); return; }
          var ok = v === w.word.toLowerCase();
          ph.style.filter = 'none';
          if (ok) { U.toast('✅ 正确'); speak(w); resolve(w, true); }
          else { U.toast('❌ 正确拼写：' + w.word); speak(w); resolve(w, false); }
        });
        card.appendChild(check);
        inp.onkeydown = function (e) { if (e.key === 'Enter') check.click(); };
      } else if (s.wordMode === 'mean') {
        card.appendChild(el('div', { style: 'font-size:22px;font-weight:700;margin:6px 0' }, esc(w.word)));
        var phm = phRow(w); if (phm) card.appendChild(phm);
        var meanBox = el('div', { class: 'small', style: 'display:none;margin-bottom:6px' }, '释义：' + esc(w.mean || '（无）'));
        card.appendChild(meanBox);
        card.appendChild(btn('显示释义', 'sm', function () { meanBox.style.display = meanBox.style.display === 'none' ? 'block' : 'none'; }));
        if (w.ex) { var mex = el('div', { class: 'small', style: 'display:none;margin-bottom:6px' }, '例句：' + esc(w.ex)); card.appendChild(mex); card.appendChild(btn('💡 例句', 'sm', function () { mex.style.display = mex.style.display === 'none' ? 'block' : 'none'; })); }
        card.appendChild(btn('记得', 'pri sm', function () { resolve(w, true); }));
        card.appendChild(btn('不记得', 'sm', function () { meanBox.style.display = 'block'; resolve(w, false); }));
      } else if (s.wordMode === 'listen') {
        // 听音拼写：自动播放发音，默认隐藏单词/释义/音标，听后输入拼写并「检查」
        setTimeout(function () { speak(w); }, 30);
        card.appendChild(el('div', { style: 'font-size:15px;color:#888;margin:6px 0' }, '🔊 听发音，拼写单词'));
        var lip = el('div', { style: 'font-size:26px;font-weight:700;margin:6px 0;letter-spacing:2px;user-select:none' + (s.listenShowWord ? '' : ';filter:blur(10px)') }, esc(w.word));
        card.appendChild(lip);
        if (w.ph) { var lph = el('div', { class: 'small', style: 'margin-bottom:4px' + (s.listenShowPh ? '' : ';display:none') }, '音标：' + esc(w.ph)); card.appendChild(lph); }
        if (w.mean) { var lmean = el('div', { class: 'small', style: 'margin-bottom:6px' + (s.listenShowMean ? '' : ';display:none') }, '释义：' + esc(w.mean)); card.appendChild(lmean); }
        var inpl = el('input', { class: 'inp', style: 'margin:8px 0', placeholder: '听音后输入拼写' });
        card.appendChild(inpl);
        var checkL = btn('检查', 'pri ws-fab', function () {
          var v = inpl.value.trim().toLowerCase(); if (!v) { U.toast('先拼写'); return; }
          var ok = v === w.word.toLowerCase();
          lip.style.filter = 'none';
          if (ok) { U.toast('✅ 正确'); speak(w); resolve(w, true); }
          else { U.toast('❌ 正确拼写：' + w.word); speak(w); resolve(w, false); }
        });
        card.appendChild(checkL);
        inpl.onkeydown = function (e) { if (e.key === 'Enter') checkL.click(); };
        var subl = el('div', { class: 'ws-sub' });
        subl.appendChild(btn('🔊 再听', 'sm', function () { speak(w); }));
        subl.appendChild(btn(s.listenShowWord ? '🙈 隐藏拼写' : '👁 显示拼写', 'sm', function () { s.listenShowWord = !s.listenShowWord; S.save(); render(view); }));
        if (w.mean) subl.appendChild(btn(s.listenShowMean ? '🙈 隐藏释义' : '👁 显示释义', 'sm', function () { s.listenShowMean = !s.listenShowMean; S.save(); render(view); }));
        if (w.ph) subl.appendChild(btn(s.listenShowPh ? '🙈 隐藏音标' : '👁 显示音标', 'sm', function () { s.listenShowPh = !s.listenShowPh; S.save(); render(view); }));
        card.appendChild(subl);
      } else { // browse
        var big = el('div', { style: 'font-size:24px;font-weight:700;margin:6px 0' }, esc(w.word));
        card.appendChild(big);
        var sp = el('div', { class: 'row', style: 'gap:6px;margin:6px 0' });
        sp.appendChild(btn('🔊 美式', 'sm', function () { U.speak(w.word, 'en-US', 1); }));
        sp.appendChild(btn('🔊 英式', 'sm', function () { U.speak(w.word, 'en-GB', 1); }));
        card.appendChild(sp);
        if (w.mean) card.appendChild(el('div', { class: 'small', style: 'margin-bottom:4px' }, '释义：' + esc(w.mean)));
        var phb = phRow(w); if (phb) card.appendChild(phb);
        var exBox = el('div', { class: 'small', style: 'display:none;margin-bottom:4px' }, '例句：' + esc(w.ex || '（无）'));
        card.appendChild(exBox);
        card.appendChild(btn('👁 隐藏/显示英文', 'sm', function () { big.style.visibility = big.style.visibility === 'hidden' ? 'visible' : 'hidden'; }));
        if (w.ex) card.appendChild(btn('💡 例句', 'sm', function () { exBox.style.display = exBox.style.display === 'none' ? 'block' : 'none'; }));
      }
      // 通用操作：上滑记住 / 下滑陌生；标记熟悉 / 待复习 / 熟记归档
      if (s.wordMode === 'browse' || s.wordMode === 'mean') {
        var big = el('div', { class: 'ws-big' });
        big.appendChild(btn('✅ 记住', 'pri', function () { speak(w); resolve(w, true); }));
        big.appendChild(btn('❌ 陌生', 'dan', function () { resolve(w, false); }));
        card.appendChild(big);
      }
      var sub = el('div', { class: 'ws-sub' });
      sub.appendChild(btn('🔖 熟悉', 'sm', function () { markFamiliar(w); }));
      sub.appendChild(btn('🔁 待复习', 'sm', function () { markReview(w); }));
      sub.appendChild(btn('⭐ 归档', 'sm', function () { archiveWord(w); }));
      sub.appendChild(btn('🗑 删除', 'sm dan', function () { del(w); }));
      card.appendChild(sub);
      // 触摸滑动：上滑记住 / 下滑陌生
      var sy = 0;
      card.addEventListener('touchstart', function (e) { sy = e.touches[0].clientY; }, { passive: true });
      card.addEventListener('touchend', function (e) {
        var dy = e.changedTouches[0].clientY - sy;
        if (dy < -50) { speak(w); resolve(w, true); }
        else if (dy > 50) { resolve(w, false); }
      }, { passive: true });
      host.appendChild(card);
    }
    function summary() {
      host.innerHTML = '';
      var done = (s.wordDone && s.wordDone[today()]) || 0;
      host.appendChild(el('div', { class: 'card', style: 'padding:14px;text-align:center' },
        '🎉 今日背诵完成！\n共处理 ' + plan.length + ' 词，已完成 ' + done + ' 词。' + (done >= (s.wordGoal || 30) ? '（已打卡）' : '')));
      host.appendChild(btn('返回词库', 'pri sm', function () { curTab = 'docs'; render(view); }));
    }
    renderCard();
  }

  /* ---- 复习（艾宾浩斯到期）---- */
  function renderReview(view) {
    var s = S.get(); var due = [];
    for (var key in (s.eb || {})) { var e = s.eb[key]; if (e.next && e.next <= dayOffset(0)) due.push({ key: key, e: e }); }
    if (!due.length) { view.appendChild(sep('———— 到期复习 ————')); view.appendChild(empty('暂时没有到期的复习词。学过的词会在第 2/4/7/15 天自动出现在这里。')); return; }
    view.appendChild(sep('———— 到期复习 ————'));
    view.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:6px' }, '到期复习 ' + due.length + ' 词'));
    due.forEach(function (it) {
      var w = wordInfo(it.key);
      var card = el('div', { class: 'card', style: 'padding:10px' });
      card.appendChild(el('div', { style: 'font-weight:600;margin-bottom:4px' }, esc(w.word)));
      if (w.mean) card.appendChild(el('div', { class: 'small muted' }, esc(w.mean)));
      if (w.ex) card.appendChild(el('div', { class: 'small muted' }, '例句：' + esc(w.ex)));
      var ctr = el('div', { class: 'row', style: 'gap:6px;margin-top:6px;flex-wrap:wrap' });
      ctr.appendChild(btn('🔊', 'sm', function () { U.speak(w.word, s.wordAccent, 1); }));
      ctr.appendChild(btn('记得', 'pri sm', function () { schedule(it.key, true, w); S.save(); renderReview(view); }));
      ctr.appendChild(btn('不记得', 'sm', function () { schedule(it.key, false, w); S.save(); renderReview(view); }));
      ctr.appendChild(btn('🔖 熟悉', 'sm', function () { addFamiliar(it.key, w); S.save(); renderReview(view); }));
      ctr.appendChild(btn('🔁 待复习', 'sm', function () { var e = s.eb[it.key] || { stage: 0, wrong: 0, next: 0 }; e.next = dayOffset(1); s.eb[it.key] = e; S.save(); renderReview(view); }));
      ctr.appendChild(btn('⭐ 归档', 'sm', function () { addFamiliar(it.key, w); S.save(); renderReview(view); }));
      card.appendChild(ctr);
      view.appendChild(card);
    });
  }

  /* ---- 错题本 ---- */
  function renderWrong(view) {
    var s = S.get(); var ws = s.wrong || [];
    view.appendChild(sep('———— 错题本 ————'));
    view.appendChild(btn('🎯 开始专项背诵', 'pri mb8', function () { startWrongDrill(view); }));
    if (!ws.length) { view.appendChild(empty('错题本为空。答错的词会自动收集到这里，重点突破顽固词。')); return; }
    ws.forEach(function (w) {
      var card = el('div', { class: 'card', style: 'padding:10px' });
      card.appendChild(el('div', { style: 'font-weight:600' }, esc(w.word)));
      if (w.mean) card.appendChild(el('div', { class: 'small muted' }, esc(w.mean)));
      var ctr = el('div', { class: 'row', style: 'gap:6px;margin-top:6px' });
      ctr.appendChild(btn('🔊', 'sm', function () { U.speak(w.word, s.wordAccent, 1); }));
      ctr.appendChild(btn('已掌握', 'pri sm', function () { addFamiliar(w.key, w); S.save(); renderWrong(view); }));
      ctr.appendChild(btn('移出错题本', 'sm dan', function () { s.wrong = s.wrong.filter(function (x) { return x.key !== w.key; }); S.save(); renderWrong(view); }));
      card.appendChild(ctr);
      view.appendChild(card);
    });
  }

  /* ---- 错题本专项背诵 ---- */
  function startWrongDrill(view) {
    var s = S.get(); var queue = (s.wrong || []).slice();
    if (!queue.length) { U.toast('错题本为空'); return; }
    var host = el('div'); view.innerHTML = ''; view.appendChild(host);
    var pos = 0, repeat = [];
    function back() { curTab = 'wrong'; render(view); }
    function done() {
      host.innerHTML = '';
      host.appendChild(el('div', { class: 'card', style: 'padding:14px;text-align:center' },
        '🎯 专项背诵完成！错题本还剩 ' + ((S.get().wrong) || []).length + ' 个'));
      host.appendChild(btn('返回错题本', 'pri sm', back));
    }
    function next() {
      if (pos < queue.length) return show(queue[pos]);
      if (repeat.length) { queue = repeat.slice(); repeat = []; pos = 0; return show(queue[pos]); }
      done();
    }
    function show(w) {
      host.innerHTML = '';
      var card = el('div', { class: 'card', style: 'padding:12px' });
      card.appendChild(el('div', { style: 'font-size:22px;font-weight:700;margin:6px 0' }, esc(w.word)));
      var phr = phRow(w); if (phr) card.appendChild(phr);
      if (w.mean) card.appendChild(el('div', { class: 'small', style: 'margin-bottom:4px' }, '释义：' + esc(w.mean)));
      var sp = el('div', { class: 'row', style: 'gap:6px;margin:6px 0' });
      sp.appendChild(btn('🔊 美式', 'sm', function () { U.speak(w.word, 'en-US', 1); }));
      sp.appendChild(btn('🔊 英式', 'sm', function () { U.speak(w.word, 'en-GB', 1); }));
      card.appendChild(sp);
      var big = el('div', { class: 'ws-big' });
      big.appendChild(btn('✅ 记得', 'pri', function () { removeWrong(w); pos++; next(); }));
      big.appendChild(btn('❌ 不记得', 'dan', function () { U.speak(w.word, S.get().wordAccent, 1); if (repeat.indexOf(w) < 0) repeat.push(w); pos++; next(); }));
      card.appendChild(big);
      var sub = el('div', { class: 'ws-sub' });
      sub.appendChild(btn('⭐ 已掌握', 'sm', function () { addFamiliar(w.key, w); removeWrong(w); pos++; next(); }));
      card.appendChild(sub);
      host.appendChild(card);
    }
    function removeWrong(w) { var s2 = S.get(); s2.wrong = (s2.wrong || []).filter(function (x) { return x.key !== w.key; }); S.save(); }
    next();
  }
  /* ---- 熟词库 ---- */
  function renderFam(view) {
    var s = S.get(); var ws = s.familiar || [];
    view.appendChild(sep('———— 熟词库 ————'));
    if (!ws.length) { view.appendChild(empty('熟词库为空。在卡片上点「熟记归档」的单词会进这里，不再重复弹出。')); return; }
    ws.forEach(function (w) {
      var card = el('div', { class: 'card', style: 'padding:10px' });
      card.appendChild(el('div', { style: 'font-weight:600' }, esc(w.word)));
      if (w.mean) card.appendChild(el('div', { class: 'small muted' }, esc(w.mean)));
      var ctr = el('div', { class: 'row', style: 'gap:6px;margin-top:6px' });
      ctr.appendChild(btn('🔊', 'sm', function () { U.speak(w.word, s.wordAccent, 1); }));
      ctr.appendChild(btn('移出熟词库', 'sm dan', function () { s.familiar = s.familiar.filter(function (x) { return x.key !== w.key; }); S.save(); renderFam(view); }));
      card.appendChild(ctr);
      view.appendChild(card);
    });
  }

  /* ---- 导出 / 恢复（仅背单词数据，防丢）---- */
  function exportWords() {
    var s = S.get();
    var data = {
      v: 1, app: 'workbench-wordstudy',
      wordGroups: s.wordGroups || [], wordPlan: s.wordPlan || {}, eb: s.eb || {},
      familiar: s.familiar || [], wrong: s.wrong || [],
      wordGoal: s.wordGoal, wordMode: s.wordMode, wordAccent: s.wordAccent,
      wordDone: s.wordDone || {}, wordShuffle: !!s.wordShuffle,
      listenShowWord: !!s.listenShowWord, listenShowMean: !!s.listenShowMean, listenShowPh: !!s.listenShowPh,
      wordSeqCursor: s.wordSeqCursor || {}, aiPassage: s.aiPassage || '', aiPassageLen: s.aiPassageLen || 200
    };
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var link = el('a', { href: URL.createObjectURL(blob), download: 'wordstudy-' + U.today() + '.json' });
      document.body.appendChild(link); link.click(); link.remove();
      U.toast('已导出背单词备份');
    } catch (e) { U.toast('导出失败：' + (e && e.message || '')); }
  }
  function importWords() {
    if (!U.pickFile) { U.toast('当前环境不支持选择文档'); return; }
    U.pickFile('application/json').then(function (f) {
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var o = JSON.parse(fr.result);
          if (!o || !(o.wordGroups || o.wordDocs)) throw 0;
          var s = S.get();
          s.wordGroups = o.wordGroups || o.wordDocs || [];
          s.wordPlan = o.wordPlan || {};
          s.eb = o.eb || {};
          s.familiar = o.familiar || [];
          s.wrong = o.wrong || [];
          if (o.wordGoal) s.wordGoal = o.wordGoal;
          if (o.wordMode) s.wordMode = o.wordMode;
          if (o.wordAccent) s.wordAccent = o.wordAccent;
          if (o.wordDone) s.wordDone = o.wordDone || {};
          if (typeof o.wordShuffle === 'boolean') s.wordShuffle = o.wordShuffle;
          if (typeof o.listenShowWord === 'boolean') s.listenShowWord = o.listenShowWord;
          if (typeof o.listenShowMean === 'boolean') s.listenShowMean = o.listenShowMean;
          if (typeof o.listenShowPh === 'boolean') s.listenShowPh = o.listenShowPh;
          if (o.wordSeqCursor) s.wordSeqCursor = o.wordSeqCursor;
          if (o.aiPassageLen) s.aiPassageLen = o.aiPassageLen;
          if (o.aiPassage) s.aiPassage = o.aiPassage;
          S.save(); render(VIEW); U.toast('已恢复背单词备份');
        } catch (e) { U.toast('备份文件格式不正确'); }
      };
      fr.readAsText(f);
    }).catch(function () { U.toast('选择文档失败'); });
  }
  /* ---- 一键导入内置考研词书 ---- */
  function importKY() {
    if (!(window.W && W.KY && W.KY.list)) { U.toast('内置考研词书未加载'); return; }
    var s = S.get();
    var name = '考研核心词（内置）';
    var g = (s.wordGroups || []).filter(function (x) { return x.name === name; })[0];
    if (!g) { g = { id: U.uid(), name: name, cat: '考研单词', words: [] }; s.wordGroups.push(g); }
    var have = {}; (g.words || []).forEach(function (w) { have[w.word] = 1; });
    var added = 0;
    W.KY.list.forEach(function (d) {
      var word = String(d.w || '').toLowerCase().replace(/[^a-z'-]/g, '');
      if (!word || have[word]) return;
      g.words.push({ word: word, ph: d.ph || '', mean: d.mean || '', ex: (d.ex && d.ex[0]) || '' });
      have[word] = 1; added++;
    });
    S.save();
    U.toast('考研词书已导入：新增 ' + added + ' 词（共 ' + g.words.length + '）');
    renderDocs(VIEW);
  }

  /* ---- AI 配套短文生成（直连大模型，兼容 OpenAI 接口）---- */
  function openAISettings(view) {
    var s = S.get(); if (!s.cfg) s.cfg = {}; var c = s.cfg;
    U.modal({ title: '配置 AI 生成短文', fields: [
      { key: 'api', label: 'API 地址(baseURL，不含 /chat/completions)', value: c.aiApi || 'https://api.deepseek.com/v1', ph: 'DeepSeek: https://api.deepseek.com/v1' },
      { key: 'key', label: 'API Key', value: c.aiKey || '', ph: 'sk-...', type: 'password' },
      { key: 'model', label: '模型名', value: c.aiModel || 'deepseek-chat', ph: 'deepseek-chat / gpt-4o-mini' }
    ], okText: '保存' }).then(function (r) {
      if (r) { c.aiApi = (r.api || '').trim(); c.aiKey = (r.key || '').trim(); c.aiModel = (r.model || '').trim(); S.save(); U.toast('AI 配置已保存'); }
    });
  }
  function genPassage(view) {
    var s = S.get();
    var plan = s.wordPlan[today()] || [];
    if (!plan.length) { U.toast('今天还没有背诵计划，先去「词库」选词或顺序续背'); return; }
    var words = []; var have = {};
    plan.forEach(function (w) { if (!have[w.word]) { have[w.word] = 1; words.push(w.word); } });
    var base = (s.cfg && s.cfg.aiApi) || '', key = (s.cfg && s.cfg.aiKey) || '', model = (s.cfg && s.cfg.aiModel) || '';
    if (!base || !key || !model) { openAISettings(view); U.toast('请先配置 AI（服务商/Key/模型）'); return; }
    U.modal({ title: '生成配套英文短文', fields: [{ key: 'len', label: '短文字数（英文词数，默认 200）', value: s.aiPassageLen || 200, type: 'number' }], okText: '生成' })
      .then(function (r) {
        if (!r) return;
        var n = Math.max(50, parseInt(r.len, 10) || 200); s.aiPassageLen = n; S.save();
        doGen(words, n, base, key, model, view);
      });
  }
  function doGen(words, n, base, key, model, view) {
    var prompt = '请用以下英语单词写一段自然、连贯、适合英语学习的英文短文，总长度约 ' + n + ' 个英文单词。要求：1) 必须包含并自然使用这些单词（可用时态/单复数变形）：' + words.join(', ') + '；2) 主题积极、易懂，适合中国英语学习者；3) 只输出英文短文本身，不要解释、不要列表、不要中文、不要 Markdown。';
    var url = base.replace(/\/$/, '') + '/chat/completions';
    U.toast('正在生成短文（含 ' + words.length + ' 个生词）…');
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model: model, messages: [{ role: 'system', content: 'You are a helpful English writing assistant for Chinese English learners.' }, { role: 'user', content: prompt }], temperature: 0.8, max_tokens: Math.min(2000, n * 8) }) })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error('HTTP ' + r.status + ' · ' + t.slice(0, 200)); }); return r.json(); })
      .then(function (j) { var txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content; if (!txt) throw new Error('模型返回为空'); showPassage(txt.trim(), words.length, view); })
      .catch(function (e) { U.toast('生成失败：' + (e && e.message || e) + '（检查 Key/模型，或该服务商是否支持浏览器跨域）'); });
  }
  function showPassage(txt, cnt, view) {
    var s = S.get(); s.aiPassage = txt; S.save();
    var host = el('div'); view.innerHTML = ''; view.appendChild(host);
    var card = el('div', { class: 'card', style: 'padding:14px' });
    card.appendChild(el('div', { style: 'font-weight:700;margin-bottom:8px' }, '✨ 今日配套英文短文（含 ' + cnt + ' 个生词）'));
    if (s.aiPassageLen) card.appendChild(el('div', { class: 'small muted', style: 'margin-bottom:8px' }, '目标词数 ' + s.aiPassageLen));
    var p = el('div', { class: 'ws-passage', style: 'line-height:1.8;white-space:pre-wrap;font-size:15px' }, esc(txt));
    card.appendChild(p);
    var ctr = el('div', { class: 'row', style: 'gap:8px;margin-top:10px;flex-wrap:wrap' });
    ctr.appendChild(btn('🔊 朗读全文', 'pri sm', function () { U.speak(txt, s.wordAccent, 1); }));
    ctr.appendChild(btn('📋 复制', 'sm', function () { try { navigator.clipboard.writeText(txt); U.toast('已复制'); } catch (e) { U.toast('复制失败'); } }));
    ctr.appendChild(btn('↩ 返回背诵', 'sm', function () { curTab = 'study'; render(view); }));
    card.appendChild(ctr);
    host.appendChild(card);
  }
  /* 对外暴露：供「英语·背英语单词」整页嵌入（统一入口） */
  W.WordStudy = { render: render, init: init };
  W.P.wordstudy = function (view) { render(view); };
})();
