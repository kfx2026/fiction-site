/**
 * FictionVerse Reader v4 — Immersive Web Novel Reader
 * =====================================================
 * 全屏沉浸式阅读 | 底部工具栏 | 点击切换 | 翻页/滚动 | 书签 | 夜间模式
 */
(function(){
'use strict';

var API='https://api.aichatmail.one';
var RID=getReaderId();

function getReaderId(){
  var id=localStorage.getItem('fv_reader_id');
  if(!id){id='r_'+Date.now().toString(36)+Math.random().toString(36).substr(2,6);localStorage.setItem('fv_reader_id',id);}
  return id;
}
function api(path,method,body){
  var opts={method:method,headers:{'Content-Type':'application/json'}};
  if(body)opts.body=JSON.stringify(body);
  return fetch(API+path,opts).then(function(r){return r.json()}).catch(function(){return null});
}

// ═══ Settings ═══
var S={fontSize:18,lineHeight:1.8,mode:'scroll',theme:'dark',font:'serif'};
function load(){try{var s=JSON.parse(localStorage.getItem('fv_reader'));if(s)S=s;}catch(e){}apply();}
function save(){localStorage.setItem('fv_reader',JSON.stringify(S));apply();}
function apply(){
  var r=document.documentElement;
  if(S.theme==='sepia'){r.style.setProperty('--rb','#f4ecd8');r.style.setProperty('--rt','#433422');r.style.setProperty('--rd','#8b7355');}
  else if(S.theme==='light'){r.style.setProperty('--rb','#fff');r.style.setProperty('--rt','#222');r.style.setProperty('--rd','#666');}
  else{r.style.removeProperty('--rb');r.style.removeProperty('--rt');r.style.removeProperty('--rd');}
  var c=document.getElementById('reader-content');
  if(c){c.style.fontSize=S.fontSize+'px';c.style.lineHeight=S.lineHeight;
    c.style.fontFamily=S.font==='serif'?'Georgia,"Times New Roman",serif':'-apple-system,BlinkMacSystemFont,sans-serif';}
  var v=document.getElementById('fv-font-val');if(v)v.textContent=S.fontSize;
  updateThemeIcon();updateModeBtn();updateBM();
}

// ═══ Toolbar Toggle ═══
function toggleUI(){
  var tb=document.getElementById('reader-tb');
  var pb=document.getElementById('reader-pb');
  var hd=document.getElementById('reader-mini-hd');
  if(!tb)return;
  var on=tb.classList.toggle('on');
  if(pb)pb.classList.toggle('on',on);
  if(hd)hd.classList.toggle('on',on);
}

// ═══ Pagination ═══
var page=0,total=0,pages=[];
function buildPages(){
  var c=document.getElementById('reader-content');if(!c||S.mode!=='page')return;
  var txt=c.getAttribute('data-text')||c.textContent||'';
  var vh=window.innerHeight-80,cw=c.offsetWidth-48,fs=S.fontSize,lh=fs*S.lineHeight;
  var cpl=Math.floor(cw/fs*1.7),lpp=Math.floor(vh/lh),cpp=cpl*lpp;
  pages=[];var i=0;
  while(i<txt.length){
    var end=Math.min(i+cpp,txt.length);
    if(end<txt.length){for(var bp of ['.\n\n','.\n','\n\n','\n','. ','? ','! ',' ']){var b=txt.lastIndexOf(bp,end);if(b>i+cpp*0.5){end=b+bp.length;break;}}}
    pages.push(txt.substring(i,end));i=end;
  }
  total=pages.length;page=Math.min(page,total-1);if(page<0)page=0;showPage(page);
}
function showPage(n){
  if(n<0||n>=total)return;page=n;
  var c=document.getElementById('reader-content');if(c)c.innerHTML='<p>'+pages[n].replace(/\n/g,'</p><p>')+'</p>';
  var ofs=document.getElementById('fv-page-ofs');if(ofs)ofs.textContent=(n+1)+'/'+total;
  window.scrollTo(0,0);
}
function nextPage(){if(page<total-1)showPage(page+1);else goNext();}
function prevPage(){if(page>0)showPage(page-1);else goPrev();}

// ═══ Chapter Nav ═══
function goNext(){var n=document.body.dataset.nextChapter;if(n)location.href=n;}
function goPrev(){var p=document.body.dataset.prevChapter;if(p)location.href=p;}

// ═══ Bookmark ═══
function getBM(){try{return JSON.parse(localStorage.getItem('fv_bm')||'[]');}catch(e){return[];}}
function saveBM(bm){localStorage.setItem('fv_bm',JSON.stringify(bm));}
function toggleBM(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;
  if(!slug||!ch)return;var bm=getBM(),idx=bm.findIndex(function(b){return b.slug===slug&&b.chapter===ch;});
  if(idx>=0)bm.splice(idx,1);else bm.unshift({slug:slug,chapter:ch,title:'Chapter '+ch,time:new Date().toISOString()});
  saveBM(bm);updateBM();
}
function updateBM(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;
  var has=getBM().some(function(b){return b.slug===slug&&b.chapter===ch;});
  var btn=document.getElementById('fv-bm-btn');if(btn){btn.innerHTML=has?'🔖':'🏷';btn.style.opacity=has?'1':'0.5';}
}

// ═══ Drawer ═══
function toggleDrawer(){
  var d=document.getElementById('reader-drawer');if(!d)return;
  var on=d.classList.toggle('open');d.style.transform=on?'translateX(0)':'translateX(100%)';
  var ov=document.getElementById('reader-ov');if(ov)ov.style.display=on?'block':'none';
  if(on)buildDrawer();
}
function buildDrawer(){
  var list=document.getElementById('reader-ch-list');if(!list)return;
  var slug=document.body.dataset.bookSlug,cur=parseInt(document.body.dataset.chapterNum)||0,total=parseInt(document.body.dataset.totalChapters)||0;
  var bm=getBM(),h='<div style="padding:14px 16px;font-weight:700;color:#fff;font-size:0.88rem;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between"><span>📖 Chapters</span><span style="font-size:0.62rem;color:var(--dim)">'+cur+'/'+total+'</span></div>';
  for(var i=1;i<=total;i++){var isCur=i===cur,isBM=bm.some(function(b){return b.slug===slug&&b.chapter===i;});
    h+='<a href="/read/'+slug+'/chapters/'+i+'" style="display:flex;align-items:center;gap:8px;padding:8px 16px;font-size:0.76rem;color:'+(isCur?'var(--gold)':'var(--dim)')+';text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.02);'+(isCur?'background:rgba(232,192,64,0.08)':'')+'">'+
      '<span style="min-width:26px;text-align:right;font-weight:600">'+i+'</span><span style="flex:1">Chapter '+i+'</span>'+(isBM?'🔖':'')+(isCur?'▶':'')+'</a>';}
  list.innerHTML=h;
  setTimeout(function(){var el=list.querySelector('[style*="var(--gold)"]');if(el)el.scrollIntoView({block:'center'});},200);
}

// ═══ Progress Bar ═══
function updateProgress(){
  var c=document.getElementById('reader-content');if(!c)return;
  var rect=c.getBoundingClientRect(),h=c.scrollHeight-vh,scrolled=Math.max(0,-rect.top);
  var pct=Math.min(100,Math.round(h>0?scrolled/h*100:0));
  var bar=document.getElementById('fv-progress-bar');if(bar)bar.style.width=pct+'%';
}

// ═══ Touch ═══
var tsX=0,tsY=0;
function initTouch(){
  document.addEventListener('touchstart',function(e){tsX=e.touches[0].clientX;tsY=e.touches[0].clientY;});
  document.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-tsX,dy=e.changedTouches[0].clientY-tsY;
    if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)){if(dx<0)nextPage();else prevPage();}
  });
}

// ═══ Keyboard ═══
function initKB(){
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(e.key==='ArrowRight'){e.preventDefault();S.mode==='page'?nextPage():goNext();}
    if(e.key==='ArrowLeft'){e.preventDefault();S.mode==='page'?prevPage():goPrev();}
  });
}

// ═══ Public API ═══
window.fvFontDown=function(){S.fontSize=Math.max(12,S.fontSize-2);save();if(S.mode==='page')buildPages();};
window.fvFontUp=function(){S.fontSize=Math.min(32,S.fontSize+2);save();if(S.mode==='page')buildPages();};
window.fvToggleTheme=function(){
  if(S.theme==='dark')S.theme='sepia';else if(S.theme==='sepia')S.theme='light';else S.theme='dark';save();
};
window.fvToggleMode=function(){
  var c=document.getElementById('reader-content');if(!c)return;
  if(S.mode==='page'){S.mode='scroll';c.innerHTML='<p>'+c.getAttribute('data-text').replace(/\n/g,'</p><p>')+'</p>';pages=[];total=0;}
  else{S.mode='page';buildPages();}
  save();updateModeBtn();
};
window.fvToggleBM=toggleBM;
window.fvToggleDrawer=toggleDrawer;
window.fvNextPage=nextPage;
window.fvPrevPage=prevPage;

function updateThemeIcon(){
  var b=document.getElementById('fv-theme-btn');if(b)b.textContent={'dark':'🌙','sepia':'📜','light':'☀️'}[S.theme]||'🌙';
}
function updateModeBtn(){
  var b=document.getElementById('fv-mode-btn');if(b)b.textContent=S.mode==='page'?'📖':'📃';
  var pn=document.getElementById('fv-page-nav');if(pn)pn.style.display=S.mode==='page'?'flex':'none';
}

// ═══ Init ═══
function initReader(){
  var c=document.getElementById('reader-content');if(!c)return;
  c.setAttribute('data-text',c.textContent||'');
  load();
  if(S.mode==='page')buildPages();
  initTouch();initKB();updateBM();updateProgress();
  window.addEventListener('scroll',updateProgress);
  window.addEventListener('resize',function(){if(S.mode==='page')buildPages();});
  window.addEventListener('beforeunload',function(){
    var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;
    if(slug&&ch){var p=JSON.parse(localStorage.getItem('fv_pos')||'{}');p[slug]={ch:ch,page:page,t:new Date().toISOString()};localStorage.setItem('fv_pos',JSON.stringify(p));}
  });
  // Restore position
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;
  var pos=JSON.parse(localStorage.getItem('fv_pos')||'{}');if(pos[slug]&&pos[slug].page>0)S.mode='page';
}

// ═══ Favorites ═══
function initFav(){
  var b=document.getElementById('fv-fav-btn');if(!b)return;
  var slug=document.body.dataset.bookSlug;if(!slug)return;
  api('/api/favorites?reader_id='+RID).then(function(d){
    if(!d)return;var is=d.some(function(f){return f.book_slug===slug;});
    b.innerHTML=is?'❤️':'🤍';b.classList.toggle('on',is);
  });
  b.onclick=function(){
    var slug=document.body.dataset.bookSlug,is=b.classList.contains('on');
    if(is){api('/api/favorites/'+slug+'?reader_id='+RID,'DELETE').then(function(){b.innerHTML='🤍';b.classList.remove('on');});}
    else{api('/api/favorites','POST',{book_slug:slug,reader_id:RID}).then(function(){b.innerHTML='❤️';b.classList.add('on');});}
  };
}

// ═══ Reviews ═══
function initRev(){
  var sec=document.getElementById('fv-reviews');if(!sec)return;
  var slug=document.body.dataset.bookSlug;if(!slug)return;
  loadRev(slug);
  var f=sec.querySelector('.fv-review-form');if(f){f.onsubmit=function(e){e.preventDefault();
    var r=parseInt(f.querySelector('[name=rating]').value),c=f.querySelector('[name=content]').value.trim(),n=f.querySelector('[name=name]').value.trim()||'Reader';
    if(!r){alert('Select a rating');return;}
    api('/api/books/'+slug+'/reviews','POST',{reader_id:RID,reader_name:n,rating:r,content:c}).then(function(x){if(x&&x.ok){loadRev(slug);f.reset();}});
  };}
  sec.querySelectorAll('.fv-star').forEach(function(s){s.onclick=function(){var v=parseInt(s.dataset.v);
    f.querySelector('[name=rating]').value=v;sec.querySelectorAll('.fv-star').forEach(function(x){x.classList.toggle('on',parseInt(x.dataset.v)<=v);});};});
}
function loadRev(slug){
  api('/api/books/'+slug+'/reviews').then(function(d){if(!d)return;
    var l=document.getElementById('fv-review-list'),ae=document.getElementById('fv-avg-rating'),ce=document.getElementById('fv-review-count');
    if(ae)ae.innerHTML='★'.repeat(Math.round(d.avg_rating||0))+'☆'.repeat(5-Math.round(d.avg_rating||0))+' '+(d.avg_rating||0).toFixed(1);
    if(ce)ce.textContent=(d.total||0)+' reviews';
    if(l){if(!d.reviews||!d.reviews.length){l.innerHTML='<p style="color:var(--dim);font-size:0.82rem">No reviews yet.</p>';return;}
      l.innerHTML=d.reviews.map(function(r){var dt=new Date(r.created_at+'Z');
        return '<div class="fv-ri"><div class="fv-ri-hd"><span class="fv-ri-n">'+esc(r.reader_name)+'</span><span class="fv-ri-s">'+'★'.repeat(r.rating)+'☆'.repeat(5-r.rating)+'</span><span class="fv-ri-d">'+dt.toLocaleDateString()+'</span></div>'+(r.content?'<div class="fv-ri-b">'+esc(r.content)+'</div>':'')+'</div>';}).join('');}
  });
}
function esc(s){return s.replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ═══ Forum ═══
function initForum(){
  var f=document.getElementById('fv-forum');if(!f)return;loadTopics();
}
function loadTopics(){
  var l=document.getElementById('fv-forum-list');if(!l)return;
  api('/api/forum/topics').then(function(d){
    if(!d||!d.length){l.innerHTML='<p>No discussions yet.</p>';return;}
    l.innerHTML=d.map(function(t){var dt=new Date(t.created_at+'Z');
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer" onclick="fvViewTopic('+t.id+')"><div style="font-weight:600;color:#fff;font-size:0.85rem">'+esc(t.title)+'</div><div style="font-size:0.65rem;color:var(--dim)">by '+esc(t.reader_name)+' · '+dt.toLocaleDateString()+' · '+t.reply_count+' replies</div></div>';}).join('');
  });
}
window.postTopic=function(e){e.preventDefault();var t=document.getElementById('fv-topic-title').value.trim();if(!t)return;
  api('/api/forum/topics','POST',{reader_id:RID,reader_name:'Reader',title:t}).then(function(r){if(r&&r.ok){document.getElementById('fv-topic-title').value='';loadTopics();}});};
window.fvViewTopic=function(id){api('/api/forum/topics/'+id).then(function(t){if(!t)return;var l=document.getElementById('fv-forum-list'),d=new Date(t.created_at+'Z');
    var h='<div style="margin-bottom:12px"><a href="#" onclick="loadTopics();return false" style="font-size:0.72rem;color:var(--accent)">← Back</a></div><div style="background:rgba(255,255,255,0.02);border-radius:8px;padding:12px;margin-bottom:16px"><h3 style="color:#fff;font-size:0.95rem">'+esc(t.title)+'</h3><p style="font-size:0.65rem;color:var(--dim)">'+esc(t.reader_name)+' · '+d.toLocaleString()+'</p></div>';
    (t.posts||[]).forEach(function(p){var dp=new Date(p.created_at+'Z');h+='<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)"><div style="font-size:0.7rem;color:var(--dim)"><strong style="color:#fff">'+esc(p.reader_name)+'</strong> · '+dp.toLocaleString()+'</div><div style="font-size:0.8rem;color:var(--dim);line-height:1.5">'+esc(p.content)+'</div></div>';});
    h+='<form onsubmit="fvReplyTopic(event,'+id+')" style="margin-top:12px;display:flex;gap:8px"><input id="fv-reply-input" placeholder="Reply..." style="flex:1;padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.78rem;font-family:inherit"><button type="submit" style="padding:6px 16px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:0.78rem;font-family:inherit">Reply</button></form>';l.innerHTML=h;});};
window.fvReplyTopic=function(e,id){e.preventDefault();var c=document.getElementById('fv-reply-input').value.trim();if(!c)return;
  api('/api/forum/topics/'+id+'/posts','POST',{reader_id:RID,reader_name:'Reader',content:c}).then(function(r){if(r&&r.ok)fvViewTopic(id);});};

// ═══ Bookshelf ═══
function initShelf(){
  var p=document.getElementById('fv-bookshelf');if(!p)return;
  api('/api/favorites?reader_id='+RID).then(function(d){
    var g=document.getElementById('fv-shelf-grid'),e=document.getElementById('fv-shelf-empty');if(!g)return;
    if(!d||!d.length){if(e)e.style.display='block';g.innerHTML='';return;}if(e)e.style.display='none';
    g.innerHTML=d.map(function(f){return '<article class="bk"><a href="/read/'+f.book_slug+'/chapters/'+(f.read_up_to+1)+'" class="bk-cv"><img src="'+f.cover+'" alt="" loading="lazy"></a><div class="bk-bd"><div class="bk-genre">'+f.genre+'</div><h2 class="bk-title"><a href="/read/'+f.book_slug+'/chapters/'+(f.read_up_to+1)+'">'+esc(f.title)+'</a></h2><div class="bk-author">by '+esc(f.author)+'</div></div></article>';}).join('');
  });
}

// ═══ Progress ═══
function initProg(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;if(!slug||!ch)return;
  api('/api/progress','PUT',{book_slug:slug,reader_id:RID,chapter_num:ch});
}
function trackPV(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;if(!slug)return;
  api('/api/track/pageview','POST',{book_slug:slug,chapter_num:ch,reader_id:RID});
}

// ═══ Gifts ═══
function initGift(){
  var b=document.querySelector('.fv-fav-btn');if(!b||document.getElementById('fv-gift-btn'))return;
  var gb=document.createElement('button');gb.id='fv-gift-btn';gb.textContent='🎁 Tip';
  gb.style.cssText='padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:var(--dim);cursor:pointer;font-size:0.72rem;font-family:inherit';
  gb.onclick=function(){showGift();};b.parentNode.insertBefore(gb,b.nextSibling);
}
function showGift(){
  var slug=document.body.dataset.bookSlug,e=document.getElementById('fv-gift-popup');if(e){e.remove();return;}
  api('/api/points?reader_id='+RID).then(function(p){if(!p)p={total_points:0};
    var d=document.createElement('div');d.id='fv-gift-popup';
    d.style.cssText='position:fixed;bottom:80px;right:16px;z-index:300;background:var(--card);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;max-width:260px;box-shadow:0 8px 32px rgba(0,0,0,0.5)';
    d.innerHTML='<h4 style="color:#fff;margin-bottom:6px;font-size:0.82rem">🎁 Tip Author</h4><p style="font-size:0.62rem;color:var(--dim);margin-bottom:8px">Balance: <strong style="color:var(--gold)">'+p.total_points+' pts</strong></p><div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">'+[10,50,100].map(function(v){return '<button onclick="fvSendGift(\''+slug+'\','+v+')" style="padding:5px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer;font-size:0.65rem;font-family:inherit">'+v+'⭐</button>';}).join('')+'</div><div id="fv-gift-status" style="font-size:0.6rem;color:var(--dim)"></div>';
    document.body.appendChild(d);});
}
window.fvSendGift=function(slug,pts){
  api('/api/gifts','POST',{book_slug:slug,reader_id:RID,reader_name:'Reader',points:pts,message:''}).then(function(r){
    var s=document.getElementById('fv-gift-status');if(r&&r.ok){s.textContent='✅ Sent '+pts+' pts!';setTimeout(function(){var p=document.getElementById('fv-gift-popup');if(p)p.remove();},1500);}else{s.textContent='❌ '+(r?r.error:'Failed');}});
};

// ═══ Checkin ═══
function initCheckin(){
  var c=document.getElementById('fv-bookshelf')||document.querySelector('.cp');if(!c||document.getElementById('fv-checkin-widget'))return;
  var w=document.createElement('div');w.id='fv-checkin-widget';w.innerHTML='<div style="background:rgba(79,140,255,0.06);border:1px solid rgba(79,140,255,0.15);border-radius:10px;padding:10px 14px;margin-bottom:14px"><div style="display:flex;align-items:center;justify-content:space-between"><span style="font-weight:700;color:#fff;font-size:0.8rem">📅 Daily Check-in</span><span id="fv-checkin-status" style="font-size:0.62rem;color:var(--dim)">...</span><button id="fv-checkin-btn" onclick="fvDoCheckin()" style="padding:5px 14px;border-radius:20px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:0.68rem;font-family:inherit">Check In</button></div></div>';
  c.parentNode.insertBefore(w,c);loadCheckin();
}
window.fvDoCheckin=function(){var b=document.getElementById('fv-checkin-btn');if(!b)return;b.disabled=true;b.textContent='...';
  api('/api/checkin','POST',{reader_id:RID}).then(function(r){if(r&&r.ok)loadCheckin();else{b.textContent='✓';setTimeout(function(){b.disabled=false;b.textContent='Check In';},2000);}});};
function loadCheckin(){api('/api/checkin?reader_id='+RID).then(function(d){if(!d)return;
  var s=document.getElementById('fv-checkin-status'),b=document.getElementById('fv-checkin-btn');
  if(s)s.textContent=d.checked_in_today?'✅ +'+d.today_points+' pts':(d.current_streak>0?'🔥 Day '+d.current_streak:'Ready');
  if(b){b.textContent=d.checked_in_today?'✓ Done':'Check In';b.disabled=d.checked_in_today;}});}

// ═══ Init ═══
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
function init(){
  initReader();initFav();initRev();initProg();initShelf();initCheckin();initForum();initGift();trackPV();
}
})();
