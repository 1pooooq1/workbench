/* ===== 学科题库引擎（考研通用） ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  var LEVELS = ['基础', '强化', '真题'];

  /* 题目卡片 */
  function qCard(q, chap, redraw) {
    var box = el('div', { class: 'q' });
    var h = el('div', { class: 'qh' });
    h.appendChild(el('span', { class: 'tag ' + (q.level === '基础' ? 'ok' : q.level === '强化' ? 'warn' : 'pur') }, q.level));
    if (q.wrong) h.appendChild(el('span', { class: 'tag red' }, '错题'));
    if (q.fav) h.appendChild(el('span', { class: 'tag pri' }, '收藏'));
    if (q.ai) h.appendChild(el('span', { class: 'tag' }, 'AI 生成'));
    if (q.src) h.appendChild(el('span', { class: 'tag' }, esc(q.src)));
    h.appendChild(el('div', { class: 'grow' }));
    var more = el('button', { class: 'iconbtn' }, '⋯');
    h.appendChild(more);
    box.appendChild(h);
    box.appendChild(el('div', { class: 'qt' }, esc(q.text)));
    if (q.img) box.appendChild(C.mediaImg(q.img));
    var ans = el('div', { class: 'qa' }, esc(q.answer || '（暂无答案解析，点⋯编辑补充）'));
    box.appendChild(ans);
    var ops = el('div', { class: 'row mt6' });
    var sw = C.btn('查看答案', 'sm', function () { box.classList.toggle('show'); sw.textContent = box.classList.contains('show') ? '隐藏答案' : '查看答案'; });
    var w = C.btn(q.wrong ? '✓ 已入错题本' : '标记错题', 'sm', function () { q.wrong = !q.wrong; S.save(); redraw(); });
    var f = C.btn(q.fav ? '★ 已收藏' : '☆ 收藏', 'sm', function () { q.fav = !q.fav; S.save(); redraw(); });
    ops.appendChild(sw); ops.appendChild(w); ops.appendChild(f);
    box.appendChild(ops);
    more.onclick = function () {
      U.sheet('题目操作', [
        { v: 'edit', text: '编辑题目 / 答案', icon: '✏️' },
        { v: 'img', text: '拍照上传题图', icon: '📷' },
        { v: 'copy', text: '复制题目', icon: '📋' },
        { v: 'ai', text: '让 AI 讲解这道题', icon: '🤖' },
        { v: 'del', text: '删除', icon: '🗑️' }
      ]).then(function (a) {
        if (a === 'edit') U.modal({
          title: '编辑题目', fields: [
            { key: 't', label: '题干', type: 'textarea', value: q.text, rows: 5 },
            { key: 'a', label: '答案 / 解析', type: 'textarea', value: q.answer || '', rows: 4 },
            { key: 'l', label: '难度层级', type: 'select', value: q.level, options: LEVELS.map(function (x) { return { v: x, t: x }; }) },
            { key: 's', label: '来源标注', value: q.src || '' }
          ]
        }).then(function (v) { if (v) { q.text = v.t; q.answer = v.a; q.level = v.l; q.src = v.s; S.save(); redraw(); } });
        else if (a === 'img') U.pickFile('image/*').then(function (f2) {
          if (!f2) return;
          U.readImage(f2, 1000).then(function (d) { var id = U.uid(); U.Blobs.put(id, d).then(function () { q.img = id; S.save(); redraw(); U.toast('已上传题图'); }); });
        });
        else if (a === 'copy') U.copy(q.text + '\n\n' + (q.answer || ''));
        else if (a === 'ai') aiAsk('请详细讲解这道题的解题思路、涉及考点与易错点：\n' + q.text + (q.answer ? '\n参考答案：' + q.answer : ''));
        else if (a === 'del') { chap.qs = chap.qs.filter(function (x) { return x.id !== q.id; }); S.save(); redraw(); }
      });
    };
    return box;
  }

  function aiAsk(prompt) {
    U.copy(prompt);
    U.sheet('已复制提示词，选择 AI 工具', S.AI_ENGINES.map(function (e) { return { v: e.url, text: e.name, icon: e.icon }; }))
      .then(function (u) { if (u) U.open(u.replace('%s', encodeURIComponent(prompt.slice(0, 900)))); });
  }

  /* AI 出题（本地模板 + 一键转 AI） */
  var TPL = [
    ['简答', '简述「{p}」的核心概念、适用条件与常见误区。'],
    ['计算', '结合「{p}」，构造一道计算题：给定条件后求解，并写出完整推导步骤。'],
    ['辨析', '判断并说明理由：关于「{p}」，下列说法是否成立？请举反例或给出证明。'],
    ['名词解释', '名词解释：{p}（要求 100 字以内，点出定义、性质、作用）。'],
    ['应用', '举一个实际场景，说明「{p}」如何应用，并指出使用前提。']
  ];
  function aiGen(chap, redraw) {
    var pts = (chap.points || []).map(function (p) { return p.title; });
    if (!pts.length) { U.toast('该章节还没有知识点'); return; }
    U.modal({
      title: 'AI 出题 · ' + chap.name,
      fields: [
        { key: 'p', label: '选择知识点', type: 'select', value: pts[0], options: pts.map(function (p) { return { v: p, t: p }; }) },
        { key: 'n', label: '生成数量', type: 'select', value: '3', options: [{ v: '1', t: '1 题' }, { v: '3', t: '3 题' }, { v: '5', t: '5 题' }] },
        { key: 'l', label: '难度', type: 'select', value: '基础', options: LEVELS.map(function (x) { return { v: x, t: x }; }) }
      ], required: false, okText: '生成到题库'
    }).then(function (v) {
      if (!v) return;
      var n = +v.n;
      for (var i = 0; i < n; i++) {
        var t = TPL[i % TPL.length];
        chap.qs.push({ id: U.uid(), text: '【' + t[0] + '】' + t[1].replace('{p}', v.p), answer: '', level: v.l, ai: true, ts: Date.now() });
      }
      S.save(); redraw();
      U.toast('已生成 ' + n + ' 道题，可点「让 AI 讲解」补全答案');
    });
  }

  /* 章节 */
  function chapterBlock(chap, chapters, ckKey, redrawAll) {
    var w = el('div', { class: 'card', style: 'box-shadow:none;border:1px solid var(--line);margin-bottom:8px' });
    if (chap.open) w.classList.add('open');
    var hd = el('div', { class: 'card-hd', style: 'padding:9px 10px' });
    hd.appendChild(el('div', { class: 'ch-ic', style: 'background:var(--card2);width:24px;height:24px;font-size:12px' }, '§'));
    var tx = el('div', { class: 'ch-tx' });
    tx.appendChild(el('div', { class: 'ch-t', style: 'font-size:13px' }, esc(chap.name)));
    var nQ = chap.qs.length, nW = chap.qs.filter(function (q) { return q.wrong; }).length;
    tx.appendChild(el('div', { class: 'ch-s' }, (chap.points || []).length + ' 个知识点 · ' + nQ + ' 题' + (nW ? ' · 错题 ' + nW : '')));
    hd.appendChild(tx);
    var mb = el('button', { class: 'iconbtn no-toggle' }, '⋯');
    mb.onclick = function (e) {
      e.stopPropagation();
      U.sheet(chap.name, [
        { v: 'kp', text: '新增知识点', icon: '💡' },
        { v: 'q', text: '手动录入题目', icon: '✍️' },
        { v: 'photo', text: '拍照上传试卷/习题', icon: '📷' },
        { v: 'ai', text: 'AI 依据知识点出题', icon: '🤖' },
        { v: 'ren', text: '重命名章节', icon: '✏️' },
        { v: 'del', text: '删除章节', icon: '🗑️' }
      ]).then(function (a) {
        if (a === 'kp') addPoint(chap, redrawAll);
        else if (a === 'q') addQ(chap, redrawAll);
        else if (a === 'photo') photoQ(chap, redrawAll);
        else if (a === 'ai') aiGen(chap, redrawAll);
        else if (a === 'ren') U.prompt('重命名', '章节名称', chap.name).then(function (v) { if (v) { chap.name = v; S.save(); redrawAll(); } });
        else if (a === 'del') U.confirm('删除章节', '该章节下知识点与题目都会删除').then(function (ok) { if (ok) { var i = chapters.indexOf(chap); chapters.splice(i, 1); S.save(); redrawAll(); } });
      });
    };
    hd.appendChild(mb);
    hd.appendChild(el('div', { class: 'ch-ar' }, '▶'));
    hd.onclick = function (e) { if (e.target.closest('.no-toggle')) return; chap.open = !chap.open; S.save(); w.classList.toggle('open'); };
    w.appendChild(hd);

    var bd = el('div', { class: 'card-bd', style: 'padding:0 10px 10px' });
    /* 知识点 */
    bd.appendChild(C.subTitle('知识点', C.btn('＋ 知识点', 'sm', function () { addPoint(chap, redrawAll); })));
    if (!(chap.points || []).length) bd.appendChild(el('div', { class: 'small muted' }, '暂无知识点'));
    (chap.points || []).forEach(function (p) {
      var k = el('div', { class: 'kp' + (p.open ? ' open' : '') });
      var t = el('div', { class: 'kt', style: 'display:flex;gap:6px;align-items:center' });
      t.appendChild(el('span', { class: 'grow' }, esc(p.title)));
      t.appendChild(el('span', { class: 'small muted' }, p.open ? '收起' : '展开'));
      t.onclick = function () { p.open = !p.open; S.save(); redrawAll(); };
      k.appendChild(t);
      var c = el('div', { class: 'kc' }, esc(p.content || '（点击下方"编辑"补充这条知识点的内容）'));
      k.appendChild(c);
      if (p.open) {
        var r = el('div', { class: 'row mt6' });
        r.appendChild(C.btn('编辑', 'sm', function () {
          U.modal({ title: '编辑知识点', fields: [{ key: 't', label: '标题', value: p.title }, { key: 'c', label: '内容', type: 'textarea', value: p.content, rows: 6 }] })
            .then(function (v) { if (v) { p.title = v.t; p.content = v.c; S.save(); redrawAll(); } });
        }));
        r.appendChild(C.btn('AI 出题', 'sm', function () {
          chap.qs.push({ id: U.uid(), text: '【简答】简述「' + p.title + '」的核心内容与考查方式。', answer: '', level: '基础', ai: true, ts: Date.now() });
          S.save(); redrawAll(); U.toast('已生成到题库');
        }));
        r.appendChild(C.btn('AI 精讲', 'sm', function () { aiAsk('请系统讲解考研知识点「' + p.title + '」（' + chap.name + '）：定义、公式推导、考查角度、易错点、典型例题各一。'); }));
        r.appendChild(C.btn('删除', 'sm', function () { chap.points = chap.points.filter(function (x) { return x.id !== p.id; }); S.save(); redrawAll(); }));
        k.appendChild(r);
      }
      bd.appendChild(k);
    });

    /* 题库 */
    var filt = chap.__f || '全部';
    var head = el('div', { class: 'sec' });
    head.appendChild(el('div', { class: 'sec-t' }, '题库 (' + chap.qs.length + ')'));
    var ops = el('div', { class: 'row' });
    ops.appendChild(C.btn('✍️ 录题', 'sm', function () { addQ(chap, redrawAll); }));
    ops.appendChild(C.btn('📷 拍照', 'sm', function () { photoQ(chap, redrawAll); }));
    ops.appendChild(C.btn('🤖 AI', 'sm', function () { aiGen(chap, redrawAll); }));
    head.appendChild(ops);
    bd.appendChild(head);

    var seg = el('div', { class: 'seg mb8' });
    ['全部'].concat(LEVELS).concat(['错题本', '收藏']).forEach(function (t) {
      var b = el('button', { class: filt === t ? 'on' : '' }, t);
      b.onclick = function () { chap.__f = t; redrawAll(); };
      seg.appendChild(b);
    });
    bd.appendChild(seg);
    var list = chap.qs.filter(function (q) {
      if (filt === '全部') return true;
      if (filt === '错题本') return q.wrong;
      if (filt === '收藏') return q.fav;
      return q.level === filt;
    });
    if (!list.length) bd.appendChild(el('div', { class: 'empty' }, '<span class="ei">📝</span>该分类下暂无题目'));
    list.forEach(function (q) { bd.appendChild(qCard(q, chap, redrawAll)); });
    w.appendChild(bd);
    return w;
  }

  function addPoint(chap, redraw) {
    U.modal({ title: '新增知识点 · ' + chap.name, fields: [{ key: 't', label: '知识点标题' }, { key: 'c', label: '内容（可空）', type: 'textarea' }] })
      .then(function (v) { if (!v) return; chap.points.push({ id: U.uid(), title: v.t, content: v.c, open: false }); chap.open = true; S.save(); redraw(); });
  }
  function addQ(chap, redraw) {
    U.modal({
      title: '录入题目 · ' + chap.name, fields: [
        { key: 't', label: '题干', type: 'textarea', rows: 5 },
        { key: 'a', label: '答案 / 解析', type: 'textarea', rows: 3 },
        { key: 'l', label: '难度层级', type: 'select', value: '基础', options: LEVELS.map(function (x) { return { v: x, t: x }; }) },
        { key: 's', label: '来源（如 2023 真题）' }
      ]
    }).then(function (v) {
      if (!v) return;
      chap.qs.push({ id: U.uid(), text: v.t, answer: v.a, level: v.l, src: v.s, ts: Date.now() });
      chap.open = true; S.save(); redraw(); U.toast('已录入');
    });
  }
  function photoQ(chap, redraw) {
    U.pickFile('image/*', true).then(function (fs) {
      if (!fs || !fs.length) return;
      var q = fs.map(function (f) {
        return U.readImage(f, 1100).then(function (d) {
          var id = U.uid();
          return U.Blobs.put(id, d).then(function () {
            chap.qs.push({ id: U.uid(), text: '【拍照上传】' + f.name, answer: '', level: '基础', img: id, ts: Date.now() });
          });
        });
      });
      Promise.all(q).then(function () { chap.open = true; S.save(); redraw(); U.toast('已上传 ' + fs.length + ' 张试题图'); });
    });
  }

  /* 子模块（如高等数学） */
  function subBlock(sub, mount, redrawAll) {
    var body = el('div');
    var st = { b: 0, q: 0, w: 0, f: 0 };
    sub.chapters.forEach(function (c) {
      st.q += c.qs.length;
      c.qs.forEach(function (q) { if (q.wrong) st.w++; if (q.fav) st.f++; });
      st.b += (c.points || []).length;
    });
    body.appendChild(C.statRow([
      { value: sub.chapters.length, label: '章节' }, { value: st.b, label: '知识点' },
      { value: st.q, label: '题目' }
    ]));
    var r = el('div', { class: 'row mb8' });
    r.appendChild(el('span', { class: 'tag red' }, '错题 ' + st.w));
    r.appendChild(el('span', { class: 'tag pri' }, '收藏 ' + st.f));
    r.appendChild(el('div', { class: 'grow' }));
    r.appendChild(C.btn('＋ 新增章节', 'sm', function () {
      U.prompt('新增章节', '章节名称').then(function (v) { if (v) { sub.chapters.push(S.chapter(v, [])); S.save(); redrawAll(); } });
    }));
    body.appendChild(r);
    sub.chapters.forEach(function (c) { body.appendChild(chapterBlock(c, sub.chapters, sub.id, redrawAll)); });
    mount.appendChild(body);
  }

  /* 科目页 */
  function subject(mount, subj, redrawAll) {
    /* 资料区 */
    mount.appendChild(C.card({
      key: 'ky_res_' + subj.id, icon: '📚', title: '资料 · 教材 / 电子书 / 网课视频',
      sub: '存放参考教材、电子版课本、配套教学视频，可对接 APP / 网址',
      render: function (b) {
        b.appendChild(C.subTitle('资料文件夹（支持无限层级、上传图片/音视频）'));
        b.appendChild(C.tree('ky_res_' + subj.id));
        b.appendChild(C.subTitle('网课 / APP / 网址快捷入口'));
        b.appendChild(C.linkgrid('ky_link_' + subj.id, { tag: subj.name, filter: true }));
        b.appendChild(C.subTitle('上传视频'));
        var up = C.btn('🎬 上传本地视频 / 课程片段', 'sm blk', function () {
          U.pickFile('video/*').then(function (f) {
            if (!f) return;
            U.readAsDataURL(f).then(function (d) {
              var id = U.uid();
              U.Blobs.put(id, d).then(function () {
                var fs = S.folders('ky_res_' + subj.id);
                if (!fs.length) fs.push(S.folder('课程视频', '🎬'));
                fs[0].items.push({ id: U.uid(), type: 'video', title: f.name, blob: id, ts: Date.now() });
                S.save(); U.toast('已存入「' + fs[0].name + '」'); redrawAll();
              });
            });
          });
        });
        b.appendChild(up);
      }
    }));
    /* 各子模块 */
    subj.subs.forEach(function (sub) {
      mount.appendChild(C.card({
        key: 'ky_sub_' + subj.id + '_' + sub.id, icon: '📗', title: sub.name,
        sub: sub.chapters.length + ' 章 · 点击展开章节知识点与题库',
        render: function (b) { subBlock(sub, b, redrawAll); }
      }));
    });
    /* 打卡 + 任务 + 笔记 */
    mount.appendChild(C.card({
      key: 'ky_ck_' + subj.id, icon: '✅', title: '周打卡 & 备考任务',
      sub: '记录每日刷题、看书、网课学习',
      render: function (b) {
        b.appendChild(C.weekcheck('ky_' + subj.id, { title: subj.name + ' 周打卡' }));
        b.appendChild(C.subTitle('自定义备考任务'));
        b.appendChild(C.tasklist('ky_' + subj.id, { addText: '新增备考任务' }));
        b.appendChild(C.subTitle('学习笔记 / 心得'));
        b.appendChild(C.note('ky_' + subj.id));
      }
    }));
  }

  W.Exam = { subject: subject, chapterBlock: chapterBlock, aiAsk: aiAsk, subBlock: subBlock };
})();
