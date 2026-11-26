/* Shared header for the stand-alone pages (YouFinder space, YouMentor): same look as the platform header.
   Use: <div id="yv-shell" data-page="finder"></div> then load this script (after yv-icons.js). */
(function(){
const en=new URLSearchParams(location.search).get('lang')==='en';
const V3=/-v3\.html$/.test(location.pathname),X=V3?'-v3':'';
const APP='app'+X+'.html',TEST='test'+X+'.html',FINDER='finder'+X+'.html',MENTOR='mentor'+X+'.html';
let light=null;try{light=localStorage.getItem('yvLight');}catch(e){}
const LN={ar:{H:'الأفق',F:'الصانع',O:'المدار',S:'الشرارة',C:'البوصلة'},en:{H:'Horizon',F:'Forge',O:'Orbit',S:'Spark',C:'Compass'}};
const box=document.getElementById('yv-shell');const page=box&&box.dataset.page||'';
const T=en?{home:'Home',finder:'YouFinder',partner:'YouPartner',mentor:'YouMentor',login:'Log in',test:'Take the test',your:'Your Light: ',lang:'عربي',menu:'Menu'}
          :{home:'الرئيسية',finder:'عالم يو فايندر',partner:'عالم يو بارتنر',mentor:'عالم يو مينتور',login:'تسجيل الدخول',test:'ابدأ الاختبار',your:'ضوؤك: ',lang:'EN',menu:'القائمة'};
const q=en?'?lang=en':'',h=en?'#en':'#home';
const I={home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',finder:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
 partner:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M10.5 20a5.5 5.5 0 0 1 11 0"/>',
 mentor:'<path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z"/><path d="M8.5 10h7M8.5 13h4.5"/>',
 you:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'};
const svg=k=>'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[k]+'</svg>';
const links=[['home',T.home,APP+h],['finder',T.finder,FINDER+q],['partner',T.partner,APP+h.replace('#','#')+'' ],['mentor',T.mentor,MENTOR+q],['you','You',APP+(en?'#you-en':'#you')]];
links[2][2]=APP+(en?'#en':'#home');   /* YouPartner lives on the home page for now */
const tLabel=light&&LN.ar[light]?T.your+LN[en?'en':'ar'][light]:T.test,tHref=light?FINDER+q:TEST+q;
const nav=links.map(([k,t,u])=>'<a href="'+u+'"'+(k===page?' class="on" aria-current="page"':'')+'>'+svg(k)+'<span>'+t+'</span></a>').join('');
const other=location.pathname.split('/').pop()+(en?'':'?lang=en');
box.outerHTML=`<header class="ys" dir="${en?'ltr':'rtl'}"><div class="ys-row">
<a class="ys-logo" href="${APP+h}" aria-label="Youverse"><img src="img/1e4dffc431313b7bc68eadda79d3417c.png" alt="Youverse"></a>
<nav class="ys-nav">${nav}</nav>
<div class="ys-acts"><a class="ys-sec" href="${APP}#${en?'register-en':'register'}">${T.login}</a><a class="ys-lang" href="${other}">${svg('globe')}<span>${T.lang}</span></a><a class="ys-test" href="${tHref}">${tLabel}</a>
<button class="ys-burger" type="button" aria-label="${T.menu}" aria-expanded="false"><i></i><i></i><i></i></button></div>
<div class="ys-drawer"><nav>${nav}</nav><a class="ys-sec ys-dl" href="${APP}#${en?'register-en':'register'}">${T.login}</a></div></div></header>`;
const css=`.ys{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid rgba(3,46,54,.08);font-family:Almarai,sans-serif}
.ys a{text-decoration:none}.ys-row{max-width:1240px;margin:0 auto;padding:10px 32px;display:flex;align-items:center;gap:26px;position:relative}
.ys-logo img{height:32px;display:block}.ys-nav{display:flex;align-items:center;gap:4px;flex:1}
.ys-nav a{display:flex;align-items:center;gap:7px;color:#4E6A70;font-size:14px;font-weight:700;padding:8px 12px;border-radius:10px;transition:background .15s,color .15s}
.ys-nav a:hover,.ys-nav a.on{color:#032E36;background:rgba(92,225,230,.18)}.ys-nav a.on svg{color:#127F87}
.ys-acts{display:flex;align-items:center;gap:10px}.ys-sec{color:#2E4A50;font-weight:700;font-size:14px;padding:8px 12px;border-radius:10px}
.ys-lang{display:flex;align-items:center;gap:6px;color:#4E6A70;font-weight:700;font-size:14px;padding:7px 10px;border-radius:10px;font-family:${en?'Almarai':'Lora'},serif}
.ys-test{background:#127F87;color:#fff!important;font-weight:800;font-size:14px;padding:9px 18px;border-radius:12px;white-space:nowrap;transition:transform .2s,filter .2s}
.ys-test:hover{transform:scale(1.05);filter:brightness(1.08)}
.ys-burger{display:none;width:40px;height:38px;border-radius:12px;border:0;background:#032E36;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:0}
.ys-burger i{display:block;width:17px;height:2px;border-radius:2px;background:#fff;transition:transform .25s,opacity .2s}
.ys.open .ys-burger i:nth-child(1){transform:translateY(6px) rotate(45deg)}.ys.open .ys-burger i:nth-child(2){opacity:0}.ys.open .ys-burger i:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
.ys-drawer{display:none}
@media (max-width:899px){.ys-row{padding:10px 14px;gap:8px}.ys-nav,.ys-acts .ys-sec{display:none}.ys-acts{margin-inline-start:auto;gap:7px}.ys-burger{display:flex}
 .ys-lang{border:1px solid #D5E6E9;height:38px;padding:0 11px;border-radius:12px;background:rgba(255,255,255,.7)}.ys-lang svg{display:none}
 .ys-test{font-size:13px;padding:0 13px;height:38px;display:flex;align-items:center;border-radius:20px}
 .ys-drawer{display:block;position:absolute;top:calc(100% + 8px);left:12px;right:12px;background:#fff;border:1px solid #E3EEF0;border-radius:22px;box-shadow:0 28px 60px -24px rgba(3,46,54,.38);padding:8px;opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .22s,transform .22s}
 .ys.open .ys-drawer{opacity:1;transform:none;pointer-events:auto}.ys-drawer nav{display:flex;flex-direction:column;gap:2px}
 .ys-drawer nav a{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:14px;font-size:17px;font-weight:700;color:#2E4A50}.ys-drawer nav a svg{width:18px;height:18px;color:#127F87}
 .ys-drawer nav a.on{background:#E8F7F8;color:#032E36}.ys-dl{display:block;text-align:center;margin-top:6px;border-top:1px solid #EDF3F4;padding:14px!important}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const hd=document.querySelector('header.ys');
hd.querySelector('.ys-burger').onclick=e=>{e.stopPropagation();const o=hd.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',o);};
document.addEventListener('click',e=>{if(!e.target.closest('.ys-drawer'))hd.classList.remove('open');});
window.YV_SHELL={en,APP,TEST,FINDER,MENTOR,light};
})();
