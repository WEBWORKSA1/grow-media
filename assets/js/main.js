/* Grow.Media — core interactions (no dependencies) */
(function(){
  "use strict";
  var d=document, w=window, $=function(s,c){return (c||d).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
  var ROOT=(d.documentElement.getAttribute("data-root")||"");

  /* ---------- Private inbox route (never rendered as text) ---------- */
  var _k=[112,114,102,49,111,108,100,112,106,67,52,100,118,110,117,114,122,101,104,122];
  function inbox(){return _k.slice().reverse().map(function(c){return String.fromCharCode(c-3)}).join("")}
  function endpoint(){return "https://formsubmit.co/ajax/"+inbox()}
  w.GM={openMail:function(subject){w.location.href="mail"+"to:"+inbox()+"?subject="+encodeURIComponent(subject||"Grow.Media inquiry")}};

  /* ---------- Storage helpers (safe) ---------- */
  function sget(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function sset(k,v){try{localStorage.setItem(k,v)}catch(e){}}

  /* ---------- Theme ---------- */
  var themeBtn=$("#themeToggle");
  function setTheme(t){d.documentElement.setAttribute("data-theme",t);sset("gm-theme",t);if(themeBtn)themeBtn.setAttribute("aria-label",t==="dark"?"Switch to light mode":"Switch to dark mode")}
  var saved=sget("gm-theme");
  if(saved)setTheme(saved);else if(w.matchMedia&&w.matchMedia("(prefers-color-scheme: dark)").matches)setTheme("dark");
  if(themeBtn)themeBtn.addEventListener("click",function(){setTheme(d.documentElement.getAttribute("data-theme")==="dark"?"light":"dark")});

  /* ---------- Mobile menu & dropdowns ---------- */
  var burger=$("#burger"), menu=$("#menu");
  if(burger&&menu)burger.addEventListener("click",function(){var o=menu.classList.toggle("open");burger.setAttribute("aria-expanded",o)});
  $$(".menu button.nl").forEach(function(b){b.addEventListener("click",function(){var li=b.parentNode;var o=li.classList.toggle("open");b.setAttribute("aria-expanded",o);$$(".menu li.open").forEach(function(x){if(x!==li)x.classList.remove("open")})})});
  d.addEventListener("click",function(e){if(!e.target.closest(".menu"))$$(".menu li.open").forEach(function(x){x.classList.remove("open")})});

  /* ---------- Mail links ---------- */
  $$("[data-mail]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();GM.openMail(a.getAttribute("data-mail"))})});

  /* ---------- Toast ---------- */
  function toast(msg){var t=d.createElement("div");t.className="card";t.setAttribute("role","status");t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;padding:14px 18px;font-weight:600";t.textContent=msg;d.body.appendChild(t);setTimeout(function(){t.remove()},3200)}

  /* ---------- Forms (AJAX → private inbox) ---------- */
  $$("form.gm-form").forEach(function(f){
    var status=$(".form-status",f);
    if(!status){status=d.createElement("div");status.className="form-status";status.setAttribute("role","status");status.setAttribute("aria-live","polite");f.appendChild(status)}
    f.addEventListener("submit",function(e){
      e.preventDefault();
      if(f.checkValidity&&!f.checkValidity()){f.reportValidity();return}
      var hp=f.querySelector("[name=_honey]");if(hp&&hp.value)return;
      var fd=new FormData(f), data={};
      fd.forEach(function(v,k){if(k==="_honey")return;data[k]=data[k]?data[k]+", "+v:v});
      data._subject="[Grow.Media] "+(f.getAttribute("data-subject")||"Website form");
      data._template="table"; data._captcha="false";
      data["Page"]=d.title+" — "+w.location.href;
      var btn=f.querySelector("[type=submit]"), txt=btn?btn.innerHTML:"";
      if(btn){btn.disabled=true;btn.innerHTML="Sending…"}
      status.className="form-status";
      fetch(endpoint(),{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {success:r.ok}})})
        .then(function(j){
          var ok=j&&(j.success===true||j.success==="true");
          status.className="form-status "+(ok?"ok":"err");
          status.textContent=ok?(f.getAttribute("data-ok")||"Thank you! Your message is in. We'll be in touch shortly."):"We couldn't send that just now. Please try again in a minute.";
          if(ok){f.reset();var go=f.getAttribute("data-redirect");if(go)setTimeout(function(){w.location.href=ROOT+go},900)}
        })
        .catch(function(){status.className="form-status err";status.textContent="Network issue. Please check your connection and try again."})
        .then(function(){if(btn){btn.disabled=false;btn.innerHTML=txt}});
    });
  });

  /* ---------- Multi-step wizard ---------- */
  $$("[data-wizard]").forEach(function(wz){
    var steps=$$(".wiz-step",wz), bar=$(".steps-bar i",wz), i=0, label=$("[data-step-label]",wz);
    function show(n){steps.forEach(function(s,k){s.classList.toggle("active",k===n)});i=n;if(bar)bar.style.width=((n+1)/steps.length*100)+"%";if(label)label.textContent="Step "+(n+1)+" of "+steps.length;
      var first=steps[n].querySelector("input,select,textarea");if(first&&n>0)first.focus({preventScroll:true})}
    function valid(n){var ok=true;$$("input,select,textarea",steps[n]).forEach(function(el){if(!el.checkValidity()){ok=false}});
      if(!ok){var bad=$$("input,select,textarea",steps[n]).filter(function(el){return !el.checkValidity()})[0];if(bad)bad.reportValidity()}return ok}
    $$("[data-next]",wz).forEach(function(b){b.addEventListener("click",function(){if(valid(i)&&i<steps.length-1){show(i+1);score()}})});
    $$("[data-prev]",wz).forEach(function(b){b.addEventListener("click",function(){if(i>0)show(i-1)})});
    $$(".opt input[type=radio]",wz).forEach(function(r){r.addEventListener("change",function(){score();var s=r.closest(".wiz-step");if(s&&s.hasAttribute("data-auto")&&i<steps.length-1)setTimeout(function(){show(i+1)},220)})});
    function score(){var out=$("[data-score]",wz);if(!out)return;var t=0;$$("input[type=radio]:checked",wz).forEach(function(r){t+=parseInt(r.getAttribute("data-pts")||"0",10)});
      var pct=Math.min(100,Math.round(t/ (parseInt(out.getAttribute("data-max")||"20",10))*100));out.textContent=pct;var m=$("[data-score-bar]",wz);if(m)m.style.width=pct+"%";
      var hid=$("input[name='Growth readiness score']",wz);if(hid)hid.value=pct+"/100"}
    show(0);
  });

  /* ---------- Filters ---------- */
  $$("[data-filter-group]").forEach(function(g){
    var target=d.getElementById(g.getAttribute("data-filter-group"));
    $$("button",g).forEach(function(b){b.addEventListener("click",function(){
      $$("button",g).forEach(function(x){x.setAttribute("aria-pressed","false")});b.setAttribute("aria-pressed","true");
      var f=b.getAttribute("data-f");$$("[data-cat]",target).forEach(function(c){c.classList.toggle("is-hidden",f!=="all"&&c.getAttribute("data-cat").indexOf(f)<0)});
    })});
  });

  /* ---------- Site search ---------- */
  var sp=$("#searchPanel"), si=$("#searchInput"), sr=$("#searchRes"), idx=w.GM_INDEX||[];
  function openSearch(){if(!sp)return;sp.classList.add("open");si.value="";render("");setTimeout(function(){si.focus()},30)}
  function closeSearch(){if(sp)sp.classList.remove("open")}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function render(q){if(!sr)return;q=q.trim().toLowerCase();var res=idx.filter(function(x){return !q||(x.t+" "+x.d+" "+x.k).toLowerCase().indexOf(q)>-1}).slice(0,12);
    sr.innerHTML=res.length?res.map(function(x,k){return '<a href="'+ROOT+x.u+'"'+(k===0?' class="sel"':'')+'><b>'+esc(x.t)+'</b><small>'+esc(x.c)+' · '+esc(x.d)+'</small></a>'}).join(""):'<p style="padding:14px">No results. Try "YouTube", "email" or "ads".</p>'}
  $$("[data-search]").forEach(function(b){b.addEventListener("click",openSearch)});
  if(sp){sp.addEventListener("click",function(e){if(e.target===sp)closeSearch()});si.addEventListener("input",function(){render(si.value)});
    si.addEventListener("keydown",function(e){if(e.key==="Enter"){var a=$("a.sel",sr)||$("a",sr);if(a)w.location.href=a.href}})}
  d.addEventListener("keydown",function(e){if(e.key==="/"&&!/input|textarea|select/i.test(d.activeElement.tagName)){e.preventDefault();openSearch()}if(e.key==="Escape"){closeSearch();closeModal()}});

  /* ---------- Lite YouTube ---------- */
  $$(".yt[data-id]").forEach(function(v){
    var id=v.getAttribute("data-id"), t=v.getAttribute("data-title")||"Video";
    v.innerHTML='<img loading="lazy" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt="'+esc(t)+'"><div class="play"><span></span></div>';
    v.setAttribute("role","button");v.setAttribute("tabindex","0");v.setAttribute("aria-label","Play: "+t);
    function play(){v.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="'+esc(t)+'" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>';v.style.cursor="auto"}
    v.addEventListener("click",play,{once:true});v.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();play()}},{once:true});
  });

  /* ---------- Reveal on scroll & counters ---------- */
  if("IntersectionObserver" in w){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");
      var c=e.target.querySelectorAll("[data-count]");Array.prototype.forEach.call(c,count);io.unobserve(e.target)}})},{threshold:.12});
    $$(".reveal").forEach(function(el){io.observe(el)});
  }else{$$(".reveal").forEach(function(el){el.classList.add("in")})}
  function count(el){var to=parseFloat(el.getAttribute("data-count")),s=null,suf=el.getAttribute("data-suffix")||"";
    function step(ts){if(!s)s=ts;var p=Math.min(1,(ts-s)/1100);el.textContent=Math.round(to*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}

  /* ---------- Article: progress + TOC ---------- */
  var prog=$(".progress"), prose=$(".prose");
  if(prog&&prose){w.addEventListener("scroll",function(){var r=prose.getBoundingClientRect(),h=prose.offsetHeight-w.innerHeight;prog.style.width=Math.max(0,Math.min(100,(-r.top)/h*100))+"%"},{passive:true})}
  var toc=$(".toc");
  if(toc&&prose){var hs=$$("h2[id]",prose);
    if("IntersectionObserver" in w){var tio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){$$("a",toc).forEach(function(a){a.classList.toggle("active",a.getAttribute("href")==="#"+e.target.id)})}})},{rootMargin:"0px 0px -70% 0px"});hs.forEach(function(h){tio.observe(h)})}}

  /* ---------- Copy / share ---------- */
  $$("[data-copy]").forEach(function(b){b.addEventListener("click",function(){var v=b.getAttribute("data-copy");var src=v==="url"?w.location.href:(d.getElementById(v)||{}).value;
    if(navigator.clipboard&&src){navigator.clipboard.writeText(src).then(function(){toast("Copied to clipboard")})}})});
  $$("[data-share]").forEach(function(a){var n=a.getAttribute("data-share"),u=encodeURIComponent(w.location.href),t=encodeURIComponent(d.title);
    var m={x:"https://twitter.com/intent/tweet?url="+u+"&text="+t,linkedin:"https://www.linkedin.com/sharing/share-offsite/?url="+u,facebook:"https://www.facebook.com/sharer/sharer.php?u="+u,whatsapp:"https://wa.me/?text="+t+"%20"+u};
    if(m[n]){a.href=m[n];a.target="_blank";a.rel="noopener"}});

  /* ---------- Modal (newsletter, exit-intent desktop only, once per 7 days) ---------- */
  var modal=$("#nlModal");
  function openModal(){if(modal){modal.classList.add("open");var i=modal.querySelector("input[type=email]");if(i)setTimeout(function(){i.focus()},50)}}
  function closeModal(){if(modal)modal.classList.remove("open")}
  w.GM.openNewsletter=openModal;
  $$("[data-open-nl]").forEach(function(b){b.addEventListener("click",function(e){e.preventDefault();openModal()})});
  if(modal){modal.addEventListener("click",function(e){if(e.target===modal||e.target.closest(".modal-x"))closeModal()});
    var last=parseInt(sget("gm-nl")||"0",10);
    if(Date.now()-last>6048e5&&w.matchMedia("(min-width:1020px)").matches&&!d.body.hasAttribute("data-no-exit")){
      var armed=false;setTimeout(function(){armed=true},12000);
      d.addEventListener("mouseout",function ex(e){if(armed&&!e.relatedTarget&&e.clientY<8){openModal();sset("gm-nl",String(Date.now()));d.removeEventListener("mouseout",ex)}});
    }}

  /* ---------- Sticky CTA ---------- */
  var sc=$(".sticky-cta");
  if(sc){w.addEventListener("scroll",function(){sc.classList.toggle("show",w.scrollY>900)},{passive:true})}

  /* ---------- Cookie notice ---------- */
  var ck=$("#cookie");
  if(ck&&!sget("gm-cookie")){setTimeout(function(){ck.classList.add("show")},1200);
    $$("[data-cookie]",ck).forEach(function(b){b.addEventListener("click",function(){sset("gm-cookie",b.getAttribute("data-cookie"));ck.classList.remove("show")})})}

  /* ---------- Support picker ---------- */
  var sup=$("#supportForm");
  if(sup){var amt=$("#supAmount",sup), sBtn=$("#supBtn",sup);
    function upd(){var v=parseFloat(amt.value||"0");sBtn.innerHTML="Pledge $"+(isNaN(v)?0:v)+(($("input[name=Frequency]:checked",sup)||{}).value==="Monthly"?"/mo":"")+" →"}
    $$("[data-amt]").forEach(function(b){b.addEventListener("click",function(){amt.value=b.getAttribute("data-amt");$$("[data-amt]").forEach(function(x){x.setAttribute("aria-pressed","false")});b.setAttribute("aria-pressed","true");upd()})});
    amt.addEventListener("input",upd);$$("input[name=Frequency]",sup).forEach(function(r){r.addEventListener("change",upd)});upd();
    $$("[data-tier]").forEach(function(b){b.addEventListener("click",function(){amt.value=b.getAttribute("data-amt-v");var f=$("input[name=Frequency][value='"+b.getAttribute("data-freq")+"']",sup);if(f)f.checked=true;var t=$("[name=Tier]",sup);if(t)t.value=b.getAttribute("data-tier");upd();sup.scrollIntoView({behavior:"smooth",block:"center"})})});
  }
  /* external payment links: shown only when configured in assets/js/config.js */
  var cfg=w.GM_CONFIG||{};
  $$("[data-pay]").forEach(function(a){var k=a.getAttribute("data-pay");if(cfg.pay&&cfg.pay[k]){a.href=cfg.pay[k];a.target="_blank";a.rel="noopener";a.classList.remove("is-hidden")}});

  /* ---------- Prefill selects from URL (?topic=) ---------- */
  try{var qp=new URLSearchParams(w.location.search);qp.forEach(function(v,k){$$("[data-prefill='"+k+"']").forEach(function(el){el.value=v})})}catch(e){}

  /* ---------- Year ---------- */
  $$("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear()});
})();
