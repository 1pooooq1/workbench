/* ===== 数据层：状态 + 预设 ===== */
(function () {
  var U = W.U;
  var KEY = 'workbench_v1';

  /* 每日时事：资讯媒体卡片种子（央视/新华社/人民日报/参考消息） */
  var NEWS_MEDIA_SEED = [
    { id: U.uid(), icon: '📺', name: '央视新闻', intro: '国家大事第一线·权威快讯', hidden: false,
      links: [ { label: '央视新闻网', url: 'https://news.cctv.com/' }, { label: '新闻联播回看', url: 'https://tv.cctv.com/live/cctv1/' }, { label: '央视频', url: 'https://www.yangshipin.cn/' } ] },
    { id: U.uid(), icon: '📰', name: '新华社', intro: '国家通讯社·深度时政报道', hidden: false,
      links: [ { label: '新华网', url: 'https://www.news.cn/' }, { label: '今日要闻', url: 'https://www.news.cn/politics/' } ] },
    { id: U.uid(), icon: '🗞️', name: '人民日报', intro: '党报头版·评论员文章', hidden: false,
      links: [ { label: '人民网', url: 'http://www.people.com.cn/' }, { label: '人民日报电子版', url: 'http://paper.people.com.cn/' } ] },
    { id: U.uid(), icon: '🔎', name: '参考消息', intro: '外媒视角看中国和世界', hidden: false,
      links: [ { label: '参考消息网', url: 'http://www.cankaoxiaoxi.com/' } ] }
  ];
  /* 每日时事：分类看点九宫格种子 */
  var NEWS_CATS_SEED = [
    { id: U.uid(), icon: '🏛️', name: '时政要闻', url: 'https://www.news.cn/politics/' },
    { id: U.uid(), icon: '💹', name: '财经动态', url: 'https://finance.sina.com.cn/' },
    { id: U.uid(), icon: '🌍', name: '国际风云', url: 'https://world.huanqiu.com/' },
    { id: U.uid(), icon: '🤖', name: '科技前沿', url: 'https://www.36kr.com/' },
    { id: U.uid(), icon: '🏘️', name: '民生社会', url: 'https://www.thepaper.cn/' },
    { id: U.uid(), icon: '🔥', name: '今日热榜', url: 'https://s.weibo.com/top/summary' }
  ];

  /* 时事速览：顶部标签（可自定义增删） */
  var NEWS_TABS_SEED = ['时政', '财经', '国际', '科技', '民生', '订阅'];
  /* 时事速览：资讯源卡片种子（网址/资讯APP名称，可自行添加、删除、排序）
     tab=归属标签；hotUrl=榜单页；每个源可手动维护热点前十条 */
  var NEWS_FEEDS_SEED = [
    { id: U.uid(), icon: '🎯', name: '微博热搜', tab: '民生', home: 'https://s.weibo.com/top/summary', tab2: '热榜' },
    { id: U.uid(), icon: '🔥', name: '知乎热榜', tab: '科技', home: 'https://www.zhihu.com/hot' },
    { id: U.uid(), icon: '📰', name: '今日头条', tab: '民生', home: 'https://www.toutiao.com/' },
    { id: U.uid(), icon: '🏛️', name: '新华网·时政', tab: '时政', home: 'https://www.news.cn/politics/' },
    { id: U.uid(), icon: '💹', name: '东方财富', tab: '财经', home: 'https://www.eastmoney.com/' },
    { id: U.uid(), icon: '💰', name: '财新网', tab: '财经', home: 'https://www.caixin.com/' },
    { id: U.uid(), icon: '🌍', name: '参考消息', tab: '国际', home: 'http://www.cankaoxiaoxi.com/' },
    { id: U.uid(), icon: '🛰️', name: '环球网·国际', tab: '国际', home: 'https://world.huanqiu.com/' },
    { id: U.uid(), icon: '🤖', name: '36氪', tab: '科技', home: 'https://www.36kr.com/' },
    { id: U.uid(), icon: '📱', name: 'IT之家', tab: '科技', home: 'https://www.ithome.com/' },
    { id: U.uid(), icon: '🌊', name: '澎湃新闻', tab: '民生', home: 'https://www.thepaper.cn/' },
    { id: U.uid(), icon: '📺', name: '央视新闻', tab: '时政', home: 'https://news.cctv.com/' }
  ];

  /* 每日时事速览：种子（改为空，由模块内按日期自动轮换的「示例」内容填充，避免过期写死卡片） */
  var NEWS_TODAY_SEED = [];

  /* AI 学习：推荐视频 + 每日技巧 + 快捷提问种子 */
  var AI_LEARN_SEED = {
    videos: [
      { id: U.uid(), title: 'WorkBuddy零代码搭建工作台', source: 'B站搜索', desc: '用WorkBuddy半小时搭建专属工作台，大白话说需求即可生成网页，一键添加到手机桌面。', tags: ['WorkBuddy', '零代码', '实操'], url: 'https://search.bilibili.com/all?keyword=WorkBuddy%E9%9B%B6%E4%BB%A3%E7%A0%81%E6%90%AD%E5%BB%BA%E5%B7%A5%E4%BD%9C%E5%8F%B0', icon: '🛠️' },
      { id: U.uid(), title: 'AI提示词工程入门', source: 'B站搜索', desc: '从0到1掌握提示词框架、角色设定与链式思考，让AI输出更稳定可用。', tags: ['提示词', '入门', '技巧'], url: 'https://search.bilibili.com/all?keyword=AI%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%B7%A5%E7%A8%8B%E5%85%A5%E9%97%A8', icon: '🤖' },
      { id: U.uid(), title: 'DeepSeek高效办公实战', source: 'B站搜索', desc: '用DeepSeek快速处理文档、表格、邮件和会议纪要，提升日常办公效率。', tags: ['DeepSeek', '办公', '实战'], url: 'https://search.bilibili.com/all?keyword=DeepSeek%E9%AB%98%E6%95%88%E5%8A%9E%E5%85%AC%E5%AE%9E%E6%88%98', icon: '🐳' }
    ],
    tips: [
      { id: U.uid(), icon: '🛠️', title: 'WorkBuddy实操入门', duration: '约10分钟', date: '2026-08-11', steps: ['打开WorkBuddy，在对话框输入你的需求（越具体越好）', '等待AI生成网页/工具，预览效果', '不满意可直接说“把XX改成YY”，AI会立即修改', '完成后点“发布为应用”，获取分享链接', '在手机浏览器打开链接，添加到主屏幕即可像App一样使用'] },
      { id: U.uid(), icon: '✍️', title: '提示词万能公式', duration: '约8分钟', date: '2026-08-12', steps: ['明确角色：让AI扮演具体专家身份', '说明背景：给出任务场景和约束条件', '给出任务：用动词开头描述要做什么', '指定格式：要求分点/表格/JSON等输出', '补充示例：给1-2个参考样例，AI更易对齐'] },
      { id: U.uid(), icon: '📊', title: 'AI辅助做决策', duration: '约6分钟', date: '2026-08-13', steps: ['把待选项和评判标准列成清单', '让AI分别分析各选项的优缺点', '要求AI给出权重打分和推荐结论', '对推荐结果追问“最坏情况会怎样”', '结合自身经验做最终判断'] }
    ],
    questions: [
      { id: U.uid(), text: '帮我写一段日报' },
      { id: U.uid(), text: '把这段话改得更正式' },
      { id: U.uid(), text: '给我3个选题灵感' },
      { id: U.uid(), text: '解释这个概念并举例' },
      { id: U.uid(), text: '帮我列一份待办清单' }
    ]
  };

  /* 表达能力：每日练嘴小文章种子 */
  var EXPRESS_ARTICLES_SEED = [
    { id: U.uid(), title: '感恩的力量', level: '高级', words: 105, text: '当你开始刻意关注生活中的美好——哪怕只是今天天气很好、午饭很好吃、同事帮了一个小忙——你的心态就会慢慢发生变化。感恩不是自我安慰，而是一种重新审视世界的能力。' },
    { id: U.uid(), title: '改变从当下开始', level: '中级', words: 100, text: '我们总喜欢说“等我有时间了就开始”。等周末再运动，等下个月再读书，等明年再学新技能。但真正拉开人与人差距的，就是那些不等的人。他们现在就开始，哪怕只做五分钟。' },
    { id: U.uid(), title: '学习的乐趣', level: '初级', words: 115, text: '很多人把学习当成任务，其实学习可以是一件很快乐的事。今天学到一个小知识，明天又学会了新技能，这种持续成长的感觉，会让人对自己越来越有信心。' }
  ];
  if (window.W) W.EXPRESS_ARTICLES_SEED = EXPRESS_ARTICLES_SEED;

  /* 表达能力：播客精选种子（喜马拉雅 + 小宇宙） */
  var PODCAST_SEED = [
    { id: U.uid(), title: '自我进化论', desc: '关注个人成长、心智成熟的深度对话', cat: '自我成长', icon: '🎙️', ximalaya: 'https://www.ximalaya.com/search/%E8%87%AA%E6%88%91%E8%BF%9B%E5%8C%96%E8%AE%BA', xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/search?keyword=%E8%87%AA%E6%88%91%E8%BF%9B%E5%8C%96%E8%AE%BA' },
    { id: U.uid(), title: '纵横四海', desc: '分享全球视野下的商业与人生洞察', cat: '经济', icon: '🎙️', ximalaya: 'https://www.ximalaya.com/search/%E7%BA%B5%E6%A8%AA%E5%9B%9B%E6%B5%B7', xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/search?keyword=%E7%BA%B5%E6%A8%AA%E5%9B%9B%E6%B5%B7' },
    { id: U.uid(), title: '看理想', desc: '理想国出品的文化类播客', cat: '毛选', icon: '🎙️', ximalaya: 'https://www.ximalaya.com/search/%E7%9C%8B%E7%90%86%E6%83%B3', xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/search?keyword=%E7%9C%8B%E7%90%86%E6%83%B3' },
    { id: U.uid(), title: '她力量', desc: '女性创业者、艺术家的真实故事', cat: '女性成长', icon: '🎙️', ximalaya: 'https://www.ximalaya.com/search/%E5%A5%B9%E5%8A%9B%E9%87%8F', xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/search?keyword=%E5%A5%B9%E5%8A%9B%E9%87%8F' },
    { id: U.uid(), title: '文化有限', desc: '三个媒体人的读书播客', cat: '自我成长', icon: '🎙️', ximalaya: 'https://www.ximalaya.com/search/%E6%96%87%E5%8C%96%E6%9C%89%E9%99%90', xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/search?keyword=%E6%96%87%E5%8C%96%E6%9C%89%E9%99%90' },
    { id: U.uid(), title: '知行小酒馆', desc: '有知有行出品的投资与生活播客', cat: '经济', icon: '🎙️', ximalaya: 'https://www.ximalaya.com/search/%E7%9F%A5%E8%A1%8C%E5%B0%8F%E9%85%92%E9%A6%86', xiaoyuzhou: 'https://www.xiaoyuzhoufm.com/search?keyword=%E7%9F%A5%E8%A1%8C%E5%B0%8F%E9%85%92%E9%A6%86' }
  ];

  /* 每日计划：书法练习种子（教程视频 + 爆款参考） */
  function getCalligraphySeed() {
    return {
      videos: [
        { id: U.uid(), title: '软笔书法零基础入门教程', source: 'B站搜索', desc: 'B站热门软笔书法入门合集，从握笔姿势到基本笔画系统教学。', tags: ['软笔', '零基础', '入门'], url: 'https://search.bilibili.com/all?keyword=%E8%BD%AF%E7%AC%94%E4%B9%A6%E6%B3%95%E9%9B%B6%E5%9F%BA%E7%A1%80%E5%85%A5%E9%97%A8%E6%95%99%E7%A8%8B', icon: '🖌️' },
        { id: U.uid(), title: '硬笔楷书结构精讲', source: 'B站搜索', desc: '硬笔楷书笔画与结构训练，适合日常练字快速进步。', tags: ['硬笔', '楷书', '结构'], url: 'https://search.bilibili.com/all?keyword=%E7%A1%AC%E7%AC%94%E6%A5%B7%E4%B9%A6%E7%BB%93%E6%9E%84%E7%B2%BE%E8%AE%B2', icon: '✒️' }
      ],
      records: {}, // date -> [{img,desc,mood}]
      hot: [
        '书法入门必练的 5 个基本笔画',
        '楷书结构规律：中宫收紧、外拓舒展',
        '每天 10 分钟，硬笔字变好看的秘诀',
        '毛笔字握笔姿势详解',
        '书法练习纸怎么选？'
      ]
    };
  }

  /* 小说 / 书籍：番茄收藏种子（来自番茄小说书架，App 内直接打开详情，不外跳番茄） */
  var NOVEL_SEED = [
    { id: U.uid(), title: '诡秘之主', author: '爱潜水的乌贼', group: '', cover: '📕', tags: ['奇幻', '蒸汽朋克'], status: '已完结', note: '克苏鲁+维多利亚时代，序列体系设定精彩。', desc: '蒸汽与机械的时代，历史和黑暗交织。诡秘的历史，隐没在迷雾中……', chapters: 1394 },
    { id: U.uid(), title: '庆余年', author: '猫腻', group: '', cover: '📗', tags: ['穿越', '权谋'], status: '已完结', note: '范闲的江湖与庙堂，文风幽默。', desc: '积攒千年的力量，会在一夜之间爆发。一个年轻人从澹州小城走向庆国京都。', chapters: 746 },
    { id: U.uid(), title: '雪中悍刀行', author: '烽火戏诸侯', group: '', cover: '📘', tags: ['武侠', '权谋'], status: '已完结', note: '徐凤年北凉世子的成长，江湖气十足。', desc: '江湖是一张珠帘。当珠子四散，穿起来的那条线，才是江湖。', chapters: 819 },
    { id: U.uid(), title: '赘婿', author: '愤怒的香蕉', group: '', cover: '📙', tags: ['历史', '种田'], status: '已完结', note: '宁毅的商战与家国，节奏耐读。', desc: '穿越到武朝，成为苏家赘婿，从商海到庙堂的传奇。', chapters: 1088 },
    { id: U.uid(), title: '大奉打更人', author: '卖报小郎君', group: '悬疑探案', cover: '📕', tags: ['探案', '仙侠'], status: '已完结', note: '许七安查案+修行，逻辑缜密。', desc: '一桩税银失窃案，牵出朝堂江湖两界的惊天谜局。', chapters: 918 },
    { id: U.uid(), title: '道诡异仙', author: '狐尾的笔', group: '悬疑探案', cover: '📗', tags: ['诡异', '修仙'], status: '连载中', note: '真假难辨的疯批修仙，脑洞极大。', desc: '李火旺在疯人院与诡异世界之间挣扎求生，何为真实？', chapters: 620 }
  ];

  /* ---------- 导航预设 ---------- */
  var NAV = [
    { id: 'home', name: '首页', icon: '🏠', visible: true, lock: true },
    { id: 'custom', name: '自定义', icon: '🧩', visible: true, lock: true },
    { id: 'daily', name: '每日计划', icon: '📅', visible: true },
    { id: 'ai', name: 'AI技巧库', icon: '🤖', visible: true },
    { id: 'kaoyan', name: '考研', icon: '🎓', visible: true },
    { id: 'english', name: '英语', icon: '🔤', visible: true },
    { id: 'wordstudy', name: '背单词', icon: '📚', visible: true },
    { id: 'kaoyan-listen', name: '考研精听', icon: '🎧', visible: true },
    { id: 'reading', name: '阅读', icon: '📖', visible: true },
    { id: 'art', name: '艺术', icon: '🎨', visible: true },
    { id: 'news', name: '每日时事', icon: '📰', visible: true },
    { id: 'review', name: '复盘', icon: '📊', visible: true },
    { id: 'free', name: '随心', icon: '🕊️', visible: true },
    { id: 'travel', name: '旅行', icon: '✈️', visible: true },
    { id: 'links', name: '网址库', icon: '🔗', visible: true },
    { id: 'stt', name: '语音转文字', icon: '🎙️', visible: true },
    { id: 'movie', name: '影视', icon: '🎬', visible: true },
    { id: 'express', name: '表达能力', icon: '💬', visible: true },
    { id: 'sport', name: '运动管理', icon: '🏃', visible: true },
    { id: 'douyin', name: '抖音', icon: '📱', visible: true },
    { id: 'daguan', name: '大观墙', icon: '🏛️', visible: true },
    { id: 'novel', name: '小说书籍', icon: '📚', visible: true },
    { id: 'fav', name: '收藏', icon: '🔖', visible: true }
  ];

  /* ---------- 每日一句备用库 ---------- */
  var QUOTES = [
    ['The best preparation for tomorrow is doing your best today.', '对明天最好的准备，就是今天全力以赴。'],
    ['Little by little, one travels far.', '积跬步，以至千里。'],
    ['Discipline is choosing between what you want now and what you want most.', '自律，是在当下想要和最想要之间做选择。'],
    ['Bloom where you are planted.', '在你被种下的地方开花。'],
    ['The secret of getting ahead is getting started.', '成功的秘诀在于开始行动。'],
    ['Slow progress is still progress.', '慢一点，也仍然是前进。'],
    ['Do not wait for the perfect moment, take the moment and make it perfect.', '别等完美时刻，抓住此刻并让它完美。'],
    ['Every accomplishment starts with the decision to try.', '每项成就都始于尝试的决心。'],
    ['You are allowed to be both a masterpiece and a work in progress.', '你可以既是杰作，也仍在成为的路上。'],
    ['Energy and persistence conquer all things.', '精力与坚持能征服一切。'],
    ['What we learn with pleasure we never forget.', '带着愉悦学到的东西，永不会忘。'],
    ['Fall seven times, stand up eight.', '七次跌倒，八次站起。'],
    ['The expert in anything was once a beginner.', '任何领域的专家，都曾是初学者。'],
    ['Quiet effort is the loudest answer.', '安静的努力，是最响亮的回答。'],
    ['One day or day one. You decide.', '“总有一天”还是“第一天”，由你决定。'],
    ['Stars can not shine without darkness.', '没有黑暗，星星无法闪耀。'],
    ['Focus on the step in front of you, not the whole staircase.', '专注眼前这一级台阶，而非整段楼梯。'],
    ['Comparison is the thief of joy.', '比较是快乐的小偷。'],
    ['Well begun is half done.', '良好的开端是成功的一半。'],
    ['Small daily improvements are the key to staggering long-term results.', '每天微小的进步，累积成惊人的长期结果。'],
    ['Rest is not idleness; it is part of the work.', '休息不是懒惰，它也是工作的一部分。'],
    ['Be stubborn about goals, flexible about methods.', '对目标固执，对方法灵活。'],
    ['Doubt kills more dreams than failure ever will.', '扼杀梦想的，怀疑多过失败。'],
    ['A year from now you may wish you had started today.', '一年后的你，会希望今天就开始。'],
    ['Storms make trees take deeper roots.', '风雨让树扎根更深。'],
    ['Done is better than perfect.', '完成好过完美。'],
    ['Your only limit is your mind.', '唯一的限制来自你的想法。'],
    ['Keep your face always toward the sunshine.', '让你的脸永远朝向阳光。'],
    ['Success is the sum of small efforts repeated day in and day out.', '成功是日复一日微小努力的总和。'],
    ['The future depends on what you do today.', '未来取决于你今天做了什么。']
  ];

  /* ---------- AI 引擎 ---------- */
  var AI_ENGINES = [
    { id: 'doubao', name: '豆包', icon: '🫘', url: 'https://www.doubao.com/chat/?q=%s' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🐳', url: 'https://chat.deepseek.com/?q=%s' },
    { id: 'yuanbao', name: '腾讯元宝', icon: '💎', url: 'https://yuanbao.tencent.com/chat?q=%s' },
    { id: 'kimi', name: 'Kimi', icon: '🌙', url: 'https://kimi.moonshot.cn/?q=%s' },
    { id: 'tongyi', name: '通义千问', icon: '☁️', url: 'https://tongyi.aliyun.com/qianwen/?q=%s' },
    { id: 'metaso', name: '秘塔搜索', icon: '🔍', url: 'https://metaso.cn/?q=%s' },
    { id: 'perplexity', name: 'Perplexity', icon: '🔮', url: 'https://www.perplexity.ai/search?q=%s' },
    { id: 'chatgpt', name: 'ChatGPT', icon: '🌀', url: 'https://chatgpt.com/?q=%s' }
  ];

  /* ---------- 考研科目预设 ---------- */
  function ch(name, points) { return { id: U.uid(), name: name, open: false, points: (points || []).map(function (p) { return { id: U.uid(), title: p, content: '', open: false }; }), qs: [] }; }

  var KY_SUBJECTS = [
    {
      id: 'math', name: '数学（303 数学三）', icon: '➗', open: false,
      subs: [
        {
          id: 'gs', name: '高等数学', chapters: [
            ch('函数、极限、连续', ['函数的概念与性质', '数列极限与函数极限', '无穷小与无穷大', '两个重要极限', '连续与间断点分类']),
            ch('一元函数微分学', ['导数与微分的定义', '求导法则与高阶导数', '中值定理（罗尔/拉格朗日/柯西）', '洛必达法则', '单调性、极值、凹凸与拐点']),
            ch('一元函数积分学', ['不定积分基本公式', '换元法与分部积分', '定积分性质与计算', '反常积分', '定积分的经济应用']),
            ch('多元函数微分学', ['偏导数与全微分', '复合函数与隐函数求导', '多元函数极值与条件极值', '拉格朗日乘数法']),
            ch('二重积分', ['二重积分概念与性质', '直角坐标计算', '极坐标计算', '交换积分次序']),
            ch('无穷级数', ['常数项级数收敛判别', '幂级数收敛半径', '函数展开成幂级数']),
            ch('常微分方程与差分方程', ['一阶微分方程', '可降阶方程', '二阶常系数线性方程', '一阶差分方程'])
          ]
        },
        {
          id: 'xd', name: '线性代数', chapters: [
            ch('行列式', ['行列式定义与性质', '按行列展开', '克拉默法则']),
            ch('矩阵', ['矩阵运算与逆矩阵', '初等变换与初等矩阵', '矩阵的秩', '分块矩阵']),
            ch('向量', ['线性相关与线性无关', '极大无关组与秩', '向量空间与基', '施密特正交化']),
            ch('线性方程组', ['齐次方程组基础解系', '非齐次方程组通解', '解的结构定理']),
            ch('特征值与特征向量', ['特征值特征向量求法', '相似对角化', '实对称矩阵对角化']),
            ch('二次型', ['二次型标准形', '合同变换与惯性定理', '正定二次型判定'])
          ]
        },
        {
          id: 'gl', name: '概率论与数理统计', chapters: [
            ch('随机事件与概率', ['样本空间与事件关系', '古典概型与几何概型', '条件概率与乘法公式', '全概率与贝叶斯公式', '事件独立性']),
            ch('随机变量及其分布', ['分布函数性质', '常见离散分布（0-1/二项/泊松）', '常见连续分布（均匀/指数/正态）', '随机变量函数的分布']),
            ch('多维随机变量', ['二维分布与边缘分布', '条件分布与独立性', '二维均匀与二维正态', '随机变量函数分布']),
            ch('数字特征', ['数学期望与方差', '协方差与相关系数', '矩与切比雪夫不等式']),
            ch('大数定律与中心极限定理', ['切比雪夫大数定律', '辛钦大数定律', '棣莫弗-拉普拉斯定理', '列维-林德伯格定理']),
            ch('数理统计基本概念', ['总体、样本与统计量', '卡方分布/t分布/F分布', '正态总体抽样分布定理']),
            ch('参数估计', ['矩估计法', '最大似然估计', '估计量的评选标准', '区间估计'])
          ]
        }
      ]
    },
    {
      id: 'eng', name: '英语（201 英语一）', icon: '🔤', open: false,
      subs: [
        {
          id: 'base', name: '基础（词汇/语法/长难句）', chapters: [
            ch('核心词汇', ['考研高频词 1-500', '考研高频词 501-1200', '熟词僻义', '词根词缀记忆法']),
            ch('语法与长难句', ['三大从句', '非谓语动词', '虚拟语气与倒装', '长难句拆分五步法'])
          ]
        },
        {
          id: 'read', name: '阅读理解（Part A/B/C）', chapters: [
            ch('阅读 Part A 题型', ['主旨大意题', '细节事实题', '推理判断题', '词义句意题', '态度观点题']),
            ch('新题型 Part B', ['七选五', '标题匹配', '排序题']),
            ch('翻译 Part C', ['定语从句翻译', '被动语态处理', '长句拆译技巧'])
          ]
        },
        {
          id: 'write', name: '写作（小作文/大作文）', chapters: [
            ch('应用文（小作文）', ['书信类模板', '通知/告示类模板', '常用高分句式']),
            ch('图画作文（大作文）', ['三段式结构', '图画描述句型', '现象解释与对策', '万能写作素材'])
          ]
        }
      ]
    },
    {
      id: 'stat', name: '统计学（807 专业课·江财020208）', icon: '📈', open: false,
      subs: [
        {
          id: 'llq', name: '罗良清《统计学》', chapters: [
            ch('总论', ['统计学的研究对象与方法', '统计学中的基本概念', '统计指标与指标体系']),
            ch('统计数据的收集', ['统计调查方式', '问卷设计', '数据来源与误差']),
            ch('统计数据的整理与显示', ['统计分组', '频数分布', '统计表与统计图']),
            ch('数据分布特征的描述', ['集中趋势（均值/中位数/众数）', '离散程度（方差/标准差/离散系数）', '偏度与峰度']),
            ch('抽样与抽样分布', ['概率抽样方法', '抽样分布', '中心极限定理应用']),
            ch('参数估计', ['点估计与评价标准', '总体均值区间估计', '总体比例与方差估计', '样本容量确定']),
            ch('假设检验', ['原假设与备择假设', '两类错误', '单/双侧检验', '总体均值与比例检验']),
            ch('方差分析', ['单因素方差分析', '双因素方差分析', '多重比较']),
            ch('相关与回归分析', ['相关系数', '一元线性回归', '多元线性回归', '回归诊断与检验']),
            ch('时间序列分析', ['时间序列成分', '水平与速度指标', '长期趋势测定', '季节变动分析']),
            ch('统计指数', ['指数分类', '综合指数与平均指数', '指数体系与因素分析']),
            ch('国民经济核算基础', ['GDP 核算三种方法', '投入产出表', '资金流量与国际收支'])
          ]
        },
        {
          id: 'mss', name: '茆诗松《概率论与数理统计教程》', chapters: [
            ch('随机事件与概率', ['事件的运算与概率公理', '古典概型', '条件概率与全概率', '独立性与伯努利试验']),
            ch('随机变量及其分布', ['分布函数与密度函数', '常用离散分布', '常用连续分布', '随机变量函数的分布']),
            ch('多维随机变量及其分布', ['联合分布与边缘分布', '条件分布', '随机向量函数分布', '多维正态分布']),
            ch('大数定律与中心极限定理', ['随机变量序列收敛性', '常用大数定律', '中心极限定理']),
            ch('统计量及其分布', ['总体与样本', '样本数据整理', '三大抽样分布', '充分统计量']),
            ch('参数估计', ['矩法与极大似然', '估计量优良性', '贝叶斯估计', '区间估计']),
            ch('假设检验', ['基本思想与步骤', '正态总体参数检验', '拟合优度检验', '列联表独立性检验']),
            ch('方差分析与回归分析', ['单因素方差分析', '一元线性回归', '回归系数检验'])
          ]
        }
      ]
    },
    {
      id: 'pol', name: '政治（101 思想政治理论）', icon: '📕', open: false,
      subs: [
        {
          id: 'my', name: '马克思主义基本原理', chapters: [
            ch('唯物论', ['物质与意识', '实践与世界', '规律与主观能动性']),
            ch('辩证法', ['两大特征', '三大规律', '五对范畴']),
            ch('认识论', ['实践与认识的辩证关系', '真理与价值']),
            ch('唯物史观', ['社会存在与社会意识', '生产力与生产关系', '人民群众的作用']),
            ch('政治经济学', ['商品二因素与劳动二重性', '剩余价值理论', '资本积累与流通'])
          ]
        },
        { id: 'mzt', name: '毛中特与新时代思想', chapters: [ch('毛泽东思想', ['新民主主义革命理论', '社会主义改造理论']), ch('中国特色社会主义理论体系', ['改革开放理论', '社会主义市场经济']), ch('新时代内容', ['新发展理念', '高质量发展', '五位一体总体布局'])] },
        { id: 'sg', name: '中国近现代史纲要', chapters: [ch('旧民主主义革命时期', ['列强侵华与救亡运动', '辛亥革命']), ch('新民主主义革命时期', ['五四运动与建党', '抗日战争', '解放战争']), ch('社会主义时期', ['社会主义改造', '改革开放历程'])] },
        { id: 'sx', name: '思修与法基', chapters: [ch('人生观与价值观', ['人生的青春之问', '理想信念']), ch('道德与法治', ['社会主义核心价值观', '法治思维', '宪法与法律体系'])] }
      ]
    }
  ];

  /* ---------- 英语资源预设 ---------- */
  var EN_APPS = [
    { name: '每日英语听力', icon: '🎧', url: 'https://dict.eudic.net/ting/', tag: '外刊精读' },
    { name: '欧路词典', icon: '📕', url: 'https://dict.eudic.net/', tag: '词典' },
    { name: '扇贝阅读', icon: '🐚', url: 'https://web.shanbay.com/', tag: '外刊精读' },
    { name: '经济学人·商论', icon: '📊', url: 'https://www.economist.com/', tag: '外刊精读' },
    { name: '可可英语', icon: '🍫', url: 'https://www.kekenet.com/', tag: '新闻泛读' },
    { name: '百词斩爱阅读', icon: '🌰', url: 'https://www.baicizhan.com/', tag: '分级阅读' },
    { name: '薄荷阅读', icon: '🌱', url: 'https://www.bohe.cn/', tag: '英文原著' },
    { name: '红板报', icon: '📰', url: 'https://flipboard.cn/', tag: '新闻泛读' }
  ];
  var EN_SITES = [
    { name: 'Breaking News English', icon: '📻', url: 'https://breakingnewsenglish.com/', tag: '新闻·三档难度' },
    { name: 'Newsela', icon: '🗞️', url: 'https://newsela.com/', tag: '新闻·五档分级' },
    { name: 'BBC Learning English', icon: '🇬🇧', url: 'https://www.bbc.co.uk/learningenglish/', tag: '英音·6分钟英语' },
    { name: 'VOA Learning English', icon: '🇺🇸', url: 'https://learningenglish.voanews.com/', tag: '慢速美音' },
    { name: 'Project Gutenberg', icon: '📚', url: 'https://www.gutenberg.org/', tag: '免费原著' },
    { name: 'ReadWorks', icon: '📝', url: 'https://www.readworks.org/', tag: '分级+习题' },
    { name: 'CommonLit', icon: '📗', url: 'https://www.commonlit.org/', tag: '短篇+思考题' },
    { name: "Reader's Digest", icon: '💡', url: 'https://www.rd.com/', tag: '故事泛读' },
    { name: 'National Geographic', icon: '🌍', url: 'https://www.nationalgeographic.com/', tag: '科普人文' },
    { name: 'TED Talks', icon: '🎤', url: 'https://www.ted.com/talks', tag: '演讲稿' }
  ];

  /* ---------- 默认状态 ---------- */
  function folder(name, icon, children) {
    return { id: U.uid(), name: name, icon: icon || '📁', open: false, children: children || [], items: [] };
  }
  function ck(names) { return { tasks: names.map(function (n) { return { id: U.uid(), name: n }; }), rec: {} }; }

  function defaults() {
    return {
      v: 1,
      nav: NAV.map(function (n, i) { return { id: n.id, name: n.name, icon: n.icon, visible: n.visible, lock: !!n.lock, order: i }; }),
      cfg: { city: '南昌', lat: 28.68, lon: 115.86, quoteApi: '', aiApi: '', aiKey: '', aiModel: '', sync: { mode: 'local', url: '', token: '', auto: true, interval: 20, autoArchive: false, backupTime: '00:30', pairCode: '', pairPass: '', deviceId: '', deviceName: '', deviceCache: [], mirrorUrl: '' } },
      quote: { date: '', en: '', zh: '', from: '' },
      moods: {},           // date -> {emoji,text,weather,temp}
      checkins: {          // key -> {tasks:[], rec:{}}
        daily: ck(['早起', '喝水 2L', '运动 30min', '早睡']),
        kaoyan: ck(['数学刷题', '英语真题', '807 专业课', '政治网课']),
        english: ck(['背单词', '口语跟读', '英语阅读']),
        reading: ck(['阅读 30 分钟']),
        novel: ck(['小说阅读 20 分钟']),
        art_edit: ck(['剪辑练习']), art_photo: ck(['修图练习']), art_draw: ck(['画画 30min']), art_music: ck(['练琴 30min']),
        stt: ck(['录音转写']), movie: ck(['观影/素材整理']),
        express: ck(['即兴表达练习', '录音复盘']), sport: ck(['运动 30min', '拉伸放松'])
      },
      tasks: {},           // key -> [{id,text,done}]
      notes: {},           // key -> text
      folders: {},         // key -> [folderNode]
      links: {},           // key -> [{id,name,icon,url,tag}]
      words: {},           // date -> [{...}]
      essays: {},          // date -> {en,zh,fix}
      wordBook: [],        // 收藏生词本
      dictationSettings: { fontSize: 'md', showMean: true, showPh: true, autoSpeak: false, compact: false, locked: false, rate: 1 }, // 听音拼写：自适应布局设置（可调整并锁定，含语速加速器）
      dictationProgress: {}, // date -> {word -> 'ok'/'bad'}
      wordDocs: [],        // 文档词库：[{id,name,type,removable,words:[{word,ph,mean}]}]
      speaking: {},        // date -> [{id,text,score,words:[]}]
      readLog: {},         // date -> {min, count, items:[]}
      exam: {},            // subjectKey -> {chapters:[]}
      kySubjects: KY_SUBJECTS,
      prompts: [],         // AI 指令库
      aiLearn: AI_LEARN_SEED, // AI 学习：推荐视频 + 每日技巧 + 快捷提问
      aiLearnIdx: 0,       // AI 学习：当前每日技巧索引
      newsNotes: [],       // 时事笔记
      newsToday: NEWS_TODAY_SEED, // 每日时事速览：标题 + 重点总结 + 来源 + 分类 + 原文链接 + 收藏
      newsMedia: NEWS_MEDIA_SEED, // 资讯媒体卡片（央视/新华社/人民日报/参考消息）
      newsCats: NEWS_CATS_SEED,   // 分类看点九宫格
      newsTabs: NEWS_TABS_SEED,   // 时事速览标签（可自定义增删）
      newsFeeds: NEWS_FEEDS_SEED, // 时事速览·资讯源（可增删排序）
      newsHot: {},                // feedId -> {date, ts, items:[{title,url,hot}]}  热点前十缓存
      free: [],            // 随心
      freeLinks: [],       // 随心·书签（标签+标题+链接+备注）
      trips: [],           // 旅行
      reviews: { week: {}, month: {} },
      stt: [],             // 转写记录
      movies: [],          // 影视条目
      express: { prompts: [], logs: [], shadowRes: [], scripts: [], shadowLogs: [], articles: EXPRESS_ARTICLES_SEED, articleDone: {}, podcasts: PODCAST_SEED }, // 表达能力：即兴题库 / 练习记录 / 跟读资源 / 跟读文稿 / 跟读记录 / 练嘴小文章 / 播客精选 / 完成记录
      podcasts: PODCAST_SEED, // 播客精选（独立备份）
      calligraphy: null,        // 书法练习（懒加载种子）
      novel: { cats: [], readLog: {} }, // 小说书籍：自定义分类（含番茄收藏）+ 阅读记录
      sport: { logs: [] },  // 运动管理：运动记录
      douyin: { cats: [{ id: U.uid(), name: '默认分类', videos: [] }], mps: [] }, // 抖音：视频分类 + 公众号链接
      daguan: { firms: [], channels: [], sel: '' }, // 大观墙：咨询机构 + 行业频道
      favs: [],             // 收藏夹（大观墙联动）
      metrics: {},          // date -> {module: minutes}
      promptCatOpen: {},   // AI 指令库分类折叠状态
      linksCatOpen: {},    // 网址库分类折叠状态
      ui: { scale: 'standard' } // 显示大小：small / standard / large / xlarge
    };
  }

  var state = null;

  /* 绑定信息 cookie 兜底：localStorage 按网址隔离、且微信等 webview 常清 localStorage，
     但一般保留 cookie。把配对绑定写进 cookie，可让「同设备重开即使 localStorage 被清」也能自动恢复配对码。
     注意：cookie 同样按网址(origin)隔离，跨设备/跨网址仍需各设备输一次码或由固定源恢复。 */
  var BIND_COOKIE = 'wb_bind_v1';
  function writeBindingCookie() {
    try {
      var s = state && state.cfg && state.cfg.sync; if (!s || !s.pairCode) return; // 仅绑定时才写
      var payload = { mode: s.mode, url: s.url, token: s.token, auto: s.auto, interval: s.interval, autoArchive: s.autoArchive, backupTime: s.backupTime, pairCode: s.pairCode, pairPass: s.pairPass, deviceName: s.deviceName, deviceCache: s.deviceCache, mirrorUrl: s.mirrorUrl };
      document.cookie = BIND_COOKIE + '=' + encodeURIComponent(JSON.stringify(payload)) + ';path=/;max-age=' + (365 * 24 * 3600) + ';SameSite=Lax';
    } catch (e) {}
  }
  function readBindingCookie() {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + BIND_COOKIE + '=([^;]*)'));
      if (!m) return null;
      return JSON.parse(decodeURIComponent(m[1]));
    } catch (e) { return null; }
  }
  function applyBindingCookie(b) {
    if (!b || !b.pairCode) return false;
    if (!state.cfg) state.cfg = {};
    if (!state.cfg.sync) state.cfg.sync = {};
    var s = state.cfg.sync;
    s.mode = b.mode || 'pair';
    if (b.url) s.url = b.url;
    if (b.token) s.token = b.token;
    if (typeof b.auto === 'boolean') s.auto = b.auto;
    if (b.interval) s.interval = b.interval;
    if (typeof b.autoArchive === 'boolean') s.autoArchive = b.autoArchive;
    if (b.backupTime) s.backupTime = b.backupTime;
    s.pairCode = b.pairCode;
    if (b.pairPass) s.pairPass = b.pairPass;
    if (b.deviceName) s.deviceName = b.deviceName;
    if (b.mirrorUrl) s.mirrorUrl = b.mirrorUrl;
    if (b.deviceCache) s.deviceCache = b.deviceCache;
    return true;
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state) { state = defaults(); seed(); }
    /* cookie 兜底：localStorage 被清空（微信 webview 常清）但 cookie 还在时，自动恢复配对绑定 */
    if (!(state.cfg && state.cfg.sync && state.cfg.sync.pairCode)) {
      var bc = readBindingCookie();
      if (bc && bc.pairCode) { applyBindingCookie(bc); }
    }
    var d = defaults();
    for (var k in d) if (state[k] === undefined) state[k] = d[k];
    // 导航补齐新模块
    var have = {}; state.nav.forEach(function (n) { have[n.id] = 1; });
    NAV.forEach(function (n, i) { if (!have[n.id]) state.nav.push({ id: n.id, name: n.name, icon: n.icon, visible: true, lock: !!n.lock, order: 100 + i }); });
    /* 文档词库：首次/缺文档时灌入预置文档（如红宝书），且不可被用户误删 */
    if (!state.wordDocs) state.wordDocs = [];
    if (window.W && W.SEED_DOCS && W.SEED_DOCS.length) {
      var added = false;
      W.SEED_DOCS.forEach(function (d) {
        if (state.wordDocs.some(function (x) { return x.id === d.id; })) return;
        state.wordDocs.push({
          id: d.id, name: d.name, type: d.type || 'pdf',
          removable: d.removable === false ? false : true,
          words: (d.words || []).map(function (x) { return { word: x[0], ph: '', mean: x[1] }; })
        });
        added = true;
      });
      if (added) save();
    }
    /* 小说书籍：首次灌入「番茄收藏」分类 + 番茄书架书单 */
    if (!state.novel) state.novel = { cats: [], readLog: {} };
    if (!state.novel.cats) state.novel.cats = [];
    if (!state.novel.readLog) state.novel.readLog = {};
    if (!state.novel.cats.some(function (c) { return c.name === '番茄收藏'; })) {
      state.novel.cats.unshift({
        id: U.uid(), name: '番茄收藏', icon: '🍅',
        src: 'https://fanqienovel.com/bookshelf?enter_from=menu',
        books: NOVEL_SEED.map(function (b) { return Object.assign({}, b); })
      });
      save();
    }
    /* 表达能力：补齐跟读练习子结构 + 练嘴小文章 + 播客精选（老数据迁移） */
    if (state.express) {
      if (!state.express.shadowRes) state.express.shadowRes = [];
      if (!state.express.scripts) state.express.scripts = [];
      if (!state.express.shadowLogs) state.express.shadowLogs = [];
      if (!state.express.articles) state.express.articles = EXPRESS_ARTICLES_SEED;
      if (!state.express.articleDone) state.express.articleDone = {};
      if (!state.express.podcasts) state.express.podcasts = PODCAST_SEED;
    }
    if (!state.podcasts) state.podcasts = PODCAST_SEED;
    /* 显示大小设置迁移 */
    if (!state.ui) state.ui = { scale: 'standard' };
    else if (!state.ui.scale) state.ui.scale = 'standard';
    /* 书法练习：懒加载种子 */
    if (!state.calligraphy) state.calligraphy = getCalligraphySeed();
    /* 每日时事速览：补齐结构并灌入示例种子 */
    if (!state.newsToday) state.newsToday = NEWS_TODAY_SEED;
    else {
      state.newsToday.forEach(function (n) {
        if (n.summary === undefined) n.summary = '';
        if (n.time === undefined) n.time = '';
        if (n.fav === undefined) n.fav = false;
        if (n.url === undefined) n.url = '';
      });
    }
    return state;
  }

  /* 首次使用的预置内容 */
  function seed() {
    state.links['english_app'] = EN_APPS.map(function (a) { return { id: U.uid(), name: a.name, icon: a.icon, url: a.url, tag: a.tag }; });
    state.links['english_site'] = EN_SITES.map(function (a) { return { id: U.uid(), name: a.name, icon: a.icon, url: a.url, tag: a.tag }; });
    state.links['news'] = [
      { id: U.uid(), name: '新华网', icon: '📢', url: 'https://www.news.cn/', tag: '国内' },
      { id: U.uid(), name: '澎湃新闻', icon: '🌊', url: 'https://www.thepaper.cn/', tag: '社会' },
      { id: U.uid(), name: '财新网', icon: '💰', url: 'https://www.caixin.com/', tag: '财经' },
      { id: U.uid(), name: '东方财富', icon: '📈', url: 'https://www.eastmoney.com/', tag: '财经' },
      { id: U.uid(), name: '知乎热榜', icon: '🔥', url: 'https://www.zhihu.com/hot', tag: '热点' },
      { id: U.uid(), name: '微博热搜', icon: '🎯', url: 'https://s.weibo.com/top/summary', tag: '热点' }
    ];
    state.links['global'] = [
      { id: U.uid(), name: '欧路词典', icon: '📕', url: 'https://dict.eudic.net/', tag: '英语' },
      { id: U.uid(), name: '每日英语听力', icon: '🎧', url: 'https://dict.eudic.net/ting/', tag: '英语' },
      { id: U.uid(), name: '中国研究生招生信息网', icon: '🎓', url: 'https://yz.chsi.com.cn/', tag: '考研' },
      { id: U.uid(), name: '江西财经大学研究生院', icon: '🏫', url: 'https://yjsy.jxufe.edu.cn/', tag: '考研' },
      { id: U.uid(), name: 'B站', icon: '📺', url: 'https://www.bilibili.com/', tag: '学习' },
      { id: U.uid(), name: '番茄小说', icon: '🍅', url: 'https://fanqienovel.com/', tag: '阅读' }
    ];
    state.links['stt_tool'] = [
      { id: U.uid(), name: '飞书妙记', icon: '🪶', url: 'https://www.feishu.cn/product/minutes', tag: '转写' },
      { id: U.uid(), name: '通义听悟', icon: '👂', url: 'https://tingwu.aliyun.com/', tag: '转写' },
      { id: U.uid(), name: '剪映字幕', icon: '✂️', url: 'https://www.capcut.cn/', tag: '字幕' }
    ];
    state.links['movie_app'] = [
      { id: U.uid(), name: '豆瓣电影', icon: '🎞️', url: 'https://movie.douban.com/', tag: '资料' },
      { id: U.uid(), name: 'B站', icon: '📺', url: 'https://www.bilibili.com/', tag: '平台' },
      { id: U.uid(), name: '腾讯视频', icon: '🐧', url: 'https://v.qq.com/', tag: '平台' },
      { id: U.uid(), name: '爱奇艺', icon: '🔵', url: 'https://www.iqiyi.com/', tag: '平台' },
      { id: U.uid(), name: '优酷', icon: '🟠', url: 'https://www.youku.com/', tag: '平台' },
      { id: U.uid(), name: '芒果TV', icon: '🟡', url: 'https://www.mgtv.com/', tag: '平台' },
      { id: U.uid(), name: '西瓜视频', icon: '🔴', url: 'https://www.ixigua.com/', tag: '平台' },
      { id: U.uid(), name: '1905电影网', icon: '🎬', url: 'https://www.1905.com/', tag: '资料' },
      { id: U.uid(), name: 'IMDb', icon: '🌐', url: 'https://www.imdb.com/', tag: '资料' },
      { id: U.uid(), name: '剪映', icon: '✂️', url: 'https://www.capcut.cn/', tag: '剪辑' }
    ];
    state.links['reading'] = [
      { id: U.uid(), name: '番茄小说', icon: '🍅', url: 'https://fanqienovel.com/', tag: '小说' },
      { id: U.uid(), name: '微信读书', icon: '📗', url: 'https://weread.qq.com/', tag: '书库' },
      { id: U.uid(), name: '豆瓣读书', icon: '📚', url: 'https://book.douban.com/', tag: '搜书' },
      { id: U.uid(), name: 'Z-Library', icon: '🗄️', url: 'https://z-lib.io/', tag: '电子书' }
    ];

    state.folders['english_res'] = [
      folder('外刊精读', '📰'), folder('考研英语一真题外刊', '🎯'), folder('四六级同源文章', '📄'),
      folder('英文原著短篇', '📖'), folder('新闻时事', '🌐'), folder('影视原声文本', '🎬'), folder('TED 演讲稿', '🎤')
    ];
    state.folders['stt'] = [
      folder('播客录音文稿', '🎙️'), folder('课堂听课录音', '🏫'), folder('表达练习演讲稿', '🗣️'),
      folder('自媒体口播脚本', '📱'), folder('生活碎碎念录音', '🌙')
    ];
    state.folders['movie_genre'] = [
      folder('电影', '🎬', [folder('悬疑', '🕵️'), folder('治愈', '🌤️'), folder('科幻', '🚀')]),
      folder('剧集', '📺', [folder('国产', '🇨🇳'), folder('海外', '🌍')]),
      folder('纪录片', '🎥'), folder('动漫', '🐱'), folder('综艺', '🎪')
    ];
    state.folders['movie_use'] = [
      folder('自媒体剪辑素材', '✂️'), folder('台词摘抄', '💬'), folder('影视解说参考', '🗨️'),
      folder('英语原声片', '🔤'), folder('备考纪录片', '🎓')
    ];
    state.folders['art_edit'] = [folder('剪辑教程', '📚'), folder('视频素材', '🎞️'), folder('音频素材', '🎵'), folder('封面图片', '🖼️')];
    state.folders['art_photo'] = [folder('摄影教程', '📚'), folder('修图预设', '🎛️'), folder('照片素材', '🖼️')];
    state.folders['art_draw'] = [folder('绘画教程', '📚'), folder('线稿', '✏️'), folder('配色参考', '🎨'), folder('我的画作', '🖼️')];
    state.folders['art_music'] = [folder('乐理教程', '📚'), folder('乐谱', '🎼'), folder('伴奏', '🎹'), folder('练习录音', '🎤')];
    state.folders['ky_res'] = [folder('数学三', '➗'), folder('英语一', '🔤'), folder('807 统计学', '📈'), folder('政治', '📕')];
    state.folders['reading_novel'] = [folder('番茄收藏', '🍅'), folder('经典名著', '📚'), folder('工具书', '🛠️')];

    state.prompts = [
      { id: U.uid(), cat: '学习', title: '费曼讲解法', body: '请用费曼技巧向一个完全不懂的高中生解释【主题】：1) 用最朴素的语言讲清核心；2) 举一个生活化例子；3) 指出最容易被误解的地方；4) 给出 3 个自测问题。', tags: ['学习', '讲解'], note: '' },
      { id: U.uid(), cat: '考研', title: '章节出题官', body: '你是【科目】考研命题专家。基于章节《X》知识点：{知识点}，出 5 道题（2 基础 + 2 强化 + 1 综合），题型含选择、计算、简答，附标准答案与解题思路，标注考频。', tags: ['考研', '出题'], note: '' },
      { id: U.uid(), cat: '英语', title: '长难句拆解', body: '请拆解这句英文：{句子}。要求：1) 划分主干与修饰成分；2) 逐层翻译；3) 指出语法点；4) 给出 1 个仿写句。', tags: ['英语', '语法'], note: '' },
      { id: U.uid(), cat: '写作', title: '提示词优化器', body: '请把下面这条提示词优化得更清晰、可执行：{原提示词}。输出：优化后的提示词 + 改动理由 + 2 个同类变体。', tags: ['提示词'], note: '' }
    ];
    save();
  }

  function markDirty() { try { localStorage.setItem('wb_dirty', String(Date.now())); } catch (e) {} }
  var save = U.debounce(function () {
    try { localStorage.setItem(KEY, JSON.stringify(state)); markDirty(); }
    catch (e) { U.toast('存储空间不足，请清理图片素材'); }
    writeBindingCookie(); // 绑定信息 cookie 兜底（即使 localStorage 被清也能恢复）
    try {
      if (window.W && W.Sync) {
        var sc = W.Sync.cfg(), m = sc.mode;
        if (sc.auto && m === 'remote') W.Sync.push();
        else if (sc.auto && m === 'pair' && window.W.PairSync) W.PairSync.push();
        else if (sc.auto && m === 'supabase' && window.W.SupaSync) W.SupaSync.push();
      }
    } catch (e) {}
  }, 250);

  function get() { return state; }
  function ensure(path, def) {
    var o = state[path[0]];
    if (o == null) { state[path[0]] = def; return state[path[0]]; }
    return o;
  }
  function ck2(key) {
    if (!state.checkins[key]) state.checkins[key] = { tasks: [], rec: {} };
    if (!state.checkins[key].rec) state.checkins[key].rec = {};
    return state.checkins[key];
  }
  function tasks(key) { if (!state.tasks[key]) state.tasks[key] = []; return state.tasks[key]; }
  function note(key, v) { if (v !== undefined) { state.notes[key] = v; save(); } return state.notes[key] || ''; }
  function folders(key) { if (!state.folders[key]) state.folders[key] = []; return state.folders[key]; }
  function links(key) { if (!state.links[key]) state.links[key] = []; return state.links[key]; }
  function reset() { localStorage.removeItem(KEY); location.reload(); }
  function exportJSON() { return JSON.stringify(state); }
  function importJSON(txt) {
    try {
      var o = JSON.parse(txt);
      if (!o || !o.nav) throw 0;
      // 关键：保留本机「同步连接配置」（配对码 / 二次密码 / 服务器地址 / 轮询间隔等），
      // 绝不因拉取远端数据而被覆盖。这样「绑定密钥」只在用户手动切换配对码或修改参数时才会变化，
      // 重启 / 关闭重开页面后由 localStorage 自动恢复，符合“配置长期有效、不反复手动设置”的需求。
      var localSync = (state.cfg && state.cfg.sync) ? JSON.parse(JSON.stringify(state.cfg.sync)) : null;
      state = o;
      if (!state.cfg) state.cfg = {};
      if (localSync) state.cfg.sync = localSync;            // 本机绑定密钥保持不动
      else if (!state.cfg.sync) state.cfg.sync = { mode: 'local', url: '', token: '', auto: true, interval: 20, autoArchive: false, backupTime: '00:30', pairCode: '', pairPass: '', deviceId: '', deviceName: '', deviceCache: [], mirrorUrl: '' };
      localStorage.setItem(KEY, JSON.stringify(state));
      location.reload();
    }
    catch (e) { U.toast('数据格式不正确'); }
  }
  /* 文档词库 */
  function addDoc(doc) {
    if (!state.wordDocs) state.wordDocs = [];
    if (!doc.id) doc.id = U.uid();
    state.wordDocs.push(doc); save();
  }
  function removeDoc(id) {
    if (!state.wordDocs) state.wordDocs = [];
    state.wordDocs = state.wordDocs.filter(function (d) { return d.id !== id; });
    if (state.words) { for (var k in state.words) { if (state.words[k]) state.words[k] = state.words[k].filter(function (w) { return w.doc !== id; }); } }
    save();
  }
  function importDocWords(id, date) {
    var doc = (state.wordDocs || []).filter(function (d) { return d.id === id; })[0];
    if (!doc) return 0;
    if (!state.words[date]) state.words[date] = [];
    var cur = state.words[date], n = 0;
    (doc.words || []).forEach(function (dw) {
      if (cur.some(function (w) { return w.doc === id && w.word === dw.word; })) return;
      cur.push({ id: U.uid(), word: dw.word, ph: dw.ph || '', mean: dw.mean || '', doc: id, src: '文档:' + doc.name });
      n++;
    });
    save(); return n;
  }

  W.S = {
    load: load, get: get, save: save, ck: ck2, tasks: tasks, note: note, folders: folders, links: links,
    folder: folder, reset: reset, exportJSON: exportJSON, importJSON: importJSON,
    addDoc: addDoc, removeDoc: removeDoc, importDocWords: importDocWords,
    QUOTES: QUOTES, AI_ENGINES: AI_ENGINES, EN_APPS: EN_APPS, EN_SITES: EN_SITES, NAV: NAV, chapter: ch
  };
})();
