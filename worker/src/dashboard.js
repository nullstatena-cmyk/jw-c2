/* ==========================================================================
   The dashboard page, served by the Worker at /dashboard.

   Exported as a string because a Worker cannot serve static files. The page
   itself holds no secret — it asks for the sync token on first load, keeps it
   in localStorage, and sends it as a Bearer header on every request. Anyone
   can open this URL; without the token they see a login box and nothing else.
   ========================================================================== */

export const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>J.W. Cleaning — Inbox</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --ink:#0F2438; --ink-soft:#40566B; --blue:#1D5FA8; --blue-bright:#3D8FD6;
    --wash:#EEF4F9; --white:#fff; --rule:#C9D9E7; --amber:#C98A16; --green:#1B7F4C;
  }
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;background:var(--wash);color:var(--ink);
       font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:15px;line-height:1.55}
  h1,h2,h3{font-family:'Archivo',sans-serif;font-weight:800;letter-spacing:-.02em;margin:0}
  .bar{background:var(--white);border-bottom:1px solid var(--rule);position:sticky;top:0;z-index:10}
  .bar__in{max-width:900px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;gap:14px}
  .bar h1{font-size:1.05rem;margin-right:auto}
  .bar h1 span{color:var(--blue)}
  .shell{max-width:900px;margin:0 auto;padding:20px 18px 60px}
  button{font-family:inherit;cursor:pointer}
  .btn{background:var(--blue);color:#fff;border:none;border-radius:3px;padding:10px 16px;
       font-family:'Archivo',sans-serif;font-weight:700;font-size:.88rem}
  .btn:hover{background:#123B6B}
  .btn--ghost{background:transparent;color:var(--blue);border:1px solid var(--rule)}
  .btn--ghost:hover{background:var(--wash)}
  .btn--sm{padding:6px 12px;font-size:.8rem}
  input{font-family:inherit;font-size:1rem;padding:11px 13px;border:1px solid var(--rule);
        border-radius:3px;width:100%;background:#fff;color:var(--ink)}
  input:focus{outline:2px solid var(--blue-bright);outline-offset:1px;border-color:var(--blue)}

  .gate{max-width:380px;margin:16vh auto;background:#fff;border:1px solid var(--rule);
        border-radius:4px;padding:30px 28px}
  .gate h2{font-size:1.3rem;margin-bottom:8px}
  .gate p{color:var(--ink-soft);font-size:.92rem;margin:0 0 18px}
  .gate .btn{width:100%;margin-top:12px;padding:12px}

  .tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap}
  .tab{background:#fff;border:1px solid var(--rule);border-radius:3px;padding:8px 14px;
       font-size:.88rem;color:var(--ink)}
  .tab[aria-pressed="true"]{background:var(--blue);border-color:var(--blue);color:#fff;font-weight:600}
  .count{font-family:'IBM Plex Mono',monospace;font-size:.75rem;opacity:.75;margin-left:5px}

  .lead{background:#fff;border:1px solid var(--rule);border-radius:4px;margin-bottom:12px;
        overflow:hidden}
  .lead__top{padding:16px 18px;display:flex;align-items:flex-start;gap:12px;cursor:pointer}
  .lead__main{flex:1;min-width:0}
  .lead__name{font-family:'Archivo',sans-serif;font-weight:700;font-size:1.05rem;
              display:block;margin-bottom:3px}
  .lead__sub{color:var(--ink-soft);font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .lead__when{font-family:'IBM Plex Mono',monospace;font-size:.74rem;color:var(--ink-soft);
              text-align:right;flex:none;line-height:1.4}
  .chip{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:.66rem;
        letter-spacing:.09em;text-transform:uppercase;padding:3px 7px;border-radius:2px;
        margin-right:6px;vertical-align:1px}
  .chip--quote{background:var(--blue);color:#fff}
  .chip--review{background:var(--ink);color:#fff}
  .chip--pending{background:#FFF6E6;color:var(--amber);border:1px solid #F0DCB0}
  .chip--approved{background:#E8F5EE;color:var(--green);border:1px solid #BFE0CD}
  .chip--rejected{background:#FDEDED;color:#B3261E;border:1px solid #F3C9C7}

  .lead__body{display:none;border-top:1px solid var(--rule);padding:16px 18px;background:#FBFDFF}
  .lead[data-open="true"] .lead__body{display:block}
  .kv{display:grid;grid-template-columns:150px 1fr;gap:6px 14px;margin-bottom:16px}
  .kv dt{font-family:'IBM Plex Mono',monospace;font-size:.72rem;letter-spacing:.07em;
         text-transform:uppercase;color:var(--ink-soft);padding-top:2px}
  .kv dd{margin:0;word-break:break-word}
  .kv dd a{color:var(--blue)}
  .acts{display:flex;gap:8px;flex-wrap:wrap}

  .msg{background:#fff;border:1px solid var(--rule);border-radius:4px;padding:34px 26px;
       text-align:center;color:var(--ink-soft)}
  .err{background:#FDEDED;border-left:3px solid #B3261E;padding:13px 15px;border-radius:3px;
       margin-bottom:16px;font-size:.92rem}
  @media(max-width:560px){
    .kv{grid-template-columns:1fr;gap:2px 0}
    .kv dd{margin-bottom:9px}
    .lead__when{font-size:.68rem}
  }
</style>
</head>
<body>

<div id="gate" class="gate" hidden>
  <h2>Inbox</h2>
  <p>Enter the access token to view submissions.</p>
  <input id="token" type="password" placeholder="Access token" autocomplete="current-password">
  <button class="btn" id="unlock">Unlock</button>
  <div id="gateErr" class="err" style="display:none;margin:14px 0 0"></div>
</div>

<div id="app" hidden>
  <div class="bar"><div class="bar__in">
    <h1>J.W. <span>Inbox</span></h1>
    <button class="btn btn--ghost btn--sm" id="refresh">Refresh</button>
    <button class="btn btn--ghost btn--sm" id="signout">Sign out</button>
  </div></div>

  <div class="shell">
    <div class="tabs">
      <button class="tab" data-filter="all" aria-pressed="true">All<span class="count" id="cAll"></span></button>
      <button class="tab" data-filter="quote" aria-pressed="false">Quotes<span class="count" id="cQuote"></span></button>
      <button class="tab" data-filter="review" aria-pressed="false">Reviews<span class="count" id="cReview"></span></button>
    </div>
    <div id="list"><div class="msg">Loading…</div></div>
  </div>
</div>

<script>
(function(){
  var KEY='jw_dash_token', token=localStorage.getItem(KEY)||'', items=[], filter='all';
  var $=function(id){return document.getElementById(id)};

  function show(el,on){el.hidden=!on}

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function when(iso){
    var d=new Date(iso), now=new Date(), mins=Math.round((now-d)/60000);
    var rel = mins<1?'just now' : mins<60?mins+'m ago'
            : mins<1440?Math.round(mins/60)+'h ago'
            : Math.round(mins/1440)+'d ago';
    return rel+'<br>'+d.toLocaleDateString(undefined,{month:'short',day:'numeric'})
             +' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
  }

  var LABELS={name:'Name',email:'Email',phone:'Phone',address:'Address',
    property_type:'Property type',stories:'Floors',scope:'Window types',
    window_count:'Window count',sides:'Inside / outside',frequency:'How often',
    notes:'Notes',property:'Property / area',role:'Role',rating:'Rating',body:'Review'};
  var ORDER=['name','email','phone','address','property_type','stories','scope',
    'window_count','sides','frequency','notes','property','role','rating','body'];

  function api(path,opts){
    opts=opts||{};
    opts.headers=Object.assign({'Authorization':'Bearer '+token},opts.headers||{});
    return fetch(path,opts).then(function(r){
      if(r.status===401){throw new Error('unauthorised');}
      if(!r.ok){throw new Error('HTTP '+r.status);}
      return r.json();
    });
  }

  function render(){
    var list=$('list');
    var shown=items.filter(function(i){return filter==='all'||i.kind===filter});

    $('cAll').textContent=items.length;
    $('cQuote').textContent=items.filter(function(i){return i.kind==='quote'}).length;
    $('cReview').textContent=items.filter(function(i){return i.kind==='review'}).length;

    if(!shown.length){
      list.innerHTML='<div class="msg">Nothing here yet.</div>';
      return;
    }

    list.innerHTML=shown.map(function(it){
      var p=it.payload||{};
      var sub = it.kind==='quote'
        ? [p.address,p.property_type,p.window_count?p.window_count+' windows':''].filter(Boolean).join(' · ')
        : [p.property,p.role,p.rating?p.rating+'/5':''].filter(Boolean).join(' · ');

      var state=it.review_state||'pending';
      var chips='<span class="chip chip--'+it.kind+'">'+it.kind+'</span>';
      if(it.kind==='review') chips+='<span class="chip chip--'+state+'">'+state+'</span>';

      var rows=ORDER.filter(function(k){return p[k]!=null&&p[k]!==''}).map(function(k){
        var v=p[k];
        if(Array.isArray(v)) v=v.join(', ');
        if(k==='email') v='<a href="mailto:'+esc(v)+'">'+esc(v)+'</a>';
        else if(k==='phone') v='<a href="tel:'+esc(String(v).replace(/[^0-9+]/g,''))+'">'+esc(v)+'</a>';
        else if(k==='address') v='<a href="https://maps.google.com/?q='+encodeURIComponent(v)+'" target="_blank" rel="noopener">'+esc(v)+'</a>';
        else v=esc(v);
        return '<dt>'+esc(LABELS[k]||k)+'</dt><dd>'+v+'</dd>';
      }).join('');

      var acts='';
      if(p.phone) acts+='<a class="btn btn--sm" href="tel:'+esc(String(p.phone).replace(/[^0-9+]/g,''))+'">Call</a>';
      if(p.email) acts+='<a class="btn btn--sm btn--ghost" href="mailto:'+esc(p.email)+'">Email</a>';
      if(it.kind==='review'){
        acts+='<button class="btn btn--sm btn--ghost" data-act="approved" data-id="'+esc(it.id)+'">Approve</button>';
        acts+='<button class="btn btn--sm btn--ghost" data-act="rejected" data-id="'+esc(it.id)+'">Reject</button>';
      }

      return '<div class="lead" data-open="false">'
        +'<div class="lead__top">'
          +'<div class="lead__main">'
            +'<span class="lead__name">'+chips+esc(p.name||'No name')+'</span>'
            +'<span class="lead__sub">'+esc(sub||'—')+'</span>'
          +'</div>'
          +'<div class="lead__when">'+when(it.received_at)+'</div>'
        +'</div>'
        +'<div class="lead__body"><dl class="kv">'+rows+'</dl>'
        +'<div class="acts">'+acts+'</div></div>'
      +'</div>';
    }).join('');
  }

  function load(){
    api('/all').then(function(d){
      items=d.items||[];
      render();
    }).catch(function(e){
      if(e.message==='unauthorised'){ signout('Token not accepted.'); return; }
      $('list').innerHTML='<div class="err">Could not load: '+esc(e.message)+'</div>';
    });
  }

  function signout(msg){
    localStorage.removeItem(KEY); token='';
    show($('app'),false); show($('gate'),true);
    if(msg){ $('gateErr').textContent=msg; $('gateErr').style.display='block'; }
  }

  document.addEventListener('click',function(e){
    var top=e.target.closest('.lead__top');
    if(top){
      var lead=top.parentNode;
      lead.setAttribute('data-open', lead.getAttribute('data-open')==='true'?'false':'true');
      return;
    }
    var act=e.target.closest('[data-act]');
    if(act){
      api('/review-state',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:act.dataset.id,state:act.dataset.act})}).then(load);
    }
  });

  document.querySelectorAll('.tab').forEach(function(t){
    t.addEventListener('click',function(){
      filter=t.dataset.filter;
      document.querySelectorAll('.tab').forEach(function(x){
        x.setAttribute('aria-pressed', String(x===t));
      });
      render();
    });
  });

  $('unlock').addEventListener('click',function(){
    var v=$('token').value.trim();
    if(!v) return;
    token=v; localStorage.setItem(KEY,v);
    $('gateErr').style.display='none';
    show($('gate'),false); show($('app'),true);
    load();
  });
  $('token').addEventListener('keydown',function(e){ if(e.key==='Enter') $('unlock').click(); });
  $('refresh').addEventListener('click',load);
  $('signout').addEventListener('click',function(){ signout(); });

  if(token){ show($('app'),true); load(); } else { show($('gate'),true); }
})();
</script>
</body>
</html>`;
