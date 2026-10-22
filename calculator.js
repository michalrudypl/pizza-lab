'use strict';
// Source-inspired starting points and conservative app limits; not a validated
// biological fermentation model. Keep assumptions visible in README and the UI.
const PizzaRules = (() => {
  const defaults={method:'poolish',preferMode:'room',balls:4,weight:250,hyd:65,saltkg:18,share:30,ph:12,pcold:0,preferTemp:21,bigaHyd:45,temp:21,yeast:'fresh',adjust:100,startcm:5,bulk:1,cold:0,fridge:4,proof:4};
  const labels={poolish:'Poolish',biga:'Biga',direct:'Bez zaczynu'};
  const fields={balls:[1,12,1,'Liczba kulek'],weight:[150,500,5,'Waga kulki'],hyd:[55,80,1,'Hydratacja'],saltkg:[10,24,.5,'Sól (g/kg ciasta)'],temp:[16,28,1,'Temperatura końcowego ciasta w TO'],adjust:[50,150,5,'Korekta drożdży'],bulk:[0,20,.5,'Ciasto przed kulkowaniem'],cold:[0,48,.5,'Kulki w lodówce'],proof:[1,8,.5,'Kulki w TO'],share:[10,100,1,'Udział mąki w zaczynie'],ph:[.5,20,.5,'Zaczyn w TO'],pcold:[12,24,.5,'Poolish w TK'],preferTemp:[16,28,1,'Temperatura zaczynu w TO'],bigaHyd:[45,50,1,'Hydratacja bigi'],fridge:[3,5,.5,'Temperatura lodówki'],startcm:[2,10,.5,'Poziom w słoiku']};
  const poolishMax=t=>t<=20?18:t<=23?16:t<=26?12:8;
  const finalMax=(t,method='poolish')=>method==='direct'?(t<=20?24:t<=23?18:t<=26?12:8):(t<=20?12:t<=23?10:t<=26?8:6);
  const normalize=s=>({...defaults,...s,preferTemp:s?.preferTemp??s?.temp??defaults.preferTemp});
  const bad=(field,text)=>({field,text});
  const rate=t=>Math.pow(2,(t-21)/10);
  function calculate(input){
    const s=normalize(input),v={...s},errors=[],warnings=[];
    if(!Object.hasOwn(labels,s.method))errors.push(bad('method','Wybierz poolish, bigę albo ciasto bez zaczynu.'));
    if(!['fresh','instant'].includes(s.yeast))errors.push(bad('yeast','Wybierz drożdże świeże albo instant.'));
    if(!['room','cold'].includes(s.preferMode))errors.push(bad('preferMode','Wybierz sposób dojrzewania poolishu.'));
    const prefer=s.method!=='direct',coldPrefer=s.method==='poolish'&&s.preferMode==='cold';
    const keys=['balls','weight','hyd','saltkg','temp','adjust','bulk','cold','proof'];
    if(prefer)keys.push('share','ph','preferTemp');
    if(s.method==='biga')keys.push('bigaHyd');
    if(coldPrefer)keys.push('pcold');
    if(Number(s.cold)>0||coldPrefer)keys.push('fridge');
    if(s.method==='poolish')keys.push('startcm');
    for(const k of keys){const [min,max,step,label]=fields[k],raw=s[k];const n=(typeof raw==='number'||typeof raw==='string'&&raw.trim()!=='')?Number(raw):NaN;v[k]=n;
      if(!Number.isFinite(n)||n<min||(k!=='ph'&&n>max)||Math.abs((n-min)/step-Math.round((n-min)/step))>1e-7)errors.push(bad(k,`${label}: wpisz ${min}–${max}, co ${String(step).replace('.',',')}.`));}
    if(errors.length)return {errors,warnings};
    if(!prefer){v.share=0;v.ph=0;v.pcold=0;}
    if(!coldPrefer)v.pcold=0;
    if(!(v.cold>0||coldPrefer))v.fridge=4;
    if(s.method==='poolish'){
      if(v.share>50)errors.push(bad('share','Poolish: maksymalnie 50% całej mąki w zakresie aplikacji.'));
      if(coldPrefer){if(v.ph>2)errors.push(bad('ph','Poolish z lodówką: 0,5–2 h na rozpoczęcie w TO, następnie 12–24 h w TK. 50 h samego poolishu pozostaje poza zakresem.'));}
      else if(v.ph<4||v.ph>poolishMax(v.preferTemp))errors.push(bad('ph',`Poolish przy ${v.preferTemp}°C: 4–${poolishMax(v.preferTemp)} h w TO. Na dłuższy plan wybierz poolish z TK.`));
    }
    if(s.method==='biga'){
      if(v.preferTemp<16||v.preferTemp>20)errors.push(bad('preferTemp','Biga w tym modelu wymaga chłodnego miejsca 16–20°C. Lodówka 4°C nie zastępuje tych warunków.'));
      const max=v.preferTemp<=18?20:16;
      if(v.ph<12||v.ph>max)errors.push(bad('ph',`Biga przy ${v.preferTemp}°C: 12–${max} h. Punkt startowy: 16 h przy 17°C.`));
      if(v.share<20)errors.push(bad('share','Biga: użyj 20–100% całej mąki.'));
      if(v.preferTemp>18)warnings.push('Biga powyżej 18°C dojrzewa szybciej. Pilnuj temperatury samego zaczynu i jego struktury.');
    }
    const roomHours=.5+v.bulk+v.proof,minRoom=s.method==='direct'&&v.cold===0?3:2;
    if(roomHours<minRoom||roomHours>finalMax(v.temp,s.method))errors.push(bad('proof',`Gotowe ciasto przy ${v.temp}°C: ${minRoom}–${finalMax(v.temp,s.method)} h łącznie w TO, z 30 min wyrabiania.`));
    if(v.cold>0&&v.proof<2)errors.push(bad('proof','Po TK przeznacz minimum 2 h na ogrzanie i wyrastanie kulek w TO.'));
    if(s.method!=='direct'&&v.bulk>4)errors.push(bad('bulk','Po dojrzałym zaczynie ten model dopuszcza maksymalnie 4 h przed kulkowaniem w TO.'));
    if(errors.length)return {errors,warnings};
    // Count warm handling plus an approximate cooling shoulder and cold activity.
    // This equivalent-time heuristic is only for yeast planning, not a maturity score.
    const coldRate=.06*Math.pow(2,(v.fridge-4)/6);
    const cooling=Math.min(v.cold,1.5),equivalentHours=roomHours*rate(v.temp)+cooling*(rate(v.temp)+coldRate)/2+Math.max(0,v.cold-cooling)*coldRate;
    const correction=v.adjust/100;
    const targetFreshPct=.2*Math.pow(7.5/equivalentHours,1.15)*correction;
    let preferFreshPct=0;
    if(s.method==='poolish')preferFreshPct=(coldPrefer?.14*Math.pow(25/(v.ph+v.pcold*Math.pow(2,(v.fridge-4)/6)),1.1):.25*Math.pow(12/v.ph,1.2))*Math.pow(2,(21-v.preferTemp)/10)*correction;
    if(s.method==='biga')preferFreshPct=.7*Math.pow(18/v.ph,1.1)*Math.pow(2,(18-v.preferTemp)/10)*correction;
    const share=v.share/100;
    // Approximate contribution from a ripe preferment; never claim these factors
    // measure yeast growth. Extra yeast can be zero, never negative.
    const carryFactor=s.method==='poolish'?4:2;
    const carryFreshPct=preferFreshPct*share*carryFactor;
    const finalFreshPct=Math.max(0,targetFreshPct-carryFreshPct);
    const conversion=v.yeast==='instant'?1/3:1,preferPct=preferFreshPct*conversion,finalPct=finalFreshPct*conversion;
    const total=v.balls*v.weight,hyd=v.hyd/100,salt=total*v.saltkg/1000;
    const flour=(total-salt)/(1+hyd+(share*preferPct+finalPct)/100),water=flour*hyd;
    const pf=flour*share,pw=pf*(s.method==='biga'?v.bigaHyd/100:1),preferYeast=pf*preferPct/100,finalYeast=flour*finalPct/100;
    const ff=flour-pf,fw=water-pw,saltPct=salt/flour*100;
    if(![flour,water,pf,pw,preferYeast,finalYeast,ff,fw].every(Number.isFinite)||flour<=0||fw<0||ff<-.00001)errors.push(bad('share','Te proporcje nie dają poprawnego bilansu mąki i wody. Zmniejsz udział zaczynu.'));
    if(saltPct>3.5)errors.push(bad('saltkg',`Sól to ${saltPct.toFixed(2).replace('.',',')}% mąki; limit aplikacji wynosi 3,5%. Zmniejsz g/kg ciasta.`));
    if(errors.length)return {errors,warnings};
    if(saltPct<2||saltPct>3.2)warnings.push('Sól poza zalecanym zakresem aplikacji 2–3,2% mąki.');
    if(v.hyd>70)warnings.push('Ponad 70% wody: potrzebna odpowiednio chłonna mąka i wprawa.');
    if(s.method==='biga')warnings.push('Do bigi wybierz mocną mąkę przeznaczoną do dłuższej fermentacji. Wymieszaj krótko w grudki, bez wyrabiania gładkiego ciasta.');
    if(s.method==='poolish'&&!coldPrefer&&(v.ph>poolishMax(v.preferTemp)-2||v.preferTemp>=25))warnings.push('Zacznij sprawdzać poolish wcześniej; nie czekaj na zegar, jeżeli wierzch już opada.');
    if(s.method==='poolish'&&!coldPrefer&&v.ph<8)warnings.push('Krótki poolish daje mniej czasu na rozwój aromatu. Potwierdź dojrzałość po napowietrzeniu.');
    if(prefer&&v.share>40)warnings.push('Duży udział dojrzałego zaczynu: obserwuj ciasto wcześniej, szczególnie podczas wyrastania w TO.');
    if(v.cold>24)warnings.push('Długi TK: dobierz mąkę do takiej fermentacji i zmierz temperaturę lodówki. Czas chłodzenia zależy od kulek i pojemnika.');
    if(prefer&&carryFreshPct>targetFreshPct*1.5&&(v.cold>12||roomHours>5))warnings.push('Dojrzały zaczyn wnosi dużo aktywności względem tego planu. Dodatkowe drożdże wynoszą 0 g; rozważ mniejszy udział zaczynu lub krótszą fermentację gotowego ciasta.');
    if(v.adjust!==100)warnings.push('Ręczna korekta drożdży wymaga obserwacji i zapisu rzeczywistego czasu wyrastania.');
    if([preferYeast,finalYeast].some(x=>x>0&&x<.1))warnings.push('Dawka poniżej 0,1 g wymaga precyzyjnego ważenia. Nie zaokrąglaj jej do zera.');
    const result={errors,warnings,v,total,hyd,salt,share,flour,water,pf,pw,preferYeast,finalYeast,yeast:preferYeast+finalYeast,ff:Math.max(0,ff),fw,saltPct,preferPct,finalPct,equivalentHours,roomHours};
    result.steps=makeSteps(result);result.hours=result.steps.reduce((n,s)=>n+s.hours,0);
    return result;
  }
  function makeSteps(r){const v=r.v,st=[];const add=(kind,title,hours,instruction)=>st.push({kind,title,hours,instruction});
    if(v.method!=='direct'){
      add('prefer',`Przygotuj ${v.method==='biga'?'bigę':'poolish'}`,v.ph,v.method==='biga'?`Połącz mąkę, wodę i drożdże w luźne grudki. Nie wyrabiaj. Przykryj i utrzymuj ${v.preferTemp}°C. Dojrzała biga jest napowietrzona i włóknista wewnątrz.`:`Wymieszaj równe masy mąki i wody z drożdżami, bez soli. Przykryj z zapasem miejsca. Trzymaj w ${v.preferTemp}°C; ${v.preferMode==='cold'?'po tym etapie przenieś do lodówki.':'oceniaj napowietrzenie i początek spłaszczania wierzchu.'}`);
      if(v.method==='poolish'&&v.preferMode==='cold')add('preferCold','Poolish w lodówce',v.pcold,`Wstaw przykryty poolish do ${v.fridge}°C. Chłodzenie nie zatrzymuje fermentacji natychmiast. Przed użyciem oceń napowietrzenie i strukturę.`);
    }
    add('mix',v.method==='direct'?'Wyrób ciasto bez zaczynu':'Wyrób ciasto z dojrzałym zaczynem',.5,v.method==='biga'?'Rozdrobnij dojrzałą bigę w części pozostałej wody. Stopniowo dodawaj resztę składników i wodę; sól dodaj do końcowego ciasta. Wyrób do spójności.':v.method==='poolish'?'Połącz dojrzały poolish z pozostałą mąką, wodą, solą i dodatkową dawką drożdży podaną w przepisie. Wyrób do spójności.':'Połącz wodę, drożdże, mąkę i sól. Wyrób do spójnego, elastycznego ciasta. Nie dodawaj zaczynu.');
    if(v.bulk)add('bulk','Ciasto przed kulkowaniem w TO',v.bulk,`Przykryj i zostaw w ${v.temp}°C. Oceniaj napowietrzenie; nie wymagaj sztywno podwojenia objętości.`);
    add('shape','Podziel i uformuj kulki',0,`Podziel na ${v.balls} porcji po ${v.weight} g. Uformuj napięty wierzch i zamknij łączenie od spodu. Włóż do przykrytych pojemników.`);
    if(v.cold)add('cold','Kulki w lodówce',v.cold,`Przechowuj przykryte kulki w zmierzonych ${v.fridge}°C. Zostaw miejsce na wzrost.`);
    add('proof','Kulki w TO przed pieczeniem',v.proof,`Zostaw w ${v.temp}°C pod przykryciem. Gotowa kulka jest napowietrzona, rozluźniona i rozciąga się bez silnego cofania. Gdy mocno się kurczy, daj jej więcej czasu. Nagrzej piec zgodnie z jego instrukcją.`);
    add('bake','Pieczenie',0,'Rozciągaj od środka, zachowując gaz w rancie. Nałóż dodatki i wypiekaj, obserwując spód i rant. Czas zależy od pieca i temperatury płyty.');return st;
  }
  function plan(input,earliest,bake){
    const base=normalize(input),start=new Date(earliest).getTime(),end=new Date(bake).getTime(),windowHours=(end-start)/3600000;
    if(!Number.isFinite(windowHours)||windowHours<=0)return {error:'Ustaw pieczenie później niż najwcześniejszy start.'};
    const v={...base,bulk:base.method==='direct'?2:base.method==='biga'?.5:1,proof:base.method==='biga'?2:3,cold:0};
    const warmMinimum=base.method==='direct'?3:2;
    if(v.temp>=27)v.proof=2;
    if(v.method==='biga'){v.preferTemp=17;v.ph=16;v.share=Math.max(20,Math.min(100,Number(base.share)||50));v.preferMode='room';v.pcold=0;}
    else if(v.method==='poolish'&&v.preferMode==='cold'){v.ph=1;v.pcold=24;}
    else if(v.method==='poolish'){v.ph=Math.min(12,poolishMax(Number(v.preferTemp)));v.pcold=0;}
    else{v.ph=0;v.pcold=0;}
    let desired=.5+v.bulk+v.proof+v.ph+v.pcold;
    if(desired>windowHours){
      if(v.method==='poolish'&&v.preferMode==='cold')v.pcold=Math.max(12,Math.floor((windowHours-(.5+v.bulk+v.proof)-v.ph)*2)/2);
      else if(v.method==='poolish')v.ph=Math.max(4,Math.floor((windowHours-(.5+v.bulk+v.proof))*2)/2);
      else if(v.method==='biga')v.ph=Math.max(12,Math.floor((windowHours-(.5+v.bulk+v.proof))*2)/2);
      desired=.5+v.bulk+v.proof+v.ph+v.pcold;
      if(desired>windowHours){v.bulk=v.method==='direct'?1:0;v.proof=v.method==='direct'?1.5:1.5;}
    }
    desired=.5+v.bulk+v.proof+v.ph+v.pcold;
    if(desired>windowHours||.5+v.bulk+v.proof<warmMinimum){const min=(v.method==='biga'?12:v.method==='poolish'?(v.preferMode==='cold'?12.5:4):0)+warmMinimum;return {error:`Na tę metodę potrzeba w zakresie aplikacji co najmniej około ${min} h. Wybierz późniejsze pieczenie lub ${v.method==='poolish'&&v.preferMode==='cold'?'poolish tylko w TO albo ':''}ciasto bez zaczynu.`};}
    const extra=windowHours-desired;
    // Prefer a practical overnight final cold phase. Extra available time may
    // remain unused; never stretch a preferment just to fill the whole window.
    if(extra>=8){v.cold=Math.min(24,Math.floor(extra*2)/2);v.proof=Math.max(2,v.proof);}
    const result=calculate(v);
    if(result.errors.length)return {error:result.errors.map(e=>e.text).join(' ')};
    const startsAt=end-result.hours*3600000;
    if(startsAt<start-1)return {error:'Brakuje czasu na ten plan. Wybierz późniejsze pieczenie.'};
    return {settings:v,result,startsAt,endsAt:end,message:'Plan mieści się w dostępnym czasie. Zapas pozostaje przed rozpoczęciem; dojrzałość sprawdzaj w trakcie.'};
  }
  function timeline(result,bake){let time=new Date(bake).getTime()-result.hours*3600000;if(!Number.isFinite(time))return [];return result.steps.map(s=>{const item={...s,startsAt:time};time+=s.hours*3600000;return item;});}
  return {defaults,fields,labels,normalize,poolishMax,finalMax,calculate,plan,timeline};
})();
if(typeof module!=='undefined')module.exports=PizzaRules;
