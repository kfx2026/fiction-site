/**
 * FictionVerse Reader v5 — Immersive Web Novel Reader
 * =====================================================
 * 全屏沉浸 | 三主题(暗/亮/护眼) | 翻页/滚动 | 书签 | 底部工具栏
 */
(function(){
'use strict';

var API='https://api.aichatmail.one';
var RID=localStorage.getItem('fv_reader_id');
if(!RID){RID='r_'+Date.now().toString(36)+Math.random().toString(36).substr(2,6);localStorage.setItem('fv_reader_id',RID);}

function api(p,m,b){
  var o={method:m,headers:{'Content-Type':'application/json'}};
  if(b)o.body=JSON.stringify(b);
  return fetch(API+p,o).then(function(r){return r.json()}).catch(function(){return null});
}

// ═══ Settings ═══
var S={fontSize:18,lineHeight:1.8,mode:'scroll',theme:'dark',font:'serif'};
(function(){try{var s=JSON.parse(localStorage.getItem('fv_reader'));if(s)S=s;}catch(e){}})();

function save(){localStorage.setItem('fv_reader',JSON.stringify(S));apply();}
function apply(){
  var r=document.documentElement;
  r.classList.remove('fv-dark','fv-light','fv-sepia');
  r.classList.add('fv-'+S.theme);
  var c=document.getElementById('reader-content');if(!c)return;
  c.style.fontSize=S.fontSize+'px';c.style.lineHeight=S.lineHeight;
  c.style.fontFamily=S.font==='serif'?'Georgia,"Times New Roman",serif':'-apple-system,BlinkMacSystemFont,sans-serif';
  var v=document.getElementById('fv-font-val');if(v)v.textContent=S.fontSize;
  var tb=document.getElementById('fv-theme-btn');if(tb){
    tb.textContent={'dark':'🌙','light':'☀️','sepia':'📜'}[S.theme];
    tb.title={'dark':'Dark','light':'Light','sepia':'Eye Comfort'}[S.theme];
  }
  var mb=document.getElementById('fv-mode-btn');if(mb)mb.textContent=S.mode==='page'?'📖':'📃';
  var pn=document.getElementById('fv-page-nav');if(pn)pn.style.display=S.mode==='page'?'block':'none';
  updateBM();
}
apply();

// ═══ Buttons (stopPropagation to prevent toggleUI) ═══
function btn(id,fn){
  var el=document.getElementById(id);if(!el)return;
  el.addEventListener('click',function(e){e.stopPropagation();fn(e);});
}
btn('fv-font-down',function(){S.fontSize=Math.max(12,S.fontSize-2);save();if(S.mode==='page')buildPages();});
btn('fv-font-up',function(){S.fontSize=Math.min(32,S.fontSize+2);save();if(S.mode==='page')buildPages();});
btn('fv-theme-btn',function(){
  S.theme=S.theme==='dark'?'light':S.theme==='light'?'sepia':'dark';save();});
btn('fv-mode-btn',function(){
  var c=document.getElementById('reader-content');if(!c)return;
  if(S.mode==='page'){S.mode='scroll';c.innerHTML='<p>'+c.getAttribute('data-text').replace(/\n/g,'</p><p>')+'</p>';pages=[];total=0;}
  else{S.mode='page';buildPages();}save();});
btn('fv-bm-btn',toggleBM);
btn('fv-drawer-btn',toggleDrawer);
btn('fv-page-prev',function(){if(page>0)showPage(page-1);else goPrev();});
btn('fv-page-next',function(){if(page<total-1)showPage(page+1);else goNext();});

// ═══ Toggle UI (click on content area) ═══
(function(){
  var main=document.querySelector('main');if(!main)return;
  main.addEventListener('click',function(e){
    // Don't toggle if clicking buttons, links, inputs, or drawer
    if(e.target.closest('button,a,input,textarea,select,#reader-drawer,#reader-tb,#reader-mini-hd'))return;
    toggleUI();
  });
})();
function toggleUI(){
  var tb=document.getElementById('reader-tb'),pb=document.getElementById('reader-pb'),hd=document.getElementById('reader-mini-hd');
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
  if(!txt)return;
  var vh=window.innerHeight-100,cw=c.offsetWidth-48,fs=S.fontSize,lh=fs*S.lineHeight;
  var cpl=Math.floor(cw/fs*1.7),lpp=Math.floor(vh/lh),cpp=cpl*lpp;
  pages=[];var i=0;
  while(i<txt.length){
    var end=Math.min(i+cpp,txt.length);
    if(end<txt.length){var bps=['.\n\n','.\n','\n\n','\n','. ','? ','! ',' '];for(var bi=0;bi<bps.length;bi++){var bp=txt.lastIndexOf(bps[bi],end);if(bp>i+cpp*0.5){end=bp+bps[bi].length;break;}}}
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
function goNext(){var n=document.body.dataset.nextChapter;if(n)location.href=n;}
function goPrev(){var p=document.body.dataset.prevChapter;if(p)location.href=p;}

// ═══ Bookmark ═══
function getBM(){try{return JSON.parse(localStorage.getItem('fv_bm')||'[]');}catch(e){return[];}}
function toggleBM(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;
  if(!slug||!ch)return;var bm=getBM(),idx=bm.findIndex(function(b){return b.slug===slug&&b.chapter===ch;});
  if(idx>=0)bm.splice(idx,1);else bm.unshift({slug:slug,chapter:ch,title:'Chapter '+ch,time:new Date().toISOString()});
  localStorage.setItem('fv_bm',JSON.stringify(bm));updateBM();
}
function updateBM(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;
  var has=getBM().some(function(b){return b.slug===slug&&b.chapter===ch;});
  var b=document.getElementById('fv-bm-btn');if(b){b.innerHTML=has?'🔖':'🏷';b.style.opacity=has?'1':'0.5';}
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
  var slug=document.body.dataset.bookSlug,cur=parseInt(document.body.dataset.chapterNum)||0,tot=parseInt(document.body.dataset.totalChapters)||0;
  var bm=getBM(),h='<div style="padding:14px 16px;font-weight:700;color:#fff;font-size:0.85rem;border-bottom:1px solid rgba(255,255,255,0.06)">📖 Chapters <span style="font-size:0.6rem;color:var(--dim)">'+cur+'/'+tot+'</span></div>';
  for(var i=1;i<=tot;i++){var isCur=i===cur,isBM=bm.some(function(b){return b.slug===slug&&b.chapter===i;});
    h+='<a href="/read/'+slug+'/chapters/'+i+'" style="display:flex;align-items:center;gap:8px;padding:8px 16px;font-size:0.74rem;color:'+(isCur?'var(--gold)':'var(--dim)')+';text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.02);'+(isCur?'background:rgba(232,192,64,0.08)':'')+'"><span style="min-width:26px;text-align:right;font-weight:600">'+i+'</span><span style="flex:1">Chapter '+i+'</span>'+(isBM?'🔖':'')+(isCur?'▶':'')+'</a>';}
  list.innerHTML=h;
  setTimeout(function(){var el=list.querySelector('[style*="var(--gold)"]');if(el)el.scrollIntoView({block:'center'});},200);
}

// ═══ Progress ═══
function updateProgress(){
  var c=document.getElementById('reader-content');if(!c)return;
  var rect=c.getBoundingClientRect(),h=c.scrollHeight,st=Math.max(0,-rect.top);
  var pct=h>0?Math.min(100,Math.round((st+window.innerHeight)/h*100)):0;
  var bar=document.getElementById('fv-progress-bar');if(bar)bar.style.width=pct+'%';
}

// ═══ Touch ═══
var tx=0,ty=0;
document.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;ty=e.touches[0].clientY;});
document.addEventListener('touchend',function(e){
  if(e.target.closest('button,a,input'))return;
  var dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(S.mode!=='page')return;
  if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)){if(dx<0){if(page<total-1)showPage(page+1);else goNext();}else{if(page>0)showPage(page-1);else goPrev();}}
});

// ═══ Keyboard ═══
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='ArrowRight'){e.preventDefault();S.mode==='page'?(page<total-1?showPage(page+1):goNext()):goNext();}
  if(e.key==='ArrowLeft'){e.preventDefault();S.mode==='page'?(page>0?showPage(page-1):goPrev()):goPrev();}
});

// ═══ Init Reader ═══
function initReader(){
  var c=document.getElementById('reader-content');if(!c)return;
  c.setAttribute('data-text',c.textContent||'');
  if(S.mode==='page')buildPages();
  updateBM();updateProgress();
  window.addEventListener('scroll',updateProgress);
  window.addEventListener('resize',function(){if(S.mode==='page')buildPages();});
}

// ═══ Favorites ═══
(function(){
  var b=document.getElementById('fv-fav-btn');if(!b)return;
  var slug=document.body.dataset.bookSlug;if(!slug)return;
  api('/api/favorites?reader_id='+RID).then(function(d){
    if(!d)return;var is=d.some(function(f){return f.book_slug===slug;});
    b.innerHTML=is?'❤️':'🤍';b.classList.toggle('on',is);
  });
  b.addEventListener('click',function(e){e.stopPropagation();
    var is=b.classList.contains('on');
    if(is){api('/api/favorites/'+slug+'?reader_id='+RID,'DELETE').then(function(){b.innerHTML='🤍';b.classList.remove('on');});}
    else{api('/api/favorites','POST',{book_slug:slug,reader_id:RID}).then(function(){b.innerHTML='❤️';b.classList.add('on');});}
  });
})();

// ═══ Reviews ═══
(function(){
  var sec=document.getElementById('fv-reviews');if(!sec)return;
  var slug=document.body.dataset.bookSlug;if(!slug)return;
  loadRev(slug);
  var form=sec.querySelector('.fv-review-form');if(!form)return;
  form.addEventListener('submit',function(e){e.preventDefault();e.stopPropagation();
    var r=parseInt(form.querySelector('[name=rating]').value),c=form.querySelector('[name=content]').value.trim(),n=form.querySelector('[name=name]').value.trim()||'Reader';
    if(!r){alert('Select a rating');return;}
    api('/api/books/'+slug+'/reviews','POST',{reader_id:RID,reader_name:n,rating:r,content:c}).then(function(x){if(x&&x.ok){loadRev(slug);form.reset();}});
  });
  sec.querySelectorAll('.fv-star').forEach(function(s){s.addEventListener('click',function(e){e.stopPropagation();
    var v=parseInt(s.dataset.v);form.querySelector('[name=rating]').value=v;
    sec.querySelectorAll('.fv-star').forEach(function(x){x.classList.toggle('on',parseInt(x.dataset.v)<=v);});
  });});
})();
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

// ═══ Progress save ═══
(function(){
  var slug=document.body.dataset.bookSlug,ch=parseInt(document.body.dataset.chapterNum)||0;if(!slug||!ch)return;
  api('/api/progress','PUT',{book_slug:slug,reader_id:RID,chapter_num:ch});
  api('/api/track/pageview','POST',{book_slug:slug,chapter_num:ch,reader_id:RID});
  window.addEventListener('beforeunload',function(){
    var p=JSON.parse(localStorage.getItem('fv_pos')||'{}');p[slug]={ch:ch,page:page,t:new Date().toISOString()};localStorage.setItem('fv_pos',JSON.stringify(p));
  });
})();

// ═══ Start ═══
initReader();
})();
