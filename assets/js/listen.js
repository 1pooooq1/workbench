/* ===== 考研精听功能区：慢速磨耳朵，专治"看得懂听不懂" ===== */
(function () {
  var U = W.U, S = W.S, C = W.C, el = U.el, esc = U.esc;
  W.P = W.P || {};

  /* ---------- 一、素材库（50 条，三档难度，英/美双口音） ----------
     字段：来源分类 | 素材名称 | 口音 | 难度 | 原文 | 听力重点(连读/弱读/失爆/美音) | 译文 | 推荐倍速 | 考研核心词 | 语法&听力考点
     说明：标注中的"美音特点"指 t/d 闪音 /ɾ/、卷舌 r、/æ/ 开口等；英音特点指 r 不卷舌、弱读明显、t 清晰。 */
  var DATA = [
    /* —— 英音 RP · 中等（10 条） —— */
    { id: 'rp-m-01', cat: '经济学人', name: '经济缓慢复苏', accent: '英音RP', level: '中等',
      en: 'The government’s latest figures suggest the economy is slowly recovering from the recession.',
      mark: 'government’s /ˈɡʌvənmənts/ 中 -ment 弱读、n+m 鼻音连读；latest figures 中 /t/+/f/ 相邻，t 半失爆；suggest the 中 /t/ 失爆、the 弱读 /ðə/；is slowly 中 /z/+/s/ 连读；from the 中 /m/+/ð/ 连读。',
      zh: '政府最新数据表明，经济正从衰退中缓慢复苏。', speed: '0.75',
      vocab: 'recession / recover / figure / suggest',
      point: '省略 that 的定语从句；现在进行时 is recovering 表正在进行的趋势；from 表来源。' },
    { id: 'rp-m-02', cat: 'BBC', name: '海平面上升', accent: '英音RP', level: '中等',
      en: 'Scientists have warned that rising sea levels could displace millions of people within decades.',
      mark: 'have warned 中 /v/+/w/ 连读；that rising 中 /t/ 失爆、rising 词首 r 轻；sea levels 中 /iː/+/l/ 连读；could displace 中 /d/+/d/ 相邻、前者轻化；within decades 中 /n/+/d/ 鼻音连读。',
      zh: '科学家警告说，海平面上升可能在几十年内使数百万人流离失所。', speed: '0.75',
      vocab: 'displace / decade / warn / level',
      point: 'that 引导宾语从句；could 表可能性；within + 时间段表"在…之内"。' },
    { id: 'rp-m-03', cat: '经济学人', name: '可再生能源占比', accent: '英音RP', level: '中等',
      en: 'Despite the challenges, renewable energy now accounts for a growing share of global consumption.',
      mark: 'despite the 中 /t/ 失爆、the 弱读 /ðə/；challenges 词尾 /z/ 与 renewable 词首 r 连读；accounts for 中 /s/+/f/ 连读、for 弱读 /fə/；growing share 中 /ŋ/+/ʃ/ 连读；of global 中 /v/+/ɡ/ 连读。',
      zh: '尽管存在挑战，可再生能源目前已占全球消费日益增长的份额。', speed: '0.75',
      vocab: 'renewable / consumption / account / challenge',
      point: 'despite + 名词（非从句）表让步；account for 固定搭配"占…比例"；现在时表常态事实。' },
    { id: 'rp-m-04', cat: 'BBC', name: '公共卫生增资', accent: '英音RP', level: '中等',
      en: 'The committee recommended a substantial increase in funding for public health services.',
      mark: 'committee /kəˈmɪti/ 中 t 在元音间英音仍发清晰 /t/（区别于美音闪音）；recommended a 中 /d/+/ə/ 连读；increase in 中 /s/+/ɪ/ 连读、in 弱读 /ɪn/；for public 中 /r/+/p/ 连读；health services 中 /θ/+/s/ 清辅音相邻。',
      zh: '委员会建议大幅增加公共卫生服务的资金投入。', speed: '0.75',
      vocab: 'committee / substantial / funding / recommend',
      point: 'recommend 后接名词或 that 从句；increase in 表"在…方面的增长"；for 表目的。' },
    { id: 'rp-m-05', cat: '经济学人', name: '对改革的怀疑', accent: '英音RP', level: '中等',
      en: 'Many voters remain sceptical about whether the proposed reforms will actually take effect.',
      mark: 'many voters 中 /i/+/v/ 连读；remain sceptical 中 /n/+/s/ 连读；about whether 中 /t/ 失爆、whether 词首 w 轻；the proposed 中 /t/ 失爆、proposed 词尾 /d/ 弱；reforms will 中 /z/+/w/ 连读；actually take 中 /li/+/t/ 连读。',
      zh: '许多选民仍对拟议中的改革是否真能生效持怀疑态度。', speed: '0.75',
      vocab: 'sceptical / reform / propose / effect',
      point: 'whether 引导宾语从句；proposed 过去分词作定语；take effect 固定搭配"生效"。' },
    { id: 'rp-m-06', cat: 'BBC', name: '城市化与困境', accent: '英音RP', level: '中等',
      en: 'Urbanisation has transformed the landscape, yet rural communities continue to face hardship.',
      mark: 'urbanisation /ˌɜːbənaɪˈzeɪʃn/ 中 r 不卷舌、z 与 has 词首 h 弱读连读；transformed the 中 /d/+/ð/ 连读、the 弱读；landscape yet 中 /t/ 失爆；rural communities 中 /l/+/k/ 连读；continue to 中 /w/+/t/ 连读、to 弱读 /tə/。',
      zh: '城市化改变了地貌，但农村社区仍面临困境。', speed: '0.75',
      vocab: 'urbanisation / transform / rural / hardship',
      point: 'yet 表转折连词；continue to do 持续做某事；现在完成时 has transformed 强调对现在的影响。' },
    { id: 'rp-m-07', cat: '经济学人', name: '贫富差距扩大', accent: '英音RP', level: '中等',
      en: 'The report highlights a widening gap between the rich and the poor across the region.',
      mark: 'report highlights 中 /t/+/h/ 相邻、t 轻化；a widening 中 /ə/+/w/ 连读；gap between 中 /p/+/b/ 失爆（前者不送气）；the rich and 中 /tʃ/+/ə/ 连读、and 弱读 /ən/；and the 中 /d/+/ð/ 连读；poor across 中 /r/+/ə/ 连读。',
      zh: '报告突显出该地区贫富差距正在扩大。', speed: '0.75',
      vocab: 'highlight / widen / region / gap',
      point: 'between A and B 固定结构；across 表"横跨/遍及"；现在分词 widening 作定语表"正在扩大的"。' },
    { id: 'rp-m-08', cat: 'BBC', name: '人工智能超越人类', accent: '英音RP', level: '中等',
      en: 'Researchers argue that artificial intelligence may outperform humans in certain routine tasks.',
      mark: 'researchers argue 中 /z/+/ɑː/ 连读；that artificial 中 /t/ 失爆；intelligence may 中 /s/+/m/ 连读；outperform humans 中 /m/+/h/ 连读；in certain 中 /n/+/s/ 连读；routine tasks 中 /n/+/t/ 鼻音+齿龈相邻。',
      zh: '研究人员认为，人工智能在某些常规任务上可能超越人类。', speed: '0.75',
      vocab: 'artificial / outperform / routine / intelligence',
      point: 'that 宾从；may + 动词原形表可能；outperform 前缀 out- 表"超过"；in 表"在…方面"。' },
    { id: 'rp-m-09', cat: '经济学人', name: '增长与减排平衡', accent: '英音RP', level: '中等',
      en: 'Policymakers must balance economic growth against the urgent need to cut emissions.',
      mark: 'policymakers /ˈpɒləsimeɪkəz/ 中 r 不卷舌；must balance 中 /t/+/b/ 失爆；economic growth 中 /k/+/ɡ/ 清浊相邻；against the 中 /t/ 失爆、the 弱读；urgent need 中 /t/+/n/ 失爆（t 不送气）；to cut 中 /t/ 轻、to 弱读 /tə/。',
      zh: '政策制定者必须在经济增长与削减排放的迫切需求之间取得平衡。', speed: '0.75',
      vocab: 'policymaker / balance / emission / urgent',
      point: 'must + 原形；balance A against B 权衡；need to do 需要做；urgent 作定语。' },
    { id: 'rp-m-10', cat: 'BBC', name: '公众信任削弱', accent: '英音RP', level: '中等',
      en: 'Public trust in institutions has eroded, prompting calls for greater transparency.',
      mark: 'public trust 中 /k/+/t/ 失爆（k 不送气）；in institutions 中 /n/+/ɪ/ 连读；has eroded 中 /z/+/ɪ/ 连读；prompting calls 中 /ŋ/+/k/ 鼻音连读；for greater 中 /r/+/ɡ/ 连读；transparency /trænsˈpærənsi/ 中 tr 破擦、r 不卷舌。',
      zh: '公众对机构的信任已经削弱，引发了对更高透明度的呼吁。', speed: '0.75',
      vocab: 'institution / erode / transparency / prompt',
      point: '现在完成时 has eroded 强调持续到现在的结果；prompting 现在分词作结果状语；calls for"呼吁…"。' },

    /* —— 美音 GA · 中等（20 条） —— */
    { id: 'ga-m-01', cat: '纽约时报', name: '科技巨头新设备', accent: '美音GA', level: '中等',
      en: 'The tech giant unveiled a device that could reshape how we interact with machines.',
      mark: 'tech giant 中 /k/+/dʒ/ 相邻、tech 词尾 t 美音清晰；unveiled a 中 /d/+/ə/ 连读；device that 中 /s/+/ð/ 连读；could reshape 中 /d/+/r/ 闪音化相邻；how we 中 /w/+/w/ 连读；interact with 中 /t/ 在 /kt/ 后失爆、with 弱读 /wɪð/。',
      zh: '这家科技巨头发布了一款可能重塑我们与机器互动方式的设备。', speed: '0.75',
      vocab: 'unveil / reshape / interact / device',
      point: 'that 定语从句修饰 device；how 引导宾语从句；介词 with 表"与"。' },
    { id: 'ga-m-02', cat: '时代周刊', name: '气候迫使适应', accent: '美音GA', level: '中等',
      en: 'Climate change is forcing communities to adapt to more frequent extreme weather.',
      mark: 'climate /ˈklaɪmət/ 美音 aɪ；change is 中 /dʒ/+/ɪ/ 连读；forcing communities 中 /ŋ/+/k/ 鼻音连读；to adapt 中 /t/ 轻、to 弱读 /tə/；adapt to 中 /t/+/t/ 失爆重复；more frequent 中 /r/+/f/ 连读；extreme weather 中 /m/+/w/ 连读。',
      zh: '气候变化正迫使各社区适应更频繁的极端天气。', speed: '0.75',
      vocab: 'climate / frequent / extreme / adapt',
      point: 'force sb to do 迫使；adapt to 适应；more + 形容词原级表比较。' },
    { id: 'ga-m-03', cat: '大西洋月刊', name: '公私界限模糊', accent: '美音GA', level: '中等',
      en: 'Social media has blurred the line between private life and public discourse.',
      mark: 'social /ˈsoʊʃl/ 美音 oʊ 双元音、l 清晰；media has 中 /ə/+/h/ 连读；blurred the 中 /d/+/ð/ 连读；line between 中 /n/+/b/ 失爆；private life 中 /t/ 在 /vaɪt/ 后失爆、life 词首 l；and public 中 /d/+/p/ 失爆；discourse /ˈdɪskɔːrs/ 美音 r 卷舌。',
      zh: '社交媒体模糊了私人生活与公共话语之间的界限。', speed: '0.75',
      vocab: 'blur / discourse / private / media',
      point: 'between A and B；has blurred 现在完成时；public discourse"公共话语"为考研阅读高频搭配。' },
    { id: 'ga-m-04', cat: '纽约时报', name: '美联储放缓加息', accent: '美音GA', level: '中等',
      en: 'The Federal Reserve signaled it might slow the pace of interest rate hikes.',
      mark: 'Federal /ˈfedərəl/ 美音 r 卷舌、t 在 /rəl/ 前闪音化（fedərəl）；Reserve signaled 中 /v/+/s/ 连读；it might 中 /t/+/m/ 闪音（mi(t)ght）；slow the 中 /w/+/ð/ 连读、the 弱读；pace of 中 /s/+/ə/ 连读、of 弱读 /əv/；interest rate 中 /t/+/r/ 闪音（in(t)erest）。',
      zh: '美联储暗示，它可能会放缓加息步伐。', speed: '0.75',
      vocab: 'federal / signal / pace / hike',
      point: 'the Federal Reserve 专有名词；might + 原形表可能；pace of"…的步伐"；interest rate"利率"。' },
    { id: 'ga-m-05', cat: '时代周刊', name: '远程办公 redefine', accent: '美音GA', level: '中等',
      en: 'Remote work has redefined what it means to maintain a healthy work-life balance.',
      mark: 'remote /rɪˈmoʊt/ 美音 r 卷舌、oʊ；work has 中 /k/+/h/ 失爆相邻；redefined what 中 /d/+/w/ 连读；it means 中 /t/+/m/ 闪音（i(t) means）；to maintain 中 /t/ 轻；a healthy 中 /ə/+/h/ 连读；work-life 中 /k/+/l/ 失爆；balance /ˈbæləns/ 美音 æ。',
      zh: '远程办公重新定义了维持健康工作与生活平衡意味着什么。', speed: '0.75',
      vocab: 'remote / redefine / maintain / balance',
      point: 'what 引导宾语从句；it means to do"做…意味着"；work-life balance 高频词组。' },
    { id: 'ga-m-06', cat: '大西洋月刊', name: '政策忽视代价', accent: '美音GA', level: '中等',
      en: 'Critics argue the policy overlooks the long-term costs of inaction.',
      mark: 'critics /ˈkrɪtɪks/；argue the 中 /w/+/ð/ 连读；policy overlooks 中 /i/+/oʊ/ 连读；the long-term 中 /ŋ/+/t/ 鼻音+齿龈失爆；costs of 中 /s/+/ə/ 连读、of 弱读；inaction /ɪnˈækʃn/ 美音 æ、ct 失爆。',
      zh: '批评者认为，该政策忽视了不作为的长期代价。', speed: '0.75',
      vocab: 'critic / overlook / inaction / cost',
      point: 'argue (that) 后接宾从（that 可省）；long-term 复合形容词；of 表所属。' },
    { id: 'ga-m-07', cat: '纽约时报', name: '病毒传播', accent: '美音GA', level: '中等',
      en: 'A growing body of evidence suggests the virus spreads more easily outdoors than indoors.',
      mark: 'growing body 中 /ŋ/+/b/ 鼻音连读；of evidence 中 /v/+/e/ 连读、of 弱读；suggests the 中 /s/+/ð/ 连读；virus spreads 中 /s/+/s/ 连读；more easily 中 /r/+/iː/ 连读；outdoors than 中 /z/+/ð/ 连读；indoors /ɪnˈdɔːrz/ 美音 r 卷舌。',
      zh: '越来越多的证据表明，该病毒在户外比室内更容易传播。', speed: '0.75',
      vocab: 'evidence / spread / outdoors / indoors',
      point: 'a body of"一批/大量"；suggests 后宾从；more easily 比较级；than 比较对象。' },
    { id: 'ga-m-08', cat: '时代周刊', name: '通胀挤压利润', accent: '美音GA', level: '中等',
      en: 'Investors remain cautious as inflation pressures squeeze corporate profit margins.',
      mark: 'investors /ɪnˈvestərz/ 美音 r 卷舌；remain cautious 中 /n/+/k/ 鼻音连读；as inflation 中 /z/+/ɪ/ 连读；pressures squeeze 中 /z/+/s/ 连读；corporate /ˈkɔːrpərət/ 美音 r 卷舌、t 闪音化；profit margins 中 /t/+/m/ 失爆。',
      zh: '随着通胀压力挤压企业利润率，投资者仍保持谨慎。', speed: '0.75',
      vocab: 'cautious / inflation / squeeze / margin',
      point: 'as 引导原因/时间状语从句；remain + 形容词系表结构；corporate profit margin"企业利润率"。' },
    { id: 'ga-m-09', cat: '大西洋月刊', name: '言论自由保护', accent: '美音GA', level: '中等',
      en: 'The court ruled that the law violates the constitution’s free-speech protections.',
      mark: 'court ruled 中 /t/+/r/ 闪音（cou(r)t）；that the 中 /t/ 失爆；law violates 中 /w/+/v/ 连读；the constitution’s 中 /n/+/k/ 鼻音连读、美音 r 卷舌；free-speech 中 /iː/+/s/ 连读；protections /prəˈtekʃnz/。',
      zh: '法院裁定，该法律违反了宪法对言论自由的保护。', speed: '0.75',
      vocab: 'rule / violate / constitution / protection',
      point: 'that 宾从；violate 及物；-\'s 所有格；free-speech 复合定语。' },
    { id: 'ga-m-10', cat: '纽约时报', name: '绿色基建抗高温', accent: '美音GA', level: '中等',
      en: 'Cities are investing heavily in green infrastructure to combat rising temperatures.',
      mark: 'cities /ˈsɪtiz/ 美音 t 闪音（ci(t)ies）；are investing 中 /r/+/ɪ/ 连读；heavily in 中 /li/+/ɪ/ 连读、in 弱读；green infrastructure 中 /n/+/ɪ/ 连读；to combat 中 /t/ 轻；rising temperatures 中 /ŋ/+/t/ 失爆、美音 r 卷舌。',
      zh: '各城市正在大力投资绿色基础设施，以应对不断上升的气温。', speed: '0.75',
      vocab: 'infrastructure / combat / temperature / invest',
      point: 'are investing 现在进行时；in 表"在…方面"；to combat 目的状语；rising 现在分词定语。' },
    { id: 'ga-m-11', cat: '时代周刊', name: '年长员工掉队', accent: '美音GA', level: '中等',
      en: 'Older workers often struggle to keep pace with rapid technological change.',
      mark: 'older /ˈoʊldər/ 美音 r 卷舌、t 闪音（ol(r)）；workers often 中 /z/+/ɔː/ 连读；struggle to 中 /l/+/t/ 连读、to 弱读；keep pace 中 /p/+/p/ 失爆重复；with rapid 中 /θ/+/r/ 连读；technological /ˌteknəˈlɑːdʒɪkl/ 美音 ɑː。',
      zh: '年长员工往往难以跟上快速的技术变革。', speed: '0.75',
      vocab: 'struggle / rapid / technological / pace',
      point: 'struggle to do"努力/挣扎着做"；keep pace with"跟上"；with 表伴随。' },
    { id: 'ga-m-12', cat: '大西洋月刊', name: '不平等与教育', accent: '美音GA', level: '中等',
      en: 'The documentary exposed how inequality shapes educational opportunity.',
      mark: 'documentary /ˌdɑːkjuˈmentri/ 美音 ɑː、r 卷舌；exposed how 中 /d/+/h/ 连读；inequality /ˌɪnɪˈkwɑːləti/ 美音 ɑː；shapes educational 中 /s/+/e/ 连读；opportunity /ˌɑːpərˈtuːnəti/ 美音 ɑː、t 闪音（opor(t)unity）。',
      zh: '这部纪录片揭示了不平等如何影响教育机会。', speed: '0.75',
      vocab: 'documentary / expose / inequality / opportunity',
      point: 'how 宾从；shapes 动词"塑造"；educational opportunity"教育机会"。' },
    { id: 'ga-m-13', cat: '纽约时报', name: '供应链推高物价', accent: '美音GA', level: '中等',
      en: 'Supply-chain disruptions have pushed consumer prices to their highest level in decades.',
      mark: 'supply-chain 中 /aɪ/+/tʃ/ 连读、chain 词尾 n 与 disruptions 连读；disruptions have 中 /z/+/h/ 连读；pushed consumer 中 /t/+/k/ 失爆；prices to 中 /s/+/t/ 连读、to 弱读；their highest 中 /r/+/h/ 连读；level in 中 /l/+/ɪ/ 连读。',
      zh: '供应链中断已将消费品价格推至数十年来的最高水平。', speed: '0.75',
      vocab: 'disruption / consumer / decade / supply',
      point: 'have pushed 现在完成时；to + 名词表"到…"；highest level"最高水平"；in decades"数十年来"。' },
    { id: 'ga-m-14', cat: '时代周刊', name: '两党支持育儿', accent: '美音GA', level: '中等',
      en: 'Bipartisan support emerged for a bill that would expand access to childcare.',
      mark: 'bipartisan /ˌbaɪˈpɑːrtɪzn/ 美音 ɑː、r 卷舌、t 闪音；support emerged 中 /t/+/ɪ/ 连读；for a 中 /r/+/ə/ 连读；bill that 中 /l/+/ð/ 连读；would expand 中 /d/+/ɪ/ 连读；access to 中 /s/+/t/ 连读、to 弱读；childcare /ˈtʃaɪldker/ 美音 r 卷舌、t 闪音（chil(r)care）。',
      zh: '一项将扩大育儿服务可及性的法案获得了两党支持。', speed: '0.75',
      vocab: 'bipartisan / emerge / expand / access',
      point: 'for 表"支持…"；that 定从；would + 原形表意愿/假设；access to"…的获取/使用权"。' },
    { id: 'ga-m-15', cat: '大西洋月刊', name: '心理服务缺钱', accent: '美音GA', level: '中等',
      en: 'Mental health services remain underfunded despite growing public awareness.',
      mark: 'mental /ˈmentl/ 美音 e；health services 中 /θ/+/s/ 相邻；remain underfunded 中 /n/+/ʌ/ 连读；despite growing 中 /t/ 失爆；public awareness 中 /k/+/ə/ 连读；awareness /əˈwernəs/ 美音 r 卷舌。',
      zh: '尽管公众意识不断增强，心理健康服务仍然资金不足。', speed: '0.75',
      vocab: 'mental / underfunded / awareness / despite',
      point: 'despite + 名词表让步；remain + 过去分词（被动义）；growing 现在分词定语。' },
    { id: 'ga-m-16', cat: '纽约时报', name: '初创跨洲扩张', accent: '美音GA', level: '中等',
      en: 'The startup secured funding to scale its operations across three continents.',
      mark: 'startup /ˈstɑːrtʌp/ 美音 ɑː、r 卷舌、t 闪音（star(t)up）；secured funding 中 /d/+/f/ 连读；to scale 中 /t/ 轻；its operations 中 /s/+/ɑː/ 连读；across three 中 /s/+/θ/ 连读；continents /ˈkɑːntɪnənts/ 美音 ɑː、t 闪音。',
      zh: '这家初创公司获得了资金，以在三大洲扩大其业务规模。', speed: '0.75',
      vocab: 'startup / secure / scale / continent',
      point: 'secured 过去式"获得"；to scale 目的；across"横跨"；operations"业务/运营"。' },
    { id: 'ga-m-17', cat: '时代周刊', name: '绿电超煤炭', accent: '美音GA', level: '中等',
      en: 'Renewable sources now generate more electricity than coal in several states.',
      mark: 'renewable /rɪˈnuːəbl/ 美音 r 卷舌；sources now 中 /s/+/n/ 连读；generate more 中 /t/+/m/ 失爆；electricity /ɪˌlekˈtrɪsəti/ 美音 t 闪音（elec(t)ricity）；than coal 中 /n/+/k/ 连读；in several 中 /n/+/s/ 连读；states /steɪts/ 美音 t 闪音（sta(t)es）。',
      zh: '在好几个州，可再生能源发电量现已超过煤炭。', speed: '0.75',
      vocab: 'renewable / generate / electricity / coal',
      point: 'more than"超过"；now 表现在；in several states"在多个州"。' },
    { id: 'ga-m-18', cat: '大西洋月刊', name: '风暴前撤离', accent: '美音GA', level: '中等',
      en: 'Local officials warned residents to evacuate before the storm made landfall.',
      mark: 'local /ˈloʊkl/ 美音 oʊ、l 清晰；officials warned 中 /z/+/w/ 连读；residents to 中 /s/+/t/ 连读、to 弱读；evacuate /ɪˈvækjuːeɪt/ 美音 æ；before the 中 /r/+/ð/ 连读、the 弱读；storm made 中 /m/+/m/ 连读；landfall /ˈlændfɔːl/ 美音 æ。',
      zh: '当地官员在风暴登陆前警告居民撤离。', speed: '0.75',
      vocab: 'official / evacuate / landfall / resident',
      point: 'warn sb to do"警告某人做"；before 时间状语；made landfall"登陆"固定搭配。' },
    { id: 'ga-m-19', cat: '纽约时报', name: '铁路网现代化', accent: '美音GA', level: '中等',
      en: 'The committee approved a plan to modernize the nation’s aging rail network.',
      mark: 'committee /kəˈmɪti/ 美音 t 闪音（comi(t)ee）；approved a 中 /d/+/ə/ 连读；plan to 中 /n/+/t/ 连读、to 弱读；modernize /ˈmɑːdərnaɪz/ 美音 ɑː、r 卷舌；the nation’s 中 /n/+/ʃ/ 连读；aging rail 中 /ŋ/+/r/ 连读、美音 r 卷舌；network /ˈnetwɜːrk/ 美音 r 卷舌。',
      zh: '委员会批准了一项使全国老化铁路网现代化的计划。', speed: '0.75',
      vocab: 'approve / modernize / aging / network',
      point: 'approved 过去式；to modernize 目的；-\'s 所有格；aging 现在分词作定语"老化的"。' },
    { id: 'ga-m-20', cat: '时代周刊', name: '国防开支上升', accent: '美音GA', level: '中等',
      en: 'Defense spending is expected to rise as geopolitical tensions escalate.',
      mark: 'defense /dɪˈfens/ 美音 e（美式拼写 -ense）；spending is 中 /ŋ/+/ɪ/ 连读；expected to 中 /d/+/t/ 失爆、to 弱读；rise as 中 /z/+/ə/ 连读；geopolitical /ˌdʒiːoʊpəˈlɪtɪkl/ 美音 oʊ；tensions escalate 中 /z/+/e/ 连读。',
      zh: '随着地缘政治紧张局势升级，国防开支预计将会上升。', speed: '0.75',
      vocab: 'defense / geopolitical / tension / escalate',
      point: 'is expected to"预计会"；as 原因状语从句；escalate"升级"不及物。' },

    /* —— 美音 GA · 初级（20 条） —— */
    { id: 'ga-b-01', cat: '基础词汇', name: '日升日落', accent: '美音GA', level: '初级',
      en: 'The sun rises in the east and sets in the west.',
      mark: 'sun rises 中 /n/+/r/ 连读、美音 r 卷舌；in the 中 /n/+/ð/ 连读、the 弱读 /ðə/；and sets 中 /d/+/s/ 失爆（d 不送气）；in the west 中 /n/+/ð/ 连读。',
      zh: '太阳从东方升起，在西方落下。', speed: '0.75',
      vocab: 'rise / east / set / west',
      point: 'and 连接两个并列句；in the east/west"在东西方"；一般现在时表客观真理。' },
    { id: 'ga-b-02', cat: '基础词汇', name: '每晚阅读', accent: '美音GA', level: '初级',
      en: 'She reads books and listens to music every evening.',
      mark: 'she reads 中 /iː/+/r/ 连读；books and 中 /s/+/ə/ 连读、and 弱读 /ən/；listens to 中 /z/+/t/ 连读、to 弱读 /tə/；music every 中 /k/+/e/ 连读。',
      zh: '她每天晚上读书、听音乐。', speed: '0.75',
      vocab: 'read / listen / music / evening',
      point: 'and 并列谓语；listens to"听"；every evening"每个晚上"表频率。' },
    { id: 'ga-b-03', cat: '基础词汇', name: '保护环境', accent: '美音GA', level: '初级',
      en: 'We should protect the environment for future generations.',
      mark: 'we should 中 /iː/+/ʃ/ 连读；protect the 中 /t/+/ð/ 连读；the environment 中 /ð/+/ɪ/ 连读；for future 中 /r/+/f/ 连读；generations /ˌdʒenəˈreɪʃnz/ 美音 r 卷舌。',
      zh: '我们应该为子孙后代保护环境。', speed: '0.75',
      vocab: 'protect / environment / future / generation',
      point: 'should + 原形表建议；for 表"为了"；future generations"后代"。' },
    { id: 'ga-b-04', cat: '基础词汇', name: '睡前作业', accent: '美音GA', level: '初级',
      en: 'He finished his homework before he went to bed.',
      mark: 'he finished 中 /iː/+/f/ 连读；his homework 中 /z/+/h/ 连读；before he 中 /r/+/h/ 连读；went to 中 /t/+/t/ 失爆、to 弱读 /tə/；to bed 中 /t/+/b/ 失爆。',
      zh: '他在上床睡觉前完成了作业。', speed: '0.75',
      vocab: 'finish / homework / before / bed',
      point: 'before 引导时间状语从句；一般过去时；went to bed"去睡觉"。' },
    { id: 'ga-b-05', cat: '基础词汇', name: '讲解规则', accent: '美音GA', level: '初级',
      en: 'The teacher explained the rule to the students clearly.',
      mark: 'the teacher 中 /ð/+/t/ 连读；explained the 中 /d/+/ð/ 连读；rule to 中 /l/+/t/ 连读、to 弱读；the students 中 /ð/+/s/ 连读；clearly /ˈklɪrli/ 美音 r 卷舌。',
      zh: '老师向学生们清楚地解释了这条规则。', speed: '0.75',
      vocab: 'explain / rule / student / clearly',
      point: 'explain sth to sb"向某人解释"；clearly 副词修饰动词；一般过去时。' },
    { id: 'ga-b-06', cat: '基础词汇', name: '茶饮偏好', accent: '美音GA', level: '初级',
      en: 'Many people prefer tea to coffee in this region.',
      mark: 'many people 中 /i/+/p/ 连读；prefer tea 中 /r/+/t/ 连读；to coffee 中 /t/+/k/ 失爆、to 弱读；in this 中 /n/+/ð/ 连读；region /ˈriːdʒən/ 美音 r 卷舌。',
      zh: '在这个地区，许多人更喜欢茶而不是咖啡。', speed: '0.75',
      vocab: 'prefer / tea / coffee / region',
      point: 'prefer A to B"比起B更喜欢A"；in this region"在这一地区"。' },
    { id: 'ga-b-07', cat: '基础词汇', name: '户外玩耍', accent: '美音GA', level: '初级',
      en: 'The children played outside until it got dark.',
      mark: 'the children 中 /ð/+/tʃ/ 连读；played outside 中 /d/+/aʊ/ 连读；until it 中 /l/+/ɪ/ 连读；got dark 中 /t/+/d/ 失爆（t 不送气）。',
      zh: '孩子们在外面玩直到天黑。', speed: '0.75',
      vocab: 'child / play / outside / until',
      point: 'until 引导时间状语从句；it got dark"天变黑"；一般过去时。' },
    { id: 'ga-b-08', cat: '基础词汇', name: '健康饮食', accent: '美音GA', level: '初级',
      en: 'A healthy diet helps you stay energetic all day.',
      mark: 'a healthy 中 /ə/+/h/ 连读；diet helps 中 /t/+/h/ 连读；you stay 中 /uː/+/s/ 连读；energetic /ˌenərˈdʒetɪk/ 美音 r 卷舌；all day 中 /l/+/d/ 连读。',
      zh: '健康的饮食能让你一整天保持精力充沛。', speed: '0.75',
      vocab: 'healthy / diet / energetic / stay',
      point: 'help sb do"帮助某人做"；stay + 形容词系表；all day"一整天"。' },
    { id: 'ga-b-09', cat: '基础词汇', name: '搬去大城市', accent: '美音GA', level: '初级',
      en: 'They decided to move to a bigger city last year.',
      mark: 'they decided 中 /eɪ/+/d/ 连读；to move 中 /t/ 轻、to 弱读 /tə/；to a 中 /t/+/ə/ 连读；bigger city 中 /r/+/s/ 连读、美音 r 卷舌；last year 中 /t/+/j/ 连读。',
      zh: '去年他们决定搬到一个更大的城市。', speed: '0.75',
      vocab: 'decide / move / bigger / city',
      point: 'decide to do"决定做"；move to"搬到"；last year"去年"。' },
    { id: 'ga-b-10', cat: '基础词汇', name: '图书馆时间', accent: '美音GA', level: '初级',
      en: 'The library closes at nine and opens at eight.',
      mark: 'the library 中 /ð/+/l/ 连读；closes at 中 /z/+/ə/ 连读、at 弱读 /ət/；nine and 中 /n/+/ə/ 连读、and 弱读；opens at 中 /z/+/ə/ 连读；eight /eɪt/。',
      zh: '图书馆九点关门，八点开门。', speed: '0.75',
      vocab: 'library / close / open / nine',
      point: 'at + 时刻；and 并列；一般现在时表常态。' },
    { id: 'ga-b-11', cat: '基础词汇', name: '晨练英语', accent: '美音GA', level: '初级',
      en: 'He practiced speaking English with his friends every morning.',
      mark: 'he practiced 中 /iː/+/p/ 连读；speaking English 中 /ŋ/+/ɪ/ 连读；with his 中 /θ/+/h/ 连读；friends every 中 /z/+/e/ 连读；morning /ˈmɔːrnɪŋ/ 美音 r 卷舌。',
      zh: '他每天早晨和朋友们练习说英语。', speed: '0.75',
      vocab: 'practice / speak / English / morning',
      point: 'practice doing"练习做"；with"和"；every morning"每天早晨"。' },
    { id: 'ga-b-12', cat: '基础词汇', name: '雨中准点', accent: '美音GA', level: '初级',
      en: 'The train arrived on time despite the heavy rain.',
      mark: 'the train 中 /ð/+/t/ 连读；arrived on 中 /d/+/ɑː/ 连读；on time 中 /n/+/t/ 连读；despite the 中 /t/ 失爆、the 弱读；heavy rain 中 /i/+/r/ 连读、美音 r 卷舌。',
      zh: '尽管下着大雨，火车还是准时到达了。', speed: '0.75',
      vocab: 'train / arrive / on time / despite',
      point: 'on time"准时"；despite + 名词表让步；一般过去时。' },
    { id: 'ga-b-13', cat: '基础词汇', name: '存钱买本', accent: '美音GA', level: '初级',
      en: 'She saved money so that she could buy a new laptop.',
      mark: 'she saved 中 /iː/+/s/ 连读；money so 中 /i/+/s/ 连读；that she 中 /t/ 失爆；could buy 中 /d/+/b/ 失爆；a new 中 /ə/+/n/ 连读；laptop /ˈlæptɑːp/ 美音 æ、r 卷舌。',
      zh: '她存钱，以便能买一台新笔记本电脑。', speed: '0.75',
      vocab: 'save / money / laptop / so that',
      point: 'so that 引导目的状语从句；could + 原形表过去能力/意愿；a new laptop"一台新笔记本"。' },
    { id: 'ga-b-14', cat: '基础词汇', name: '鼓励阅读', accent: '美音GA', level: '初级',
      en: 'Parents should encourage children to read more books.',
      mark: 'parents /ˈperənts/ 美音 r 卷舌、t 闪音（paren(t)s）；should encourage 中 /d/+/ɪ/ 连读；children to 中 /n/+/t/ 连读、to 弱读；read more 中 /d/+/m/ 失爆；books /bʊks/。',
      zh: '父母应该鼓励孩子多读书。', speed: '0.75',
      vocab: 'parent / encourage / child / read',
      point: 'should + 原形；encourage sb to do"鼓励某人做"；more books"更多的书"。' },
    { id: 'ga-b-15', cat: '基础词汇', name: '会议延期', accent: '美音GA', level: '初级',
      en: 'The meeting was postponed because the manager was sick.',
      mark: 'the meeting 中 /ð/+/m/ 连读；was postponed 中 /z/+/p/ 连读；because the 中 /z/+/ð/ 连读、the 弱读；manager /ˈmænɪdʒər/ 美音 r 卷舌、t 闪音（mana(t)ger）；was sick 中 /z/+/s/ 连读。',
      zh: '会议被推迟了，因为经理病了。', speed: '0.75',
      vocab: 'meeting / postpone / because / manager',
      point: 'was postponed 被动语态；because 引导原因状语从句；was sick"生病了"。' },
    { id: 'ga-b-16', cat: '基础词汇', name: '历史课收获', accent: '美音GA', level: '初级',
      en: 'We learned a lot about history from our teacher.',
      mark: 'we learned 中 /iː/+/l/ 连读；a lot 中 /ə/+/l/ 连读；about history 中 /t/+/h/ 连读；from our 中 /m/+/aʊ/ 连读；teacher /ˈtiːtʃər/ 美音 r 卷舌、t 闪音（tea(t)cher）。',
      zh: '我们从老师那里学到了很多历史知识。', speed: '0.75',
      vocab: 'learn / history / from / teacher',
      point: 'learn about"学习关于"；a lot"许多"；from"从"。' },
    { id: 'ga-b-17', cat: '基础词汇', name: '猫打碎杯', accent: '美音GA', level: '初级',
      en: 'The cat jumped onto the table and broke a cup.',
      mark: 'the cat 中 /ð/+/k/ 连读；jumped onto 中 /t/+/ɑː/ 连读；the table 中 /ð/+/t/ 连读；and broke 中 /d/+/b/ 失爆；a cup 中 /ə/+/k/ 连读。',
      zh: '猫跳上桌子，打碎了一个杯子。', speed: '0.75',
      vocab: 'jump / onto / table / break',
      point: 'onto"到…上面"；and 并列；broke 为 break 过去式。' },
    { id: 'ga-b-18', cat: '基础词汇', name: '会前邮件', accent: '美音GA', level: '初级',
      en: 'He sent an email to his boss before the meeting started.',
      mark: 'he sent 中 /iː/+/s/ 连读；an email 中 /n/+/iː/ 连读；to his 中 /t/+/h/ 连读、to 弱读；boss before 中 /s/+/b/ 连读；the meeting 中 /ð/+/m/ 连读；started /ˈstɑːrtɪd/ 美音 r 卷舌、t 闪音。',
      zh: '会议开始前，他给老板发了一封邮件。', speed: '0.75',
      vocab: 'send / email / boss / meeting',
      point: 'send sth to sb"把…发给某人"；before 时间状语；一般过去时。' },
    { id: 'ga-b-19', cat: '基础词汇', name: '沿河种树', accent: '美音GA', level: '初级',
      en: 'They planted trees along the river to stop the soil from washing away.',
      mark: 'they planted 中 /eɪ/+/p/ 连读；trees along 中 /z/+/ə/ 连读；the river 中 /ð/+/r/ 连读、美音 r 卷舌；to stop 中 /t/ 轻；the soil 中 /ð/+/s/ 连读；from washing 中 /m/+/w/ 连读；away /əˈweɪ/。',
      zh: '他们沿河种树，以防止土壤被冲走。', speed: '0.75',
      vocab: 'plant / along / river / soil',
      point: 'along"沿着"；to stop 目的；stop sth from doing"阻止…做"。' },
    { id: 'ga-b-20', cat: '基础词汇', name: '宝宝安睡', accent: '美音GA', level: '初级',
      en: 'The baby slept peacefully while the mother read a story.',
      mark: 'the baby 中 /ð/+/b/ 连读；slept peacefully 中 /t/+/p/ 失爆（t 不送气）；while the 中 /l/+/ð/ 连读、the 弱读；mother read 中 /r/+/r/ 连读、美音 r 卷舌；a story /ˈstɔːri/ 美音 r 卷舌。',
      zh: '宝宝安静地睡着了，而妈妈在读故事。', speed: '0.75',
      vocab: 'baby / sleep / peacefully / while',
      point: 'while 引导时间状语从句"当…时"；peacefully 副词；一般过去时并列。' }
  ];

  /* ---------- 二、学习状态持久化 ---------- */
  function prog() {
    var s = S.get();
    if (!s.kyListen) s.kyListen = { status: {} };
    if (!s.kyListen.status) s.kyListen.status = {};
    return s.kyListen;
  }
  function statusOf(id) { return prog().status[id] || 'new'; }
  function setStatus(id, st) { var p = prog(); p.status[id] = st; S.save(); }

  /* ---------- 三、界面状态 ---------- */
  var SPEEDS = ['0.5', '0.75', '1.0', '1.25', '1.5'];
  var gSpeed = '0.75';           // 精听默认慢速起手
  var blind = false;              // 盲听模式（隐藏全部原文+译文）
  var f = { src: 'all', acc: 'all', lvl: 'all', st: 'all', q: '' };

  function langOf(it) { return it.accent === '英音RP' ? 'en-GB' : 'en-US'; }

  function injectStyle() {
    if (document.getElementById('kl-style')) return;
    var s = document.createElement('style');
    s.id = 'kl-style';
    s.textContent =
      '.kl-top{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px 4px}' +
      '.kl-top .kl-meta{display:flex;flex-wrap:wrap;gap:4px;margin-left:auto}' +
      '.kl-en{font-size:15px;font-weight:600;line-height:1.55;padding:2px 12px 8px;color:#1f2d3d}' +
      '.kl-mark{margin:0 12px 8px;padding:8px 10px;border-radius:10px;background:#fff7e6;border:1px solid #ffe2b8;font-size:12px;line-height:1.65;color:#7a5a17}' +
      '.kl-mark b{color:#b9791a}' +
      '.kl-zh{margin:0 12px 8px;padding:6px 10px;border-left:3px solid var(--pri);background:var(--pri-soft);border-radius:0 8px 8px 0;font-size:13px;line-height:1.6;color:#33424f}' +
      '.kl-zh b{color:var(--pri)}' +
      '.kl-vb{display:flex;flex-wrap:wrap;gap:5px;padding:0 12px 8px}' +
      '.kl-pt{margin:0 12px 12px;line-height:1.6;color:var(--tx2)}' +
      '.kl-pt b{color:var(--tx2)}' +
      '.kl-sel{font-size:11px;padding:3px 4px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--tx2)}' +
      '.kl-card.kl-done{opacity:.7}' +
      '.kl-card.kl-done .kl-en{color:#2e8b57}' +
      '.kl-card.kl-hz .kl-zh{display:none!important}' +
      '.kl-blind .kl-en,.kl-blind .kl-zh{display:none!important}' +
      '.kl-stats{font-size:12px;color:var(--tx2);margin:2px 0 8px}' +
      '.kl-stats b{color:var(--pri)}' +
      '.kl-sub{font-size:11.5px;color:var(--tx3);margin:-2px 0 8px;line-height:1.6}' +
      '.kl-fltlabel{font-size:11px;color:var(--tx3);margin:10px 2px 4px}' +
      '.kl-step{line-height:1.95;font-size:12px;color:var(--tx2)}' +
      '.kl-tip{font-size:11.5px;color:var(--tx3);margin-top:6px;line-height:1.6}';
    document.head.appendChild(s);
  }

  /* ---------- 四、小组件 ---------- */
  function makeSeg(opts, cur, cb) {
    var seg = el('div', { class: 'seg' });
    opts.forEach(function (o) {
      var b = el('button', { class: o.v === cur ? 'on' : '' }, o.label);
      b.onclick = function () {
        cur = o.v;
        Array.prototype.forEach.call(seg.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
        cb(o.v);
      };
      seg.appendChild(b);
    });
    return seg;
  }

  function buildCard(it) {
    var card = el('div', { class: 'card kl-card' + (statusOf(it.id) === 'done' ? ' kl-done' : '') });
    var top = el('div', { class: 'kl-top' });
    var play = C.btn('▶ 播放', 'sm', function () { U.speak(it.en, langOf(it), +gSpeed, 1.0); });
    var hz = C.btn('👁 译文', 'sm', function () { card.classList.toggle('kl-hz'); });
    var sel = (function () {
      var s = el('select', { class: 'kl-sel' });
      [['new', '未学'], ['learning', '学习中'], ['done', '已掌握']].forEach(function (p) {
        var o = el('option', { value: p[0] }, p[1]);
        if (statusOf(it.id) === p[0]) o.selected = true;
        s.appendChild(o);
      });
      s.onchange = function () {
        setStatus(it.id, s.value);
        if (s.value === 'done') card.classList.add('kl-done'); else card.classList.remove('kl-done');
        updateStats();
      };
      return s;
    })();
    var spo = el('span', { class: 'tag pri' }, '推荐 ' + it.speed + '×');
    var meta = el('div', { class: 'kl-meta' });
    meta.appendChild(el('span', { class: 'tag' }, it.cat));
    meta.appendChild(el('span', { class: 'tag pur' }, it.accent));
    meta.appendChild(el('span', { class: 'tag ok' }, it.level));
    top.appendChild(play); top.appendChild(hz); top.appendChild(sel); top.appendChild(spo); top.appendChild(meta);

    var en = el('div', { class: 'kl-en' }, it.en);
    var mark = el('div', { class: 'kl-mark' });
    mark.innerHTML = '<b>🎯 听力重点（连读/弱读/失爆/美音）</b><br>' + esc(it.mark);
    var zh = el('div', { class: 'kl-zh' });
    zh.innerHTML = '<b>译文</b>　' + esc(it.zh);
    var vb = el('div', { class: 'kl-vb' });
    it.vocab.split(' / ').forEach(function (w) { vb.appendChild(el('span', { class: 'tag' }, w)); });
    var pt = el('div', { class: 'kl-pt' });
    pt.innerHTML = '<b>语法 & 听力考点：</b>' + esc(it.point);

    card.appendChild(top); card.appendChild(en); card.appendChild(mark);
    card.appendChild(zh); card.appendChild(vb); card.appendChild(pt);
    return card;
  }

  /* ---------- 五、列表与统计 ---------- */
  var statsEl = null;
  function updateStats() {
    if (!statsEl) return;
    var st = prog().status, done = 0, learning = 0, nv = 0;
    DATA.forEach(function (it) {
      var s = st[it.id] || 'new';
      if (s === 'done') done++; else if (s === 'learning') learning++; else nv++;
    });
    statsEl.innerHTML = '共 <b>' + DATA.length + '</b> 条精听素材　·　已掌握 <b>' + done + '</b>　·　学习中 <b>' + learning + '</b>　·　未学 <b>' + nv + '</b>';
  }

  function renderList(host) {
    host.innerHTML = '';
    var q = (f.q || '').trim().toLowerCase();
    var list = DATA.filter(function (it) {
      if (f.src !== 'all' && it.cat !== f.src) return false;
      if (f.acc !== 'all' && it.accent !== f.acc) return false;
      if (f.lvl !== 'all' && it.level !== f.lvl) return false;
      if (f.st !== 'all' && statusOf(it.id) !== f.st) return false;
      if (q && (it.en + it.zh + it.name).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (!list.length) { host.appendChild(el('div', { class: 'empty' }, '<span class="ei">🔇</span>没有符合条件的素材，换个筛选试试')); return; }
    list.forEach(function (it) { host.appendChild(buildCard(it)); });
  }

  /* ---------- 六、页面装配 ---------- */
  W.P['kaoyan-listen'] = function (v) {
    injectStyle();
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {};
    v.innerHTML = '';

    /* 头部卡片：标题 + 统计 + 简介 */
    var head = el('div', { class: 'card' });
    head.appendChild(el('div', { style: 'font-size:16px;font-weight:700;padding:12px 12px 0' }, '🎧 考研精听训练'));
    head.appendChild(el('div', { class: 'kl-sub', style: 'padding:0 12px' }, '书面认识、听力跟不上？慢速磨耳朵，专治连读 / 弱读 / 失爆 / 美音闪音听不出。素材均为考研同源外刊，无影视俚语。'));
    statsEl = el('div', { class: 'kl-stats', style: 'padding:0 12px 10px' });
    head.appendChild(statsEl);
    v.appendChild(head);
    updateStats();

    /* 固定训练步骤（可折叠） */
    var stepsCard = el('div', { class: 'card open' });
    var shd = el('div', { class: 'card-hd' });
    shd.appendChild(el('div', { class: 'ch-ic' }, '🎯'));
    var stx = el('div', { class: 'ch-tx' });
    stx.appendChild(el('div', { class: 'ch-t' }, '固定训练步骤（初级 → 中等通用）'));
    shd.appendChild(stx);
    shd.appendChild(el('div', { class: 'ch-ar' }, '▶'));
    var sbd = el('div', { class: 'card-bd' });
    sbd.innerHTML =
      '<div class="kl-step">1️⃣ <b>0.75× 盲听 2–3 遍</b>：不看文本，抓主干、标记听不出的音变<br>' +
      '2️⃣ <b>对照【听力重点】标注</b>：找出连读 / 弱读 / 失爆 / 闪音<br>' +
      '3️⃣ <b>1.0× 影子跟读</b>：模仿原音的音变与节奏<br>' +
      '4️⃣ <b>1.25× 复盘检验</b>：听到即反应，确认是否真听懂<br>' +
      '<span class="muted">提示：美音留意 t/d 闪音 /ɾ/、卷舌 r、/æ/ 大开口；英音留意 r 不卷舌、弱读明显、t 清晰。</span></div>';
    stepsCard.appendChild(shd); stepsCard.appendChild(sbd);
    shd.onclick = function () { stepsCard.classList.toggle('open'); };
    v.appendChild(stepsCard);

    /* 控制卡片：倍速 + 盲听 + 自测提示 */
    var ctrl = el('div', { class: 'card' });
    ctrl.appendChild(el('div', { class: 'kl-fltlabel' }, '音频倍速（精听默认 0.75× 慢速起手）'));
    var speedSeg = makeSeg(SPEEDS.map(function (x) { return { v: x, label: x + '×' }; }), gSpeed, function (val) {
      gSpeed = val;
      U.toast('播放倍速已设为 ' + val + '×');
    });
    ctrl.appendChild(speedSeg);
    var blindBtn = C.btn('🙈 盲听模式：关', 'sm', function () {
      blind = !blind;
      blindBtn.textContent = '🙈 盲听模式：' + (blind ? '开' : '关');
      if (listEl) listEl.classList.toggle('kl-blind', blind);
    });
    var tipRow = el('div', { class: 'row mt6' });
    tipRow.appendChild(blindBtn);
    ctrl.appendChild(tipRow);
    ctrl.appendChild(el('div', { class: 'kl-tip' }, '盲听模式会隐藏全部原文与译文，纯靠耳朵。单条卡片的「👁 译文」可单独隐藏译文做自测（保留原文）。'));
    v.appendChild(ctrl);

    /* 筛选卡片：来源 / 口音 / 难度 / 状态 + 搜索 */
    var flt = el('div', { class: 'card' });
    flt.appendChild(el('div', { class: 'kl-fltlabel' }, '素材来源'));
    flt.appendChild(makeSeg([['all', '全部'], ['经济学人', '经济学人'], ['BBC', 'BBC'], ['纽约时报', '纽约时报'], ['时代周刊', '时代周刊'], ['大西洋月刊', '大西洋月刊'], ['基础词汇', '基础词汇']], f.src, function (val) { f.src = val; renderList(listEl); }));
    flt.appendChild(el('div', { class: 'kl-fltlabel' }, '口音类型'));
    flt.appendChild(makeSeg([['all', '全部'], ['英音RP', '英音RP'], ['美音GA', '美音GA']], f.acc, function (val) { f.acc = val; renderList(listEl); }));
    flt.appendChild(el('div', { class: 'kl-fltlabel' }, '难度等级'));
    flt.appendChild(makeSeg([['all', '全部'], ['初级', '初级'], ['中等', '中等']], f.lvl, function (val) { f.lvl = val; renderList(listEl); }));
    flt.appendChild(el('div', { class: 'kl-fltlabel' }, '学习状态'));
    flt.appendChild(makeSeg([['all', '全部'], ['new', '未学'], ['learning', '学习中'], ['done', '已掌握']], f.st, function (val) { f.st = val; renderList(listEl); }));
    var inp = el('input', { class: 'inp', placeholder: '🔍 搜索原文 / 译文 / 标题' });
    inp.style.marginTop = '8px';
    inp.oninput = U.debounce(function () { f.q = inp.value; renderList(listEl); }, 250);
    flt.appendChild(inp);
    v.appendChild(flt);

    /* 列表 */
    var listEl = el('div');
    if (blind) listEl.classList.add('kl-blind');
    v.appendChild(listEl);
    renderList(listEl);
  };
})();
