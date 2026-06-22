# AI 爽文小说创作工作流

## 📈 市场风向（2026年6月 实时数据）

**Royal Road 本周 Top 15 热门小说分析：**

| 类型 | 占比 | 读者热度 |
|------|------|---------|
| **LitRPG** | 12/15 = 80% | 🔥🔥🔥🔥🔥 绝对统治 |
| **Progression Fantasy** | 8/15 = 53% | 🔥🔥🔥🔥 |
| **Cultivation 修仙** | 6/15 = 40% | 🔥🔥🔥🔥 持续上升 |
| **Portal/Isekai** | 7/15 = 47% | 🔥🔥🔥 |
| **Kingdom Building** | 4/15 = 27% | 🔥🔥🔥 上升中 |
| **Time Loop** | 3/15 = 20% | 🔥🔥 新趋势 |

**🏆 最大发现：LitRPG + Cultivation 融合是当前 No.1 趋势**

6 本含中国元素的 Top 15 作品（Sky Pride / Ave Xia Rem Y / Cultivation is Creation / Path to Transcendence / Five Element Overlord / Cultivation System Elder Edition）——华人文化元素在英文网文圈已经是**主流而非小众**。

**我们的定位：** LitRPG + Xianxia 融合 + 中国元素 → 直接命中市场最大赛道

---

## 🚀 快速上手（30 秒选赛道开写）

```bash
# 选一个 Genre，复制对应 Prompt 模板，扔给 DeepSeek 直接出章节
Genre 1: Xianxia     → 修仙逆袭，废柴变仙帝
Genre 2: LitRPG      → 游戏面板，数值碾压
Genre 3: Isekai      → 穿越碾压，知识降维打击
Genre 4: System      → 末日系统，天选之人
Genre 5: Urban       → 都市隐藏，白天废柴夜帝王
Genre 6: Revenge     → 重生复仇，专属打脸套餐
Genre 7: Kingdom     → 种田基建，从零建帝国

每一步：AI 出草稿 → 你审核润色 → 下一章
```

## 概述

本工作流用于在 FictionVerse 平台持续产出高质量、无版权风险的英文网文（爽文）。支持两条路径：

| 路径 | 版权风险 | 自由度 | 适用 |
|------|---------|--------|------|
| **公版改编** | 零风险 | 中（需保留原著精神） | 经典翻新、二次创作 |
| **AI 纯原创** | 零风险 | 高（完全自由发挥） | 全新世界、爽点最大化 |

---

## 🗂️ 公版素材库（零版权风险）

### 英文公版（1928年前出版，美国）

| 来源 | 地址 | 数量 | 特点 |
|------|------|------|------|
| **Project Gutenberg** | gutenberg.org | 7万+ | 最大公版库，TXT/HTML/EPUB |
| **ManyBooks.net** | manybooks.net | 3万 | 分类清晰，可直接下载 |
| **Standard Ebooks** | standardebooks.org | 精选 | 精修排版，阅读体验好 |
| **Internet Archive** | archive.org/details/texts | 海量 | 含1928年前绝版老小说 |

### CC0 / CC-BY 授权

| 来源 | 说明 |
|------|------|
| Wattpad Free PD 专区 | 公版专区，CC0 作品 |
| Royal Road 免费开源短篇 | 部分作者以 CC 协议发布 |
| Feedbooks 开源库 | 公版 + CC 授权电子书 |
| Reddit r/WritingPrompts | 创意提示词，随意使用 |

### 中文公版

| 来源 | 说明 |
|------|------|
| 国家图书馆公版资源 | 数字化古籍 |
| Project Gutenberg 中文分区 | 中英对照版本 |

> ⚠️ **版权红线**：绝不碰 1928 年后未声明 CC0 的作品，不爬取付费网文。

---

## 📖 公版改编工作流

### 第一步：选材

从公版库中挑选适合改编的情节型作品：

**最佳改编素材类型：**
- 冒险/探险小说（《金银岛》《所罗门王的宝藏》）
- 武侠/功夫经典（《水浒传》公版英译）
- 神话/传说（《西游记》《一千零一夜》）
- 侦探/悬疑（福尔摩斯系列）
- 科幻先驱（凡尔纳、威尔斯）
- 哥特/恐怖（《德古拉》《弗兰肯斯坦》）

**操作方法：**
1. 浏览 Project Gutenberg "Most Downloaded"
2. 选情节曲折、角色鲜明的作品
3. 用 DeepSeek 提取原著大纲——只提取情节骨架，不复制文字
4. 设计现代爽文化方案

### 第二步：爽文化改造

**核心原则：** 保留原著情节骨架 + 注入爽点元素 = 全新作品

| 公版原著元素 | 爽文化改造 |
|-------------|-----------|
| 单线叙事 | 多线并行 + 反转 |
| 平铺直叙 | 每章结尾留钩子（cliffhanger） |
| 配角扁平 | 增加对手/朋友/导师三角关系 |
| 能力增长缓慢 | 加入明确的升级体系（levels/tiers/breakthroughs） |
| 无金手指 | 设计独特外挂（System、上古传承、重生记忆） |
| 感情线淡薄 | 加入暧昧/CP/感情纠葛 |
| 节奏慢 | 每 3 章一个爽点爆发（打脸/突破/反转） |

### 第三步：写作

**章节目录生成：**
```prompt
Based on the plot framework of [原著名称], design a modern web novel chapter outline.
Requirements:
- 40-60 chapters total
- Each chapter 2,000-3,000 words
- Must include: hook at end of each chapter, power progression system, face-slapping moments
- Genre: [选定类型]
- Name all chapters with compelling titles in English
```

**每章写作：**
```prompt
Write Chapter [N] of "[小说名]" based on this outline:
[章节大纲]

Web novel requirements:
- Opening: Hook within first 3 paragraphs
- Middle: Action/progress/conflict
- Ending: Cliffhanger that makes reader click "next chapter"
- Word count: 2000-2500 words
- Style: Fast-paced, show don't tell, minimal exposition
- Tone: [选定语气，如 dark fantasy / light-hearted / epic]

Character context:
- Protagonist: [人设]
- Current power level: [等级]
- Current arc: [故事弧]
```

---

## 🇨🇳 中国元素出海策略（怎么让老外爱上中国味）

### 核心原则：熟悉的框架 + 异域的调料

> 用西方读者熟悉的壳（LitRPG/Progression/Isekai），装中国的核（修仙/武道/道法），他们觉得"新鲜但好懂"。

### ✅ 老外已经接受的中国元素（直接用）

| 中国元素 | 英文表达 | 接受度 | 例子 |
|---------|---------|--------|------|
| **修真境界** | Cultivation Realms / Qi Levels | ⭐⭐⭐⭐⭐ 烂熟 | Foundation → Core → Nascent Soul |
| **气/Qi** | Qi / Mana / Spirit Energy | ⭐⭐⭐⭐⭐ | "He gathered qi into his dantian" |
| **丹药炼制** | Pill Refining / Alchemy | ⭐⭐⭐⭐⭐ | 比西方炼金术更酷 |
| **功法传承** | Cultivation Manuals / Inherited Techniques | ⭐⭐⭐⭐ | "Ancient Jade Slip bestowed the technique" |
| **武道/剑道** | Martial Arts / Sword Dao | ⭐⭐⭐⭐ | Sword Intent / Blade Qi |
| **门派政治** | Sect Politics / Clan Rivalry | ⭐⭐⭐⭐ | 比西方公会更有层次 |
| **灵根/天赋** | Spiritual Roots / Talent Grades | ⭐⭐⭐⭐ | 五行灵根的英文版 |
| **天劫/雷劫** | Heavenly Tribulation | ⭐⭐⭐ | 每次突破电闪雷鸣 |
| **阵法和符箓** | Formation Arrays / Talismans | ⭐⭐⭐ | 比魔法阵更东方 |
| **仙/魔/妖** | Immortal / Demon / Spirit Beast | ⭐⭐⭐⭐ | 西方奇幻已有类似概念 |

### ⚠️ 需要降维包装的中国元素

| 元素 | 问题 | 解决方案 |
|------|------|---------|
| **中文名字** | 老外记不住"龙傲天""萧炎" | 用 2-3 音节英文名（Kai / Lin / Ren / Zeph） |
| **诗词歌赋** | 翻译后韵味全无 | 用"ancient verse"概括性描述，不逐句翻译 |
| **道德经/庄子** | 太深，读者不懂 | 简化成"the old master once said" |
| **五行八卦** | 58卦？老外懵 | 简化为 5 Elements (Fire/Water/Wood/Metal/Earth) |
| **龙文化差异** | 西方龙=反派，中国龙=神 | 直接写"Divine Dragon"避坑 |

### 🎯 中国元素融入标准流程

```
Step 1: 用英文骨架搭框架
  → LitRPG 系统面板 + 西方读者熟悉的叙事节奏

Step 2: 注入中国内核
  → 修真境界代替等级 / 丹田代替魔力池 / 丹药代替药剂

Step 3: 用东方美学包装
  → 白衣剑仙 / 竹林修行 / 月下悟道 / 茶道论剑

Step 4: 保留中式爽点
  → 三十年河东三十年河西 / 莫欺少年穷 / 扮猪吃老虎
  → 英文改写："Thirty years east, thirty years west — don't bully a young man for being poor"
```

### 📊 成功案例范本

**#1: Beware of Chicken（公鸡下山）** — Royal Road 现象级作品
- 套路：加拿大作者写的 Xianxia + Slice of Life
- 中国元素：修真界宗门政治、气功修炼、中式田园
- 成功原因：用西方幽默包裹东方设定，主角只想种田不想打架

**#2: Cradle 系列** — Amazon 现象级
- 套路：美国作者写的 Cultivation + Progression
- 中国元素：修真境界体系、古族争斗、武道精神
- 成功原因：完全西式叙事节奏 + 纯正东方修炼内核

**#3: Ave Xia Rem Y** — Royal Road 12,901 粉丝
- 套路：经典仙侠重生 + 中式宗门政治
- 中国元素：大量中国式人情世故、师徒关系、门派秘籍
- 成功原因：老外已经能看懂门派政治了！

### 🚫 中国元素使用禁忌

- ❌ 不要翻译中文成语 —— 老外看不懂"杀鸡儆猴"
- ❌ 不要用拼音名字 —— Kai 比 Long Aotian 好记 100 倍
- ❌ 不要解释太多 —— 读者不需要知道所有细节，保持神秘感
- ❌ 不要在开头堆设定 —— 第 1 章就开始打，设定融入战斗中
- ❌ 不要照搬起点文节奏 —— 海外读者不爱 1000 章漫无目的
- ✅ 50-100 章有明确结局，老外要"看得见终点"

### 核心爽点模板

Web novel 英文圈最火的题材和爽点：

#### 主赛道（阅读量最大）

| 类型 | 英文关键词 | 爽点核心 |
|------|-----------|---------|
| **Xianxia / Cultivation** | 修仙 | 从废柴到仙帝，层层突破，打脸逆袭 |
| **LitRPG / GameLit** | 游戏化升级 | 系统面板、数值可视化、升级快感 |
| **Isekai / Transmigration** | 穿越/重生 | 前世知识碾压异世界，先知先觉 |
| **System / Apocalypse** | 系统流/末日 | 全世界崩了但我有系统，降维打击 |
| **Urban Fantasy** | 都市超能 | 隐藏在现代社会的超自然力量 |

#### 英文网文爽点公式

```
爽点 = 被低估/被欺辱 → 获得力量 → 打脸升级 → 收获崇拜/恐惧
```

每 3 章循环一次，全书重复 10-20 次。

#### 金手指类型（选一个）

| 金手指 | 例子 | 吸引力 |
|--------|------|--------|
| **系统面板** | [Ding! Skill Acquired: Sword Intent Lv.99] | LitRPG 读者最爱 |
| **重生记忆** | 前世是剑神，重生到废柴身上 | 先知快感 |
| **上古传承** | 得到太古神器/功法 | 神秘感 |
| **隐藏血统** | 半人半神/龙族血脉觉醒 | 身份反转 |
| **知识碾压** | 现代人穿越到魔法世界，用科学碾压 | 智商爽感 |

### 人设构建模板

```
Name: [英文名，3-4音节易记]
Age: [18-25，网文读者同龄]
Background: [悲惨但不下贱——孤儿/家族弃子/被退婚]
Personality: [果断/隐忍/腹黑/——不能优柔寡断]
Goal: [复仇 → 变强 → 探索世界真相，层层递进]
Flaw: [一个可控的弱点，让角色有成长空间]
Power System: [明确的等级体系，方便读者理解]
```

### 章节结构模板

每章标准结构：

```
[0-200 words] Hook: 上章钩子解决 or 新冲突引爆
[200-800 words] 冲突展开：主角应对挑战
[800-1500 words] 转折：获得新能力/新信息/新盟友
[1500-2200 words] 小高潮：展示能力提升 or 打脸对手
[2200-2500 words] 勾子：新危机出现 or 更大目标揭露 → "Continue reading →"
```

### 作品整体节奏

| 阶段 | 章节 | 重点 |
|------|------|------|
| **开局** | Ch 1-5 | 引入金手指 + 第一次小爽点，读者上瘾 |
| **发育** | Ch 6-15 | 建立世界观 + 收队友 + 连续小打脸 |
| **转折** | Ch 16-20 | 第一大 BOSS 出现，世界扩大 |
| **爆发** | Ch 21-30 | 中期高潮，首次重大突破 |
| **升华** | Ch 31-40 | 揭示世界真相，力量质变 |
| **终局** | Ch 41-50 | 最终决战，全书最爽点 |
| **后记** | Ch 51+ | 结局留白 or 开新篇钩子 |

---

## 📐 七大 Genre 公式（直接套用）

### 公式 1：Xianxia / Cultivation（修仙·逆袭流）

**一句话：** 废柴少年获得奇遇 → 层层突破境界 → 碾压所有看不起他的人 → 成为至高无上的存在

**境界体系（英文读者熟悉）：**
```
Mortal Realm → Qi Refining → Foundation → Core Formation → 
Nascent Soul → Spirit Severing → Dao Seeking → Immortal Ascension
```

**每章模板：**
```
Ch 1: 受辱（被退婚/被欺压/家族除名）
Ch 2: 奇遇（上古神物认主 / 神秘老人传功 / 前世记忆觉醒）
Ch 3: 第一次突破 + 第一次打脸（曾经看不起他的人目瞪口呆）
Ch 4-10: 小宗门崛起（突破→打脸→突破→打脸 循环）
Ch 11-20: 进入更大世界（宗门大比碾压 / 秘境奇遇 / 收服追随者）
Ch 21-30: 大陆争霸（对头家族灭门 / 古国皇权争夺）
Ch 31-40: 上界降临（发现自己是棋子 / 突破世界规则限制）
Ch 41-50: 天道终局（与天道博弈 / 创造新世界）
```

**爽点触发词（英文）：**
- "You cripple dare challenge ME?" (废柴挑战)
- "The pill that the sect master treasures? I eat them as snacks." (资源碾压)
- "You broke through 3 realms? I broke through 9." (突破碾压)
- "This so-called 'genius' can't even take one strike." (天才打脸)

**Prompt 模板：**
```prompt
Write a Xianxia web novel scene:
- Protagonist just awakened his [hidden bloodline / ancient memory / divine artifact]
- Someone who mocked him before challenges him in public
- Show the crowd's shock as protagonist displays overwhelming power
- Include a clear cultivation breakthrough with vivid description
- End with protagonist declaring a new goal that's 10x bigger
- 2000-2500 words, fast-paced, show don't tell
```

### 公式 2：LitRPG / GameLit（系统面板流）

**一句话：** 普通人获得游戏系统 → 像打 RPG 一样升级现实 → 所有人都看不懂他的面板

**必须元素：**
```
[Ding!] 系统提示音 — 每章至少 1 次
[Status Panel] — 每 3 章展示一次面板
[Skill Acquired] — 每次学新技能
[Quest Completed] — 每完成一个目标
[Level Up!] — 连续升级，制造高潮
```

**面板模板：**
```
Name: [主角名]
Class: [独特职业] Lv.[N]
HP: [数值] / MP: [数值]
STR: [数值]  AGI: [数值]  INT: [数值]
Skills: [技能列表，逐章增加]
Equipment: [装备列表]
Titles: [称号，来自成就]
```

**每章节奏：**
```
Ch 1: System Awakening
- 世界异变/进入游戏 → [Ding! Welcome, Player #1]
- 展示初始面板 → 发现隐藏职业

Ch 2-5: Tutorial Phase (快速升级)
- 第一次战斗 → [Level Up!] ×3
- 获得第一个隐藏技能 → [Hidden Skill Acquired: ???]
- 遇到其他玩家 → 对比面板碾压

Ch 6-10: Early Game Dominance
- 进入首个副本 → Solo Clear → [World First!]
- 装备碾压 → 全球排名冲上前10

Ch 11-30: Mid Game
- 公会战/团队本 → 一人 carry 全场
- 隐藏任务 → [Legendary Quest] → 神级装备

Ch 31-50: End Game
- 游戏与现实融合 → 系统权限之争
- 最终 BOSS → 世界真相 → 成为 GM/创世神
```

**爽点触发词（英文）：**
- "[Ding!]" 每次响起的清脆提示音
- "That skill has a 0.001% drop rate." "I have three." 
- "You cleared it in 48 hours? The world record was 2 weeks."
- "[Hidden Class Unlocked: ???]"

**Prompt 模板：**
```prompt
Write a LitRPG web novel scene:
- Show the system notification clearly with [Ding!]
- Protagonist gains a rare skill/item that others can't get
- Include a status panel or skill description
- Someone mocks or underestimates protagonist → immediate proof of power
- End with a new Quest notification that hints at bigger danger
- 2000-2500 words, game-like precision
```

### 公式 3：Isekai / Transmigration（穿越碾压流）

**一句话：** 现代人穿越到魔法/玄幻世界 → 用现代知识碾压 → 所有人都以为他是天才

**三种开局：**
| 类型 | 开局 | 爽点来源 |
|------|------|---------|
| **知识碾压** | 科学家/工程师穿越 | 用物理学碾压魔法世界 |
| **重生先知** | 带着记忆回到过去 | 知道所有未来事件，抢先布局 |
| **身份交换** | 穿成恶役千金/废柴 | 表面废物暗地最强 |

**知识碾压模板：**
```
魔法师们研究百年才能释放火球术
→ 主角用燃烧反应 + 压缩空气做出火焰喷射器

炼金术士耗费材料才能炼金
→ 主角用化学方程式精确合成

敌人布下最强防御结界
→ 主角用电场理论找出结界薄弱点
```

**重生先知模板：**
```
- 抢在未来天才之前收服神兽（未来人称"逆天"）
- 收购未来会暴涨的资源（别人觉得他疯了）
- 提前结识未来强者当小弟（现在还是弱者）
- 避免灭门灾难（家人不知为何感激涕零）
```

**Prompt 模板：**
```prompt
Write an Isekai web novel scene:
- Protagonist is a [modern profession] transported to a [fantasy setting]
- Show how modern knowledge solves a problem that baffles the natives
- Include a moment where a native character is shocked by protagonist's "genius"
- The solution should feel clever and make logical sense
- End with protagonist recognizing a bigger pattern/problem from their past life
- 2000-2500 words, blend humor and cleverness
```

### 公式 4：System Apocalypse（末日系统流）

**一句话：** 末日降临 → 别人拼命求生 → 我有系统 → 末日是我的游乐场

**爆发节奏：**
```
Ch 1: Apocalypse Begins
- 世界异变（怪物出现/全球通告）
- 别人恐慌逃跑，主角获得系统 → [Ding!]

Ch 2-5: Survival Phase
- 第一次击杀怪物 → [Level Up!]
- 发现隐藏区域/物品 → 领先所有人
- 首次遇到幸存者 → 展示差距

Ch 6-10: Base Building
- 建立安全区 → 幸存者聚集
- 系统解锁建设功能 → 防御塔/农场/兵营

Ch 11-20: Faction Rising
- 其他势力挑衅 → 碾压反击
- 地牢/Boss 挑战 → [World First Clear]

Ch 21-40: World Conquest
- 怪物潮来袭 → 以一当千
- 发现末日真相（外星实验/神灵游戏）

Ch 41-50: Apocalypse Master
- 反攻怪物源头 → 终结末日
- 成为新世界秩序缔造者
```

**Prompt 模板：**
```prompt
Write a System Apocalypse web novel scene:
- World is undergoing transformation (monsters/dungeons/game rules appear)
- Protagonist discovers their unique advantage (system/class/skill)
- Show civilians panicking while protagonist calmly adapts
- Include a combat scene with clear power progression
- End with protagonist seeing a bigger threat on the horizon
- 2000-2500 words, tension + progression
```

### 公式 5：Urban Fantasy / Hidden World（都市隐藏流）

**一句话：** 现代社会隐藏着超自然力量 → 主角是某古老传承的唯一继承人 → 白天上课/打工，晚上驱魔/统治地下世界

**双面生活模板：**
```
白天：普通大学生/上班族/外卖员
夜晚：驱魔师/吸血鬼猎人/古老家族少主

反差爽点：
- 学校里欺负他的校霸，晚上跪求他救命
- 上课被老师批评，下课老师被妖怪追杀他出手
- 公司里看不起他的同事，发现 CEO 是他下属
```

**力量体系（现代版）：**
```
- 古老家族血统（龙族/神族/巫族后裔）
- 超能力觉醒（时间/空间/因果）
- 上古遗物认主（博物馆里的古董其实是神器）
- 国家秘密组织（龙组/异常管理局）
```

**Prompt 模板：**
```prompt
Write an Urban Fantasy web novel scene:
- Show protagonist's double life (ordinary appearance vs hidden power)
- A situation from normal life collides with supernatural world
- Someone who disrespected protagonist in normal life witnesses their power
- Keep the modern setting grounded but add supernatural elements
- End with a hint that a larger supernatural organization is watching
- 2000-2500 words, grounded realism + hidden magic
```

### 公式 6：Revenge / Face-Slapping（复仇打脸流）

**一句话：** 主角被背叛/抛弃/杀害 → 归来/重生 → 一个一个收拾仇人 → 每个仇人都有"专属打脸套餐"

**仇人层级（从小到大）：**
```
Lv.1 仇人：当年退婚的前女友/未婚妻
→ 打脸方式：带着比她未婚夫强100倍的人出现在她婚礼上

Lv.2 仇人：当年抢他地位的师弟/同事
→ 打脸方式：在对方最擅长的领域公开碾压

Lv.3 仇人：当年陷害他的导师/上司
→ 打脸方式：揭露罪行+夺回职位+当众羞辱

Lv.4 仇人：当年灭他全家的仇敌
→ 打脸方式：让对方看着他一步步失去一切，最后跪地求饶

Lv.5 终极仇人：背后的黑手
→ 打脸方式：让整个世界的规则为他改写
```

**打脸三步法：**
```
Step 1: 轻视 — 仇人认为主角还是当初的废物
Step 2: 展示 — 主角轻描淡写展示力量差距
Step 3: 反应 — 周围人震惊 + 仇人崩溃 + 主角淡然
```

**Prompt 模板：**
```prompt
Write a Revenge web novel scene:
- Protagonist encounters someone who wronged them in the past
- That person mocks/underestimates protagonist based on old information
- Protagonist reveals how far they've come (calmly, not dramatically)
- Show the shock and disbelief from the antagonist AND bystanders
- Protagonist walks away without looking back
- 2000-2500 words, cold satisfaction
```

### 公式 7：Kingdom / Business Building（种田/基建流）

**一句话：** 主角从零建设势力 → 从一个小村子到王国 → 科技/经济/军事全面碾压 → 敌人还没反应过来就被包围了

**成长阶梯：**
```
Ch 1-5:   一个人的生存 (Survival)
Ch 6-15:  小团队的建立 (Village → Town)
Ch 16-25: 势力的崛起 (Town → City)
Ch 26-40: 区域争霸 (City → Kingdom)
Ch 41-50: 王朝/帝国 (Kingdom → Empire)
```

**建设爽点：**
- 引入现代管理/科技到落后世界
- 经济碾压（敌人还在打仗，你已经收买了他们军粮供应商）
- 人才自动来投（名声远播）
- 外交逆转（之前的敌人主动求和）

**Prompt 模板：**
```prompt
Write a Kingdom Building web novel scene:
- Protagonist introduces an innovation that transforms their community
- Show the before/after contrast clearly
- Include a reaction from a doubter who becomes a believer
- Hint at how this innovation will scale to change the world
- End with a neighboring power taking notice
- 2000-2500 words, satisfying world-building
```

---

## 🧬 Genre 混搭公式（爆款组合）

| 主 Genre | + 辅 Genre | = 爆款组合 | 代表作风格 |
|----------|-----------|-----------|-----------|
| Xianxia | LitRPG | 修仙 + 系统面板 | "Cultivation Online" |
| Isekai | Kingdom Build | 穿越 + 种田 | "Release That Witch" |
| Revenge | Xianxia | 重生复仇 + 修仙 | 经典复仇修仙流 |
| System | Apocalypse | 系统 + 末日 | Solo Leveling 风格 |
| Urban | Revenge | 都市隐藏 + 战神归来 | 都市兵王流 |
| LitRPG | Isekai | 穿越游戏世界 | Sword Art Online 风格 |
| Xianxia | Isekai | 现代人穿修仙界 | 修仙日常流 |

**选择原则：** 新手作者先挑一个主 Genre 打透，老手可以混搭 2 个。

1. 在 Royal Road / Webnovel 搜索同类作品
2. 确认赛道有足够读者（至少 3 本活跃同类作品）
3. 确认差异化空间

### 步骤 1：大纲生成（1天）

```prompt
Create a detailed outline for a [类型] web novel in English.
- Target: 50 chapters, 2,500 words each = ~125,000 words total
- Protagonist: [人设简述]
- Power system: [升级体系]
- Major arcs: 5 arcs with clear goals
- Must include: 10+ face-slapping moments, 3+ major plot twists, satisfying ending
- Genre conventions: [列出类型惯例]
```

### 步骤 2：章节批量生成（5-7天）

使用 DeepSeek API 批量生成，每章独立调用：

1. 先输入大纲/世界观设定作为 system prompt
2. 每次生成一章，带入前情摘要
3. 每章生成后人工审核（10分钟/章）
4. 标注需要重写的段落

### 步骤 3：润色（2天）

逐章润色检查清单：

- [ ] 语法检查（Grammarly）
- [ ] 爽点密度（每 3 章至少一个）  
- [ ] 章尾钩子（每章必须有）
- [ ] 人物一致性（名字、性格、能力）
- [ ] 世界观一致性（规则不矛盾）
- [ ] 节奏检查（不拖沓）
- [ ] 感情线自然度
- [ ] 原创性检查（Copyscape / GPTZero）

### 步骤 4：分阶段发布

**策略：先囤稿再日更**

| 阶段 | 囤稿量 | 发布频率 |
|------|--------|---------|
| 上线首日 | 10章 | 一次性发布建立内容量 |
| 日常更新 | 剩40章 | 每天1-2章，稳定更新 |
| 完本 | — | 最终章可适当加价 |

### 步骤 5：数据迭代

- 跟踪每章阅读量
- 找出读者流失点
- 后续作品针对性优化

---

## 📊 当前 FictionVerse 内容缺口

现有 4 本书 + 147 章 = 远不够建立平台内容量。

**目标：3 个月内达到 500+ 章**

| 作品 | 类型 | 目标章数 | 优先级 |
|------|------|---------|--------|
| 现有 4 本续写 | 各自类型 | 每本 +20 章 | 🟡 |
| 新书 #1 | LitRPG 系统流 | 50 章 | 🔴 |
| 新书 #2 | Xianxia 修仙 | 50 章 | 🔴 |
| 新书 #3 | Urban Fantasy | 40 章 | 🟠 |
| 公版改编 | 冒险改编 | 40 章 | 🟠 |

---

## ⚠️ 版权合规铁律

1. **公版改编**：只改编 1928 年前出版的作品（美国标准），用 AI 重新创作故事情节和文字，不直接翻译
2. **AI 辅助声明**：在 book description 中标注 "Crafted with creative AI assistance, refined by human editors"
3. **不做的事**：
   - ❌ 直接复制任何在版权期内的作品文字
   - ❌ 爬取付费网文平台内容
   - ❌ 使用未经授权的翻译
   - ❌ 模仿仍在版权期内的知名 IP（哈利波特、漫威等）
4. **做的事**：
   - ✅ 使用公版素材作为灵感骨架
   - ✅ AI 生成全新文字和情节
   - ✅ 独创世界观和角色
   - ✅ 标注内容来源

---

## 🛠️ 工具链

| 环节 | 工具 |
|------|------|
| 大纲规划 | DeepSeek Chat |
| 章节写作 | DeepSeek API / Claude |
| 语法检查 | Grammarly |
| 原创性检查 | GPTZero / Copyscape |
| 封面生成 | DALL-E / Midjourney / 免费图库 |
| 发布部署 | FictionVerse Worker API → build.js → CF Pages |
