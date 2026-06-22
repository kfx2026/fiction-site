/**
 * FictionVerse Reader System v3
 * ==============================
 * 专业阅读器：翻页模式 | 上下滚动 | 书签 | 字体调节 | 日夜间模式 | 章节目录
 * 收藏 | 评分评论 | 阅读进度同步
 */
(function(){
'use strict';

var API='https://api.aichatmail.one';
var RID=getReaderId();

function getReaderId(){
  var id=localStorage.getItem('fv_reader_id');
  if(!id){
    id='r_'+Date.now().toString(36)+Math.random().toString(36).substr(2,6);
    localStorage.setItem('fv_reader_id',id);
  }
  return id;
}

function api(path,method,body){
  var opts={method:method,headers:{'Content-Type':'application/json'}};
  if(body)opts.body=JSON.stringify(body);
  return fetch(API+path,opts).then(function(r){return r.json()}).catch(function(){return null});
}

// ═══ 阅读器设置 ═══
var RS={
  fontSize: 18,
  lineHeight: 2,
  mode: 'scroll',  // scroll | page
  theme: 'dark',   // dark | light
  fontFamily: 'serif'
};

function loadSettings(){
  try{var s=JSON.parse(localStorage.getItem('fv_reader_settings'));if(s)RS=s;}catch(e){}
  applySettings();
}

function saveSettings(){
  localStorage.setItem('fv_reader_settings',JSON.stringify(RS));
  applySettings();
}

function applySettings(){
  var root=document.documentElement;
  if(RS.theme==='light'){
    root.style.setProperty('--reader-bg','#f5f1eb');
    root.style.setProperty('--reader-text','#2c2416');
    root.style.setProperty('--reader-dim','#8b7355');
    root.style.setProperty('--reader-card','#ede4d8');
    root.style.setProperty('--reader-border','rgba(0,0,0,0.08)');
  }else{
    root.style.removeProperty('--reader-bg');
    root.style.removeProperty('--reader-text');
    root.style.removeProperty('--reader-dim');
    root.style.removeProperty('--reader-card');
    root.style.removeProperty('--reader-border');
  }
  var content=document.getElementById('reader-content');
  if(content){
    content.style.fontSize=RS.fontSize+'px';
    content.style.lineHeight=RS.lineHeight;
    content.style.fontFamily=RS.fontFamily==='serif'?'Georgia,"Times New Roman",serif':'-apple-system,BlinkMacSystemFont,sans-serif';
  }
  // Update toolbar
  var fsEl=document.getElementById('reader-fs-val');
  if(fsEl)fsEl.textContent=RS.fontSize+'px';
  var themeBtn=document.getElementById('reader-theme-btn');
  if(themeBtn)themeBtn.textContent=RS.theme==='light'?'☀️':'🌙';
}

// ═══ 翻页模式 ═══
var currentPage=0;
var totalPages=0;
var pages=[];

function buildPages(){
  var content=document.getElementById('reader-content');
  if(!content||RS.mode!=='page')return;
  // Estimate page height based on viewport and settings
  var vh=window.innerHeight-180; // minus toolbar + footer space
  var lineHeight=RS.fontSize*RS.lineHeight;
  var charsPerLine=Math.floor((content.offsetWidth-32)/RS.fontSize*1.8);
  var linesPerPage=Math.floor(vh/lineHeight);
  var charsPerPage=charsPerLine*linesPerPage;

  var text=content.textContent||'';
  pages=[];
  var i=0;
  while(i<text.length){
    // Find a good break point (end of sentence or paragraph)
    var end=i+charsPerPage;
    if(end>=text.length){end=text.length;}
    else{
      var breakPoints=['.\n\n','.\n','.\n ','\n\n','\n','. ','. ','? ','! ',' '];
      for(var b=0;b<breakPoints.length;b++){
        var bp=text.lastIndexOf(breakPoints[b],end);
        if(bp>i+charsPerPage*0.5){end=bp+breakPoints[b].length;break;}
      }
    }
    pages.push(text.substring(i,end));
    i=end;
  }
  totalPages=pages.length;
  currentPage=Math.min(currentPage,totalPages-1);
  if(currentPage<0)currentPage=0;
  showPage(currentPage);
}

function showPage(n){
  if(n<0||n>=totalPages)return;
  currentPage=n;
  var content=document.getElementById('reader-content');
  if(content){
    content.innerHTML=pages[n].split('\n').map(function(p){return '<p>'+esc(p)+'</p>';}).join('');
    content.style.display='block';
  }
  var ofs=document.getElementById('reader-page-ofs');
  if(ofs)ofs.textContent=''+(n+1)+'/'+totalPages;
  var prev=document.getElementById('reader-page-prev');
  var next=document.getElementById('reader-page-next');
  if(prev)prev.style.opacity=n<=0?'0.3':'1';
  if(next)next.style.opacity=n>=totalPages-1?'0.3':'1';
  // Scroll to top
  window.scrollTo(0,0);
}

function nextPage(){
  if(currentPage<totalPages-1){showPage(currentPage+1);}
  else{goNextChapter();}
}

function prevPage(){
  if(currentPage>0){showPage(currentPage-1);}
  else{goPrevChapter();}
}

// ═══ 章节导航 ═══
function goNextChapter(){
  var next=document.body.dataset.nextChapter;
  if(next){window.location.href=next;}
}

function goPrevChapter(){
  var prev=document.body.dataset.prevChapter;
  if(prev){window.location.href=prev;}
}

// ═══ 书签 ═══
function getBookmarks(){
  try{return JSON.parse(localStorage.getItem('fv_bookmarks')||'[]');}catch(e){return [];}
}

function saveBookmarks(bm){
  localStorage.setItem('fv_bookmarks',JSON.stringify(bm));
}

function toggleBookmark(){
  var slug=document.body.dataset.bookSlug;
  var ch=parseInt(document.body.dataset.chapterNum)||0;
  var title=document.body.dataset.chapterTitle||'';
  var bookTitle=(document.querySelector('.cp-book a')||{}).textContent||'';
  if(!slug||!ch)return;

  var bm=getBookmarks();
  var idx=bm.findIndex(function(b){return b.slug===slug&&b.chapter===ch;});
  var btn=document.getElementById('reader-bm-btn');
  if(idx>=0){
    bm.splice(idx,1);
    if(btn){btn.textContent='🔖';btn.style.color='';}
  }else{
    bm.unshift({slug:slug,chapter:ch,title:'Chapter '+ch+': '+title,bookTitle:bookTitle,time:new Date().toISOString()});
    if(btn){btn.textContent='🔖';btn.style.color='var(--gold)';}
  }
  saveBookmarks(bm);
  updateBookmarkBtn();
}

function updateBookmarkBtn(){
  var slug=document.body.dataset.bookSlug;
  var ch=parseInt(document.body.dataset.chapterNum)||0;
  var bm=getBookmarks();
  var has=bm.some(function(b){return b.slug===slug&&b.chapter===ch;});
  var btn=document.getElementById('reader-bm-btn');
  if(btn){
    btn.textContent='🔖';
    btn.style.color=has?'var(--gold)':'';
  }
}

// ═══ 章节目录侧边栏 ═══
function toggleChapterDrawer(){
  var drawer=document.getElementById('reader-drawer');
  if(!drawer)return;
  var isOpen=drawer.classList.contains('open');
  if(isOpen){drawer.classList.remove('open');}
  else{
    buildChapterList();
    drawer.classList.add('open');
  }
}

function buildChapterList(){
  var list=document.getElementById('reader-ch-list');
  if(!list)return;
  var slug=document.body.dataset.bookSlug;
  var current=parseInt(document.body.dataset.chapterNum)||0;
  var total=parseInt(document.body.dataset.totalChapters)||0;

  var bm=getBookmarks();
  var html='<div style="padding:12px 16px;font-weight:700;color:#fff;font-size:0.85rem;border-bottom:1px solid rgba(255,255,255,0.06)">📖 Chapters</div>';
  for(var i=1;i<=total;i++){
    var isCurrent=i===current;
    var isBm=bm.some(function(b){return b.slug===slug&&b.chapter===i;});
    html+='<a href="/read/'+slug+'/chapters/'+i+'" style="display:flex;align-items:center;gap:8px;padding:8px 16px;font-size:0.78rem;color:'+(isCurrent?'var(--gold)':'var(--dim)')+';text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.02);'+(isCurrent?'background:rgba(232,192,64,0.06)':'')+'">'+
      '<span style="min-width:24px;text-align:right;font-weight:600">'+i+'</span>'+
      '<span style="flex:1">Chapter '+i+'</span>'+
      (isBm?'<span>🔖</span>':'')+
      (isCurrent?'<span style="font-size:0.6rem;color:var(--gold)">▶</span>':'')+
      '</a>';
  }
  list.innerHTML=html;

  // Scroll to current
  setTimeout(function(){
    var cur=list.querySelector('[style*="var(--gold)"]');
    if(cur)cur.scrollIntoView({block:'center'});
  },100);
}

// ═══ 触屏滑动 ═══
var touchStartX=0,touchStartY=0;
function initTouch(){
  var content=document.getElementById('reader-content');
  if(!content)return;
  content.addEventListener('touchstart',function(e){
    touchStartX=e.touches[0].clientX;
    touchStartY=e.touches[0].clientY;
  });
  content.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-touchStartX;
    var dy=e.changedTouches[0].clientY-touchStartY;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50){
      if(dx<0)nextPage();else prevPage();
    }
  });
  // Keyboard nav
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();nextPage();}
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();prevPage();}
  });
}

// ═══ 阅读器初始化 ═══
function initReader(){
  var content=document.getElementById('reader-content');
  if(!content)return;
  loadSettings();

  // Save original content for page mode
  var originalHTML=content.innerHTML;
  content.setAttribute('data-original',originalHTML);

  // Apply mode
  if(RS.mode==='page'){
    buildPages();
    initTouch();
  }

  // Update toolbar
  updateBookmarkBtn();
  var modeBtn=document.getElementById('reader-mode-btn');
  if(modeBtn)modeBtn.textContent=RS.mode==='page'?'📖':'📜';

  // Save reading progress on unload
  window.addEventListener('beforeunload',function(){
    var slug=document.body.dataset.bookSlug;
    var ch=parseInt(document.body.dataset.chapterNum)||0;
    if(slug&&ch){
      var p=getProgress();
      p[slug]={chapter:ch,page:currentPage,updatedAt:new Date().toISOString()};
      localStorage.setItem('fv_reading_pos',JSON.stringify(p));
    }
  });
}

function getProgress(){
  try{return JSON.parse(localStorage.getItem('fv_reading_pos')||'{}');}catch(e){return {};}
}

// ═══ 工具栏事件绑定 ═══
window.readerFontDown=function(){
  RS.fontSize=Math.max(12,RS.fontSize-2);
  saveSettings();
  if(RS.mode==='page')buildPages();
};

window.readerFontUp=function(){
  RS.fontSize=Math.min(32,RS.fontSize+2);
  saveSettings();
  if(RS.mode==='page')buildPages();
};

window.readerToggleTheme=function(){
  RS.theme=RS.theme==='dark'?'light':'dark';
  saveSettings();
};

window.readerToggleMode=function(){
  var content=document.getElementById('reader-content');
  if(!content)return;
  RS.mode=RS.mode==='page'?'scroll':'page';
  saveSettings();

  var btn=document.getElementById('reader-mode-btn');
  if(btn)btn.textContent=RS.mode==='page'?'📖':'📜';

  var pageNav=document.getElementById('reader-page-nav');
  if(pageNav)pageNav.style.display=RS.mode==='page'?'flex':'none';

  if(RS.mode==='scroll'){
    // Restore full content
    var orig=content.getAttribute('data-original');
    if(orig)content.innerHTML=orig;
    content.style.display='';
    pages=[];totalPages=0;
  }else{
    // Save full content, build pages
    if(!content.getAttribute('data-original')){
      content.setAttribute('data-original',content.innerHTML);
    }
    buildPages();
    initTouch();
  }
};

window.readerToggleChapter=function(){
  toggleChapterDrawer();
};

// ═══ 收藏 ═══
function initFavorites(){
  var btns=document.querySelectorAll('.fv-fav-btn');
  if(!btns.length)return;
  var slug=document.body.dataset.bookSlug;
  if(!slug)return;

  api('/api/favorites?reader_id='+RID).then(function(data){
    if(!data)return;
    var isFav=data.some(function(f){return f.book_slug===slug;});
    btns.forEach(function(b){
      b.dataset.fav=isFav?'1':'0';
      b.innerHTML=isFav?'❤️ Saved':'🤍 Save';
      b.classList.toggle('favd',isFav);
    });
  });

  btns.forEach(function(b){
    b.addEventListener('click',function(){
      var slug=document.body.dataset.bookSlug;
      var isFav=b.dataset.fav==='1';
      if(isFav){
        api('/api/favorites/'+slug+'?reader_id='+RID,'DELETE').then(function(){
          b.dataset.fav='0';b.innerHTML='🤍 Save';b.classList.remove('favd');
        });
      }else{
        api('/api/favorites','POST',{book_slug:slug,reader_id:RID}).then(function(){
          b.dataset.fav='1';b.innerHTML='❤️ Saved';b.classList.add('favd');
        });
      }
    });
  });
}

// ═══ 评分+评论 ═══
function initReviews(){
  var section=document.getElementById('fv-reviews');
  if(!section)return;
  var slug=document.body.dataset.bookSlug;
  if(!slug)return;

  loadReviews(slug);

  var form=section.querySelector('.fv-review-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var rating=parseInt(form.querySelector('[name=rating]').value);
      var content=form.querySelector('[name=content]').value.trim();
      var name=form.querySelector('[name=name]').value.trim()||'Reader';
      if(!rating){alert('Please select a rating');return;}
      api('/api/books/'+slug+'/reviews','POST',{
        reader_id:RID,reader_name:name,rating:rating,content:content
      }).then(function(r){
        if(r&&r.ok){loadReviews(slug);form.reset();}
      });
    });
  }

  var stars=section.querySelectorAll('.fv-star');
  stars.forEach(function(s){
    s.addEventListener('click',function(){
      var v=parseInt(s.dataset.v);
      document.getElementById('fv-rating-val').value=v;
      stars.forEach(function(x){x.classList.toggle('on',parseInt(x.dataset.v)<=v);});
    });
  });
}

function loadReviews(slug){
  api('/api/books/'+slug+'/reviews').then(function(d){
    if(!d)return;
    var list=document.querySelector('#fv-review-list');
    var avgEl=document.querySelector('#fv-avg-rating');
    var cntEl=document.querySelector('#fv-review-count');

    if(avgEl)avgEl.innerHTML=renderStars(Math.round(d.avg_rating||0))+' '+(d.avg_rating||0).toFixed(1);
    if(cntEl)cntEl.textContent=(d.total||0)+' reviews';

    if(list){
      if(!d.reviews||!d.reviews.length){
        list.innerHTML='<p style="color:var(--dim);font-size:0.82rem">No reviews yet. Be the first!</p>';
        return;
      }
      list.innerHTML=d.reviews.map(function(r){
        var d2=new Date(r.created_at+'Z');
        return '<div class="fv-review-item">'+
          '<div class="fv-review-head"><span class="fv-review-name">'+esc(r.reader_name)+'</span>'+
          '<span class="fv-review-stars">'+renderStars(r.rating)+'</span>'+
          '<span class="fv-review-date">'+d2.toLocaleDateString()+'</span></div>'+
          (r.content?'<div class="fv-review-body">'+esc(r.content)+'</div>':'')+
          '</div>';
      }).join('');
    }
  });
}

function renderStars(n){
  var h='';
  for(var i=1;i<=5;i++)h+=i<=n?'★':'☆';
  return h;
}

function esc(s){return s.replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ═══ 阅读进度 ═══
function initProgress(){
  var slug=document.body.dataset.bookSlug;
  var ch=parseInt(document.body.dataset.chapterNum)||0;
  if(!slug||!ch)return;

  var p=getProgress();
  p[slug]={chapter:ch,page:currentPage,title:document.body.dataset.chapterTitle||'',updatedAt:new Date().toISOString()};
  localStorage.setItem('fv_progress_v2',JSON.stringify(p));

  api('/api/progress','PUT',{book_slug:slug,reader_id:RID,chapter_num:ch});
}

// ═══ 书架页面 ═══
function initBookshelf(){
  var page=document.getElementById('fv-bookshelf');
  if(!page)return;

  api('/api/favorites?reader_id='+RID).then(function(data){
    var grid=document.getElementById('fv-shelf-grid');
    var empty=document.getElementById('fv-shelf-empty');
    if(!grid)return;

    if(!data||!data.length){
      if(empty)empty.style.display='block';
      grid.innerHTML='';
      return;
    }
    if(empty)empty.style.display='none';
    grid.innerHTML=data.map(function(f){
      return '<article class="bk" style="position:relative">'+
        '<a href="/read/'+f.book_slug+'/chapters/'+(f.read_up_to+1)+'" class="bk-cv"><img src="'+f.cover+'" alt="" loading="lazy"></a>'+
        '<div class="bk-bd">'+
        '<div class="bk-genre">'+f.genre+'</div>'+
        '<h2 class="bk-title"><a href="/read/'+f.book_slug+'/chapters/'+(f.read_up_to+1)+'">'+esc(f.title)+'</a></h2>'+
        '<div class="bk-author">by '+esc(f.author)+'</div>'+
        '<div class="bk-meta"><span class="bk-rating">★ '+Number(f.rating).toFixed(1)+'</span>'+
        '<span style="margin-left:8px;font-size:0.65rem;color:var(--dim)">'+f.status+'</span></div>'+
        '</div></article>';
    }).join('');
  });
}

// ═══ 签到系统 ═══
function initCheckin(){
  var shelf=document.getElementById('fv-bookshelf');
  var container=shelf||document.querySelector('.cp-hd');
  if(!container)return;
  if(document.getElementById('fv-checkin-widget'))return;

  var widget=document.createElement('div');
  widget.id='fv-checkin-widget';
  widget.innerHTML='<div style="background:rgba(79,140,255,0.06);border:1px solid rgba(79,140,255,0.15);border-radius:10px;padding:12px 16px;margin-bottom:16px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between">'+
    '<div><span style="font-weight:700;color:#fff;font-size:0.85rem">📅 Daily Check-in</span>'+
    '<span id="fv-checkin-status" style="font-size:0.68rem;color:var(--dim);margin-left:8px">Loading...</span></div>'+
    '<button id="fv-checkin-btn" onclick="doCheckin()" style="padding:6px 18px;border-radius:20px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:0.78rem;font-family:inherit">Check In</button>'+
    '</div>'+
    '<div id="fv-checkin-streak" style="margin-top:8px;font-size:0.65rem;color:var(--dim)"></div>'+
    '<div id="fv-checkin-cal" style="display:flex;gap:4px;margin-top:8px"></div>'+
    '</div>';

  if(shelf){container.parentNode.insertBefore(widget,container);}
  else{container.parentNode.insertBefore(widget,container);}

  loadCheckinStatus();
}

window.doCheckin=function(){
  var btn=document.getElementById('fv-checkin-btn');
  if(!btn)return;btn.disabled=true;btn.textContent='...';
  api('/api/checkin','POST',{reader_id:RID}).then(function(r){
    if(r&&r.ok){loadCheckinStatus();}
    else{btn.textContent='✓ Done';setTimeout(function(){btn.disabled=false;btn.textContent='Check In';},2000);}
  });
};

function loadCheckinStatus(){
  api('/api/checkin?reader_id='+RID).then(function(d){
    if(!d)return;
    var status=document.getElementById('fv-checkin-status');
    var btn=document.getElementById('fv-checkin-btn');
    var streakEl=document.getElementById('fv-checkin-streak');
    var cal=document.getElementById('fv-checkin-cal');
    if(status)status.textContent=d.checked_in_today?'✅ +'+d.today_points+' pts':(d.current_streak>0?'🔥 Day '+d.current_streak:'Ready');
    if(btn){btn.textContent=d.checked_in_today?'✓ Done':'Check In';btn.disabled=d.checked_in_today;btn.style.background=d.checked_in_today?'var(--green)':'';}
    if(streakEl)streakEl.textContent='🔥 '+d.current_streak+' day streak | ⭐ '+d.total_points+' total pts | 🏆 Best: '+d.longest_streak+' days';
    if(cal&&d.recent_checkins){
      cal.innerHTML='';
      for(var i=6;i>=0;i--){
        var dt=new Date(Date.now()-i*86400000).toISOString().split('T')[0];
        var found=d.recent_checkins.find(function(c){return c.date===dt;});
        cal.innerHTML+='<span style="width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:0.55rem;'+
          (found?'background:rgba(52,199,89,0.2);color:var(--green);border:1px solid rgba(52,199,89,0.3)':
            dt===new Date().toISOString().split('T')[0]?'background:rgba(255,255,255,0.03);border:1px dashed rgba(255,255,255,0.1);color:var(--dim)':
            'background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.1)')+
          '">'+(found?'✓':(i===0?'●':''))+'</span>';
      }
    }
  });
}

// ═══ 社区论坛 ═══
function initForum(){
  var forum=document.getElementById('fv-forum');
  if(!forum)return;
  loadTopics();
}

window.postTopic=function(e){
  e.preventDefault();
  var title=document.getElementById('fv-topic-title').value.trim();
  if(!title)return;
  api('/api/forum/topics','POST',{reader_id:RID,reader_name:'Reader',title:title}).then(function(r){
    if(r&&r.ok){document.getElementById('fv-topic-title').value='';loadTopics();}
  });
};

function loadTopics(){
  var list=document.getElementById('fv-forum-list');
  if(!list)return;
  api('/api/forum/topics').then(function(data){
    if(!data||!data.length){list.innerHTML='<p>No discussions yet. Start one!</p>';return;}
    list.innerHTML=data.map(function(t){
      var d=new Date(t.created_at+'Z');
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer" onclick="viewTopic('+t.id+')">'+
        '<div style="font-weight:600;color:#fff;font-size:0.85rem">'+esc(t.title)+'</div>'+
        '<div style="font-size:0.65rem;color:var(--dim);margin-top:2px">by '+esc(t.reader_name)+' · '+d.toLocaleDateString()+' · '+t.reply_count+' replies</div>'+
        '</div>';
    }).join('');
  });
}

window.viewTopic=function(id){
  api('/api/forum/topics/'+id).then(function(t){
    if(!t)return;
    var list=document.getElementById('fv-forum-list');
    var d=new Date(t.created_at+'Z');
    var html='<div style="margin-bottom:12px"><a href="#" onclick="loadTopics();return false" style="font-size:0.72rem;color:var(--accent)">← Back</a></div>'+
      '<div style="background:rgba(255,255,255,0.02);border-radius:8px;padding:12px;margin-bottom:16px">'+
      '<h3 style="color:#fff;font-size:0.95rem">'+esc(t.title)+'</h3>'+
      '<p style="font-size:0.65rem;color:var(--dim);margin-top:4px">'+esc(t.reader_name)+' · '+d.toLocaleString()+'</p></div>';
    (t.posts||[]).forEach(function(p){
      var dp=new Date(p.created_at+'Z');
      html+='<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)">'+
        '<div style="font-size:0.7rem;color:var(--dim);margin-bottom:4px"><strong style="color:#fff">'+esc(p.reader_name)+'</strong> · '+dp.toLocaleString()+'</div>'+
        '<div style="font-size:0.8rem;color:var(--dim);line-height:1.5">'+esc(p.content)+'</div></div>';
    });
    html+='<form onsubmit="replyTopic(event,'+id+')" style="margin-top:12px;display:flex;gap:8px">'+
      '<input id="fv-reply-input" placeholder="Write a reply..." style="flex:1;padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.78rem;font-family:inherit">'+
      '<button type="submit" style="padding:6px 16px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:0.78rem;font-family:inherit">Reply</button></form>';
    list.innerHTML=html;
  });
};

window.replyTopic=function(e,id){
  e.preventDefault();
  var content=document.getElementById('fv-reply-input').value.trim();
  if(!content)return;
  api('/api/forum/topics/'+id+'/posts','POST',{reader_id:RID,reader_name:'Reader',content:content}).then(function(r){
    if(r&&r.ok){viewTopic(id);}
  });
};

// ═══ 打赏礼物 ═══
function initGifts(){
  var favBtn=document.querySelector('.fv-fav-btn');
  if(!favBtn)return;
  if(document.getElementById('fv-gift-btn'))return;

  var giftBtn=document.createElement('button');
  giftBtn.id='fv-gift-btn';
  giftBtn.textContent='🎁 Tip';
  giftBtn.style.cssText=favBtn.style.cssText;
  giftBtn.style.marginLeft='8px';
  giftBtn.onclick=function(){showGiftPanel();};
  favBtn.parentNode.appendChild(giftBtn);

  var revSection=document.getElementById('fv-reviews');
  if(revSection){
    var giftRank=document.createElement('div');
    giftRank.id='fv-gift-rank';
    giftRank.style.cssText='margin-bottom:12px';
    revSection.parentNode.insertBefore(giftRank,revSection);
    loadGiftRank();
  }
}

function showGiftPanel(){
  var slug=document.body.dataset.bookSlug;
  var existing=document.getElementById('fv-gift-popup');
  if(existing){existing.remove();return;}

  api('/api/points?reader_id='+RID).then(function(p){
    if(!p)p={total_points:0};
    var popup=document.createElement('div');
    popup.id='fv-gift-popup';
    popup.style.cssText='position:fixed;bottom:20px;right:20px;z-index:100;background:var(--card);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;max-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
    popup.innerHTML='<h4 style="color:#fff;margin-bottom:8px;font-size:0.85rem">🎁 Tip the Author</h4>'+
      '<p style="font-size:0.65rem;color:var(--dim);margin-bottom:8px">⭐ Your balance: <strong style="color:var(--gold)">'+p.total_points+' pts</strong></p>'+
      '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">'+
      '<button onclick="sendGift(\''+slug+'\',10)" class="fv-gift-opt" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer;font-size:0.7rem;font-family:inherit">10 ⭐</button>'+
      '<button onclick="sendGift(\''+slug+'\',50)" class="fv-gift-opt" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer;font-size:0.7rem;font-family:inherit">50 ⭐</button>'+
      '<button onclick="sendGift(\''+slug+'\',100)" class="fv-gift-opt" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer;font-size:0.7rem;font-family:inherit">100 ⭐</button>'+
      '</div>'+
      '<input id="fv-gift-msg" placeholder="Add a message..." style="width:100%;padding:5px 8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.7rem;font-family:inherit">'+
      '<div id="fv-gift-status" style="font-size:0.62rem;color:var(--dim);margin-top:6px"></div>';
    document.body.appendChild(popup);
  });
}

window.sendGift=function(slug,pts){
  var msg=document.getElementById('fv-gift-msg').value.trim();
  api('/api/gifts','POST',{book_slug:slug,reader_id:RID,reader_name:'Reader',points:pts,message:msg}).then(function(r){
    var st=document.getElementById('fv-gift-status');
    if(r&&r.ok){
      st.textContent='✅ Sent '+pts+' pts! Balance: '+r.remaining_points;
      var popup=document.getElementById('fv-gift-popup');
      if(popup)setTimeout(function(){popup.remove();},1500);
      loadGiftRank();
    }else{
      st.textContent='❌ '+(r?r.error:'Failed');
    }
  });
};

function loadGiftRank(){
  var slug=document.body.dataset.bookSlug;
  var rank=document.getElementById('fv-gift-rank');
  if(!slug||!rank)return;
  api('/api/gifts/'+slug).then(function(d){
    if(!d||!d.total_points){rank.innerHTML='';return;}
    rank.innerHTML='<div style="background:rgba(232,192,64,0.06);border:1px solid rgba(232,192,64,0.12);border-radius:8px;padding:10px 14px">'+
      '<span style="font-size:0.78rem;color:var(--gold);font-weight:600">🎁 '+d.total_points+' pts tipped</span>'+
      (d.gifts&&d.gifts.length?' <span style="font-size:0.65rem;color:var(--dim)">by '+(d.gifts.slice(0,3).map(function(g){return g.reader_name;}).join(', '))+(d.gifts.length>3?'...':'')+'</span>':'')+
      '</div>';
  });
}

// ═══ 浏览追踪 ═══
function trackPageview(){
  var slug=document.body.dataset.bookSlug;
  var ch=parseInt(document.body.dataset.chapterNum)||0;
  if(!slug)return;
  api('/api/track/pageview','POST',{book_slug:slug,chapter_num:ch,reader_id:RID});
}

// ═══ 推送通知 ═══
function initPush(){
  if(!('Notification' in window))return;
  if(Notification.permission==='default'){
    setTimeout(function(){Notification.requestPermission();},30000);
  }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }
}

// ═══ 阅读历史 ═══
function initReadingHistory(){
  var slug=document.body.dataset.bookSlug;
  var ch=parseInt(document.body.dataset.chapterNum)||0;
  var title=document.body.dataset.chapterTitle||'';
  if(!slug||!ch)return;
  var hist=getReadingHistory();
  hist.unshift({slug:slug,chapter:ch,title:title,time:new Date().toISOString()});
  var seen={};hist=hist.filter(function(h){var k=h.slug+'|'+h.chapter;if(seen[k])return false;seen[k]=true;return true;}).slice(0,50);
  localStorage.setItem('fv_reading_history',JSON.stringify(hist));
}

function getReadingHistory(){
  try{return JSON.parse(localStorage.getItem('fv_reading_history')||'[]');}
  catch(e){return [];}
}

// ═══ 启动 ═══
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{init();}

function init(){
  initReader();
  initFavorites();
  initReviews();
  initProgress();
  initBookshelf();
  initCheckin();
  initForum();
  initGifts();
  trackPageview();
  initPush();
  initReadingHistory();
  // Resize handler for page mode
  window.addEventListener('resize',function(){
    if(RS.mode==='page')buildPages();
  });
}

})();
