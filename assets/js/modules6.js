/* ===== 页面模块 F：小说 / 书籍 ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  W.P = W.P || {};
  var multiOn = false, multiSel = {};

  /* ============ 小说 / 书籍 ============ */
  W.P.novel = function (v) {
    var s = S.get();
    if (!s.novel) s.novel = { cats: [], readLog: {} };
    if (!s.novel.cats) s.novel.cats = [];
    if (!s.novel.readLog) s.novel.readLog = {};

    function findCat(id) { return s.novel.cats.filter(function (c) { return c.id === id; })[0]; }
    function favCat() {
      var c = s.novel.cats.filter(function (x) { return x.name === '番茄收藏'; })[0];
      if (!c) { c = { id: U.uid(), name: '番茄收藏', icon: '🍅', src: 'https://fanqienovel.com/bookshelf?enter_from=menu', books: [], docs: [] }; s.novel.cats.unshift(c); }
      if (!c.docs) c.docs = [];
      return c;
    }
    /* 在 App 内直接打开书籍详情（不跳转番茄网页） */
    function openBook(cat, book) {
      if (book.readCh == null) book.readCh = 0;
      var box = el('div');
      var head = el('div', { class: 'nv-head' });
      head.appendChild(el('div', { class: 'nv-cover' }, book.cover || '📕'));
      var meta = el('div', { class: 'nv-meta' });
      meta.appendChild(el('div', { class: 'nv-title' }, esc(book.title)));
      meta.appendChild(el('div', { class: 'nv-author' }, '✍️ ' + esc(book.author || '佚名')));
      if (book.group) meta.appendChild(el('div', { class: 'nv-status' }, '📂 分组：' + esc(book.group)));
      if (book.status) meta.appendChild(el('div', { class: 'nv-status' }, '📌 ' + esc(book.status)));
      if ((book.chapters || 0)) meta.appendChild(el('div', { class: 'nv-status' }, '📄 共 ' + book.chapters + ' 章（约 ' + Math.round((book.chapters || 0) * 1500 / 10000) + ' 万字）'));
      head.appendChild(meta);
      box.appendChild(head);
      if (book.tags && book.tags.length) {
        var tg = el('div', { class: 'nv-tags' });
        book.tags.forEach(function (t) { tg.appendChild(el('span', { class: 'tag' }, '#' + esc(t))); });
        box.appendChild(tg);
      }
      if (book.desc) box.appendChild(el('div', { class: 'nv-desc' }, esc(book.desc)));
      if (book.note) box.appendChild(el('div', { class: 'nv-note' }, '📝 ' + esc(book.note)));
      /* 阅读进度 */
      var prog = (cat.readLog && cat.readLog[book.id]) || { pct: 0 };
      box.appendChild(el('div', { class: 'nv-prog' }, '已读 ' + (prog.pct || 0) + '%　·　已读 ' + (book.readCh || 0) + ' 章'));
      var bar = el('div', { class: 'nv-bar' });
      var fill = el('div', { class: 'nv-bar-fill' }); fill.style.width = (prog.pct || 0) + '%'; bar.appendChild(fill);
      box.appendChild(bar);
      var ops = el('div', { class: 'row mt8' });
      function setProg(delta) {
        var p = Math.max(0, Math.min(100, (prog.pct || 0) + delta));
        if (!cat.readLog) cat.readLog = {};
        cat.readLog[book.id] = { pct: p, at: U.today() };
        if (!s.novel.readLog[U.today()]) s.novel.readLog[U.today()] = 0;
        s.novel.readLog[U.today()] += Math.max(0, delta);
        var ck = S.ck('novel'); if (!ck.tasks.length) ck.tasks.push({ id: U.uid(), name: '小说阅读 20 分钟' });
        var d = U.today(); if (!ck.rec[d]) ck.rec[d] = []; if (ck.rec[d].indexOf(ck.tasks[0].id) < 0) ck.rec[d].push(ck.tasks[0].id);
        S.save(); U.toast('进度已更新为 ' + p + '%'); openBook(cat, book);
      }
      ops.appendChild(C.btn('➖5%', 'sm', function () { setProg(-5); }));
      ops.appendChild(C.btn('➕5%', 'pri sm', function () { setProg(5); }));
      ops.appendChild(C.btn('➖1章', 'sm', function () { book.readCh = Math.max(0, (book.readCh || 0) - 1); S.save(); openBook(cat, book); }));
      ops.appendChild(C.btn('➕1章', 'sm', function () { book.readCh = (book.readCh || 0) + 1; S.save(); openBook(cat, book); }));
      box.appendChild(ops);
      var ops2 = el('div', { class: 'row mt8' });
      ops2.appendChild(C.btn('✏️ 笔记', 'sm', function () {
        U.modal({ title: '书籍笔记 · ' + book.title, fields: [{ key: 'n', label: '笔记 / 读后感', type: 'textarea', rows: 4, value: book.note || '' }] })
          .then(function (r) { if (r) { book.note = r.n; S.save(); U.toast('已保存'); openBook(cat, book); } });
      }));
      ops2.appendChild(C.btn('🔖 收藏', 'sm', function () {
        var favs = S.get().favs || [];
        if (favs.some(function (f) { return f.kind === 'novel' && f.ref === book.id; })) { U.toast('已在收藏'); return; }
        favs.unshift({ id: U.uid(), kind: 'novel', ref: book.id, title: book.title, sub: book.author, icon: book.cover || '📕', ts: Date.now() });
        S.save(); U.toast('已收藏');
      }));
      box.appendChild(ops2);
      var cntStepper = el('div', { class: 'row mt8', style: 'align-items:center' });
      cntStepper.appendChild(C.btn('－', 'sm', function () { book.count = Math.max(1, (book.count || 1) - 1); S.save(); U.toast('数量 ×' + book.count); openBook(cat, book); }));
      cntStepper.appendChild(el('div', { style: 'padding:6px 14px;font-weight:800;font-size:15px' }, '×' + (book.count || 1)));
      cntStepper.appendChild(C.btn('＋', 'sm', function () { book.count = (book.count || 1) + 1; S.save(); U.toast('数量 ×' + book.count); openBook(cat, book); }));
      box.appendChild(cntStepper);
      U.modal({ title: '书籍详情', html: '<div id="nv-detail"></div>', okText: '关闭', wide: true })
        .then(function () { if (W.__novelDirty) { W.__novelDirty = false; W.render(); } });
      setTimeout(function () { var r = document.getElementById('nv-detail'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    /* 在 App 内打开分组（某分类全部书籍） */
    function openGroup(cat) {
      var box = el('div');
      box.appendChild(el('div', { class: 'small muted mb8' }, '🍅 番茄收藏 · 共 ' + ((cat.books || []).length) + ' 本，App 内直接阅读'));
      var grid = el('div', { class: 'nv-grid' });
      (cat.books || []).forEach(function (b) {
        var card = el('div', { class: 'nv-card' });
        card.appendChild(el('div', { class: 'nv-card-cover' }, b.cover || '📕'));
        card.appendChild(el('div', { class: 'nv-card-t' }, esc(b.title)));
        if (b.author) card.appendChild(el('div', { class: 'nv-card-a' }, esc(b.author || '')));
        if (b.group) card.appendChild(el('div', { class: 'nv-card-g' }, '📂' + esc(b.group)));
        card.onclick = function () { openBook(cat, b); };
        grid.appendChild(card);
      });
      box.appendChild(grid);
      U.modal({ title: '🍅 ' + cat.name, html: '<div id="nv-group"></div>', wide: true, okText: '关闭' });
      setTimeout(function () { var r = document.getElementById('nv-group'); if (r) { r.innerHTML = ''; r.appendChild(box); } }, 30);
    }

    /* 批量粘贴导入番茄书单 */
    function importShelf(cat) {
      U.modal({
        title: '📥 导入番茄书架',
        html: '<div class="small muted mb8">把番茄小说书架里的书粘贴进来（App 内直接打开，不会跳到番茄网页）。每行一本，支持「书名 / 作者」或用「| - · ——」分隔；带 fanqienovel 链接的会记下来源。</div>',
        fields: [{ key: 'txt', label: '书单（每行一本）', type: 'textarea', rows: 8, ph: '诡秘之主 / 爱潜水的乌贼\n庆余年 | 猫腻\nhttps://fanqienovel.com/page/1234567 雪中悍刀行 烽火戏诸侯' }],
        okText: '导入'
      }).then(function (r) {
        if (!r || !r.txt) return;
        var lines = String(r.txt).split(/\r?\n/);
        var added = 0;
        lines.forEach(function (ln) {
          ln = ln.trim(); if (!ln) return;
          var title = ln, author = '', group = '', url = '';
          var um = ln.match(/https?:\/\/\S+/); if (um) { url = um[0]; ln = ln.replace(url, '').trim(); }
          var sep = ln.search(/\s*[\/|\-·—–]\s*/);
          if (sep > 0 && !/^https?:/.test(ln)) {
            title = ln.slice(0, sep).trim();
            var rest = ln.slice(sep).replace(/^[\/|\-·—–\s]+/, '').trim();
            var a2 = rest.search(/\s+[\/|\-·—–]\s+/);
            if (a2 > 0) { author = rest.slice(0, a2).trim(); group = rest.slice(a2).replace(/^[\/|\-·—–\s]+/, '').trim(); }
            else author = rest;
          }
          if (!title) return;
          cat.books = cat.books || [];
          cat.books.push({ id: U.uid(), title: title, author: author, group: group, cover: ['📕', '📗', '📘', '📙', '📔'][cat.books.length % 5], tags: [], status: '', note: '', desc: '', chapters: 0, readCh: 0, count: 1, srcUrl: url });
          added++;
        });
        S.save(); W.__novelDirty = true; U.toast('已导入 ' + added + ' 本'); W.render();
      });
    }

    function editBook(cat, book) {
      U.modal({
        title: '编辑书籍',
        fields: [
          { key: 't', label: '书名', value: book.title }, { key: 'a', label: '作者', value: book.author || '' },
          { key: 'g', label: '分组', value: book.group || '' }, { key: 'st', label: '状态', value: book.status || '' },
          { key: 'ch', label: '章节数', type: 'number', value: book.chapters || 0 },
          { key: 'n', label: '笔记', type: 'textarea', rows: 3, value: book.note || '' }
        ]
      }).then(function (r) {
        if (!r) return;
        book.title = r.t; book.author = r.a; book.group = r.g; book.status = r.st; book.chapters = +r.ch || 0; book.note = r.n;
        S.save(); W.render();
      });
    }

    C.sectionPage(v, {
      id: 'novel',
      top: function (m) {
        var total = 0, favs = (S.get().favs || []).filter(function (f) { return f.kind === 'novel'; }).length;
        s.novel.cats.forEach(function (c) { (c.books || []).forEach(function (bk) { total += (bk.count || 1); }); });
        var todayMin = s.novel.readLog[U.today()] || 0;
        m.appendChild(C.statRow([
          { value: total, label: '藏书（本）' },
          { value: s.novel.cats.length, label: '分类', color: '#2fbf87' },
          { value: favs, label: '已收藏', color: '#f0a020' },
          { value: todayMin + '分', label: '今日阅读' }
        ]));
      },
      sections: [
        {
          key: 'nv_fanqie', icon: '🍅', title: '番茄收藏', sub: '来自番茄小说书架 · App 内直接打开书籍 / 分组 / 文档',
          render: function (b) {
            var cat = favCat();
            var selectMode = false, selected = [];
            var row = el('div', { class: 'row mb8' });
            row.appendChild(C.btn('📥 导入书单', 'pri sm', function () { importShelf(cat); }));
            row.appendChild(C.btn('📂 打开分组', 'sm', function () { openGroup(cat); }));
            row.appendChild(C.btn('📄 导入文档', 'sm', function () { importDocs(cat); }));
            row.appendChild(C.btn('➕ 单本', 'sm', function () {
              U.modal({ title: '添加书籍', fields: [{ key: 't', label: '书名' }, { key: 'a', label: '作者' }, { key: 'g', label: '分组（可空）' }] })
                .then(function (r) { if (r && r.t) { cat.books.push({ id: U.uid(), title: r.t, author: r.a, group: r.g, cover: '📕', tags: [], status: '', note: '', desc: '', chapters: 0, readCh: 0 }); S.save(); W.render(); } });
            }));
            b.appendChild(row);

            /* 批量选择：可分组 / 可删除 */
            var multiRow = el('div', { class: 'row mb8' });
            var multiBtn = C.btn('☐ 批量选择', 'sm', function () { selectMode = !selectMode; selected = []; drawBooks(); });
            multiRow.appendChild(multiBtn);
            var actionBar = el('div', { class: 'row mb8', style: 'display:none' });
            actionBar.appendChild(C.btn('📂 加入分组', 'pri sm', assignGroup));
            actionBar.appendChild(C.btn('🗑 删除', 'sm dan', deleteSelected));
            actionBar.appendChild(C.btn('取消', 'sm', function () { selectMode = false; selected = []; drawBooks(); }));
            multiRow.appendChild(actionBar);
            b.appendChild(multiRow);

            function drawBooks() {
              var old = b.querySelector('.nv-fav-grid'); if (old) old.remove();
              var oldEmpty = b.querySelector('.nv-fav-empty'); if (oldEmpty) oldEmpty.remove();
              multiBtn.textContent = selectMode ? '☑ 完成选择' : '☐ 批量选择';
              actionBar.style.display = (selectMode && selected.length) ? 'flex' : 'none';
              if (!(cat.books || []).length) { var e = el('div', { class: 'empty nv-fav-empty' }, '<span class="ei">🍅</span>还没有书，点「导入书单」粘贴番茄书架'); b.appendChild(e); return; }
              var grid = el('div', { class: 'nv-grid nv-fav-grid' });
              cat.books.forEach(function (book) {
                var isSel = selected.indexOf(book.id) >= 0;
                var card = el('div', { class: 'nv-card' + (selectMode && isSel ? ' sel' : '') });
                card.appendChild(el('div', { class: 'nv-card-cover' }, book.cover || '📕'));
                if (selectMode) {
                  var chk = el('div', { class: 'nv-card-chk' }, isSel ? '✅' : '⬜');
                  card.appendChild(chk);
                }
                card.appendChild(el('div', { class: 'nv-card-t' }, esc(book.title)));
                if (book.author) card.appendChild(el('div', { class: 'nv-card-a' }, esc(book.author)));
                if (book.group) card.appendChild(el('div', { class: 'nv-card-g' }, '📂' + esc(book.group)));
                if ((book.count || 1) > 1) card.appendChild(el('div', { class: 'nv-card-g' }, '×' + (book.count || 1)));
                card.onclick = function () {
                  if (selectMode) {
                    var i = selected.indexOf(book.id);
                    if (i >= 0) selected.splice(i, 1); else selected.push(book.id);
                    drawBooks();
                    return;
                  }
                  openBook(cat, book);
                };
                grid.appendChild(card);
              });
              b.appendChild(grid);
            }
            function assignGroup() {
              if (!selected.length) return;
              var groups = {};
              cat.books.forEach(function (b) { if (b.group) groups[b.group] = true; });
              var items = Object.keys(groups).map(function (g) { return { v: g, text: g, icon: '📂' }; });
              items.unshift({ v: '__new', text: '＋ 新建分组', icon: '➕' });
              U.sheet('把 ' + selected.length + ' 本书加入分组', items).then(function (v) {
                if (!v) return;
                if (v === '__new') {
                  U.prompt('新建分组', '分组名称').then(function (g) {
                    if (!g) return;
                    applyGroup(g);
                  });
                } else applyGroup(v);
              });
            }
            function applyGroup(g) {
              cat.books.forEach(function (b) { if (selected.indexOf(b.id) >= 0) b.group = g; });
              S.save(); U.toast('已加入分组「' + g + '」'); selectMode = false; selected = []; drawBooks(); W.__novelDirty = true;
            }
            function deleteSelected() {
              if (!selected.length) return;
              U.confirm('确定删除选中的 ' + selected.length + ' 本书？').then(function (ok) {
                if (!ok) return;
                cat.books = (cat.books || []).filter(function (b) { return selected.indexOf(b.id) < 0; });
                S.save(); U.toast('已删除 ' + selected.length + ' 本'); selectMode = false; selected = []; drawBooks(); W.__novelDirty = true;
              });
            }

            /* 文档库 */
            function drawDocs() {
              var old = b.querySelector('.nv-docs'); if (old) old.remove();
              var wrap = el('div', { class: 'nv-docs' });
              wrap.appendChild(C.subTitle('📄 文档库（' + (cat.docs || []).length + '）'));
              var r = el('div', { class: 'row mb8' });
              r.appendChild(C.btn('📥 导入文档', 'pri sm', function () { importDocs(cat); }));
              r.appendChild(C.btn('✚ 新建文档', 'sm', function () { newDoc(cat); }));
              wrap.appendChild(r);
              if (!(cat.docs || []).length) { wrap.appendChild(el('div', { class: 'empty small' }, '还没有文档，可导入 PDF / Word / txt')); }
              else {
                (cat.docs || []).forEach(function (d) {
                  var row = el('div', { class: 'it' });
                  row.appendChild(el('div', { class: 'ii' }, '📄'));
                  var tx = el('div', { class: 'itx' });
                  tx.appendChild(el('div', { class: 'itt' }, esc(d.title)));
                  if (d.preview) tx.appendChild(el('div', { class: 'its' }, esc(d.preview)));
                  row.appendChild(tx);
                  var op = el('button', { class: 'iconbtn' }, '⋯');
                  op.onclick = function () {
                    U.sheet(d.title, [{ v: 'open', text: '查看内容', icon: '👁️' }, { v: 'copy', text: '复制摘要', icon: '📋' }, { v: 'del', text: '删除', icon: '🗑️' }]).then(function (a) {
                      if (a === 'open') C.openDoc(d);
                      else if (a === 'copy') U.copy(d.preview || d.title);
                      else if (a === 'del') { cat.docs = cat.docs.filter(function (x) { return x.id !== d.id; }); S.save(); drawDocs(); }
                    });
                  };
                  row.appendChild(op);
                  row.onclick = function (e) { if (e.target === op) return; C.openDoc(d); };
                  wrap.appendChild(row);
                });
              }
              b.appendChild(wrap);
            }
            function importDocs(cat) {
              U.pickFile('.pdf,.doc,.docx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv', true)
                .then(function (files) {
                  if (!files || !files.length) return;
                  var ok = 0, fail = 0;
                  function next(i) {
                    if (i >= files.length) { S.save(); drawDocs(); U.toast('已导入 ' + ok + ' 个文档' + (fail ? '，' + fail + ' 个失败' : '')); return; }
                    var f = files[i];
                    U.extractDocText(f).then(function (text) {
                      if (text.length > 60000) text = text.slice(0, 60000);
                      var preview = text.replace(/\s+/g, ' ').slice(0, 120);
                      return U.Blobs.put('doc_' + U.uid(), text).then(function (bid) {
                        cat.docs.push({ id: U.uid(), type: 'doc', title: f.name, blob: bid, preview: preview, ts: Date.now() });
                        ok++; next(i + 1);
                      });
                    }).catch(function (e) { fail++; U.toast('「' + f.name + '」识别失败：' + ((e && e.message) || e)); next(i + 1); });
                  }
                  next(0);
                });
            }
            function newDoc(cat) {
              U.modal({ title: '新建文档', fields: [{ key: 't', label: '标题' }, { key: 'c', label: '内容', type: 'textarea', rows: 6 }] })
                .then(function (r) {
                  if (!r || !r.t) return;
                  var text = r.c || '';
                  U.Blobs.put('doc_' + U.uid(), text).then(function (bid) {
                    cat.docs.push({ id: U.uid(), type: 'doc', title: r.t, blob: bid, preview: text.replace(/\s+/g, ' ').slice(0, 120), ts: Date.now() });
                    S.save(); drawDocs();
                  });
                });
            }

            drawBooks(); drawDocs();
          }
        },
        {
          key: 'nv_cats', icon: '🗂️', title: '自定义分类', sub: '小说 / 书籍分类（可增删改）',
          render: function (b) {
            var others = s.novel.cats.filter(function (c) { return c.name !== '番茄收藏'; });
            b.appendChild(C.btn('＋ 新建分类', 'pri sm mb8', function () {
              U.modal({ title: '新建分类', fields: [{ key: 'n', label: '分类名' }, { key: 'ic', label: '图标 emoji', value: '📚' }] })
                .then(function (r) { if (r && r.n) { s.novel.cats.push({ id: U.uid(), name: r.n, icon: r.ic || '📚', books: [] }); S.save(); W.render(); } });
            }));
            if (!others.length) b.appendChild(el('div', { class: 'empty' }, '<span class="ei">📚</span>还没有自定义分类'));
            others.forEach(function (cat) {
              var c = el('div', { class: 'nv-cat' });
              var top = el('div', { class: 'nv-cat-top' });
              top.appendChild(el('span', { class: 'nv-cat-ic' }, cat.icon || '📚'));
              top.appendChild(el('span', { class: 'nv-cat-name' }, esc(cat.name) + ' (' + (cat.books || []).length + ')'));
              top.appendChild(C.btn('📂 打开', 'sm', function () { openGroup(cat); }));
              top.appendChild(C.btn('📥 导入', 'sm', function () { importShelf(cat); }));
              top.appendChild(C.btn('✏️', 'sm', function () {
                U.modal({ title: '重命名分类', fields: [{ key: 'n', label: '名称', value: cat.name }, { key: 'ic', label: '图标', value: cat.icon || '📚' }] })
                  .then(function (r) { if (r) { cat.name = r.n; cat.icon = r.ic; S.save(); W.render(); } });
              }));
              top.appendChild(C.btn('🗑', 'sm dan', function () {
                s.novel.cats = s.novel.cats.filter(function (x) { return x.id !== cat.id; }); S.save(); W.render();
              }));
              c.appendChild(top);
              (cat.books || []).forEach(function (book) {
                var r2 = el('div', { class: 'nv-book-row' });
                r2.appendChild(el('span', { class: 'nv-bk-ic' }, book.cover || '📕'));
                r2.appendChild(el('span', { class: 'nv-bk-t' }, esc(book.title)));
                var ro = el('div', { class: 'grow' });
                r2.appendChild(ro);
                r2.appendChild(C.btn('打开', 'sm', function () { openBook(cat, book); }));
                r2.appendChild(C.btn('✏️', 'sm', function () { editBook(cat, book); }));
                c.appendChild(r2);
              });
              b.appendChild(c);
            });
          }
        },
        {
          key: 'nv_ck', icon: '✅', title: '阅读打卡 & 任务', sub: '每日阅读 20 分钟',
          render: function (b) {
            b.appendChild(C.weekcheck('novel', { title: '小说阅读打卡' }));
            b.appendChild(C.subTitle('自定义阅读任务'));
            b.appendChild(C.tasklist('novel', { addText: '新增阅读任务' }));
          }
        }
      ]
    });
  };
})();
