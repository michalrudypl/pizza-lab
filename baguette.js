'use strict';
// Adaptacja na świeże drożdże: 950 g mąki, 730 g wody, 16 g soli, ok. 6 g świeżych.
// Czasy są planem, a nie modelem biologicznym fermentacji.
function calculateBag(input={}) {
  const defaults={
    count:2,weight:200,hydration:730/950*100,saltPerKg:16/1702*1000,
    yeastFreshPerKgFlour:6/950*1000,bulkHours:9,
    tempC:22,proofMinutes:40,fold:true,steam:true,bakeMinutes:25,bakeAt:''
  };
  const s={...defaults,...input}, errors=[];
  const ranges={
    count:[1,20],weight:[100,650],hydration:[55,90],
    saltPerKg:[0,25],yeastFreshPerKgFlour:[0.15,36],
    bulkHours:[4,16],tempC:[16,30],
    proofMinutes:[0,120],bakeMinutes:[10,50]
  };
  const numbers={};
  for (const [key,[min,max]] of Object.entries(ranges)) {
    const raw=s[key], n=raw===''||raw===null||raw===undefined?NaN:Number(raw);
    if (!Number.isFinite(n)||n<min||n>max) errors.push(`${key}: dozwolony zakres ${min}–${max}.`);
    numbers[key]=n;
  }
  if (Number.isFinite(numbers.count)&&!Number.isInteger(numbers.count)) errors.push('Liczba bagietek musi być całkowita.');
  const dateRaw=typeof s.bakeAt==='string'?s.bakeAt.trim():'';
  const bakeTime=dateRaw?new Date(dateRaw):null;
  if (bakeTime&&!Number.isFinite(bakeTime.getTime())) errors.push('Nieprawidłowa data pieczenia.');
  if (errors.length) return {errors};
  const v={...s,...numbers,fold:s.fold===true||s.fold==='true',steam:s.steam===true||s.steam==='true'};
  const total=v.count*v.weight;
  const salt=total*v.saltPerKg/1000;
  const flour=(total-salt)/(1+v.hydration/100+v.yeastFreshPerKgFlour/1000);
  const water=flour*v.hydration/100;
  const yeast=flour*v.yeastFreshPerKgFlour/1000;
  const mixMinutes=2,shapeMinutes=3;
  const bakeOffset=v.bulkHours*60+shapeMinutes+v.proofMinutes;
  const startAt=bakeTime?new Date(bakeTime.getTime()-bakeOffset*60000):null;
  const steps=[
    {at:0,title:'Wymieszaj składniki',note:'Połącz mąkę, wodę, sól i drożdże przez około 2 minuty. Przykryj miskę.'},
    ...(v.fold?[{at:20,title:'Jedno złożenie',note:'Delikatnie podnieś i złóż ciasto (lift and fold). Pozostaw dalej do fermentacji.'}]:[]),
    {at:v.bulkHours*60,title:'Podziel i uformuj',note:`Podziel na ${v.count} szt. po ${v.weight} g. Pracuj delikatnie i nie odgazuj ciasta.`},
    ...(v.proofMinutes>0?[{at:v.bulkHours*60+shapeMinutes,title:'Końcowe wyrastanie',note:`Przykryj uformowane bagietki na około ${v.proofMinutes} min; oceniaj sprężystość i rozrost.`}]:[]),
    {at:bakeOffset,title:'Wstaw do piekarnika',note:`Piecz około ${v.bakeMinutes} min przy 250°C, grzanie góra–dół.${v.steam?' Na początku zastosuj parę z bezpiecznego naczynia.':''}`},
    {at:bakeOffset+v.bakeMinutes,title:'Wyjmij i studź',note:'Studź na kratce. Rumienienie i czas dopasuj do piekarnika.'}
  ];
  const warnings=[
    'Czasy są orientacyjne: fermentację oceniaj po rozroście, pęcherzykach i sprężystości ciasta; dawka drożdży nie koryguje się automatycznie względem temperatury.',
    'Bazowe około 6 g świeżych drożdży na 950 g mąki to orientacyjna adaptacja przepisu z filmu; sprawdzaj dojrzałość ciasta.',
    ...(v.hydration>=78?['Wysoka hydratacja: użyj mąki dobrze chłonącej wodę lub zmniejsz jej ilość.']:[]),
    ...(v.tempC>=25?['W ciepłym pomieszczeniu fermentacja może zakończyć się wcześniej niż po wpisanym czasie.']:[]),
    ...(v.tempC<=19?['W chłodnym pomieszczeniu fermentacja może potrwać dłużej niż plan.']:[]),
    ...(v.fold&&v.bulkHours*60<=20?['Złożenie powinno wypadać wewnątrz fermentacji wstępnej.']:[]),
    ...(v.steam?['Nie syp lodu ani nie wlewaj wody bezpośrednio na dno piekarnika czy szybę; użyj odpowiedniego naczynia.']:[])
  ];
  return {errors:[],v,total,flour,water,salt,yeast,startAt,steps,warnings,bakeOffset,readyOffset:bakeOffset+v.bakeMinutes};
}
if (typeof module!=='undefined'&&module.exports) module.exports={calculateBag};
