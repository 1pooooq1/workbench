/* ===== 通用组件库 ===== */
(function () {
  var U = W.U, S = W.S, el = U.el, esc = U.esc;

  function openMap() { var s = S.get(); if (!s.open) s.open = {}; return s.open; }

  /* ---------- 折叠卡片 ---------- */
  function card(o) {
    var om = openMap();
    var isOpen = o.open != null ? o.open : !!om[o.key];
    var c = el('div', { class: 'card' + (isOpen ? ' open' : ''), id: o.key ? 'sec-' + o.key : null });
    var hd = el('div', { class: 'card-hd' });
    hd.appendChild(el('div', { class: 'ch-ic', style: o.color ? 'background:' + o.color : '' }, o.icon || '📌'));
    var tx = el('div', { class: 'ch-tx' });
    tx.appendChild(el('div', { class: 'ch-t' }, esc(o.title) + (o.badge ? ' <span class="tag pri">' + esc(o.badge) + '</span>' : '')));
    if (o.sub) tx.appendChild(el('div', { class: 'ch-s' }, esc(o.sub)));
    hd.appendChild(tx);
    if (o.right) hd.appendChild(o.right);
    hd.appendChild(el('div', { class: 'ch-ar' }, '▶'));
    var bd = el('div', { class: 'card-bd' });
    var built = false;
    function build() { if (built) return; built = true; if (o.render) o.render(bd); }
    if (isOpen) build();
    hd.onclick = function (e) {
      if (e.target.closest('.no-toggle')) return;
      c.classList.toggle('open');
      var on = c.classList.contains('open');
      if (o.key) { om[o.key] = on; S.save(); }
      if (on) build();
    };
    c.appendChild(hd); c.appendChild(bd);
    c.__build = build; c.__body = bd;
    return c;
  }

  /* ---------- 双视图页面（收起入口 / 展开全部） ---------- */
  function sectionPage(mount, opt) {
    var om = openMap();
    var vkey = 'view_' + opt.id;
    var mode = om[vkey] || opt.defaultMode || 'expand';
    var bar = el('div', { class: 'row mb8', style: 'justify-content:space-between' });
    var tg = el('div', { class: 'vtoggle' });
    var b1 = el('button', { class: mode === 'fold' ? 'on' : '' }, '收起视图');
    var b2 = el('button', { class: mode === 'expand' ? 'on' : '' }, '展开视图');
    tg.appendChild(b1); tg.appendChild(b2); bar.appendChild(tg);
    if (opt.rightBar) bar.appendChild(opt.rightBar());
    mount.appendChild(bar);
    if (opt.top) opt.top(mount);
    var host = el('div'); mount.appendChild(host);

    function draw() {
      host.innerHTML = '';
      if (mode === 'fold') {
        var g = el('div', { class: 'hg' });
        opt.sections.forEach(function (s) {
          var i = el('div', { class: 'hg-i' });
          i.appendChild(el('div', { class: 'hi' }, s.icon));
          i.appendChild(el('div', { class: 'ht' }, esc(s.title)));
          i.onclick = function () { mode = 'expand'; om[vkey] = mode; S.save(); b1.className = ''; b2.className = 'on'; draw(); setTimeout(function () { focusSec(s.key); }, 60); };
          g.appendChild(i);
        });
        host.appendChild(g);
        if (opt.foldExtra) opt.foldExtra(host);
      } else {
        opt.sections.forEach(function (s) {
          host.appendChild(card({ key: s.key, icon: s.icon, title: s.title, sub: s.sub, badge: s.badge, render: s.render, open: s.open }));
        });
        if (opt.bottom) opt.bottom(host);
      }
    }
    b1.onclick = function () { mode = 'fold'; om[vkey] = mode; S.save(); b1.className = 'on'; b2.className = ''; draw(); };
    b2.onclick = function () { mode = 'expand'; om[vkey] = mode; S.save(); b1.className = ''; b2.className = 'on'; draw(); };
    draw();
    mount.__focus = focusSec;
    return { draw: draw, focus: focusSec };
  }
  function focusSec(key) {
    var e = document.getElementById('sec-' + key);
    if (!e) return;
    if (!e.classList.contains('open')) { e.classList.add('open'); if (e.__build) e.__build(); openMap()[key] = true; S.save(); }
    e.scrollIntoView({ behavior: 'smooth', block: 'start' });
    e.style.transition = 'box-shadow .4s'; e.style.boxShadow = '0 0 0 2px #5b6cff';
    setTimeout(function () { e.style.boxShadow = ''; }, 900);
  }

  /* ---------- 横向方框式周打卡 ---------- */
  function weekcheck(key, o) {
    o = o || {};
    var box = el('div', { class: 'wk' });
    var start = U.weekStart(U.today());
    function draw() {
      box.innerHTML = '';
      var data = S.ck(key);
      var hd = el('div', { class: 'wk-hd' });
      hd.appendChild(el('div', { class: 'wk-t' }, (o.title || '周打卡') + ' · ' + U.weekLabel(start)));
      var nav = el('div', { class: 'wk-nav' });
      var p = el('button', null, '‹'), t = el('button', { style: 'width:auto;padding:0 6px' }, '本周'), n = el('button', null, '›');
      p.onclick = function () { start = U.addDay(start, -7); draw(); };
      n.onclick = function () { start = U.addDay(start, 7); draw(); };
      t.onclick = function () { start = U.weekStart(U.today()); draw(); };
      nav.appendChild(p); nav.appendChild(t); nav.appendChild(n); hd.appendChild(nav); box.appendChild(hd);

      var days = U.weekDays(start), tod = U.today();
      var g = el('div', { class: 'wk-grid' });
      g.appendChild(el('div'));
      days.forEach(function (d, di) {
        g.appendChild(el('div', { class: 'wk-dh' + (d === tod ? ' today' : '') }, ['一', '二', '三', '四', '五', '六', '日'][di] + '<b>' + (+d.split('-')[2]) + '</b>'));
      });
      if (!data.tasks.length) {
        var e = el('div', { class: 'empty small', style: 'grid-column:1/-1;padding:10px' }, '还没有打卡任务，点下方按钮新增');
        g.appendChild(e);
      }
      data.tasks.forEach(function (tk) {
        var nm = el('div', { class: 'wk-name' }, esc(tk.name));
        nm.onclick = function () {
          U.sheet(tk.name, [{ v: 'r', text: '重命名', icon: '✏️' }, { v: 'd', text: '删除任务', icon: '🗑️' }]).then(function (a) {
            if (a === 'r') U.prompt('重命名', '任务名称', tk.name).then(function (v) { if (v) { tk.name = v; S.save(); draw(); } });
            if (a === 'd') { data.tasks = data.tasks.filter(function (x) { return x.id !== tk.id; }); S.get().checkins[key].tasks = data.tasks; S.save(); draw(); }
          });
        };
        g.appendChild(nm);
        days.forEach(function (d) {
          var on = (data.rec[d] || []).indexOf(tk.id) >= 0;
          var fut = d > tod;
          var b = el('div', { class: 'wk-box' + (on ? ' on' : '') + (fut ? ' fut' : '') }, on ? '✓' : '');
          b.onclick = function () {
            if (!data.rec[d]) data.rec[d] = [];
            var i = data.rec[d].indexOf(tk.id);
            if (i >= 0) data.rec[d].splice(i, 1); else data.rec[d].push(tk.id);
            S.save(); draw();
            if (i < 0) U.toast('打卡成功 ' + tk.name);
          };
          g.appendChild(b);
        });
      });
      box.appendChild(g);
      var add = el('button', { class: 'btn sm wk-add' }, '＋ 新增打卡任务');
      add.onclick = function () {
        U.prompt('新增打卡任务', '任务名称', '', '例：数学刷题 20 道').then(function (v) {
          if (!v) return; data.tasks.push({ id: U.uid(), name: v }); S.save(); draw();
        });
      };
      box.appendChild(add);
    }
    draw();
    return box;
  }

  /* ---------- 自定义任务清单 ---------- */
  function tasklist(key, o) {
    o = o || {};
    var box = el('div');
    function draw() {
      box.innerHTML = '';
      var list = S.tasks(key);
      if (!list.length) box.appendChild(el('div', { class: 'empty' }, '<span class="ei">🗒️</span>暂无任务'));
      list.forEach(function (t) {
        var r = el('div', { class: 'tk' + (t.done ? ' done' : '') });
        var ck = el('div', { class: 'ck' }, '✓');
        ck.onclick = function () { t.done = !t.done; S.save(); draw(); };
        var tx = el('div', { class: 'tk-t' }, esc(t.text));
        tx.onclick = function () { U.prompt('编辑任务', '内容', t.text).then(function (v) { if (v) { t.text = v; S.save(); draw(); } }); };
        var del = el('button', { class: 'iconbtn' }, '🗑');
        del.onclick = function () { S.get().tasks[key] = list.filter(function (x) { return x.id !== t.id; }); S.save(); draw(); };
        r.appendChild(ck); r.appendChild(tx); r.appendChild(del); box.appendChild(r);
      });
      var add = el('button', { class: 'btn sm' }, '＋ ' + (o.addText || '新增任务'));
      add.onclick = function () {
        U.prompt(o.addText || '新增任务', '内容', '', o.ph || '').then(function (v) {
          if (!v) return; S.tasks(key).push({ id: U.uid(), text: v, done: false, ts: Date.now() }); S.save(); draw();
        });
      };
      box.appendChild(add);
    }
    draw(); return box;
  }

  /* ---------- 笔记框 ---------- */
  function note(key, ph, rows) {
    var box = el('div');
    var ta = el('textarea', { class: 'ta', rows: rows || 4, placeholder: ph || '记录一点想法…' });
    ta.value = S.note(key);
    var tip = el('div', { class: 'small muted mt6' }, '自动保存');
    ta.oninput = U.debounce(function () { S.note(key, ta.value); tip.textContent = '已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); }, 500);
    var row = el('div', { class: 'row mt6' });
    var cp = el('button', { class: 'btn sm' }, '复制'); cp.onclick = function () { U.copy(ta.value); };
    row.appendChild(tip); row.appendChild(el('div', { class: 'grow' })); row.appendChild(cp);
    box.appendChild(ta); box.appendChild(row);
    return box;
  }

  /* ---------- 媒体缩略 ---------- */
  function mediaImg(blobId) {
    var img = el('img', { class: 'thumb' });
    U.Blobs.get(blobId).then(function (d) { if (d) img.src = d; });
    img.onclick = function () { U.Blobs.get(blobId).then(function (d) { if (d) U.modal({ title: '图片', html: '<img src="' + d + '" style="width:100%;border-radius:10px">', hideCancel: true, okText: '关闭' }); }); };
    return img;
  }

  /* ---------- 文档查看 / 编辑 ---------- */
  function openDoc(it) {
    U.Blobs.get(it.blob).then(function (txt) {
      var ta = el('textarea', { class: 'ta', rows: 16, placeholder: '（空文档）' });
      ta.value = txt || '';
      U.modal({ title: it.title || '文档', html: '<div id="doc-view"></div>', okText: '保存并关闭', cancelText: '关闭' })
        .then(function (ok) {
          if (ok) {
            U.Blobs.put(it.blob, ta.value).then(function () {
              it.note = ta.value.replace(/\s+/g, ' ').slice(0, 120);
              S.save(); U.toast('已保存');
            });
          }
        });
      setTimeout(function () { var box = document.getElementById('doc-view'); if (box) { box.innerHTML = ''; box.appendChild(ta); } }, 30);
    });
  }

  /* ---------- 多层文件夹树 ---------- */
  function tree(key, o) {
    o = o || {};
    var box = el('div', { class: 'tree' });
    function nodes() { return S.folders(key); }
    function draw() {
      box.innerHTML = '';
      var list = nodes();
      if (!list.length) box.appendChild(el('div', { class: 'empty' }, '<span class="ei">📁</span>暂无文件夹'));
      list.forEach(function (n) { box.appendChild(node(n, list)); });
      var add = el('button', { class: 'btn sm mt6' }, '＋ 新建文件夹');
      add.onclick = function () { U.prompt('新建文件夹', '名称').then(function (v) { if (v) { list.push(S.folder(v)); S.save(); draw(); } }); };
      box.appendChild(add);
    }
    function count(n) {
      var c = (n.items || []).length;
      (n.children || []).forEach(function (x) { c += count(x); });
      return c;
    }
    function node(n, parent) {
      var w = el('div', { class: 'fd' + (n.open ? ' open' : '') });
      var hd = el('div', { class: 'fd-hd' });
      hd.appendChild(el('div', { class: 'ar' }, '▶'));
      hd.appendChild(el('div', null, n.icon || '📁'));
      hd.appendChild(el('div', { class: 'fn' }, esc(n.name)));
      hd.appendChild(el('div', { class: 'cnt' }, count(n)));
      var mb = el('button', { class: 'iconbtn no-toggle' }, '⋯');
      mb.onclick = function (e) {
        e.stopPropagation();
        U.sheet(n.name, [
          { v: 'item', text: '添加条目（链接/文本）', icon: '➕' },
          { v: 'doc', text: '导入文档（PDF/Word/txt，可多选识别）', icon: '📄' },
          { v: 'img', text: '拍照 / 上传图片', icon: '📷' },
          { v: 'file', text: '上传文件（音频/视频）', icon: '📎' },
          { v: 'sub', text: '新建子文件夹', icon: '📁' },
          { v: 'ren', text: '重命名 / 换图标', icon: '✏️' },
          { v: 'up', text: '上移', icon: '⬆️' },
          { v: 'del', text: '删除文件夹', icon: '🗑️' }
        ]).then(function (a) {
          if (a === 'item') addItem(n);
          else if (a === 'doc') addDoc(n);
          else if (a === 'img') addImg(n);
          else if (a === 'file') addFile(n);
          else if (a === 'sub') U.prompt('新建子文件夹', '名称').then(function (v) { if (v) { n.children.push(S.folder(v)); n.open = true; S.save(); draw(); } });
          else if (a === 'ren') U.modal({ title: '编辑文件夹', fields: [{ key: 'n', label: '名称', value: n.name }, { key: 'i', label: '图标 emoji', value: n.icon }] }).then(function (r) { if (r) { n.name = r.n; n.icon = r.i || '📁'; S.save(); draw(); } });
          else if (a === 'up') { var i = parent.indexOf(n); if (i > 0) { parent.splice(i, 1); parent.splice(i - 1, 0, n); S.save(); draw(); } }
          else if (a === 'del') U.confirm('删除「' + n.name + '」', '文件夹内所有内容将被删除').then(function (ok) { if (ok) { var i = parent.indexOf(n); parent.splice(i, 1); S.save(); draw(); } });
        });
      };
      hd.appendChild(mb);
      hd.onclick = function () { n.open = !n.open; S.save(); w.classList.toggle('open'); };
      w.appendChild(hd);
      var bd = el('div', { class: 'fd-bd' });
      (n.children || []).forEach(function (c) { bd.appendChild(node(c, n.children)); });
      (n.items || []).forEach(function (it) { bd.appendChild(itemRow(it, n)); });
      if (!(n.children || []).length && !(n.items || []).length) bd.appendChild(el('div', { class: 'small muted', style: 'padding:4px' }, '空文件夹'));
      w.appendChild(bd);
      return w;
    }
    function itemRow(it, n) {
      var r = el('div', { class: 'it' });
      var icon = { link: '🔗', text: '📝', doc: '📄', img: '🖼️', file: '📎', audio: '🎵', video: '🎬' }[it.type] || '📄';
      r.appendChild(el('div', { class: 'ii' }, icon));
      var tx = el('div', { class: 'itx' });
      tx.appendChild(el('div', { class: 'itt' }, esc(it.title)));
      if (it.note || it.url || it.tag) tx.appendChild(el('div', { class: 'its' }, esc(it.tag ? '#' + it.tag + ' ' : '') + esc(it.note || it.url || '')));
      r.appendChild(tx);
      var op = el('button', { class: 'iconbtn' }, '⋯');
      op.onclick = function () {
        var acts = [{ v: 'open', text: it.type === 'link' ? '打开链接' : '查看内容', icon: '👁️' }, { v: 'copy', text: '复制内容', icon: '📋' }, { v: 'edit', text: '编辑', icon: '✏️' }, { v: 'del', text: '删除', icon: '🗑️' }];
        U.sheet(it.title, acts).then(function (a) {
          if (a === 'open') {
            if (it.type === 'link') U.open(it.url);
            else if (it.type === 'doc') openDoc(it);
            else if (it.type === 'img') U.Blobs.get(it.blob).then(function (d) { U.modal({ title: it.title, html: d ? '<img src="' + d + '" style="width:100%;border-radius:10px">' : '图片已丢失', hideCancel: true, okText: '关闭' }); });
            else if (it.type === 'audio' || it.type === 'video') U.Blobs.get(it.blob).then(function (d) {
              U.modal({ title: it.title, html: d ? (it.type === 'audio' ? '<audio controls src="' + d + '"></audio>' : '<video controls style="width:100%" src="' + d + '"></video>') : '文件已丢失', hideCancel: true, okText: '关闭' });
            });
            else U.modal({ title: it.title, html: '<div style="white-space:pre-wrap;font-size:13px;line-height:1.7">' + esc(it.note) + '</div>', hideCancel: true, okText: '关闭' });
          }
          else if (a === 'copy') U.copy(it.url || it.note || it.title);
          else if (a === 'edit') U.modal({
            title: '编辑条目', fields: [{ key: 't', label: '标题', value: it.title }, { key: 'u', label: '链接（可空）', value: it.url || '' }, { key: 'g', label: '标签', value: it.tag || '' }, { key: 'n', label: '备注/正文', type: 'textarea', value: it.note || '' }]
          }).then(function (v) { if (v) { it.title = v.t; it.url = v.u; it.tag = v.g; it.note = v.n; if (v.u) it.type = 'link'; S.save(); draw(); } });
          else if (a === 'del') { n.items = n.items.filter(function (x) { return x.id !== it.id; }); S.save(); draw(); }
        });
      };
      r.appendChild(op);
      r.onclick = function (e) { if (e.target === op) return; if (it.type === 'doc') openDoc(it); else if (it.type === 'link') U.open(it.url); };
      return r;
    }
    function addItem(n) {
      U.modal({
        title: '添加条目 · ' + n.name,
        fields: [{ key: 't', label: '标题', value: '' }, { key: 'u', label: '链接 URL（可空）', ph: 'https://' }, { key: 'g', label: '标签（可空）' }, { key: 'n', label: '备注 / 正文', type: 'textarea' }]
      }).then(function (v) {
        if (!v) return;
        n.items.push({ id: U.uid(), type: v.u ? 'link' : 'text', title: v.t, url: v.u, tag: v.g, note: v.n, ts: Date.now() });
        n.open = true; S.save(); draw();
      });
    }
    function addImg(n) {
      U.pickFile('image/*', true).then(function (fs) {
        if (!fs || !fs.length) return;
        var q = fs.map(function (f) {
          return U.readImage(f, 1000).then(function (d) {
            var id = U.uid();
            return U.Blobs.put(id, d).then(function () { n.items.push({ id: U.uid(), type: 'img', title: f.name, blob: id, ts: Date.now() }); });
          });
        });
        Promise.all(q).then(function () { n.open = true; S.save(); draw(); U.toast('已上传 ' + fs.length + ' 张'); });
      });
    }
    function addFile(n) {
      U.pickFile('audio/*,video/*,.pdf,.txt,.doc,.docx').then(function (f) {
        if (!f) return;
        if (f.size > 8 * 1024 * 1024) { U.toast('文件较大，建议 <8MB'); }
        U.readAsDataURL(f).then(function (d) {
          var id = U.uid();
          var type = f.type.indexOf('audio') === 0 ? 'audio' : f.type.indexOf('video') === 0 ? 'video' : 'file';
          U.Blobs.put(id, d).then(function () { n.items.push({ id: U.uid(), type: type, title: f.name, blob: id, ts: Date.now() }); n.open = true; S.save(); draw(); U.toast('已上传'); });
        });
      });
    }
    function addDoc(n) {
      U.pickFile('.pdf,.doc,.docx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv', true)
        .then(function (files) {
          if (!files || !files.length) return;
          var ok = 0, fail = 0;
          function next(i) {
            if (i >= files.length) {
              S.save(); draw();
              if (ok) U.toast('已导入 ' + ok + ' 个文档' + (fail ? '，' + fail + ' 个失败' : ''));
              else if (fail) U.toast(fail + ' 个文档识别失败');
              return;
            }
            var file = files[i];
            U.extractDocText(file).then(function (text) {
              if (text.length > 60000) { text = text.slice(0, 60000); }
              var preview = text.replace(/\s+/g, ' ').slice(0, 120);
              return U.Blobs.put('doc_' + U.uid(), text).then(function (bid) {
                n.items.push({ id: U.uid(), type: 'doc', title: file.name, blob: bid, note: preview, ts: Date.now() });
                ok++; return next(i + 1);
              });
            }).catch(function (e) { fail++; U.toast('「' + file.name + '」识别失败：' + ((e && e.message) || e)); next(i + 1); });
          }
          next(0);
        });
    }
    draw(); return box;
  }

  /* ---------- 链接 / APP 宫格 ---------- */
  function linkgrid(key, o) {
    o = o || {};
    var box = el('div');
    var editing = false;
    function draw() {
      box.innerHTML = '';
      var list = S.links(key);
      if (o.filter) {
        var tags = {}; list.forEach(function (l) { if (l.tag) tags[l.tag] = 1; });
        var tl = Object.keys(tags);
        if (tl.length > 1) {
          var seg = el('div', { class: 'seg mb8' });
          var cur = box.__tag || '';
          var all = el('button', { class: cur ? '' : 'on' }, '全部');
          all.onclick = function () { box.__tag = ''; draw(); };
          seg.appendChild(all);
          tl.forEach(function (t) {
            var b = el('button', { class: cur === t ? 'on' : '' }, esc(t));
            b.onclick = function () { box.__tag = t; draw(); };
            seg.appendChild(b);
          });
          box.appendChild(seg);
        }
      }
      var g = el('div', { class: 'lk-grid' + (editing ? ' editing' : '') });
      list.filter(function (l) { return !box.__tag || l.tag === box.__tag; }).forEach(function (l) {
        var i = el('div', { class: 'lk' });
        i.appendChild(el('div', { class: 'lki' }, l.icon || '🔗'));
        i.appendChild(el('div', { class: 'lkt' }, esc(l.name)));
        if (l.tag) i.title = l.tag;
        var d = el('div', { class: 'del' }, '×');
        d.onclick = function (e) { e.stopPropagation(); S.get().links[key] = list.filter(function (x) { return x.id !== l.id; }); S.save(); draw(); };
        i.appendChild(d);
        i.onclick = function () { if (!editing) U.open(l.url); };
        i.oncontextmenu = function (e) {
          e.preventDefault();
          U.modal({ title: '编辑', fields: [{ key: 'n', label: '名称', value: l.name }, { key: 'i', label: '图标', value: l.icon }, { key: 'u', label: '网址', value: l.url }, { key: 't', label: '分类', value: l.tag || '' }] })
            .then(function (v) { if (v) { l.name = v.n; l.icon = v.i; l.url = v.u; l.tag = v.t; S.save(); draw(); } });
        };
        g.appendChild(i);
      });
      var add = el('div', { class: 'lk', style: 'border-style:dashed' });
      add.appendChild(el('div', { class: 'lki' }, '＋'));
      add.appendChild(el('div', { class: 'lkt' }, '添加'));
      add.onclick = function () {
        U.modal({ title: '添加 APP / 网址', fields: [{ key: 'n', label: '名称' }, { key: 'u', label: '网址 / APP Scheme', ph: 'https://' }, { key: 'i', label: '图标 emoji', value: '🔗' }, { key: 't', label: '分类', value: o.tag || '' }] })
          .then(function (v) { if (!v) return; S.links(key).push({ id: U.uid(), name: v.n, url: v.u, icon: v.i || '🔗', tag: v.t }); S.save(); draw(); });
      };
      g.appendChild(add);
      box.appendChild(g);
      var ed = el('button', { class: 'btn sm mt6' }, editing ? '完成' : '管理');
      ed.onclick = function () { editing = !editing; draw(); };
      box.appendChild(ed);
      box.appendChild(el('span', { class: 'small muted' }, ' 长按/右键条目可编辑'));
    }
    draw(); return box;
  }

  /* ---------- SVG 图表 ---------- */
  function chartBox(title, right) {
    var b = el('div', { class: 'chart' });
    var h = el('div', { class: 'chart-hd' });
    h.appendChild(el('div', { class: 'chart-t' }, esc(title)));
    if (right) h.appendChild(right);
    b.appendChild(h);
    return b;
  }
  function svgLine(labels, series, opt) {
    opt = opt || {};
    var W0 = 340, H = opt.height || 150, pl = 26, pr = 8, pt = 10, pb = 20;
    var max = 1;
    series.forEach(function (s) { s.data.forEach(function (v) { if (v > max) max = v; }); });
    max = Math.ceil(max * 1.15) || 1;
    var iw = W0 - pl - pr, ih = H - pt - pb;
    var n = labels.length || 1;
    function X(i) { return pl + (n === 1 ? iw / 2 : i * iw / (n - 1)); }
    function Y(v) { return pt + ih - (v / max) * ih; }
    var s = '<svg class="cv" viewBox="0 0 ' + W0 + ' ' + H + '">';
    for (var g = 0; g <= 3; g++) {
      var y = pt + ih * g / 3;
      s += '<line x1="' + pl + '" y1="' + y + '" x2="' + (W0 - pr) + '" y2="' + y + '" stroke="#eef0f5" stroke-width="1"/>';
      s += '<text x="2" y="' + (y + 3) + '" font-size="8" fill="#9aa1b1">' + Math.round(max * (3 - g) / 3) + '</text>';
    }
    series.forEach(function (se) {
      var d = se.data.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
      s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      se.data.forEach(function (v, i) { s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2.6" fill="#fff" stroke="' + se.color + '" stroke-width="1.6"/>'; });
    });
    labels.forEach(function (l, i) { s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 5) + '" font-size="8.5" fill="#9aa1b1" text-anchor="middle">' + esc(l) + '</text>'; });
    s += '</svg>';
    var wrap = el('div', null, s);
    if (series.length > 1) {
      var lg = el('div', { class: 'wrap mt6' });
      series.forEach(function (se) { lg.appendChild(el('span', { class: 'small', style: 'color:' + se.color }, '● ' + esc(se.name))); });
      wrap.appendChild(lg);
    }
    return wrap;
  }
  function svgBar(labels, series, opt) {
    opt = opt || {};
    var W0 = 340, H = opt.height || 150, pl = 26, pr = 8, pt = 10, pb = 20;
    var max = 1;
    series.forEach(function (s) { s.data.forEach(function (v) { if (v > max) max = v; }); });
    max = Math.ceil(max * 1.15) || 1;
    var iw = W0 - pl - pr, ih = H - pt - pb, n = labels.length || 1;
    var gw = iw / n, bw = Math.min(18, gw / (series.length + 0.6));
    var s = '<svg class="cv" viewBox="0 0 ' + W0 + ' ' + H + '">';
    for (var g = 0; g <= 3; g++) {
      var y = pt + ih * g / 3;
      s += '<line x1="' + pl + '" y1="' + y + '" x2="' + (W0 - pr) + '" y2="' + y + '" stroke="#eef0f5"/>';
      s += '<text x="2" y="' + (y + 3) + '" font-size="8" fill="#9aa1b1">' + Math.round(max * (3 - g) / 3) + '</text>';
    }
    labels.forEach(function (l, i) {
      series.forEach(function (se, j) {
        var v = se.data[i] || 0;
        var h = (v / max) * ih;
        var x = pl + i * gw + gw / 2 - (series.length * bw) / 2 + j * bw;
        s += '<rect x="' + x.toFixed(1) + '" y="' + (pt + ih - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + Math.max(h, 1).toFixed(1) + '" rx="2.5" fill="' + se.color + '"/>';
      });
      s += '<text x="' + (pl + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 5) + '" font-size="8.5" fill="#9aa1b1" text-anchor="middle">' + esc(l) + '</text>';
    });
    s += '</svg>';
    var wrap = el('div', null, s);
    if (series.length > 1) {
      var lg = el('div', { class: 'wrap mt6' });
      series.forEach(function (se) { lg.appendChild(el('span', { class: 'small', style: 'color:' + se.color }, '● ' + esc(se.name))); });
      wrap.appendChild(lg);
    }
    return wrap;
  }

  /* ---------- 小工具 ---------- */
  function statRow(items) {
    var g = el('div', { class: 'st-grid' });
    items.forEach(function (i) {
      var b = el('div', { class: 'st' });
      b.appendChild(el('div', { class: 'sv', style: 'color:' + (i.color || '#1f2330') }, i.value));
      b.appendChild(el('div', { class: 'sl' }, esc(i.label)));
      g.appendChild(b);
    });
    return g;
  }
  function subTitle(t, btn) {
    var r = el('div', { class: 'sec' });
    r.appendChild(el('div', { class: 'sec-t' }, esc(t)));
    if (btn) r.appendChild(btn);
    return r;
  }
  function btn(text, cls, fn) { var b = el('button', { class: 'btn ' + (cls || 'sm') }, text); b.onclick = fn; return b; }

  W.C = {
    card: card, sectionPage: sectionPage, focus: focusSec, weekcheck: weekcheck, tasklist: tasklist,
    note: note, tree: tree, linkgrid: linkgrid, chartBox: chartBox, svgLine: svgLine, svgBar: svgBar,
    statRow: statRow, subTitle: subTitle, btn: btn, mediaImg: mediaImg, openDoc: openDoc
  };
})();
