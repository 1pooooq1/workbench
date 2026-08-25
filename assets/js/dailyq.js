/*
 * 每日十问 —— 放在「每日计划 · 感受」下方的反思工具
 * 功能：今日随机抽取问题作答 / 月历展示（有记录的日子显示小圆点）/ 点击任意日期查看当天问答 / 本地储存
 * 数据：统一存于 S.get().dailyQ（随站点整体状态保存，不会因刷新丢失）
 */
(function () {
  var DEFAULT_QUESTIONS = [
    "今天最想推进的一颗种子是什么？",
    "此刻是聚焦型还是发散型？",
    "哪个文件夹今天可以不用打开？",
    "如果只做25分钟，我会碰哪件事？",
    "我现在是在整理，还是在拖延？",
    "哪件未完成的事，今晚可以安心放下？",
    "今天允许自己“乱”多久？",
    "如果给今天一个关键词，会是？",
    "最近反复问自己的问题，背后是什么情绪？",
    "今天结束时，我想对自己说什么？",
    "今天我是否在用一个“整理”来逃避另一个“开始”？",
    "此刻我的桌面/头脑里，最需要被放下的是什么？",
    "如果混乱是一种信息，它在告诉我什么？",
    "哪个“应该做”的事，今天可以理直气壮地不做？",
    "我有没有把简单的事变复杂？在哪里？",
    "今天哪个分类标准可以暂时失效？",
    "如果我的文件夹会说话，它会抱怨什么？",
    "此刻的焦虑，是来自事情太多，还是来自“我觉得应该都做完”？",
    "今天我可以把哪件事做得“够好”而不是“完美”？",
    "我的计划里，有没有给意外留位置？",
    "我现在频繁切换任务，是在逃避什么感觉？",
    "如果只能做一件事，此刻我会选哪件？为什么还没开始？",
    "哪个任务其实已经“足够完成”了，只是我不肯放手？",
    "今天有没有哪个时刻，我完全沉浸在一件事里？",
    "切换任务前，我能不能给自己10秒的“缓冲呼吸”？",
    "我是在追求效率，还是在追求“看起来很忙”？",
    "哪个任务一直在我的清单上反复出现？它在等什么？",
    "今天我做事的节奏，更像散步还是冲刺？",
    "如果给每个任务标一个“能量值”，哪个最耗电？哪个反而充电？",
    "我有没有把“想清楚”和“做起来”混为一谈？",
    "此刻身体哪个部位最紧？如果我放松它，会发生什么？",
    "今天哪个瞬间让我觉得“这样活着挺好的”？",
    "我的焦虑如果会说话，它最想让我知道什么？",
    "今天我对谁（包括自己）最不耐烦？为什么？",
    "如果情绪是一种天气，此刻我是什么天气？",
    "今天有没有哪句话，我其实不想说但还是说了？",
    "我在害怕什么？那个恐惧有几岁？",
    "今天的我，和昨天的我，有什么不同？",
    "如果我给自己写一句温柔的话，会是什么？",
    "此刻最需要被听见的声音，是我自己的哪一个？",
    "今天哪件事是“重要但不紧急”的？我给了它多少时间？",
    "如果我的工作有呼吸节奏，今天是吸气还是呼气？",
    "哪个项目需要的不是“更多时间”，而是“更清晰的下一步”？",
    "今天我是在“产出”，还是在“消耗”？",
    "哪个任务如果今天不做，三天后会变成麻烦？",
    "我有没有把别人的事放在自己的事前面？这是选择还是惯性？",
    "今天结束前，完成什么会让我觉得“今天没白过”？",
    "哪个任务我一直在用“准备”来推迟真正的开始？",
    "如果给今天的工作打个分（1-10），不是看完成量，而是看投入度，会是多少？",
    "明天早上醒来时，我希望今天已经完成了什么？",
    "我整理东西的时候，是在整理物品，还是在整理内心？",
    "有没有什么东西，我一直留着但永远不会用？",
    "哪个文件夹的名字已经不准了？需要改吗？",
    "如果我的电脑是个房间，此刻它是书房还是杂物间？",
    "分类是为了找得快，还是为了“看起来整齐”？",
    "今天我可以忍受多少“未归类”的存在？",
    "我收藏的东西里，有多少是“怕以后需要”而不是“现在需要”？",
    "如果取消一个分类，哪个分类的取消会让我最不安？",
    "我的手机相册里，哪张截图其实已经没有用了？",
    "整理到哪一步时，我会觉得“可以了”？",
    "今天有没有哪一刻，我允许自己停下来？",
    "我的休息是真正的充电，还是带着愧疚的暂停？",
    "今天下班/放学的“信号”是什么？还是我会一直拖到力竭？",
    "如果今晚不碰任何屏幕一小时，我会做什么？",
    "我对谁（包括自己）承诺了太多？",
    "今天有好好喝水/吃饭/呼吸吗？",
    "我的睡眠是不是被某个“未完成”偷走了？",
    "周末的我，和工作的我，是同一个人吗？",
    "如果给自己放半天假，最想做什么“没用”的事？",
    "此刻我最需要的休息，是身体上的，还是精神上的？",
    "今天我有没有对什么说“不”？如果没有，为什么？",
    "如果今天只能记住一件事，会是哪件？",
    "我在坚持的某个习惯/目标，是在滋养我，还是在消耗我？",
    "哪个选择我一直拖延着不做，因为怕选错？",
    "如果我不怕让任何人失望，我会怎么安排今天？",
    "今天我的时间给了谁？这是我想给的吗？",
    "有没有什么事情，我已经“完成”了，但心里还没“放下”？",
    "如果生活是一本书，今天这一章想叫什么名字？",
    "哪个“以后再说”的事，其实已经可以“现在就说”？",
    "今天走的路，是在靠近我想去的地方，还是只是原地绕圈？",
    "今天我有没有真诚地和某个人连接过？",
    "有没有哪段关系最近被我忽略了？",
    "我在谁面前可以不用“整理”自己？",
    "今天我有没有对某个人过度付出？这是爱还是讨好？",
    "哪个人的一句话，今天在我心里停留了很久？",
    "如果给自己重要的人写一句话，会是什么？",
    "我最近有没有向谁请求过帮助？还是全都自己扛？",
    "今天哪段对话让我觉得“被看见了”？",
    "我在关系里的“文件夹”也在不断分类吗？这让我更近还是更远？",
    "有没有哪个人，我想联系但一直没联系？是什么在阻挡？",
    "今天做的这些事，哪些在十年后回头看，可能不重要？哪些会很重要？",
    "如果“成功”是别人定义的，那我自己定义的成功是什么？",
    "我最近在变好，还是在变忙？",
    "如果我知道自己不会失败，此刻会做什么？",
    "今天有没有哪个瞬间，我觉得自己“在活着”而不只是“在运转”？",
    "我想要的“更多”，到底是什么更多？",
    "如果我的生命是一棵树，此刻我在长叶子，还是在扎根？",
    "今天有没有哪件事，让我觉得“这就是意义”？",
    "我想成为的那种人，今天做了什么事？",
    "如果此刻就结束，我会遗憾没做什么？"
  ];

  function getState() {
    var s = S.get();
    if (!s.dailyQ) s.dailyQ = {};
    var d = s.dailyQ;
    if (!d.questions || !d.questions.length) d.questions = DEFAULT_QUESTIONS.slice();
    if (d.dailyCount == null) d.dailyCount = 3;
    if (d.dailyCount < 1) d.dailyCount = 1;
    if (d.dailyCount > 20) d.dailyCount = 20;
    if (!d.answers) d.answers = {};
    if (!d._picked) d._picked = {};
    return d;
  }
  function save() { S.save(); }

  function todayKey() { return U.today(); }
  function esc(s) { return U.esc(s); }
  function pad(n) { return U.pad(n); }

  /* 今日问题集合（当天稳定，刷新/重渲染不换题） */
  function pickToday(st) {
    var key = todayKey();
    if (st._picked && st._picked.date === key && st._picked.qs && st._picked.qs.length) return st._picked.qs;
    var pool = st.questions.slice(), qs = [];
    var n = Math.min(st.dailyCount, pool.length);
    for (var i = 0; i < n; i++) { var r = Math.floor(Math.random() * pool.length); qs.push(pool.splice(r, 1)[0]); }
    st._picked = { date: key, qs: qs };
    save();
    return qs;
  }

  W.DailyQ = {
    render: function (mount) {
      var st = getState();
      var curTab = 'today';
      var calYM = todayKey().slice(0, 7);
      var selDate = null;
      var qs = pickToday(st);
      var qi = 0;

      function fmtDate(dk) { var p = dk.split('-'); return p[0] + '年' + parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日'; }

      function draw() {
        mount.innerHTML = '';
        /* 标签栏 */
        var tabs = el('div', { class: 'seg mb8' });
        [['today', '今日问答'], ['cal', '月历回看'], ['set', '设置']].forEach(function (t) {
          var b = el('button', { class: curTab === t[0] ? 'on' : '' }, t[1]);
          b.onclick = function () { curTab = t[0]; draw(); };
          tabs.appendChild(b);
        });
        mount.appendChild(tabs);

        if (curTab === 'today') drawToday();
        else if (curTab === 'cal') drawCal();
        else drawSettings();
      }

      /* ---------- 今日问答 ---------- */
      function drawToday() {
        var key = todayKey();
        var records = st.answers[key] || [];
        if (records.length > 0) { drawTodayDone(records); return; }

        if (qs.length === 0) {
          mount.appendChild(el('div', { class: 'card', style: 'padding:14px;text-align:center;color:var(--tx3)' }, '题库为空，请到「设置」添加问题。'));
          return;
        }
        var card = el('div', { class: 'card' });
        card.style.padding = '14px';
        card.appendChild(el('div', { class: 'small muted', style: 'letter-spacing:1px' }, '第 ' + (qi + 1) + ' 问 / 共 ' + qs.length + ' 问'));
        card.appendChild(el('div', { style: 'font-size:17px;line-height:1.6;margin:10px 0 14px' }, esc(qs[qi])));
        var ta = el('textarea', { class: 'ta', rows: 4, placeholder: '写点什么…或者不写' });
        ta.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveAnswer(); } };
        card.appendChild(ta);
        var row = el('div', { class: 'row mt6' });
        row.appendChild(C.btn('存下', 'pri', saveAnswer));
        row.appendChild(C.btn('跳过，没关系', 'gho', function () { next(); }));
        card.appendChild(row);
        mount.appendChild(card);
      }
      function saveAnswer() {
        var ta = mount.querySelector('textarea');
        var ans = ta ? ta.value.trim() : '';
        if (!ans) { next(); return; }
        var key = todayKey();
        if (!st.answers[key]) st.answers[key] = [];
        st.answers[key].push({ question: qs[qi], answer: ans, time: new Date().toISOString() });
        save();
        next();
      }
      function next() {
        qi++;
        if (qi < qs.length) draw();
        else { var r = st.answers[todayKey()] || []; drawTodayDone(r); }
      }
      function drawTodayDone(records) {
        var card = el('div', { class: 'card' });
        card.style.padding = '16px';
        card.style.textAlign = 'center';
        card.appendChild(el('div', { style: 'font-size:16px;font-weight:600' }, '今天就到这里'));
        card.appendChild(el('div', { class: 'small muted mt6' }, '今日已答 ' + records.length + ' 问，已经放下'));
        var row = el('div', { class: 'row mt10' });
        row.appendChild(C.btn('查看今日回答', 'pri', function () { curTab = 'cal'; selDate = todayKey(); draw(); }));
        row.appendChild(C.btn('重新回答', 'gho dan', function () {
          delete st.answers[todayKey()]; st._picked = {};
          qs = pickToday(st); qi = 0; draw();
        }));
        card.appendChild(row);
        mount.appendChild(card);
      }

      /* ---------- 月历 + 点击查看 ---------- */
      function drawCal() {
        var y0 = +calYM.split('-')[0], m0 = +calYM.split('-')[1];
        var cal = el('div', { class: 'cal' });
        var hd = el('div', { class: 'cal-hd' });
        hd.appendChild(C.btn('‹', 'sm', function () {
          var y = y0, m = m0 - 1; if (m < 1) { y--; m = 12; } calYM = y + '-' + pad(m); selDate = null; draw();
        }));
        hd.appendChild(el('div', { style: 'font-weight:650;font-size:13px' }, calYM));
        hd.appendChild(C.btn('›', 'sm', function () {
          var y = y0, m = m0 + 1; if (m > 12) { y++; m = 1; } calYM = y + '-' + pad(m); selDate = null; draw();
        }));
        cal.appendChild(hd);
        var g = el('div', { class: 'cal-g' });
        ['一', '二', '三', '四', '五', '六', '日'].forEach(function (w) { g.appendChild(el('div', { class: 'cal-w' }, w)); });
        var first = new Date(y0, m0 - 1, 1), off = (first.getDay() + 6) % 7;
        for (var i = 0; i < off; i++) g.appendChild(el('div', { class: 'cal-d out' }, ''));
        var dim = U.daysInMonth(y0, m0);
        for (var dd = 1; dd <= dim; dd++) {
          (function (dd) {
            var dk = y0 + '-' + pad(m0) + '-' + pad(dd);
            var recs = st.answers[dk] || [];
            var c = el('div', { class: 'cal-d' + (dk === todayKey() ? ' today' : '') + (dk === selDate ? ' sel' : '') });
            c.appendChild(el('div', null, dd));
            if (recs.length > 0) {
              var dot = el('div', { class: 'dt' });
              if (dk === selDate) dot.style.background = '#fff';
              c.appendChild(dot);
            }
            c.onclick = function () { selDate = dk; draw(); };
            g.appendChild(c);
          })(dd);
        }
        cal.appendChild(g);
        mount.appendChild(cal);

        /* 详情 */
        var dc = el('div', { class: 'card mt6' });
        dc.style.padding = '14px';
        if (!selDate) {
          dc.appendChild(el('div', { class: 'small muted', style: 'text-align:center;padding:10px 0' }, '点击上方日期，查看当天的问题与答案'));
        } else {
          var recs = st.answers[selDate] || [];
          dc.appendChild(el('div', { style: 'font-size:14px;font-weight:600;margin-bottom:10px' }, '📅 ' + fmtDate(selDate) + (recs.length ? ' · ' + recs.length + ' 个回答' : '')));
          if (recs.length === 0) {
            dc.appendChild(el('div', { class: 'small muted', style: 'text-align:center;padding:8px 0' }, '这一天没有问答记录'));
          } else {
            recs.forEach(function (r) {
              var item = el('div', { style: 'margin-bottom:12px' });
              item.appendChild(el('div', { class: 'small', style: 'color:var(--pri);margin-bottom:3px' }, 'Q：' + esc(r.question)));
              item.appendChild(el('div', { style: 'font-size:14px;line-height:1.5;white-space:pre-wrap' }, esc(r.answer)));
              dc.appendChild(item);
            });
          }
        }
        mount.appendChild(dc);
      }

      /* ---------- 设置 ---------- */
      function drawSettings() {
        var totalDays = Object.keys(st.answers).length;
        var totalAns = Object.keys(st.answers).reduce(function (s, k) { return s + st.answers[k].length; }, 0);

        var stat = el('div', { class: 'row wrap mb8' });
        stat.appendChild(el('span', { class: 'small', style: 'background:var(--pri-soft);color:var(--pri);padding:3px 9px;border-radius:14px' }, '📝 ' + totalDays + ' 天有记录'));
        stat.appendChild(el('span', { class: 'small', style: 'background:var(--pri-soft);color:var(--pri);padding:3px 9px;border-radius:14px' }, '💬 ' + totalAns + ' 个回答'));
        stat.appendChild(el('span', { class: 'small', style: 'background:var(--pri-soft);color:var(--pri);padding:3px 9px;border-radius:14px' }, '📚 ' + st.questions.length + ' 题'));
        mount.appendChild(stat);

        /* 每日抽取数量 */
        var card1 = el('div', { class: 'card' }); card1.style.padding = '14px';
        card1.appendChild(el('div', { class: 'small muted mb8' }, '每日抽取问题数量（1-20）'));
        var cnt = el('input', { class: 'inp', type: 'number', min: 1, max: 20, value: st.dailyCount, style: 'width:90px' });
        card1.appendChild(cnt);
        card1.appendChild(C.btn('保存设置', 'pri sm mt6', function () {
          var v = parseInt(cnt.value, 10) || 3;
          st.dailyCount = Math.min(Math.max(v, 1), 20);
          st._picked = {}; save(); U.toast('设置已保存'); draw();
        }));
        mount.appendChild(card1);

        /* 题库管理 */
        var card2 = el('div', { class: 'card' }); card2.style.padding = '14px';
        card2.appendChild(el('div', { style: 'font-size:15px;font-weight:600;margin-bottom:10px' }, '题库管理（' + st.questions.length + ' 题）'));
        var ar = el('div', { class: 'row mb8' });
        var ni = el('input', { class: 'inp grow', placeholder: '添加一个新问题…' });
        ni.onkeydown = function (e) { if (e.key === 'Enter') addQ(); };
        ar.appendChild(ni);
        ar.appendChild(C.btn('添加', 'pri sm', addQ));
        card2.appendChild(ar);
        function addQ() {
          var t = ni.value.trim(); if (!t) return;
          st.questions.push(t); save(); ni.value = ''; draw();
        }
        var list = el('div', { style: 'max-height:280px;overflow:auto' });
        st.questions.forEach(function (q, idx) {
          var it = el('div', { class: 'row', style: 'padding:8px 0;border-bottom:1px solid var(--line);font-size:13px;line-height:1.4' });
          it.appendChild(el('span', { class: 'grow' }, (idx + 1) + '. ' + esc(q)));
          var del = el('button', { class: 'btn sm dan', style: 'flex:none' }, '✕');
          del.onclick = function () {
            if (st.questions.length <= 1) { U.toast('至少保留一个问题'); return; }
            st.questions.splice(idx, 1); save(); draw();
          };
          it.appendChild(del);
          list.appendChild(it);
        });
        card2.appendChild(list);
        mount.appendChild(card2);

        /* 数据 */
        var card3 = el('div', { class: 'card' }); card3.style.padding = '14px';
        var dr = el('div', { class: 'row wrap' });
        dr.appendChild(C.btn('导出数据', 'sm', exportData));
        var imp = el('input', { type: 'file', accept: 'application/json', style: 'display:none' });
        imp.onchange = function () {
          var f = imp.files && imp.files[0]; if (!f) return;
          var rd = new FileReader();
          rd.onload = function () {
            try {
              var d = JSON.parse(rd.result);
              if (!d || !Array.isArray(d.questions)) throw new Error('格式不正确');
              st.questions = d.questions;
              if (d.dailyCount) st.dailyCount = Math.min(Math.max(parseInt(d.dailyCount) || 3, 1), 20);
              if (d.answers && typeof d.answers === 'object') st.answers = d.answers;
              st._picked = {}; save(); U.toast('已导入数据'); draw();
            } catch (e) { U.toast('导入失败：' + ((e && e.message) || e)); }
          };
          rd.readAsText(f);
        };
        dr.appendChild(C.btn('导入数据', 'sm', function () { imp.click(); }));
        dr.appendChild(C.btn('清除全部', 'sm dan', function () {
          U.confirm('清空确认', '确定清空所有问答记录和自定义题库？将恢复为默认 100 题。')
            .then(function (ok) {
              if (!ok) return;
              st.questions = DEFAULT_QUESTIONS.slice(); st.dailyCount = 3; st.answers = {}; st._picked = {};
              save(); U.toast('已恢复默认题库'); draw();
            });
        }));
        card3.appendChild(dr);
        mount.appendChild(card3);
        mount.appendChild(imp);
      }

      function exportData() {
        var blob = new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = el('a', { href: url, download: '每日十问数据_' + todayKey() + '.json' });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }

      draw();
    }
  };
})();
