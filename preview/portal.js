/* Round 2 (client notes, Nov 2026): one header on every page with the test as its only highlighted button,
   and the home page as a portal with three doors. Loaded after enhance.js and before app.js. */
(function(){
const P=window.DC_PAGES;
const TEST=/-v3\.html$/.test(location.pathname)?'test-v3.html':'test.html';   /* test pages link to the test-page copy of the Light test */
let light=null;try{light=localStorage.getItem('yvLight');}catch(e){}
const LN={ar:{H:'الأفق',F:'الصانع',O:'المدار',S:'الشرارة',C:'البوصلة'},en:{H:'Horizon',F:'Forge',O:'Orbit',S:'Spark',C:'Compass'}};

/* line icons (one style for the whole site) */
const I={
 finder:'<circle cx="12" cy="12" r="8.5" stroke-dasharray="2.2 2.6"/><path d="M12 6.2 13.6 10.4 17.8 12 13.6 13.6 12 17.8 10.4 13.6 6.2 12 10.4 10.4Z"/>',
 partner:'<circle cx="9" cy="12" r="5.2"/><circle cx="15" cy="12" r="5.2"/>',
 mentor:'<path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/><path d="M8.5 10h7M8.5 13h4.5"/>',
 arrow:'<path d="M15 6l-6 6 6 6"/>'};
const ico=(k,sz,col)=>'<svg viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" fill="none" stroke="'+col+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[k]+'</svg>';

/* ---------- one header for every page ---------- */
const PAIR={'Main.dc.html':'Main-EN.dc.html','YouFinder.dc.html':'YouFinder-EN.dc.html','Masterclass.dc.html':'Masterclass-EN.dc.html','You.dc.html':'You-EN.dc.html'};
function header(k){
 const en=/-EN\.dc\.html$/.test(k),base=en?k.replace('-EN',''):k,other=en?base:(PAIR[k]||'Main-EN.dc.html');
 const E=en?'-EN':'',on=f=>base===f?' style="color: #032E36"':'';
 const L=en?{home:'Home',you:'My Space',mentor:'YouMentor',login:'Log in',test:'Take the test',your:'Your Light: ',lang:'عربي',langFont:"'Almarai', sans-serif"}
           :{home:'الرئيسية',you:'مساحتي',mentor:'يو مينتور',login:'تسجيل الدخول',test:'ابدأ الاختبار',your:'ضوؤك: ',lang:'EN',langFont:"'Lora', serif"};
 const t=light&&LN.ar[light]?L.your+LN[en?'en':'ar'][light]:L.test;
 const tHref=light?(en?'YouFinder-EN.dc.html':'YouFinder.dc.html'):(en?TEST+'?lang=en':TEST);
 return `<header style="background: #FFFFFF; border-bottom: 1px solid #E6EEF0">
<div style="max-width: 1240px; margin: 0 auto; padding: 18px 32px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px">
<a href="Main${E}.dc.html" aria-label="${en?'Youverse home':'Youverse الرئيسية'}"><img src="img/logo-h128.webp" alt="Youverse" style="height: 44px; display: block"></a>
<nav style="display: flex; flex-wrap: wrap; gap: 28px; font-size: 16px; font-weight: 700"><a href="Main${E}.dc.html"${on('Main.dc.html')}>${L.home}</a><a href="YouFinder${E}.dc.html"${on('YouFinder.dc.html')}>YouFinder</a><a href="Main${E}.dc.html#worlds">YouPartner</a><a href="mentor.html${en?'?lang=en':''}">${L.mentor}</a><a href="You${E}.dc.html"${on('You.dc.html')}>${L.you}</a></nav>
<div style="display: flex; gap: 12px; align-items: center">
<a href="Register${E}.dc.html" style="font-weight: 700; padding: 12px 18px">${L.login}</a>
<a href="${other}" style="font-family: ${L.langFont}; font-weight: 700; border: 1px solid #CFE3E6; padding: 10px 14px; border-radius: 12px">${L.lang}</a>
<a href="${tHref}" data-yvt="1" style="background: #127F87; color: #FFFFFF; font-weight: 800; padding: 12px 22px; border-radius: 14px">${t}</a>
</div>
</div>
</header>`;}
for(const k in P){const s=P[k],a=s.indexOf('<header'),b=s.indexOf('</header>');
 if(a<0||b<0||s.slice(a,b).indexOf('<nav')<0)continue;
 P[k]=s.slice(0,a)+header(k)+s.slice(b+9);}

/* phone: the test button stays in the bar as a small pill (menu, language, logo, test) */
const ph=window.yvPhoneHeader;
window.yvPhoneHeader=function(box){ph(box);
 box.querySelectorAll('.yv-row').forEach(row=>{const t=row.querySelector('a[data-yvt]'),bar=row.querySelector('.yv-bar');
  if(!t||!bar||t.parentElement===bar)return;t.className='yv-tpill';bar.insertBefore(t,bar.firstChild);
  const acts=row.querySelector('.yv-acts');if(acts&&!acts.children.length)acts.remove();});};

/* nav icon for YouMentor (same line style as the other header icons) */
const yh=window.yvHeader;
const arName=t=>t.replace(/YouFinder(?!s)/g,'يو فايندر').replace(/YouPartner/g,'يو بارتنر').replace(/YouMentor/g,'يو مينتور').replace(/(?:عالم\s+)?(?:ال)?يو\s?(فايندر|بارتنر|مينتور)(?!ز)/g,'عالم يو $1');   /* Arabic: the three worlds are always «عالم يو فايندر / عالم يو بارتنر / عالم يو مينتور» */
window.yvHeader=function(box,phone){yh(box,phone);
 if(document.documentElement.lang!=='en'){const w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const v=n.nodeValue,r=arName(v);if(r!==v)n.nodeValue=r.replace('ادخل عالمك في عالم يو فايندر','ادخل عالمك في يو فايندر');}}
 if(window.YVLater)window.YVLater(box,document.documentElement.lang==='en');
 box.querySelectorAll('header nav a').forEach(a=>{const t=a.textContent.trim();if((t==='يو مينتور'||t==='عالم يو مينتور'||t==='YouMentor')&&!a.querySelector('svg'))a.innerHTML=ico('mentor',16,'currentColor')+'<span>'+t+'</span>';
  if((t==='مساحتي'||t==='My Space')&&!a.querySelector('svg'))a.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span>'+t+'</span>';});};

/* ---------- home: a portal with three doors ---------- */
function portal(en){
 const D=en?[
  {h:'YouFinder.dc.html',t:'YouFinder World',d:'People who built something real, each with their own world.',i:'finder',bg:'#0C1E25',fg:'#FFFFFF',sub:'rgba(232,244,246,0.75)',ib:'rgba(92,225,230,0.12)',ic:'#5CE1E6',bb:'#BFF3F5',bc:'#032E36'},
  {h:'Main-EN.dc.html#worlds',t:'YouPartner World',d:'Partners who open doors: internships, masterclasses and certificates.',i:'partner',bg:'#DFF4F5',fg:'#032E36',sub:'#3E5C62',ib:'#FFFFFF',ic:'#127F87',bb:'#032E36',bc:'#FFFFFF'},
  {h:'mentor.html?lang=en',t:'YouMentor',d:'Book a one-to-one online session with a mentor in your field.',i:'mentor',bg:'#FBF1DE',fg:'#032E36',sub:'#5B5446',ib:'#FFFFFF',ic:'#9A6A12',bb:'#032E36',bc:'#FFFFFF'}]:[
  {h:'YouFinder.dc.html',t:'عالم يو فايندر',d:'شخصيات بنت شيئاً حقيقياً، ولكل منها عالمها.',i:'finder',bg:'#0C1E25',fg:'#FFFFFF',sub:'rgba(232,244,246,0.75)',ib:'rgba(92,225,230,0.12)',ic:'#5CE1E6',bb:'#BFF3F5',bc:'#032E36'},
  {h:'Main.dc.html#worlds',t:'عالم يو بارتنر',d:'جهات تفتح لك الأبواب: تدريب وماستركلاس وشهادات.',i:'partner',bg:'#DFF4F5',fg:'#032E36',sub:'#3E5C62',ib:'#FFFFFF',ic:'#127F87',bb:'#032E36',bc:'#FFFFFF'},
  {h:'mentor.html',t:'عالم يو مينتور',d:'احجز جلسة فردية أونلاين مع مرشد في تخصصك.',i:'mentor',bg:'#FBF1DE',fg:'#032E36',sub:'#5B5446',ib:'#FFFFFF',ic:'#9A6A12',bb:'#032E36',bc:'#FFFFFF'}];
 const T=en?{badge:'A platform to discover yourself and your skills',h1:'Discover your world,<br>begin your journey',sub:'Three worlds are waiting for you. Choose what suits you and step in.',go:'Enter',dark:'The world is dark.',find:'Find your Light.',orb:'Ten questions tell you which Light you are, and which world you belong to.',cta:'Take the test'}
           :{badge:'منصة لاكتشاف الذات والمهارات',h1:'اكتشف عالمك،<br>وابدأ رحلتك',sub:'ثلاثة عوالم بانتظارك. اختر ما يناسبك وادخل.',go:'ادخل',dark:'العالم مظلم.',find:'اكتشف ضوءك.',orb:'عشرة أسئلة تخبرك أي ضوء أنت، وأي عالم تنتمي إليه.',cta:'ابدأ الاختبار'};
 const doors=D.map(d=>`<a class="yv-door" href="${d.h}" style="display: flex; flex-direction: column; gap: 14px; min-height: 300px; padding: 30px 30px 28px; border-radius: 28px; background: ${d.bg}; color: ${d.fg}; box-shadow: 0 24px 50px -32px rgba(3,46,54,0.45); border: 1px solid rgba(3,46,54,0.06)">
<span style="width: 54px; height: 54px; border-radius: 50%; background: ${d.ib}; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(127,178,190,0.25)">${ico(d.i,26,d.ic)}</span>
<span style="font-family: 'Amiri', serif; font-weight: 700; font-size: 34px; line-height: 1.3; margin-top: 6px">${d.t}</span>
<span style="font-size: 16px; line-height: 1.8; color: ${d.sub}">${d.d}</span>
<span style="margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; background: ${d.bb}; color: ${d.bc}; font-weight: 800; font-size: 16px; padding: 12px 24px; border-radius: 30px">${T.go} ${ico('arrow',16,d.bc).replace(en?'M15 6l-6 6 6 6':'@@','M9 6l6 6-6 6')}</span></a>`).join('\n');
 return `<section style="background: linear-gradient(120deg, #DDF7F8 0%, #ECEAFB 55%, #FAEAF0 100%)">
<div style="max-width: 1240px; margin: 0 auto; padding: 80px 32px 90px; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 20px; max-width: 720px">
<span style="align-self: flex-start; background: #FFFFFF; color: #127F87; font-weight: 700; font-size: 15px; padding: 8px 16px; border-radius: 30px">${T.badge}</span>
<h1 class="yv-hh" style="margin: 0; font-family: 'Amiri', serif; font-size: 68px; line-height: 1.25; font-weight: 700">${T.h1}</h1>
<p style="margin: 0; font-size: 20px; line-height: 1.9; color: #2E4A50">${T.sub}</p>
</div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px">
${doors}
</div>
<a class="yv-lightcard" href="${en?TEST+'?lang=en':TEST}" style="position: relative; overflow: hidden; border-radius: 28px; padding: 44px 48px; display: flex; flex-wrap: wrap; align-items: center; gap: 30px; color: #FFFFFF; background: #04070f url(v5d/cosmos-2x.webp) center/cover; box-shadow: 0 30px 60px -28px rgba(3,20,40,0.6)"><span style="position: absolute; inset: 0; background: radial-gradient(ellipse 80% 90% at 50% 50%, rgba(3,6,14,0.35), rgba(3,6,14,0.85))"></span><span class="yv-orb" style="position: relative; width: 84px; height: 84px; flex-shrink: 0; border-radius: 50%; background: radial-gradient(circle at 42% 38%, #FFFFFF 0%, #9EEFF2 25%, #3FB9C0 60%, #0E5A61 100%); box-shadow: 0 0 50px #5CE1E6"></span><span style="position: relative; display: flex; flex-direction: column; gap: 6px; flex: 1 1 320px"><span style="font-family: 'Amiri', serif; font-weight: 700; font-size: 36px; line-height: 1.3">${T.dark} <span style="color: #9EEFF2">${T.find}</span></span><span style="font-size: 16px; color: rgba(234,244,246,0.8); line-height: 1.8">${T.orb}</span></span><span style="position: relative; background: #5CE1E6; color: #032E36; font-weight: 800; font-size: 16px; padding: 14px 30px; border-radius: 30px; box-shadow: 0 10px 30px rgba(92,225,230,0.35)">${T.cta}</span></a>
</div>
</section>`;}
for(const [k,en] of [['Main.dc.html',false],['Main-EN.dc.html',true]]){const s=P[k],a=s.indexOf('<section',s.indexOf('</header>')),b=s.indexOf('</section>',a);
 if(a>0&&b>0)P[k]=s.slice(0,a)+portal(en)+s.slice(b+10);}

/* «You» (the personal space) is «مساحتي» / «My Space» everywhere; the journey gets a YouMentor card */
const SP=[["{n:'4',title:'You',tag:'مساحتك',desc:'مساحتك: تقدمك وشهاداتك ونتائجك.'","{n:'4',title:'YouMentor',tag:'جلسات خاصة',desc:'جلسة خاصة أونلاين مع مرشد في تخصصك.',bg:'#FBF1DE',dot:'#9A6A12'},\n{n:'5',title:'مساحتي',tag:'تقدّمك',desc:'تقدّمك وشهاداتك ونتائجك في مكان واحد.'"],
 ["{n:'4',title:'You',tag:'Your space',desc:'Your space: progress, certificates and results.'","{n:'4',title:'YouMentor',tag:'Private sessions',desc:'A private online session with a mentor in your field.',bg:'#FBF1DE',dot:'#9A6A12'},\n{n:'5',title:'My Space',tag:'Your progress',desc:'Your progress, certificates and results in one place.'"],
 ['تابع رحلتك في You','تابع رحلتك في مساحتي'],['Follow your journey in You','Follow your journey in My Space'],
 ['مساحتك You','مساحتي'],['مساحة You','مساحتي'],['Your space: You','My Space'],['Your results history in You','Your results history in My Space'],['Youverse · You<','Youverse · My Space<'],
 ['grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px; margin-top: 48px','grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin-top: 48px']];
for(const k in P){let x=P[k];for(const [a,b] of SP)x=x.split(a).join(b);P[k]=x;}

/* emoji -> line icons (yv-icons.js) */
if(window.YVI){const Y=window.YVI,M={'📖':'book','⏱️':'clock','⏱':'clock','🎧':'media','🏅':'award'};
 for(const k in P){let s=P[k];
  s=s.replace(/<span style="font-size: 20px">(📖|⏱️|⏱|🎧|🏅)<\/span>/g,(m,e)=>'<span style="display: flex; color: #127F87">'+Y(M[e],20)+'</span>');
  s=s.replace(/ 🔥<\/span>/g,' '+Y('flame',15,'#E07A2F')+'</span>').replace(/ 📚<\/span>/g,' '+Y('stack',15,'#127F87')+'</span>').replace(/ 🏅<\/span>/g,' '+Y('award',15,'#B8860B')+'</span>');
  s=s.replace(/aria-hidden="true">✦<\/div>/g,'aria-hidden="true">'+Y('sparkle',28,'#4A3F75')+'</div>');
  {const X=TEST==='test.html'?'':'-v3';s=s.split('href="YouFinder-EN.dc.html"').join('href="finder'+X+'.html?lang=en"').split('href="YouFinder.dc.html"').join('href="finder'+X+'.html"');if(X)s=s.split('href="mentor.html').join('href="mentor-v3.html');}
  s=s.split('href="test.html?lang=en"').join('href="'+TEST+'?lang=en"').split('href="test.html"').join('href="'+TEST+'"');
  P[k]=s;}}

/* styles for this round */
const st=document.createElement('style');st.textContent=`
.yv-tpill{display:flex;align-items:center;height:38px;padding:0 13px;border-radius:20px;background:#127F87;color:#fff!important;font-weight:800;font-size:13px;white-space:nowrap;text-decoration:none}
.yv-door{transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s}
@media (hover:hover) and (pointer:fine){#root a.yv-door:hover{transform:translateY(-6px)!important;box-shadow:0 34px 60px -30px rgba(3,46,54,.55)!important;filter:none!important}}
@media (max-width:699px){#root a.yv-door{min-height:0!important;padding:24px!important;border-radius:24px!important}#root .yv-lightcard{padding:30px 24px!important;gap:18px!important}#root h1.yv-hh{font-size:44px!important;line-height:1.3!important}#root .yv-lightcard .yv-orb{width:58px!important;height:58px!important}}`;
document.head.appendChild(st);
})();
