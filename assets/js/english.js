/* ===== 英语板块：背单词 / 口语 / 阅读 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;

  function st() { var s = S.get(); if (!s.articles) s.articles = []; if (!s.speakLog) s.speakLog = {}; return s; }

  /* ===== 文档词库：PDF / Word / txt 解析（pdf.js / mammoth 按需联网加载） ===== */
  var _libCache = {};
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = src; sc.onload = function () { res(); };
      sc.onerror = function () { rej(new Error('解析库加载失败（需联网）：' + src)); };
      document.head.appendChild(sc);
    });
  }
  function getPdf() {
    if (_libCache.pdf) return Promise.resolve(_libCache.pdf);
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(function () {
      _libCache.pdf = window.pdfjsLib;
      _libCache.pdf.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      return _libCache.pdf;
    });
  }
  function getMammoth() {
    if (_libCache.mammoth) return Promise.resolve(_libCache.mammoth);
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js').then(function () {
      _libCache.mammoth = window.mammoth; return _libCache.mammoth;
    });
  }
  function readFileText(file) {
    return new Promise(function (res, rej) {
      if (file.text) { file.text().then(res).catch(rej); return; }
      var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = function () { rej(fr.error || new Error('read fail')); }; fr.readAsText(file);
    });
  }
  /* 通用「单词 释义」文本解析：仅保留含中文释义的条目，过滤普通英文句子 */
  function parseDocText(text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var w = '', p = '', m = '';
      if (line.indexOf('|') > 0) { var a = line.split('|'); w = a[0].trim(); p = (a[1] || '').trim(); m = (a[2] || '').trim(); }
      else if (line.indexOf('\t') > 0) { var b = line.split('\t'); w = b[0].trim(); p = (b[1] || '').trim(); m = b.slice(2).join(' ').trim(); }
      else if (line.indexOf(',') > 0) { var c = line.split(','); w = c[0].trim(); m = c.slice(1).join(',').trim(); }
      else { var i = line.search(/[\s\u4e00-\u9fa5]/); if (i < 0) { w = line; } else { w = line.slice(0, i).trim(); m = line.slice(i).trim(); } }
      w = w.replace(/^[0-9]+[.、)]\s*/, '');
      if (!w) return;
      if (!/[\u4e00-\u9fa5]/.test(m)) return;
      out.push({ word: w, ph: p, mean: m });
    });
    return out;
  }
  function parsePdfFile(file) {
    return getPdf().then(function (pdfjs) {
      return file.arrayBuffer().then(function (buf) { return pdfjs.getDocument({ data: buf }).promise; })
        .then(function (pdf) {
          var parts = [];
          function next(i) {
            if (i >= pdf.numPages) return Promise.resolve(parts.join('\n'));
            return pdf.getPage(i + 1).then(function (page) {
              return page.getTextContent().then(function (tc) {
                parts.push(tc.items.map(function (it) { return it.str; }).join(' ')); return next(i + 1);
              });
            });
          }
          return next(0);
        }).then(parseDocText);
    });
  }
  function parseDocxFile(file) {
    return getMammoth().then(function (m) {
      return file.arrayBuffer().then(function (buf) { return m.extractRawText({ arrayBuffer: buf }); });
    }).then(function (r) { return parseDocText(r.value); });
  }

  /* ============ 一、背单词 ============ */
  function words(mount) {
    var s = st();
    var date = mount.__date || U.today();
    var hideSpell = false, hideMean = false;
    function list() { if (!s.words[date]) s.words[date] = []; return s.words[date]; }
    function draw() {
      mount.innerHTML = '';
      /* 日期条 */
      var bar = el('div', { class: 'row mb8' });
      var p = C.btn('‹', 'sm', function () { date = U.addDay(date, -1); mount.__date = date; draw(); });
      var d = el('div', { class: 'grow', style: 'text-align:center;font-weight:650' }, date + ' 周' + U.cnWeek(date));
      var n = C.btn('›', 'sm', function () { date = U.addDay(date, 1); mount.__date = date; draw(); });
      bar.appendChild(p); bar.appendChild(d); bar.appendChild(n);
      mount.appendChild(bar);

      var L = list();
      mount.appendChild(C.statRow([
        { value: L.length, label: '今日单词' },
        { value: L.filter(function (w) { return w.mastered; }).length, label: '已掌握', color: '#2fbf87' },
        { value: s.wordBook.length, label: '生词本', color: '#5b6cff' }
      ]));

      /* 操作条 */
      var ops = el('div', { class: 'wrap mb8' });
      ops.appendChild(C.btn('📥 欧路同步', 'sm', function () { syncEudic(date, draw); }));
      ops.appendChild(C.btn('✍️ 单个录入', 'sm', function () { addOne(date, draw); }));
      ops.appendChild(C.btn('📋 批量粘贴', 'sm', function () { addBatch(date, draw); }));
      ops.appendChild(C.btn('📄 从文档导入', 'sm', function () { addFile(date, draw); }));
      ops.appendChild(C.btn(hideSpell ? '👁 显示拼写' : '🙈 隐藏拼写', 'sm', function () { hideSpell = !hideSpell; draw(); }));
      ops.appendChild(C.btn(hideMean ? '👁 显示释义' : '🙈 隐藏释义', 'sm', function () { hideMean = !hideMean; draw(); }));
      ops.appendChild(C.btn('🎲 随机抽取', 'sm', function () { randomWordQuiz(L); }));
      mount.appendChild(ops);

      /* 文档词库（自定义添加 / 移除文档） */
      mount.appendChild(docPanel());

      /* 卡片 */
      if (!L.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔤</span>今天还没有单词，点上方按钮添加'));
      var g = el('div', { class: 'wc-grid' });
      L.slice().sort(function (a, b) { return (a.mastered ? 1 : 0) - (b.mastered ? 1 : 0); }).forEach(function (w) {
        g.appendChild(wordCard(w, date, draw, hideSpell, hideMean));
      });
      mount.appendChild(g);

      /* 短文 */
      mount.appendChild(C.subTitle('每日 200 词短文（由当日单词生成）'));
      mount.appendChild(essayBox(date, L));

      /* 打卡 */
      mount.appendChild(C.subTitle('背单词周打卡'));
      mount.appendChild(C.weekcheck('en_word', { title: '背单词打卡' }));

      /* 素材库 */
      mount.appendChild(C.subTitle('单词素材库（按日期/题材归档）'));
      mount.appendChild(C.tree('en_wordlib'));

      /* 合并：原独立「背单词」模块（词框分组 / 今日背诵 / 艾宾浩斯复习 / 错题本 / 熟词库 / AI 配套短文 / 备份恢复）统一并入英语·背英语单词 */
      if (W.WordStudy) {
        var wsHost = el('div', { style: 'margin-top:14px;border-top:1px dashed #ddd;padding-top:10px' });
        mount.appendChild(wsHost);
        W.WordStudy.render(wsHost);
      }
    }
    function wordCard(w, date, redraw, hideSpell, hideMean) {
      var spellOn = !(hideSpell || w.hideSpell);
      var meanOn = !(hideMean || w.hideMean);
      var c = el('div', { class: 'wc' + (w.mastered ? ' master' : '') });

      /* 拼写区：点击隐藏 / 显示英文拼写与音标 */
      var spell = el('div', { class: 'wc-spell' });
      if (spellOn) {
        spell.appendChild(el('div', { class: 'w' }, esc(w.word)));
        var ky0 = W.KY && W.KY.lookup(w.word);
        var ph0 = ky0 ? ky0.ph : w.ph;
        if (ph0) {
          var phEl0 = el('div', { class: 'ph', style: 'cursor:pointer' }, esc(ph0));
          phEl0.title = '点击发音';
          phEl0.onclick = function (e) { e.stopPropagation(); U.speak(w.word, 'en-US'); };
          spell.appendChild(phEl0);
        }
      } else {
        spell.appendChild(el('div', { class: 'masked' }, '🔒 点击显示拼写'));
      }
      spell.onclick = function () { w.hideSpell = !w.hideSpell; S.save(); redraw(); };
      c.appendChild(spell);

      /* 释义区：点击隐藏 / 显示中文释义与例句 */
      var mean = el('div', { class: 'wc-mean' });
      if (meanOn) {
        var ky = W.KY && W.KY.lookup(w.word);
        mean.appendChild(el('div', { class: 'mn' }, esc((ky ? ky.mean : (w.mean || '（无释义）')))));
        if (ky && ky.phrases && ky.phrases.length) {
          mean.appendChild(el('div', { class: 'phr-h' }, '常用短语（考研真题）'));
          ky.phrases.forEach(function (p) { mean.appendChild(el('div', { class: 'phr' }, '· ' + esc(p))); });
        }
        if (ky && ky.ex && ky.ex.length) {
          mean.appendChild(el('div', { class: 'phr-h' }, '历年真题例句（点句中生词可查义 / 收藏）'));
          ky.ex.forEach(function (sent) { mean.appendChild(exBlock(sent, w.word)); });
        } else if (w.ex) {
          mean.appendChild(el('div', { class: 'phr-h' }, '例句'));
          mean.appendChild(exBlock(w.ex, w.word));
        }
      } else {
        mean.appendChild(el('div', { class: 'masked' }, '👁 点击显示释义'));
      }
      mean.onclick = function () { w.hideMean = !w.hideMean; S.save(); redraw(); };
      c.appendChild(mean);

      var ops = el('div', { class: 'ops' });
      ops.appendChild(C.btn('🔊', 'sm', function () { U.speak(w.word, 'en-US'); }));
      ops.appendChild(C.btn(w.mastered ? '✓' : '○', 'sm', function () { w.mastered = !w.mastered; S.save(); redraw(); }));
      ops.appendChild(C.btn('⭐', 'sm', function () {
        if (s.wordBook.some(function (x) { return x.word === w.word; })) { U.toast('已在生词本'); return; }
        s.wordBook.push({ id: U.uid(), word: w.word, ph: w.ph, mean: w.mean, ex: w.ex, ts: Date.now() }); S.save(); U.toast('已加入生词本'); redraw();
      }));
      ops.appendChild(C.btn('⋯', 'sm', function () {
        U.sheet(w.word, [
          { v: 'spell', text: '拼写自测', icon: '⌨️' },
          { v: 'dict', text: '✍️ 听音拼写', icon: '🎧' },
          { v: 'slow', text: '慢速朗读', icon: '🐢' },
          { v: 'edit', text: '编辑单词', icon: '✏️' },
          { v: 'copy', text: '导出摘抄', icon: '📋' },
          { v: 'del', text: '移出当日清单', icon: '🗑️' }
        ]).then(function (a) {
          if (a === 'spell') U.modal({ title: '拼写自测', html: '<div class="small muted mb8">释义：' + esc(w.word || '') + '</div>', fields: [{ key: 'v', label: '请写出英文单词' }] })
            .then(function (r) {
              if (!r) return;
              if (r.v.toLowerCase().trim() === (w.word || '').toLowerCase().trim()) { U.toast('✅ 正确！'); w.mastered = true; }
              else { U.toast('❌ 正确答案：' + w.word); w.mastered = false; }
              S.save(); redraw();
            });
          else if (a === 'dict') {
            var so = S.get(); so.open = so.open || {}; so.open['en_dict'] = true; S.save();
            if (window.W && W.go) W.go('english');
          }
          else if (a === 'slow') U.speak(w.word, 'en-US', 0.6);
          else if (a === 'edit') U.modal({
            title: '编辑单词', fields: [{ key: 'w', label: '单词', value: w.word }, { key: 'p', label: '音标', value: w.ph || '' }, { key: 'm', label: '释义/词性', value: w.mean || '' }, { key: 'e', label: '例句', type: 'textarea', value: w.ex || '' }]
          }).then(function (v) { if (v) { w.word = v.w; w.ph = v.p; w.mean = v.m; w.ex = v.e; S.save(); redraw(); } });
          else if (a === 'copy') U.copy(w.word + ' ' + (w.ph || '') + ' ' + (w.mean || '') + (w.ex ? '\n' + w.ex : ''));
          else if (a === 'del') { s.words[date] = s.words[date].filter(function (x) { return x.id !== w.id; }); S.save(); redraw(); }
        });
      }));
      c.appendChild(ops);
      return c;
    }
    function addOne(date, cb) {
      U.modal({
        title: '录入单词', fields: [
          { key: 'w', label: '英文单词' }, { key: 'p', label: '音标（可空）' },
          { key: 'm', label: '中文释义 / 词性' }, { key: 'e', label: '例句（可空）', type: 'textarea' },
          { key: 's', label: '来源', type: 'select', value: '手动录入', options: [{ v: '手动录入', t: '手动录入' }, { v: '英语阅读', t: '英语阅读手动录入' }, { v: '欧路同步', t: '欧路同步' }] }
        ]
      }).then(function (v) {
        if (!v) return;
        if (!s.words[date]) s.words[date] = [];
        s.words[date].push({ id: U.uid(), word: v.w, ph: v.p, mean: v.m, ex: v.e, src: v.s });
        S.save(); cb(); U.toast('已加入 ' + date);
      });
    }
    function parseWords(text) {
      var out = [];
      String(text || '').split(/\r?\n/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        var w = '', p = '', m = '';
        if (line.indexOf('|') > 0) { var a = line.split('|'); w = a[0].trim(); p = (a[1] || '').trim(); m = (a[2] || '').trim(); }
        else if (line.indexOf('\t') > 0) { var b = line.split('\t'); w = b[0].trim(); p = (b[1] || '').trim(); m = b.slice(2).join(' ').trim(); }
        else if (line.indexOf(',') > 0) { var c = line.split(','); w = c[0].trim(); m = c.slice(1).join(',').trim(); }
        else { var i = line.search(/[\s\u4e00-\u9fa5]/); if (i < 0) { w = line; } else { w = line.slice(0, i).trim(); m = line.slice(i).trim(); } }
        w = w.replace(/^[0-9]+[.、)]\s*/, ''); // 去掉行首序号 "1. "
        if (!w) return;
        out.push({ word: w, ph: p, mean: m });
      });
      return out;
    }
    function addBatch(date, cb) {
      U.modal({
        title: '批量粘贴单词', html: '<div class="small muted mb8">每行一个，支持「单词 释义」「单词|音标|释义」「单词\\t音标\\t释义」（CSV 用逗号分隔也可）</div>',
        fields: [{ key: 't', label: '粘贴内容', type: 'textarea', rows: 8, ph: 'ambiguous 模糊的\nresilient|rɪˈzɪliənt|有韧性的' }]
      }).then(function (v) {
        if (!v) return;
        if (!s.words[date]) s.words[date] = [];
        var n = 0;
        parseWords(v.t).forEach(function (x) { s.words[date].push({ id: U.uid(), word: x.word, ph: x.ph, mean: x.mean, src: '批量导入' }); n++; });
        S.save(); cb(); U.toast('导入 ' + n + ' 个单词');
      });
    }
    function addFile(date, cb) {
      U.pickFile('.txt,.csv,text/plain,text/csv').then(function (file) {
        if (!file) return;
        var fr = new FileReader();
        fr.onload = function () {
          if (!s.words[date]) s.words[date] = [];
          var n = 0;
          parseWords(fr.result || '').forEach(function (x) { s.words[date].push({ id: U.uid(), word: x.word, ph: x.ph, mean: x.mean, src: '文件导入' }); n++; });
          S.save(); cb(); U.toast('从文件导入 ' + n + ' 个单词');
        };
        fr.onerror = function () { U.toast('文件读取失败'); };
        fr.readAsText(file);
      });
    }
    /* 文档词库：仿「词框分组与复习计划」的大卡片 + 统计 + 标签页 + 快捷按钮布局 */
    function docStat(label, value, color) {
      var d = el('div', { style: 'text-align:center;min-width:64px' });
      d.appendChild(el('div', { style: 'font-size:18px;font-weight:700;color:' + (color || 'var(--tx1)') }, String(value)));
      d.appendChild(el('div', { style: 'font-size:11px;color:var(--tx3);margin-top:2px' }, label));
      return d;
    }
    function docSep(text) { return el('div', { style: 'text-align:center;color:var(--tx3);font-size:12px;margin:10px 0' }, text); }
    function docPanel() {
      var wrap = el('div');
      var docs = s.wordDocs || [];
      var todayWords = s.words[date] || [];
      var totalWords = docs.reduce(function (a, d) { return a + (d.words || []).length; }, 0);
      var importedToday = todayWords.filter(function (w) { return w.doc; }).length;
      var masteredToday = todayWords.filter(function (w) { return w.mastered; }).length;

      /* 标题 + 统计 */
      var head = el('div', { class: 'card', style: 'padding:12px;margin-bottom:10px' });
      head.appendChild(el('div', { style: 'font-size:15px;font-weight:700;margin-bottom:8px' }, '📚 文档词库（自定义添加 / 移除文档）'));
      var ov = el('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap' });
      ov.appendChild(docStat('文档数', docs.length));
      ov.appendChild(docStat('总词数', totalWords));
      ov.appendChild(docStat('今日已导入', importedToday, '#2fbf87'));
      ov.appendChild(docStat('已掌握', masteredToday, '#5b6cff'));
      head.appendChild(ov);
      wrap.appendChild(head);

      /* 快捷操作 */
      var ops = el('div', { class: 'row mb8', style: 'gap:8px;flex-wrap:wrap' });
      ops.appendChild(C.btn('➕ 添加文档', 'pri sm', addDocFromFile));
      ops.appendChild(C.btn('✚ 新建空白文档', 'sm', newDocManual));
      ops.appendChild(C.btn('📋 批量粘贴', 'sm', batchCreateDoc));
      ops.appendChild(C.btn('🗑 清空', 'sm dan', clearDocs));
      wrap.appendChild(ops);

      /* 标签页 */
      var tabs = [['list', '文档列表'], ['today', '今日导入'], ['mastered', '已掌握']];
      var curTab = W.__docTab || 'list';
      var bar = el('div', { class: 'row mb8', style: 'flex-wrap:wrap;gap:6px' });
      tabs.forEach(function (t) {
        bar.appendChild(C.btn(t[1], curTab === t[0] ? 'pri sm' : 'sm', function () { W.__docTab = t[0]; draw(); }));
      });
      wrap.appendChild(bar);

      /* 内容 */
      if (curTab === 'list') {
        if (!docs.length) { wrap.appendChild(el('div', { class: 'empty' }, '<span class="ei">📄</span>还没有文档，点「添加文档」导入 PDF / Word / txt')); return wrap; }
        wrap.appendChild(docSep('———— 我的文档 ————'));
        docs.forEach(function (d) { wrap.appendChild(docCard(d)); });
      } else if (curTab === 'today') {
        wrap.appendChild(docSep('———— 今日从文档导入 ————'));
        var imported = todayWords.filter(function (w) { return w.doc; });
        if (!imported.length) wrap.appendChild(el('div', { class: 'empty' }, '今天还没有从文档导入单词'));
        else wrap.appendChild(wordMiniList(imported));
      } else if (curTab === 'mastered') {
        wrap.appendChild(docSep('———— 今日已掌握 ————'));
        var mastered = todayWords.filter(function (w) { return w.mastered; });
        if (!mastered.length) wrap.appendChild(el('div', { class: 'empty' }, '今天还没有掌握单词'));
        else wrap.appendChild(wordMiniList(mastered));
      }
      return wrap;
    }
    function docCard(d) {
      var card = el('div', { class: 'card', style: 'padding:10px;margin-bottom:8px' });
      var h = el('div', { class: 'row', style: 'justify-content:space-between;align-items:center;margin-bottom:6px' });
      h.appendChild(el('div', { style: 'font-weight:600' }, esc(d.name) + '  <span class="small muted">(' + (d.words || []).length + ' 词 · ' + (d.type || 'txt').toUpperCase() + ')</span>'));
      card.appendChild(h);
      var ops = el('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' });
      ops.appendChild(C.btn('📥 导入今日', 'pri sm', function () {
        var cnt = d.words ? d.words.length : 0;
        if (cnt > 200 && !confirm('该文档有 ' + cnt + ' 个单词，确认全部加入「' + date + '」？')) return;
        var n = S.importDocWords(d.id, date); U.toast('已导入 ' + n + ' 个单词到 ' + date); draw();
      }));
      ops.appendChild(C.btn('👁 查看', 'sm', function () { viewDocWords(d); }));
      if (d.removable !== false) {
        ops.appendChild(C.btn('✏ 加词', 'sm', function () { addWordsToDoc(d.id); }));
        ops.appendChild(C.btn('🗑 移除', 'sm dan', function () {
          U.confirm('移除文档「' + d.name + '」？其单词也会从当日清单移除（生词本保留）').then(function (y) { if (y) { S.removeDoc(d.id); U.toast('已移除文档'); draw(); } });
        }));
      }
      card.appendChild(ops);
      return card;
    }
    function batchCreateDoc() {
      U.modal({
        title: '批量粘贴新建文档',
        html: '<div class="small muted mb8">输入文档名称，然后粘贴单词。支持「单词 释义」「单词|音标|释义」「单词\\t音标\\t释义」</div>',
        fields: [{ key: 'name', label: '文档名称', ph: '如 考研核心词' }, { key: 't', label: '单词内容', type: 'textarea', rows: 8 }]
      }).then(function (v) {
        if (!v || !v.name || !v.t) return;
        var words = parseWords(v.t);
        if (!words.length) { U.toast('未识别到单词'); return; }
        S.addDoc({ id: U.uid(), name: v.name, type: 'manual', removable: true, words: words });
        U.toast('已新建文档：' + v.name + '（' + words.length + ' 词）'); draw();
      });
    }
    function clearDocs() {
      if (!s.wordDocs || !s.wordDocs.length) { U.toast('没有文档可清空'); return; }
      U.confirm('清空所有文档？文档中的单词不会进入生词本，仅删除文档记录。').then(function (y) {
        if (!y) return;
        s.wordDocs = []; S.save(); U.toast('已清空文档词库'); draw();
      });
    }
    function viewDocWords(d) {
      U.modal({ title: d.name + '（' + (d.words || []).length + ' 词）', html: '<div id="docViewHost" style="max-height:60vh;overflow:auto"></div>', hideCancel: true, okText: '关闭' });
      setTimeout(function () {
        var host = document.getElementById('docViewHost'); if (!host) return;
        host.innerHTML = '';
        (d.words || []).forEach(function (w) {
          host.appendChild(el('div', { style: 'padding:6px 0;border-bottom:1px solid var(--line)' }, '<b>' + esc(w.word) + '</b>' + (w.ph ? '  ' + esc(w.ph) : '') + (w.mean ? '  · ' + esc(w.mean) : '')));
        });
      }, 30);
    }
    function wordMiniList(words) {
      var host = el('div');
      words.forEach(function (w) {
        var row = el('div', { class: 'card', style: 'padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center' });
        var left = el('div');
        left.appendChild(el('div', { style: 'font-weight:600' }, esc(w.word)));
        if (w.ph || w.mean) left.appendChild(el('div', { class: 'small muted' }, esc((w.ph || '') + '  ' + (w.mean || ''))));
        row.appendChild(left);
        row.appendChild(C.btn('🔊', 'sm', function () { U.speak(w.word, 'en-US'); }));
        host.appendChild(row);
      });
      return host;
    }
    function addDocFromFile() {
      U.pickFile('.pdf,.doc,.docx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv')
        .then(function (file) {
          if (!file) return;
          var ext = (file.name.split('.').pop() || '').toLowerCase();
          U.toast('正在解析「' + file.name + '」…');
          var p;
          if (ext === 'txt' || ext === 'csv') p = readFileText(file).then(parseDocText);
          else if (ext === 'pdf') p = parsePdfFile(file);
          else if (ext === 'docx') p = parseDocxFile(file);
          else if (ext === 'doc') { U.toast('旧版 .doc 暂不支持，请另存为 .docx 或 .txt'); return; }
          else { U.toast('不支持的格式：' + ext); return; }
          p.then(function (words) {
            if (!words || !words.length) { U.toast('未识别到单词，请确认文档是「单词 释义」格式'); return; }
            S.addDoc({ id: U.uid(), name: file.name, type: ext, removable: true, words: words });
            U.toast('已添加文档：' + file.name + '（' + words.length + ' 词）'); draw();
          }).catch(function (e) { U.toast('解析失败：' + ((e && e.message) || e) + '（PDF / Word 需联网加载解析库）'); });
        });
    }
    function newDocManual() {
      U.prompt('新建文档', '文档名称').then(function (name) {
        if (!name) return;
        var doc = { id: U.uid(), name: name, type: 'manual', removable: true, words: [] };
        S.addDoc(doc); draw(); addWordsToDoc(doc.id);
      });
    }
    function addWordsToDoc(docId) {
      U.modal({
        title: '向文档添加单词', html: '<div class="small muted mb8">每行一个，支持「单词 释义」「单词|音标|释义」「单词\\t音标\\t释义」（CSV 逗号亦可）</div>',
        fields: [{ key: 't', label: '粘贴内容', type: 'textarea', rows: 8 }]
      }).then(function (v) {
        if (!v) return;
        var d = (s.wordDocs || []).filter(function (x) { return x.id === docId; })[0]; if (!d) return;
        var add = parseWords(v.t), n = 0;
        add.forEach(function (x) {
          if (d.words.some(function (e) { return e.word === x.word; })) return;
          d.words.push({ word: x.word, ph: x.ph, mean: x.mean }); n++;
        });
        S.save(); U.toast('文档新增 ' + n + ' 词'); draw();
      });
    }
    function randomWordQuiz(L) {
      var pool = L.length ? L : (function () { var a = []; for (var d in s.words) { (s.words[d] || []).forEach(function (w) { a.push(w); }); } return a; })();
      if (!pool.length) { U.toast('没有可抽取的单词'); return; }
      var w = pool[Math.floor(Math.random() * pool.length)];
      var show = false;
      var c = el('div', { class: 'draw-card' });
      var en = el('div', { class: 'dw' }, '❓');
      var ph = el('div', { class: 'dph' }, '');
      var mn = el('div', { class: 'dm' }, '点击显示');
      var tip = el('div', { class: 'small muted mt8' }, '来源：' + (w.src || w.doc || '单词本'));
      c.appendChild(en); c.appendChild(ph); c.appendChild(mn); c.appendChild(tip);

      var op = el('div', { class: 'wrap mt10', style: 'justify-content:center' });
      op.appendChild(C.btn('🔊 发音', 'sm', function () { U.speak(w.word, 'en-US'); }));
      var showBtn = C.btn('👁 显示', 'sm', function () {
        show = !show;
        en.textContent = show ? w.word : '❓';
        ph.textContent = show ? (w.ph || '') : '';
        mn.textContent = show ? (w.mean || '（无释义）') : '点击显示';
        showBtn.textContent = show ? '🙈 隐藏' : '👁 显示';
      });
      op.appendChild(showBtn);
      op.appendChild(C.btn('🔄 下一个', 'sm', function () { randomWordQuiz(L); }));
      c.appendChild(op);
      c.onclick = function (e) { if (e.target.closest('.btn')) return; showBtn.click(); };
      U.modal({ title: '随机抽词自测', html: '<div id="draw-root"></div>', hideCancel: true, okText: '关闭' });
      setTimeout(function () { var r = document.getElementById('draw-root'); if (r) { r.innerHTML = ''; r.appendChild(c); } }, 30);
    }

    function syncEudic(date, cb) {
      U.modal({
        title: '欧路词典同步',
        html: '<div class="small" style="line-height:1.7;color:#6b7285">网页端无法直接读取欧路 APP 本地生词本，可用以下方式：<br>1. 打开欧路生词本 → 全选复制 → 回来点「批量粘贴」<br>2. 或点下方按钮直接跳转欧路生词本页面</div>',
        okText: '打开欧路生词本'
      }).then(function (r) { if (r) U.open('https://my.eudic.net/studylist'); });
    }
    function essayBox(date, L) {
      var b = el('div');
      if (!s.essays[date]) s.essays[date] = { en: '', zh: '', fix: '' };
      var E = s.essays[date];
      var ops = el('div', { class: 'wrap mb8' });
      ops.appendChild(C.btn('✨ 生成短文', 'sm', function () {
        if (!L.length) { U.toast('先添加单词'); return; }
        E.en = genEssay(L); S.save(); draw();
      }));
      ops.appendChild(C.btn('🤖 用 AI 生成', 'sm', function () {
        W.Exam.aiAsk('请用下面这些单词写一篇约 200 词的英文短文（自然连贯、考研难度），并在文末列出所用单词：\n' + L.map(function (w) { return w.word; }).join(', '));
      }));
      ops.appendChild(C.btn('🔊 朗读', 'sm', function () { U.speak(E.en || '', 'en-US', 0.9); }));
      ops.appendChild(C.btn('🫘 豆包校对译文', 'sm', function () {
        W.Exam.aiAsk('请校对我的中译文，指出错译漏译并给出修改建议：\n【原文】\n' + (E.en || '') + '\n【我的译文】\n' + (E.zh || ''));
      }));
      b.appendChild(ops);
      var t1 = el('textarea', { class: 'ta', rows: 6, placeholder: '英文短文（可自动生成 / 手动粘贴）' }); t1.value = E.en;
      t1.oninput = U.debounce(function () { E.en = t1.value; S.save(); }, 400);
      b.appendChild(t1);
      var t2 = el('textarea', { class: 'ta mt6', rows: 4, placeholder: '我的中文译文…' }); t2.value = E.zh;
      t2.oninput = U.debounce(function () { E.zh = t2.value; S.save(); }, 400);
      b.appendChild(t2);
      var t3 = el('textarea', { class: 'ta mt6', rows: 3, placeholder: 'AI 校对结果 / 修改建议记录' }); t3.value = E.fix;
      t3.oninput = U.debounce(function () { E.fix = t3.value; S.save(); }, 400);
      b.appendChild(t3);
      return b;
    }
    function genEssay(L) {
      var ws = L.map(function (w) { return w.word; });
      var out = [], i = 0;
      var frames = [
        'Today I learned the word "%s", which reminds me that progress is built on daily repetition.',
        'When I met "%s" in an article, I realized how context shapes meaning far more than a dictionary line.',
        'Writing with "%s" forces me to slow down and think about precision.',
        'The word "%s" also appears frequently in academic reading, so it deserves a second review tonight.',
        'I tried to make a sentence with "%s" out loud, and the pronunciation practice made it stick.',
        'Reviewing "%s" tomorrow morning will move it from short-term to long-term memory.'
      ];
      out.push('Every morning I open my vocabulary list and read it aloud before anything else.');
      ws.forEach(function (w) { out.push(frames[i % frames.length].replace('%s', w)); i++; });
      out.push('Learning vocabulary is never about one perfect day; it is about showing up again tomorrow, and the day after that.');
      return out.join(' ');
    }
    draw();
  }

  /* ============ 二、英语口语练习 ============ */
  function speaking(mount) {
    var s = st();
    var date = U.today();
    var text = S.note('en_speak_text') || 'Practice makes perfect. The more you read aloud, the more natural your rhythm becomes.';
    var mode = S.note('en_speak_mode') || 'read'; // read / blind / shadow
    var speed = +(S.note('en_speak_speed') || 1);
    var idx = 0, playing = false, timer = null, recTimer = null;
    var ss = [];

    function splitSents(t) {
      // 支持「英文\n中文」双语段落；否则按句号分句
      var lines = t.replace(/\r/g, '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      var out = [];
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (/[\u4e00-\u9fa5]/.test(line)) {
          if (out.length && !out[out.length - 1].zh) { out[out.length - 1].zh = line; }
          else { out.push({ en: '', zh: line }); }
        } else {
          var parts = line.replace(/([.!?])\s+/g, '$1\u0001').split('\u0001').filter(Boolean);
          parts.forEach(function (p) { out.push({ en: p.trim(), zh: '' }); });
        }
      }
      return out.filter(function (x) { return x.en || x.zh; });
    }

    function draw() {
      mount.innerHTML = '';
      ss = splitSents(text);
      if (idx >= ss.length) idx = 0;

      var ta = el('textarea', { class: 'ta', rows: 3, placeholder: '练习文本：可粘贴英文文章；也可在每句后换行写中文翻译，实现双语跟读。' });
      ta.value = text;
      ta.oninput = U.debounce(function () { text = ta.value; S.note('en_speak_text', text); ss = splitSents(text); idx = 0; draw(); }, 400);
      mount.appendChild(ta);

      var ops = el('div', { class: 'wrap mt6' });
      ops.appendChild(C.btn('📥 从阅读导入', 'sm', function () {
        var arts = st().articles;
        if (!arts.length) { U.toast('英语阅读里还没有文章'); return; }
        U.sheet('选择文章', arts.slice(0, 8).map(function (a) { return { v: a.id, text: a.title, icon: '📄' }; })).then(function (id) {
          var a = arts.filter(function (x) { return x.id === id; })[0];
          if (a) { text = a.text.slice(0, 1200); S.note('en_speak_text', text); ss = splitSents(text); idx = 0; draw(); }
        });
      }));
      ops.appendChild(C.btn('🔊 全文朗读', 'sm', function () { U.speak(text.slice(0, 2000), 'en-US', speed); }));
      ops.appendChild(C.btn('🎤 朗读评测', 'sm', function () { fullScore(); }));
      mount.appendChild(ops);

      mount.appendChild(C.subTitle('句子列表（点击句子可定位）'));
      var list = el('div', { class: 'spk-sents' });
      ss.forEach(function (s2, i) {
        var r = el('div', { class: 'ss' + (i === idx ? ' on' : '') });
        r.appendChild(el('div', { class: 'num' }, (i + 1) + '/' + ss.length));
        var en = el('div', { class: 'en' + (mode === 'blind' && i === idx ? ' blur' : '') }, esc(s2.en || '（无英文）'));
        r.appendChild(en);
        if (s2.zh) r.appendChild(el('div', { class: 'zh' }, esc(s2.zh)));
        r.onclick = function () { idx = i; draw(); playCurrent(); };
        list.appendChild(r);
      });
      mount.appendChild(list);

      mount.appendChild(C.subTitle('口语练习录音'));
      mount.appendChild(recMini());
      mount.appendChild(C.subTitle('口语周打卡'));
      mount.appendChild(C.weekcheck('en_speak', { title: '口语练习打卡' }));
      mount.appendChild(C.subTitle('自定义口语任务'));
      mount.appendChild(C.tasklist('en_speak', { addText: '新增口语任务' }));

      /* 底部播放器 */
      var player = el('div', { class: 'spk-player' });
      var mrow = el('div', { class: 'spk-mode' });
      [['read', '🔊 朗读'], ['blind', '🙈 盲听'], ['shadow', '🎤 跟读']].forEach(function (m) {
        var b = el('button', { class: mode === m[0] ? 'on' : '' }, m[1]);
        b.onclick = function () { mode = m[0]; S.note('en_speak_mode', mode); draw(); };
        mrow.appendChild(b);
      });
      player.appendChild(mrow);

      var row = el('div', { class: 'spk-row' });
      var cur = ss[idx] || { en: '无句子' };
      row.appendChild(el('div', { class: 'spk-cur' }, (idx + 1) + '/' + ss.length + ' ' + (cur.en || '').slice(0, 26)));

      row.appendChild(makeBtn('⏪', 'spk-btn', function () { step(-1); }));
      var playBtn = makeBtn(playing ? '⏸' : '▶', 'spk-btn pri', function () { toggle(); });
      row.appendChild(playBtn);
      row.appendChild(makeBtn('⏩', 'spk-btn', function () { step(1); }));
      player.appendChild(row);

      var srow = el('div', { class: 'spk-row', style: 'justify-content:space-between' });
      var speeds = [0.5, 0.75, 1, 1.25, 1.5];
      var sg = el('div', { class: 'spk-speed' });
      speeds.forEach(function (r2) {
        var b = el('button', { class: Math.abs(speed - r2) < 0.01 ? 'on' : '' }, r2 + 'x');
        b.onclick = function () { speed = r2; S.note('en_speak_speed', r2); draw(); };
        sg.appendChild(b);
      });
      srow.appendChild(sg);
      srow.appendChild(el('div', { class: 'spk-score-mini' }, '语速 ' + speed + 'x'));
      player.appendChild(srow);
      mount.appendChild(player);

      function makeBtn(t, cl, fn) {
        var b = el('button', { class: cl }, t);
        b.onclick = fn; return b;
      }
      function toggle() {
        if (playing) { stopPlay(); }
        else { playCurrent(); }
      }
      function step(n) {
        stopPlay();
        idx = Math.max(0, Math.min(ss.length - 1, idx + n));
        draw(); playCurrent();
      }
      function playCurrent() {
        if (!ss.length) return;
        stopPlay();
        playing = true;
        var cur2 = ss[idx];
        if (!cur2 || !cur2.en) { playing = false; draw(); return; }
        U.speak(cur2.en, 'en-US', speed);
        var dur = Math.max(1200, cur2.en.length * 70 / speed);
        if (mode === 'shadow') {
          // 播放后录音
          timer = setTimeout(function () { startShadowRecord(); }, dur);
        } else {
          timer = setTimeout(function () {
            if (idx < ss.length - 1) { idx++; draw(); playCurrent(); }
            else { playing = false; draw(); }
          }, dur + 600);
        }
        draw();
      }
      function stopPlay() {
        playing = false;
        try { window.speechSynthesis.cancel(); } catch (e) { }
        clearTimeout(timer); clearTimeout(recTimer);
        try { if (shadowRec && shadowRec.state === 'recording') shadowRec.stop(); } catch (e) { }
      }
      function startShadowRecord() {
        if (!navigator.mediaDevices) { U.toast('当前环境不支持录音'); playing = false; draw(); return; }
        U.toast('🎤 请跟读…');
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          var rec = new MediaRecorder(stream);
          var chunks = [];
          rec.ondataavailable = function (e) { chunks.push(e.data); };
          rec.onstop = function () {
            var blob = new Blob(chunks, { type: 'audio/webm' });
            var fr = new FileReader();
            fr.onload = function () {
              var id = U.uid();
              U.Blobs.put(id, fr.result).then(function () {
                if (!s.speakLog[date]) s.speakLog[date] = [];
                s.speakLog[date].push({ id: U.uid(), blob: id, ts: Date.now(), text: (ss[idx] || {}).en || '' });
                S.save();
                // 回放
                U.modal({ title: '跟读回放', html: '<audio controls autoplay src="' + fr.result + '"></audio><div class="small muted mt8">原句：' + esc((ss[idx] || {}).en || '') + '</div>', hideCancel: true, okText: '关闭' });
                if (idx < ss.length - 1) { idx++; draw(); playCurrent(); }
                else { playing = false; draw(); }
              });
            };
            fr.readAsDataURL(blob);
            stream.getTracks().forEach(function (t) { t.stop(); });
          };
          shadowRec = rec; rec.start();
          recTimer = setTimeout(function () { try { rec.stop(); } catch (e) { } }, 3500);
        }).catch(function () { U.toast('无法录音，请检查麦克风权限'); playing = false; draw(); });
      }
    }

    var shadowRec = null;

    function recMini() {
      var box = el('div');
      var logs = (s.speakLog[date] || []);
      if (!logs.length) { box.appendChild(el('div', { class: 'small muted' }, '暂无跟读录音')); return box; }
      logs.slice().reverse().slice(0, 5).forEach(function (l) {
        var r = el('div', { class: 'it' });
        r.appendChild(el('div', { class: 'ii' }, '🎧'));
        r.appendChild(el('div', { class: 'itx' }, '<div class="itt">' + esc(l.text) + '</div><div class="its">' + new Date(l.ts).toLocaleTimeString('zh-CN') + '</div>'));
        r.appendChild(C.btn('播放', 'sm', function () {
          U.Blobs.get(l.blob).then(function (d) { if (d) U.modal({ title: '录音回放', html: '<audio controls autoplay src="' + d + '"></audio>', hideCancel: true, okText: '关闭' }); });
        }));
        box.appendChild(r);
      });
      return box;
    }

    function fullScore() {
      var r = U.SR('en-US');
      if (!r) { U.toast('当前环境不支持语音识别'); return; }
      var heard = '';
      var live = el('div', { class: 'small muted' }, '识别中…');
      U.modal({ title: '朗读评测', html: '<div class="small muted">请朗读当前文本，结束会自动评分</div><div id="spk-live" class="mt6 small"></div>', okText: '结束并评分', hideCancel: true })
        .then(function () { try { r.stop(); } catch (e) { } score(text, heard); });
      var liveBox = document.getElementById('spk-live');
      r.onresult = function (e) {
        heard = '';
        for (var i = 0; i < e.results.length; i++) heard += e.results[i][0].transcript + ' ';
        if (liveBox) liveBox.textContent = heard.slice(-120);
      };
      r.onerror = function () { if (liveBox) liveBox.textContent = '识别出错'; };
      r.onend = function () { score(text, heard); };
      r.start();
    }

    function score(src, heard) {
      var a = src.toLowerCase().replace(/[^a-z'\s]/g, ' ').split(/\s+/).filter(Boolean);
      var b = heard.toLowerCase().replace(/[^a-z'\s]/g, ' ').split(/\s+/).filter(Boolean);
      var used = {}, hit = 0;
      var marks = a.map(function (w) {
        var idx2 = -1;
        for (var i = 0; i < b.length; i++) { if (!used[i] && b[i] === w) { idx2 = i; break; } }
        if (idx2 >= 0) { used[idx2] = 1; hit++; return { w: w, s: 'ok' }; }
        var near = -1;
        for (var j = 0; j < b.length; j++) { if (!used[j] && sim(b[j], w) > .65) { near = j; break; } }
        if (near >= 0) { used[near] = 1; hit += 0.6; return { w: w, s: 'mid' }; }
        return { w: w, s: 'bad' };
      });
      var pct = a.length ? Math.round(hit / a.length * 100) : 0;
      var result = el('div');
      result.innerHTML = '<div style="font-weight:700">综合得分 ' + pct + ' / 100</div>';
      var wrap = el('div', { class: 'mt6' });
      marks.forEach(function (m) {
        var sp = el('span', { class: 'word-score' + (m.s === 'bad' ? ' bad' : m.s === 'mid' ? ' mid' : '') }, esc(m.w));
        sp.onclick = function () { U.speak(m.w, 'en-US', 0.7); };
        wrap.appendChild(sp);
      });
      result.appendChild(wrap);
      U.modal({ title: '评分结果', html: result.outerHTML, hideCancel: true, okText: '关闭' });
      var ck = S.ck('en_speak');
      if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '口语跟读' });
      var d = U.today(); if (!ck.rec[d]) ck.rec[d] = [];
      if (ck.rec[d].indexOf(ck.tasks[0].id) < 0) ck.rec[d].push(ck.tasks[0].id);
      S.save();
    }

    function sim(x, y) {
      if (!x || !y) return 0;
      var m = 0, n = Math.max(x.length, y.length);
      for (var i = 0; i < Math.min(x.length, y.length); i++) if (x[i] === y[i]) m++;
      return m / n;
    }

    draw();
  }

  /* ============ 三、英语阅读 ============ */
  function reading(mount) {
    var s = st();
    function recommend() {
      var REC = [
        { title: 'The Power of Daily Habits', level: '入门', src: '推荐', text: 'Small daily habits shape who we are. When you read a few pages every morning, knowledge builds up quietly. Over time, these tiny actions become a part of your identity.' },
        { title: 'Why We Learn Languages', level: '四级', src: '推荐', text: 'Learning a new language opens doors to different cultures. It trains your memory and helps you see the world from another perspective. Even ten minutes a day makes a difference.' },
        { title: 'The Cost of Instant Gratification', level: '六级', src: '推荐', text: 'Modern technology feeds us endless quick rewards. Yet real growth often hides behind boring, repeated effort. Those who delay satisfaction usually achieve more in the long run.' },
        { title: 'Cities and the Future', level: '考研', src: '推荐', text: 'Urbanization brings both opportunity and pressure. Sustainable cities must balance economic vitality with liveable environments, investing in public transport and green spaces.' },
        { title: 'The Ethics of Artificial Intelligence', level: '雅思', src: '推荐', text: 'As models grow more capable, society must ask who is accountable when they err. Transparent governance and human oversight remain essential to trustworthy systems.' }
      ];
      var have = {}; (s.articles || []).forEach(function (a) { have[a.title] = true; });
      var added = 0;
      REC.forEach(function (r) { if (!have[r.title]) { s.articles.unshift({ id: U.uid(), title: r.title, text: r.text, src: r.src, level: r.level, date: U.today() }); added++; } });
      S.save(); draw();
      U.toast(added ? ('已推荐 ' + added + ' 篇，可按难度排序查看') : '推荐文章已存在');
    }
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.subTitle('阅读 APP 快捷入口'));
      mount.appendChild(C.linkgrid('english_app', { filter: true, tag: '阅读APP' }));
      mount.appendChild(C.subTitle('权威英文阅读网站'));
      mount.appendChild(C.linkgrid('english_site', { filter: true, tag: '网站' }));

      mount.appendChild(C.subTitle('阅读素材', C.btn('✨ 推荐文章', 'sm', function () { recommend(); })));
      var LEVELS = ['入门', '四级', '六级', '考研', '雅思'];
      var sortBar = el('div', { class: 'seg mb8' });
      ['全部'].concat(LEVELS).forEach(function (lv) {
        var btn = el('button', { class: (lv === (W.__enReadLevel || '全部')) ? 'on' : '' }, lv);
        btn.onclick = function () { W.__enReadLevel = lv; draw(); };
        sortBar.appendChild(btn);
      });
      mount.appendChild(sortBar);
      mount.appendChild(C.btn('＋ 导入文章', 'sm mb8', function () {
        U.modal({
          title: '导入阅读素材', fields: [
            { key: 't', label: '标题' }, { key: 'x', label: '正文', type: 'textarea', rows: 8 },
            { key: 's', label: '来源（APP/网址）' },
            { key: 'd', label: '难度', type: 'select', value: '考研', options: ['入门', '四级', '六级', '考研', '雅思'].map(function (v) { return { v: v, t: v }; }) }
          ]
        }).then(function (v) {
          if (!v) return;
          s.articles.unshift({ id: U.uid(), title: v.t, text: v.x, src: v.s, level: v.d, date: U.today() });
          S.save(); draw();
        });
      }));
      if (!s.articles.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">📄</span>还没有文章，点「✨ 推荐文章」或「＋ 导入文章」'));
      var lv = W.__enReadLevel || '全部';
      var list = s.articles.slice();
      if (lv !== '全部') list = list.filter(function (a) { return (a.level || '考研') === lv; });
      list.sort(function (x, y) { return LEVELS.indexOf(x.level || '考研') - LEVELS.indexOf(y.level || '考研'); });
      list.forEach(function (a) {
        var r = el('div', { class: 'it' });
        r.appendChild(el('div', { class: 'ii' }, '📄'));
        r.appendChild(el('div', { class: 'itx' }, '<div class="itt">' + esc(a.title) + '</div><div class="its">' + esc(a.level || '') + ' · ' + esc(a.src || '') + ' · ' + a.date + '</div>'));
        var op = el('button', { class: 'iconbtn' }, '⋯');
        op.onclick = function (e) {
          e.stopPropagation();
          U.sheet(a.title, [{ v: 'read', text: '打开阅读器', icon: '📖' }, { v: 'ai', text: 'AI 全文翻译 / 长难句解析', icon: '🤖' }, { v: 'del', text: '删除', icon: '🗑️' }])
            .then(function (x) {
              if (x === 'read') reader(a, draw);
              else if (x === 'ai') W.Exam.aiAsk('请对下面这篇英文文章：1) 全文翻译；2) 挑出 3 个长难句做语法拆解；3) 总结主旨与写作可用金句。\n\n' + a.text.slice(0, 2500));
              else if (x === 'del') { s.articles = s.articles.filter(function (y) { return y.id !== a.id; }); S.save(); draw(); }
            });
        };
        r.appendChild(op);
        r.onclick = function (e) { if (e.target === op) return; reader(a, draw); };
        mount.appendChild(r);
      });

      mount.appendChild(C.subTitle('阅读资源文件夹（多层分类归档）'));
      mount.appendChild(C.tree('english_res'));
      mount.appendChild(C.subTitle('阅读周打卡'));
      mount.appendChild(C.weekcheck('en_read', { title: '英语阅读打卡' }));
      mount.appendChild(C.subTitle('阅读笔记 / 金句摘抄'));
      mount.appendChild(C.note('en_read'));
    }

    function reader(a, back) {
      var mask = el('div', { class: 'mask' });
      var box = el('div', { class: 'modal', style: 'max-height:90vh' });
      var t0 = Date.now();
      var hd = el('div', { class: 'row mb8' });
      hd.appendChild(el('h3', { style: 'margin:0;flex:1' }, esc(a.title)));
      var cls = C.btn('✕', 'sm', function () { finish(); });
      hd.appendChild(cls); box.appendChild(hd);
      var ops = el('div', { class: 'wrap mb8' });
      var speed = 1;
      ops.appendChild(C.btn('🔊 朗读', 'sm', function () { U.speak(a.text.slice(0, 2000), 'en-US', speed); }));
      ops.appendChild(C.btn('🐢 语速 0.7', 'sm', function () { speed = 0.7; U.speak(a.text.slice(0, 2000), 'en-US', speed); }));
      ops.appendChild(C.btn('⏹ 停止', 'sm', function () { try { speechSynthesis.cancel(); } catch (e) { } }));
      ops.appendChild(C.btn('🤖 AI 解析', 'sm', function () { W.Exam.aiAsk('翻译并解析这篇文章的长难句与主旨：\n' + a.text.slice(0, 2000)); }));
      ops.appendChild(C.btn('🎯 句子练习', 'sm', function () { sentencePractice(a.text, a.title); }));
      box.appendChild(ops);
      box.appendChild(el('div', { class: 'small muted mb8' }, '点击任意单词 → 查词 / 加入今日背单词'));
      var body = el('div', { style: 'font-size:14px;line-height:2;word-break:break-word' });
      a.text.split(/(\s+)/).forEach(function (tok) {
        if (/^\s+$/.test(tok)) { body.appendChild(document.createTextNode(tok)); return; }
        var clean = tok.replace(/[^A-Za-z'-]/g, '');
        var sp = el('span', null, esc(tok));
        if (clean.length > 1) {
          sp.style.cursor = 'pointer';
          sp.onclick = function () { wordPop(clean); };
        }
        body.appendChild(sp);
      });
      box.appendChild(body);
      mask.appendChild(box); U.$('#modalRoot').appendChild(mask);
      function finish() {
        var min = Math.max(1, Math.round((Date.now() - t0) / 60000));
        var d = U.today();
        if (!s.readLog[d]) s.readLog[d] = { min: 0, count: 0 };
        s.readLog[d].min += min; s.readLog[d].count += 1;
        var ck = S.ck('en_read');
        if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '英语阅读' });
        if (!ck.rec[d]) ck.rec[d] = [];
        if (ck.rec[d].indexOf(ck.tasks[0].id) < 0) ck.rec[d].push(ck.tasks[0].id);
        S.save(); mask.remove(); U.toast('本次阅读 ' + min + ' 分钟，已记录打卡');
        if (back) back();
      }
    }
    function wordPop(w) {
      U.sheet(w, [
        { v: 'speak', text: '朗读发音', icon: '🔊' },
        { v: 'add', text: '添加至今日背单词清单', icon: '➕' },
        { v: 'fav', text: '加入收藏生词本', icon: '⭐' },
        { v: 'eudic', text: '在欧路词典查询', icon: '📕' },
        { v: 'ai', text: '让 AI 解释这个词', icon: '🤖' }
      ]).then(function (x) {
        if (x === 'speak') U.speak(w, 'en-US');
        else if (x === 'add') {
          U.modal({ title: '加入今日背单词', fields: [{ key: 'm', label: '中文释义（可空）' }, { key: 'e', label: '例句（可空）', type: 'textarea' }], required: false })
            .then(function (v) {
              var d = U.today(); if (!s.words[d]) s.words[d] = [];
              s.words[d].push({ id: U.uid(), word: w, mean: v ? v.m : '', ex: v ? v.e : '', src: '英语阅读手动录入' });
              S.save(); U.toast('已加入今日单词清单');
            });
        }
        else if (x === 'fav') { s.wordBook.push({ id: U.uid(), word: w, ts: Date.now() }); S.save(); U.toast('已收藏'); }
        else if (x === 'eudic') U.open('https://dict.eudic.net/dicts/en/' + encodeURIComponent(w));
        else if (x === 'ai') W.Exam.aiAsk('请解释英文单词「' + w + '」：音标、词性、常用释义、3 个考研例句、常见搭配与近义词辨析。');
      });
    }
    draw();
  }

  /* 例句内单词点选：查义 / 收藏 */
  function popWord(w) {
    var ky = W.KY && W.KY.lookup(w);
    var items = [];
    if (ky) items.push({ v: 'mean', text: '释义：' + ky.mean, icon: '📖' });
    items.push({ v: 'speak', text: '朗读发音', icon: '🔊' });
    items.push({ v: 'fav', text: '收藏到生词本', icon: '⭐' });
    U.sheet(w, items).then(function (x) {
      if (x === 'speak') U.speak(w, 'en-US');
      else if (x === 'fav') {
        if (s.wordBook.some(function (y) { return y.word.toLowerCase() === w.toLowerCase(); })) { U.toast('已在生词本'); return; }
        s.wordBook.push({ id: U.uid(), word: w, ph: ky ? ky.ph : '', mean: ky ? ky.mean : '', ts: Date.now() });
        S.save(); U.toast('已收藏：' + w);
      }
    });
  }
  /* 例句渲染：每个单词可点选查义 / 收藏 */
  function exBlock(sent, selfWord) {
    var box = el('div', { class: 'ex' });
    String(sent || '').split(/(\s+)/).forEach(function (tok) {
      if (/^\s+$/.test(tok)) { box.appendChild(document.createTextNode(tok)); return; }
      var clean = tok.replace(/[^A-Za-z'-]/g, '');
      var sp = el('span', null, esc(tok));
      if (clean.length > 1 && clean.toLowerCase() !== (selfWord || '').toLowerCase()) {
        sp.style.cursor = 'pointer';
        sp.onclick = function (e) { e.stopPropagation(); popWord(clean); };
      }
      box.appendChild(sp);
    });
    return box;
  }
  /* 生词本单词卡：自动匹配考研例句 / 短语；点单词隐藏、点音标发音、点意思隐藏 */
  function kyCard(w, redraw) {
    var ky = W.KY && W.KY.lookup(w.word);
    var spellOn = !w.hideSpell, meanOn = !w.hideMean;
    var c = el('div', { class: 'wc' });
    var spell = el('div', { class: 'wc-spell' });
    if (spellOn) spell.appendChild(el('div', { class: 'w' }, esc(w.word)));
    else spell.appendChild(el('div', { class: 'masked' }, '🔒 点击显示单词'));
    spell.onclick = function () { w.hideSpell = !w.hideSpell; S.save(); redraw(); };
    c.appendChild(spell);
    var ph = ky ? ky.ph : w.ph;
    if (ph) {
      var phEl = el('div', { class: 'ph', style: 'cursor:pointer' }, esc(ph));
      phEl.title = '点击发音';
      phEl.onclick = function (e) { e.stopPropagation(); U.speak(w.word, 'en-US'); };
      c.appendChild(phEl);
    }
    var mean = el('div', { class: 'wc-mean' });
    if (meanOn) {
      var mtxt = ky ? ky.mean : (w.mean || '（无释义）');
      mean.appendChild(el('div', { class: 'mn' }, esc(mtxt)));
      if (ky && ky.phrases && ky.phrases.length) {
        mean.appendChild(el('div', { class: 'phr-h' }, '常用短语（考研真题）'));
        ky.phrases.forEach(function (p) { mean.appendChild(el('div', { class: 'phr' }, '· ' + esc(p))); });
      }
      if (ky && ky.ex && ky.ex.length) {
        mean.appendChild(el('div', { class: 'phr-h' }, '历年真题例句（点句中生词可查义 / 收藏）'));
        ky.ex.forEach(function (sent) { mean.appendChild(exBlock(sent, w.word)); });
      } else if (w.ex) {
        mean.appendChild(el('div', { class: 'phr-h' }, '例句'));
        mean.appendChild(exBlock(w.ex, w.word));
      }
    } else mean.appendChild(el('div', { class: 'masked' }, '👁 点击显示释义'));
    mean.onclick = function () { w.hideMean = !w.hideMean; S.save(); redraw(); };
    c.appendChild(mean);
    var ops = el('div', { class: 'ops' });
    ops.appendChild(C.btn('🔊', 'sm', function () { U.speak(w.word, 'en-US'); }));
    ops.appendChild(C.btn('↩ 今日', 'sm', function () {
      var d = U.today(); if (!s.words[d]) s.words[d] = [];
      s.words[d].push({ id: U.uid(), word: w.word, mean: w.mean, ex: w.ex, src: '生词本' }); S.save(); U.toast('已加入今日清单');
    }));
    ops.appendChild(C.btn('🗑', 'sm', function () { s.wordBook = s.wordBook.filter(function (x) { return x.id !== w.id; }); S.save(); redraw(); }));
    c.appendChild(ops);
    return c;
  }
  /* 生词本页面 */
  function wordbook(mount) {
    var s = st();
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.subTitle('考研例句库（搜索单词加入生词本；例句内生词可点选查义 / 收藏）'));
      var bar = el('div', { class: 'row mb8' });
      var inp = el('input', { class: 'inp', placeholder: '搜索考研单词，回车加入生词本…' });
      bar.appendChild(inp);
      bar.appendChild(C.btn('搜索', 'pri sm', function () { doSearch(inp.value); }));
      inp.onkeydown = function (e) { if (e.key === 'Enter') doSearch(inp.value); };
      mount.appendChild(bar);

      if (!s.wordBook.length) { mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">⭐</span>生词本为空，去背单词或阅读里收藏吧')); return; }
      var g = el('div', { class: 'wc-grid' });
      s.wordBook.forEach(function (w) { g.appendChild(kyCard(w, draw)); });
      mount.appendChild(g);
    }
    function doSearch(q) {
      q = (q || '').trim(); if (!q) return;
      if (s.wordBook.some(function (x) { return x.word.toLowerCase() === q.toLowerCase(); })) { U.toast('已在生词本'); return; }
      var ky = W.KY && W.KY.lookup(q);
      if (ky) { s.wordBook.push({ id: U.uid(), word: ky.w, ph: ky.ph, mean: ky.mean, ts: Date.now() }); S.save(); U.toast('已加入：' + ky.w); draw(); }
      else U.modal({ title: '例句库未收录「' + q + '」', fields: [{ key: 'm', label: '中文释义（可空）' }, { key: 'e', label: '例句（可空）', type: 'textarea' }], required: false })
        .then(function (v) { if (v) { s.wordBook.push({ id: U.uid(), word: q, mean: v.m || '', ex: v.e || '', ts: Date.now() }); S.save(); draw(); } });
    }
    draw();
  }

  /* ============ 四、听音拼写（一个单词一行，听发音拼单词，自适应/可锁定） ============ */
  function dictation(mount) {
    var s = st();
    var date = U.today();
    var cfg = Object.assign({ fontSize: 'md', showMean: true, showPh: true, autoSpeak: false, compact: false, locked: false, rate: 1 }, s.dictationSettings || {});
    var prog = s.dictationProgress || {};
    var todayProg = prog[date] || (prog[date] = {});

    function pool() {
      var seen = {}, out = [];
      function add(w) {
        var k = (w.word || '').toLowerCase();
        if (!k || seen[k]) return; seen[k] = 1;
        out.push({ word: w.word, ph: w.ph, mean: w.mean });
      }
      (s.words[date] || []).forEach(add);
      s.wordBook.forEach(add);
      return out;
    }
    function saveCfg() { s.dictationSettings = cfg; s.dictationProgress = prog; S.save(); }
    function addToWordbook(it, key) {
      if (!s.wordBook.some(function (x) { return (x.word || '').toLowerCase() === key; })) {
        s.wordBook.push({ word: it.word, ph: it.ph, mean: it.mean, ts: Date.now() });
        S.save(); U.toast('已加入生词本');
      } else U.toast('生词本已有');
    }

    function settingsPanel() {
      var b = el('div', { class: 'dict-set' });
      b.appendChild(el('div', { class: 'small muted mb8' }, '调整布局后打开「锁定」，下次进来保持当前样式'));
      var row1 = el('div', { class: 'row mb8' });
      row1.appendChild(el('span', { class: 'small' }, '字号'));
      ['sm', 'md', 'lg'].forEach(function (sz) {
        var btn = C.btn(sz === 'sm' ? '小' : (sz === 'md' ? '中' : '大'), cfg.fontSize === sz ? 'pri sm' : 'sm', function () {
          if (cfg.locked) { U.toast('已锁定，请先关闭锁定再调整'); return; }
          cfg.fontSize = sz; saveCfg(); draw();
        });
        row1.appendChild(btn);
      });
      b.appendChild(row1);
      var rowSpd = el('div', { class: 'row mb8' });
      rowSpd.appendChild(el('span', { class: 'small' }, '🚀 语速'));
      [0.5, 0.75, 1, 1.25, 1.5].forEach(function (r2) {
        var b2 = C.btn(r2 + 'x', Math.abs((cfg.rate || 1) - r2) < 0.01 ? 'pri sm' : 'sm', function () {
          if (cfg.locked) { U.toast('已锁定，请先关闭锁定再调整'); return; }
          cfg.rate = r2; saveCfg(); draw();
        });
        rowSpd.appendChild(b2);
      });
      b.appendChild(rowSpd);
      var row2 = el('div', { class: 'row mb8' });
      row2.appendChild(C.btn((cfg.showPh ? '✅' : '⬜') + ' 音标', 'sm', function () { if (cfg.locked) { U.toast('已锁定'); return; } cfg.showPh = !cfg.showPh; saveCfg(); draw(); }));
      row2.appendChild(C.btn((cfg.showMean ? '✅' : '⬜') + ' 释义', 'sm', function () { if (cfg.locked) { U.toast('已锁定'); return; } cfg.showMean = !cfg.showMean; saveCfg(); draw(); }));
      row2.appendChild(C.btn((cfg.autoSpeak ? '✅' : '⬜') + ' 自动发音', 'sm', function () { cfg.autoSpeak = !cfg.autoSpeak; saveCfg(); draw(); }));
      row2.appendChild(C.btn((cfg.compact ? '✅' : '⬜') + ' 紧凑', 'sm', function () { if (cfg.locked) { U.toast('已锁定'); return; } cfg.compact = !cfg.compact; saveCfg(); draw(); }));
      b.appendChild(row2);
      var row3 = el('div', { class: 'row' });
      row3.appendChild(C.btn((cfg.locked ? '🔒 已锁定' : '🔓 未锁定'), cfg.locked ? 'pri sm' : 'sm', function () { cfg.locked = !cfg.locked; saveCfg(); draw(); }));
      row3.appendChild(C.btn('恢复默认', 'sm dan', function () { cfg = { fontSize: 'md', showMean: true, showPh: true, autoSpeak: false, compact: false, locked: false, rate: 1 }; saveCfg(); draw(); }));
      b.appendChild(row3);
      return b;
    }

    function draw() {
      mount.innerHTML = '';
      var L = pool();
      var rate = cfg.rate || 1;
      function refreshBadge() {
        var okN = 0, badN = 0;
        L.forEach(function (it) { var st = todayProg[it.word.toLowerCase()]; if (st === 'ok') okN++; else if (st === 'bad') badN++; });
        var badge = document.getElementById('dict-badge');
        if (badge) badge.textContent = '✅ ' + okN + '　❌ ' + badN + '　⏳ ' + (L.length - okN - badN);
      }
      if (!L.length) { mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔤</span>没有可练习的单词，先去背单词或生词本加几个')); return; }

      /* 顶部：标题 + 设置 + 统计 */
      var okN = 0, badN = 0;
      L.forEach(function (it) { var st = todayProg[it.word.toLowerCase()]; if (st === 'ok') okN++; else if (st === 'bad') badN++; });
      mount.appendChild(C.subTitle('✍️ 听音拼写（' + L.length + ' 词）'));
      var head = el('div', { class: 'row mb8', style: 'align-items:center;flex-wrap:wrap' });
      head.appendChild(el('div', { class: 'dict-badge', id: 'dict-badge' }, '✅ ' + okN + '　❌ ' + badN + '　⏳ ' + (L.length - okN - badN)));
      head.appendChild(C.btn('⚙ 布局' + (cfg.locked ? ' 🔒' : ''), 'sm', function () { var p = document.getElementById('dict-settings'); if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; }));
      mount.appendChild(head);

      var setPanel = el('div', { id: 'dict-settings', style: 'display:none;margin-bottom:10px' });
      setPanel.appendChild(settingsPanel());
      mount.appendChild(setPanel);

      /* 批量操作 */
      var ops = el('div', { class: 'wrap mb8' });
      ops.appendChild(C.btn('🔊 逐个朗读', 'sm', function () { playSeq(L, 0); }));
      ops.appendChild(C.btn('✓ 全部检查', 'sm pri', function () {
        mount.querySelectorAll('.dict-row').forEach(function (row) {
          var inp = row.querySelector('input.inp');
          if (inp && !inp.disabled && inp.value.trim()) { var b = row.querySelector('.dict-check'); if (b) b.click(); }
        });
      }));
      ops.appendChild(C.btn('🔄 重做错词', 'sm', function () {
        L.forEach(function (it) { if (todayProg[it.word.toLowerCase()] === 'bad') { todayProg[it.word.toLowerCase()] = ''; } });
        saveCfg(); draw();
      }));
      ops.appendChild(C.btn('🗑 清空进度', 'sm dan', function () { prog[date] = {}; saveCfg(); draw(); }));
      mount.appendChild(ops);

      var g = el('div', { class: 'dict-list' + (cfg.compact ? ' compact' : '') + ' fs-' + cfg.fontSize });
      L.forEach(function (it, idx) {
        var key = it.word.toLowerCase();
        var st = todayProg[key] || '';
        var row = el('div', { class: 'dict-row' + (st === 'ok' ? ' ok' : (st === 'bad' ? ' bad' : '')) });
        var left = el('div', { class: 'dict-left' });
        left.appendChild(el('span', { class: 'dict-idx' }, (idx + 1)));
        var play = C.btn('🔊', 'sm', function () { U.speak(it.word, 'en-US', rate); });
        left.appendChild(play);
        if (cfg.showPh && it.ph) left.appendChild(el('span', { class: 'dict-ph' }, esc(it.ph)));
        if (cfg.showMean && it.mean) left.appendChild(el('span', { class: 'dict-mean' }, esc(it.mean)));
        row.appendChild(left);

        var mid = el('div', { class: 'dict-mid' });
        var inp = el('input', { class: 'inp', placeholder: '拼写…', value: '' });
        if (st === 'ok' || st === 'bad') { inp.value = it.word; inp.disabled = true; }
        inp.onkeydown = function (e) { if (e.key === 'Enter') check(); };
        mid.appendChild(inp);
        row.appendChild(mid);

        var right = el('div', { class: 'dict-right' });
        var st2 = el('span', { class: 'dict-st' + (st === 'ok' ? ' ok' : (st === 'bad' ? ' bad' : '')) }, st === 'ok' ? '✅' : (st === 'bad' ? '❌' : ''));
        right.appendChild(st2);
        var chk = C.btn(st === 'bad' ? '重试' : '✓', 'sm pri dict-check', function () {
          if (st === 'ok') return;
          var v = inp.value.trim().toLowerCase();
          if (!v) { U.toast('先拼写'); return; }
          var isOK = v === key;
          todayProg[key] = isOK ? 'ok' : 'bad';
          saveCfg();
          st2.textContent = isOK ? '✅' : '❌';
          st2.className = 'dict-st' + (isOK ? ' ok' : ' bad');
          row.className = 'dict-row' + (isOK ? ' ok' : ' bad');
          if (isOK) inp.disabled = true;
          U.speak(it.word, 'en-US', rate);
          if (!isOK) {
            if (!right.querySelector('.add-wb')) right.appendChild(C.btn('⭐ 加入生词本', 'sm add-wb', function () { addToWordbook(it, key); }));
          } else {
            var ex = right.querySelector('.add-wb'); if (ex) ex.remove();
          }
          refreshBadge(); /* 仅更新计数，不重建整个列表 → 不再卡顿 */
        });
        right.appendChild(chk);
        if (st === 'bad') {
          right.appendChild(C.btn('⭐ 加入生词本', 'sm add-wb', function () { addToWordbook(it, key); }));
        }
        row.appendChild(right);
        g.appendChild(row);

        if (cfg.autoSpeak && !st) { setTimeout(function () { U.speak(it.word, 'en-US', rate); }, 50 + idx * 80); }
      });
      mount.appendChild(g);
    }
    function playSeq(L, i) {
      if (i >= L.length) return;
      var rate = cfg.rate || 1;
      U.speak(L[i].word, 'en-US', rate);
      var gap = Math.max(900, Math.round(1200 / rate));
      setTimeout(function () { playSeq(L, i + 1); }, gap);
    }
    draw();
  }

  /* ===== 文档解析（供文件夹"新建文档"复用） ===== */
  function parseDocFile(file) {
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    var p;
    if (ext === 'txt' || ext === 'csv') p = readFileText(file).then(parseDocText);
    else if (ext === 'pdf') p = parsePdfFile(file);
    else if (ext === 'docx') p = parseDocxFile(file);
    else if (ext === 'doc') return Promise.reject(new Error('旧版 .doc 暂不支持，请另存为 .docx 或 .txt'));
    else return Promise.reject(new Error('不支持的格式：' + ext));
    return p.then(function (words) {
      var text = words.map(function (w) { return w.word + (w.mean ? (' ' + w.mean) : ''); }).join('\n');
      return { words: words, text: text };
    });
  }

  /* ===== 句子听读练习（朗诵 / 跟读 / 盲听 / 听写 / 倍数） ===== */
  function splitSents(t) {
    var lines = t.replace(/\r/g, '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/[\u4e00-\u9fa5]/.test(line)) {
        if (out.length && !out[out.length - 1].zh) out[out.length - 1].zh = line;
        else out.push({ en: '', zh: line });
      } else {
        var parts = line.replace(/([.!?])\s+/g, '$1\u0001').split('\u0001').filter(Boolean);
        parts.forEach(function (p) { out.push({ en: p.trim(), zh: '' }); });
      }
    }
    return out.filter(function (x) { return x.en || x.zh; });
  }

  function sentencePractice(text, title, back) {
    var ss = splitSents(text);
    var idx = 0, mode = 'read', speed = 1, playing = false, timer = null, shadowRec = null, recTimer = null, dict = false;

    var mask = el('div', { class: 'mask' });
    var box = el('div', { class: 'modal', style: 'max-height:92vh' });
    var hd = el('div', { class: 'row mb8' });
    hd.appendChild(el('h3', { style: 'margin:0;flex:1;font-size:15px' }, esc(title || '句子听读练习')));
    hd.appendChild(C.btn('✕', 'sm', function () { finish(); }));
    box.appendChild(hd);

    var ta = el('textarea', { class: 'ta', rows: 3, placeholder: '练习文本：可粘贴英文；每句后换行写中文翻译即双语跟读' });
    ta.value = text;
    ta.oninput = U.debounce(function () { text = ta.value; ss = splitSents(text); if (idx >= ss.length) idx = 0; redraw(); }, 400);
    box.appendChild(ta);

    var ops = el('div', { class: 'wrap mt6' });
    ops.appendChild(C.btn('🔊 全文朗读', 'sm', function () { U.speak(text.slice(0, 2000), 'en-US', speed); }));
    var dictBtn = C.btn('✍️ 听写：关', 'sm', function () { dict = !dict; dictBtn.textContent = dict ? '✍️ 听写：开' : '✍️ 听写：关'; redraw(); });
    ops.appendChild(dictBtn);
    box.appendChild(ops);

    var listWrap = el('div', { class: 'spk-sents' });
    box.appendChild(listWrap);
    var player = el('div', { class: 'spk-player' });
    box.appendChild(player);
    mask.appendChild(box); U.$('#modalRoot').appendChild(mask);

    function finish() { stopPlay(); mask.remove(); if (back) back(); }

    function redraw() {
      listWrap.innerHTML = '';
      ss.forEach(function (s2, i) {
        var r = el('div', { class: 'ss' + (i === idx ? ' on' : '') });
        r.appendChild(el('div', { class: 'num' }, (i + 1) + '/' + ss.length));
        r.appendChild(el('div', { class: 'en' + (mode === 'blind' && i === idx ? ' blur' : '') }, esc(s2.en || '（无英文）')));
        if (s2.zh) r.appendChild(el('div', { class: 'zh' }, esc(s2.zh)));
        r.onclick = function () { idx = i; redraw(); playCurrent(); };
        listWrap.appendChild(r);
      });

      player.innerHTML = '';
      var mrow = el('div', { class: 'spk-mode' });
      [['read', '🔊 朗诵'], ['shadow', '🎤 跟读'], ['blind', '🙈 盲听']].forEach(function (m) {
        var b = el('button', { class: mode === m[0] ? 'on' : '' }, m[1]);
        b.onclick = function () { mode = m[0]; redraw(); };
        mrow.appendChild(b);
      });
      player.appendChild(mrow);

      var row = el('div', { class: 'spk-row' });
      var cur = ss[idx] || { en: '无句子' };
      row.appendChild(el('div', { class: 'spk-cur' }, (idx + 1) + '/' + ss.length + ' ' + (cur.en || '').slice(0, 24)));
      var pBtn = el('button', { class: 'spk-btn pri' }, playing ? '⏸' : '▶');
      pBtn.onclick = function () { toggle(); };
      row.appendChild(el('button', { class: 'spk-btn', onclick: function () { step(-1); } }, '⏪'));
      row.appendChild(pBtn);
      row.appendChild(el('button', { class: 'spk-btn', onclick: function () { step(1); } }, '⏩'));
      player.appendChild(row);

      var srow = el('div', { class: 'spk-row', style: 'justify-content:space-between' });
      var sg = el('div', { class: 'spk-speed' });
      [0.5, 0.75, 1, 1.25, 1.5].forEach(function (r2) {
        var b = el('button', { class: Math.abs(speed - r2) < 0.01 ? 'on' : '' }, r2 + 'x');
        b.onclick = function () { speed = r2; redraw(); };
        sg.appendChild(b);
      });
      srow.appendChild(sg);
      srow.appendChild(el('div', { class: 'spk-score-mini' }, '语速 ' + speed + 'x'));
      player.appendChild(srow);

      if (dict) {
        var dwrap = el('div', { class: 'row mt6' });
        var inp = el('input', { class: 'inp', placeholder: '听完后在此输入你听到的句子…' });
        dwrap.appendChild(inp);
        dwrap.appendChild(C.btn('检查', 'pri', function () {
          var heard = inp.value.trim().toLowerCase().replace(/[^a-z'\s]/g, ' ').replace(/\s+/g, ' ').trim();
          var ans = (cur.en || '').toLowerCase().replace(/[^a-z'\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (!heard) { U.toast('先输入你听到的内容'); return; }
          var ok = ans && heard.indexOf(ans) >= 0 && heard.length >= ans.length * 0.8;
          if (ok) U.toast('✅ 正确！');
          else U.toast('❌ 不准确，点「重新听」再听一次');
        }));
        dwrap.appendChild(C.btn('重新听', 'sm', function () { playCurrent(); }));
        player.appendChild(dwrap);
      }

      function toggle() { if (playing) stopPlay(); else playCurrent(); }
      function step(n) { stopPlay(); idx = Math.max(0, Math.min(ss.length - 1, idx + n)); redraw(); playCurrent(); }
    }

    function playCurrent() {
      if (!ss.length) return;
      stopPlay();
      playing = true;
      var cur2 = ss[idx];
      if (!cur2 || !cur2.en) { playing = false; redraw(); return; }
      U.speak(cur2.en, 'en-US', speed);
      var dur = Math.max(1200, cur2.en.length * 70 / speed);
      if (mode === 'shadow') timer = setTimeout(function () { startShadow(); }, dur);
      else timer = setTimeout(function () { if (idx < ss.length - 1) { idx++; redraw(); playCurrent(); } else { playing = false; redraw(); } }, dur + 600);
      redraw();
    }
    function stopPlay() {
      playing = false;
      try { window.speechSynthesis.cancel(); } catch (e) { }
      clearTimeout(timer); clearTimeout(recTimer);
      try { if (shadowRec && shadowRec.state === 'recording') shadowRec.stop(); } catch (e) { }
    }
    function startShadow() {
      if (!navigator.mediaDevices) { U.toast('当前环境不支持录音'); playing = false; redraw(); return; }
      U.toast('🎤 请跟读…');
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var rec = new MediaRecorder(stream);
        var chunks = [];
        rec.ondataavailable = function (e) { chunks.push(e.data); };
        rec.onstop = function () {
          var blob = new Blob(chunks, { type: 'audio/webm' });
          var fr = new FileReader();
          fr.onload = function () {
            U.modal({ title: '跟读回放', html: '<audio controls autoplay src="' + fr.result + '"></audio><div class="small muted mt8">原句：' + esc((ss[idx] || {}).en || '') + '</div>', hideCancel: true, okText: '关闭' });
            if (idx < ss.length - 1) { idx++; redraw(); playCurrent(); }
            else { playing = false; redraw(); }
          };
          fr.readAsDataURL(blob);
          stream.getTracks().forEach(function (t) { t.stop(); });
        };
        shadowRec = rec; rec.start();
        recTimer = setTimeout(function () { try { rec.stop(); } catch (e) { } }, 3500);
      }).catch(function () { U.toast('无法录音，请检查麦克风权限'); playing = false; redraw(); });
    }

    redraw();
  }

  W.En = { words: words, speaking: speaking, reading: reading, wordbook: wordbook, dictation: dictation, parseDocFile: parseDocFile, sentencePractice: sentencePractice };
})();
