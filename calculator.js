'use strict';

// Conservative scope for this room-temperature poolish calculator, not universal
// limits for every recipe. See README for sources and model assumptions.
const PizzaRules = (() => {
  const fields = {
    balls: [1, 12, 1, 'Liczba kulek'], weight: [150, 500, 5, 'Waga kulki'],
    hyd: [55, 80, 1, 'Hydratacja'], saltkg: [10, 24, 0.5, 'Sól (g/kg ciasta)'],
    share: [10, 50, 1, 'Udział mąki w poolish'], ph: [4, 18, 0.5, 'Czas poolish'],
    temp: [16, 28, 1, 'Temperatura TO'], adjust: [50, 150, 5, 'Korekta drożdży'],
    startcm: [2, 10, 0.5, 'Wysokość w słoiku'], bulk: [0, 4, 0.5, 'Ciasto przed kulkowaniem'],
    cold: [0, 48, 1, 'Kulki w lodówce'], fridge: [3, 5, 0.5, 'Temperatura lodówki'],
    proof: [1, 8, 0.5, 'Wyrastanie kulek w TO']
  };
  const defaults = {balls:4, weight:250, hyd:65, saltkg:18, share:30, ph:12,
    temp:21, yeast:'fresh', adjust:100, startcm:5, bulk:1, cold:0, fridge:4, proof:4};
  const poolishMax = t => t <= 20 ? 18 : t <= 23 ? 16 : t <= 26 ? 12 : 8;
  const finalMax = t => t <= 20 ? 12 : t <= 23 ? 10 : t <= 26 ? 8 : 6;

  function calculate(input) {
    const v = {}, errors = [], warnings = [];
    for (const [key, [min, max, step, label]] of Object.entries(fields)) {
      const raw = input[key];
      const n = typeof raw === 'number' || typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
      v[key] = n;
      if (!Number.isFinite(n) || n < min || (key !== 'ph' && n > max) || Math.abs((n-min)/step-Math.round((n-min)/step)) > 1e-7) {
        errors.push({field:key, text:`${label}: wpisz ${min}–${max}, co ${step}.`});
      }
    }
    v.yeast = input.yeast;
    if (!['fresh','instant'].includes(v.yeast)) errors.push({field:'yeast',text:'Wybierz drożdże świeże lub instant.'});
    if (errors.length) return {errors, warnings};
    const maxPoolish = poolishMax(v.temp);
    if (v.ph > maxPoolish) errors.push({field:'ph',text:`Przy ${v.temp}°C ten kalkulator dopuszcza poolish do ${maxPoolish} h. Skróć czas; dłuższy plan wymaga osobnego przepisu z chłodzeniem poolish. Pole TK poniżej dotyczy gotowych kulek.`});
    const roomHours = 0.5 + v.bulk + v.proof;
    if (roomHours < 2) errors.push({field:'proof',text:'Zaplanuj minimum 2 h w TO po dodaniu poolish (łącznie z 30 min wyrabiania).'});
    if (roomHours > finalMax(v.temp)) errors.push({field:'proof',text:`Po dodaniu poolish zaplanuj maks. ${finalMax(v.temp)} h łącznie w TO przy ${v.temp}°C, wliczając 30 min wyrabiania. Skróć wyrastanie lub przenieś część czasu do TK.`});
    if (v.cold > 0 && v.proof < 2) errors.push({field:'proof',text:'Po TK ten model wymaga minimum 2 h na ogrzanie i wyrastanie kulek w TO.'});

    const total = v.balls*v.weight, hyd = v.hyd/100, salt = total*v.saltkg/1000, share = v.share/100;
    const freshPct = .25*Math.pow(12/v.ph,1.2)*Math.pow(2,(21-v.temp)/10)*(v.adjust/100);
    const yPct = v.yeast === 'fresh' ? freshPct : freshPct/3;
    const flour = (total-salt)/(1+hyd+share*yPct/100);
    const water = flour*hyd, pf = flour*share, pw = pf, yeast = pf*yPct/100;
    const ff = flour-pf, fw = water-pw, saltPct = salt/flour*100;
    if (![total,flour,water,pf,pw,yeast,ff,fw,saltPct].every(Number.isFinite) || fw < 0 || ff <= 0 || yeast <= 0) errors.push({field:'share',text:'Te proporcje nie dają poprawnej ilości składników. Zmniejsz udział poolish.'});
    if (saltPct > 3.5) errors.push({field:'saltkg',text:`Sól to ${saltPct.toFixed(2)}% mąki. Limit tego kalkulatora to 3,5%; zmniejsz g/kg ciasta.`});
    if (errors.length) return {errors, warnings};
    if (saltPct < 2 || saltPct > 3.2) warnings.push('Sól poza zalecanym zakresem aplikacji 2–3,2% mąki. Domyślne 18 g/kg ciasta przy 65% wody to około 3% mąki.');
    if (v.ph < 8) warnings.push('Krótki poolish (4–7,5 h): mniej czasu na rozwój aromatu. Użyj dopiero po widocznym napowietrzeniu.');
    if (v.ph > maxPoolish-2 || v.temp >= 25) warnings.push('Kontroluj poolish wcześniej: ciepło i długi czas zwiększają ryzyko przejrzenia. Nie czekaj na zegar, gdy zaczyna wyraźnie opadać.');
    if (v.hyd > 70) warnings.push('Ponad 70% wody wymaga odpowiednio chłonnej, mocnej mąki i wprawy. Na początek wybierz 60–65%.');
    if (v.share > 40) warnings.push('Duży udział poolish przyspiesza fermentację i zwiększa rozciągliwość ciasta. Obserwuj kulki wcześniej.');
    if (v.cold > 24) warnings.push('Ponad 24 h TK po dojrzałym poolish: użyj mąki nadającej się do długiej fermentacji i sprawdzaj strukturę. Ten model drożdży nie jest skalibrowany na cały taki cykl.');
    if (roomHours > 6) warnings.push('Długa fermentacja końcowa w TO po dojrzałym poolish może skończyć się wcześniej niż plan. Obserwuj napowietrzenie i sprężystość.');
    if (v.adjust !== 100) warnings.push('Ręczna korekta drożdży zmienia czas dojrzewania. Traktuj harmonogram jako plan do kontroli.');
    if (yeast < 0.1) warnings.push('Dawka drożdży poniżej 0,1 g: potrzebna precyzyjna waga lub świeżo przygotowany roztwór o znanym stężeniu. Nie zaokrąglaj do zera.');
    return {errors,warnings,v,total,hyd,salt,share,yPct,flour,water,pf,pw,yeast,ff,fw,saltPct,roomHours};
  }
  return {fields,defaults,poolishMax,finalMax,calculate};
})();
if (typeof module !== 'undefined') module.exports = PizzaRules;
