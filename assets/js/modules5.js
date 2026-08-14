/* ===== 大观墙（行业情报）：咨询机构卡片 + 行业频道 + 行业资源 + 收藏 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C;
  var el = U.el, esc = U.esc;

  var SEED_FIRMS = [
    { name: '麦肯锡 McKinsey', icon: '🟦', color: '#2563eb', intro: '全球洞察・行业报告・McKinsey Quarterly',
      links: [{ label: '最新洞察 Insights', url: 'https://www.mckinsey.com/insights' }, { label: '中文官网', url: 'https://www.mckinsey.com.cn' }, { label: '行业频道', url: '#channels' }],
      mp: '麦肯锡（McKinsey_gco）' },
    { name: '波士顿咨询 BCG', icon: '🟩', color: '#16a34a', intro: 'BCG Insights・亨德森智库・X 矩阵',
      links: [{ label: '最新洞察 Publications', url: 'https://www.bcg.com/publications' }, { label: '中文官网', url: 'https://www.bcg.com/zh-cn' }, { label: '行业频道', url: '#channels' }],
      mp: 'BCG 波士顿咨询（BCG_Greater_China）' },
    { name: '贝恩 Bain', icon: '🟥', color: '#dc2626', intro: 'Bain Insights・全球私募 / 消费 / 科技报告',
      links: [{ label: '最新洞察 Insights', url: 'https://www.bain.com/insights' }, { label: '中文官网', url: 'https://www.bain.cn' }, { label: '行业频道', url: '#channels' }],
      mp: '贝恩公司（BainInsights）' }
  ];
  var SEED_CHANNELS = [
    { name: '科技·AI', icon: '🤖', color: '#6366f1' },
    { name: '金融·投资', icon: '💹', color: '#0ea5e9' },
    { name: '消费·零售', icon: '🛒', color: '#f59e0b' },
    { name: '医疗·健康', icon: '🩺', color: '#10b981', sources: [{ name: '动脉网', url: 'https://www.vbdata.cn' }, { name: '丁香园', url: 'https://www.dxy.cn' }, { name: 'Fierce Pharma', url: 'https://www.fiercepharma.com' }] },
    { name: '能源·碳中和', icon: '⚡', color: '#22c55e' },
    { name: '汽车·出行', icon: '🚗', color: '#3b82f6' },
    { name: '文娱·传媒', icon: '🎬', color: '#a855f7' },
    { name: '宏观·智库', icon: '📊', color: '#64748b' },
    { name: '教育·职场', icon: '🎓', color: '#ec4899' }
  ];

  function ensure() {
    var s = S.get();
    if (!s.daguan) s.daguan = { firms: [], channels: [], sel: '' };
    var d = s.daguan;
    if (!d.firms || !d.firms.length) {
      d.firms = SEED_FIRMS.map(function (f) {
        return { id: U.uid(), name: f.name, icon: f.icon, color: f.color, intro: f.intro, links: f.links.map(function (l) { return { label: l.label, url: l.url }; }), mp: f.mp, hidden: false };
      });
    }
    if (!d.channels || !d.channels.length) {
      d.channels = SEED_CHANNELS.map(function (c) {
        return { id: U.uid(), name: c.name, icon: c.icon, color: c.color, sources: (c.sources || []).map(function (x) { return { id: U.uid(), name: x.name, url: x.url }; }) };
      });
    }
    if (!d.sel || !d.channels.some(function (c) { return c.id === d.sel; })) {
      var h = d.channels.filter(function (c) { return c.name === '医疗·健康'; })[0] || d.channels[0];
      d.sel = h ? h.id : '';
    }
    if (!s.favs) s.favs = [];
    return d;
  }

  /* 收藏联动：存 APP 收藏夹 / 存每日时事 / 存文件夹 */
  function saveFav(name, url, channel) {
    var s = S.get();
    if (!s.favs) s.favs = [];
    s.favs.unshift({ id: U.uid(), title: name, url: url, channel: channel || '', date: U.today() });
    S.save(); U.toast('已收藏到 APP 收藏夹');
  }
  function saveToNews(name, url, channel) {
    var s = S.get();
    if (!s.newsToday) s.newsToday = [];
    s.newsToday.unshift({ id: U.uid(), title: name, src: channel || '行业情报', url: url, cat: '行业情报', date: U.today() });
    S.save(); U.toast('已存入每日时事笔记');
  }
  function saveToFolder(name, url) {
    var fs = S.folders('fav');
    var f = fs.filter(function (x) { return x.name === '收藏夹'; })[0];
    if (!f) { f = { id: U.uid(), name: '收藏夹', icon: '🔖', open: true, children: [], items: [] }; fs.push(f); }
    f.items.push({ id: U.uid(), type: 'link', title: name, url: url, ts: Date.now() });
    S.save(); U.toast('已存入文件夹「收藏夹」');
  }

  /* ---------- 板块 1：咨询机构卡片 ---------- */
  function firmsArea(mount) {
    ensure();
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.subTitle('咨询机构卡片（点击 ⚙ 可隐藏 / 新增；卡片配色区分机构主题色）',
        C.btn('＋ 新增机构', 'sm', function () { addFirm(draw); })));
      var list = el('div');
      S.get().daguan.firms.forEach(function (f) {
        if (f.hidden) return;
        var card = el('div', { class: 'dg-firm', style: 'border-color:' + (f.color || '#ccc') });
        var top = el('div', { class: 'dg-firm-top' });
        top.appendChild(el('div', { class: 'dg-firm-ic' }, f.icon || '🏢'));
        var tx = el('div', { class: 'grow' });
        tx.appendChild(el('div', { class: 'dg-firm-name' }, esc(f.name)));
        if (f.intro) tx.appendChild(el('div', { class: 'small muted' }, esc(f.intro)));
        top.appendChild(tx);
        var gear = el('button', { class: 'iconbtn' }, '⚙');
        gear.onclick = function (e) { e.stopPropagation(); firmMenu(f, draw); };
        top.appendChild(gear);
        card.appendChild(top);
        var lk = el('div', { class: 'dg-firm-links' });
        (f.links || []).forEach(function (l) {
          lk.appendChild(C.btn(l.label, 'sm', function () {
            if (l.url === '#channels') { U.toast('请在下方「行业频道」选择'); var e = document.getElementById('sec-dg_chan'); if (e && e.scrollIntoView) e.scrollIntoView({ behavior: 'smooth' }); }
            else U.open(l.url);
          }));
        });
        card.appendChild(lk);
        if (f.mp) card.appendChild(el('div', { class: 'dg-firm-mp' }, '公众号：' + esc(f.mp)));
        list.appendChild(card);
      });
      mount.appendChild(list);
    }
    draw();
  }
  function firmMenu(f, after) {
    U.sheet(f.name, [
      { v: 'edit', text: '编辑', icon: '✏️' },
      { v: 'hide', text: '隐藏该机构卡片', icon: '🙈' },
      { v: 'del', text: '删除', icon: '🗑️' }
    ]).then(function (a) {
      if (a === 'edit') U.modal({ title: '编辑机构', fields: [{ key: 'n', label: '名称', value: f.name }, { key: 'ic', label: '图标', value: f.icon || '' }, { key: 'co', label: '主题色(#hex)', value: f.color || '' }, { key: 'in', label: '简介', value: f.intro || '' }, { key: 'mp', label: '公众号', value: f.mp || '' }] })
        .then(function (v) { if (v) { f.name = v.n; f.icon = v.ic; f.color = v.co; f.intro = v.in; f.mp = v.mp; S.save(); after(); } });
      else if (a === 'hide') { f.hidden = true; S.save(); after(); U.toast('已隐藏，可在「＋ 新增机构」管理恢复'); }
      else if (a === 'del') U.confirm('删除机构「' + f.name + '」？', '确认删除').then(function (ok) { if (ok) { S.get().daguan.firms = S.get().daguan.firms.filter(function (x) { return x.id !== f.id; }); S.save(); after(); } });
    });
  }
  function addFirm(after) {
    U.modal({ title: '新增咨询机构', fields: [{ key: 'n', label: '名称' }, { key: 'ic', label: '图标(emoji)', value: '🏢' }, { key: 'co', label: '主题色(#hex)', value: '#2563eb' }, { key: 'in', label: '简介' }, { key: 'l1', label: '跳转按钮1 名称', value: '最新洞察' }, { key: 'u1', label: '跳转按钮1 链接' }, { key: 'l2', label: '跳转按钮2 名称', value: '中文官网' }, { key: 'u2', label: '跳转按钮2 链接' }, { key: 'l3', label: '跳转按钮3 名称', value: '行业频道' }, { key: 'u3', label: '跳转按钮3 链接', value: '#channels' }, { key: 'mp', label: '公众号', value: '' }] })
      .then(function (v) {
        if (!v || !v.n) return;
        var links = [];
        if (v.l1 && v.u1) links.push({ label: v.l1, url: v.u1 });
        if (v.l2 && v.u2) links.push({ label: v.l2, url: v.u2 });
        if (v.l3 && v.u3) links.push({ label: v.l3, url: v.u3 });
        S.get().daguan.firms.push({ id: U.uid(), name: v.n, icon: v.ic, color: v.co, intro: v.in, links: links, mp: v.mp, hidden: false });
        S.save(); after();
      });
  }

  /* ---------- 板块 2：行业频道九宫格 ---------- */
  function channelsArea(mount) {
    ensure();
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.subTitle('行业频道（点击进入查看资源；⚙ 可增删改名排序）',
        el('div', { class: 'row' }, (function () {
          var w = el('div');
          w.appendChild(C.btn('＋ 新增频道', 'sm', function () { U.prompt('新增频道', '频道名称').then(function (v) { if (v) { S.get().daguan.channels.push({ id: U.uid(), name: v, icon: '📁', color: '#5b6cff', sources: [] }); S.save(); draw(); } }); }));
          w.appendChild(C.btn('⚙ 管理', 'sm', function () { manageChannels(draw); }));
          return w;
        })())
      ));
      var grid = el('div', { class: 'dg-grid' });
      S.get().daguan.channels.forEach(function (c) {
        var on = c.id === S.get().daguan.sel;
        var b = el('div', { class: 'dg-cell' + (on ? ' on' : ''), style: on ? ('border-color:' + (c.color || '#5b6cff') + ';color:' + (c.color || '#5b6cff')) : '' });
        b.appendChild(el('div', { class: 'dg-cell-ic' }, c.icon || '📁'));
        b.appendChild(el('div', { class: 'dg-cell-tx' }, esc(c.name)));
        b.onclick = function () { S.get().daguan.sel = c.id; S.save(); draw(); if (rerenderSources) rerenderSources(); };
        grid.appendChild(b);
      });
      mount.appendChild(grid);
    }
    draw();
  }
  function manageChannels(after) {
    var items = S.get().daguan.channels.map(function (c, i) { return { v: c.id, text: (i + 1) + '. 编辑「' + c.name + '」', icon: '✏️' }; });
    U.sheet('管理行业频道', items).then(function (id) {
      if (!id) return;
      var c = S.get().daguan.channels.filter(function (x) { return x.id === id; })[0];
      U.sheet('编辑「' + c.name + '」', [
        { v: 'ren', text: '重命名', icon: '✏️' },
        { v: 'up', text: '上移', icon: '⬆️' },
        { v: 'down', text: '下移', icon: '⬇️' },
        { v: 'del', text: S.get().daguan.channels.length > 1 ? '删除频道' : '不可删除（至少保留一个）', icon: '🗑️' }
      ]).then(function (a) {
        var cs = S.get().daguan.channels, i = cs.indexOf(c);
        if (a === 'ren') U.prompt('重命名', '频道名称', c.name).then(function (v) { if (v) { c.name = v; S.save(); after(); } });
        else if (a === 'up' && i > 0) { cs.splice(i, 1); cs.splice(i - 1, 0, c); S.save(); after(); }
        else if (a === 'down' && i < cs.length - 1) { cs.splice(i, 1); cs.splice(i + 1, 0, c); S.save(); after(); }
        else if (a === 'del' && cs.length > 1) U.confirm('删除频道「' + c.name + '」？', '将删除其下所有资讯源').then(function (ok) { if (ok) { cs.splice(i, 1); if (S.get().daguan.sel === c.id) S.get().daguan.sel = cs[0].id; S.save(); after(); } });
      });
    });
  }

  /* ---------- 板块 3：行业专属资源卡片 ---------- */
  var rerenderSources = null;
  function sourcesArea(mount) {
    ensure();
    function draw() {
      mount.innerHTML = '';
      var d = S.get().daguan;
      var ch = d.channels.filter(function (c) { return c.id === d.sel; })[0] || d.channels[0];
      if (!ch) { mount.appendChild(el('div', { class: 'empty' }, '还没有频道')); return; }
      mount.appendChild(C.subTitle('【' + ch.name + '】权威信息源',
        C.btn('＋ 新增资讯源', 'sm', function () {
          U.modal({ title: '新增资讯源（' + ch.name + '）', fields: [{ key: 'n', label: '名称' }, { key: 'u', label: '网址' }] })
            .then(function (v) { if (v && v.u) { ch.sources.push({ id: U.uid(), name: v.n || v.u, url: v.u }); S.save(); draw(); } });
        })));
      if (!ch.sources.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔗</span>该频道还没有资讯源，点上方添加'));
      ch.sources.forEach(function (src) {
        var c = el('div', { class: 'q' });
        c.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, esc(src.name)));
        if (src.url) c.appendChild(el('div', { class: 'small muted', style: 'margin-top:2px;word-break:break-all' }, esc(src.url)));
        var ops = el('div', { class: 'row mt6' });
        ops.appendChild(C.btn('去看看', 'pri sm', function () { U.open(src.url); }));
        ops.appendChild(C.btn('⭐ 收藏', 'sm', function () {
          U.sheet('收藏「' + src.name + '」', [
            { v: 'fav', text: '收藏到 APP 收藏夹', icon: '🔖' },
            { v: 'news', text: '存到每日时事笔记', icon: '📰' },
            { v: 'folder', text: '存到文件夹模块', icon: '📁' }
          ]).then(function (x) {
            if (x === 'fav') saveFav(src.name, src.url, ch.name);
            else if (x === 'news') saveToNews(src.name, src.url, ch.name);
            else if (x === 'folder') saveToFolder(src.name, src.url);
          });
        }));
        ops.appendChild(C.btn('🗑', 'sm dan', function () { ch.sources = ch.sources.filter(function (x) { return x.id !== src.id; }); S.save(); draw(); }));
        c.appendChild(ops);
        mount.appendChild(c);
      });
      mount.appendChild(C.subTitle('⭐ 看到好文章？存一条到收藏夹'));
      var favBtn = C.btn('📥 把当前频道信息源一键存入收藏夹', 'sm', function () {
        (ch.sources || []).forEach(function (s2) { saveFav(s2.name, s2.url, ch.name); });
        U.toast('已存入 ' + (ch.sources || []).length + ' 条');
      });
      mount.appendChild(favBtn);
    }
    rerenderSources = draw;
    draw();
  }

  /* ---------- 收藏模块（独立一级入口） ---------- */
  function favArea(mount) {
    ensure();
    function draw() {
      mount.innerHTML = '';
      var favs = S.get().favs || [];
      var ops = el('div', { class: 'row mb8' });
      ops.appendChild(C.btn('📤 导出收藏(JSON)', 'sm', function () { U.copy(JSON.stringify(favs, null, 2)); U.toast('已复制到剪贴板，可粘贴保存'); }));
      mount.appendChild(ops);
      if (!favs.length) { mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔖</span>收藏夹为空，去大观墙「⭐ 收藏」或「存一条到收藏夹」')); return; }
      favs.forEach(function (f) {
        var c = el('div', { class: 'q' });
        c.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, esc(f.title)));
        if (f.channel) c.appendChild(el('div', { class: 'small muted' }, '#' + esc(f.channel) + ' · ' + (f.date || '')));
        else if (f.date) c.appendChild(el('div', { class: 'small muted' }, f.date));
        if (f.url) c.appendChild(el('div', { class: 'small muted', style: 'margin-top:2px;word-break:break-all' }, esc(f.url)));
        var o = el('div', { class: 'row mt6' });
        o.appendChild(C.btn('打开', 'sm', function () { U.open(f.url); }));
        o.appendChild(C.btn('📰 存时事', 'sm', function () { saveToNews(f.title, f.url, f.channel); }));
        o.appendChild(C.btn('📁 存文件夹', 'sm', function () { saveToFolder(f.title, f.url); }));
        o.appendChild(C.btn('🗑', 'sm dan', function () { S.get().favs = S.get().favs.filter(function (x) { return x.id !== f.id; }); S.save(); draw(); }));
        c.appendChild(o);
        mount.appendChild(c);
      });
    }
    draw();
  }

  W.P.daguan = function (v) {
    C.sectionPage(v, {
      id: 'daguan',
      sections: [
        { key: 'dg_firm', icon: '🏛️', title: '咨询机构卡片', sub: '麦肯锡 / BCG / 贝恩等（可隐藏 / 新增，主题色区分）', render: function (b) { firmsArea(b); } },
        { key: 'dg_chan', icon: '🧭', title: '行业频道', sub: '九宫格分类，点击进入查看权威信息源（可增删改名排序）', render: function (b) { channelsArea(b); } },
        { key: 'dg_src', icon: '🔗', title: '行业资源', sub: '选中频道的权威信息源，「去看看」外链 + 一键收藏', render: function (b) { sourcesArea(b); } }
      ]
    });
  };
  W.P.fav = function (v) {
    C.sectionPage(v, { id: 'fav', sections: [{ key: 'fav_list', icon: '🔖', title: '我的收藏夹', sub: '行业资讯一键收藏，可导出 / 存时事 / 存文件夹', render: function (b) { favArea(b); } }] });
  };
})();
