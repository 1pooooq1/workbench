/* ===== 页面模块 B：艺术 / 时事 / 随心 / 旅行 / 网址 / 语音转文字 / 影视 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  W.P = W.P || {};

  /* 通用「学习板块」构造：教程视频 + 素材区 + 笔记 + 打卡 */
  function studySection(key, title, icon, sub, tips) {
    return {
      key: key, icon: icon, title: title, sub: sub,
      render: function (b) {
        /* 推荐视频（抖音 / B站 搜索跳转，可刷新换一批） */
        var REC = [
          { n: 'B站 · 零基础入门教程', u: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(title + ' 教程') },
          { n: '抖音 · ' + title + '干货', u: 'https://www.douyin.com/search/' + encodeURIComponent(title + ' 教程') },
          { n: 'B站 · 进阶实操', u: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(title + ' 实操') },
          { n: '抖音 · ' + title + '日常', u: 'https://www.douyin.com/search/' + encodeURIComponent(title) }
        ];
        var recBox = el('div');
        function drawRec() {
          recBox.innerHTML = '';
          recBox.appendChild(C.subTitle('🎬 推荐视频（抖音 / B站）', C.btn('🔄 刷新', 'sm', drawRec)));
          REC.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3).forEach(function (r) {
            recBox.appendChild(C.btn('▶ ' + r.n, 'sm', function () { U.open(r.u); }));
          });
        }
        drawRec();
        b.appendChild(recBox);
        b.appendChild(C.subTitle('学习视频（B站 / 抖音 / 本地上传）', C.btn('＋ 视频链接', 'sm', function () {
          U.modal({ title: '添加学习视频', fields: [{ key: 'n', label: '视频标题' }, { key: 'u', label: '链接（B站/抖音）' }, { key: 't', label: '分组', value: '教程' }] })
            .then(function (v) { if (!v) return; S.links(key + '_video').push({ id: U.uid(), name: v.n, url: v.u, icon: '🎬', tag: v.t }); S.save(); W.render(); });
        })));
        b.appendChild(C.linkgrid(key + '_video', { filter: true, tag: '教程' }));
        b.appendChild(C.subTitle('素材区（多层文件夹 · 支持上传图片/音视频）'));
        b.appendChild(C.tree(key));
        b.appendChild(C.subTitle('笔记 / 心得'));
        b.appendChild(C.note(key, tips || '记录技巧与心得…'));
        b.appendChild(C.subTitle('周打卡'));
        b.appendChild(C.weekcheck(key, { title: title + ' 打卡' }));
        b.appendChild(C.subTitle('自定义学习任务'));
        b.appendChild(C.tasklist(key, { addText: '新增学习任务' }));
      }
    };
  }

  /* ============ 艺术 ============ */
  /* 音乐板块：乐器分类（含吉他）+ 吉他练习 + 热门教学视频导入 */
  function musicSection() {
    return {
      key: 'art_music', icon: '🎵', title: '音乐', sub: '乐器分类（吉他/钢琴/小提琴/尤克里里/声乐）· 教学视频 · 练琴打卡',
      render: function (b) {
        if (!S.note('art_music_instr')) S.note('art_music_instr', '吉他');
        var INSTR = ['吉他', '钢琴', '小提琴', '尤克里里', '声乐'];
        var ICON = { '吉他': '🎸', '钢琴': '🎹', '小提琴': '🎻', '尤克里里': '🪕', '声乐': '🎤' };
        var host = el('div');
        function draw() {
          host.innerHTML = '';
          var instr = S.note('art_music_instr') || '吉他';
          var seg = el('div', { class: 'seg mb8' });
          INSTR.forEach(function (n) {
            var btn = el('button', { class: instr === n ? 'on' : '' }, (ICON[n] || '🎵') + ' ' + n);
            btn.onclick = function () { S.note('art_music_instr', n); draw(); };
            seg.appendChild(btn);
          });
          host.appendChild(C.subTitle('乐器分类（当前：' + instr + (instr === '吉他' ? ' · 默认' : '') + '）'));
          host.appendChild(seg);

          /* 热门教学视频导入（图五：搜索并导入） */
          host.appendChild(C.subTitle('热门教学视频', C.btn('🔍 搜索导入', 'sm', function () {
            U.sheet('搜索「' + instr + ' 教学」并导入', [
              { v: 'https://search.bilibili.com/all?keyword=%s', text: 'B站', icon: '📺' },
              { v: 'https://www.youtube.com/results?search_query=%s', text: 'YouTube', icon: '▶️' },
              { v: 'https://www.douyin.com/search/%s', text: '抖音', icon: '🎵' }
            ]).then(function (u) {
              if (!u) return;
              U.open(u.replace('%s', encodeURIComponent(instr + ' 教学')));
              U.modal({ title: '添加教学视频', fields: [{ key: 'n', label: '视频标题' }, { key: 'u', label: '链接' }, { key: 't', label: '分组', value: instr + '教学' }] })
                .then(function (v) { if (v) { S.links('art_music_video').push({ id: U.uid(), name: v.n, url: v.u, icon: '🎬', tag: v.t }); S.save(); U.toast('已添加，可在「教学视频」中查看'); } });
            });
          })));
          host.appendChild(C.linkgrid('art_music_video', { filter: true, tag: instr + '教学' }));

          /* 当前乐器练习计划 + 曲目库 */
          host.appendChild(C.subTitle(instr + ' · 练习计划（匹配' + instr + '练习）'));
          host.appendChild(C.tasklist('art_music_' + instr, { addText: '新增' + instr + '练习任务' }));
          host.appendChild(C.subTitle(instr + ' · 曲目库 / 素材（多层文件夹）'));
          host.appendChild(C.tree('art_music_' + instr));

          /* 通用乐理 / 教程（所有乐器共享） */
          host.appendChild(C.subTitle('乐理 / 通用教程视频'));
          host.appendChild(C.linkgrid('art_music_video_all', { filter: true, tag: '乐理' }));
          host.appendChild(C.subTitle('乐谱 / 伴奏 / 练琴素材（共享）'));
          host.appendChild(C.tree('art_music'));
          host.appendChild(C.subTitle('练琴笔记 / 心得'));
          host.appendChild(C.note('art_music'));
          host.appendChild(C.subTitle('练琴周打卡'));
          host.appendChild(C.weekcheck('art_music', { title: '练琴打卡' }));
          host.appendChild(C.subTitle('自定义练琴任务'));
          host.appendChild(C.tasklist('art_music', { addText: '新增练琴任务' }));
        }
        b.appendChild(host); draw();
      }
    };
  }

  W.P.art = function (v) {
    C.sectionPage(v, {
      id: 'art',
      sections: [
        studySection('art_edit', '剪辑', '✂️', '教学视频 / 视频音频图片素材 / 剪辑技巧笔记', '剪辑技巧、卡点节奏、调色参数…'),
        studySection('art_photo', '照片', '📷', '摄影修图教程 / 照片素材 / 拍摄心得', '构图、光线、修图预设…'),
        studySection('art_draw', '画画', '🖌️', '绘画教程 / 线稿配色参考 / 练习规划', '笔刷、配色、结构练习…'),
        musicSection()
      ]
    });
  };

  /* ============ 每日时事 ============ */
  W.P.news = function (v) {
    var s = S.get();
    if (!s.newsMedia) s.newsMedia = [];
    if (!s.newsCats) s.newsCats = [];
    C.sectionPage(v, {
      id: 'news',
      sections: [
        {
          key: 'news_today', icon: '📋', title: '今日时事速览', sub: '把今天关注的新闻逐条列出，点击直达原文',
          render: function (b) { newsToday(b); }
        },
        {
          key: 'news_src', icon: '🌐', title: '资讯网址收藏夹', sub: '媒体卡片 · 多个外链一键跳转（可增 / 隐藏 / 排序）',
          render: function (b) { mediaView(b); }
        },
        {
          key: 'news_cats', icon: '🗂️', title: '分类看点', sub: '九宫格频道入口 · 点击跳转（可增删改名）',
          render: function (b) { catsView(b); }
        },
        {
          key: 'news_note', icon: '🗒️', title: '时事笔记', sub: '摘录重点 / 个人观点 / 关键词标记',
          render: function (b) { newsNotes(b); }
        },
        {
          key: 'news_speed', icon: '⚡', title: '时事速览', sub: '聚合资讯源热点榜单 · 每日 7:00 自动更新',
          render: function (b) { newsSpeed(b); }
        },
        {
          key: 'news_ck', icon: '✅', title: '时事打卡 & 任务', sub: '每日阅读资讯记录',
          render: function (b) {
            b.appendChild(C.weekcheck('news', { title: '时事阅读打卡' }));
            b.appendChild(C.tasklist('news', { addText: '新增时事任务' }));
          }
        }
      ]
    });
  };

  /* 资讯网址收藏夹：媒体卡片（图标 + 名称 + 简介 + 多个外链按钮），可增 / 隐藏 / 排序 */
  function mediaView(b) {
    var s = S.get();
    if (!s.newsMedia) s.newsMedia = [];
    var manage = false;
    function parseLinks(t) {
      var out = [];
      String(t || '').split(/\r?\n/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        var i = line.indexOf('|');
        if (i < 0) out.push({ label: line, url: line });
        else out.push({ label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() });
      });
      return out;
    }
    function draw() {
      b.innerHTML = '';
      b.appendChild(C.subTitle('资讯网址收藏夹', C.btn(manage ? '✅ 完成' : '⚙ 管理', 'sm', function () { manage = !manage; draw(); })));
      b.appendChild(C.btn('＋ 添加媒体', 'pri blk mb8', function () {
        U.modal({
          title: '添加媒体',
          fields: [
            { key: 'ic', label: '图标 emoji', value: '🌐' }, { key: 'n', label: '媒体名称' }, { key: 'intro', label: '简介' },
            { key: 'links', label: '外链（每行一个：名称|网址）', type: 'textarea', rows: 4, ph: '央视新闻网|https://news.cctv.com/' }
          ]
        }).then(function (v) { if (!v) return; s.newsMedia.push({ id: U.uid(), icon: v.ic || '🌐', name: v.n, intro: v.intro, hidden: false, links: parseLinks(v.links) }); S.save(); draw(); });
      }));
      var list = s.newsMedia.filter(function (m) { return manage || !m.hidden; });
      if (!s.newsMedia.length) b.appendChild(el('div', { class: 'empty' }, '<span class="ei">🌐</span>还没有媒体，点上方添加'));
      list.forEach(function (m) {
        var card = el('div', { class: 'media-card' });
        var top = el('div', { class: 'mc-top' });
        top.appendChild(el('div', { class: 'mc-ic' }, m.icon || '🌐'));
        var info = el('div', { class: 'mc-info' });
        info.appendChild(el('div', { class: 'mc-name' }, esc(m.name)));
        if (m.intro) info.appendChild(el('div', { class: 'mc-intro' }, esc(m.intro)));
        top.appendChild(info);
        if (manage) {
          top.appendChild(C.btn('↑', 'sm', function (e) { e.stopPropagation(); move(m, -1); }));
          top.appendChild(C.btn('↓', 'sm', function (e) { e.stopPropagation(); move(m, 1); }));
        }
        card.appendChild(top);
        var links = el('div', { class: 'mc-links' });
        (m.links || []).forEach(function (l) {
          links.appendChild(C.btn('🔗 ' + l.label, 'sm', function (e) { e.stopPropagation(); U.open(l.url); }));
        });
        card.appendChild(links);
        if (manage) {
          var ops = el('div', { class: 'row mt6' });
          ops.appendChild(C.btn(m.hidden ? '👁 显示' : '🙈 隐藏', 'sm', function () { m.hidden = !m.hidden; S.save(); draw(); }));
          ops.appendChild(C.btn('✏️ 编辑', 'sm', function () { editMedia(m); }));
          ops.appendChild(C.btn('🗑', 'sm dan', function () { s.newsMedia = s.newsMedia.filter(function (x) { return x.id !== m.id; }); S.save(); draw(); }));
          card.appendChild(ops);
        }
        b.appendChild(card);
      });
    }
    function move(m, dir) {
      var i = s.newsMedia.indexOf(m), j = i + dir;
      if (j < 0 || j >= s.newsMedia.length) return;
      var t = s.newsMedia[i]; s.newsMedia[i] = s.newsMedia[j]; s.newsMedia[j] = t; S.save(); draw();
    }
    function editMedia(m) {
      U.modal({
        title: '编辑媒体',
        fields: [
          { key: 'ic', label: '图标', value: m.icon || '🌐' }, { key: 'n', label: '名称', value: m.name },
          { key: 'intro', label: '简介', value: m.intro || '' },
          { key: 'links', label: '外链（每行：名称|网址）', type: 'textarea', rows: 4, value: (m.links || []).map(function (l) { return l.label + '|' + l.url; }).join('\n') }
        ]
      }).then(function (v) { if (!v) return; m.icon = v.ic; m.name = v.n; m.intro = v.intro; m.links = parseLinks(v.links); S.save(); draw(); });
    }
    draw();
  }

  /* 分类看点：九宫格圆角图标，点击跳转对应频道；可增删改名 */
  function catsView(b) {
    var s = S.get();
    if (!s.newsCats) s.newsCats = [];
    var manage = false;
    function draw() {
      b.innerHTML = '';
      b.appendChild(C.subTitle('分类看点', C.btn(manage ? '✅ 完成' : '⚙ 管理', 'sm', function () { manage = !manage; draw(); })));
      b.appendChild(C.btn('＋ 添加分类', 'pri blk mb8', function () {
        U.modal({ title: '添加分类', fields: [{ key: 'ic', label: '图标 emoji', value: '📌' }, { key: 'n', label: '分类名' }, { key: 'u', label: '跳转网址' }] })
          .then(function (v) { if (!v) return; s.newsCats.push({ id: U.uid(), icon: v.ic || '📌', name: v.n, url: v.u }); S.save(); draw(); });
      }));
      var grid = el('div', { class: 'dg-grid' });
      s.newsCats.forEach(function (c) {
        var cell = el('div', { class: 'dg-cell' + (manage ? ' on' : '') });
        cell.appendChild(el('div', { class: 'dg-cell-ic' }, c.icon || '📌'));
        cell.appendChild(el('div', { class: 'dg-cell-tx' }, esc(c.name)));
        if (manage) {
          cell.appendChild(C.btn('✕', 'sm dan', function (e) { e.stopPropagation(); s.newsCats = s.newsCats.filter(function (x) { return x.id !== c.id; }); S.save(); draw(); }));
          cell.onclick = function (e) {
            if (e.target.closest('.btn')) return;
            U.modal({ title: '编辑分类', fields: [{ key: 'ic', label: '图标', value: c.icon || '📌' }, { key: 'n', label: '名称', value: c.name }, { key: 'u', label: '网址', value: c.url || '' }] })
              .then(function (v) { if (v) { c.icon = v.ic; c.name = v.n; c.url = v.u; S.save(); draw(); } });
          };
        } else cell.onclick = function () { U.open(c.url); };
        grid.appendChild(cell);
      });
      b.appendChild(grid);
    }
    draw();
  }
  function newsNotes(mount) {
    var s = S.get();
    if (!s.newsNotes) s.newsNotes = [];
    var kw = '';
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.statRow([
        { value: s.newsNotes.length, label: '摘记总数' },
        { value: s.newsNotes.filter(function (n) { return n.fav; }).length, label: '已收藏', color: '#f0a020' }
      ]));
      var r = el('div', { class: 'row mb8' });
      var ip = el('input', { class: 'inp', placeholder: '🔍 搜索笔记 / 标签' });
      ip.value = kw; ip.oninput = U.debounce(function () { kw = ip.value.trim(); draw(); }, 300);
      r.appendChild(ip);
      r.appendChild(C.btn('＋ 记一条', 'pri', function () { edit(null); }));
      mount.appendChild(r);
      mount.appendChild(C.btn('📥 从官媒链接收藏（自动存为摘记）', 'sm mb8', function () {
        U.modal({ title: '从链接收藏', fields: [{ key: 't', label: '标题 / 主题' }, { key: 'u', label: '文章链接' }, { key: 'b', label: '要点摘录（可空）', type: 'textarea', rows: 4 }] })
          .then(function (v) { if (v) { s.newsNotes.unshift({ id: U.uid(), title: v.t, body: v.b || '', url: v.u, tags: [], date: U.today(), ts: Date.now() }); S.save(); draw(); U.toast('已存为摘记'); } });
      }));
      var list = s.newsNotes.filter(function (n) { return !kw || (n.title + n.body + (n.tags || []).join('')).indexOf(kw) >= 0; });
      if (!list.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">📰</span>还没有摘记　看到值得记住的大事，就存进来，日积月累就是你的时事资料库'));
      list.forEach(function (n) {
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        h.appendChild(el('span', { class: 'tag' }, n.date));
        (n.tags || []).forEach(function (t) { h.appendChild(el('span', { class: 'tag pri' }, '#' + esc(t))); });
        if (n.fav) h.appendChild(el('span', { class: 'tag warn' }, '★ 收藏'));
        h.appendChild(el('div', { class: 'grow' }));
        var mm = el('button', { class: 'iconbtn' }, '⋯'); h.appendChild(mm);
        c.appendChild(h);
        c.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, esc(n.title)));
        c.appendChild(el('div', { class: 'qt small', style: 'color:#6b7285;margin-top:3px' }, esc(n.body)));
        if (n.img) c.appendChild(C.mediaImg(n.img));
        if (n.url) { var wd = el('div', { class: 'mt6' }); wd.appendChild(C.btn('🔗 打开原文', 'sm', function () { U.open(n.url); })); c.appendChild(wd); }
        mm.onclick = function () {
          U.sheet(n.title, [{ v: 'e', text: '编辑', icon: '✏️' }, { v: 'f', text: n.fav ? '取消收藏' : '收藏', icon: '⭐' }, { v: 'i', text: '添加图片', icon: '🖼️' }, { v: 'c', text: '复制内容', icon: '📋' }, { v: 'fd', text: '存到文件夹', icon: '📁' }, { v: 'd', text: '删除', icon: '🗑️' }])
            .then(function (a2) {
              if (a2 === 'e') edit(n);
              else if (a2 === 'f') { n.fav = !n.fav; S.save(); draw(); }
              else if (a2 === 'i') U.pickFile('image/*').then(function (f) { if (!f) return; U.readImage(f, 900).then(function (d) { var id = U.uid(); U.Blobs.put(id, d).then(function () { n.img = id; S.save(); draw(); }); }); });
              else if (a2 === 'c') U.copy(n.title + '\n' + n.body);
              else if (a2 === 'fd') {
                var fs = S.folders('news');
                if (!fs.length) { U.toast('还没有文件夹，先去文件夹模块建一个'); return; }
                U.sheet('选择文件夹', fs.map(function (f) { return { v: f.id, text: f.name, icon: f.icon }; })).then(function (fid) {
                  var f = fs.filter(function (x) { return x.id === fid; })[0];
                  if (f) { f.items.push({ id: U.uid(), type: 'text', title: n.title, note: n.body }); f.open = true; S.save(); U.toast('已存到 ' + f.name); }
                });
              }
              else if (a2 === 'd') { s.newsNotes = s.newsNotes.filter(function (x) { return x.id !== n.id; }); S.save(); draw(); }
            });
        };
        mount.appendChild(c);
      });
    }
    function edit(n) {
      U.modal({
        title: n ? '编辑笔记' : '新建时事笔记', fields: [
          { key: 't', label: '标题 / 新闻主题', value: n ? n.title : '' },
          { key: 'b', label: '摘录 + 个人观点', type: 'textarea', rows: 6, value: n ? n.body : '' },
          { key: 'u', label: '原文链接（可空）', value: n ? n.url : '' },
          { key: 'g', label: '关键词标签（逗号分隔）', value: n ? (n.tags || []).join(',') : '' }
        ]
      }).then(function (v) {
        if (!v) return;
        if (n) { n.title = v.t; n.body = v.b; n.url = v.u; n.tags = v.g ? v.g.split(/[,，]/) : []; }
        else s.newsNotes.unshift({ id: U.uid(), title: v.t, body: v.b, url: v.u, tags: v.g ? v.g.split(/[,，]/) : [], date: U.today(), ts: Date.now() });
        S.save(); draw();
      });
    }
    draw();
  }

  /* 今日时事速览：分类标签 + 重点总结 + 点击跳转原文 + 收藏 */
  function newsToday(mount) {
    var s = S.get();
    if (!s.newsToday) s.newsToday = [];

    /* 每日按当天日期自动轮换的「示例」内容（纯前端、不依赖外网、不碰敏感题材） */
    function genTodayDemo(date) {
      var n = NEWS_TODAY_POOL.length;
      var off = (parseInt(date.slice(8, 10), 10) + date.charCodeAt(5)) % n;
      var pick = [];
      for (var i = 0; i < 6; i++) {
        var c = NEWS_TODAY_POOL[(off + i) % n];
        pick.push({ id: U.uid(), title: c.title, summary: c.summary, src: c.src, cat: c.cat, time: c.time, url: c.url, date: date, fav: false, demo: true });
      }
      return pick;
    }
    function refreshDemo(force) {
      var today = U.today();
      if (!force && s.newsTodayDemoDate === today && s.newsTodayDemoTs) return;
      /* 移除旧的示例内容；用户收藏过的示例（fav）予以保留，手动添加的永久保留 */
      s.newsToday = (s.newsToday || []).filter(function (x) { return !x.demo || x.fav; });
      s.newsToday = genTodayDemo(today).concat(s.newsToday);
      s.newsTodayDemoDate = today;
      s.newsTodayDemoTs = Date.now();
      S.save();
    }
    refreshDemo(false);

    /* 标签按已有分类动态生成（示例分类 + 用户自定义分类都纳入） */
    var catSet = {};
    s.newsToday.forEach(function (n) { if (n.cat) catSet[n.cat] = 1; });
    var tabs = ['全部'].concat(Object.keys(catSet)).concat(['我的收藏']);
    var curTab = W.__newsTodayTab || '全部';
    if (tabs.indexOf(curTab) < 0) curTab = '全部';

    function draw() {
      mount.innerHTML = '';

      /* 顶部标签栏 + 更新时间 */
      var top = el('div', { class: 'news-today-top' });
      var tabsRow = el('div', { class: 'news-tabs' });
      tabs.forEach(function (t) {
        var chip = el('button', { class: 'news-tab' + (t === curTab ? ' on' : '') }, esc(t));
        chip.onclick = function () { curTab = t; W.__newsTodayTab = t; draw(); };
        tabsRow.appendChild(chip);
      });
      top.appendChild(tabsRow);
      var when = s.newsTodayDemoTs ? (function () { var d = new Date(s.newsTodayDemoTs); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); })() : '08:00';
      var updateInfo = el('div', { class: 'news-update' }, '更新于 今日 ' + when + (s.newsTodayDemoDate ? (' · ' + s.newsTodayDemoDate) : '') + '（示例轮换·可点🔄更新）');
      top.appendChild(updateInfo);
      mount.appendChild(top);

      /* 添加 + 更新（示例内容每日按日期自动轮换，也可手动点🔄刷新） */
      var btnRow = el('div', { style: 'display:flex;gap:8px;margin-bottom:8px' });
      var addB = C.btn('＋ 添加今日时事', 'pri', function () { editItem(null); });
      addB.style.flex = '1';
      var refB = C.btn('🔄 更新示例', '', function () { refreshDemo(true); U.toast('已更新今日时事速览'); draw(); });
      refB.style.flex = '1';
      btnRow.appendChild(addB);
      btnRow.appendChild(refB);
      mount.appendChild(btnRow);

      /* 过滤 */
      var list = s.newsToday.filter(function (n) {
        if (curTab === '全部') return true;
        if (curTab === '我的收藏') return n.fav;
        return n.cat === curTab;
      });

      if (!list.length) {
        mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🗞️</span>「' + esc(curTab) + '」还没有时事，点上方按钮添加'));
        return;
      }

      list.forEach(function (n) {
        var c = el('div', { class: 'news-card' + (n.fav ? ' fav' : '') });
        var hd = el('div', { class: 'news-hd' });
        hd.appendChild(el('div', { class: 'news-title' }, esc(n.title)));
        var star = el('button', { class: 'news-star' + (n.fav ? ' on' : '') }, n.fav ? '★' : '☆');
        star.onclick = function (e) { e.stopPropagation(); n.fav = !n.fav; S.save(); draw(); };
        hd.appendChild(star);
        c.appendChild(hd);

        if (n.summary) c.appendChild(el('div', { class: 'news-summary' }, esc(n.summary)));

        var ft = el('div', { class: 'news-ft' });
        if (n.src) ft.appendChild(el('span', { class: 'news-tag src' }, esc(n.src)));
        if (n.cat) ft.appendChild(el('span', { class: 'news-tag cat' }, esc(n.cat)));
        if (n.time) ft.appendChild(el('span', { class: 'news-tag time' }, esc(n.time)));
        if (n.demo) ft.appendChild(el('span', { class: 'news-tag cat', style: 'opacity:.65' }, '示例'));
        c.appendChild(ft);

        /* 整卡点击 → 跳转原文；按钮阻止冒泡 */
        c.onclick = function (e) {
          if (e.target.closest('button') || e.target.closest('.news-ops')) return;
          if (n.url) U.open(n.url); else U.toast('没有原文链接');
        };

        var ops = el('div', { class: 'news-ops' });
        if (n.url) ops.appendChild(C.btn('🔗 查看全文', 'sm', function (e) { e.stopPropagation(); U.open(n.url); }));
        ops.appendChild(C.btn('📋 复制', 'sm', function (e) { e.stopPropagation(); U.copy(n.title + '\n' + (n.summary || '') + (n.url ? '\n' + n.url : '')); U.toast('已复制'); }));
        ops.appendChild(C.btn('✏️ 编辑', 'sm', function (e) { e.stopPropagation(); editItem(n); }));
        ops.appendChild(C.btn('🗑', 'sm dan', function (e) { e.stopPropagation(); if (confirm('删除这条时事？')) { s.newsToday = s.newsToday.filter(function (x) { return x.id !== n.id; }); S.save(); draw(); } }));
        c.appendChild(ops);
        mount.appendChild(c);
      });
    }

    function editItem(n) {
      U.modal({
        title: n ? '编辑时事' : '添加今日时事',
        fields: [
          { key: 't', label: '标题 / 事件', value: n ? n.title : '' },
          { key: 's', label: '内容重点总结', type: 'textarea', rows: 4, value: n ? (n.summary || '') : '' },
          { key: 'src', label: '来源（如 人民网）', value: n ? (n.src || '') : '' },
          { key: 'c', label: '分类（社会/民生/行业）', value: n ? (n.cat || '') : '' },
          { key: 'tm', label: '时间（如 09:00）', value: n ? (n.time || '') : '' },
          { key: 'u', label: '原文链接', value: n ? (n.url || '') : '' }
        ]
      }).then(function (v) {
        if (!v || !v.t) return;
        if (n) {
          n.title = v.t; n.summary = v.s; n.src = v.src; n.cat = v.c; n.time = v.tm; n.url = v.u;
        } else {
          s.newsToday.unshift({ id: U.uid(), title: v.t, summary: v.s || '', src: v.src || '', cat: v.c || '', time: v.tm || '', url: v.u || '', date: U.today(), fav: false });
        }
        S.save(); draw();
      });
    }

    draw();
  }

  /* 时事速览：示例热点标题池（无后端时用于占位，可手动编辑替换为真实榜单） */
  var HOT_POOL = {
    '时政': ['国务院常务会议部署稳增长举措', '中央经济工作会议释放重要信号', '多部委联合发文推进民生保障', '重要会议审议通过多项改革方案', '权威解读最新政策落地路径', '地方两会密集召开谋划新年目标', '专项督查推动政策落实见效', '重大项目集中开工提振信心', '深化"放管服"改革优化营商环境', '基层治理创新经验获推广'],
    '财经': ['A股三大指数集体收涨北向资金净流入', '央行开展逆回购操作维护流动性', '新能源板块领涨科技股表现活跃', '多家上市公司披露业绩预告', '人民币汇率保持基本稳定', '楼市新政落地一线城市成交回暖', '大宗商品价格震荡黄金续创新高', '消费复苏带动服务业景气回升', '专家解读最新宏观经济数据', '基金发行回暖机构看好后市'],
    '国际': ['多国领导人就地区局势通话', '国际油价大幅波动引发关注', '全球主要股市涨跌互现', '重要国际会议达成多项共识', '外媒聚焦中国经济增长前景', '地区冲突各方寻求外交解决', '国际组织发布最新经济展望', '跨国合作项目取得新进展', '全球供应链持续恢复', '多边贸易谈判迎来关键节点'],
    '科技': ['国产大模型能力再迎重要升级', '芯片产业链自主创新加速突破', '新一代智能手机发布引发热议', '人工智能应用落地千行百业', '航天任务圆满成功刷新纪录', '新能源汽车渗透率持续走高', '量子计算研究取得阶段性成果', '开源社区迎来重要版本更新', '数据要素市场建设提速', '科技企业加码研发投入'],
    '民生': ['多地出台措施稳就业促增收', '医保目录调整惠及更多患者', '教育减负政策落地见效', '春运客流创新高出行更便捷', '养老服务体系持续完善', '食品安全监管力度再加强', '保障性住房建设稳步推进', '气象部门发布最新天气预警', '文旅消费市场持续升温', '社区服务便民举措获好评'],
    '热点': ['热搜话题引发全网热议', '正能量事件温暖人心', '权威辟谣澄清不实信息', '突发事件最新进展通报', '公众人物回应社会关切', '城市新地标正式亮相', '传统文化焕发新活力', '科普知识刷屏朋友圈', '暖心故事传递真情', '实用生活指南受追捧']
  };

  /* 今日时事速览：中性「示例」内容池（纯前端、按日期轮换、不碰政治敏感题材、不联网）
     明确标注为示例占位，可在卡片上点编辑替换为真实新闻。 */
  var NEWS_TODAY_POOL = [
    { title: '国产开源大模型发布新版本，推理效率提升约三成', summary: '多家团队联合发布新一代开源大模型，官方测试显示在同等算力下推理速度提升约 30%，并优化了长文本与多语言支持，已向开发者开放权重下载。', src: '科技前沿', cat: '科技', time: '08:00', url: 'https://www.news.cn/' },
    { title: '新一代折叠屏手机上市，机身轻薄度再创新低', summary: '厂商发布最新折叠屏旗舰，展开厚度降至约 4.5 毫米，铰链寿命提升至 50 万次，并配备高亮度护眼屏，首销预约量同比走高。', src: '科技前沿', cat: '科技', time: '08:05', url: 'https://www.news.cn/' },
    { title: '商业航天企业完成一箭多星发射，入轨精度获验证', summary: '民营火箭公司成功实施一箭多星发射，将多颗遥感与通信试验卫星送入预定轨道，入轨精度达到设计指标，商业发射节奏进一步加快。', src: '科技前沿', cat: '科技', time: '08:10', url: 'https://www.news.cn/' },
    { title: '人形机器人量产线投产，单台成本下降明显', summary: '首条人形机器人小批量量产线正式投产，通过模块化设计与国产供应链替代，整机成本较样机下降约四成，主要面向工业巡检与仓储场景。', src: '科技前沿', cat: '科技', time: '08:15', url: 'https://www.news.cn/' },
    { title: '量子通信骨干网扩容，城域间密钥分发更稳定', summary: '科研团队完成量子通信骨干网新一轮扩容，城域节点间密钥分发成功率与稳定性显著提升，为金融、政务等高安全场景提供底层支撑。', src: '科技前沿', cat: '科技', time: '08:20', url: 'https://www.news.cn/' },
    { title: '前7月社会消费品零售总额稳步回升，服务消费亮眼', summary: '统计数据显示，前 7 月社会消费品零售总额同比增长，其中餐饮、文旅、健身等服务类消费增速领先，居民消费结构持续升级。', src: '财经观察', cat: '经济', time: '08:25', url: 'https://www.news.cn/' },
    { title: '新能源汽车出口保持高增长，海外市场份额扩大', summary: '行业报告显示，新能源汽车出口延续高增长态势，在欧洲与东南亚市场渗透率提升，电池与智能化配置成为主要竞争力。', src: '财经观察', cat: '经济', time: '08:30', url: 'https://www.news.cn/' },
    { title: '暑期文旅消费火热，多地推出惠民门票政策', summary: '暑期出行旺季带动文旅消费，多个景区推出夜间门票优惠与联票折扣，博物馆、演艺市场客流同比增长明显。', src: '财经观察', cat: '经济', time: '08:35', url: 'https://www.news.cn/' },
    { title: '快递业务量再创新高，农村寄递网络持续完善', summary: '邮政数据显示快递日均处理量再创新高，村级寄递物流综合服务站覆盖率提升，农产品上行与工业品下乡双向通道进一步畅通。', src: '财经观察', cat: '经济', time: '08:40', url: 'https://www.news.cn/' },
    { title: '人工智能带动算力需求，数据中心绿色化提速', summary: '随着大模型应用落地，智算中心建设升温，液冷、余热回收等节能技术加速普及，单位算力能耗持续下降。', src: '财经观察', cat: '经济', time: '08:45', url: 'https://www.news.cn/' },
    { title: '多地发布高温健康提示，建议错峰户外作业', summary: '气象部门联合卫健机构发布高温健康提示，建议户外劳动者避开正午时段、保证补水与休息，重点人群注意防暑降温。', src: '生活指南', cat: '生活', time: '08:50', url: 'https://www.news.cn/' },
    { title: '夏季用电高峰来临，电网负荷创年内新高', summary: '受持续高温影响，多地电网负荷创年内新高，电力系统通过跨省互济与需求响应保障供应，未出现大面积限电。', src: '生活指南', cat: '生活', time: '08:55', url: 'https://www.news.cn/' },
    { title: '城市夜经济升温，便民集市延长营业时间', summary: '多个城市延长便民集市与特色街区营业时间，引入非遗展演与轻餐饮，带动周边就业与在地消费。', src: '生活指南', cat: '生活', time: '09:00', url: 'https://www.news.cn/' },
    { title: '新版生活垃圾分类指南发布，可回收物范围扩围', summary: '住建部门更新生活垃圾分类指引，进一步明确可回收物与有害垃圾界定，并在部分社区试点智能回收箱。', src: '生活指南', cat: '生活', time: '09:05', url: 'https://www.news.cn/' },
    { title: '台风路径调整，东南沿海需防范强风雨', summary: '气象台更新台风预报，路径较此前偏东，提醒沿海渔船回港避风、加固设施，相关部门启动防汛防风应急响应。', src: '天气通', cat: '天气', time: '09:10', url: 'https://www.news.cn/' },
    { title: '北方迎来入汛后最强降雨，多地启动应急响应', summary: '气象部门预报北方部分地区将出现入汛以来最强降雨过程，需防范城市内涝与山洪地质灾害，出行注意安全。', src: '天气通', cat: '天气', time: '09:15', url: 'https://www.news.cn/' },
    { title: '南方持续晴热，气象台发布高温橙色预警', summary: '南方多地连续晴热，气象台发布高温橙色预警，提醒公众减少午后户外活动，户外作业做好防暑措施。', src: '天气通', cat: '天气', time: '09:20', url: 'https://www.news.cn/' },
    { title: '国家游泳队世锦赛斩获多金，年轻选手表现抢眼', summary: '游泳世锦赛落幕，国家游泳队收获多枚金牌，多名"00 后"选手刷新个人最好成绩，梯队建设成效显现。', src: '体育周刊', cat: '体育', time: '09:25', url: 'https://www.news.cn/' },
    { title: '足球联赛下半程开战，争冠保级悬念升级', summary: '足球顶级联赛下半程打响，积分榜中游竞争激烈，争冠与保级形势悬念升级，球迷关注度持续走高。', src: '体育周刊', cat: '体育', time: '09:30', url: 'https://www.news.cn/' },
    { title: '马拉松大众参赛热情高涨，多地赛事名额秒罄', summary: '秋季马拉松进入报名季，多地赛事名额迅速报满，路跑经济带动训练、装备与文旅消费。', src: '体育周刊', cat: '体育', time: '09:35', url: 'https://www.news.cn/' },
    { title: '博物馆暑期夜场预约火爆，文创产品成新宠', summary: '多家博物馆加开暑期夜场并上新文创，年轻观众占比提升，"展览+文创"带动文化消费新场景。', src: '文化视界', cat: '文化', time: '09:40', url: 'https://www.news.cn/' },
    { title: '非遗市集进社区，传统手工艺走近年轻人', summary: '非物质文化遗产市集走进社区，剪纸、扎染、陶艺等传统技艺现场体验，吸引不少年轻人参与打卡。', src: '文化视界', cat: '文化', time: '09:45', url: 'https://www.news.cn/' },
    { title: '国产动画电影票房口碑双丰收，传统文化焕新', summary: '暑期档一部国产动画电影票房与口碑双线走高，以传统神话为底色进行现代表达，带动周边与文旅联动。', src: '文化视界', cat: '文化', time: '09:50', url: 'https://www.news.cn/' },
    { title: '专家建议暑期规律作息，青少年近视防控正当时', summary: '眼科专家建议暑期控制屏幕时长、增加户外活动，并定期视力检查，家校协同做好青少年近视防控。', src: '健康参考', cat: '健康', time: '09:55', url: 'https://www.news.cn/' }
  ];

  /* ============ 时事速览：聚合资讯源热点榜单 ============ */
  function newsSpeed(mount) {
    var s = S.get();
    if (!s.newsTabs || !s.newsTabs.length) s.newsTabs = ['时政', '财经', '国际', '科技', '民生', '订阅'];
    if (!s.newsFeeds) s.newsFeeds = [];
    if (!s.newsHot) s.newsHot = {};
    var curTab = W.__newsTab || s.newsTabs[0];
    if (s.newsTabs.indexOf(curTab) < 0) curTab = s.newsTabs[0];
    var manage = false;

    function genHot(feed, date) {
      var pool = HOT_POOL[feed.tab] || HOT_POOL['热点'];
      var start = (date.charCodeAt(8) + date.charCodeAt(9)) % pool.length; // 按日期轻微轮换，模拟"更新"
      var items = [];
      for (var i = 0; i < 10; i++) {
        var t = pool[(start + i) % pool.length];
        items.push({ title: t, url: feed.home || '', hot: (128 - i * 9) + '万' });
      }
      return { date: date, ts: Date.now(), items: items, demo: true };
    }
    /* 每日 7:00 自动刷新：未到时间保留昨日版本 */
    function autoRefresh() {
      var today = U.today(), due = new Date().getHours() >= 7, changed = false;
      s.newsFeeds.forEach(function (f) {
        var h = s.newsHot[f.id];
        if (!h) { s.newsHot[f.id] = genHot(f, today); changed = true; }
        else if (due && h.date !== today) { s.newsHot[f.id] = genHot(f, today); changed = true; }
      });
      if (changed) S.save();
    }
    autoRefresh();

    /* 弹窗：某资讯源热度前十榜单 */
    function openHot(feed) {
      /* 浏览联动：标记时事阅读打卡 + 复盘统计 */
      var ck = S.ck('news'); if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '时事阅读打卡' });
      var d0 = U.today(); if (!ck.rec[d0]) ck.rec[d0] = []; if (ck.rec[d0].indexOf(ck.tasks[0].id) < 0) ck.rec[d0].push(ck.tasks[0].id);
      if (!s.metrics[d0]) s.metrics[d0] = {}; s.metrics[d0].news = (s.metrics[d0].news || 0) + 3;
      S.save();

      function build() {
        var h = s.newsHot[feed.id] || genHot(feed, U.today());
        var box = el('div');
        var top = el('div', { class: 'hot-top' });
        top.appendChild(el('div', { class: 'hot-src' }, (feed.icon || '📰') + ' ' + esc(feed.name)));
        var when = new Date(h.ts || Date.now());
        var ws = ('0' + when.getHours()).slice(-2) + ':' + ('0' + when.getMinutes()).slice(-2);
        var right = el('div', { class: 'hot-right' });
        right.appendChild(el('span', { class: 'hot-time' }, '🕒 ' + h.date + ' ' + ws + ' 更新'));
        right.appendChild(C.btn('🔄 刷新', 'sm', function () { s.newsHot[feed.id] = genHot(feed, U.today()); S.save(); render2(); }));
        top.appendChild(right);
        box.appendChild(top);
        if (h.demo) box.appendChild(el('div', { class: 'hot-demo' }, '⚠️ 当前为示例榜单占位。点「✏️ 维护本源」可粘贴该平台真实前十热点；点「🌐 打开平台」查看实时榜单。'));
        var ol = el('div', { class: 'hot-list' });
        (h.items || []).forEach(function (it, i) {
          var row = el('div', { class: 'hot-item' });
          row.appendChild(el('span', { class: 'hot-no' + (i < 3 ? ' top' : '') }, (i + 1)));
          var main = el('div', { class: 'hot-main' });
          var tt = el('div', { class: 'hot-tt' }, esc(it.title));
          tt.onclick = function () { if (main._long && main._long()) return; U.open(it.url || feed.home); };
          main.appendChild(tt);
          if (it.hot) main.appendChild(el('span', { class: 'hot-heat' }, '🔥 ' + esc(it.hot)));
          row.appendChild(main);
          var ops = el('div', { class: 'hot-ops' });
          ops.appendChild(C.btn('📋', 'sm', function (e) { e.stopPropagation(); U.copy(it.title + (it.url ? '\n' + it.url : '')); }));
          ops.appendChild(C.btn('⭐', 'sm', function (e) {
            e.stopPropagation();
            var favs = S.get().favs || [];
            favs.unshift({ id: U.uid(), kind: 'news', ref: '', title: it.title, sub: feed.name, icon: '📰', url: it.url || feed.home, ts: Date.now() });
            S.save(); U.toast('已收藏该条');
          }));
          row.appendChild(ops);
          /* 长按 → 快速添加至要闻摘记 */
          U.onLongPress(main, function () {
            s.newsNotes = s.newsNotes || [];
            s.newsNotes.unshift({ id: U.uid(), title: it.title, body: '来自「' + feed.name + '」热点榜单', url: it.url || feed.home, tags: [feed.tab || '热点'], date: U.today(), ts: Date.now() });
            S.save(); U.toast('已添加到要闻摘记');
          });
          main._long = main._wasLong;
          ol.appendChild(row);
        });
        box.appendChild(ol);
        var bot = el('div', { class: 'row mt8' });
        bot.appendChild(C.btn('✏️ 维护本源', 'sm', function () {
          U.modal({ title: '维护「' + feed.name + '」前十', html: '<div class="small muted mb8">每行一条：标题 或 标题|链接（最多 10 条）</div>', fields: [{ key: 'txt', label: '热点榜单', type: 'textarea', rows: 10, value: (h.items || []).map(function (x) { return x.title + (x.url && x.url !== feed.home ? '|' + x.url : ''); }).join('\n') }], okText: '保存' })
            .then(function (r) {
              if (!r) return;
              var items = [];
              String(r.txt).split(/\r?\n/).forEach(function (ln) { ln = ln.trim(); if (!ln) return; var i = ln.indexOf('|'); if (i < 0) items.push({ title: ln, url: feed.home, hot: '' }); else items.push({ title: ln.slice(0, i).trim(), url: ln.slice(i + 1).trim(), hot: '' }); });
              s.newsHot[feed.id] = { date: U.today(), ts: Date.now(), items: items.slice(0, 10), demo: false }; S.save(); render2();
            });
        }));
        bot.appendChild(C.btn('🌐 打开平台', 'sm', function () { U.open(feed.home); }));
        box.appendChild(bot);
        return box;
      }
      function render2() { var r = document.getElementById('hot-body'); if (r) { r.innerHTML = ''; r.appendChild(build()); } }
      U.modal({ title: '🔥 热点榜单', html: '<div id="hot-body"></div>', okText: '关闭', wide: true });
      setTimeout(render2, 30);
    }

    function draw() {
      mount.innerHTML = '';
      /* 顶部标签栏 */
      var tabsRow = el('div', { class: 'ns-tabs' });
      s.newsTabs.forEach(function (t) {
        var chip = el('button', { class: 'ns-tab' + (t === curTab ? ' on' : '') }, esc(t));
        chip.onclick = function () { curTab = t; W.__newsTab = t; draw(); };
        tabsRow.appendChild(chip);
      });
      var mng = el('button', { class: 'ns-tab ns-mng' }, manage ? '✅' : '⚙');
      mng.onclick = function () { manage = !manage; draw(); };
      tabsRow.appendChild(mng);
      mount.appendChild(tabsRow);

      if (manage) {
        var mrow = el('div', { class: 'row mb8' });
        mrow.appendChild(C.btn('＋ 新增标签', 'sm', function () {
          U.prompt('新增标签', '标签名').then(function (v) { if (v) { s.newsTabs.push(v); S.save(); draw(); } });
        }));
        if (curTab && !/^(时政|财经|国际|科技|民生)$/.test(curTab)) {
          mrow.appendChild(C.btn('🗑 删除「' + curTab + '」', 'sm dan', function () {
            s.newsTabs = s.newsTabs.filter(function (x) { return x !== curTab; }); curTab = s.newsTabs[0]; S.save(); draw();
          }));
        }
        mount.appendChild(mrow);
      }

      /* 资讯源入口（一行资源卡片，可增删排序） */
      mount.appendChild(C.subTitle('资讯源 · ' + curTab, C.btn('＋ 添加源', 'sm', function () {
        U.modal({ title: '添加资讯源', fields: [{ key: 'ic', label: '图标 emoji', value: '📰' }, { key: 'n', label: '名称 / APP' }, { key: 'u', label: '榜单/首页网址' }, { key: 'tab', label: '归属标签', type: 'select', value: curTab, options: s.newsTabs.map(function (t) { return { v: t, t: t }; }) }] })
          .then(function (v) { if (v && v.n) { s.newsFeeds.push({ id: U.uid(), icon: v.ic || '📰', name: v.n, home: v.u, tab: v.tab || curTab }); S.save(); draw(); } });
      })));
      var feeds = s.newsFeeds.filter(function (f) { return (f.tab || '') === curTab; });
      if (!feeds.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">📭</span>「' + esc(curTab) + '」还没有资讯源，点右上「＋ 添加源」'));
      var strip = el('div', { class: 'ns-strip' });
      feeds.forEach(function (f) {
        var card = el('div', { class: 'ns-feed' });
        card.appendChild(el('div', { class: 'ns-feed-ic' }, f.icon || '📰'));
        card.appendChild(el('div', { class: 'ns-feed-n' }, esc(f.name)));
        if (!manage) card.onclick = function () { openHot(f); };
        else {
          var ops = el('div', { class: 'ns-feed-ops' });
          ops.appendChild(C.btn('◀', 'sm', function (e) { e.stopPropagation(); move(f, -1); }));
          ops.appendChild(C.btn('▶', 'sm', function (e) { e.stopPropagation(); move(f, 1); }));
          ops.appendChild(C.btn('🗑', 'sm dan', function (e) { e.stopPropagation(); s.newsFeeds = s.newsFeeds.filter(function (x) { return x.id !== f.id; }); S.save(); draw(); }));
          card.appendChild(ops);
        }
        strip.appendChild(card);
      });
      mount.appendChild(strip);

      mount.appendChild(el('div', { class: 'small muted mt6' }, '💡 点资讯源卡片 → 弹出该平台热度前十榜单；长按榜单单条可存入「要闻摘记」，⭐ 收藏、📋 复制标题、点标题跳原文。每日 7:00 自动刷新，也可手动刷新。'));
    }
    function move(f, dir) {
      var i = s.newsFeeds.indexOf(f), j = i + dir;
      while (j >= 0 && j < s.newsFeeds.length && (s.newsFeeds[j].tab || '') !== curTab) j += dir;
      if (j < 0 || j >= s.newsFeeds.length) return;
      var t = s.newsFeeds[i]; s.newsFeeds[i] = s.newsFeeds[j]; s.newsFeeds[j] = t; S.save(); draw();
    }
    draw();
  }

  /* ============ 随心 ============ */
  W.P.free = function (v) {
    var s = S.get();
    if (!s.freeLinks) s.freeLinks = [];
    var freeTab = 'note';
    var box = el('div');

    function draw() {
      box.innerHTML = '';
      var seg = el('div', { class: 'seg mb8' });
      var t1 = el('button', { class: freeTab === 'note' ? 'on' : '' }, '📝 随手记');
      t1.onclick = function () { freeTab = 'note'; draw(); }; seg.appendChild(t1);
      var t2 = el('button', { class: freeTab === 'link' ? 'on' : '' }, '🔖 书签');
      t2.onclick = function () { freeTab = 'link'; draw(); }; seg.appendChild(t2);
      box.appendChild(seg);
      if (freeTab === 'link') { drawLinks(); return; }
      drawNotes();
    }

    /* ----- 随手记（原有） ----- */
    function drawNotes() {
      var cats = ['随笔', '碎碎念', '灵感', '感悟', '摘抄', '想法', '临时清单', '情绪'];
      var cat = '';
      var r = el('div', { class: 'row mb8' });
      var ip = el('textarea', { class: 'ta', rows: 2, placeholder: '此刻在想什么…（回车快速保存）' });
      var add = C.btn('记下', 'pri', function () {
        var t = ip.value.trim(); if (!t) return;
        s.free.unshift({ id: U.uid(), text: t, cat: cat || '随笔', mood: '', ts: Date.now(), date: U.today() });
        S.save(); draw();
      });
      ip.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add.click(); } };
      r.appendChild(ip); r.appendChild(add);
      box.appendChild(r);
      var seg2 = el('div', { class: 'seg mb8' });
      var all = el('button', { class: cat ? '' : 'on' }, '全部');
      all.onclick = function () { cat = ''; draw(); }; seg2.appendChild(all);
      var used = {}; s.free.forEach(function (f) { used[f.cat] = 1; });
      cats.concat(Object.keys(used)).filter(function (x, i, a) { return a.indexOf(x) === i; }).forEach(function (c) {
        var b = el('button', { class: cat === c ? 'on' : '' }, esc(c));
        b.onclick = function () { cat = (cat === c ? '' : c); draw(); }; seg2.appendChild(b);
      });
      var nc = el('button', null, '＋分类');
      nc.onclick = function () { U.prompt('新建分类', '分类名').then(function (x) { if (x) { cats.push(x); cat = x; draw(); } }); };
      seg2.appendChild(nc);
      box.appendChild(seg2);

      var ops = el('div', { class: 'wrap mb8' });
      ops.appendChild(C.btn('🖼️ 图文记录', 'sm', function () {
        U.pickFile('image/*').then(function (f) {
          if (!f) return;
          U.readImage(f, 1000).then(function (d) {
            var id = U.uid();
            U.Blobs.put(id, d).then(function () {
              U.prompt('配文', '说点什么', '').then(function (t) {
                s.free.unshift({ id: U.uid(), text: t || '', img: id, cat: cat || '随笔', ts: Date.now(), date: U.today() });
                S.save(); draw();
              });
            });
          });
        });
      }));
      ops.appendChild(C.btn('☑️ 待办清单', 'sm', function () {
        U.prompt('新建待办', '内容').then(function (t) { if (t) { s.free.unshift({ id: U.uid(), text: t, todo: true, done: false, cat: '临时清单', ts: Date.now(), date: U.today() }); S.save(); draw(); } });
      }));
      box.appendChild(ops);

      var list = s.free.filter(function (f) { return !cat || f.cat === cat; });
      if (!list.length) box.appendChild(el('div', { class: 'empty' }, '<span class="ei">🕊️</span>空空如也，随手写点什么'));
      var lastDate = '';
      list.forEach(function (f) {
        if (f.date !== lastDate) { lastDate = f.date; box.appendChild(el('div', { class: 'small muted mt10' }, f.date + ' 周' + U.cnWeek(f.date))); }
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        h.appendChild(el('span', { class: 'tag pri' }, esc(f.cat)));
        if (f.mood) h.appendChild(el('span', { class: 'tag' }, f.mood));
        h.appendChild(el('span', { class: 'small muted' }, new Date(f.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })));
        h.appendChild(el('div', { class: 'grow' }));
        var mm = el('button', { class: 'iconbtn' }, '⋯'); h.appendChild(mm);
        c.appendChild(h);
        if (f.todo) {
          var t = el('div', { class: 'tk' + (f.done ? ' done' : ''), style: 'background:none;border:0;padding:0' });
          var ck = el('div', { class: 'ck' }, '✓');
          ck.onclick = function () { f.done = !f.done; S.save(); draw(); };
          t.appendChild(ck); t.appendChild(el('div', { class: 'tk-t' }, esc(f.text)));
          c.appendChild(t);
        } else c.appendChild(el('div', { class: 'qt' }, esc(f.text)));
        if (f.img) c.appendChild(C.mediaImg(f.img));
        mm.onclick = function () {
          U.sheet('操作', [{ v: 'm', text: '标记心情', icon: '😀' }, { v: 'e', text: '编辑', icon: '✏️' }, { v: 'c', text: '复制', icon: '📋' }, { v: 'd', text: '删除', icon: '🗑️' }]).then(function (a) {
            if (a === 'm') U.sheet('选择心情', ['😄', '🙂', '😌', '😔', '😢', '😤', '🥰', '🤯'].map(function (e2) { return { v: e2, text: e2 }; })).then(function (x) { if (x) { f.mood = x; S.save(); draw(); } });
            else if (a === 'e') U.modal({ title: '编辑', fields: [{ key: 't', label: '内容', type: 'textarea', rows: 5, value: f.text }, { key: 'c', label: '分类', value: f.cat }] }).then(function (x) { if (x) { f.text = x.t; f.cat = x.c; S.save(); draw(); } });
            else if (a === 'c') U.copy(f.text);
            else if (a === 'd') { s.free = s.free.filter(function (x) { return x.id !== f.id; }); S.save(); draw(); }
          });
        };
        box.appendChild(c);
      });
    }

    /* ----- 书签：标签 + 标题 + 链接 + 备注，可展开 ----- */
    function drawLinks() {
      box.appendChild(C.subTitle('书签：每行一个标题，点开看链接与备注'));
      box.appendChild(C.btn('＋ 新书签', 'pri blk mb8', function () { editLink(null); }));
      var list = s.freeLinks;
      if (!list.length) box.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔖</span>还没有书签，把常去的 APP / 网址存这里'));
      list.forEach(function (it) {
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        (it.tags || []).forEach(function (tg) { h.appendChild(el('span', { class: 'tag pri' }, '#' + esc(tg))); });
        h.appendChild(el('div', { class: 'grow' }));
        var chev = el('button', { class: 'iconbtn' }, it.open ? '▴' : '▾'); h.appendChild(chev);
        c.appendChild(h);
        c.appendChild(el('div', { style: 'font-weight:650;font-size:14px' }, esc(it.title)));
        if (it.open) {
          if (it.url) { var wd = el('div', { class: 'mt6' }); wd.appendChild(C.btn('🔗 打开链接', 'sm', function () { U.open(it.url); })); c.appendChild(wd); }
          if (it.remark) c.appendChild(el('div', { class: 'qt small', style: 'color:#6b7285;margin-top:6px;white-space:pre-wrap' }, esc(it.remark)));
          var ops = el('div', { class: 'wrap mt6' });
          ops.appendChild(C.btn('✏️ 编辑', 'sm', function () { editLink(it); }));
          ops.appendChild(C.btn('📋 复制', 'sm', function () { U.copy(it.title + '\n' + (it.url || '')); }));
          ops.appendChild(C.btn('🗑', 'sm dan', function () { s.freeLinks = s.freeLinks.filter(function (x) { return x.id !== it.id; }); S.save(); drawLinks(); }));
          c.appendChild(ops);
        }
        c.onclick = function (e) { if (e.target.closest('.btn') || e.target.closest('.ops')) return; it.open = !it.open; S.save(); drawLinks(); };
        box.appendChild(c);
      });
    }
    function editLink(it) {
      U.modal({
        title: it ? '编辑书签' : '新书签',
        fields: [
          { key: 'tags', label: '标签（逗号分隔）', value: it ? (it.tags || []).join(',') : '' },
          { key: 'title', label: '标题', value: it ? it.title : '' },
          { key: 'url', label: '跳转链接 / APP Scheme', value: it ? it.url : '' },
          { key: 'remark', label: '备注', type: 'textarea', rows: 3, value: it ? it.remark : '' }
        ]
      }).then(function (v) {
        if (!v) return;
        var tags = v.tags ? v.tags.split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean) : [];
        if (it) { it.tags = tags; it.title = v.title; it.url = v.url; it.remark = v.remark; }
        else s.freeLinks.unshift({ id: U.uid(), tags: tags, title: v.title, url: v.url, remark: v.remark, open: false, date: U.today(), ts: Date.now() });
        S.save(); drawLinks();
      });
    }

    draw(); v.appendChild(box);
  };

  /* ============ 旅行 ============ */
  W.P.travel = function (v) {
    var s = S.get();
    var cur = null;
    var box = el('div'); v.appendChild(box);
    function draw() {
      box.innerHTML = '';
      if (cur) { detail(s.trips.filter(function (t) { return t.id === cur; })[0]); return; }
      box.appendChild(C.statRow([
        { value: s.trips.length, label: '行程档案' },
        { value: s.trips.filter(function (t) { return t.done; }).length, label: '已完成', color: '#2fbf87' },
        { value: '¥' + s.trips.reduce(function (a, t) { return a + (t.bills || []).reduce(function (x, y) { return x + (+y.amount || 0); }, 0); }, 0), label: '总花销', color: '#f4635e' }
      ]));
      box.appendChild(C.btn('＋ 新建行程档案', 'pri blk mb8', function () {
        U.modal({
          title: '新建行程', fields: [
            { key: 'n', label: '目的地 / 行程名称' }, { key: 'd', label: '出行天数', type: 'number', value: 3 },
            { key: 's', label: '出发日期', type: 'date', value: U.today() }
          ]
        }).then(function (x) {
          if (!x) return;
          s.trips.unshift({ id: U.uid(), name: x.n, days: +x.d || 1, start: x.s, want: true, done: false, route: '', traffic: '', hotel: '', spots: [], diary: [], bills: [], photos: [] });
          S.save(); draw();
        });
      }));
      if (!s.trips.length) box.appendChild(el('div', { class: 'empty' }, '<span class="ei">✈️</span>还没有行程，先建一个"想去"清单吧'));
      s.trips.forEach(function (t) {
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        h.appendChild(el('span', { class: 'tag ' + (t.done ? 'ok' : 'pri') }, t.done ? '已去' : '想去'));
        h.appendChild(el('span', { class: 'tag' }, t.start + ' · ' + t.days + '天'));
        h.appendChild(el('div', { class: 'grow' }));
        h.appendChild(el('span', { class: 'small muted' }, '¥' + (t.bills || []).reduce(function (a, b) { return a + (+b.amount || 0); }, 0)));
        c.appendChild(h);
        c.appendChild(el('div', { style: 'font-weight:700;font-size:14px' }, esc(t.name)));
        c.appendChild(el('div', { class: 'small muted mt6' }, '景点 ' + (t.spots || []).length + ' · 日记 ' + (t.diary || []).length + ' · 照片 ' + (t.photos || []).length));
        c.onclick = function () { cur = t.id; draw(); };
        box.appendChild(c);
      });
    }
    function detail(t) {
      if (!t) { cur = null; draw(); return; }
      var back = C.btn('‹ 返回行程列表', 'sm mb8', function () { cur = null; draw(); });
      box.appendChild(back);
      box.appendChild(el('div', { style: 'font-size:17px;font-weight:750;margin-bottom:8px' }, esc(t.name)));
      var r = el('div', { class: 'wrap mb8' });
      r.appendChild(C.btn(t.done ? '✅ 已去' : '📍 想去', 'sm', function () { t.done = !t.done; S.save(); draw(); }));
      r.appendChild(C.btn('✏️ 编辑基础信息', 'sm', function () {
        U.modal({
          title: '行程信息', fields: [
            { key: 'n', label: '名称', value: t.name }, { key: 'd', label: '天数', value: t.days }, { key: 's', label: '出发日期', type: 'date', value: t.start },
            { key: 'r', label: '路线规划', type: 'textarea', value: t.route }, { key: 'tr', label: '交通', value: t.traffic }, { key: 'h', label: '住宿', value: t.hotel }
          ]
        }).then(function (x) { if (x) { t.name = x.n; t.days = +x.d; t.start = x.s; t.route = x.r; t.traffic = x.tr; t.hotel = x.h; S.save(); draw(); } });
      }));
      r.appendChild(C.btn('🗑 删除行程', 'sm dan', function () { U.confirm('删除行程', t.name).then(function (ok) { if (ok) { s.trips = s.trips.filter(function (x) { return x.id !== t.id; }); cur = null; S.save(); draw(); } }); }));
      box.appendChild(r);

      box.appendChild(C.card({
        key: 'tp_plan_' + t.id, icon: '🗺️', title: '行程规划', sub: '路线 / 交通 / 住宿 / 打卡景点', open: true,
        render: function (b) {
          b.appendChild(el('div', { class: 'small', style: 'line-height:1.8' },
            '<b>路线：</b>' + esc(t.route || '未填写') + '<br><b>交通：</b>' + esc(t.traffic || '未填写') + '<br><b>住宿：</b>' + esc(t.hotel || '未填写')));
          b.appendChild(C.subTitle('待打卡景点', C.btn('＋', 'sm', function () {
            U.prompt('添加景点', '景点名称').then(function (x) { if (x) { t.spots.push({ id: U.uid(), name: x, done: false }); S.save(); draw(); } });
          })));
          (t.spots || []).forEach(function (sp) {
            var row = el('div', { class: 'tk' + (sp.done ? ' done' : '') });
            var ck = el('div', { class: 'ck' }, '✓');
            ck.onclick = function () { sp.done = !sp.done; S.save(); draw(); };
            row.appendChild(ck); row.appendChild(el('div', { class: 'tk-t' }, esc(sp.name)));
            var d = el('button', { class: 'iconbtn' }, '🗑');
            d.onclick = function () { t.spots = t.spots.filter(function (x) { return x.id !== sp.id; }); S.save(); draw(); };
            row.appendChild(d); b.appendChild(row);
          });
        }
      }));

      box.appendChild(C.card({
        key: 'tp_log_' + t.id, icon: '📔', title: '旅行记录', sub: '日记 / 照片 / 美食 / 心得',
        render: function (b) {
          b.appendChild(C.btn('＋ 写一篇旅途日记', 'sm mb8', function () {
            U.modal({ title: '旅途日记', fields: [{ key: 't', label: '标题' }, { key: 'b', label: '内容', type: 'textarea', rows: 6 }] })
              .then(function (x) { if (x) { t.diary.unshift({ id: U.uid(), title: x.t, body: x.b, date: U.today() }); S.save(); draw(); } });
          }));
          b.appendChild(C.btn('📷 上传照片', 'sm mb8', function () {
            U.pickFile('image/*', true).then(function (fs) {
              if (!fs || !fs.length) return;
              Promise.all(fs.map(function (f) {
                return U.readImage(f, 1000).then(function (d) { var id = U.uid(); return U.Blobs.put(id, d).then(function () { t.photos.push(id); }); });
              })).then(function () { S.save(); draw(); });
            });
          }));
          if ((t.photos || []).length) {
            var g = el('div', { class: 'thumbs' });
            t.photos.forEach(function (p) {
              var im = el('img');
              U.Blobs.get(p).then(function (d) { if (d) im.src = d; });
              im.onclick = function () { U.Blobs.get(p).then(function (d) { U.modal({ title: '照片', html: '<img src="' + d + '" style="width:100%;border-radius:10px">', hideCancel: true, okText: '关闭' }); }); };
              g.appendChild(im);
            });
            b.appendChild(g);
          }
          (t.diary || []).forEach(function (dd) {
            var c = el('div', { class: 'q' });
            c.appendChild(el('div', { class: 'qh' }, '<span class="tag">' + dd.date + '</span>'));
            c.appendChild(el('div', { style: 'font-weight:650' }, esc(dd.title)));
            c.appendChild(el('div', { class: 'qt small', style: 'color:#6b7285' }, esc(dd.body)));
            var del = C.btn('删除', 'sm mt6', function () { t.diary = t.diary.filter(function (x) { return x.id !== dd.id; }); S.save(); draw(); });
            c.appendChild(del);
            b.appendChild(c);
          });
        }
      }));

      box.appendChild(C.card({
        key: 'tp_bill_' + t.id, icon: '💰', title: '花销记账 & 复盘', sub: '分类记账 + 花销图表',
        render: function (b) {
          b.appendChild(C.btn('＋ 记一笔', 'sm mb8', function () {
            U.modal({
              title: '记账', fields: [
                { key: 'n', label: '项目' }, { key: 'a', label: '金额 ¥', type: 'number' },
                { key: 'c', label: '分类', type: 'select', value: '餐饮', options: ['交通', '住宿', '餐饮', '门票', '购物', '其他'].map(function (x) { return { v: x, t: x }; }) }
              ]
            }).then(function (x) { if (x) { t.bills.push({ id: U.uid(), name: x.n, amount: +x.a || 0, cat: x.c, date: U.today() }); S.save(); draw(); } });
          }));
          var by = {};
          (t.bills || []).forEach(function (bl) { by[bl.cat] = (by[bl.cat] || 0) + (+bl.amount || 0); });
          var ks = Object.keys(by);
          if (ks.length) {
            var cb = C.chartBox('花销分类（元）');
            cb.appendChild(C.svgBar(ks, [{ name: '花销', color: '#f4635e', data: ks.map(function (k) { return by[k]; }) }]));
            b.appendChild(cb);
          }
          (t.bills || []).forEach(function (bl) {
            var row = el('div', { class: 'it' });
            row.appendChild(el('div', { class: 'ii' }, '💴'));
            row.appendChild(el('div', { class: 'itx' }, '<div class="itt">' + esc(bl.name) + '</div><div class="its">' + esc(bl.cat) + ' · ' + bl.date + '</div>'));
            row.appendChild(el('div', { style: 'font-weight:700;color:#f4635e' }, '¥' + bl.amount));
            var d = el('button', { class: 'iconbtn' }, '🗑');
            d.onclick = function () { t.bills = t.bills.filter(function (x) { return x.id !== bl.id; }); S.save(); draw(); };
            row.appendChild(d);
            b.appendChild(row);
          });
          b.appendChild(C.subTitle('本次出行复盘'));
          b.appendChild(C.note('trip_' + t.id, '好玩的、踩坑的、下次想改进的…'));
        }
      }));
    }
    draw();
  };

  /* ============ 网址功能区 ============ */
  W.P.links = function (v) {
    var s = S.get();
    if (!s.linksCatOpen) s.linksCatOpen = {};
    var key = 'global';
    function draw() {
      v.innerHTML = '';
      v.appendChild(el('div', { class: 'small muted mb8' }, '按分类折叠管理常用网址；点击分类条可展开/收起，一个网址一个卡片。'));

      var list = S.links(key);
      var groups = {};
      list.forEach(function (l) { var c = l.tag || '未分类'; (groups[c] = groups[c] || []).push(l); });
      var cats = Object.keys(groups);
      if (!cats.length) v.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔗</span>还没有网址，点击下方添加'));

      cats.forEach(function (cat) {
        var open = s.linksCatOpen[cat] != null ? s.linksCatOpen[cat] : true;
        var box = el('div', { class: 'lk-cat' + (open ? ' open' : '') });
        var hd = el('div', { class: 'lk-cat-hd' });
        hd.appendChild(el('div', { class: 'ar' }, '▶'));
        hd.appendChild(el('div', { class: 'cat-name' }, esc(cat)));
        hd.appendChild(el('div', { class: 'cat-meta' }, groups[cat].length + ' 个'));
        hd.appendChild(el('div', { class: 'grow' }));
        var add = C.btn('＋', 'sm', function (e) { e.stopPropagation(); addLink(cat); });
        hd.appendChild(add);
        hd.onclick = function () { s.linksCatOpen[cat] = !open; S.save(); draw(); };
        box.appendChild(hd);
        var bd = el('div', { class: 'lk-cat-bd' });
        groups[cat].forEach(function (l) { bd.appendChild(linkRow(l, cat)); });
        box.appendChild(bd);
        v.appendChild(box);
      });

      var addAll = C.btn('＋ 添加网址', 'pri blk mt6', function () { addLink(); });
      v.appendChild(addAll);
      v.appendChild(el('div', { class: 'small muted mt6' }, '长按/右键条目可编辑，点击条目直接打开。'));

      v.appendChild(C.subTitle('分类网址收藏夹（多层文件夹）'));
      v.appendChild(C.tree('links_folder'));
    }
    function linkRow(l, cat) {
      var r = el('div', { class: 'lk-row' });
      r.appendChild(el('div', { class: 'lki' }, l.icon || '🔗'));
      var tx = el('div', { class: 'grow', style: 'min-width:0' });
      tx.appendChild(el('div', { class: 'lkt' }, esc(l.name)));
      tx.appendChild(el('div', { class: 'lku' }, esc(l.url)));
      r.appendChild(tx);
      var ops = el('div', { class: 'ops' });
      ops.appendChild(C.btn('打开', 'sm', function () { U.open(l.url); }));
      r.appendChild(ops);
      r.oncontextmenu = function (e) {
        e.preventDefault();
        U.modal({ title: '编辑网址', fields: [{ key: 'n', label: '名称', value: l.name }, { key: 'u', label: '网址', value: l.url }, { key: 'i', label: '图标', value: l.icon }, { key: 't', label: '分类', value: l.tag || cat }] })
          .then(function (v) { if (v) { l.name = v.n; l.url = v.u; l.icon = v.i; l.tag = v.t || '未分类'; S.save(); draw(); } });
      };
      r.onclick = function (e) { if (e.target.closest('.ops')) return; U.open(l.url); };
      return r;
    }
    function addLink(defaultCat) {
      U.modal({ title: '添加 APP / 网址', fields: [{ key: 'n', label: '名称' }, { key: 'u', label: '网址 / APP Scheme', ph: 'https://' }, { key: 'i', label: '图标 emoji', value: '🔗' }, { key: 't', label: '分类', value: defaultCat || '' }] })
        .then(function (v) {
          if (!v) return;
          var cat = v.t || '未分类';
          S.links(key).push({ id: U.uid(), name: v.n, url: v.u, icon: v.i || '🔗', tag: cat });
          s.linksCatOpen[cat] = true;
          S.save(); draw();
        });
    }
    draw();
  };

  /* ============ 语音转文字 ============ */
  W.P.stt = function (v) {
    var s = S.get();
    C.sectionPage(v, {
      id: 'stt',
      sections: [
        { key: 'stt_rec', icon: '🎙️', title: '录音 & 转写', sub: '实时录音转文字 / 本地音频上传 / 拍照上传', render: function (b) { recPanel(b); } },
        { key: 'stt_folder', icon: '🗂️', title: '分类文件夹', sub: '播客 / 课堂 / 演讲稿 / 口播脚本 / 碎碎念（可无限嵌套）', render: function (b) { b.appendChild(C.tree('stt')); } },
        {
          key: 'stt_tool', icon: '🔗', title: '外部软件 / 网址对接', sub: '录音工具、转写 APP、字幕工具、校对网站',
          render: function (b) { b.appendChild(C.linkgrid('stt_tool', { filter: true, tag: '转写' })); }
        },
        {
          key: 'stt_ck', icon: '✅', title: '打卡 & 产出统计', sub: '记录每日录音、转写、文稿整理',
          render: function (b) {
            b.appendChild(C.weekcheck('stt', { title: '语音转文字打卡' }));
            var total = s.stt.reduce(function (a, x) { return a + (x.text || '').length; }, 0);
            b.appendChild(C.statRow([{ value: s.stt.length, label: '文稿数' }, { value: total, label: '累计字数', color: '#5b6cff' }, { value: s.stt.filter(function (x) { return x.date === U.today(); }).length, label: '今日产出' }]));
            b.appendChild(C.tasklist('stt', { addText: '新增转写任务' }));
          }
        }
      ]
    });
  };
  function recPanel(mount) {
    var s = S.get();
    function draw() {
      mount.innerHTML = '';
      var ops = el('div', { class: 'wrap mb8' });
      var recBtn = C.btn('🎤 开始实时录音转写', 'pri', function () { start(); });
      ops.appendChild(recBtn);
      ops.appendChild(C.btn('📁 上传本地音频', 'sm', function () {
        U.pickFile('audio/*').then(function (f) {
          if (!f) return;
          U.readAsDataURL(f).then(function (d) {
            var id = U.uid();
            U.Blobs.put(id, d).then(function () {
              s.stt.unshift({ id: U.uid(), title: f.name, text: '', audio: id, date: U.today(), ts: Date.now(), folder: '' });
              S.save(); draw(); U.toast('已导入，可手动补写文稿或用外部工具转写');
            });
          });
        });
      }));
      ops.appendChild(C.btn('📷 拍照上传讲稿', 'sm', function () {
        U.pickFile('image/*').then(function (f) {
          if (!f) return;
          U.readImage(f, 1100).then(function (d) {
            var id = U.uid();
            U.Blobs.put(id, d).then(function () {
              s.stt.unshift({ id: U.uid(), title: '讲稿照片 ' + f.name, text: '', img: id, date: U.today(), ts: Date.now() });
              S.save(); draw();
            });
          });
        });
      }));
      ops.appendChild(C.btn('✍️ 手动新建文稿', 'sm', function () {
        U.modal({ title: '新建文稿', fields: [{ key: 't', label: '标题' }, { key: 'b', label: '内容', type: 'textarea', rows: 6 }] })
          .then(function (x) { if (x) { s.stt.unshift({ id: U.uid(), title: x.t, text: x.b, date: U.today(), ts: Date.now() }); S.save(); draw(); } });
      }));
      mount.appendChild(ops);
      var live = el('div', { class: 'small muted mb8' }, '实时转写基于浏览器语音识别（建议 Chrome / Edge），中文识别；同时会保存录音文件。');
      mount.appendChild(live);

      var rec, media, chunks = [];
      function start() {
        var r = U.SR('zh-CN');
        var text = '';
        if (r) {
          r.onresult = function (e) {
            text = '';
            for (var i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
            live.textContent = '转写中：' + text.slice(-120);
          };
          r.onerror = function () { live.textContent = '识别失败，请检查麦克风权限'; };
          r.onend = function () { finish(text); };
          r.start(); rec = r;
        } else { U.toast('不支持实时识别，将只录音'); }
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            chunks = []; media = new MediaRecorder(stream);
            media.ondataavailable = function (e) { chunks.push(e.data); };
            media.onstop = function () {
              var blob = new Blob(chunks, { type: 'audio/webm' });
              var fr = new FileReader();
              fr.onload = function () {
                var id = U.uid();
                U.Blobs.put(id, fr.result).then(function () { if (mount.__last) { mount.__last.audio = id; S.save(); draw(); } });
              };
              fr.readAsDataURL(blob);
              stream.getTracks().forEach(function (t) { t.stop(); });
            };
            media.start();
          }).catch(function () { });
        }
        recBtn.textContent = '⏹ 结束并保存';
        recBtn.onclick = function () { if (rec) rec.stop(); else finish(''); try { if (media && media.state === 'recording') media.stop(); } catch (e) { } };
      }
      function finish(text) {
        try { if (media && media.state === 'recording') media.stop(); } catch (e) { }
        var item = { id: U.uid(), title: '录音转写 ' + new Date().toLocaleString('zh-CN'), text: text || '', date: U.today(), ts: Date.now() };
        s.stt.unshift(item); mount.__last = item; S.save(); draw();
        U.toast('已保存文稿');
      }

      /* 文稿列表 */
      mount.appendChild(C.subTitle('文稿列表（' + s.stt.length + '）'));
      if (!s.stt.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🎙️</span>还没有文稿'));
      s.stt.forEach(function (it) {
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        h.appendChild(el('span', { class: 'tag' }, it.date));
        h.appendChild(el('span', { class: 'tag pri' }, (it.text || '').length + ' 字'));
        h.appendChild(el('div', { class: 'grow' }));
        var mm = el('button', { class: 'iconbtn' }, '⋯'); h.appendChild(mm);
        c.appendChild(h);
        c.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, esc(it.title)));
        var ta = el('textarea', { class: 'ta mt6', rows: 4, placeholder: '转写文本 / 编辑修改…' });
        ta.value = it.text || '';
        ta.oninput = U.debounce(function () { it.text = ta.value; S.save(); }, 400);
        c.appendChild(ta);
        if (it.img) c.appendChild(C.mediaImg(it.img));
        if (it.audio) {
          var au = el('audio', { controls: 'controls' });
          U.Blobs.get(it.audio).then(function (d) { if (d) au.src = d; });
          c.appendChild(au);
        }
        var ops2 = el('div', { class: 'wrap mt6' });
        ops2.appendChild(C.btn('✨ AI 润色', 'sm', function () { W.Exam.aiAsk('请润色下面这段口播文稿，修正口误与语病，保持口语自然：\n' + it.text); }));
        ops2.appendChild(C.btn('🧩 拆大纲', 'sm', function () { W.Exam.aiAsk('请把下面文稿拆成清晰的大纲结构，并提取核心关键词：\n' + it.text); }));
        ops2.appendChild(C.btn('📋 复制', 'sm', function () { U.copy(it.text); }));
        ops2.appendChild(C.btn('📤 同步到随心', 'sm', function () {
          s.free.unshift({ id: U.uid(), text: it.text.slice(0, 500), cat: '摘抄', ts: Date.now(), date: U.today() }); S.save(); U.toast('已同步到随心板块');
        }));
        ops2.appendChild(C.btn('🗂 归档到文件夹', 'sm', function () {
          var fs = S.folders('stt');
          U.sheet('选择文件夹', fs.map(function (f) { return { v: f.id, text: f.name, icon: f.icon }; })).then(function (fid) {
            var f = fs.filter(function (x) { return x.id === fid; })[0];
            if (f) { f.items.push({ id: U.uid(), type: 'text', title: it.title, note: it.text }); f.open = true; S.save(); U.toast('已归档到 ' + f.name); }
          });
        }));
        ops2.appendChild(C.btn('🗑', 'sm dan', function () { s.stt = s.stt.filter(function (x) { return x.id !== it.id; }); S.save(); draw(); }));
        c.appendChild(ops2);
        mm.onclick = function () {
          U.prompt('重命名文稿', '标题', it.title).then(function (x) { if (x) { it.title = x; S.save(); draw(); } });
        };
        mount.appendChild(c);
      });
    }
    draw();
  }

  /* ============ 影视 ============ */
  W.P.movie = function (v) {
    var s = S.get();
    C.sectionPage(v, {
      id: 'movie',
      sections: [
        { key: 'mv_list', icon: '🎬', title: '片单 & 观影笔记', sub: '想看/已看/待剪辑 · 台词库 · AI 素材挖掘', render: function (b) { movieList(b); } },
        { key: 'mv_genre', icon: '🗂️', title: '题材分类文件夹', sub: '电影 / 剧集 / 纪录片 / 动漫 / 综艺（可多层）', render: function (b) { b.appendChild(C.tree('movie_genre')); } },
        { key: 'mv_use', icon: '🎯', title: '用途分类文件夹', sub: '剪辑素材 / 台词摘抄 / 解说参考 / 英语原声 / 备考纪录片', render: function (b) { b.appendChild(C.tree('movie_use')); } },
        { key: 'mv_app', icon: '🔗', title: '平台 / 工具对接', sub: '视频平台、剪辑工具、解说学习 APP', render: function (b) {
          b.appendChild(C.btn('➕ 一键添加常用影视平台', 'sm mb8', function () {
            var REC = [
              { name: '豆瓣电影', icon: '🎞️', url: 'https://movie.douban.com/', tag: '资料' },
              { name: 'B站', icon: '📺', url: 'https://www.bilibili.com/', tag: '平台' },
              { name: '腾讯视频', icon: '🐧', url: 'https://v.qq.com/', tag: '平台' },
              { name: '爱奇艺', icon: '🔵', url: 'https://www.iqiyi.com/', tag: '平台' },
              { name: '优酷', icon: '🟠', url: 'https://www.youku.com/', tag: '平台' },
              { name: '芒果TV', icon: '🟡', url: 'https://www.mgtv.com/', tag: '平台' },
              { name: '西瓜视频', icon: '🔴', url: 'https://www.ixigua.com/', tag: '平台' },
              { name: '1905电影网', icon: '🎬', url: 'https://www.1905.com/', tag: '资料' },
              { name: 'IMDb', icon: '🌐', url: 'https://www.imdb.com/', tag: '资料' }
            ];
            var have = {}; S.links('movie_app').forEach(function (x) { have[x.name] = true; });
            var n = 0; REC.forEach(function (r) { if (!have[r.name]) { S.links('movie_app').push({ id: U.uid(), name: r.name, icon: r.icon, url: r.url, tag: r.tag }); n++; } });
            S.save(); W.render(); U.toast(n ? ('已添加 ' + n + ' 个平台') : '常用平台已存在');
          }));
          b.appendChild(C.linkgrid('movie_app', { filter: true, tag: '影视' }));
        } },
        {
          key: 'mv_ck', icon: '✅', title: '观影打卡 & 任务', sub: '每日观影、素材截取、台词整理',
          render: function (b) {
            b.appendChild(C.weekcheck('movie', { title: '影视打卡' }));
            b.appendChild(C.statRow([
              { value: s.movies.length, label: '影视条目' },
              { value: s.movies.filter(function (m) { return m.status === '已看'; }).length, label: '已看', color: '#2fbf87' },
              { value: s.movies.reduce(function (a, m) { return a + (m.lines || []).length; }, 0), label: '台词摘抄', color: '#9b6cff' }
            ]));
            b.appendChild(C.tasklist('movie', { addText: '新增影视任务' }));
          }
        }
      ]
    });
  };
  function movieList(mount) {
    var s = S.get();
    var f = '';
    function draw() {
      mount.innerHTML = '';
      var r = el('div', { class: 'row mb8' });
      r.appendChild(C.btn('＋ 添加影视', 'pri', function () {
        U.modal({
          title: '添加影视', fields: [
            { key: 'n', label: '片名' },
            { key: 't', label: '题材', value: '电影' },
            { key: 's', label: '状态', type: 'select', value: '想看', options: ['想看', '已看', '待剪辑'].map(function (x) { return { v: x, t: x }; }) },
            { key: 'u', label: '链接（可空）' }
          ]
        }).then(function (x) {
          if (!x) return;
          s.movies.unshift({ id: U.uid(), name: x.n, genre: x.t, status: x.s, url: x.u, note: '', lines: [], date: U.today() });
          S.save(); draw();
        });
      }));
      r.appendChild(el('div', { class: 'grow' }));
      mount.appendChild(r);
      var seg = el('div', { class: 'seg mb8' });
      ['全部', '想看', '已看', '待剪辑'].forEach(function (x) {
        var b = el('button', { class: (f === x || (!f && x === '全部')) ? 'on' : '' }, x);
        b.onclick = function () { f = (x === '全部' ? '' : x); draw(); };
        seg.appendChild(b);
      });
      mount.appendChild(seg);
      var list = s.movies.filter(function (m) { return !f || m.status === f; });
      if (!list.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">🎬</span>暂无条目'));
      list.forEach(function (m) {
        var c = el('div', { class: 'q' });
        var h = el('div', { class: 'qh' });
        h.appendChild(el('span', { class: 'tag ' + (m.status === '已看' ? 'ok' : m.status === '待剪辑' ? 'warn' : 'pri') }, m.status));
        h.appendChild(el('span', { class: 'tag' }, esc(m.genre)));
        h.appendChild(el('div', { class: 'grow' }));
        var mm = el('button', { class: 'iconbtn' }, '⋯'); h.appendChild(mm);
        c.appendChild(h);
        c.appendChild(el('div', { style: 'font-weight:700;font-size:14px' }, esc(m.name)));
        var ta = el('textarea', { class: 'ta mt6', rows: 3, placeholder: '剧情评价 / 名场面 / 人物分析 / 剪辑灵感…' });
        ta.value = m.note || '';
        ta.oninput = U.debounce(function () { m.note = ta.value; S.save(); }, 400);
        c.appendChild(ta);
        if ((m.lines || []).length) {
          var lb = el('div', { class: 'mt6' });
          m.lines.forEach(function (l, i) {
            var q = el('div', { class: 'it' });
            q.appendChild(el('div', { class: 'ii' }, '💬'));
            q.appendChild(el('div', { class: 'itx' }, '<div class="itt" style="white-space:normal">' + esc(l) + '</div>'));
            var d = el('button', { class: 'iconbtn' }, '🗑');
            d.onclick = function () { m.lines.splice(i, 1); S.save(); draw(); };
            q.appendChild(d); lb.appendChild(q);
          });
          c.appendChild(lb);
        }
        var ops = el('div', { class: 'wrap mt6' });
        ops.appendChild(C.btn('💬 摘台词', 'sm', function () {
          U.prompt('摘抄台词', '台词内容').then(function (x) { if (x) { m.lines = m.lines || []; m.lines.push(x); S.save(); draw(); } });
        }));
        ops.appendChild(C.btn('🤖 AI 素材挖掘', 'sm', function () {
          W.Exam.aiAsk('围绕影视作品《' + m.name + '》，请输出：1) 3 条适合自媒体的文案切入点；2) 5 句可摘抄金句；3) 一个 60 秒解说镜头脚本；4) 可用于英语表达练习的原声句型。');
        }));
        ops.appendChild(C.btn('🔗 打开', 'sm', function () { U.open(m.url || ('https://search.douban.com/movie/subject_search?search_text=' + encodeURIComponent(m.name))); }));
        ops.appendChild(C.btn('🔄 状态', 'sm', function () {
          m.status = m.status === '想看' ? '已看' : m.status === '已看' ? '待剪辑' : '想看'; S.save(); draw();
        }));
        ops.appendChild(C.btn('📤 同步台词到语音板块', 'sm', function () {
          s.stt.unshift({ id: U.uid(), title: '《' + m.name + '》台词', text: (m.lines || []).join('\n'), date: U.today(), ts: Date.now() });
          S.save(); U.toast('已同步到语音转文字');
        }));
        ops.appendChild(C.btn('🗑', 'sm dan', function () { s.movies = s.movies.filter(function (x) { return x.id !== m.id; }); S.save(); draw(); }));
        c.appendChild(ops);
        mm.onclick = function () {
          U.modal({ title: '编辑', fields: [{ key: 'n', label: '片名', value: m.name }, { key: 't', label: '题材', value: m.genre }, { key: 'u', label: '链接', value: m.url || '' }] })
            .then(function (x) { if (x) { m.name = x.n; m.genre = x.t; m.url = x.u; S.save(); draw(); } });
        };
        mount.appendChild(c);
      });
    }
    draw();
  }

  /* ============ 用户自定义板块通用页 ============ */
  W.P.__custom = function (v, nav) {
    var key = nav.id;
    C.sectionPage(v, {
      id: key,
      sections: [
        { key: key + '_ck', icon: '✅', title: '周打卡 & 任务', sub: '横向方框式周打卡', render: function (b) { b.appendChild(C.weekcheck(key, { title: nav.name + ' 打卡' })); b.appendChild(C.subTitle('自定义任务')); b.appendChild(C.tasklist(key)); } },
        { key: key + '_fd', icon: '🗂️', title: '文件夹 & 素材', sub: '多层文件夹，支持上传图片/音视频/链接', render: function (b) { b.appendChild(C.tree(key)); } },
        { key: key + '_lk', icon: '🔗', title: 'APP / 网址对接', sub: '一键跳转', render: function (b) { b.appendChild(C.linkgrid(key, { filter: true })); } },
        { key: key + '_nt', icon: '📝', title: '笔记', sub: '自由记录', render: function (b) { b.appendChild(C.note(key, '记录…', 6)); } }
      ]
    });
  };
})();
