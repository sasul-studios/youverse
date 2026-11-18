(function(){
const ROUTES={"Main.dc.html": "home", "Main-EN.dc.html": "en", "Test.dc.html": "test", "Test-EN.dc.html": "test-en", "Register.dc.html": "register", "Register-EN.dc.html": "register-en", "Masterclass.dc.html": "masterclass", "Masterclass-EN.dc.html": "masterclass-en", "Lesson.dc.html": "lesson", "Lesson-EN.dc.html": "lesson-en", "You.dc.html": "you", "You-EN.dc.html": "you-en", "Admin.dc.html": "admin", "Admin-EN.dc.html": "admin-en"};
const FILES={};for(const k in ROUTES)FILES[ROUTES[k]]=k;
class DCLogic{constructor(p){this.props=p||{};this.state={};}
 setState(p){const n=typeof p==='function'?p(this.state):p;this.state=Object.assign({},this.state,n);rerender();}
 forceUpdate(){rerender();}}
function look(sc,p){p=p.trim();if(p==='true')return true;if(p==='false')return false;if(/^-?\d+(\.\d+)?$/.test(p))return Number(p);
 let v=sc;for(const k of p.split('.')){if(v==null)return undefined;v=v[k];}return v;}
function interp(str,sc){const m=str.match(/^\s*\{\{([^}]+)\}\}\s*$/);if(m)return look(sc,m[1]);
 return str.replace(/\{\{([^}]+)\}\}/g,(_,p)=>{const v=look(sc,p);return v==null?'':String(v);});}
function fixUrl(name,v){
 if(typeof v!=='string')return v;
 if(name==='href'){const [f,h]=v.split('#');if(ROUTES[f])return '#'+ROUTES[f];return v;}
 if(name==='src'&&v.startsWith('/_blob/'))return 'img/'+v.slice(7)+'.png';
 return v;}
function render(node,sc,parent){
 if(node.nodeType===3){parent.appendChild(document.createTextNode(String(interp(node.nodeValue,sc)??'')));return;}
 if(node.nodeType!==1)return;
 const tag=node.localName;
 if(tag==='helmet')return;
 if(tag==='sc-for'){const list=look(sc,node.getAttribute('list').replace(/[{}]/g,''))||[];const as=node.getAttribute('as');
   list.forEach((it,i)=>{const s=Object.create(sc);s[as]=it;s.$index=i;for(const c of node.childNodes)render(c,s,parent);});return;}
 if(tag==='sc-if'){if(look(sc,node.getAttribute('value').replace(/[{}]/g,'')))for(const c of node.childNodes)render(c,sc,parent);return;}
 const ns=node.namespaceURI;const el=ns&&ns!=='http://www.w3.org/1999/xhtml'?document.createElementNS(ns,node.tagName):document.createElement(tag);
 for(const a of node.attributes){if(a.name.startsWith('hint-'))continue;
   if(a.name.startsWith('on')){const f=interp(a.value,sc);if(typeof f==='function'){let ev=a.name.slice(2);if(ev==='change'&&(tag==='textarea'||tag==='input'))ev='input';el.__h=el.__h||{};el.__h[ev]=f;}continue;}
   let v=interp(a.value,sc);if(v===false||v==null)continue;v=fixUrl(a.name,v);el.setAttribute(a.name,v===true?'':String(v));}
 if((tag==='input'||tag==='textarea')&&node.hasAttribute('value'))el.value=interp(node.getAttribute('value'),sc)??'';
 if(tag==='textarea'){for(const c of node.childNodes){} el.textContent=el.value;}
 else for(const c of node.childNodes)render(c,sc,el);
 parent.appendChild(el);}
let cur=null;const root=document.getElementById('root');const styleEl=document.createElement('style');document.head.appendChild(styleEl);
function load(route){
 const file=FILES[route]||FILES.home;const txt=window.DC_PAGES[file];
 const doc=new DOMParser().parseFromString(txt,'text/html');
 document.documentElement.lang=doc.documentElement.lang||'ar';document.documentElement.dir=doc.documentElement.dir||'rtl';
 document.title=/(^|-)en$/.test(route)?'Youverse - Discover Your Universe!':'Youverse - اكتشف عالمك!';   /* tab title */
 const xdc=doc.querySelector('x-dc');const h=xdc.querySelector('helmet');
 styleEl.textContent=h?[...h.querySelectorAll('style')].map(s=>s.textContent).join('\n'):'';
 const code=doc.querySelector('script[data-dc-script]').textContent;
 const C=new Function('DCLogic',code+'\nreturn Component;')(DCLogic);
 cur={xdc,inst:new C({}),route};fresh=true;root.style.opacity='0';rerender();window.scrollTo(0,0);requestAnimationFrame(()=>{root.style.transition='opacity .25s ease';root.style.opacity='1';});}
function build(target){target.innerHTML='';const vals=cur.inst.renderVals();for(const c of cur.xdc.childNodes)render(c,vals,target);}
const GRID=/repeat\((\d+),/;
function ensureStage(){let st=document.getElementById('stage');if(!st){st=document.createElement('div');st.id='stage';st.setAttribute('aria-hidden','true');st.style.cssText='position:absolute;left:0;top:0;width:100%;visibility:hidden;pointer-events:none;z-index:-1';document.body.appendChild(st);}return st;}
function bindAll(el){if(el.__h){el.__hb=el.__hb||{};for(const ev in el.__h){if(!el.__hb[ev]){el.__hb[ev]=true;el.addEventListener(ev,e=>{const f=el.__h&&el.__h[ev];if(f)f(e);});}}}for(const c of el.children)bindAll(c);}
function morph(o,n){
 if(o.nodeType!==n.nodeType||o.nodeName!==n.nodeName){o.replaceWith(n);bindAll(n.nodeType===1?n:document.createElement('i'));return;}
 if(o.nodeType===3){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;return;}
 if(o.nodeType!==1)return;
 for(const a of [...o.attributes])if(!n.hasAttribute(a.name))o.removeAttribute(a.name);
 for(const a of n.attributes)if(o.getAttribute(a.name)!==a.value)o.setAttribute(a.name,a.value);
 if((o.tagName==='INPUT'||o.tagName==='TEXTAREA')&&document.activeElement!==o&&o.value!==n.value)o.value=n.value;
 o.__h=n.__h;if(o.__h){o.__hb=o.__hb||{};for(const ev in o.__h)if(!o.__hb[ev]){o.__hb[ev]=true;o.addEventListener(ev,e=>{const f=o.__h&&o.__h[ev];if(f)f(e);});}}
 const oc=[...o.childNodes],nc=[...n.childNodes];
 for(let i=0;i<nc.length;i++){if(i<oc.length)morph(oc[i],nc[i]);else{o.appendChild(nc[i]);if(nc[i].nodeType===1)bindAll(nc[i]);}}
 for(let i=nc.length;i<oc.length;i++)oc[i].remove();}
let fresh=false;
function rerender(){
 if(!cur)return;
 const w=window.innerWidth;
 let desk=null;
 if(w<1000){desk=document.getElementById('measure');desk.style.display='block';build(desk);}
 const stage=ensureStage();stage.style.display='block';build(stage);
 if(w<1000)adapt(w,desk,stage);
 if(desk){desk.innerHTML='';desk.style.display='none';}
 if(fresh||!root.firstChild){root.innerHTML='';while(stage.firstChild)root.appendChild(stage.firstChild);bindAll(root);fresh=false;}
 else{const oc=[...root.childNodes],nc=[...stage.childNodes];
   for(let i=0;i<nc.length;i++){if(i<oc.length)morph(oc[i],nc[i]);else{root.appendChild(nc[i]);if(nc[i].nodeType===1)bindAll(nc[i]);}}
   for(let i=nc.length;i<oc.length;i++)oc[i].remove();}
 stage.innerHTML='';stage.style.display='none';}
function px(v){const m=String(v).match(/^(-?\d+(?:\.\d+)?)px$/);return m?parseFloat(m[1]):null;}
function adapt(w,desk,box){
 const dEls=[...desk.querySelectorAll('*')],vEls=[...box.querySelectorAll('*')];
 const phone=w<700;
 // grids
 const dGrids=dEls.filter(e=>GRID.test(e.style.gridTemplateColumns||'')),vGrids=vEls.filter(e=>GRID.test(e.style.gridTemplateColumns||''));
 vGrids.forEach((g,i)=>{const d=dGrids[i];if(!d)return;const n=+g.style.gridTemplateColumns.match(GRID)[1];
   const ch=d.firstElementChild;if(!ch)return;const cw=ch.getBoundingClientRect().width,chh=ch.getBoundingClientRect().height;
   if(chh<20)return;
   const minCol=Math.max(44,cw*(phone?0.5:0.62));const gap=parseFloat(getComputedStyle(g).columnGap)||0;
   const avail=g.getBoundingClientRect().width;const nn=Math.max(1,Math.min(n,Math.floor((avail+gap)/(minCol+gap))));
   if(nn<n){g.style.gridTemplateColumns=`repeat(${nn}, minmax(0, 1fr))`;for(const c of g.children)if(c.style.gridColumn)c.style.gridColumn=nn>=2?c.style.gridColumn:'auto';}});
 for(const e of vEls){const s=e.style;
   const fs=px(s.fontSize);if(fs&&fs>=30){s.fontSize=(fs>=80?(phone?42:58):Math.max(phone?24:28,Math.round(fs*(phone?0.66:0.8))))+'px';}
   if(s.padding){s.padding=s.padding.split(' ').map(v=>{const p=px(v);return p!=null&&p>=36?Math.max(16,Math.round(p*(phone?0.38:0.6)))+'px':v;}).join(' ');}
   for(const k of ['paddingInlineStart','paddingInlineEnd','marginInlineStart','marginInlineEnd','paddingTop','paddingBottom']){const p=px(s[k]);if(p!=null&&p>=36)s[k]=Math.max(16,Math.round(p*(phone?0.38:0.6)))+'px';}
   const ww=px(s.width);if(ww&&ww>w-32){s.width='100%';}
   if(ww&&ww>200&&phone)s.maxWidth='100%';
   const mh=px(s.minHeight);if(mh&&mh>=600)s.minHeight=phone?(e.querySelector('img')&&mh<900?'420px':'auto'):'auto';
   if(s.maxWidth&&px(s.maxWidth)&&px(s.maxWidth)<420&&e.tagName==='ASIDE')s.maxWidth='none';
   if(s.display==='flex'&&s.flexDirection!=='column'&&!s.flexWrap&&e.tagName!=='BUTTON'&&e.tagName!=='LABEL'&&!e.closest('button')&&![...e.children].some(c=>/^1( |$)/.test(c.style.flex||'')))s.flexWrap='wrap';
   if(phone&&s.flex){const parts=s.flex.split(' ');const fb=px(parts[2]||'');if(fb&&fb>w-40){s.flex=parts[0]+' '+parts[1]+' 100%';s.minWidth='0';}}
   if(phone&&e.tagName==='HEADER'){s.gap='12px';s.flexWrap='wrap';}
   if(s.gap){const g=px(s.gap);if(g&&g>=36)s.gap=Math.round(g*0.5)+'px';}
 }
 // lesson / content-first: side panels after main
 if(phone){box.querySelectorAll('aside').forEach(a=>{if(a.parentElement&&a.parentElement.querySelector(':scope > main'))a.style.order='2';});
   box.querySelectorAll('main').forEach(m=>{m.style.order='1';});
   box.querySelectorAll('header').forEach(h=>{const k=[...h.children];if(k.length>=4){if(k[1])k[1].style.flex='1 1 calc(100% - 64px)';if(k[2]&&k[2].getAttribute('aria-label'))k[2].style.flex='1 1 100%';}});
   box.querySelectorAll('aside').forEach(a=>{const nav=a.querySelector(':scope > nav');if(!nav)return;
     a.style.order='0';a.style.flex='1 1 100%';a.style.minWidth='0';a.style.maxWidth='100%';a.style.boxSizing='border-box';a.style.padding='14px 16px';a.style.flexDirection='row';a.style.flexWrap='wrap';a.style.alignItems='center';a.style.gap='10px';
     nav.style.flexDirection='row';nav.style.flexWrap='nowrap';nav.style.overflowX='auto';nav.style.width='100%';nav.style.minWidth='0';
     nav.querySelectorAll('button').forEach(b=>{b.style.whiteSpace='nowrap';b.style.flex='0 0 auto';});
     const kids=[...a.children];kids.slice(2).forEach(k=>k.style.display='none');
     const logo=kids[0];if(logo)logo.style.padding='0';});}
 if(phone&&window.yvPhoneHeader)window.yvPhoneHeader(box);   /* optional phone header (test pages only) */
}
function route(){const h=location.hash.slice(1);if(!h||FILES[h]){if(!cur||cur.route!==(h||'home'))load(h||'home');}
 else{const t=document.getElementById(h);if(t)t.scrollIntoView({behavior:'smooth'});}}
window.addEventListener('hashchange',route);
let rt,lastW=window.innerWidth;window.addEventListener('resize',()=>{if(Math.abs(window.innerWidth-lastW)<2)return;lastW=window.innerWidth;clearTimeout(rt);rt=setTimeout(rerender,150);});
document.fonts&&document.fonts.ready.then(()=>{});
route();
})();
