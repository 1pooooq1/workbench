/* ===== 抖音（短视频）模块：视频分类区 + 公众号链接（按钮跳转，不内嵌 iframe） ===== */
(function () {
  var U = W.U, S = W.S, C = W.C;
  var el = U.el, esc = U.esc;

  function ensure() {
    var s = S.get();
    if (!s.douyin) s.douyin = { cats: [], mps: [], mpCats: [] };
    if (!s.douyin.cats || !s.douyin.cats.length) s.douyin.cats = [{ id: U.uid(), name: '默认分类', videos: [] }];
    // 兼容性迁移：旧版 mps 数组 -> mpCats 分类
    if (!s.douyin.mpCats) s.douyin.mpCats = [];
    if (!s.douyin.mpCats.length) {
      if (s.douyin.mps && s.douyin.mps.length) {
        s.douyin.mpCats = [{ id: U.uid(), name: '默认分类', links: s.douyin.mps.map(function (m) { return { id: m.id || U.uid(), title: m.title, url: m.url, note: m.note }; }) }];
      } else {
        s.douyin.mpCats = [{ id: U.uid(), name: '默认分类', links: [] }];
      }
    }
    if (!s.douyin.cats[0]) s.douyin.cats.push({ id: U.uid(), name: '默认分类', videos: [] });
    if (!s.douyin.mpCats[0]) s.douyin.mpCats.push({ id: U.uid(), name: '默认分类', links: [] });
    return s.douyin;
  }

  /* ---------- 抖音视频分类区（自定义增减分类与视频 + 视频感悟） ---------- */
  function videoArea(mount) {
    var dy = ensure();
    var cats = dy.cats;
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.subTitle('视频分类（自定义增减）',
        el('div', { class: 'row' }, (function () {
          var w = el('div');
          w.appendChild(C.btn('＋ 新建分类', 'sm', function () {
            U.prompt('新建分类', '分类名称').then(function (v) { if (v) { cats.push({ id: U.uid(), name: v, videos: [] }); S.save(); draw(); } });
          }));
          w.appendChild(C.btn('⚙ 管理', 'sm', function () { manage(cats, function () { dy.cats = cats; draw(); }); }));
          return w;
        })())
      ));

      var seg = el('div', { class: 'seg mb8' });
      cats.forEach(function (c) {
        var b = el('button', { class: c.id === cur(dy) ? 'on' : '' }, esc(c.name));
        b.onclick = function () { dy._cur = c.id; S.save(); draw(); };
        seg.appendChild(b);
      });
      mount.appendChild(seg);

      var cat = cats.filter(function (x) { return x.id === cur(dy); })[0] || cats[0];
      mount.appendChild(C.btn('＋ 添加抖音视频', 'pri mb8', function () {
        U.modal({ title: '添加抖音视频（' + cat.name + '）', fields: [{ key: 't', label: '视频标题' }, { key: 'u', label: '抖音链接 / 分享口令' }] })
          .then(function (v) { if (v && v.u) { cat.videos.push({ id: U.uid(), title: v.t || v.u, url: v.u, note: '' }); S.save(); draw(); } });
      }));

      if (!cat.videos.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">📱</span>该分类还没有视频，点上方添加'));
      cat.videos.forEach(function (vd) {
        var c = el('div', { class: 'q' });
        c.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, esc(vd.title)));
        if (vd.url) c.appendChild(el('div', { class: 'small muted', style: 'margin-top:2px;word-break:break-all' }, esc(vd.url)));
        var ops = el('div', { class: 'row mt6' });
        ops.appendChild(C.btn('▶ 打开视频', 'sm', function () { U.open(vd.url); }));
        ops.appendChild(C.btn((vd._open ? '📝 收起感悟' : '📝 写感悟'), 'sm', function () { vd._open = !vd._open; S.save(); draw(); }));
        ops.appendChild(C.btn('🗑', 'sm dan', function () { cat.videos = cat.videos.filter(function (x) { return x.id !== vd.id; }); S.save(); draw(); }));
        c.appendChild(ops);
        if (vd._open) {
          var ta = el('textarea', { class: 'ta mt6', rows: 2, placeholder: '写下你看这条视频的感悟…' });
          ta.value = vd.note || '';
          ta.oninput = U.debounce(function () { vd.note = ta.value; S.save(); }, 400);
          c.appendChild(ta);
          if (vd.note) c.appendChild(el('div', { class: 'small muted mt6', style: 'white-space:pre-wrap' }, esc(vd.note)));
        }
        mount.appendChild(c);
      });
    }
    draw();
  }

  /* ---------- 公众号链接模块（分类 + 自定义增减 + 隐藏/展开） ---------- */
  function mpArea(mount) {
    var dy = ensure();
    var cats = dy.mpCats;
    function draw() {
      mount.innerHTML = '';
      mount.appendChild(C.subTitle('公众号链接（点击按钮新开标签页直达原文，不内嵌）',
        el('div', { class: 'row' }, (function () {
          var w = el('div');
          w.appendChild(C.btn('＋ 新建分类', 'sm', function () {
            U.prompt('新建分类', '分类名称').then(function (v) { if (v) { cats.push({ id: U.uid(), name: v, links: [] }); S.save(); draw(); } });
          }));
          w.appendChild(C.btn('⚙ 管理', 'sm', function () { manage(cats, function () { dy.mpCats = cats; draw(); }); }));
          return w;
        })())
      ));

      var seg = el('div', { class: 'seg mb8' });
      cats.forEach(function (c) {
        var b = el('button', { class: c.id === curMp(dy) ? 'on' : '' }, esc(c.name) + (c.collapsed ? ' ▸' : ' ▾'));
        b.onclick = function () { c.collapsed = !c.collapsed; S.save(); draw(); };
        seg.appendChild(b);
      });
      mount.appendChild(seg);

      var cat = cats.filter(function (x) { return x.id === curMp(dy); })[0] || cats[0];
      mount.appendChild(C.btn('＋ 添加公众号文章', 'pri mb8', function () {
        U.modal({ title: '添加公众号文章（' + cat.name + '）', fields: [{ key: 't', label: '文章标题 / 公众号名' }, { key: 'u', label: '公众号文章链接' }, { key: 'src', label: '备注（可空）' }] })
          .then(function (v) { if (v && v.u) { cat.links.push({ id: U.uid(), title: v.t || v.u, url: v.u, note: v.src }); S.save(); draw(); } });
      }));

      if (cat.collapsed) return;
      if (!cat.links.length) mount.appendChild(el('div', { class: 'empty' }, '<span class="ei">📲</span>该分类还没有公众号链接，点上方添加'));
      cat.links.forEach(function (m) {
        var c = el('div', { class: 'q' });
        c.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, esc(m.title)));
        if (m.note) c.appendChild(el('div', { class: 'small muted', style: 'margin-top:2px' }, esc(m.note)));
        if (m.url) c.appendChild(el('div', { class: 'small muted', style: 'margin-top:2px;word-break:break-all' }, esc(m.url)));
        var ops = el('div', { class: 'row mt6' });
        ops.appendChild(C.btn('📲 打开公众号原文', 'pri sm', function () { U.open(m.url); }));
        ops.appendChild(C.btn('🗑', 'sm dan', function () { cat.links = cat.links.filter(function (x) { return x.id !== m.id; }); S.save(); draw(); }));
        c.appendChild(ops);
        mount.appendChild(c);
      });
    }
    draw();
  }

  /* 通用：分类管理（重命名 / 删除，至少保留一个） */
  function manage(cats, after) {
    var items = cats.map(function (c) { return { v: c.id, text: '编辑「' + c.name + '」', icon: '✏️' }; });
    items.push({ v: '__add', text: '＋ 新建分类', icon: '➕' });
    U.sheet('管理分类', items).then(function (id) {
      if (!id) return;
      if (id === '__add') { U.prompt('新建分类', '分类名称').then(function (v) { if (v) { cats.push({ id: U.uid(), name: v, videos: [], links: [] }); S.save(); after(); } }); return; }
      var c = cats.filter(function (x) { return x.id === id; })[0];
      U.sheet('编辑「' + c.name + '」', [
        { v: 'ren', text: '重命名', icon: '✏️' },
        { v: 'del', text: cats.length > 1 ? '删除分类' : '不可删除（至少保留一个）', icon: '🗑️' }
      ]).then(function (a) {
        if (a === 'ren') U.prompt('重命名', '分类名称', c.name).then(function (v) { if (v) { c.name = v; S.save(); after(); } });
        else if (a === 'del' && cats.length > 1) U.confirm('删除分类', '将删除「' + c.name + '」及其下全部内容，确认？').then(function (ok) { if (ok) { cats = cats.filter(function (x) { return x.id !== id; }); S.save(); after(); } });
      });
    });
  }

  function cur(dy) { return dy._cur && dy.cats.some(function (c) { return c.id === dy._cur; }) ? dy._cur : dy.cats[0].id; }
  function curMp(dy) { return dy._curMp && dy.mpCats.some(function (c) { return c.id === dy._curMp; }) ? dy._curMp : dy.mpCats[0].id; }

  W.P.douyin = function (v) {
    C.sectionPage(v, {
      id: 'douyin',
      sections: [
        { key: 'dy_video', icon: '📱', title: '抖音视频分类', sub: '分门别类收藏抖音视频，分类可自定义加减；每条视频可写感悟（可隐藏/展开）', render: function (b) { videoArea(b); } },
        { key: 'dy_mp', icon: '📲', title: '公众号链接', sub: '分类收藏公众号文章，点击按钮新开标签页直达原文（不内嵌）；分类可自定义加减、隐藏/展开', render: function (b) { mpArea(b); } }
      ]
    });
  };
})();
