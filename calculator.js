'use strict';
// Source-inspired starting points and conservative app limits; not a validated
// biological fermentation model. Keep assumptions visible in README and the UI.
const PizzaRules = (() => {
  const defaults={method:'poolish',preferMode:'room',balls:4,weight:250,hyd:65,saltkg:18,share:30,ph:12,pcold:0,preferTemp:21,bigaHyd:45,temp:21,yeast:'fresh',adjust:100,startcm:5,bulk:1,cold:0,fridge:4,proof:4,yeastMode:'reference',preferDose:1.43,finalDose:1,mixHours:.5,coldPosition:'balls',doughTemp:'',flourW:'',checkBefore:1,checkAfter:1};
  const labels={poolish:'Poolish',biga:'Biga',direct:'Bez zaczynu'};
  const fields={preferDose:[0,30,0,'Drożdże w zaczynie'],finalDose:[0,30,0,'Drożdże w końcowym cieście'],mixHours:[.25,2,.25,'Przygotowanie ciasta'],checkBefore:[.25,3,.25,'Kontrola przed planem'],checkAfter:[.25,3,.25,'Kontrola po planie'],balls:[1,12,1,'Liczba kulek'],weight:[150,500,5,'Waga kulki'],hyd:[55,80,1,'Hydratacja'],saltkg:[10,24,0,'Sól (g/kg ciasta)'],temp:[16,28,1,'Temperatura pomieszczenia TO'],adjust:[50,150,5,'Korekta drożdży'],bulk:[0,24,.25,'Ciasto przed kulkowaniem'],cold:[0,48,.5,'Kulki w lodówce'],proof:[.5,24,.25,'Kulki w TO'],share:[10,100,1,'Udział mąki w zaczynie'],ph:[.5,24,.5,'Zaczyn w TO'],pcold:[12,24,.5,'Poolish w TK'],preferTemp:[16,28,1,'Temperatura zaczynu w TO'],bigaHyd:[45,50,1,'Hydratacja bigi'],fridge:[3,5,.5,'Temperatura lodówki'],startcm:[2,10,.5,'Poziom w słoiku']};
  // These are application scope bounds, not biological expiry thresholds.
  const poolishMax=()=>24;
  const finalMax=()=>48;
  const normalize=s=>({...defaults,...s,preferTemp:s?.preferTemp??s?.temp??defaults.preferTemp});
  const bad=(field,text)=>({field,text});
  const references={
    poolish:{name:'Poolish — baza Städler Made',url:'https://www.stadlermade.com/pizza/ingredients/poolish/',preferDose:1000/700,finalDose:1,instantRatio:1/3,
      settings:{method:'poolish',preferMode:'cold',hyd:70,share:70,ph:1,pcold:24,fridge:4,preferTemp:20,temp:21,bulk:.25,cold:4.5,coldPosition:'bulk',proof:2.5,mixHours:.5,saltkg:25000/1727},
      note:'Proporcje ze źródła; czasy wybrane z jego przedziałów. TO końcowego ciasta 21°C i 30 min przygotowania to założenia planu. Instant: przybliżony przelicznik, sprawdź producenta.'},
    biga:{name:'Biga 100% — baza Städler Made',url:'https://www.stadlermade.com/pizza/ingredients/biga/',preferDose:7,finalDose:0,instantRatio:1/3,
      settings:{method:'biga',preferMode:'room',hyd:70,share:100,bigaHyd:45,ph:18,pcold:0,preferTemp:18,temp:24,bulk:1.5,cold:0,coldPosition:'balls',proof:3,mixHours:1,saltkg:28000/1735},
      note:'Wariant bez opcjonalnego słodu i oleju. Plan wybiera środek zakresów końcowej fermentacji; 1 h przygotowania jest budżetem czasu. Instant: przybliżenie, źródło nie precyzuje typu suchych drożdży.'},
    direct:{name:'Bez zaczynu — baza Gozney',url:'https://eu.gozney.com/blogs/recipes/pizza-for-beginners-simple-pizza-dough-recipe',preferDose:0,finalDose:2,instantRatio:.5,
      settings:{method:'direct',hyd:60,share:0,ph:0,pcold:0,temp:18,bulk:.75,cold:0,coldPosition:'balls',proof:8,mixHours:.5,saltkg:30000/1632},
      note:'Dawka instant zgodna z tym konkretnym przepisem (połowa świeżych). 30 min na mieszanie i odpoczynek to zaokrąglony budżet przygotowania.'}
  };
  function referenceSettings(method){const r=Object.hasOwn(references,method)?references[method]:null;return r?{...defaults,...r.settings,yeastMode:'reference',adjust:100,preferDose:r.preferDose,finalDose:r.finalDose}:null;}
  function referenceStatus(v){
    const r=Object.hasOwn(references,v.method)?references[v.method]:null;if(!r)return null;
    const ignored=new Set(['method','share','ph','pcold','preferMode','preferTemp','bigaHyd']);
    const changes=Object.entries(r.settings).filter(([key,value])=>{
      if(v.method==='direct'&&ignored.has(key))return false;
      if(key==='coldPosition'&&Number(v.cold)===0)return false;
      return typeof value==='number'?Math.abs(Number(v[key])-value)>1e-6:v[key]!==value;
    }).map(([key])=>key);
    if(Number(v.adjust)!==100)changes.push('adjust');
    if(v.yeastMode!=='reference')changes.push('yeastMode');
    return {name:r.name,url:r.url,note:r.note,changes,adapted:changes.length>0};
  }
  // Compatibility only: preserve doses in recipes saved before the source-based model.
  // This reproduces the retired heuristic; it is never used for new recipes.
  function migrateSettings(saved){
    if(!saved||typeof saved!=='object'||saved.yeastMode!==undefined)return normalize(saved);
    const v=normalize(saved),numeric=['ph','pcold','preferTemp','temp','bulk','proof','cold','fridge','share','adjust'];
    numeric.forEach(k=>v[k]=Number(v[k]));
    const active=['temp','bulk','proof','cold','adjust',...(v.method!=='direct'?['ph','preferTemp','share']:[]),...(v.cold>0||v.method==='poolish'&&v.preferMode==='cold'?['fridge']:[]),...(v.method==='poolish'&&v.preferMode==='cold'?['pcold']:[])];
    if(active.some(k=>!Number.isFinite(v[k])))return {...normalize(saved),yeastMode:'manual',preferDose:'',finalDose:''};
    if(!(v.cold>0||v.method==='poolish'&&v.preferMode==='cold'))v.fridge=4;
    const rate=Math.pow(2,(v.temp-21)/10),coldRate=.06*Math.pow(2,(v.fridge-4)/6),cooling=Math.min(v.cold,1.5);
    const hours=(.5+v.bulk+v.proof)*rate+cooling*(rate+coldRate)/2+Math.max(0,v.cold-cooling)*coldRate;
    const correction=v.adjust/100,target=.2*Math.pow(7.5/hours,1.15)*correction;
    let pref=0;
    if(v.method==='poolish')pref=(v.preferMode==='cold'?.14*Math.pow(25/(v.ph+v.pcold*Math.pow(2,(v.fridge-4)/6)),1.1):.25*Math.pow(12/v.ph,1.2))*Math.pow(2,(21-v.preferTemp)/10)*correction;
    if(v.method==='biga')pref=.7*Math.pow(18/v.ph,1.1)*Math.pow(2,(18-v.preferTemp)/10)*correction;
    const final=Math.max(0,target-pref*(v.method==='direct'?0:v.share/100)*(v.method==='poolish'?4:2));
    return {...normalize(saved),yeastMode:'manual',preferDose:pref*10,finalDose:final*10,adjust:100};
  }
  // Traditional desired-dough-temperature planning aid, not a thermal simulation.
  function waterTemperature({target,room,flour,friction,preferment}){
    const values=[target,room,flour,friction,...(preferment===undefined?[]:[preferment])];
    if(values.some(x=>x===''||x===null||!Number.isFinite(Number(x))))return null;
    if(target<10||target>35||room<0||room>40||flour<0||flour>40||friction<0||friction>20||(preferment!==undefined&&(preferment<0||preferment>40)))return null;
    return Number(target)*(preferment===undefined?3:4)-Number(room)-Number(flour)-Number(friction)-(preferment===undefined?0:Number(preferment));
  }
  function calculate(input){
    const s=normalize(input),v={...s},errors=[],warnings=[];
    if(!Object.hasOwn(labels,s.method))errors.push(bad('method','Wybierz poolish, bigę albo ciasto bez zaczynu.'));
    if(!['fresh','instant'].includes(s.yeast))errors.push(bad('yeast','Wybierz drożdże świeże albo instant.'));
    if(!['room','cold'].includes(s.preferMode))errors.push(bad('preferMode','Wybierz sposób dojrzewania poolishu.'));
    const prefer=s.method!=='direct',coldPrefer=s.method==='poolish'&&s.preferMode==='cold';
    const keys=['balls','weight','hyd','saltkg','temp','adjust','bulk','cold','proof','mixHours','checkBefore','checkAfter'];
    if(!['reference','manual'].includes(s.yeastMode))errors.push(bad('yeastMode','Wybierz dawkę z receptury lub własną.'));
    if(!['bulk','balls'].includes(s.coldPosition))errors.push(bad('coldPosition','Wybierz chłodzenie masy lub kulek.'));
    if(s.yeastMode==='manual')keys.push('finalDose',...(prefer?['preferDose']:[]));
    if(prefer)keys.push('share','ph','preferTemp');
    if(s.method==='biga')keys.push('bigaHyd');
    if(coldPrefer)keys.push('pcold');
    if(Number(s.cold)>0||coldPrefer)keys.push('fridge');
    if(s.method==='poolish')keys.push('startcm');
    for(const k of keys){const [min,max,step,label]=fields[k],raw=s[k];const n=(typeof raw==='number'||typeof raw==='string'&&raw.trim()!=='')?Number(raw):NaN;v[k]=n;
      if(!Number.isFinite(n)||n<min||(k!=='ph'&&n>max)||step>0&&Math.abs((n-min)/step-Math.round((n-min)/step))>1e-7)errors.push(bad(k,`${label}: wpisz ${min}–${max}${step?' (krok '+String(step).replace('.',',')+')':''}.`));}
    if(errors.length)return {errors,warnings};
    if(!prefer){v.share=0;v.ph=0;v.pcold=0;}
    if(!coldPrefer)v.pcold=0;
    if(!(v.cold>0||coldPrefer))v.fridge=4;
    if(s.method==='poolish'){
      if(v.share>v.hyd)errors.push(bad('share','Poolish wnosi więcej wody niż całe ciasto. Zmniejsz udział zaczynu lub zwiększ hydratację.'));
      if(coldPrefer){if(v.ph>2)errors.push(bad('ph','Poolish z lodówką: 0,5–2 h na rozpoczęcie w TO, następnie 12–24 h w TK. 50 h samego poolishu pozostaje poza zakresem.'));}
      else if(v.ph<4||v.ph>poolishMax(v.preferTemp))errors.push(bad('ph',`Zakres obsługi poolishu w TO: 4–${poolishMax(v.preferTemp)} h. To nie zalecenie dla każdej temperatury.`));
    }
    if(s.method==='biga'){
      if(v.preferTemp<16||v.preferTemp>20)errors.push(bad('preferTemp','Biga w tym modelu wymaga chłodnego miejsca 16–20°C. Lodówka 4°C nie zastępuje tych warunków.'));
      const max=24;
      if(v.ph<12||v.ph>max)errors.push(bad('ph',`Biga przy ${v.preferTemp}°C: 12–${max} h. Baza źródłowa: 18 h przy 18°C.`));
      if(v.share<20)errors.push(bad('share','Biga: użyj 20–100% całej mąki.'));
      if(v.preferTemp>18)warnings.push('Biga powyżej 18°C dojrzewa szybciej. Pilnuj temperatury samego zaczynu i jego struktury.');
    }
    const roomHours=v.mixHours+v.bulk+v.proof;
    if(roomHours>finalMax())errors.push(bad('proof','Plan obejmuje ponad 48 h w TO — poza zakresem tej aplikacji. To nie granica biologiczna.'));
    if(errors.length)return {errors,warnings};
    const reference=referenceStatus(v),ref=references[v.method],correction=v.adjust/100;
    const share=v.share/100;
    const preferFreshPct=(prefer?(v.yeastMode==='manual'?v.preferDose:ref.preferDose):0)/10*correction;
    const finalFreshPct=(v.yeastMode==='manual'?v.finalDose:ref.finalDose)/10*correction;
    // Manual doses use fresh-yeast equivalents; no invented preferment-growth factor.
    const conversion=v.yeast==='instant'?(v.yeastMode==='reference'?ref.instantRatio:1/3):1;
    const preferPct=preferFreshPct*conversion,finalPct=finalFreshPct*conversion;
    if(prefer&&preferFreshPct<=0)errors.push(bad('preferDose','Zaczyn poolish lub biga wymaga drożdży. Ten kalkulator nie obsługuje spontanicznej fermentacji.'));
    if(preferFreshPct*share+finalFreshPct<=0)errors.push(bad('finalDose','Dodaj drożdże do zaczynu lub ciasta. Ten kalkulator nie obsługuje zakwasu.'));
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
    if(reference.adapted)warnings.push('Adaptacja receptury: zmienione warunki nie mają potwierdzonego czasu dojrzewania. Dawka ze źródła skaluje się z mąką, nie przelicza automatycznie na nowy harmonogram.');
    if(v.cold>0&&v.proof<2)warnings.push('Krótki czas po lodówce: zmierz temperaturę środka kulki i sprawdź rozciągliwość; 2 h nie jest uniwersalnym minimum.');
    if(v.doughTemp!==''&&v.doughTemp!=null){
      const t=Number(v.doughTemp);if(!Number.isFinite(t)||t<5||t>40)errors.push(bad('doughTemp','Temperatura ciasta: 5–40°C albo puste pole.'));
      else if(Math.abs(t-v.temp)>2)warnings.push('Ciasto i pomieszczenie mają różne temperatury. Początek fermentacji nie przebiega od razu w temperaturze TO. Obserwuj i zapisz rzeczywisty czas.');
    }else warnings.push('Temperatura ciasta po wyrabianiu nieznana. Zmierz ją przed oceną harmonogramu.');
    if(v.flourW!==''&&v.flourW!=null){const w=Number(v.flourW);if(!Number.isFinite(w)||w<80||w>500)errors.push(bad('flourW','W mąki: 80–500 albo puste pole.'));
      else if(v.method==='biga'&&w<320)warnings.push('Baza bigi używa mąki W ≥ 320. Twoja mąka jest słabsza; receptura wymaga własnej próby.');
    }
    if(v.adjust!==100)warnings.push('Ręczna korekta drożdży wymaga obserwacji i zapisu rzeczywistego czasu wyrastania.');
    if([preferYeast,finalYeast].some(x=>x>0&&x<.1))warnings.push('Dawka poniżej 0,1 g wymaga precyzyjnego ważenia. Nie zaokrąglaj jej do zera.');
    const result={errors,warnings,v,total,hyd,salt,share,flour,water,pf,pw,preferYeast,finalYeast,yeast:preferYeast+finalYeast,ff:Math.max(0,ff),fw,saltPct,preferPct,finalPct,reference,roomHours};
    result.steps=makeSteps(result);result.hours=result.steps.reduce((n,s)=>n+s.hours,0);
    return result;
  }
  function makeSteps(r){const v=r.v,st=[];const add=(kind,title,hours,instruction)=>st.push({kind,title,hours,instruction});
    if(v.method!=='direct'){
      add('prefer',`Przygotuj ${v.method==='biga'?'bigę':'poolish'}`,v.ph,v.method==='biga'?`Połącz mąkę, wodę i drożdże w luźne grudki. Nie wyrabiaj. Przykryj i utrzymuj ${v.preferTemp}°C. Dojrzała biga jest napowietrzona i włóknista wewnątrz.`:`Wymieszaj równe masy mąki i wody z drożdżami, bez soli. Przykryj z zapasem miejsca. Trzymaj w ${v.preferTemp}°C; ${v.preferMode==='cold'?'po tym etapie przenieś do lodówki.':'oceniaj napowietrzenie i początek spłaszczania wierzchu.'}`);
      if(v.method==='poolish'&&v.preferMode==='cold')add('preferCold','Poolish w lodówce',v.pcold,`Wstaw przykryty poolish do ${v.fridge}°C. Chłodzenie nie zatrzymuje fermentacji natychmiast. Przed użyciem oceń napowietrzenie i strukturę.`);
    }
    add('mix',v.method==='direct'?'Przygotuj ciasto bez zaczynu':'Przygotuj ciasto z dojrzałym zaczynem',v.mixHours,v.method==='biga'?'Rozdrobnij dojrzałą bigę w części pozostałej wody. Stopniowo dodawaj resztę składników i wodę; sól dodaj do końcowego ciasta. Wyrób do spójności.':v.method==='poolish'?'Połącz dojrzały poolish z pozostałą mąką, wodą, solą i dodatkową dawką drożdży podaną w przepisie. Wyrób do spójności.':'Połącz wodę, drożdże, mąkę i sól. Wyrób do spójnego, elastycznego ciasta. Nie dodawaj zaczynu.');
    if(v.bulk)add('bulk','Ciasto przed kulkowaniem w TO',v.bulk,`Przykryj i zostaw w ${v.temp}°C. Oceniaj napowietrzenie; nie wymagaj sztywno podwojenia objętości.`);
    if(v.cold&&v.coldPosition==='bulk')add('cold','Ciasto w masie w lodówce',v.cold,`Przechowuj przykryte ciasto w ${v.fridge}°C. Środek dużej masy chłodzi się wolniej niż kulki; zmierz temperaturę.`);
    add('shape','Podziel i uformuj kulki',0,`Podziel na ${v.balls} porcji po ${v.weight} g. Uformuj napięty wierzch i zamknij łączenie od spodu. Włóż do przykrytych pojemników.`);
    if(v.cold&&v.coldPosition==='balls')add('cold','Kulki w lodówce',v.cold,`Przechowuj przykryte kulki w zmierzonych ${v.fridge}°C. Zostaw miejsce na wzrost.`);
    add('proof','Kulki w TO przed pieczeniem',v.proof,`Zostaw w ${v.temp}°C pod przykryciem. Gotowa kulka jest napowietrzona, rozluźniona i rozciąga się bez silnego cofania. Gdy mocno się kurczy, daj jej więcej czasu. Nagrzej piec zgodnie z jego instrukcją.`);
    add('bake','Pieczenie',0,'Rozciągaj od środka, zachowując gaz w rancie. Nałóż dodatki i wypiekaj, obserwując spód i rant. Czas zależy od pieca i temperatury płyty.');return st;
  }
  function plan(input,earliest,bake){
    const settings=normalize(input),start=new Date(earliest).getTime(),end=new Date(bake).getTime();
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return {error:'Ustaw pieczenie później niż najwcześniejszy start.'};
    const result=calculate(settings);if(result.errors.length)return {error:result.errors.map(e=>e.text).join(' ')};
    const startsAt=end-result.hours*3600000;
    if(startsAt<start)return {error:`Ten przepis potrzebuje ${result.hours} h. Wybierz późniejsze pieczenie albo świadomie zmień recepturę; planer nie skraca fermentacji automatycznie.`};
    return {settings,result,startsAt,endsAt:end,message:'Wyznaczono start dla wybranej receptury. Zapas pozostaje przed startem. Dojrzałość potwierdź obserwacją.'};
  }
  function timeline(result,bake){let time=new Date(bake).getTime()-result.hours*3600000;if(!Number.isFinite(time))return [];return result.steps.map(s=>{const item={...s,startsAt:time};time+=s.hours*3600000;return item;});}
  // User-chosen inspection schedule. These margins do not predict ripeness.
  function useWindows(result){
    if(!result||result.errors.length)return [];
    const v=result.v,items=[];
    const add=(kind,label,duration,temperature,note)=>items.push({kind,label,duration,temperature,
      early:Math.max(0,duration-v.checkBefore),late:duration+v.checkAfter,
      earlier:Math.min(duration,v.checkBefore),later:v.checkAfter,uncertain:true,note,
      clippedEarly:duration<v.checkBefore,clippedLate:false});
    if(v.method!=='direct'){
      const cold=v.method==='poolish'&&v.preferMode==='cold';
      add(cold?'preferCold':'prefer',labels[v.method]+' — kontrola zaczynu',cold?v.pcold:v.ph,cold?v.fridge:v.preferTemp,
        v.method==='biga'?'Sprawdź napowietrzenie i włóknistą strukturę wewnątrz grudki.': 'Sprawdź liczne bąbelki, wzrost i początek spłaszczania wierzchu. Sam poziom 2× nie wystarcza.');
    }
    add('proof','Kulki — kontrola przed pieczeniem',v.proof,v.temp,'Sprawdź napowietrzenie, temperaturę i rozciągliwość. Cofanie i rozrywanie mogą mieć różne przyczyny; sam zegar ich nie rozstrzyga.');
    return items;
  }
  function useWindowStatus(window,elapsed){
    if(!window||!Number.isFinite(elapsed))return 'unknown';
    return elapsed<window.early-1e-8?'early':elapsed>window.late+1e-8?'late':'window';
  }

  return {defaults,fields,labels,references,referenceSettings,referenceStatus,migrateSettings,waterTemperature,normalize,poolishMax,finalMax,calculate,plan,timeline,useWindows,useWindowStatus};
})();
if(typeof module!=='undefined')module.exports=PizzaRules;
