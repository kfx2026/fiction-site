#!/usr/bin/env python3
"""生成审核系统全部文件"""
import json, os
BASE = os.path.dirname(os.path.abspath(__file__))

# 违禁词 (类别,级别,词条列表)
fw_data = [
    ("色情","severe","做爱 性交 口交 肛交 操逼 肏 婊子 骚货 淫荡 淫秽 黄片 A片 三级片 毛片 裸照 脱衣 约炮 一夜情 性奴 偷拍 艳照 肉文 H文 R18 春药 催情 迷药 乱伦 嫖娼 卖淫 妓女 嫖客 射精 潮吹 强奸 轮奸 迷奸 性虐待 里番 fuck porn hentai xxx cum dick pussy cock tits anal blowjob masturbat ejaculat penis vagina clitoris incest rape prostitut escort slut whore milf squirting gangbang threesome orgy bukkake futanari"),
    ("色情","moderate","色情 AV 裸体 裸露 乳房 生殖器 自慰 手淫 高潮 SM 露出 床戏 激情戏 本子 擦边 挑逗 勾引 叫床 呻吟 sex erotic nude nsfw boobs ass orgasm bitch bdsm ecchi yuri"),
    ("色情","mild","性感 暧昧 情欲 欲望 缠绵 香艳 诱惑 亲吻 抚摸 拥抱 内衣 热吻 湿吻 panty lingerie stripper fetish kinky"),
    ("赌博","severe","赌博 赌场 赌钱 赌注 网赌 百家乐 老虎机 赌球 赌马 六合彩 博彩 押注 下注 在线赌博 真人赌场 时时彩 赌盘 赌徒 庄家 赔率 赌城 开赌 聚赌 赌资 casino gambling slot sportsbook bookmaker wagering bet365"),
    ("赌博","moderate","德州扑克 赌神 出千 荷官 筹码 抽水 麻将 推牌九 baccarat roulette jackpot poker blackjack"),
    ("毒品","severe","毒品 吸毒 贩毒 制毒 海洛因 冰毒 摇头丸 K粉 大麻 可卡因 鸦片 吗啡 杜冷丁 美沙酮 氯胺酮 麻古 麻果 止咳水 开心水 神仙水 笑气 迷幻药 致幻剂 LSD MDMA 罂粟 heroin cocaine meth ecstasy opium marijuana"),
    ("毒品","moderate","上头 飞叶子 嗑药 溜冰 weed cannabis hashish"),
    ("暴力","severe","杀人 谋杀 碎尸 肢解 斩首 分尸 虐杀 屠杀 灭门 割喉 剖腹 挖心 剥皮 斩手 剁脚 炮烙 凌迟 腰斩 车裂 活埋 投毒 纵火 爆炸 torture dismember behead massacre genocide"),
    ("暴力","moderate","打架 斗殴 砍人 捅人 群殴 械斗 黑社会 黑帮 枪战 火拼 刺杀 暗杀 围殴"),
    ("暴力","mild","血腥 残忍 酷刑 暴力 暴虐"),
    ("广告","severe","加微信 加QQ 微信联系 QQ群 二维码 扫码 招商加盟 代理招募 兼职刷单 赌博代理 广告位 联系方式"),
    ("广告","moderate","推广 引流 加群 关注公众号 淘宝链接 拼多多 优惠券"),
    ("广告","mild","广告 赞助 商务 合作 推广位"),
]

words = []
for cat, sev, ws in fw_data:
    for w in ws.split():
        w = w.strip()
        if w:
            words.append({"w": w, "c": cat, "s": sev})

with open(os.path.join(BASE, "data", "forbidden-words.json"), "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False)
print(f"Generated forbidden-words.json: {len(words)} words")

# 生成 review.js（嵌入词库，避免fetch CORS问题）
fw_json = json.dumps(words, ensure_ascii=False)
review_js = f'''/**
 * FictionVerse 自动审核引擎
 * 违禁词检测（严）| 内容质量（严）| AI检测（松）
 */
(function(){{
'use strict';

// ═══ Auth ═══
var PWD='fiction2026';
if(sessionStorage.getItem('fva')==='1'){{
  var lg=document.getElementById('lg');if(lg)lg.style.display='none';
}}
window.doLogin=function(){{
  if(document.getElementById('lp').value===PWD){{
    sessionStorage.setItem('fva','1');
    document.getElementById('lg').style.display='none';
  }}else{{alert('密码错误');}}
}};
window.logout=function(){{
  sessionStorage.removeItem('fva');location.href='admin.html';
}};

// ═══ 违禁词库（嵌入式，无需fetch） ═══
var FW={fw_json};

// ═══ 主审核 ═══
window.runReview=function(){{
  var t=document.getElementById('rx').value.trim();
  if(!t){{alert('请粘贴章节内容');return;}}
  document.getElementById('rs').innerHTML='<span style="color:var(--accent)">审核中...</span>';
  setTimeout(function(){{doReview(t);}},100);
}};

function doReview(t){{
  var r1=checkFW(t), r2=checkQ(t), r3=checkAI(t);
  render(t,r1,r2,r3);
  addHistory(t,r1,r2,r3);
}}

// ═══ Module 1: 违禁词检测 ═══
function checkFW(t){{
  var lo=t.toLowerCase(), hits=[], seen={{}};
  FW.forEach(function(f){{
    var i=lo.indexOf(f.w.toLowerCase());
    if(i>=0){{
      var st=Math.max(0,i-40), ed=Math.min(t.length,i+f.w.length+40);
      var ctx=t.substring(st,ed).replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var k=f.w+'|'+Math.floor(i/50);
      if(!seen[k]){{seen[k]=true;hits.push({{w:f.w,c:f.c,s:f.s,ctx:ctx}});}}
    }}
  }});
  var sv=hits.filter(function(h){{return h.s==='severe';}});
  var md=hits.filter(function(h){{return h.s==='moderate';}});
  var ml=hits.filter(function(h){{return h.s==='mild';}});
  return {{hits:hits,severe:sv,moderate:md,mild:ml,total:hits.length,
    pass:sv.length===0, passL:sv.length===0&&md.length===0}};
}}

// ═══ Module 2: 内容质量检测 ═══
function checkQ(t){{
  var chars=t.replace(/\\s/g,'').length;
  var paras=t.split(/\\n\\s*\\n/).filter(function(p){{return p.trim();}});
  if(paras.length===0)paras=[''];
  var sents=t.split(/[。！？.!?\\n]+/).filter(function(s){{return s.trim().length>5;}});

  var tooShort=chars<300;
  var shortParas=paras.filter(function(p){{return p.replace(/\\s/g,'').length<50;}}).length;
  var tooManyShort=shortParas>paras.length*0.5;
  var repR=calcRep(t);
  var puncts=(t.match(/[，。！？、；：""''.,!?;:'"]/g)||[]).length;
  var punctD=chars>0?puncts/chars:0;
  var longParas=paras.filter(function(p){{return p.replace(/\\s/g,'').length>500;}}).length;
  var avgPL=chars/(paras.length||1);

  var issues=[];
  if(tooShort)issues.push({{t:'字数不足',d:'正文不足300字，疑似水文灌水',s:'fail'}});
  if(repR>0.3)issues.push({{t:'重复率过高',d:'重复率'+Math.round(repR*100)+'%，超过30%阈值',s:'fail'}});
  else if(repR>0.2)issues.push({{t:'重复率偏高',d:'重复率'+Math.round(repR*100)+'%，接近阈值',s:'warn'}});
  if(tooManyShort)issues.push({{t:'短段落过多',d:Math.round(shortParas/paras.length*100)+'%段落不足50字，疑似AI灌水',s:'fail'}});
  if(punctD<0.03)issues.push({{t:'标点密度低',d:'标点占比'+(punctD*100).toFixed(1)+'%，句子结构可能混乱',s:'warn'}});
  if(longParas>paras.length*0.3)issues.push({{t:'超长段落',d:Math.round(longParas/paras.length*100)+'%段落超500字，阅读体验差',s:'warn'}});

  var fails=issues.filter(function(i){{return i.s==='fail';}}).length;
  var warns=issues.filter(function(i){{return i.s==='warn';}}).length;
  var score=Math.max(0,100-fails*25-warns*10);
  return {{issues:issues,score:score,fails:fails,warns:warns,
    chars:chars,paras:paras.length,sents:sents.length,
    repR:repR,punctD:punctD,avgPL:avgPL}};
}}

function calcRep(t){{
  var s=t.split(/[。！？.!?\\n]+/).filter(function(s){{return s.trim().length>10;}});
  if(s.length<5)return 0;
  var ngrams={{}},dup=0;
  for(var i=0;i<s.length;i++){{
    var key=s[i].trim().substring(0,30);
    if(ngrams[key])dup++;else ngrams[key]=true;
  }}
  return dup/s.length;
}}

// ═══ Module 3: AI检测（宽松） ═══
function checkAI(t){{
  var issues=[];
  var sents=t.split(/[。！？.!?\\n]+/).filter(function(s){{return s.trim().length>3;}});

  if(sents.length>8){{
    var lens=sents.map(function(s){{return s.length;}});
    var sum=0;lens.forEach(function(l){{sum+=l;}});
    var avg=sum/lens.length;
    var vari=0;lens.forEach(function(l){{vari+=Math.pow(l-avg,2);}});
    vari/=lens.length;
    var cv=Math.sqrt(vari)/avg;
    if(cv<0.25)issues.push({{t:'句子过于均匀',d:'变异系数仅'+Math.round(cv*100)+'%，AI写作典型特征',s:'warn'}});
    else if(cv<0.35)issues.push({{t:'句子偏均匀',d:'变异系数'+Math.round(cv*100)+'%，有AI写作痕迹',s:'mild'}});
  }}

  var patterns=[
    {{re:/总的来说[,，]/g,lab:'AI总结句式'}},
    {{re:/综上所述/g,lab:'AI总结句式'}},
    {{re:/值得注意的是/g,lab:'AI常用过渡'}},
    {{re:/不仅如此/g,lab:'AI递进句式'}},
    {{re:/从某种意义[上而]说/g,lab:'AI分析句式'}},
    {{re:/不可否认/g,lab:'AI让步句式'}},
  ];
  patterns.forEach(function(p){{
    var m=t.match(p.re);
    if(m&&m.length>=2)issues.push({{t:p.lab,d:'出现'+m.length+'次，AI写作常见标志',s:'mild'}});
  }});

  var warns=issues.filter(function(i){{return i.s==='warn';}}).length;
  var milds=issues.filter(function(i){{return i.s==='mild';}}).length;
  var aiScore=Math.max(0,100-warns*15-milds*5);
  return {{issues:issues,aiScore:aiScore,warns:warns,milds:milds}};
}}

// ═══ 结果渲染 ═══
function render(t,r1,r2,r3){{
  document.getElementById('result').classList.remove('hidden');

  var pass=r1.pass&&r2.fails===0;
  var passL=r1.passL&&r2.fails===0;
  var verdict,cls,icon;
  if(pass){{verdict='审核通过';cls='pass';icon='✅';}}
  else if(passL){{verdict='有条件通过';cls='warn';icon='⚠️';}}
  else{{verdict='审核不通过';cls='fail';icon='🚫';}}
  document.getElementById('bn').innerHTML='<div class="bn '+cls+'"><span class="bi">'+icon+'</span><span>'+verdict+' — '+(pass?'内容符合规范，可发布':'请根据下方问题修改后重新提交')+'</span></div>';

  document.getElementById('st').innerHTML=
    '<div class="sb"><div class="sv">'+t.replace(/\\s/g,'').length+'</div><div class="sl">总字符数</div></div>'+
    '<div class="sb"><div class="sv">'+r2.paras+'</div><div class="sl">段落数</div></div>'+
    '<div class="sb"><div class="sv" style="color:var(--red)">'+r1.total+'</div><div class="sl">违禁词命中</div></div>'+
    '<div class="sb"><div class="sv">'+r2.score+'分</div><div class="sl">质量评分</div></div>'+
    '<div class="sb"><div class="sv">'+r3.aiScore+'分</div><div class="sl">人工度</div></div>';

  var ft='';
  if(r1.severe.length)ft+='<span class="tag r">'+r1.severe.length+' 严重</span>';
  if(r1.moderate.length)ft+='<span class="tag o">'+r1.moderate.length+' 中度</span>';
  if(r1.mild.length)ft+='<span class="tag b">'+r1.mild.length+' 轻度</span>';
  if(!r1.total)ft='<span class="tag g">✅ 未命中</span>';
  document.getElementById('fwTags').innerHTML=ft;

  var fh='';
  r1.hits.forEach(function(h){{
    var cl=h.s==='severe'?'fail':(h.s==='moderate'?'warn':'info');
    var cc=h.s==='severe'?'r':(h.s==='moderate'?'o':'b');
    var word=h.w.replace(/[.*+?^${{}}()|[\\]\\\\]/g,'\\\\$&');
    var highlighted=h.ctx.replace(new RegExp(word,'gi'),'<span class="hl">$&</span>');
    fh+='<div class="vi '+cl+'"><span class="vc '+cc+'">'+h.c+'</span><span class="vd">'+highlighted+'</span></div>';
  }});
  if(!fh)fh='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 未命中任何违禁词</div>';
  document.getElementById('fwList').innerHTML=fh;

  var qt='';
  if(r2.fails)qt+='<span class="tag r">'+r2.fails+' 问题</span>';
  if(r2.warns)qt+='<span class="tag o">'+r2.warns+' 警告</span>';
  if(!r2.fails&&!r2.warns)qt='<span class="tag g">✅ 合格</span>';
  document.getElementById('qTags').innerHTML=qt;

  document.getElementById('qMetrics').innerHTML=
    '<div class="qi"><div class="qv '+(r2.score>=80?'g':(r2.score>=60?'w':'bad'))+'">'+r2.score+'</div><div class="ql">综合评分</div></div>'+
    '<div class="qi"><div class="qv '+(r2.repR<0.15?'g':(r2.repR<0.3?'w':'bad'))+'">'+Math.round(r2.repR*100)+'%</div><div class="ql">重复率</div></div>'+
    '<div class="qi"><div class="qv '+(r2.punctD>=0.04?'g':(r2.punctD>=0.03?'w':'bad'))+'">'+(r2.punctD*100).toFixed(1)+'%</div><div class="ql">标点密度</div></div>'+
    '<div class="qi"><div class="qv" style="color:var(--text)">'+Math.round(r2.avgPL)+'</div><div class="ql">均段字数</div></div>';

  var qh='';
  r2.issues.forEach(function(i){{
    var cl=i.s==='fail'?'fail':(i.s==='warn'?'warn':'info');
    var cc=i.s==='fail'?'r':(i.s==='warn'?'o':'b');
    qh+='<div class="vi '+cl+'"><span class="vc '+cc+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
  }});
  if(!qh)qh='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 内容质量良好</div>';
  document.getElementById('qList').innerHTML=qh;

  var at='';
  if(r3.warns)at+='<span class="tag o">'+r3.warns+' 疑似AI</span>';
  if(r3.milds)at+='<span class="tag b">'+r3.milds+' 轻微</span>';
  if(!r3.warns&&!r3.milds)at='<span class="tag g">✅ 无明显AI痕迹</span>';
  at+=' <span class="tag p">宽松模式</span>';
  document.getElementById('aiTags').innerHTML=at;

  var ah='';
  r3.issues.forEach(function(i){{
    ah+='<div class="vi '+(i.s==='warn'?'warn':'info')+'"><span class="vc '+(i.s==='warn'?'o':'b')+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
  }});
  if(!ah)ah='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 未检测到明显AI生成痕迹</div>';
  document.getElementById('aiList').innerHTML=ah;

  document.getElementById('rs').innerHTML='<span style="color:var(--green)">审核完成</span>';
  document.getElementById('result').scrollIntoView({{behavior:'smooth'}});
}}

// ═══ 审核历史 ═══
var history=[];
function addHistory(t,r1,r2,r3){{
  var pass=r1.pass&&r2.fails===0;
  var title=document.getElementById('rt').value||'未命名';
  var ch=document.getElementById('rc').value||'';
  history.push({{time:new Date().toLocaleTimeString(),title:title,ch:ch,pass:pass,severe:r1.severe.length,score:r2.score}});
  var h='';
  history.forEach(function(item){{
    var dot=item.pass?'var(--green)':'var(--red)';
    var tag=item.pass?'<span style="font-size:.6rem;padding:2px 6px;border-radius:8px;background:rgba(52,199,89,.15);color:var(--green)">通过</span>':
      '<span style="font-size:.6rem;padding:2px 6px;border-radius:8px;background:rgba(255,71,87,.15);color:var(--red)">不通过</span>';
    h+='<div class="bh-item"><div class="bh-dot" style="background:'+dot+'"></div>'+
      '<span style="color:var(--dim);min-width:55px">'+item.time+'</span>'+
      '<span style="flex:1;color:#fff">'+item.title+(item.ch?' · '+item.ch:'')+'</span>'+tag+
      '<span style="font-size:.6rem;color:var(--dim)">违规'+item.severe+' | '+item.score+'分</span></div>';
  }});
  document.getElementById('batchHistory').innerHTML=h||'暂无记录';
}}

window.clearReview=function(){{
  document.getElementById('rx').value='';
  document.getElementById('rt').value='';
  document.getElementById('rc').value='';
  document.getElementById('ra').value='';
  document.getElementById('result').classList.add('hidden');
  document.getElementById('rs').innerHTML='';
}};

}})();'''

with open(os.path.join(BASE, "review.js"), "w", encoding="utf-8") as f:
    f.write(review_js)
print(f"Generated review.js with embedded {len(words)} forbidden words")

# review.html - 精简自包含
html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>FictionVerse 自动审核</title>
<style>
:root{--bg:#0a0b10;--card:#11131f;--text:#d8dae0;--dim:#8b8fa0;--a:#4f8cff;--g:#34c759;--r:#ff4757;--o:#ff9500;--p:#af52de}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--text);background:var(--bg);line-height:1.6;min-height:100vh}
.ct{max-width:1100px;margin:0 auto;padding:24px}
.hd{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:var(--card);margin-bottom:24px;border-radius:0 0 10px 10px}
.hd h1{font-size:1.1rem;color:#fff}.badge{font-size:.65rem;padding:3px 8px;border-radius:10px;background:var(--a);color:#fff}
.btn{padding:8px 18px;border-radius:6px;border:none;font-size:.82rem;cursor:pointer;font-weight:600;font-family:inherit}
.b1{background:var(--a);color:#fff}.b1:hover{opacity:.85}.b2{background:var(--g);color:#0a0b10}.b3{background:var(--r);color:#fff}.b4{background:transparent;border:1px solid rgba(255,255,255,.15);color:var(--dim)}
.bs{padding:5px 12px;font-size:.72rem}.bl{padding:12px 28px;font-size:.9rem}
.card{background:var(--card);border:1px solid rgba(255,255,255,.05);border-radius:10px;padding:20px;margin-bottom:16px}
.card h3{font-size:.9rem;color:#fff;margin-bottom:12px}
textarea{width:100%;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;font-size:.85rem;font-family:inherit;resize:vertical;line-height:1.7}
textarea:focus{outline:none;border-color:var(--a)}textarea::placeholder{color:rgba(255,255,255,.2)}
.frow{display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap}
.fg{flex:1;min-width:150px}.fg label{display:block;font-size:.72rem;color:var(--dim);margin-bottom:4px}
.fg input{width:100%;padding:8px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:.82rem;font-family:inherit}
.tag{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:.75rem;font-weight:700;margin-right:8px}
.tag.g{background:rgba(52,199,89,.12);color:var(--g)}.tag.r{background:rgba(255,71,87,.12);color:var(--r)}
.tag.o{background:rgba(255,149,0,.12);color:var(--o)}.tag.b{background:rgba(79,140,255,.1);color:var(--a)}.tag.p{background:rgba(175,82,222,.1);color:var(--p)}
.vi{display:flex;gap:10px;padding:8px 12px;margin:0 0 4px 0;border-radius:0 6px 6px 0;font-size:.78rem}
.vi.fail{background:rgba(255,71,87,.06);border-left:3px solid var(--r)}
.vi.warn{background:rgba(255,149,0,.06);border-left:3px solid var(--o)}
.vi.info{background:rgba(79,140,255,.04);border-left:3px solid var(--a)}
.vc{font-weight:700;min-width:50px;font-size:.7rem}.vc.r{color:var(--r)}.vc.o{color:var(--o)}.vc.b{color:var(--a)}
.vd{flex:1;color:var(--dim)}.vd strong{color:#fff}.hl{background:rgba(255,71,87,.2);padding:1px 4px;border-radius:3px;color:#ff6b7a}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
.qi{background:rgba(255,255,255,.02);border-radius:8px;padding:14px;text-align:center}
.qv{font-size:1.6rem;font-weight:800}.qv.g{color:var(--g)}.qv.w{color:var(--o)}.qv.bad{color:var(--r)}
.ql{font-size:.65rem;color:var(--dim);margin-top:4px}
.bn{padding:16px 20px;border-radius:10px;margin:16px 0;font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:12px}
.bn.pass{background:rgba(52,199,89,.08);border:1px solid rgba(52,199,89,.2);color:var(--g)}
.bn.fail{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.2);color:var(--r)}
.bn.warn{background:rgba(255,149,0,.08);border:1px solid rgba(255,149,0,.2);color:var(--o)}
.bn .bi{font-size:2rem}
.lo{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:999}
.lb{background:var(--card);padding:32px;border-radius:12px;text-align:center;width:340px}
.lb input{width:100%;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#fff;text-align:center;font-size:1rem;margin:16px 0}
.hidden{display:none!important}.mt12{margin-top:12px}.mb12{margin-bottom:12px}
.sr{display:flex;gap:24px;margin-top:12px;flex-wrap:wrap}.sb{text-align:center;min-width:80px}
.sb .sv{font-size:1.3rem;font-weight:700;color:#fff}.sb .sl{font-size:.62rem;color:var(--dim)}
.bh-item{display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:3px;border-radius:6px;background:rgba(255,255,255,.02);font-size:.72rem}
.bh-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
</style>
</head>
<body>

<div class="lo" id="lg"><div class="lb">
<h2 style="color:#fff;margin-bottom:4px">自动审核</h2>
<p style="color:var(--dim);font-size:.82rem">输入管理密码</p>
<input type="password" id="lp" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()">
<button class="btn b1" onclick="doLogin()" style="width:100%">登入</button>
</div></div>

<div class="hd"><h1>自动审核 <span class="badge">Auto Review</span></h1>
<div style="display:flex;gap:8px"><a href="admin.html" class="btn b4 bs">管理后台</a><button class="btn b4 bs" onclick="logout()">退出</button></div>
</div>

<div class="ct">
<div class="card"><h3>提交审核</h3>
<div class="frow"><div class="fg"><label>书名</label><input id="rt" placeholder="小说名称"></div>
<div class="fg"><label>章节</label><input id="rc" placeholder="如: 第3章"></div>
<div class="fg"><label>作者</label><input id="ra" placeholder="作者名"></div></div>
<div class="fg mb12"><label>章节内容 (直接粘贴全文)</label>
<textarea id="rx" rows="12" placeholder="在此粘贴需要审核的章节全文...

系统自动检测：违禁词 | 内容质量 | AI生成痕迹"></textarea>
</div>
<div style="display:flex;gap:12px"><button class="btn b1 bl" onclick="runReview()">开始审核</button>
<button class="btn b4" onclick="clearReview()">清空</button>
<span id="rs" style="font-size:.75rem;color:var(--dim)"></span></div></div>

<div id="result" class="hidden">
<div id="bn"></div>
<div class="card"><h3>内容统计</h3><div class="sr" id="st"></div></div>
<div class="card"><h3>违禁词检测 — 黄赌毒暴力 · 广告 · 严格</h3>
<div class="mt12" id="fwTags"></div><div id="fwList"></div></div>
<div class="card"><h3>内容质量 — 低质量水文 · 严格</h3>
<div class="mt12" id="qTags"></div><div class="grid3" id="qMetrics"></div><div id="qList"></div></div>
<div class="card"><h3>AI检测 — 宽松模式 · 仅供参考</h3>
<div class="mt12" id="aiTags"></div><div id="aiList"></div></div>
</div>

<div class="card"><h3>审核历史</h3>
<p style="font-size:.72rem;color:var(--dim);margin-bottom:8px">本次会话记录</p>
<div id="batchHistory" style="font-size:.75rem;color:var(--dim)">暂无记录</div></div>
</div>

<script src="review.js"></script>
</body></html>'''

with open(os.path.join(BASE, "review.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("Generated review.html")

print("Done!")