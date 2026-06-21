/**
 * FictionVerse 自动审核引擎
 * 违禁词检测（严）| 内容质量（严）| AI检测（松）
 * 注：登录逻辑已移至 review.html 内联脚本
 */
(function(){
'use strict';

// ═══ 违禁词库（嵌入式，无需fetch） ═══
var FW=[{"w": "做爱", "c": "色情", "s": "severe"}, {"w": "性交", "c": "色情", "s": "severe"}, {"w": "口交", "c": "色情", "s": "severe"}, {"w": "肛交", "c": "色情", "s": "severe"}, {"w": "操逼", "c": "色情", "s": "severe"}, {"w": "肏", "c": "色情", "s": "severe"}, {"w": "婊子", "c": "色情", "s": "severe"}, {"w": "骚货", "c": "色情", "s": "severe"}, {"w": "淫荡", "c": "色情", "s": "severe"}, {"w": "淫秽", "c": "色情", "s": "severe"}, {"w": "黄片", "c": "色情", "s": "severe"}, {"w": "A片", "c": "色情", "s": "severe"}, {"w": "三级片", "c": "色情", "s": "severe"}, {"w": "毛片", "c": "色情", "s": "severe"}, {"w": "裸照", "c": "色情", "s": "severe"}, {"w": "脱衣", "c": "色情", "s": "severe"}, {"w": "约炮", "c": "色情", "s": "severe"}, {"w": "一夜情", "c": "色情", "s": "severe"}, {"w": "性奴", "c": "色情", "s": "severe"}, {"w": "偷拍", "c": "色情", "s": "severe"}, {"w": "艳照", "c": "色情", "s": "severe"}, {"w": "肉文", "c": "色情", "s": "severe"}, {"w": "H文", "c": "色情", "s": "severe"}, {"w": "R18", "c": "色情", "s": "severe"}, {"w": "春药", "c": "色情", "s": "severe"}, {"w": "催情", "c": "色情", "s": "severe"}, {"w": "迷药", "c": "色情", "s": "severe"}, {"w": "乱伦", "c": "色情", "s": "severe"}, {"w": "嫖娼", "c": "色情", "s": "severe"}, {"w": "卖淫", "c": "色情", "s": "severe"}, {"w": "妓女", "c": "色情", "s": "severe"}, {"w": "嫖客", "c": "色情", "s": "severe"}, {"w": "射精", "c": "色情", "s": "severe"}, {"w": "潮吹", "c": "色情", "s": "severe"}, {"w": "强奸", "c": "色情", "s": "severe"}, {"w": "轮奸", "c": "色情", "s": "severe"}, {"w": "迷奸", "c": "色情", "s": "severe"}, {"w": "性虐待", "c": "色情", "s": "severe"}, {"w": "里番", "c": "色情", "s": "severe"}, {"w": "fuck", "c": "色情", "s": "severe"}, {"w": "porn", "c": "色情", "s": "severe"}, {"w": "hentai", "c": "色情", "s": "severe"}, {"w": "xxx", "c": "色情", "s": "severe"}, {"w": "cum", "c": "色情", "s": "severe"}, {"w": "dick", "c": "色情", "s": "severe"}, {"w": "pussy", "c": "色情", "s": "severe"}, {"w": "cock", "c": "色情", "s": "severe"}, {"w": "tits", "c": "色情", "s": "severe"}, {"w": "anal", "c": "色情", "s": "severe"}, {"w": "blowjob", "c": "色情", "s": "severe"}, {"w": "masturbat", "c": "色情", "s": "severe"}, {"w": "ejaculat", "c": "色情", "s": "severe"}, {"w": "penis", "c": "色情", "s": "severe"}, {"w": "vagina", "c": "色情", "s": "severe"}, {"w": "clitoris", "c": "色情", "s": "severe"}, {"w": "incest", "c": "色情", "s": "severe"}, {"w": "rape", "c": "色情", "s": "severe"}, {"w": "prostitut", "c": "色情", "s": "severe"}, {"w": "escort", "c": "色情", "s": "severe"}, {"w": "slut", "c": "色情", "s": "severe"}, {"w": "whore", "c": "色情", "s": "severe"}, {"w": "milf", "c": "色情", "s": "severe"}, {"w": "squirting", "c": "色情", "s": "severe"}, {"w": "gangbang", "c": "色情", "s": "severe"}, {"w": "threesome", "c": "色情", "s": "severe"}, {"w": "orgy", "c": "色情", "s": "severe"}, {"w": "bukkake", "c": "色情", "s": "severe"}, {"w": "futanari", "c": "色情", "s": "severe"}, {"w": "色情", "c": "色情", "s": "moderate"}, {"w": "AV", "c": "色情", "s": "moderate"}, {"w": "裸体", "c": "色情", "s": "moderate"}, {"w": "裸露", "c": "色情", "s": "moderate"}, {"w": "乳房", "c": "色情", "s": "moderate"}, {"w": "生殖器", "c": "色情", "s": "moderate"}, {"w": "自慰", "c": "色情", "s": "moderate"}, {"w": "手淫", "c": "色情", "s": "moderate"}, {"w": "高潮", "c": "色情", "s": "moderate"}, {"w": "SM", "c": "色情", "s": "moderate"}, {"w": "露出", "c": "色情", "s": "moderate"}, {"w": "床戏", "c": "色情", "s": "moderate"}, {"w": "激情戏", "c": "色情", "s": "moderate"}, {"w": "本子", "c": "色情", "s": "moderate"}, {"w": "擦边", "c": "色情", "s": "moderate"}, {"w": "挑逗", "c": "色情", "s": "moderate"}, {"w": "勾引", "c": "色情", "s": "moderate"}, {"w": "叫床", "c": "色情", "s": "moderate"}, {"w": "呻吟", "c": "色情", "s": "moderate"}, {"w": "sex", "c": "色情", "s": "moderate"}, {"w": "erotic", "c": "色情", "s": "moderate"}, {"w": "nude", "c": "色情", "s": "moderate"}, {"w": "nsfw", "c": "色情", "s": "moderate"}, {"w": "boobs", "c": "色情", "s": "moderate"}, {"w": "ass", "c": "色情", "s": "moderate"}, {"w": "orgasm", "c": "色情", "s": "moderate"}, {"w": "bitch", "c": "色情", "s": "moderate"}, {"w": "bdsm", "c": "色情", "s": "moderate"}, {"w": "ecchi", "c": "色情", "s": "moderate"}, {"w": "yuri", "c": "色情", "s": "moderate"}, {"w": "性感", "c": "色情", "s": "mild"}, {"w": "暧昧", "c": "色情", "s": "mild"}, {"w": "情欲", "c": "色情", "s": "mild"}, {"w": "欲望", "c": "色情", "s": "mild"}, {"w": "缠绵", "c": "色情", "s": "mild"}, {"w": "香艳", "c": "色情", "s": "mild"}, {"w": "诱惑", "c": "色情", "s": "mild"}, {"w": "亲吻", "c": "色情", "s": "mild"}, {"w": "抚摸", "c": "色情", "s": "mild"}, {"w": "拥抱", "c": "色情", "s": "mild"}, {"w": "内衣", "c": "色情", "s": "mild"}, {"w": "热吻", "c": "色情", "s": "mild"}, {"w": "湿吻", "c": "色情", "s": "mild"}, {"w": "panty", "c": "色情", "s": "mild"}, {"w": "lingerie", "c": "色情", "s": "mild"}, {"w": "stripper", "c": "色情", "s": "mild"}, {"w": "fetish", "c": "色情", "s": "mild"}, {"w": "kinky", "c": "色情", "s": "mild"}, {"w": "赌博", "c": "赌博", "s": "severe"}, {"w": "赌场", "c": "赌博", "s": "severe"}, {"w": "赌钱", "c": "赌博", "s": "severe"}, {"w": "赌注", "c": "赌博", "s": "severe"}, {"w": "网赌", "c": "赌博", "s": "severe"}, {"w": "百家乐", "c": "赌博", "s": "severe"}, {"w": "老虎机", "c": "赌博", "s": "severe"}, {"w": "赌球", "c": "赌博", "s": "severe"}, {"w": "赌马", "c": "赌博", "s": "severe"}, {"w": "六合彩", "c": "赌博", "s": "severe"}, {"w": "博彩", "c": "赌博", "s": "severe"}, {"w": "押注", "c": "赌博", "s": "severe"}, {"w": "下注", "c": "赌博", "s": "severe"}, {"w": "在线赌博", "c": "赌博", "s": "severe"}, {"w": "真人赌场", "c": "赌博", "s": "severe"}, {"w": "时时彩", "c": "赌博", "s": "severe"}, {"w": "赌盘", "c": "赌博", "s": "severe"}, {"w": "赌徒", "c": "赌博", "s": "severe"}, {"w": "庄家", "c": "赌博", "s": "severe"}, {"w": "赔率", "c": "赌博", "s": "severe"}, {"w": "赌城", "c": "赌博", "s": "severe"}, {"w": "开赌", "c": "赌博", "s": "severe"}, {"w": "聚赌", "c": "赌博", "s": "severe"}, {"w": "赌资", "c": "赌博", "s": "severe"}, {"w": "casino", "c": "赌博", "s": "severe"}, {"w": "gambling", "c": "赌博", "s": "severe"}, {"w": "slot", "c": "赌博", "s": "severe"}, {"w": "sportsbook", "c": "赌博", "s": "severe"}, {"w": "bookmaker", "c": "赌博", "s": "severe"}, {"w": "wagering", "c": "赌博", "s": "severe"}, {"w": "bet365", "c": "赌博", "s": "severe"}, {"w": "德州扑克", "c": "赌博", "s": "moderate"}, {"w": "赌神", "c": "赌博", "s": "moderate"}, {"w": "出千", "c": "赌博", "s": "moderate"}, {"w": "荷官", "c": "赌博", "s": "moderate"}, {"w": "筹码", "c": "赌博", "s": "moderate"}, {"w": "抽水", "c": "赌博", "s": "moderate"}, {"w": "麻将", "c": "赌博", "s": "moderate"}, {"w": "推牌九", "c": "赌博", "s": "moderate"}, {"w": "baccarat", "c": "赌博", "s": "moderate"}, {"w": "roulette", "c": "赌博", "s": "moderate"}, {"w": "jackpot", "c": "赌博", "s": "moderate"}, {"w": "poker", "c": "赌博", "s": "moderate"}, {"w": "blackjack", "c": "赌博", "s": "moderate"}, {"w": "毒品", "c": "毒品", "s": "severe"}, {"w": "吸毒", "c": "毒品", "s": "severe"}, {"w": "贩毒", "c": "毒品", "s": "severe"}, {"w": "制毒", "c": "毒品", "s": "severe"}, {"w": "海洛因", "c": "毒品", "s": "severe"}, {"w": "冰毒", "c": "毒品", "s": "severe"}, {"w": "摇头丸", "c": "毒品", "s": "severe"}, {"w": "K粉", "c": "毒品", "s": "severe"}, {"w": "大麻", "c": "毒品", "s": "severe"}, {"w": "可卡因", "c": "毒品", "s": "severe"}, {"w": "鸦片", "c": "毒品", "s": "severe"}, {"w": "吗啡", "c": "毒品", "s": "severe"}, {"w": "杜冷丁", "c": "毒品", "s": "severe"}, {"w": "美沙酮", "c": "毒品", "s": "severe"}, {"w": "氯胺酮", "c": "毒品", "s": "severe"}, {"w": "麻古", "c": "毒品", "s": "severe"}, {"w": "麻果", "c": "毒品", "s": "severe"}, {"w": "止咳水", "c": "毒品", "s": "severe"}, {"w": "开心水", "c": "毒品", "s": "severe"}, {"w": "神仙水", "c": "毒品", "s": "severe"}, {"w": "笑气", "c": "毒品", "s": "severe"}, {"w": "迷幻药", "c": "毒品", "s": "severe"}, {"w": "致幻剂", "c": "毒品", "s": "severe"}, {"w": "LSD", "c": "毒品", "s": "severe"}, {"w": "MDMA", "c": "毒品", "s": "severe"}, {"w": "罂粟", "c": "毒品", "s": "severe"}, {"w": "heroin", "c": "毒品", "s": "severe"}, {"w": "cocaine", "c": "毒品", "s": "severe"}, {"w": "meth", "c": "毒品", "s": "severe"}, {"w": "ecstasy", "c": "毒品", "s": "severe"}, {"w": "opium", "c": "毒品", "s": "severe"}, {"w": "marijuana", "c": "毒品", "s": "severe"}, {"w": "上头", "c": "毒品", "s": "moderate"}, {"w": "飞叶子", "c": "毒品", "s": "moderate"}, {"w": "嗑药", "c": "毒品", "s": "moderate"}, {"w": "溜冰", "c": "毒品", "s": "moderate"}, {"w": "weed", "c": "毒品", "s": "moderate"}, {"w": "cannabis", "c": "毒品", "s": "moderate"}, {"w": "hashish", "c": "毒品", "s": "moderate"}, {"w": "杀人", "c": "暴力", "s": "severe"}, {"w": "谋杀", "c": "暴力", "s": "severe"}, {"w": "碎尸", "c": "暴力", "s": "severe"}, {"w": "肢解", "c": "暴力", "s": "severe"}, {"w": "斩首", "c": "暴力", "s": "severe"}, {"w": "分尸", "c": "暴力", "s": "severe"}, {"w": "虐杀", "c": "暴力", "s": "severe"}, {"w": "屠杀", "c": "暴力", "s": "severe"}, {"w": "灭门", "c": "暴力", "s": "severe"}, {"w": "割喉", "c": "暴力", "s": "severe"}, {"w": "剖腹", "c": "暴力", "s": "severe"}, {"w": "挖心", "c": "暴力", "s": "severe"}, {"w": "剥皮", "c": "暴力", "s": "severe"}, {"w": "斩手", "c": "暴力", "s": "severe"}, {"w": "剁脚", "c": "暴力", "s": "severe"}, {"w": "炮烙", "c": "暴力", "s": "severe"}, {"w": "凌迟", "c": "暴力", "s": "severe"}, {"w": "腰斩", "c": "暴力", "s": "severe"}, {"w": "车裂", "c": "暴力", "s": "severe"}, {"w": "活埋", "c": "暴力", "s": "severe"}, {"w": "投毒", "c": "暴力", "s": "severe"}, {"w": "纵火", "c": "暴力", "s": "severe"}, {"w": "爆炸", "c": "暴力", "s": "severe"}, {"w": "torture", "c": "暴力", "s": "severe"}, {"w": "dismember", "c": "暴力", "s": "severe"}, {"w": "behead", "c": "暴力", "s": "severe"}, {"w": "massacre", "c": "暴力", "s": "severe"}, {"w": "genocide", "c": "暴力", "s": "severe"}, {"w": "打架", "c": "暴力", "s": "moderate"}, {"w": "斗殴", "c": "暴力", "s": "moderate"}, {"w": "砍人", "c": "暴力", "s": "moderate"}, {"w": "捅人", "c": "暴力", "s": "moderate"}, {"w": "群殴", "c": "暴力", "s": "moderate"}, {"w": "械斗", "c": "暴力", "s": "moderate"}, {"w": "黑社会", "c": "暴力", "s": "moderate"}, {"w": "黑帮", "c": "暴力", "s": "moderate"}, {"w": "枪战", "c": "暴力", "s": "moderate"}, {"w": "火拼", "c": "暴力", "s": "moderate"}, {"w": "刺杀", "c": "暴力", "s": "moderate"}, {"w": "暗杀", "c": "暴力", "s": "moderate"}, {"w": "围殴", "c": "暴力", "s": "moderate"}, {"w": "血腥", "c": "暴力", "s": "mild"}, {"w": "残忍", "c": "暴力", "s": "mild"}, {"w": "酷刑", "c": "暴力", "s": "mild"}, {"w": "暴力", "c": "暴力", "s": "mild"}, {"w": "暴虐", "c": "暴力", "s": "mild"}, {"w": "加微信", "c": "广告", "s": "severe"}, {"w": "加QQ", "c": "广告", "s": "severe"}, {"w": "微信联系", "c": "广告", "s": "severe"}, {"w": "QQ群", "c": "广告", "s": "severe"}, {"w": "二维码", "c": "广告", "s": "severe"}, {"w": "扫码", "c": "广告", "s": "severe"}, {"w": "招商加盟", "c": "广告", "s": "severe"}, {"w": "代理招募", "c": "广告", "s": "severe"}, {"w": "兼职刷单", "c": "广告", "s": "severe"}, {"w": "赌博代理", "c": "广告", "s": "severe"}, {"w": "广告位", "c": "广告", "s": "severe"}, {"w": "联系方式", "c": "广告", "s": "severe"}, {"w": "推广", "c": "广告", "s": "moderate"}, {"w": "引流", "c": "广告", "s": "moderate"}, {"w": "加群", "c": "广告", "s": "moderate"}, {"w": "关注公众号", "c": "广告", "s": "moderate"}, {"w": "淘宝链接", "c": "广告", "s": "moderate"}, {"w": "拼多多", "c": "广告", "s": "moderate"}, {"w": "优惠券", "c": "广告", "s": "moderate"}, {"w": "广告", "c": "广告", "s": "mild"}, {"w": "赞助", "c": "广告", "s": "mild"}, {"w": "商务", "c": "广告", "s": "mild"}, {"w": "合作", "c": "广告", "s": "mild"}, {"w": "推广位", "c": "广告", "s": "mild"}];

// ═══ 主审核 ═══
window.runReview=function(){
  var t=document.getElementById('rx').value.trim();
  if(!t){alert('请粘贴章节内容');return;}
  document.getElementById('rs').innerHTML='<span style="color:var(--accent)">审核中...</span>';
  setTimeout(function(){doReview(t);},100);
};

function doReview(t){
  var ref=document.getElementById('ref').value.trim();
  var r1=checkFW(t), r2=checkQ(t), r3=checkAI(t);
  var r4=ref?checkPlagiarism(t,ref):null;
  var r5=checkFormat(t);
  var r6=checkAds(t);
  render(t,r1,r2,r3,r4,r5,r6);
  addHistory(t,r1,r2,r3,r4,r6);
}

// ═══ Module 1: 违禁词检测 ═══
function checkFW(t){
  var lo=t.toLowerCase(), hits=[], seen={};
  FW.forEach(function(f){
    var i=lo.indexOf(f.w.toLowerCase());
    if(i>=0){
      var st=Math.max(0,i-40), ed=Math.min(t.length,i+f.w.length+40);
      var ctx=t.substring(st,ed).replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var k=f.w+'|'+Math.floor(i/50);
      if(!seen[k]){seen[k]=true;hits.push({w:f.w,c:f.c,s:f.s,ctx:ctx});}
    }
  });
  var sv=hits.filter(function(h){return h.s==='severe';});
  var md=hits.filter(function(h){return h.s==='moderate';});
  var ml=hits.filter(function(h){return h.s==='mild';});
  return {hits:hits,severe:sv,moderate:md,mild:ml,total:hits.length,
    pass:sv.length===0, passL:sv.length===0&&md.length===0};
}

// ═══ Module 2: 内容质量检测 ═══
function checkQ(t){
  var chars=t.replace(/\s/g,'').length;
  var paras=t.split(/\n\s*\n/).filter(function(p){return p.trim();});
  if(paras.length===0)paras=[''];
  var sents=t.split(/[。！？.!?\n]+/).filter(function(s){return s.trim().length>5;});

  var tooShort=chars<300;
  var shortParas=paras.filter(function(p){return p.replace(/\s/g,'').length<50;}).length;
  var tooManyShort=shortParas>paras.length*0.5;
  var repR=calcRep(t);
  var puncts=(t.match(/[，。！？、；：""''.,!?;:'"]/g)||[]).length;
  var punctD=chars>0?puncts/chars:0;
  var longParas=paras.filter(function(p){return p.replace(/\s/g,'').length>500;}).length;
  var avgPL=chars/(paras.length||1);

  var issues=[];
  if(tooShort)issues.push({t:'字数不足',d:'正文不足300字，疑似水文灌水',s:'fail'});
  if(repR>0.3)issues.push({t:'重复率过高',d:'重复率'+Math.round(repR*100)+'%，超过30%阈值',s:'fail'});
  else if(repR>0.2)issues.push({t:'重复率偏高',d:'重复率'+Math.round(repR*100)+'%，接近阈值',s:'warn'});
  if(tooManyShort)issues.push({t:'短段落过多',d:Math.round(shortParas/paras.length*100)+'%段落不足50字，疑似AI灌水',s:'fail'});
  if(punctD<0.03)issues.push({t:'标点密度低',d:'标点占比'+(punctD*100).toFixed(1)+'%，句子结构可能混乱',s:'warn'});
  if(longParas>paras.length*0.3)issues.push({t:'超长段落',d:Math.round(longParas/paras.length*100)+'%段落超500字，阅读体验差',s:'warn'});

  var fails=issues.filter(function(i){return i.s==='fail';}).length;
  var warns=issues.filter(function(i){return i.s==='warn';}).length;
  var score=Math.max(0,100-fails*25-warns*10);
  return {issues:issues,score:score,fails:fails,warns:warns,
    chars:chars,paras:paras.length,sents:sents.length,
    repR:repR,punctD:punctD,avgPL:avgPL};
}

function calcRep(t){
  var s=t.split(/[。！？.!?\n]+/).filter(function(s){return s.trim().length>10;});
  if(s.length<5)return 0;
  var ngrams={},dup=0;
  for(var i=0;i<s.length;i++){
    var key=s[i].trim().substring(0,30);
    if(ngrams[key])dup++;else ngrams[key]=true;
  }
  return dup/s.length;
}

// ═══ Module 3: AI检测（宽松） ═══
function checkAI(t){
  var issues=[];
  var sents=t.split(/[。！？.!?\n]+/).filter(function(s){return s.trim().length>3;});

  if(sents.length>8){
    var lens=sents.map(function(s){return s.length;});
    var sum=0;lens.forEach(function(l){sum+=l;});
    var avg=sum/lens.length;
    var vari=0;lens.forEach(function(l){vari+=Math.pow(l-avg,2);});
    vari/=lens.length;
    var cv=Math.sqrt(vari)/avg;
    if(cv<0.25)issues.push({t:'句子过于均匀',d:'变异系数仅'+Math.round(cv*100)+'%，AI写作典型特征',s:'warn'});
    else if(cv<0.35)issues.push({t:'句子偏均匀',d:'变异系数'+Math.round(cv*100)+'%，有AI写作痕迹',s:'mild'});
  }

  var patterns=[
    {re:/总的来说[,，]/g,lab:'AI总结句式'},
    {re:/综上所述/g,lab:'AI总结句式'},
    {re:/值得注意的是/g,lab:'AI常用过渡'},
    {re:/不仅如此/g,lab:'AI递进句式'},
    {re:/从某种意义[上而]说/g,lab:'AI分析句式'},
    {re:/不可否认/g,lab:'AI让步句式'},
  ];
  patterns.forEach(function(p){
    var m=t.match(p.re);
    if(m&&m.length>=2)issues.push({t:p.lab,d:'出现'+m.length+'次，AI写作常见标志',s:'mild'});
  });

  var warns=issues.filter(function(i){return i.s==='warn';}).length;
  var milds=issues.filter(function(i){return i.s==='mild';}).length;
  var aiScore=Math.max(0,100-warns*15-milds*5);
  return {issues:issues,aiScore:aiScore,warns:warns,milds:milds};
}

// ═══ Module 4: 抄袭检测 ═══
function checkPlagiarism(t,ref){
  // 分词：按句子切分
  function tokenize(s){
    return s.split(/[。！？.!?\n]+/).filter(function(x){return x.trim().length>8;}).map(function(x){return x.trim();});
  }
  var tSents=tokenize(t), rSents=tokenize(ref);
  if(tSents.length<3||rSents.length<3)return {sim:0,nDupe:0,nTotal:tSents.length,issues:[],pass:true};

  // 快速匹配：每句取前30字hash比对
  var rHashes={};
  rSents.forEach(function(s,i){rHashes[s.substring(0,30)]=i;});

  var dupes=[], tKeys={};
  tSents.forEach(function(s){
    var key=s.substring(0,30);
    if(rHashes.hasOwnProperty(key)&&!tKeys[key]){
      tKeys[key]=true;
      dupes.push(s);
    }
  });

  var sim=dupes.length/tSents.length;
  var issues=[];
  if(sim>0.5)issues.push({t:'高度相似',d:'与已有内容相似度'+(sim*100).toFixed(0)+'%，'+(dupes.length)+'/'+tSents.length+'句重复，疑为抄袭',s:'fail'});
  else if(sim>0.3)issues.push({t:'中度相似',d:'相似度'+(sim*100).toFixed(0)+'%，需人工复核',s:'warn'});
  else if(sim>0.1)issues.push({t:'低度相似',d:'相似度'+(sim*100).toFixed(0)+'%，在合理范围内',s:'mild'});

  return {sim:sim,nDupe:dupes.length,nTotal:tSents.length,issues:issues,pass:sim<0.3};
}

// ═══ Module 5: 格式规范检查 ═══
function checkFormat(t){
  var issues=[];
  var lines=t.split('\n').filter(function(l){return l.trim();});

  // 章节标题检查
  var chTitle=document.getElementById('rc').value||'';
  var hasChPattern=/第[一二三四五六七八九十百千0-9]+[章节回]/.test(t.substring(0,100));
  if(!hasChPattern&&chTitle)issues.push({t:'缺章节标题',d:'正文开头未检测到"第X章"格式标题',s:'warn'});

  // 段落首行缩进
  var paras=t.split(/\n\s*\n/).filter(function(p){return p.trim();});
  var indentParas=paras.filter(function(p){return /^[\s　]{2,}/.test(p);}).length;
  if(paras.length>3&&indentParas<paras.length*0.5)
    issues.push({t:'缺少首行缩进',d:'仅'+Math.round(indentParas/paras.length*100)+'%段落有首行缩进，建议全段落使用两个全角空格',s:'warn'});

  // 中文标点检查
  var enPuncts=(t.match(/[.,!?;](?![a-zA-Z0-9])/g)||[]).length;
  if(enPuncts>5)issues.push({t:'英文标点混用',d:'检测到'+enPuncts+'处英文标点，小说应统一使用中文标点',s:'warn'});

  // 全半角混用
  var mixedDigits=/[0-9０-９]/.test(t) && /[０-９]/.test(t) && /[0-9]/.test(t);
  if(mixedDigits)issues.push({t:'全半角数字混用',d:'文本中同时出现半角和全角数字，应统一',s:'mild'});

  // 分段频率
  if(paras.length>10){
    var avgPara=paras.map(function(p){return p.length;}).reduce(function(a,b){return a+b;},0)/paras.length;
    if(avgPara>800)issues.push({t:'段落过长',d:'平均每段'+Math.round(avgPara)+'字，移动端阅读体验差',s:'warn'});
  }

  // 章节长度异常
  var chars=t.replace(/\s/g,'').length;
  if(chars<500)issues.push({t:'章节过短',d:'仅'+chars+'字，正常小说章节建议2000-5000字',s:'fail'});
  else if(chars<1000)issues.push({t:'章节偏短',d:'仅'+chars+'字，建议至少2000字',s:'warn'});
  if(chars>20000)issues.push({t:'章节过长',d:chars+'字，建议拆分为多章发布',s:'mild'});

  var fails=issues.filter(function(i){return i.s==='fail';}).length;
  var warns=issues.filter(function(i){return i.s==='warn';}).length;
  var score=Math.max(0,100-fails*20-warns*8);
  return {issues:issues,score:score,fails:fails,warns:warns};
}

// ═══ Module 6: 广告/外链检测 ═══
function checkAds(t){
  var issues=[];
  var lo=t.toLowerCase();

  // URL检测
  var urls=t.match(/https?:\/\/[^\s\]）""'<>，。！？、；：]+/gi)||[];
  var urlSet={};
  urls.forEach(function(u){urlSet[u]=true;});
  var uniqueUrls=Object.keys(urlSet);
  if(uniqueUrls.length>0){
    var isInternal=uniqueUrls.every(function(u){return u.indexOf('fiction.aichatmail.one')>=0||u.indexOf('aichatmail')>=0;});
    if(!isInternal||uniqueUrls.length>3)
      issues.push({t:'外链检测',d:'检测到'+uniqueUrls.length+'个链接：'+uniqueUrls.slice(0,3).join(', ')+(uniqueUrls.length>3?'...':''),s:uniqueUrls.length>3?'fail':'warn'});
  }

  // 二维码
  var qrPatterns=['扫码','二维码','QR码','扫一扫','微信扫','支付宝扫'];
  qrPatterns.forEach(function(p){
    if(lo.indexOf(p)>=0)issues.push({t:'二维码引流',d:'检测到"'+p+'"关键词，疑似引导扫码',s:'fail'});
  });

  // 联系方式（不在违禁词中的补充）
  var contactPatterns=[
    {re:/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,lab:'邮箱地址'},
    {re:/1[3-9]\d{9}/g,lab:'手机号码'},
    {re:/[Vv][Xx信]?\s*[:：]\s*\w+/g,lab:'微信号'},
    {re:/\bQQ\s*[:：]\s*\d+/gi,lab:'QQ号'},
  ];
  contactPatterns.forEach(function(p){
    var m=t.match(p.re);
    if(m)issues.push({t:'联系方式',d:'检测到'+p.lab+' '+m[0]+', 禁止在正文中夹带',s:'fail'});
  });

  // 推广话术
  var promoPatterns=['加群','进群','点击链接','复制链接','打开淘宝','打开拼多多','下载APP','注册即送','领取红包','免费领取'];
  promoPatterns.forEach(function(p){
    if(lo.indexOf(p)>=0)issues.push({t:'推广话术',d:'检测到"'+p+'"，疑似广告引流',s:'fail'});
  });

  var fails=issues.filter(function(i){return i.s==='fail';}).length;
  var warns=issues.filter(function(i){return i.s==='warn';}).length;
  var score=Math.max(0,100-fails*30-warns*10);
  return {issues:issues,score:score,fails:fails,warns:warns,urls:uniqueUrls};
}

// ═══ 结果渲染 ═══
function render(t,r1,r2,r3,r4,r5,r6){
  document.getElementById('result').classList.remove('hidden');

  // 综合裁决
  var pass=r1.pass&&r2.fails===0&&(r4?r4.pass:true)&&(!r6||r6.fails===0)&&(!r5||r5.fails===0);
  var passL=r1.passL&&r2.fails===0&&(!r6||r6.fails===0);
  var verdict,cls,icon;
  if(pass){verdict='审核通过';cls='pass';icon='✅';}
  else if(passL){verdict='有条件通过';cls='warn';icon='⚠️';}
  else{verdict='审核不通过';cls='fail';icon='🚫';}
  document.getElementById('bn').innerHTML='<div class="bn '+cls+'"><span class="bi">'+icon+'</span><span>'+verdict+' — '+(pass?'内容符合规范，可发布':'请根据下方问题修改后重新提交')+'</span></div>';

  document.getElementById('st').innerHTML=
    '<div class="sb"><div class="sv">'+t.replace(/\s/g,'').length+'</div><div class="sl">总字符数</div></div>'+
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
  r1.hits.forEach(function(h){
    var cl=h.s==='severe'?'fail':(h.s==='moderate'?'warn':'info');
    var cc=h.s==='severe'?'r':(h.s==='moderate'?'o':'b');
    var word=h.w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var highlighted=h.ctx.replace(new RegExp(word,'gi'),'<span class="hl">$&</span>');
    fh+='<div class="vi '+cl+'"><span class="vc '+cc+'">'+h.c+'</span><span class="vd">'+highlighted+'</span></div>';
  });
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
  r2.issues.forEach(function(i){
    var cl=i.s==='fail'?'fail':(i.s==='warn'?'warn':'info');
    var cc=i.s==='fail'?'r':(i.s==='warn'?'o':'b');
    qh+='<div class="vi '+cl+'"><span class="vc '+cc+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
  });
  if(!qh)qh='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 内容质量良好</div>';
  document.getElementById('qList').innerHTML=qh;

  var at='';
  if(r3.warns)at+='<span class="tag o">'+r3.warns+' 疑似AI</span>';
  if(r3.milds)at+='<span class="tag b">'+r3.milds+' 轻微</span>';
  if(!r3.warns&&!r3.milds)at='<span class="tag g">✅ 无明显AI痕迹</span>';
  at+=' <span class="tag p">宽松模式</span>';
  document.getElementById('aiTags').innerHTML=at;

  var ah='';
  r3.issues.forEach(function(i){
    ah+='<div class="vi '+(i.s==='warn'?'warn':'info')+'"><span class="vc '+(i.s==='warn'?'o':'b')+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
  });
  if(!ah)ah='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 未检测到明显AI生成痕迹</div>';
  document.getElementById('aiList').innerHTML=ah;

  // 抄袭检测
  if(r4){
    var plTags='';
    if(r4.sim>0.3)plTags+='<span class="tag r">相似度'+(r4.sim*100).toFixed(0)+'%</span>';
    else if(r4.sim>0.1)plTags+='<span class="tag o">相似度'+(r4.sim*100).toFixed(0)+'%</span>';
    else plTags='<span class="tag g">✅ 无抄袭</span>';
    document.getElementById('plTags').innerHTML=plTags;
    document.getElementById('plMetrics').innerHTML=
      '<div class="qi"><div class="qv '+(r4.sim<0.1?'g':(r4.sim<0.3?'w':'bad'))+'">'+(r4.sim*100).toFixed(0)+'%</div><div class="ql">相似度</div></div>'+
      '<div class="qi"><div class="qv" style="color:var(--text)">'+r4.nDupe+'</div><div class="ql">重复句数</div></div>'+
      '<div class="qi"><div class="qv" style="color:var(--text)">'+r4.nTotal+'</div><div class="ql">总句数</div></div>';
    var plH='';
    r4.issues.forEach(function(i){
      plH+='<div class="vi '+(i.s==='fail'?'fail':(i.s==='warn'?'warn':'info'))+'"><span class="vc '+(i.s==='fail'?'r':(i.s==='warn'?'o':'b'))+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
    });
    if(!plH)plH='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 未检测到抄袭内容</div>';
    document.getElementById('plList').innerHTML=plH;
  }else{
    document.getElementById('plTags').innerHTML='<span class="tag b">未提供对照文本</span>';
    document.getElementById('plMetrics').innerHTML='<div class="qi"><div class="qv" style="color:var(--dim)">—</div><div class="ql">需粘贴已有章节</div></div>';
    document.getElementById('plList').innerHTML='<div style="font-size:.78rem;color:var(--dim);padding:12px">在"对照文本"框中粘贴已有章节内容后可进行抄袭检测</div>';
  }

  // 格式规范
  var fmTags='';
  if(r5.fails)fmTags+='<span class="tag r">'+r5.fails+' 问题</span>';
  if(r5.warns)fmTags+='<span class="tag o">'+r5.warns+' 警告</span>';
  if(!r5.fails&&!r5.warns)fmTags='<span class="tag g">✅ 格式规范</span>';
  document.getElementById('fmTags').innerHTML=fmTags;
  var fmH='';
  r5.issues.forEach(function(i){
    fmH+='<div class="vi '+(i.s==='fail'?'fail':(i.s==='warn'?'warn':'info'))+'"><span class="vc '+(i.s==='fail'?'r':(i.s==='warn'?'o':'b'))+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
  });
  if(!fmH)fmH='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 格式规范达标</div>';
  document.getElementById('fmList').innerHTML=fmH;

  // 广告/外链
  var adTags='';
  if(r6.fails)adTags+='<span class="tag r">'+r6.fails+' 违规</span>';
  if(r6.warns)adTags+='<span class="tag o">'+r6.warns+' 警告</span>';
  if(!r6.fails&&!r6.warns)adTags='<span class="tag g">✅ 无广告</span>';
  document.getElementById('adTags').innerHTML=adTags;
  var adH='';
  r6.issues.forEach(function(i){
    adH+='<div class="vi '+(i.s==='fail'?'fail':(i.s==='warn'?'warn':'info'))+'"><span class="vc '+(i.s==='fail'?'r':(i.s==='warn'?'o':'b'))+'">'+i.t+'</span><span class="vd">'+i.d+'</span></div>';
  });
  if(!adH)adH='<div style="font-size:.78rem;color:var(--green);padding:12px">✅ 未检测到广告或外链内容</div>';
  document.getElementById('adList').innerHTML=adH;

  document.getElementById('rs').innerHTML='<span style="color:var(--green)">审核完成</span>';
  document.getElementById('result').scrollIntoView({behavior:'smooth'});
}

// ═══ 审核历史 ═══
var history=[];
function addHistory(t,r1,r2,r3,r4,r6){
  var pass=r1.pass&&r2.fails===0&&(r4?r4.pass:true)&&(!r6||r6.fails===0);
  var title=document.getElementById('rt').value||'未命名';
  var ch=document.getElementById('rc').value||'';
  history.push({time:new Date().toLocaleTimeString(),title:title,ch:ch,pass:pass,severe:r1.severe.length,score:r2.score});
  var h='';
  history.forEach(function(item){
    var dot=item.pass?'var(--green)':'var(--red)';
    var tag=item.pass?'<span style="font-size:.6rem;padding:2px 6px;border-radius:8px;background:rgba(52,199,89,.15);color:var(--green)">通过</span>':
      '<span style="font-size:.6rem;padding:2px 6px;border-radius:8px;background:rgba(255,71,87,.15);color:var(--red)">不通过</span>';
    h+='<div class="bh-item"><div class="bh-dot" style="background:'+dot+'"></div>'+
      '<span style="color:var(--dim);min-width:55px">'+item.time+'</span>'+
      '<span style="flex:1;color:#fff">'+item.title+(item.ch?' · '+item.ch:'')+'</span>'+tag+
      '<span style="font-size:.6rem;color:var(--dim)">违规'+item.severe+' | '+item.score+'分</span></div>';
  });
  document.getElementById('batchHistory').innerHTML=h||'暂无记录';
}

window.clearReview=function(){
  document.getElementById('rx').value='';
  document.getElementById('ref').value='';
  document.getElementById('rt').value='';
  document.getElementById('rc').value='';
  document.getElementById('ra').value='';
  document.getElementById('result').classList.add('hidden');
  document.getElementById('rs').innerHTML='';
};

})();