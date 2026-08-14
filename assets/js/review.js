/* ===== 复盘模块：日 → 周 → 月 → 历史 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  W.P = W.P || {};

  var MOOD_SCORE = { '😄': 5, '🥰': 5, '🔥': 5, '🌈': 5, '😎': 4.5, '🙂': 4, '😌': 4, '🤔': 3.5, '😐': 3, '😴': 3, '🥲': 2.5, '😔': 2, '😤': 2, '😢': 1.5, '🤯': 1.5 };

  /* 单日指标 */
  function dayData(d) {
    var s = S.get(), o = { check: 0, total: 0, mood: 0, words: 0, read: 0, q: 0, free: 0, stt: 0, chars: 0, news: 0, express: 0, novel: 0 };
    for (var k in s.checkins) {
      var c = s.checkins[k];
      o.total += c.tasks.length;
      o.check += ((c.rec || {})[d] || []).length;
    }
    var m = s.moods[d];
    o.mood = m && m.emoji ? (MOOD_SCORE[m.emoji] || 3) : 0;
    o.words = (s.words[d] || []).length;
    o.read = (s.readLog[d] || {}).min || 0;
    o.news = (s.metrics[d] || {}).news || 0;        // 时事浏览联动（分钟/次数）
    o.express = (s.metrics[d] || {}).express || 0;  // 跟读练习联动（分钟）
    o.novel = (s.novel && s.novel.readLog && s.novel.readLog[d]) || 0; // 小说阅读联动（分钟）
    (s.kySubjects || []).forEach(function (sj) {
      sj.subs.forEach(function (sb) {
        sb.chapters.forEach(function (ch) {
          ch.qs.forEach(function (q) { if (q.ts && U.ymd(new Date(q.ts)) === d) o.q++; });
        });
      });
    });
    o.free = (s.free || []).filter(function (f) { return f.date === d; }).length;
    (s.stt || []).forEach(function (x) { if (x.date === d) { o.stt++; o.chars += (x.text || '').length; } });
    return o;
  }

  W.P.review = function (v) {
    var s = S.get();
    if (!s.reviews) s.reviews = { week: {}, month: {} };
    C.sectionPage(v, {
      id: 'review',
      top: function (m) {
        var d = U.today(), dd = dayData(d);
        m.appendChild(C.statRow([
          { value: dd.check + '/' + dd.total, label: '今日打卡' },
          { value: dd.words, label: '单词', color: '#5b6cff' },
          { value: U.fmtMin(dd.read), label: '阅读', color: '#2fbf87' }
        ]));
      },
      sections: [
        { key: 'rv_week', icon: '📈', title: '周复盘', sub: '折线趋势 + 条形对比 + 手动总结', render: function (b) { weekView(b); } },
        { key: 'rv_month', icon: '📊', title: '月复盘', sub: '以周为单位汇总 + 目标完成率', render: function (b) { monthView(b); } },
        { key: 'rv_hist', icon: '🗃️', title: '历史记录', sub: '年 — 月 — 周 — 日 层级折叠回看', render: function (b) { histView(b); } }
      ]
    });
  };

  /* ---------- 周复盘 ---------- */
  function weekView(mount) {
    var s = S.get();
    var ws = U.weekStart(U.today());
    function draw() {
      mount.innerHTML = '';
      var bar = el('div', { class: 'row mb8' });
      bar.appendChild(C.btn('‹ 上周', 'sm', function () { ws = U.addDay(ws, -7); draw(); }));
      bar.appendChild(el('div', { class: 'grow', style: 'text-align:center;font-weight:650' }, U.weekLabel(ws)));
      bar.appendChild(C.btn('下周 ›', 'sm', function () { ws = U.addDay(ws, 7); draw(); }));
      mount.appendChild(bar);

      var days = U.weekDays(ws);
      var labels = days.map(function (d) { return U.md(d); });
      var data = days.map(dayData);
      var sum = { check: 0, words: 0, read: 0, q: 0, free: 0, chars: 0, moodN: 0, moodS: 0, news: 0, express: 0, novel: 0 };
      data.forEach(function (o) {
        sum.check += o.check; sum.words += o.words; sum.read += o.read; sum.q += o.q; sum.free += o.free; sum.chars += o.chars;
        sum.news += o.news; sum.express += o.express; sum.novel += o.novel;
        if (o.mood) { sum.moodN++; sum.moodS += o.mood; }
      });
      mount.appendChild(C.statRow([
        { value: sum.check, label: '打卡次数' }, { value: sum.words, label: '单词', color: '#5b6cff' },
        { value: U.fmtMin(sum.read), label: '阅读时长', color: '#2fbf87' }
      ]));
      mount.appendChild(C.statRow([
        { value: sum.q, label: '新增题目', color: '#9b6cff' }, { value: sum.free, label: '随心记录', color: '#ff8a4c' },
        { value: sum.moodN ? (sum.moodS / sum.moodN).toFixed(1) : '—', label: '平均心情', color: '#f4635e' }
      ]));
      mount.appendChild(C.statRow([
        { value: sum.news, label: '时事浏览', color: '#f0a020' }, { value: sum.express, label: '跟读(min)', color: '#5b6cff' },
        { value: U.fmtMin(sum.novel), label: '小说阅读', color: '#2fbf87' }
      ]));

      var type = mount.__t || 'line';
      var sw = el('div', { class: 'vtoggle' });
      var l1 = el('button', { class: type === 'line' ? 'on' : '' }, '折线图');
      var l2 = el('button', { class: type === 'bar' ? 'on' : '' }, '条形图');
      l1.onclick = function () { mount.__t = 'line'; draw(); };
      l2.onclick = function () { mount.__t = 'bar'; draw(); };
      sw.appendChild(l1); sw.appendChild(l2);

      var cb1 = C.chartBox('每日趋势：打卡 / 单词 / 阅读分钟', sw);
      var series = [
        { name: '打卡', color: '#2fbf87', data: data.map(function (o) { return o.check; }) },
        { name: '单词', color: '#5b6cff', data: data.map(function (o) { return o.words; }) },
        { name: '阅读(min)', color: '#ff8a4c', data: data.map(function (o) { return o.read; }) }
      ];
      cb1.appendChild(type === 'line' ? C.svgLine(labels, series) : C.svgBar(labels, series));
      mount.appendChild(cb1);

      var cb2 = C.chartBox('情绪波动（1-5 分）');
      cb2.appendChild(C.svgLine(labels, [{ name: '心情', color: '#f4635e', data: data.map(function (o) { return o.mood; }) }], { height: 110 }));
      var em = el('div', { class: 'row mt6', style: 'justify-content:space-around' });
      days.forEach(function (d) { em.appendChild(el('div', { style: 'font-size:16px' }, (s.moods[d] || {}).emoji || '·')); });
      cb2.appendChild(em);
      mount.appendChild(cb2);

      var cb3 = C.chartBox('各事项耗时/数量对比');
      cb3.appendChild(C.svgBar(labels, [
        { name: '题目', color: '#9b6cff', data: data.map(function (o) { return o.q; }) },
        { name: '文稿', color: '#5b6cff', data: data.map(function (o) { return o.stt; }) },
        { name: '随心', color: '#ff8a4c', data: data.map(function (o) { return o.free; }) },
        { name: '时事', color: '#f0a020', data: data.map(function (o) { return o.news; }) },
        { name: '跟读', color: '#46c2a0', data: data.map(function (o) { return o.express; }) },
        { name: '小说', color: '#e2554f', data: data.map(function (o) { return o.novel; }) }
      ]));
      mount.appendChild(cb3);

      /* 手动总结 */
      var key = 'w_' + ws;
      if (!s.reviews.week[key]) s.reviews.week[key] = { good: '', bad: '', next: '' };
      var R = s.reviews.week[key];
      mount.appendChild(C.subTitle('本周总结'));
      ['good|本周做得好的地方', 'bad|本周存在的问题', 'next|下周计划'].forEach(function (x) {
        var a = x.split('|');
        var ta = el('textarea', { class: 'ta mb8', rows: 3, placeholder: a[1] });
        ta.value = R[a[0]] || '';
        ta.oninput = U.debounce(function () { R[a[0]] = ta.value; S.save(); }, 400);
        mount.appendChild(ta);
      });
      mount.appendChild(C.btn('🤖 让 AI 帮我分析这周', 'sm', function () {
        W.Exam.aiAsk('这是我本周的学习数据：打卡 ' + sum.check + ' 次、背单词 ' + sum.words + ' 个、阅读 ' + sum.read + ' 分钟、新增题目 ' + sum.q + ' 道、平均心情 ' + (sum.moodN ? (sum.moodS / sum.moodN).toFixed(1) : '未记录') + '/5。我的自评：' + (R.good || '无') + '；问题：' + (R.bad || '无') + '。请帮我做一份简短周复盘并给出下周可执行的 3 条改进建议。');
      }));
    }
    draw();
  }

  /* ---------- 月复盘 ---------- */
  function monthView(mount) {
    var s = S.get();
    var ym = U.today().slice(0, 7);
    function draw() {
      mount.innerHTML = '';
      var bar = el('div', { class: 'row mb8' });
      bar.appendChild(C.btn('‹', 'sm', function () { var y = +ym.split('-')[0], m = +ym.split('-')[1] - 1; if (m < 1) { y--; m = 12; } ym = y + '-' + U.pad(m); draw(); }));
      bar.appendChild(el('div', { class: 'grow', style: 'text-align:center;font-weight:650' }, ym));
      bar.appendChild(C.btn('›', 'sm', function () { var y = +ym.split('-')[0], m = +ym.split('-')[1] + 1; if (m > 12) { y++; m = 1; } ym = y + '-' + U.pad(m); draw(); }));
      mount.appendChild(bar);

      var y0 = +ym.split('-')[0], m0 = +ym.split('-')[1], dim = U.daysInMonth(y0, m0);
      var weeks = {}, order = [];
      for (var i = 1; i <= dim; i++) {
        var d = y0 + '-' + U.pad(m0) + '-' + U.pad(i);
        var w = U.weekStart(d);
        if (!weeks[w]) { weeks[w] = []; order.push(w); }
        weeks[w].push(d);
      }
      var labels = order.map(function (w, i) { return '第' + (i + 1) + '周'; });
      var agg = order.map(function (w) {
        var o = { check: 0, words: 0, read: 0, q: 0, mood: 0, n: 0, news: 0, express: 0, novel: 0 };
        weeks[w].forEach(function (d) {
          var x = dayData(d);
          o.check += x.check; o.words += x.words; o.read += x.read; o.q += x.q;
          o.news += x.news; o.express += x.express; o.novel += x.novel;
          if (x.mood) { o.mood += x.mood; o.n++; }
        });
        o.mood = o.n ? o.mood / o.n : 0;
        return o;
      });
      var tot = agg.reduce(function (a, o) { return { check: a.check + o.check, words: a.words + o.words, read: a.read + o.read, q: a.q + o.q, news: a.news + o.news, express: a.express + o.express, novel: a.novel + o.novel }; }, { check: 0, words: 0, read: 0, q: 0, news: 0, express: 0, novel: 0 });
      mount.appendChild(C.statRow([
        { value: tot.check, label: '月打卡' }, { value: tot.words, label: '月单词', color: '#5b6cff' }, { value: U.fmtMin(tot.read), label: '月阅读', color: '#2fbf87' }
      ]));
      mount.appendChild(C.statRow([
        { value: tot.news, label: '时事浏览', color: '#f0a020' }, { value: tot.express, label: '跟读(min)', color: '#5b6cff' }, { value: U.fmtMin(tot.novel), label: '小说阅读', color: '#2fbf87' }
      ]));

      var cb1 = C.chartBox('周维度对比（条形图）');
      cb1.appendChild(C.svgBar(labels, [
        { name: '打卡', color: '#2fbf87', data: agg.map(function (o) { return o.check; }) },
        { name: '单词', color: '#5b6cff', data: agg.map(function (o) { return o.words; }) },
        { name: '题目', color: '#9b6cff', data: agg.map(function (o) { return o.q; }) }
      ]));
      mount.appendChild(cb1);
      var cb2 = C.chartBox('月度趋势（折线图）');
      cb2.appendChild(C.svgLine(labels, [
        { name: '阅读(min)', color: '#ff8a4c', data: agg.map(function (o) { return o.read; }) },
        { name: '心情', color: '#f4635e', data: agg.map(function (o) { return +o.mood.toFixed(1); }) }
      ]));
      mount.appendChild(cb2);

      /* 目标完成率 */
      var key = 'm_' + ym;
      if (!s.reviews.month[key]) s.reviews.month[key] = { goals: [], note: '' };
      var R = s.reviews.month[key];
      mount.appendChild(C.subTitle('月度目标完成率', C.btn('＋ 目标', 'sm', function () {
        U.modal({ title: '新增月度目标', fields: [{ key: 'n', label: '目标' }, { key: 't', label: '目标值', type: 'number', value: 100 }, { key: 'c', label: '当前值', type: 'number', value: 0 }] })
          .then(function (x) { if (x) { R.goals.push({ id: U.uid(), name: x.n, target: +x.t, cur: +x.c }); S.save(); draw(); } });
      })));
      if (!R.goals.length) mount.appendChild(el('div', { class: 'small muted' }, '还没有设定月度目标'));
      R.goals.forEach(function (g) {
        var pct = g.target ? Math.min(100, Math.round(g.cur / g.target * 100)) : 0;
        var row = el('div', { class: 'tk' });
        row.appendChild(el('div', { class: 'tk-t' }, esc(g.name) + ' <span class="small muted">' + g.cur + '/' + g.target + '</span>'));
        var bar2 = el('div', { style: 'width:70px;height:6px;border-radius:3px;background:#eef0f5;overflow:hidden' });
        bar2.appendChild(el('div', { style: 'height:100%;width:' + pct + '%;background:' + (pct >= 100 ? '#2fbf87' : '#5b6cff') }));
        row.appendChild(bar2);
        row.appendChild(el('div', { class: 'small', style: 'width:34px;text-align:right' }, pct + '%'));
        row.onclick = function () {
          U.modal({ title: '更新进度', fields: [{ key: 'c', label: '当前值', type: 'number', value: g.cur }, { key: 't', label: '目标值', type: 'number', value: g.target }] })
            .then(function (x) { if (x) { g.cur = +x.c; g.target = +x.t; S.save(); draw(); } });
        };
        var del = el('button', { class: 'iconbtn' }, '🗑');
        del.onclick = function (e) { e.stopPropagation(); R.goals = R.goals.filter(function (z) { return z.id !== g.id; }); S.save(); draw(); };
        row.appendChild(del);
        mount.appendChild(row);
      });
      mount.appendChild(C.subTitle('月度复盘笔记'));
      var ta = el('textarea', { class: 'ta', rows: 5, placeholder: '这个月的收获、遗憾与调整…' });
      ta.value = R.note || '';
      ta.oninput = U.debounce(function () { R.note = ta.value; S.save(); }, 400);
      mount.appendChild(ta);
    }
    draw();
  }

  /* ---------- 历史记录（年-月-周-日） ---------- */
  function histView(mount) {
    var s = S.get();
    var kw = '';
    function collectDates() {
      var set = {};
      function add(d) { if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) set[d] = 1; }
      for (var k in s.moods) add(k);
      for (var k2 in s.words) add(k2);
      for (var k3 in s.readLog) add(k3);
      for (var ck in s.checkins) { var r = s.checkins[ck].rec || {}; for (var d2 in r) if ((r[d2] || []).length) add(d2); }
      (s.free || []).forEach(function (f) { add(f.date); });
      (s.stt || []).forEach(function (f) { add(f.date); });
      (s.newsNotes || []).forEach(function (f) { add(f.date); });
      return Object.keys(set).sort().reverse();
    }
    function draw() {
      mount.innerHTML = '';
      var ip = el('input', { class: 'inp mb8', placeholder: '🔍 按日期筛选，如 2026-08' });
      ip.value = kw;
      ip.oninput = U.debounce(function () { kw = ip.value.trim(); draw(); }, 300);
      mount.appendChild(ip);
      var dates = collectDates().filter(function (d) { return !kw || d.indexOf(kw) >= 0; });
      if (!dates.length) { mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🗃️</span>暂无历史数据')); return; }
      var tree = {};
      dates.forEach(function (d) {
        var y = d.slice(0, 4), m = d.slice(0, 7), w = U.weekStart(d);
        tree[y] = tree[y] || {};
        tree[y][m] = tree[y][m] || {};
        tree[y][m][w] = tree[y][m][w] || [];
        tree[y][m][w].push(d);
      });
      Object.keys(tree).sort().reverse().forEach(function (y) {
        var yf = fold('📅 ' + y + ' 年', Object.keys(tree[y]).length + ' 个月', true);
        Object.keys(tree[y]).sort().reverse().forEach(function (m) {
          var mf = fold('🗓️ ' + m, Object.keys(tree[y][m]).length + ' 周');
          Object.keys(tree[y][m]).sort().reverse().forEach(function (w) {
            var wf = fold('📆 ' + U.weekLabel(w), tree[y][m][w].length + ' 天');
            tree[y][m][w].sort().reverse().forEach(function (d) {
              wf.body.appendChild(dayCard(d));
            });
            mf.body.appendChild(wf.box);
          });
          yf.body.appendChild(mf.box);
        });
        mount.appendChild(yf.box);
      });
    }
    function fold(title, sub, open) {
      var box = el('div', { class: 'fd' + (open ? ' open' : '') });
      var hd = el('div', { class: 'fd-hd' });
      hd.appendChild(el('div', { class: 'ar' }, '▶'));
      hd.appendChild(el('div', { class: 'fn' }, esc(title)));
      hd.appendChild(el('div', { class: 'cnt' }, esc(sub)));
      hd.onclick = function () { box.classList.toggle('open'); };
      var body = el('div', { class: 'fd-bd' });
      box.appendChild(hd); box.appendChild(body);
      return { box: box, body: body };
    }
    function dayCard(d) {
      var o = dayData(d), m = s.moods[d] || {};
      var c = el('div', { class: 'q' });
      var h = el('div', { class: 'qh' });
      h.appendChild(el('span', { class: 'tag pri' }, d + ' 周' + U.cnWeek(d)));
      if (m.emoji) h.appendChild(el('span', { class: 'tag' }, m.emoji));
      if (m.temp != null) h.appendChild(el('span', { class: 'tag' }, m.temp + '°C ' + (m.weather || '')));
      c.appendChild(h);
      c.appendChild(el('div', { class: 'small', style: 'line-height:1.8' },
        '打卡 ' + o.check + '/' + o.total + ' · 单词 ' + o.words + ' · 阅读 ' + o.read + 'min · 题目 ' + o.q + ' · 随心 ' + o.free + ' · 文稿 ' + o.chars + ' 字'
        + ((o.news || o.express || o.novel) ? (' · 时事 ' + o.news + ' · 跟读 ' + o.express + 'min · 小说 ' + o.novel + 'min') : '')));
      if (m.text) c.appendChild(el('div', { class: 'qt small', style: 'color:#6b7285;margin-top:4px' }, esc(m.text)));
      var mini = C.svgBar(['打卡', '单词', '阅读', '题目'], [{ name: '', color: '#5b6cff', data: [o.check, o.words, o.read, o.q] }], { height: 90 });
      c.appendChild(mini);
      return c;
    }
    draw();
  }

  W.Review = { dayData: dayData };
})();
