/* Test page v2: modern phone header + "the journey" section (only YouFinder and YouPartner are worlds) */
(function(){
const P=window.DC_PAGES;
const rep=(k,a,b)=>{if(P[k].indexOf(a)<0)console.warn('v2: not found in',k,a.slice(0,40));P[k]=P[k].split(a).join(b);};
const tagHTML='<span style="align-self: flex-start; font-size: 13px; font-weight: 800; color: {{w.dot}}; background: #FFFFFF; padding: 5px 12px; border-radius: 30px">{{w.tag}}</span>\n<h3 ';
/* Arabic */
rep('Main.dc.html','أربعة عوالم، رحلة واحدة','رحلة واحدة، وعالمان');
rep('Main.dc.html','كل عالم له لون، لتعرف دائماً أين أنت في رحلتك.','تبدأ بالاختبار، ثم تنطلق في عالمَين: YouFinder و YouPartner، وتتابع كل شيء في مساحتك You.');
rep('Main.dc.html',"title:'الاختبار',","title:'الاختبار',tag:'نقطة البداية',");
rep('Main.dc.html',"title:'YouFinder',","title:'YouFinder',tag:'عالم',");
rep('Main.dc.html',"title:'YouPartner',","title:'YouPartner',tag:'عالم',");
rep('Main.dc.html',"title:'You',","title:'You',tag:'مساحتك',");
/* English */
rep('Main-EN.dc.html','Four worlds, one journey','One journey, two worlds');
rep('Main-EN.dc.html','Each world has its own colour, so you always know where you are.','Start with the test, explore the YouFinder and YouPartner worlds, and follow everything in your own space, You.');
rep('Main-EN.dc.html',"title:'The Test',","title:'The Test',tag:'Starting point',");
rep('Main-EN.dc.html',"title:'YouFinder',","title:'YouFinder',tag:'World',");
rep('Main-EN.dc.html',"title:'YouPartner',","title:'YouPartner',tag:'World',");
rep('Main-EN.dc.html',"title:'You',","title:'You',tag:'Your space',");
for(const k of ['Main.dc.html','Main-EN.dc.html'])P[k]=P[k].replace(/(<sc-for list="\{\{worlds\}\}"[\s\S]*?)<h3 /,(m,a)=>a+tagHTML);

/* phone header: logo · language · menu button; links open in a frosted panel */
window.yvPhoneHeader=function(box){
 box.querySelectorAll('header').forEach(h=>{
  const row=h.firstElementChild;if(!row||row.dataset.yv)return;
  const kids=[...row.children],logo=kids[0],nav=row.querySelector(':scope > nav');if(!logo||!nav)return;
  row.dataset.yv='1';h.classList.add('yv-h');
  const rest=kids.filter(k=>k!==logo&&k!==nav);
  const bar=document.createElement('div');bar.className='yv-bar';
  const drawer=document.createElement('div');drawer.className='yv-drawer';
  nav.removeAttribute('style');[...nav.children].forEach(a=>{if((a.getAttribute('style')||'').includes('#032E36'))a.classList.add('on');a.removeAttribute('style');});
  drawer.appendChild(nav);
  const acts=document.createElement('div');acts.className='yv-acts';
  rest.forEach(r=>{
   if(r.tagName==='DIV'){[...r.children].forEach(a=>{const t=a.textContent.trim();
     if(t==='EN'||t==='عربي'){a.className='yv-lang';a.removeAttribute('style');bar.appendChild(a);}
     else{const main=(a.getAttribute('style')||'').includes('#127F87');a.removeAttribute('style');a.className=main?'yv-main':'yv-sec';acts.appendChild(a);}});}
   else{if(r.tagName==='A'){r.removeAttribute('style');r.className='yv-main';acts.appendChild(r);}else{r.style.width='38px';r.style.height='38px';bar.appendChild(r);}}});
  if(acts.children.length)drawer.appendChild(acts);
  const en=/-EN/.test(location.hash)||document.documentElement.lang==='en'||(logo.getAttribute('aria-label')||'').includes('home');
  const btn=document.createElement('button');btn.className='yv-burger';btn.type='button';btn.setAttribute('aria-label',en?'Menu':'القائمة');btn.innerHTML='<i></i><i></i><i></i>';
  bar.appendChild(btn);
  row.innerHTML='';row.removeAttribute('style');row.className='yv-row';
  const img=logo.querySelector('img');if(img)img.style.height='34px';
  row.appendChild(logo);row.appendChild(bar);row.appendChild(drawer);});
};
const html=document.documentElement;
document.addEventListener('click',e=>{
 if(e.target.closest('.yv-burger')){html.classList.toggle('yv-menu');return;}
 if(e.target.closest('.yv-drawer a')||!e.target.closest('.yv-drawer'))html.classList.remove('yv-menu');});
addEventListener('hashchange',()=>html.classList.remove('yv-menu'));
addEventListener('resize',()=>{if(innerWidth>=700)html.classList.remove('yv-menu');});
})();
