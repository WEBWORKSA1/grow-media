/* Grow.Media — free growth tools (all calculations run in the browser; nothing is stored) */
(function(){
  "use strict";
  var d=document;
  function n(v){v=parseFloat(String(v).replace(/[^0-9.\-]/g,""));return isNaN(v)?0:v}
  function money(v,dec){return "$"+Number(v).toLocaleString(undefined,{minimumFractionDigits:dec||0,maximumFractionDigits:dec===undefined?0:dec})}
  function num(v,dec){return Number(v).toLocaleString(undefined,{maximumFractionDigits:dec||0})}
  function pct(v,dec){return (isFinite(v)?v:0).toFixed(dec===undefined?2:dec)+"%"}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

  var T={
    "engagement-rate-calculator":function(v){
      var inter=n(v.likes)+n(v.comments)+n(v.shares)+n(v.saves), base=v.basis==="reach"?n(v.reach):n(v.followers);
      var er=base>0?inter/base*100:0, f=n(v.followers);
      var bench=f<1e4?[3,6]:f<1e5?[1.5,3.5]:f<1e6?[1,2.5]:[.5,1.8];
      var verdict=er>=bench[1]?"Excellent — you're above the typical range for your audience size.":er>=bench[0]?"Healthy — within the typical range for accounts your size.":"Below typical — test stronger hooks, ask clearer questions, and post when your audience is active.";
      return {big:pct(er),sub:"engagement rate by "+(v.basis==="reach"?"reach":"followers")+" per post",meter:Math.min(100,er/(bench[1]*1.5)*100),
        rows:[["Total interactions",num(inter)],["Typical range for this size",bench[0]+"–"+bench[1]+"%"],["Interactions per 1,000",num(base?inter/base*1000:0,1)]],verdict:verdict};
    },
    "youtube-money-calculator":function(v){
      var views=n(v.views), rpm=n(v.rpm), shorts=v.format==="shorts";
      var day=views/1000*rpm;
      return {big:money(day*30),sub:"estimated monthly ad revenue ("+(shorts?"Shorts":"long-form")+")",meter:Math.min(100,rpm/15*100),
        rows:[["Daily",money(day,2)],["Monthly (30 days)",money(day*30)],["Yearly",money(day*365)],["Planning range (±40%)",money(day*30*.6)+" – "+money(day*30*1.4)]],
        verdict:"RPM is what you earn per 1,000 views after YouTube's share. It varies by niche, audience country, season and format, so use this as a planning estimate, not a promise."};
    },
    "youtube-monetization-checker":function(v){
      var subs=n(v.subs), hrs=n(v.hours), sv=n(v.shortsviews);
      var pSubs=Math.min(100,subs/1000*100), pH=Math.min(100,hrs/4000*100), pS=Math.min(100,sv/1e7*100), path=Math.max(pH,pS);
      var ok=subs>=1000&&(hrs>=4000||sv>=1e7);
      return {big:ok?"Eligible":Math.round(Math.min(pSubs,path))+"%",sub:ok?"you meet the commonly published ad-revenue thresholds":"progress toward the full Partner Program thresholds",meter:ok?100:Math.min(pSubs,path),
        rows:[["Subscribers",num(subs)+" / 1,000"],["Watch hours (12 mo)",num(hrs)+" / 4,000"],["Shorts views (90 days)",num(sv)+" / 10,000,000"],["Subscribers still needed",num(Math.max(0,1000-subs))]],
        verdict:"Thresholds are set by YouTube and can change; lower-tier fan-funding features may unlock earlier. Always confirm in YouTube Studio's Earn tab."};
    },
    "sponsorship-rate-calculator":function(v){
      var views=n(v.avgviews), cpm=n(v.cpm), er=n(v.er), mult={integration:1,dedicated:1.8,short:.5,story:.35}[v.type]||1;
      var erAdj=er>=6?1.25:er>=3?1.1:er>=1.5?1:.85, usage=v.usage==="yes"?1.3:1, excl=v.excl==="yes"?1.2:1;
      var base=views/1000*cpm*mult*erAdj*usage*excl;
      return {big:money(base),sub:"suggested rate per deliverable",meter:Math.min(100,base/5000*100),
        rows:[["Low anchor (-20%)",money(base*.8)],["High anchor (+25%)",money(base*1.25)],["Engagement multiplier","×"+erAdj],["Usage rights / exclusivity","×"+(usage*excl).toFixed(2)]],
        verdict:"Open negotiations with the high anchor, and never discount without removing scope (fewer deliverables, shorter usage window, no exclusivity)."};
    },
    "ad-metrics-calculator":function(v){
      var spend=n(v.spend), imp=n(v.impressions), clicks=n(v.clicks), conv=n(v.conversions), rev=n(v.revenue);
      var cpm=imp?spend/imp*1000:0, cpc=clicks?spend/clicks:0, ctr=imp?clicks/imp*100:0, cvr=clicks?conv/clicks*100:0, cpa=conv?spend/conv:0, roas=spend?rev/spend:0;
      return {big:roas.toFixed(2)+"x",sub:"return on ad spend (ROAS)",meter:Math.min(100,roas/5*100),
        rows:[["CPM",money(cpm,2)],["CPC",money(cpc,2)],["CTR",pct(ctr)],["Conversion rate",pct(cvr)],["CPA",money(cpa,2)],["Profit before costs",money(rev-spend)]],
        verdict:roas>=3?"Strong. Check margins, then scale budget in steps of 20–30%.":roas>=1?"Profitable on revenue, but confirm it clears your break-even ROAS after product costs.":"Below break-even on revenue. Fix the weakest link: CTR (creative), CVR (landing page) or CPA (targeting)."};
    },
    "marketing-roi-calculator":function(v){
      var cost=n(v.cost), rev=n(v.revenue), margin=n(v.margin)/100||1, gp=rev*margin, roi=cost?(gp-cost)/cost*100:0;
      return {big:pct(roi,1),sub:"marketing ROI on gross profit",meter:Math.max(0,Math.min(100,roi/300*100)),
        rows:[["Gross profit generated",money(gp)],["Net return",money(gp-cost)],["Revenue ROI (ignoring margin)",pct(cost?(rev-cost)/cost*100:0,1)],["Break-even revenue",money(margin?cost/margin:0)]],
        verdict:roi>0?"This campaign paid for itself on a gross-profit basis.":"Not yet profitable. Lower cost, raise conversion, or increase average order value."};
    },
    "ltv-cac-calculator":function(v){
      var arpu=n(v.arpu), gm=n(v.gm)/100, churn=n(v.churn)/100, cac=n(v.cac);
      var life=churn>0?1/churn:0, ltv=arpu*gm*life, ratio=cac?ltv/cac:0, payback=arpu*gm>0?cac/(arpu*gm):0;
      return {big:ratio.toFixed(1)+" : 1",sub:"LTV to CAC ratio",meter:Math.min(100,ratio/5*100),
        rows:[["Customer lifetime value",money(ltv)],["Average lifetime",num(life,1)+" months"],["CAC payback",num(payback,1)+" months"],["Max affordable CAC (3:1)",money(ltv/3)]],
        verdict:ratio>=3?"Healthy unit economics. You can likely afford to invest more in acquisition.":ratio>=1?"Thin margin for error. Improve retention or reduce acquisition cost before scaling.":"You lose money on each customer. Fix pricing, churn or CAC first."};
    },
    "profit-margin-calculator":function(v){
      var cost=n(v.cost), price=n(v.price), ship=n(v.ship), cac=n(v.cac), all=cost+ship+cac, gp=price-cost, np=price-all;
      return {big:pct(price?np/price*100:0,1),sub:"net margin after shipping & acquisition",meter:Math.max(0,Math.min(100,(price?np/price*100:0)/60*100)),
        rows:[["Gross margin",pct(price?gp/price*100:0,1)],["Markup on cost",pct(cost?gp/cost*100:0,1)],["Net profit per sale",money(np,2)],["Price for 50% net margin",money(all/0.5,2)]],
        verdict:np>0?"Each sale is profitable after the costs entered.":"You lose money per sale at this price. Raise price, bundle, or lower fulfilment and acquisition costs."};
    },
    "email-list-growth-calculator":function(v){
      var s=n(v.start), visitors=n(v.visitors), cr=n(v.optin)/100, churn=n(v.churn)/100, months=Math.max(1,Math.min(60,n(v.months)));
      var list=s, add=visitors*cr, rows=[];
      for(var m=1;m<=months;m++){list=list+add-list*churn;if(m===3||m===6||m===12||m===months)rows.push(["Month "+m,num(Math.round(list))])}
      var ceiling=churn>0?add/churn:Infinity;
      rows.push(["New subscribers / month",num(Math.round(add))]);rows.push(["Long-run ceiling",isFinite(ceiling)?num(Math.round(ceiling)):"No ceiling"]);
      return {big:num(Math.round(list)),sub:"projected subscribers after "+months+" months",meter:Math.min(100,list/(isFinite(ceiling)?ceiling:list||1)*100),rows:rows,
        verdict:"Your list plateaus where new sign-ups equal unsubscribes. To lift the ceiling, raise opt-in rate (better lead magnet) or traffic, not just reduce churn."};
    },
    "follower-growth-calculator":function(v){
      var f=n(v.followers), g=n(v.growth)/100, goal=n(v.goal), months=Math.max(1,Math.min(60,n(v.months))), list=f, rows=[];
      for(var m=1;m<=months;m++){list=list*(1+g);if(m===3||m===6||m===12||m===months)rows.push(["Month "+m,num(Math.round(list))])}
      var need=goal>f&&g>0?Math.ceil(Math.log(goal/f)/Math.log(1+g)):0;
      rows.push(["Months to reach goal",goal>f?(g>0?num(need):"Never at 0% growth"):"Already reached"]);
      var req=goal>f?(Math.pow(goal/f,1/months)-1)*100:0;rows.push(["Monthly growth needed for goal in "+months+" mo",pct(req,1)]);
      return {big:num(Math.round(list)),sub:"projected followers after "+months+" months",meter:goal?Math.min(100,list/goal*100):50,rows:rows,
        verdict:"Compounding rewards consistency. A steady 5–10% monthly gain beats one viral spike followed by silence."};
    },
    "funnel-conversion-calculator":function(v){
      var vis=n(v.visitors), r1=n(v.r1)/100, r2=n(v.r2)/100, r3=n(v.r3)/100, aov=n(v.aov);
      var leads=vis*r1, qual=leads*r2, cust=qual*r3, rev=cust*aov;
      var stages=[["Lead capture",r1],["Lead → qualified",r2],["Qualified → customer",r3]].sort(function(a,b){return a[1]-b[1]});
      return {big:num(Math.round(cust)),sub:"customers per period",meter:Math.min(100,(vis?cust/vis*100:0)/5*100),
        rows:[["Leads",num(Math.round(leads))],["Qualified",num(Math.round(qual))],["Revenue",money(rev)],["Visitor → customer",pct(vis?cust/vis*100:0)],["Revenue per visitor",money(vis?rev/vis:0,2)]],
        verdict:"Biggest opportunity: \""+stages[0][0]+"\" ("+pct(stages[0][1]*100,1)+"). A 10% relative lift there adds about "+num(Math.round(cust*.1))+" customers."};
    },
    "utm-builder":function(v){
      var url=(v.url||"").trim();if(!url)return {html:'<p class="sub">Enter a destination URL to build your tracking link.</p>'};
      if(!/^https?:\/\//i.test(url))url="https://"+url;
      var p=[["utm_source",v.source],["utm_medium",v.medium],["utm_campaign",v.campaign],["utm_term",v.term],["utm_content",v.content]].filter(function(x){return x[1]&&x[1].trim()});
      var clean=function(s){return encodeURIComponent(s.trim().toLowerCase().replace(/\s+/g,"_"))};
      var q=p.map(function(x){return x[0]+"="+clean(x[1])}).join("&"), out=url+(q?(url.indexOf("?")>-1?"&":"?")+q:"");
      return {html:'<div class="big" style="font-size:1.4rem">Your tracking link</div><div class="copy-out"><input id="utmOut" type="text" readonly value="'+esc(out)+'"><button class="btn btn-lime btn-sm" type="button" data-copy-now="utmOut">Copy</button></div><p class="sub" style="margin-top:12px">Tip: keep values lowercase and consistent (e.g. always "newsletter", never "Newsletter" and "email") so reports group cleanly.</p>'};
    },
    "serp-snippet-preview":function(v){
      var t=v.title||"", ds=v.desc||"", u=(v.url||"example.com/page").replace(/^https?:\/\//,"");
      var tl=t.length, dl=ds.length, tOk=tl>=30&&tl<=60, dOk=dl>=120&&dl<=158;
      var tShow=tl>60?t.slice(0,57)+"…":t, dShow=dl>158?ds.slice(0,155)+"…":ds;
      return {html:'<div class="big" style="font-size:1.4rem">Search preview</div><div class="serp"><div class="u">'+esc(u.split("/")[0])+' › '+esc(u.split("/").slice(1).join(" › "))+'</div><div class="t">'+esc(tShow||"Your page title appears here")+'</div><div class="d">'+esc(dShow||"Your meta description appears here. Make it specific and give a reason to click.")+'</div></div>'+
        '<dl><dt>Title length</dt><dd>'+tl+' chars '+(tOk?"✓":"(aim 30–60)")+'</dd><dt>Description length</dt><dd>'+dl+' chars '+(dOk?"✓":"(aim 120–158)")+'</dd></dl><p class="sub" style="margin-top:12px">Search engines truncate by pixel width, so character counts are a guide. They may also rewrite snippets.</p>'};
    },
    "headline-analyzer":function(v){
      var h=(v.headline||"").trim();if(!h)return {html:'<p class="sub">Type a headline to score it.</p>'};
      var words=h.split(/\s+/).filter(Boolean), wc=words.length, score=40, tips=[];
      var power=["free","proven","simple","step","guide","how","why","best","new","easy","fast","mistakes","secret","complete","exact","without","templates","checklist","ultimate","beginner"];
      var emo=["you","your","stop","never","finally","instantly","surprising","boost","grow","win","save"];
      if(wc>=6&&wc<=12){score+=18}else tips.push("Aim for 6–12 words (you have "+wc+").");
      if(/\d/.test(h)){score+=12}else tips.push("Add a specific number (e.g. \"7 ways\", \"in 30 days\").");
      var pw=words.filter(function(x){return power.indexOf(x.toLowerCase().replace(/[^a-z]/g,""))>-1}).length;score+=Math.min(14,pw*7);if(!pw)tips.push("Use one clear benefit word (guide, proven, step-by-step, free).");
      var em=words.filter(function(x){return emo.indexOf(x.toLowerCase().replace(/[^a-z]/g,""))>-1}).length;score+=Math.min(10,em*5);if(!em)tips.push("Speak to the reader directly (\"you\", \"your\").");
      if(/[:—\-(\[]/.test(h))score+=6;else tips.push("Try a colon or bracket to add context, e.g. \"[2026 Guide]\".");
      if(h.length>70){score-=10;tips.push("Over 70 characters may be truncated in search results.")}
      if(h===h.toUpperCase()&&/[A-Z]/.test(h)){score-=15;tips.push("Avoid all caps.")}
      score=Math.max(0,Math.min(100,score));
      return {big:score+"/100",sub:"headline strength score",meter:score,rows:[["Words",wc],["Characters",h.length],["Benefit words",pw],["Reader-focused words",em]],
        verdict:tips.length?"Improve: "+tips.slice(0,3).join(" "):"Strong headline. Make sure the content delivers on the promise, or clicks turn into bounces."};
    }
  };

  function readForm(f){var o={};Array.prototype.forEach.call(f.elements,function(el){if(!el.name)return;if((el.type==="radio"||el.type==="checkbox")&&!el.checked)return;o[el.name]=el.value});return o}
  function render(out,r){
    if(r.html){out.innerHTML=r.html}else{
      out.innerHTML='<div class="big">'+r.big+'</div><div class="sub">'+esc(r.sub)+'</div>'+(r.meter!==undefined?'<div class="meter"><i style="width:'+Math.max(2,Math.min(100,r.meter))+'%"></i></div>':'')+
      '<dl>'+r.rows.map(function(x){return '<dt>'+esc(x[0])+'</dt><dd>'+esc(String(x[1]))+'</dd>'}).join("")+'</dl>'+(r.verdict?'<div class="verdict">'+esc(r.verdict)+'</div>':'');
    }
    Array.prototype.forEach.call(out.querySelectorAll("[data-copy-now]"),function(b){b.addEventListener("click",function(){var i=d.getElementById(b.getAttribute("data-copy-now"));if(i&&navigator.clipboard){navigator.clipboard.writeText(i.value);b.textContent="Copied ✓"}})});
  }
  var f=d.getElementById("toolForm"), out=d.getElementById("toolOut");
  if(f&&out){var slug=f.getAttribute("data-tool"), fn=T[slug];
    if(fn){var run=function(){try{render(out,fn(readForm(f)))}catch(e){out.innerHTML='<p class="sub">Check your inputs.</p>'}};
      f.addEventListener("input",run);
      f.addEventListener("change",function(e){if(e.target.name==="format"){var r=f.querySelector("[name=rpm]");if(r)r.value=e.target.value==="shorts"?"0.08":"4"}run()});f.addEventListener("submit",function(e){e.preventDefault();run()});run()}}
})();
