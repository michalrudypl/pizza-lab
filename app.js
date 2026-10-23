'use strict';
const el=id=>document.getElementById(id);
const fields=Object.keys(PizzaRules.defaults).filter(id=>el(id));
const savedFields=[...fields,'bake','flourName'];
const fmt=(n,d=1)=>Number(n).toLocaleString('pl-PL',{minimumFractionDigits:0,maximumFractionDigits:d});
const when=n=>new Date(n).toLocaleString('pl-PL',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const time=n=>new Date(n).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
const dateInput=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
const apply=s=>savedFields.forEach(id=>{if(s[id]===undefined)return;if(id==='saltkg'&&Number.isFinite(Number(s[id]))){el(id).value=Number(Number(s[id]).toFixed(2));el(id).dataset.rawValue=s[id];}else el(id).value=s[id];});
const read=()=>({...PizzaRules.defaults,...Object.fromEntries(savedFields.map(id=>[id,el(id).value])),saltkg:el('saltkg').dataset.rawValue??el('saltkg').value,startcm:5});
const load=()=>{try{const s=JSON.parse(localStorage.getItem('pizzaSettings'));return s&&typeof s==='object'&&!Array.isArray(s)?s:null;}catch{return null;}};
const save=()=>{try{localStorage.setItem('pizzaSettings',JSON.stringify(read()));}catch{el('copyStatus').textContent='Nie udało się zachować ustawień na tym urządzeniu.';}};
const writeRows=(id,items)=>{const target=el(id);target.replaceChildren();for(const [label,value] of items){const row=document.createElement('div'),name=document.createElement('span'),amount=document.createElement('b');row.className='line';name.textContent=label;amount.textContent=value;row.append(name,amount);target.append(row);}};
let result=null,latest='',chart=null;
function useReference(){const keep={balls:el('balls').value,weight:el('weight').value,bake:el('bake').value};const s=PizzaRules.referenceSettings(el('method').value);if(s)apply({...s,...keep});render();}
function sync(v){
 const prefer=v.method!=='direct',coldPrefer=v.method==='poolish'&&v.preferMode==='cold',cold=Number(v.cold)>0||coldPrefer;
 el('preferFields').hidden=!prefer;el('preferDoseField').hidden=!prefer;el('preferColdField').hidden=!coldPrefer;
 el('fridgeField').hidden=!cold;el('coldPositionField').hidden=Number(v.cold)===0;el('ddtPreferField').hidden=!prefer;
 document.querySelectorAll('[data-method]').forEach(n=>n.hidden=n.dataset.method!==v.method);
 el('manualDoses').hidden=v.yeastMode!=='manual';el('useCold').checked=cold;
 el('share').min=v.method==='biga'?20:10;el('preferTemp').max=v.method==='biga'?20:28;
 el('ph').min=v.method==='biga'?12:coldPrefer?.5:4;el('ph').max=coldPrefer?2:24;
 const reference=PizzaRules.referenceStatus(v),target=el('sourceInfo');target.replaceChildren();
 if(reference){const a=document.createElement('a');a.href=reference.url;a.target='_blank';a.rel='noopener';a.textContent=reference.name;const note=document.createElement('p');note.textContent=reference.note;target.append(a,note);}
 renderDDT();
}
function renderDDT(){
 const value=PizzaRules.waterTemperature({target:el('ddtTarget').value,room:el('ddtRoom').value,flour:el('ddtFlour').value,friction:el('ddtFriction').value,...(el('method').value==='direct'?{}:{preferment:el('ddtPrefer').value})});
 el('ddtResult').textContent=value===null?'Uzupełnij poprawne temperatury.':value<0||value>40?'Wynik poza zakresem 0–40°C. Zmień warunki i sprawdź pomiarem.':`Woda: około ${fmt(value)}°C. Przykładowy cel i poprawkę dostosuj do własnego mieszania.`;
}
function render(){
 const v=read();sync(v);result=PizzaRules.calculate(v);latest='';chart=null;
 savedFields.forEach(id=>el(id).removeAttribute('aria-invalid'));
 const errors=el('validation');errors.replaceChildren();el('recipe').hidden=!!result.errors.length;
 if(result.errors.length){const box=document.createElement('div'),list=document.createElement('ul');box.className='notice error';result.errors.forEach(e=>{const item=document.createElement('li');item.textContent=e.text;list.append(item);const input=el(e.field);input?.setAttribute('aria-invalid','true');if(input&&el('advanced').contains(input))el('advanced').open=true;});box.append(list);errors.append(box);save();return;}
 const r=result,prefer=v.method!=='direct',g=n=>fmt(n)+' g',yg=n=>fmt(n,3)+' g';
 el('recipeMeta').textContent=`${v.balls} × ${v.weight} g · ${v.hyd}% wody · ${fmt(r.hours,2)} h łącznie`;
 el('doseNote').textContent=r.reference.adapted?'Własna adaptacja. Dawki ze źródła nie dopasowują się automatycznie do nowego czasu.':'Dawki z receptury źródłowej. Gotowość sprawdź przed użyciem.';
 el('preferRecipe').hidden=!prefer;el('preferTitle').textContent=v.method==='biga'?'1. Biga':'1. Poolish';el('finalTitle').textContent=prefer?'2. Dodaj do dojrzałego zaczynu':'Połącz składniki';
 if(prefer)writeRows('preferIngredients',[['Mąka',g(r.pf)],['Woda',g(r.pw)],['Drożdże '+(v.yeast==='fresh'?'świeże':'instant'),yg(r.preferYeast)]]);
 writeRows('finalIngredients',[...(prefer?[['Cały dojrzały zaczyn',g(r.pf+r.pw+r.preferYeast)]]:[]),['Mąka',g(r.ff)],['Woda',g(r.fw)],['Sól',g(r.salt)],['Drożdże '+(prefer?'dodatkowo':'do ciasta'),yg(r.finalYeast)]]);
 const stages=PizzaRules.timeline(r,v.bake),start=el('startInfo');start.replaceChildren();
 const label=document.createElement('span'),value=document.createElement('strong');
 label.textContent=stages.length?'Zacznij przygotowanie':'Czas przygotowania';value.textContent=stages.length?when(stages[0].startsAt):fmt(r.hours,2)+' h';start.append(label,value);
 if(stages.length&&stages[0].startsAt<Date.now()){const note=document.createElement('small');note.textContent='Start wypada w przeszłości — wybierz późniejsze pieczenie.';start.append(note);}
 const timeline=el('timeline');timeline.replaceChildren();(stages.length?stages:r.steps).forEach(s=>{const item=document.createElement('li'),title=document.createElement('b'),note=document.createElement('small');title.textContent=(stages.length?when(s.startsAt)+' — ':'')+s.title+(s.hours?' · '+fmt(s.hours,2)+' h':'');note.textContent=s.instruction;item.append(title,note);timeline.append(item);});
 const warnings=el('warnings');warnings.replaceChildren();r.warnings.forEach(w=>{const item=document.createElement('li');item.textContent=w;warnings.append(item);});el('warningDetails').hidden=!r.warnings.length;el('warningTitle').textContent=`Uwagi do przepisu (${r.warnings.length})`;
 const selected=el('windowKind').value;el('windowKind').replaceChildren();PizzaRules.useWindows(r).forEach(w=>{const option=document.createElement('option');option.value=w.kind;option.textContent=w.label;el('windowKind').append(option);});if([...el('windowKind').options].some(o=>o.value===selected))el('windowKind').value=selected;renderWindow();
 latest=`PIZZA LAB — ${PizzaRules.labels[v.method]}\n${el('recipeMeta').textContent}\n${v.flourName?'Mąka: '+v.flourName+'\n':''}Sól: ${fmt(r.salt)} g (${fmt(r.saltPct,2)}% mąki)\nDrożdże: ${v.yeast==='fresh'?'świeże':'instant'}\n`+(prefer?`\nZACZYN\nMąka ${g(r.pf)}\nWoda ${g(r.pw)}\nDrożdże ${yg(r.preferYeast)}\n\nDODAJ DO CAŁEGO DOJRZAŁEGO ZACZYNU\n`:'\nSKŁADNIKI\n')+`Mąka ${g(r.ff)}\nWoda ${g(r.fw)}\nSól ${g(r.salt)}\nDrożdże ${yg(r.finalYeast)}\n\nHARMONOGRAM\n`+(stages.length?stages:r.steps).map(s=>(stages.length?when(s.startsAt)+' — ':'')+s.title+(s.hours?' / '+fmt(s.hours,2)+' h':'')).join('\n')+`\n\n${el('doseNote').textContent}\nBaza: ${r.reference.url}\n`+r.warnings.join('\n');
 save();
}
function renderWindow(){
 chart=null;const root=el('windowChart');root.replaceChildren();if(!result||result.errors.length)return;
 const w=PizzaRules.useWindows(result).find(w=>w.kind===el('windowKind').value);if(!w)return;
 const stage=PizzaRules.timeline(result,el('bake').value).find(s=>s.kind===w.kind),start=stage?.startsAt;
 const from=Math.max(0,Math.min(w.early-1,w.duration-3)),to=Math.max(w.late+1,w.duration+3),position=n=>(n-from)/(to-from)*100;
 const text=document.createElement('p');text.className='muted';text.textContent=start!==undefined?`Kontrole: ${when(start+w.early*3600000)} – ${when(start+w.late*3600000)}`:`Kontrole po ${fmt(w.early,2)}–${fmt(w.late,2)} h od startu etapu.`;
 const track=document.createElement('div');track.className='track';track.setAttribute('role','img');track.setAttribute('aria-label',text.textContent+' Kreska oznacza plan; zakres nie potwierdza dojrzałości.');
 const band=document.createElement('div');band.className='band';band.style.left=position(w.early)+'%';band.style.width=position(w.late)-position(w.early)+'%';
 const plan=document.createElement('div');plan.className='marker';plan.style.left=position(w.duration)+'%';const pick=document.createElement('div');pick.className='pick';const now=document.createElement('div');now.className='marker now';now.hidden=true;track.append(band,plan,now,pick);
 const axis=document.createElement('div');axis.className='axis';[from,to].forEach(n=>{const tick=document.createElement('span');tick.textContent=start!==undefined?time(start+n*3600000):fmt(n,2)+' h';axis.append(tick);});
 const label=document.createElement('label');label.htmlFor='windowOffset';label.textContent='Sprawdź inną godzinę';const slider=document.createElement('input');slider.id='windowOffset';slider.type='range';slider.min=Math.max(-3,-w.duration);slider.max=3;slider.step=.25;slider.value=0;
 const chosen=document.createElement('p'),buttons=document.createElement('div'),advice=document.createElement('p');buttons.className='window-buttons';advice.className='muted';advice.textContent=w.note;
 const update=value=>{const offset=Math.max(Number(slider.min),Math.min(3,value));slider.value=offset;pick.style.left=position(w.duration+offset)+'%';chosen.textContent=(offset===0?'Plan':fmt(Math.abs(offset),2)+' h '+(offset<0?'wcześniej':'później'))+(start!==undefined?' · '+when(start+(w.duration+offset)*3600000):'');slider.setAttribute('aria-valuetext',chosen.textContent);};
 slider.oninput=()=>update(Number(slider.value));[['−1 h',-1],['Plan',0],['+1 h',1]].forEach(([text,offset])=>{const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=text;button.onclick=()=>update(offset);buttons.append(button);});
 const live=document.createElement('p');live.className='muted';root.append(text,track,axis,label,slider,chosen,buttons,live,advice);update(0);chart={start,position,now,live};updateNow();
}
function updateNow(){if(!chart||chart.start===undefined)return;const elapsed=(Date.now()-chart.start)/3600000,pos=chart.position(elapsed);chart.now.hidden=pos<0||pos>100;if(!chart.now.hidden)chart.now.style.left=pos+'%';chart.live.textContent=chart.now.hidden?'':'Niebieska kreska: teraz według planu.';}
function setCold(enabled){
 if(!enabled){apply({cold:0});if(el('method').value==='poolish'&&el('preferMode').value==='cold')apply({preferMode:'room',ph:15,pcold:0});}
 else if(el('method').value==='poolish'){apply({preferMode:'cold',ph:1,pcold:24});}
 else apply({cold:24});
 render();
}
apply(PizzaRules.referenceSettings('poolish'));
const previous=load();if(previous)apply(PizzaRules.migrateSettings(previous));
if(!previous){const d=new Date(Date.now()+48*3600000);d.setHours(15,0,0,0);el('bake').value=dateInput(d);}
savedFields.forEach(id=>el(id).addEventListener(el(id).tagName==='SELECT'?'change':'input',()=>{
 el('copyStatus').textContent='';
 if(id==='saltkg')delete el('saltkg').dataset.rawValue;
 if(id==='method'){useReference();return;}
 if(id==='preferMode')apply(el(id).value==='cold'?{ph:1,pcold:24}:{ph:15,pcold:0});
 if(id==='hyd'&&el('method').value==='poolish'&&Number(el('share').value)>Number(el('hyd').value))el('share').value=el('hyd').value;
 render();
}));
el('useCold').onchange=()=>setCold(el('useCold').checked);el('reset').onclick=useReference;el('windowKind').onchange=renderWindow;
['ddtTarget','ddtRoom','ddtFlour','ddtFriction','ddtPrefer'].forEach(id=>el(id).addEventListener('input',renderDDT));
el('copy').onclick=async()=>{if(!latest)return;try{await navigator.clipboard.writeText(latest);el('copyStatus').textContent='Przepis skopiowany.';}catch{el('copyStatus').textContent='Kopiowanie niedostępne w tej przeglądarce.';}};
render();setInterval(updateNow,1000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
