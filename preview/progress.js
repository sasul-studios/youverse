/* Work checklist for Bu Sa'ad on the test pages only (not on the client's main pages). Update the list as work moves on. */
(function(){
const ITEMS=[
 ['done','مشروع Supabase لـ Youverse','أُنشئ (Mumbai)'],
 ['review','زر الاختبار في الشريط العلوي','على هذه الصفحة: ينتظر اعتمادك'],
 ['review','الرئيسية: بوابة بثلاثة أبواب','على هذه الصفحة: ينتظر اعتمادك'],
 ['review','أيقونات احترافية بدل الإيموجي','الماستركلاس، You، ونتيجة الاختبار (test-v3): ينتظر اعتمادك'],
 ['review','اليو فايندر كفضاء','finder-v3: ينتظر اعتمادك'],
 ['review','صفحة يو مينتور والحجز','mentor-v3: ينتظر اعتمادك'],
 ['done','ربط الدخول ولوحة المدير بـ Supabase','حساب المدير يعمل؛ بقي ضبط رابط الموقع في Supabase'],
 ['wait','اختبار SkipCash التجريبي + تقرير للعميل','ينتظر مفاتيح Sandbox من العميل'],
 ['next','اختيار أداة الفيديو لجلسات المرشدين','مقارنة Daily و Whereby']];
const S={done:['تم','#1E9E6A','#E3F6EE'],review:['للاعتماد','#127F87','#E1F5F6'],now:['قيد العمل','#C98A12','#FFF3DA'],next:['التالي','#6B8389','#EEF3F4'],wait:['ينتظر','#B04A5E','#FCE8EC']};
const done=ITEMS.filter(i=>i[0]==='done'||i[0]==='review').length;
const css=`#yvp-b{position:fixed;right:0;top:42%;z-index:200;background:#032E36;color:#fff;border:0;border-radius:14px 0 0 14px;padding:12px 10px;font:800 13px Almarai,sans-serif;writing-mode:vertical-rl;cursor:pointer;box-shadow:-6px 8px 24px rgba(3,46,54,.3)}
#yvp{position:fixed;top:0;right:0;bottom:0;width:min(360px,92vw);background:#fff;z-index:201;transform:translateX(105%);transition:transform .28s cubic-bezier(.2,.8,.2,1),visibility 0s .28s;visibility:hidden;box-shadow:-20px 0 60px rgba(3,46,54,.25);padding:22px 20px;overflow-y:auto;direction:rtl;font-family:Almarai,sans-serif;color:#032E36}
#yvp.on{transform:none;visibility:visible;transition:transform .28s cubic-bezier(.2,.8,.2,1)}#yvp h3{font:700 26px Amiri,serif;margin:0 0 4px}#yvp .s{color:#6B8389;font-size:13px;margin-bottom:14px}
#yvp .bar{height:8px;border-radius:8px;background:#EEF4F5;overflow:hidden;margin-bottom:18px}#yvp .bar i{display:block;height:100%;background:linear-gradient(90deg,#127F87,#5CE1E6)}
#yvp li{list-style:none;display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #F0F5F6}#yvp ul{margin:0;padding:0}
#yvp .cb{width:22px;height:22px;border-radius:7px;border:2px solid #CFE3E6;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px}
#yvp .cb.on{background:#127F87;border-color:#127F87}#yvp .cb.half{border-color:#127F87;background:#E1F5F6}
#yvp b{font-size:14.5px;display:block}#yvp small{color:#6B8389;font-size:12.5px}#yvp .st{margin-inline-start:auto;font-size:11.5px;font-weight:800;border-radius:20px;padding:3px 9px;white-space:nowrap}
#yvp .x{position:absolute;top:14px;left:14px;width:34px;height:34px;border-radius:50%;border:0;background:#F0F5F6;font-size:18px;cursor:pointer}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const tick='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const b=document.createElement('button');b.id='yvp-b';b.textContent='قائمة المهام '+done+'/'+ITEMS.length;
const p=document.createElement('aside');p.id='yvp';
p.innerHTML=`<button class="x" aria-label="إغلاق">×</button><h3>قائمة المهام</h3><div class="s">جولة ملاحظات العميل · تظهر في صفحات التجربة فقط</div>
<div class="bar"><i style="width:${Math.round(done/ITEMS.length*100)}%"></i></div><ul>${ITEMS.map(([k,t,n])=>`<li><span class="cb ${k==='done'?'on':k==='review'?'half':''}">${k==='done'?tick:k==='review'?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#127F87" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</span><span><b>${t}</b>${n?'<small>'+n+'</small>':''}</span><span class="st" style="color:${S[k][1]};background:${S[k][2]}">${S[k][0]}</span></li>`).join('')}</ul>`;
const add=()=>{document.body.appendChild(b);document.body.appendChild(p);};
if(document.body)add();else addEventListener('DOMContentLoaded',add);
b.onclick=()=>p.classList.add('on');p.querySelector('.x').onclick=()=>p.classList.remove('on');
})();
