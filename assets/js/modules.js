/* ===== 页面模块 A：首页 / 自定义 / 每日计划 / AI / 考研 / 英语 / 阅读 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  W.P = W.P || {};

  /* ============ 首页 ============ */
  W.P.home = function (v) {
    var s = S.get();
    var d = U.today();
    /* 今日概览 */
    var doneAll = 0, totalAll = 0;
    for (var k in s.checkins) {
      var c = s.checkins[k];
      totalAll += c.tasks.length;
      doneAll += ((c.rec || {})[d] || []).length;
    }
    var words = (s.words[d] || []).length;
    var mood = (s.moods[d] || {}).emoji || '—';

    var hero = el('div', { class: 'card', style: 'background:linear-gradient(135deg,#2db5a5,#5bc9b8);color:#fff;padding:14px' });
    hero.innerHTML = '<div style="font-size:12px;opacity:.85">' + d + ' 周' + U.cnWeek(d) + '</div>' +
      '<div style="font-size:19px;font-weight:750;margin-top:3px">今天也要好好过 ' + mood + '</div>' +
      '<div style="font-size:12px;opacity:.9;margin-top:7px">打卡 ' + doneAll + '/' + totalAll + ' · 单词 ' + words + ' 个 · 阅读 ' + ((s.readLog[d] || {}).min || 0) + ' 分钟</div>';
    v.appendChild(hero);

    /* 今日待办（汇总所有板块未完成任务） */
    v.appendChild(C.card({
      key: 'home_todo', icon: '📋', title: '今日任务总览', sub: '汇总各板块打卡与自定义任务', open: true,
      render: function (b) {
        var any = false;
        for (var key in s.checkins) {
          var c = s.checkins[key];
          if (!c.tasks.length) continue;
          var done = (c.rec[d] || []);
          var row = el('div', { class: 'tk' });
          var nav = (s.nav.filter(function (n) { return key.indexOf(n.id) === 0; })[0] || {});
          row.appendChild(el('div', { style: 'font-size:15px' }, nav.icon || '📌'));
          row.appendChild(el('div', { class: 'tk-t' }, esc(nav.name || key) + ' <span class="small muted">' + done.length + '/' + c.tasks.length + '</span>'));
          var bar = el('div', { style: 'width:56px;height:6px;border-radius:3px;background:#eef0f5;overflow:hidden' });
          bar.appendChild(el('div', { style: 'height:100%;width:' + (c.tasks.length ? done.length / c.tasks.length * 100 : 0) + '%;background:#2fbf87' }));
          row.appendChild(bar);
          row.onclick = function (id) { return function () { W.go(id); }; }(nav.id || 'daily');
          b.appendChild(row); any = true;
        }
        if (!any) b.appendChild(el('div', { class: 'empty' }, '暂无打卡任务'));
      }
    }));

    /* 九宫格 */
    v.appendChild(C.subTitle('全部功能', C.btn('自定义', 'sm', function () { W.go('custom'); })));
    var g = el('div', { class: 'hg' });
    s.nav.filter(function (n) { return n.visible && n.id !== 'home'; }).sort(function (a, b) { return a.order - b.order; }).forEach(function (n) {
      var i = el('div', { class: 'hg-i' });
      i.appendChild(el('div', { class: 'hi' }, n.icon));
      i.appendChild(el('div', { class: 'ht' }, esc(n.name)));
      i.onclick = function () { W.go(n.id); };
      g.appendChild(i);
    });
    v.appendChild(g);

    /* 每日一句小卡 */
    v.appendChild(el('div', { class: 'sec' }, '<div class="sec-t">每日一句</div>'));
    v.appendChild(quoteCard());
  };

  /* ============ 自定义中心 ============ */
  W.P.custom = function (v) {
    var s = S.get();
    v.appendChild(el('div', { class: 'small muted mb8' }, '拖动排序 · 开关显示隐藏 · 点击名称改名换图标 · 点击「定位」直达该功能区'));
    var box = el('div');
    function draw() {
      box.innerHTML = '';
      var list = s.nav.slice().sort(function (a, b) { return a.order - b.order; });
      list.forEach(function (n, idx) {
        var r = el('div', { class: 'sort-i', draggable: 'true' });
        r.appendChild(el('div', { style: 'font-size:16px' }, n.icon));
        var tx = el('div', { class: 'grow' });
        tx.appendChild(el('div', { style: 'font-size:13px;font-weight:600' }, esc(n.name)));
        tx.appendChild(el('div', { class: 'small muted' }, n.lock ? '基础模块（不可隐藏）' : '可隐藏 / 排序 / 改名'));
        tx.onclick = function () {
          U.modal({ title: '编辑模块', fields: [{ key: 'n', label: '名称', value: n.name }, { key: 'i', label: '图标 emoji', value: n.icon }] })
            .then(function (x) { if (x) { n.name = x.n; n.icon = x.i; S.save(); draw(); W.renderNav(); } });
        };
        r.appendChild(tx);
        var go = C.btn('定位', 'sm', function () { W.go(n.id); });
        r.appendChild(go);
        var up = C.btn('↑', 'sm', function () { if (idx > 0) { var t = list[idx - 1].order; list[idx - 1].order = n.order; n.order = t; S.save(); draw(); W.renderNav(); } });
        var dn = C.btn('↓', 'sm', function () { if (idx < list.length - 1) { var t = list[idx + 1].order; list[idx + 1].order = n.order; n.order = t; S.save(); draw(); W.renderNav(); } });
        r.appendChild(up); r.appendChild(dn);
        var sw = el('div', { class: 'sw' + (n.visible ? ' on' : '') });
        sw.onclick = function () { if (n.lock) { U.toast('基础模块不可隐藏'); return; } n.visible = !n.visible; S.save(); draw(); W.renderNav(); };
        r.appendChild(sw);
        r.ondragstart = function () { r.classList.add('drag'); box.__drag = n; };
        r.ondragend = function () { r.classList.remove('drag'); };
        r.ondragover = function (e) { e.preventDefault(); };
        r.ondrop = function () {
          var from = box.__drag; if (!from || from === n) return;
          var t = n.order; n.order = from.order; from.order = t; S.save(); draw(); W.renderNav();
        };
        box.appendChild(r);
      });
    }
    draw(); v.appendChild(box);

    v.appendChild(C.subTitle('新增自定义模块'));
    v.appendChild(C.btn('＋ 新建一个我的板块', 'blk', function () {
      U.modal({ title: '新建自定义板块', fields: [{ key: 'n', label: '名称' }, { key: 'i', label: '图标 emoji', value: '⭐' }] }).then(function (x) {
        if (!x) return;
        var id = 'u_' + U.uid();
        s.nav.push({ id: id, name: x.n, icon: x.i || '⭐', visible: true, order: 200 });
        S.save(); draw(); W.renderNav(); U.toast('已创建，可在导航栏查看');
      });
    }));

    v.appendChild(C.subTitle('数据管理'));
    var dm = el('div', { class: 'wrap' });
    dm.appendChild(C.btn('📤 导出备份', 'sm', function () {
      var blob = new Blob([S.exportJSON()], { type: 'application/json' });
      var a = el('a', { href: URL.createObjectURL(blob), download: 'workbench-backup-' + U.today() + '.json' });
      document.body.appendChild(a); a.click(); a.remove(); U.toast('已导出');
    }));
    dm.appendChild(C.btn('📥 导入备份', 'sm', function () {
      U.pickFile('application/json').then(function (f) { if (!f) return; var fr = new FileReader(); fr.onload = function () { S.importJSON(fr.result); }; fr.readAsText(f); });
    }));
    dm.appendChild(C.btn('🗑 清空数据', 'sm dan', function () { U.confirm('清空所有数据', '此操作不可恢复，建议先导出备份').then(function (ok) { if (ok) S.reset(); }); }));
    v.appendChild(dm);
  };

  /* ============ 每日一句 ============ */
  function quoteCard() {
    var s = S.get();
    var d = U.today();
    if (s.quote.date !== d) {
      var seed = 0; for (var i = 0; i < d.length; i++) seed += d.charCodeAt(i) * (i + 1);
      var q = S.QUOTES[seed % S.QUOTES.length];
      s.quote = { date: d, en: q[0], zh: q[1], from: '内置词库' };
      S.save();
    }
    var box = el('div', { class: 'quote' });
    function draw() {
      box.innerHTML = '';
      box.appendChild(el('div', { class: 'qen' }, esc(s.quote.en)));
      box.appendChild(el('div', { class: 'qzh' }, esc(s.quote.zh)));
      var ft = el('div', { class: 'qft' });
      ft.appendChild(el('div', null, esc(s.quote.date + ' · ' + s.quote.from)));
      var ops = el('div', { class: 'row' });
      var sp = el('button', null, '🔊'); sp.onclick = function (e) { e.stopPropagation(); U.speak(s.quote.en, 'en-US', .9); };
      var cp = el('button', null, '复制'); cp.onclick = function (e) { e.stopPropagation(); U.copy(s.quote.en + '\n' + s.quote.zh); };
      var rf = el('button', null, '换一句'); rf.onclick = function (e) {
        e.stopPropagation();
        var q2 = S.QUOTES[Math.floor(Math.random() * S.QUOTES.length)];
        s.quote = { date: d, en: q2[0], zh: q2[1], from: '内置词库' }; S.save(); draw();
      };
      var eu = el('button', null, '欧路'); eu.onclick = function (e) { e.stopPropagation(); U.open('https://dict.eudic.net/home/dailysentence'); };
      ops.appendChild(sp); ops.appendChild(cp); ops.appendChild(rf); ops.appendChild(eu);
      ft.appendChild(ops);
      box.appendChild(ft);
    }
    draw();
    return box;
  }

  /* ============ 书法练习（每日计划） ============ */
  function calligraphySection(b) {
    var s = S.get();
    if (!s.calligraphy) s.calligraphy = { videos: [], records: {}, hot: [] };
    if (!s.calligraphy.records) s.calligraphy.records = {};
    if (!s.calligraphy.videos) s.calligraphy.videos = [];
    if (!s.calligraphy.hot) s.calligraphy.hot = [];

    /* 书法教程视频 */
    b.appendChild(C.subTitle('🎬 书法教程视频'));
    if (!s.calligraphy.videos.length) b.appendChild(el('div', { class: 'empty small' }, '还没有书法视频，可在设置里恢复默认'));
    var vList = el('div', { class: 'cg-videos' });
    s.calligraphy.videos.forEach(function (v) {
      var c = el('div', { class: 'cg-vcard' });
      var hd = el('div', { class: 'cg-vhd' });
      hd.appendChild(el('div', { class: 'cg-vic' }, v.icon || '🎬'));
      var ht = el('div', { class: 'cg-vht' });
      ht.appendChild(el('div', { class: 'cg-vt ellip' }, esc(v.title)));
      ht.appendChild(el('div', { class: 'cg-vs small' }, '来源：' + esc(v.source)));
      hd.appendChild(ht);
      c.appendChild(hd);
      c.appendChild(el('div', { class: 'cg-vd' }, esc(v.desc)));
      var ft = el('div', { class: 'cg-vft' });
      (v.tags || []).forEach(function (t) { ft.appendChild(el('span', { class: 'tag' }, esc(t))); });
      ft.appendChild(C.btn('前往观看 →', 'sm pri', function () { U.open(v.url); }));
      c.appendChild(ft);
      vList.appendChild(c);
    });
    b.appendChild(vList);

    /* 练字作品记录 */
    b.appendChild(C.subTitle('📸 练字作品记录'));
    var moods = ['平静', '开心', '疲惫', '焦虑', '充实', '随意'];
    var form = el('div', { class: 'cg-form' });
    var photoId = null, photoThumb = el('div', { class: 'cg-thumb' }, '未上传照片');
    var up = C.btn('📷 上传练字照片', 'sm', function () {
      U.pickFile('image/*').then(function (f) {
        if (!f) return;
        U.readImage(f, 1000).then(function (d) { var id = U.uid(); U.Blobs.put(id, d).then(function () { photoId = id; photoThumb.innerHTML = ''; var img = el('img', { src: d }); photoThumb.appendChild(img); }); });
      });
    });
    var descTa = el('textarea', { class: 'ta', rows: 2, placeholder: '描述今天的练字作品' });
    var moodSel = el('select', { class: 'inp' });
    moodSel.appendChild(el('option', { value: '' }, '今日练字心情…'));
    moods.forEach(function (m) { moodSel.appendChild(el('option', { value: m }, m)); });
    var save = C.btn('💾 保存记录', 'pri sm', function () {
      if (!photoId && !descTa.value.trim()) { U.toast('请上传照片或填写描述'); return; }
      var d = U.today();
      if (!s.calligraphy.records[d]) s.calligraphy.records[d] = [];
      s.calligraphy.records[d].unshift({ id: U.uid(), img: photoId, desc: descTa.value.trim(), mood: moodSel.value, date: d, ts: Date.now() });
      S.save(); descTa.value = ''; moodSel.value = ''; photoId = null; photoThumb.textContent = '未上传照片'; U.toast('已保存'); drawRecords();
    });
    form.appendChild(up); form.appendChild(photoThumb); form.appendChild(descTa); form.appendChild(moodSel); form.appendChild(save);
    b.appendChild(form);
    var recBox = el('div', { class: 'cg-records' });
    b.appendChild(recBox);
    function drawRecords() {
      recBox.innerHTML = '';
      var all = [];
      for (var d in s.calligraphy.records) {
        (s.calligraphy.records[d] || []).forEach(function (r) { all.push(r); });
      }
      all.sort(function (a, b) { return b.ts - a.ts; });
      if (!all.length) { recBox.appendChild(el('div', { class: 'empty small' }, '还没有练字记录 ✍️')); return; }
      all.forEach(function (r) {
        var c = el('div', { class: 'cg-rec' });
        if (r.img) {
          var img = el('img'); U.Blobs.get(r.img).then(function (d) { if (d) img.src = d; });
          c.appendChild(img);
        }
        var info = el('div', { class: 'cg-rec-info' });
        info.appendChild(el('div', { class: 'cg-rec-date' }, r.date + (r.mood ? ' · ' + r.mood : '')));
        if (r.desc) info.appendChild(el('div', { class: 'cg-rec-desc' }, esc(r.desc)));
        c.appendChild(info);
        recBox.appendChild(c);
      });
    }
    drawRecords();

    /* 按月对比进步 */
    b.appendChild(C.subTitle('📊 按月对比进步'));
    var months = Object.keys(s.calligraphy.records).map(function (d) { return d.slice(0, 7); }).filter(function (m, i, a) { return a.indexOf(m) === i; }).sort();
    if (!months.length) months = [U.monthKey(U.today())];
    var compare = el('div', { class: 'cg-compare' });
    var selA = el('select', { class: 'inp' }), selB = el('select', { class: 'inp' });
    months.forEach(function (m, i) { selA.appendChild(el('option', { value: m, selected: i === Math.max(0, months.length - 2) }, m)); selB.appendChild(el('option', { value: m, selected: i === months.length - 1 }, m)); });
    var compareBody = el('div');
    function doCompare() {
      var a = selA.value, b2 = selB.value;
      var ca = 0, cb = 0;
      for (var d in s.calligraphy.records) { if (d.slice(0, 7) === a) ca += (s.calligraphy.records[d] || []).length; if (d.slice(0, 7) === b2) cb += (s.calligraphy.records[d] || []).length; }
      compareBody.innerHTML = '';
      compareBody.appendChild(C.svgBar([a, b2], [{ name: '练字记录数', color: '#2db5a5', data: [ca, cb] }]));
      compareBody.appendChild(el('div', { class: 'small muted mt6' }, a + ' ' + ca + ' 次　VS　' + b2 + ' ' + cb + ' 次'));
    }
    var row = el('div', { class: 'row mb8' });
    row.appendChild(selA); row.appendChild(el('div', { class: 'small muted' }, 'VS')); row.appendChild(selB);
    row.appendChild(C.btn('对比', 'sm pri', doCompare));
    compare.appendChild(row); compare.appendChild(compareBody);
    b.appendChild(compare); doCompare();

    /* 抖音书法爆款参考 */
    b.appendChild(C.subTitle('🔥 抖音书法爆款参考'));
    if (!s.calligraphy.hot.length) b.appendChild(el('div', { class: 'empty small' }, '暂无爆款参考'));
    s.calligraphy.hot.forEach(function (h) {
      var row = el('div', { class: 'cg-hot' });
      row.appendChild(el('div', { class: 'cg-hot-t' }, esc(h)));
      row.appendChild(C.btn('去抖音看 →', 'sm', function () { U.open('https://www.douyin.com/search/' + encodeURIComponent(h)); }));
      b.appendChild(row);
    });
  }

  /* ============ 每日计划 ============ */
  W.P.daily = function (v) {
    var s = S.get();
    C.sectionPage(v, {
      id: 'daily',
      top: function (m) { m.appendChild(weatherBar()); },
      sections: [
        { key: 'daily_quote', icon: '💬', title: '每日一句', sub: '对接欧路词典每日一句 / 内置词库', render: function (b) { b.appendChild(quoteCard()); b.appendChild(el('div', { class: 'small muted mt6' }, '提示：点「欧路」跳转官方每日一句页面，复制后可粘贴保存。')); b.appendChild(C.btn('✍️ 手动录入今日一句', 'sm mt6', function () { U.modal({ title: '录入每日一句', fields: [{ key: 'e', label: '英文' }, { key: 'z', label: '中文' }] }).then(function (x) { if (x) { s.quote = { date: U.today(), en: x.e, zh: x.z, from: '欧路词典' }; S.save(); W.render(); } }); })); } },
        { key: 'daily_mood', icon: '🌈', title: '感受', sub: '日历 + 天气温度 + 心情表情 + 当日记录', render: function (b) { moodPanel(b); } },
        { key: 'daily_ck', icon: '✅', title: '打卡', sub: '横向周打卡日历，支持自定义增减任务', render: function (b) { b.appendChild(C.weekcheck('daily', { title: '每日习惯打卡' })); b.appendChild(C.subTitle('今日待办')); b.appendChild(C.tasklist('daily', { addText: '新增今日任务' })); } },
        { key: 'daily_calligraphy', icon: '✍️', title: '书法练习', sub: '教程视频 · 练字记录 · 月度对比 · 抖音爆款参考', render: function (b) { calligraphySection(b); } }
      ]
    });
  };

  function weatherBar() {
    var s = S.get(), d = U.today();
    var host = el('div');
    var box = el('div', { class: 'wea' });
    var fc = el('div', { class: 'wea-fc' });
    host.appendChild(box); host.appendChild(fc);
    function paint(icon, temp, desc) {
      box.innerHTML = '';
      box.appendChild(el('div', { class: 'wi' }, icon));
      var t = el('div', { class: 'grow' });
      t.appendChild(el('div', { class: 'wt' }, temp));
      t.appendChild(el('div', { class: 'wd' }, esc(s.cfg.city + ' · ' + desc)));
      box.appendChild(t);
      box.appendChild(C.btn('设置城市', 'sm', function () {
        U.modal({ title: '天气设置', fields: [{ key: 'c', label: '城市名' }, { key: 'a', label: '纬度', value: s.cfg.lat }, { key: 'o', label: '经度', value: s.cfg.lon }] })
          .then(function (x) { if (x) { s.cfg.city = x.c; s.cfg.lat = +x.a; s.cfg.lon = +x.o; S.save(); load(); } });
      }));
    }
    var CODE = { 0: ['☀️', '晴'], 1: ['🌤️', '晴间多云'], 2: ['⛅', '多云'], 3: ['☁️', '阴'], 45: ['🌫️', '雾'], 48: ['🌫️', '雾凇'], 51: ['🌦️', '小毛雨'], 53: ['🌦️', '毛雨'], 55: ['🌧️', '大毛雨'], 61: ['🌧️', '小雨'], 63: ['🌧️', '中雨'], 65: ['⛈️', '大雨'], 71: ['🌨️', '小雪'], 73: ['🌨️', '中雪'], 75: ['❄️', '大雪'], 80: ['🌦️', '阵雨'], 81: ['🌧️', '阵雨'], 82: ['⛈️', '暴雨'], 95: ['⛈️', '雷阵雨' ] };
    function render(data) {
      paint(data.cur.icon, data.cur.temp + '°C', data.cur.desc);
      fc.innerHTML = '';
      (data.daily || []).forEach(function (it, i) {
        var m = CODE[it.code] || ['🌡️', '未知'];
        var card = el('div', { class: 'wea-d' });
        var dt = new Date(it.day + 'T00:00:00');
        var wd = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];
        card.appendChild(el('div', { class: 'wea-d-d' }, i === 0 ? '今天' : ('周' + wd)));
        card.appendChild(el('div', { class: 'wea-d-i' }, m[0]));
        card.appendChild(el('div', { class: 'wea-d-t' }, it.max + '°'));
        card.appendChild(el('div', { class: 'wea-d-b' }, it.min + '°'));
        fc.appendChild(card);
      });
    }
    function load() {
      // 当天按城市缓存，避免重复请求导致卡顿
      var cacheKey = 'wea_' + s.cfg.lat + '_' + s.cfg.lon;
      try { var c = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (c && c.date === d) { render(c); return; } } catch (e) {}
      paint('🌡️', '--°', '正在获取天气…');
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + s.cfg.lat + '&longitude=' + s.cfg.lon + '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=Asia%2FShanghai';
      fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        var t = Math.round(j.current.temperature_2m), c = j.current.weather_code;
        var m = CODE[c] || ['🌡️', '未知'];
        var daily = (j.daily && j.daily.time) ? j.daily.time.map(function (day, i) {
          return { day: day, code: j.daily.weather_code[i], max: Math.round(j.daily.temperature_2m_max[i]), min: Math.round(j.daily.temperature_2m_min[i]) };
        }) : [];
        var data = { date: d, cur: { icon: m[0], temp: t, desc: m[1] }, daily: daily };
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
        render(data);
        if (!s.moods[d]) s.moods[d] = {};
        s.moods[d].weather = m[1]; s.moods[d].temp = t; S.save();
      }).catch(function () {
        var m = s.moods[d] || {};
        paint('🌡️', (m.temp != null ? m.temp + '°C' : '--°'), m.weather || '离线 · 点右侧可手动设置');
      });
    }
    load();
    return host;
  }

  var EMOJIS = ['😄', '🙂', '😌', '😐', '😔', '😢', '😤', '😴', '🤯', '🥰', '🤔', '😎', '🥲', '🔥', '🌈'];
  function moodPanel(mount) {
    var s = S.get();
    var cur = U.today();
    var ym = cur.slice(0, 7);
    var full = true;
    function draw() {
      mount.innerHTML = '';
      var tg = el('div', { class: 'row mb8' });
      var t1 = C.btn(full ? '📖 完整视图' : '📅 纯日期视图', 'sm', function () { full = !full; draw(); });
      tg.appendChild(t1);
      tg.appendChild(el('div', { class: 'grow' }));
      tg.appendChild(el('div', { class: 'small muted' }, '点击日期记录当天心情'));
      mount.appendChild(tg);

      var cal = el('div', { class: 'cal' });
      var hd = el('div', { class: 'cal-hd' });
      var pv = C.btn('‹', 'sm', function () { var y = +ym.split('-')[0], m = +ym.split('-')[1] - 1; if (m < 1) { y--; m = 12; } ym = y + '-' + U.pad(m); draw(); });
      hd.appendChild(pv);
      hd.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, ym));
      var nx = C.btn('›', 'sm', function () { var y = +ym.split('-')[0], m = +ym.split('-')[1] + 1; if (m > 12) { y++; m = 1; } ym = y + '-' + U.pad(m); draw(); });
      hd.appendChild(nx);
      cal.appendChild(hd);
      var g = el('div', { class: 'cal-g' });
      ['一', '二', '三', '四', '五', '六', '日'].forEach(function (w) { g.appendChild(el('div', { class: 'cal-w' }, w)); });
      var y0 = +ym.split('-')[0], m0 = +ym.split('-')[1];
      var first = new Date(y0, m0 - 1, 1), off = (first.getDay() + 6) % 7;
      for (var i = 0; i < off; i++) g.appendChild(el('div', { class: 'cal-d out' }, ''));
      var dim = U.daysInMonth(y0, m0);
      for (var dd = 1; dd <= dim; dd++) {
        (function (dd) {
          var key = y0 + '-' + U.pad(m0) + '-' + U.pad(dd);
          var m = s.moods[key] || {};
          var c = el('div', { class: 'cal-d' + (key === U.today() ? ' today' : '') + (key === cur ? ' sel' : '') });
          if (full && m.emoji) { c.appendChild(el('div', { class: 'em' }, m.emoji)); c.appendChild(el('div', { style: 'font-size:9px' }, dd)); }
          else c.appendChild(el('div', null, dd));
          if (full && m.text) c.appendChild(el('div', { class: 'dt' }));
          c.onclick = function () { cur = key; draw(); };
          g.appendChild(c);
        })(dd);
      }
      cal.appendChild(g);
      mount.appendChild(cal);

      /* 当日记录 */
      var m = s.moods[cur] || (s.moods[cur] = {});
      mount.appendChild(C.subTitle(cur + ' 周' + U.cnWeek(cur) + (m.temp != null ? ' · ' + m.temp + '°C ' + (m.weather || '') : '')));
      var ep = el('div', { class: 'emoji-pick mb8' });
      EMOJIS.forEach(function (e2) {
        var b = el('button', { class: m.emoji === e2 ? 'on' : '' }, e2);
        b.onclick = function () { m.emoji = (m.emoji === e2 ? '' : e2); S.save(); draw(); };
        ep.appendChild(b);
      });
      mount.appendChild(ep);
      var ta = el('textarea', { class: 'ta', rows: 4, placeholder: '今天发生了什么？现在的感受是…' });
      ta.value = m.text || '';
      ta.oninput = U.debounce(function () { m.text = ta.value; S.save(); }, 400);
      mount.appendChild(ta);
      var wr = el('div', { class: 'row mt6' });
      wr.appendChild(C.btn('手动填天气', 'sm', function () {
        U.modal({ title: '天气记录', fields: [{ key: 'w', label: '天气', value: m.weather || '' }, { key: 't', label: '温度 ℃', value: m.temp == null ? '' : m.temp }] })
          .then(function (x) { if (x) { m.weather = x.w; m.temp = x.t === '' ? null : +x.t; S.save(); draw(); } });
      }));
      wr.appendChild(C.btn('清空当日', 'sm dan', function () { delete s.moods[cur]; S.save(); draw(); }));
      mount.appendChild(wr);

      mount.appendChild(C.subTitle('感受相关的自定义任务'));
      mount.appendChild(C.tasklist('mood', { addText: '新增记录任务' }));
    }
    draw();
  }

  /* ============ AI 技巧库 ============ */
  W.P.ai = function (v) {
    var s = S.get();
    C.sectionPage(v, {
      id: 'ai',
      sections: [
        {
          key: 'ai_learn', icon: '🎓', title: 'AI学习', sub: '推荐视频 · 每日技巧 · 快捷提问',
          open: true,
          render: function (b) { aiLearn(b); }
        },
        {
          key: 'ai_search', icon: '🔍', title: '搜索专区', sub: '多 AI 通道同时提问，对比答案',
          render: function (b) {
            var ip = el('textarea', { class: 'ta', rows: 3, placeholder: '输入你的问题，选择下方 AI 工具提问…' });
            b.appendChild(ip);
            b.appendChild(C.subTitle('选择 AI（可多选，一键并行提问）'));
            var sel = {};
            var g = el('div', { class: 'lk-grid' });
            S.AI_ENGINES.forEach(function (e2) {
              var i = el('div', { class: 'lk' });
              i.appendChild(el('div', { class: 'lki' }, e2.icon));
              i.appendChild(el('div', { class: 'lkt' }, esc(e2.name)));
              i.onclick = function () {
                sel[e2.id] = !sel[e2.id];
                i.style.borderColor = sel[e2.id] ? '#5b6cff' : '';
                i.style.background = sel[e2.id] ? '#eceeff' : '';
              };
              g.appendChild(i);
            });
            b.appendChild(g);
            var ops = el('div', { class: 'wrap mt10' });
            ops.appendChild(C.btn('🚀 并行提问', 'pri', function () {
              var q = ip.value.trim(); if (!q) { U.toast('请输入问题'); return; }
              var picked = S.AI_ENGINES.filter(function (e2) { return sel[e2.id]; });
              if (!picked.length) { U.toast('请至少选择一个 AI'); return; }
              U.copy(q);
              picked.forEach(function (e2, i) { setTimeout(function () { U.open(e2.url.replace('%s', encodeURIComponent(q))); }, i * 260); });
              var his = S.tasks('ai_history'); his.unshift({ id: U.uid(), text: q, done: false, ts: Date.now() }); S.save();
            }));
            ops.appendChild(C.btn('📋 只复制问题', 'sm', function () { U.copy(ip.value); }));
            b.appendChild(ops);
            b.appendChild(C.subTitle('答案对比记录'));
            b.appendChild(C.note('ai_compare', '把几个 AI 的答案粘贴到这里对比…', 6));
            b.appendChild(C.subTitle('提问历史'));
            b.appendChild(C.tasklist('ai_history', { addText: '新增记录' }));
          }
        },
        {
          key: 'ai_prompt', icon: '📚', title: 'AI 指令库', sub: '录入 / 分类 / 检索 / 优化 / 一键复制',
          render: function (b) { promptLib(b); }
        }
      ]
    });
  };

  function aiLearn(mount) {
    var s = S.get();
    var data = s.aiLearn || {};
    if (!data.videos) data.videos = [];
    if (!data.tips) data.tips = [];
    if (!data.questions) data.questions = [];
    var idx = s.aiLearnIdx || 0;
    var tip = data.tips[idx % data.tips.length] || data.tips[0];

    /* 推荐学习视频 */
    mount.appendChild(C.subTitle('📺 推荐学习视频'));
    var vList = el('div', { class: 'ai-videos' });
    data.videos.forEach(function (v) {
      var c = el('div', { class: 'ai-vcard' });
      var h = el('div', { class: 'ai-vhd' });
      h.appendChild(el('div', { class: 'ai-vic' }, v.icon || '📺'));
      var ht = el('div', { class: 'ai-vht' });
      ht.appendChild(el('div', { class: 'ai-vt ellip' }, esc(v.title)));
      ht.appendChild(el('div', { class: 'ai-vs small' }, '来源：' + esc(v.source)));
      h.appendChild(ht);
      c.appendChild(h);
      c.appendChild(el('div', { class: 'ai-vd' }, esc(v.desc)));
      var ft = el('div', { class: 'ai-vft' });
      (v.tags || []).forEach(function (t) { ft.appendChild(el('span', { class: 'tag' }, esc(t))); });
      var go = C.btn('前往观看 →', 'sm pri', function () { U.open(v.url); });
      ft.appendChild(go);
      c.appendChild(ft);
      vList.appendChild(c);
    });
    mount.appendChild(vList);

    /* 每日实用技巧 */
    mount.appendChild(C.subTitle('💡 每日实用技巧'));
    var tipBox = el('div', { class: 'ai-tip' });
    function drawTip() {
      tipBox.innerHTML = '';
      if (!tip) { tipBox.appendChild(el('div', { class: 'empty small' }, '暂无技巧，去指令库添加吧')); return; }
      var hd = el('div', { class: 'ai-tip-hd' });
      hd.appendChild(el('div', { class: 'ai-tip-ic' }, tip.icon || '🛠️'));
      var tx = el('div', { class: 'ai-tip-tx' });
      tx.appendChild(el('div', { class: 'ai-tip-t' }, esc(tip.title)));
      tx.appendChild(el('div', { class: 'ai-tip-meta' }, '⏱ ' + esc(tip.duration)));
      hd.appendChild(tx);
      hd.appendChild(el('div', { class: 'ai-tip-date' }, esc(tip.date)));
      tipBox.appendChild(hd);
      var ol = el('ol', { class: 'ai-tip-list' });
      (tip.steps || []).forEach(function (st) { ol.appendChild(el('li', null, esc(st))); });
      tipBox.appendChild(ol);
      var ops = el('div', { class: 'ai-tip-ops' });
      ops.appendChild(C.btn('🔄 换一个教程', 'sm', function () {
        s.aiLearnIdx = (idx + 1) % data.tips.length;
        S.save(); idx = s.aiLearnIdx; tip = data.tips[idx];
        drawTip();
      }));
      ops.appendChild(C.btn('🚀 去练习', 'sm pri', function () {
        var q = tip.title;
        U.copy(q);
        U.sheet('选择 AI 工具', S.AI_ENGINES.map(function (e2) { return { v: e2.url, text: e2.name, icon: e2.icon }; }))
          .then(function (u) { if (u) U.open(u.replace('%s', encodeURIComponent('请根据主题“' + q + '”给我一份实操练习'))); });
      }));
      tipBox.appendChild(ops);
    }
    drawTip();
    mount.appendChild(tipBox);

    /* 快捷提问 */
    mount.appendChild(C.subTitle('💬 快捷提问'));
    var qWrap = el('div', { class: 'ai-qwrap' });
    data.questions.forEach(function (q) {
      var chip = C.btn(q.text, 'sm', function () {
        U.copy(q.text);
        U.sheet('选择 AI 工具', S.AI_ENGINES.map(function (e2) { return { v: e2.url, text: e2.name, icon: e2.icon }; }))
          .then(function (u) { if (u) U.open(u.replace('%s', encodeURIComponent(q.text))); });
      });
      qWrap.appendChild(chip);
    });
    mount.appendChild(qWrap);
  }

  function promptLib(mount) {
    var s = S.get();
    var kw = '';
    /* 分类折叠状态 */
    if (!s.promptCatOpen) s.promptCatOpen = {};
    function draw() {
      mount.innerHTML = '';
      var bar = el('div', { class: 'row mb8' });
      var ip = el('input', { class: 'inp', placeholder: '🔍 关键词检索指令…' }); ip.value = kw;
      ip.oninput = U.debounce(function () { kw = ip.value.trim(); draw(); }, 300);
      bar.appendChild(ip);
      bar.appendChild(C.btn('＋', 'pri', function () { edit(null); }));
      mount.appendChild(bar);

      var filtered = s.prompts.filter(function (p) {
        if (!kw) return true;
        var t = (p.title + p.body + (p.tags || []).join('')).toLowerCase();
        return t.indexOf(kw.toLowerCase()) >= 0;
      });

      var groups = {};
      filtered.forEach(function (p) { var c = p.cat || '未分类'; (groups[c] = groups[c] || []).push(p); });
      if (!filtered.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🤖</span>没有匹配的指令'));
      Object.keys(groups).forEach(function (cat) {
        var open = s.promptCatOpen[cat] != null ? s.promptCatOpen[cat] : true;
        var box = el('div', { class: 'prompt-cat' + (open ? ' open' : '') });
        var hd = el('div', { class: 'prompt-cat-hd' });
        hd.appendChild(el('div', { class: 'ar' }, '▶'));
        hd.appendChild(el('div', { class: 'cat-name' }, esc(cat)));
        hd.appendChild(el('div', { class: 'cat-meta' }, groups[cat].length + ' 条'));
        hd.appendChild(el('div', { class: 'grow' }));
        var add = C.btn('＋', 'sm', function (e) { e.stopPropagation(); edit(null, cat); });
        hd.appendChild(add);
        hd.onclick = function () { s.promptCatOpen[cat] = !open; S.save(); draw(); };
        box.appendChild(hd);
        var bd = el('div', { class: 'prompt-cat-bd' });
        groups[cat].forEach(function (p) { bd.appendChild(promptCard(p)); });
        box.appendChild(bd);
        mount.appendChild(box);
      });
    }
    function promptCard(p) {
      var c = el('div', { class: 'prompt-card' });
      var h = el('div', { class: 'row mb6' });
      h.appendChild(el('div', { class: 'p-title grow' }, esc(p.title)));
      var mm = el('button', { class: 'iconbtn' }, '⋯');
      h.appendChild(mm);
      c.appendChild(h);
      (p.tags || []).forEach(function (t) { c.appendChild(el('span', { class: 'tag' }, '#' + esc(t))); });
      c.appendChild(el('div', { class: 'p-body' }, esc(p.body)));
      var ops = el('div', { class: 'row mt8' });
      ops.appendChild(C.btn('📋 复制', 'sm', function () { U.copy(p.body); }));
      ops.appendChild(C.btn('🚀 去使用', 'sm', function () {
        U.copy(p.body);
        U.sheet('选择 AI 工具', S.AI_ENGINES.map(function (e2) { return { v: e2.url, text: e2.name, icon: e2.icon }; }))
          .then(function (u) { if (u) U.open(u.replace('%s', encodeURIComponent(p.body.slice(0, 900)))); });
      }));
      ops.appendChild(C.btn('✨ AI 优化', 'sm', function () {
        W.Exam.aiAsk('请优化下面这条提示词，使其更结构化、可执行，并额外生成 2 条同类提示词：\n' + p.body);
      }));
      c.appendChild(ops);
      var ta = el('textarea', { class: 'ta mt6', rows: 2, placeholder: '使用心得…' });
      ta.value = p.note || '';
      ta.oninput = U.debounce(function () { p.note = ta.value; S.save(); }, 400);
      c.appendChild(ta);
      mm.onclick = function () {
        U.sheet(p.title, [{ v: 'e', text: '编辑', icon: '✏️' }, { v: 'd', text: '删除', icon: '🗑️' }]).then(function (a) {
          if (a === 'e') edit(p);
          else if (a === 'd') { s.prompts = s.prompts.filter(function (x) { return x.id !== p.id; }); S.save(); draw(); }
        });
      };
      return c;
    }
    function edit(p, defaultCat) {
      U.modal({
        title: p ? '编辑指令' : '新增指令', fields: [
          { key: 't', label: '标题', value: p ? p.title : '' },
          { key: 'c', label: '分类文件夹', value: p ? p.cat : (defaultCat || '') },
          { key: 'g', label: '标签（逗号分隔）', value: p ? (p.tags || []).join(',') : '' },
          { key: 'b', label: '指令内容', type: 'textarea', rows: 6, value: p ? p.body : '' }
        ]
      }).then(function (v) {
        if (!v) return;
        if (p) { p.title = v.t; p.cat = v.c; p.tags = v.g ? v.g.split(/[,，]/) : []; p.body = v.b; }
        else { var cat = v.c || '未分类'; s.prompts.unshift({ id: U.uid(), title: v.t, cat: cat, tags: v.g ? v.g.split(/[,，]/) : [], body: v.b, note: '' }); s.promptCatOpen[cat] = true; }
        S.save(); draw();
      });
    }
    draw();
  }

  /* ============ 考研 ============ */
  W.P.kaoyan = function (v) {
    var s = S.get();
    var secs = s.kySubjects.map(function (subj) {
      return {
        key: 'ky_' + subj.id, icon: subj.icon, title: subj.name,
        sub: subj.subs.length + ' 个子模块 · 章节知识点 / 题库 / AI 出题 / 资料视频',
        render: function (b) { W.Exam.subject(b, subj, function () { W.render(); }); }
      };
    });
    secs.push({
      key: 'ky_all', icon: '🗂️', title: '备考总资料库', sub: '各科教材、电子书、网课视频、APP / 网址对接',
      render: function (b) {
        b.appendChild(C.tree('ky_res'));
        b.appendChild(C.subTitle('常用考研网址 / APP'));
        b.appendChild(C.linkgrid('ky_link_all', { filter: true, tag: '考研' }));
      }
    });
    secs.push({
      key: 'ky_ckall', icon: '📅', title: '考研总打卡 & 任务', sub: '统一横向方框式周打卡日历',
      render: function (b) {
        b.appendChild(C.weekcheck('kaoyan', { title: '考研总打卡' }));
        b.appendChild(C.subTitle('备考任务'));
        b.appendChild(C.tasklist('kaoyan', { addText: '新增备考任务' }));
        b.appendChild(C.subTitle('备考笔记'));
        b.appendChild(C.note('kaoyan'));
      }
    });
    C.sectionPage(v, {
      id: 'kaoyan',
      top: function (m) {
        var tot = { c: 0, p: 0, q: 0, w: 0 };
        s.kySubjects.forEach(function (sj) {
          sj.subs.forEach(function (sb) {
            tot.c += sb.chapters.length;
            sb.chapters.forEach(function (ch) { tot.p += (ch.points || []).length; tot.q += ch.qs.length; ch.qs.forEach(function (q) { if (q.wrong) tot.w++; }); });
          });
        });
        m.appendChild(C.statRow([
          { value: tot.c, label: '章节' }, { value: tot.p, label: '知识点' },
          { value: tot.q, label: '题目' }
        ]));
        m.appendChild(el('div', { class: 'small muted mb8' }, '江西财经大学 020208 统计学学硕 · 303 数学三 / 201 英语一 / 807 统计学 / 101 政治'));
      },
      sections: secs
    });
  };

  /* ============ 英语 ============ */
  W.P.english = function (v) {
    C.sectionPage(v, {
      id: 'english',
      sections: [
        { key: 'en_word', icon: '🔤', title: '背英语单词', sub: '欧路同步 / 手动录入 / 卡片自测 / 每日短文', render: function (b) { W.En.words(b); } },
        { key: 'en_speak', icon: '🗣️', title: '英语口语练习', sub: '示范跟读 / AI 逐词发音打分 / 录音回放', render: function (b) { W.En.speaking(b); } },
        { key: 'en_read', icon: '📰', title: '英语阅读', sub: 'APP 与权威网址库 / 查词 / 朗读 / AI 解析', render: function (b) { W.En.reading(b); } },
        { key: 'en_book', icon: '⭐', title: '收藏生词本', sub: '长期留存高频难词', render: function (b) { W.En.wordbook(b); } },
        { key: 'en_dict', icon: '✍️', title: '听音拼写', sub: '听发音拼单词，逐词自测', render: function (b) { W.En.dictation(b); } }
      ]
    });
  };

  /* ============ 阅读 ============ */
  W.P.reading = function (v) {
    var s = S.get();
    if (!s.books) s.books = [];
    C.sectionPage(v, {
      id: 'reading',
      sections: [
        {
          key: 'rd_search', icon: '🔎', title: '搜书 & 番茄小说同步', sub: '关键词/书名/作者搜书 · 小说自定义分类',
          render: function (b) {
            var r = el('div', { class: 'row mb8' });
            var ip = el('input', { class: 'inp', placeholder: '输入书名 / 作者 / 关键词' });
            r.appendChild(ip);
            r.appendChild(C.btn('搜索', 'pri', function () {
              var q = ip.value.trim(); if (!q) return;
              U.sheet('选择搜索源', [
                { v: 'https://search.douban.com/book/subject_search?search_text=%s', text: '豆瓣读书', icon: '📚' },
                { v: 'https://weread.qq.com/web/search/books?keyword=%s', text: '微信读书', icon: '📗' },
                { v: 'https://fanqienovel.com/search?q=%s', text: '番茄小说', icon: '🍅' },
                { v: 'https://www.bing.com/search?q=%s+电子书', text: '全网搜索', icon: '🌐' }
              ]).then(function (u) { if (u) U.open(u.replace('%s', encodeURIComponent(q))); });
            }));
            b.appendChild(r);
            b.appendChild(C.linkgrid('reading', { filter: true, tag: '阅读' }));
            b.appendChild(C.subTitle('小说 / 书籍自定义分类'));
            b.appendChild(C.tree('reading_novel'));
          }
        },
        {
          key: 'rd_ck', icon: '✅', title: '阅读打卡 & 任务', sub: '横向方框式周打卡',
          render: function (b) {
            b.appendChild(C.weekcheck('reading', { title: '阅读打卡' }));
            b.appendChild(C.subTitle('自定义阅读任务'));
            b.appendChild(C.tasklist('reading', { addText: '新增阅读任务' }));
          }
        },
        {
          key: 'rd_ai', icon: '🤖', title: 'AI 答疑', sub: '剧情、设定、文言难句随时问',
          render: function (b) {
            var ta = el('textarea', { class: 'ta', rows: 3, placeholder: '把看不懂的段落 / 剧情设定粘贴到这里…' });
            b.appendChild(ta);
            var r = el('div', { class: 'wrap mt6' });
            r.appendChild(C.btn('🤖 问 AI', 'pri', function () {
              if (!ta.value.trim()) { U.toast('请输入内容'); return; }
              W.Exam.aiAsk('我在读书时遇到这段看不懂，请用通俗语言解释含义、背景与作者意图：\n' + ta.value);
            }));
            r.appendChild(C.btn('📖 人物关系梳理', 'sm', function () { W.Exam.aiAsk('请帮我梳理这本书/这段剧情中的人物关系与主线：\n' + ta.value); }));
            b.appendChild(r);
            b.appendChild(C.subTitle('答疑记录'));
            b.appendChild(C.note('reading_ai', 'AI 的解答记录…'));
          }
        },
        {
          key: 'rd_note', icon: '📝', title: '读书笔记 & 感悟', sub: '摘抄文段、书写读书感受',
          render: function (b) {
            b.appendChild(C.note('reading_note', '摘抄 / 笔记 / 读后感…', 8));
            b.appendChild(C.subTitle('摘抄卡片'));
            b.appendChild(C.tasklist('reading_quote', { addText: '新增摘抄', ph: '摘抄一段话' }));
          }
        }
      ]
    });
  };
})();
