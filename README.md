# Pizza Lab

Mobilna aplikacja PWA bez backendu: **poolish, biga i ciasto bez zaczynu**.

## Funkcje

- Trzy osobne metody, z bilansem mąki, wody, soli i drożdży do zaczynu oraz do ciasta końcowego. Sól pozostaje w g/kg gotowego ciasta.
- Poolish tylko w TO albo start w TO i osobne dojrzewanie w TK. TK zaczynu i TK gotowych kulek są oddzielnymi etapami.
- Biga 45–50% hydratacji, 20–100% całej mąki, osobna temperatura chłodnego pomieszczenia. Wariant 100% bigi nie dodaje ponownie mąki do ciasta końcowego.
- „Zaplanuj za mnie”: najwcześniejszy start i termin pieczenia. Proponuje plan mieszczący się w oknie, może wykorzystać końcowy TK; nie rozciąga zaczynu do długości całego dostępnego czasu. Zapas zostaje przed startem. Plan można zmieniać ręcznie.
- „Robię teraz”: etapy od faktycznego rozpoczęcia, instrukcje, odliczanie, ręczne zatwierdzanie gotowości i przedłużenie o 15 minut. Zmiana kalkulatora nie zmienia rozpoczętej sesji.
- Poglądowe ilustracje i opisy trzech stanów poolishu, bigi oraz kulek: za wcześnie / gotowe / przejrzałe.
- Dziennik do 20 wypieków: receptura, nazwa mąki, rzeczywista temperatura, uwagi, ocena i zdjęcie. Zakończona sesja może dołączyć rzeczywiste czasy etapów. Recepturę można ponownie wykorzystać. Eksport JSON zawiera także zdjęcia; import kopii nie jest obecnie dostępny.
- Zdjęcie JPG/PNG/WebP do 10 MB jest lokalnie zmniejszane do maks. 640 px. Brak miejsca nie usuwa formularza ani nie udaje udanego zapisu.
- Zachowane stare ustawienia i zapisane przepisy są ponownie walidowane, bez cichego poprawiania błędnych wartości. Brak pola metody oznacza dawny poolish.
- PWA, service worker v5, offline po pierwszym udanym załadowaniu. Liczniki po otwarciu nadrobią upływ czasu. **Brak powiadomień w tle**, automatycznego przechodzenia etapów, konta i synchronizacji urządzeń.

## Okna użycia i interaktywna oś czasu

Pod harmonogramem receptury znajduje się wybór zaczynu lub kulek, orientacyjny przedział kontroli, kreska planowanej godziny, znacznik bieżącego czasu i suwak ±3 h z przyciskami −1 h / Plan / +1 h. Suwak nie zmienia receptury, dawki drożdży ani harmonogramu. Przyspieszenie użycia zaczynu może wymagać dalszego dojrzewania; opóźnienie jego użycia przesuwa pieczenie, jeśli dalsze etapy pozostaną tak samo długie.

W „Robię teraz” oś dla aktualnego etapu bazuje na faktycznym `stageStartedAt`, a nie na dacie pieczenia. Dla chłodzonego poolishu okno jest pokazywane w etapie TK, nie podczas krótkiego startu w TO. Przedłużanie odliczania o 15 minut **nie przesuwa automatycznie okna dojrzałości**. Stan odtwarza się z zapisanych czasów po ponownym otwarciu.

**Interpretacja:** zielony przedział oznacza czas na sprawdzenie i możliwe użycie po ocenie struktury. Nie oznacza potwierdzonej dojrzałości, prawdopodobieństwa sukcesu ani gwarancji, że godzina różnicy nie zaszkodzi. Poza przedziałem ciasto nie jest automatycznie uznawane za stracone. Przy ręcznej korekcie drożdży zakres jest kreskowany, a interfejs nie potwierdza zapasu czasowego.

Szerokości są jawną, autorską heurystyką do planowania kontroli, nie eksperymentalnie zmierzonymi oknami z przytoczonych źródeł:

- Poolish w TO: półszerokość 10% czasu, bazowo maks. 1,5 h, zwężana przy cieplejszych warunkach względem 21°C.
- Biga: 12,5% czasu, bazowo maks. 2 h, z korektą względem 18°C.
- Poolish w TK: 10% etapu w lodówce, bazowo maks. 2 h, z korektą względem 4°C; zapas dotyczy dalszego przebywania w tej temperaturze.
- Kulki: 25% końcowego wyrastania, bazowo maks. 1,5 h, z korektą temperatury; zwężenie przy dużym udziale zaczynu, długim TK i hydratacji ponad 70%.
- Półszerokości są zaokrąglane w dół do 15 minut, z minimalnym krokiem 15 minut. Okna są przycinane do już obowiązujących zakresów czasu aplikacji, również do łącznego limitu TO ciasta. Przycięcie późniejszej strony jest jawnie zaznaczone. Minuty pokazują skalę planu, nie dokładność prognozy.

Źródła poniżej wspierają ocenę po wyglądzie i zależność od warunków; nie dostarczają uniwersalnej gwarancji ±1 h. Zmiana temperatury i faktyczna aktywność drożdży mogą przesunąć cały przedział. Wątpliwości rozstrzyga ocena zaczynu lub ciasta oraz doświadczenia zapisane w dzienniku.

## Granice i dokładność

To zachowawczy zakres aplikacji, nie uniwersalne prawa kulinarne ani gwarancja dojrzałości. Końcowy efekt wymaga obserwacji i właściwej mąki. Wartość W ani procent białka nie są automatycznie wnioskowane z wpisanej nazwy mąki.

| Wariant | Zakres |
| --- | --- |
| Poolish w TO | 4–18 h przy 16–20°C; maks. 16 h przy 21–23°C, 12 h przy 24–26°C, 8 h przy 27–28°C |
| Poolish z TK | 0,5–2 h startu w TO + 12–24 h w TK 3–5°C |
| Biga | 12–20 h w 16–18°C; 12–16 h w 19–20°C; 45–50% hydratacji |
| Gotowe ciasto po zaczynie w TO | 2–12 h przy 16–20°C; maks. 10 / 8 / 6 h dla kolejnych zakresów temperatur jak wyżej |
| Ciasto bez zaczynu w TO | minimum 3 h bez TK; maks. 24 / 18 / 12 / 8 h dla kolejnych zakresów temperatur jak wyżej |
| Kulki w TK | 0–48 h w 3–5°C, potem minimum 2 h w TO; ostrzeżenie powyżej 24 h |

TO gotowego ciasta obejmuje 30 min wyrabiania, etap przed kulkowaniem i wyrastanie kulek. Biga w tym wydaniu nie obsługuje chłodzenia samego zaczynu. 50 h **samego** poolishu jest blokowane; cały cykl z późniejszym TK ciasta może trwać dłużej.

Sól: domyślnie 18 g/kg ciasta; ostrzeżenia poza 2–3,2% mąki, blokada ponad 3,5%. Hydratacja 55–80%, z ostrzeżeniem ponad 70%. Udział poolishu 10–50% mąki. Nieaktywne pola zaczynu nie wpływają na metodę bezpośrednią. Przykłady objętości i rysunki nie są pomiarem gotowości.

### Model drożdży

Model uwzględnia teraz **oba etapy**: najpierw dawkę do zaczynu potrzebną do jego dojrzewania, potem orientacyjną dodatkową dawkę do ciasta końcowego. Dodatek może wynosić 0 g i nigdy nie jest ujemny. Nie jest to model biologiczny zweryfikowany eksperymentalnie.

- Poolish w TO: punkt startowy 0,25% świeżych względem mąki zaczynu dla 12 h przy 21°C, z heurystyczną korektą czasu i temperatury.
- Poolish z TK: punkt startowy około 0,14% świeżych względem mąki zaczynu dla 1 h TO i 24 h TK w 4°C; korekty są założeniem aplikacji.
- Biga: punkt startowy 0,7% świeżych względem mąki bigi dla 18 h przy 18°C. Czas i temperatura korygują tę wartość.
- Metoda bezpośrednia: punkt startowy 0,2% świeżych dla około 7,5 równoważnych godzin w 21°C. Inspiracją jest przepis z 2 g świeżych / kg mąki, krótkim przygotowaniem i 8 h wyrastania w 18°C. Współczynnik czasu jest autorskim przybliżeniem.
- Równoważny czas uwzględnia TO, uproszczony 1,5-godzinny etap schładzania i pozostałą aktywność w TK. Współczynniki chłodzenia nie są pomiarem konkretnego pojemnika ani masy kulek.
- Orientacyjny wkład dojrzałego zaczynu odejmowany jest od docelowej dawki końcowej. Współczynniki wkładu (poolish 4, biga 2) są parametrami heurystyki, **nie zmierzonym namnażaniem drożdży**. Model ostrzega, gdy długi plan może być zbyt aktywny nawet bez dodatkowych drożdży.
- Instant: orientacyjnie 1/3 masy świeżych; sprawdź instrukcję producenta. Korekta użytkownika 50–150%. Trzy miejsca po przecinku pomagają odważyć dawkę, nie oznaczają takiej dokładności prognozy.

Bilans masy obejmuje obie dawki drożdży. Nie sumuj ich ponownie z pokazanymi składnikami. Mąka, sprawność drożdży i rzeczywista temperatura mogą wymagać korekty na podstawie dziennika.

## Źródła

Zweryfikowano 22.10.2026. Konkretne granice aplikacji, planer i współczynniki obliczeń są naszymi założeniami opartymi na praktycznych przykładach, nie tabelami opublikowanymi przez źródła.

- [King Arthur Baking — Preferment](https://www.kingarthurbaking.com/pro/reference/preferment): definicje zaczynów, zależność dawki od warunków i ocena dojrzałości.
- [Städler Made — Poolish](https://www.stadlermade.com/pizza/ingredients/poolish/): wariant w TO i przykład osobnego startu w TO oraz chłodzenia.
- [Städler Made — Biga](https://www.stadlermade.com/pizza/ingredients/biga/): mocna mąka, sucha struktura, przykład 0,7% świeżych i 18 h w 18°C.
- [Gozney — 100% Biga](https://www.gozney.com/blogs/recipes/100-biga-pizza-dough-recipe): przykład całej mąki w bigze, 45% wody i chłodnego dojrzewania; inny wariant dawki drożdży.
- [Gozney — Pizza for Beginners](https://eu.gozney.com/blogs/recipes/pizza-for-beginners-simple-pizza-dough-recipe): inspiracja wariantu bezpośredniego.

## Uruchomienie i sprawdzenie

Nie wymaga budowania ani zależności produkcyjnych. Uruchom dowolny statyczny serwer HTTP w katalogu głównym. Testy obliczeń i planera:

```sh
node --test calculator.test.js
```

Obejmują trzy metody, podział TO/TK zaczynu i kulek, bigę 100%, błędne dane, limity, dodatnie dawki, wpływ końcowego procesu na drożdże, bilans masy i zgodność planów z dostępnym czasem. Interfejs dodatkowo sprawdzany przez scenariusze DOM i na opublikowanej stronie.

## Publikacja i instalacja

GitHub Pages: gałąź `master`, katalog `/ (root)`. Adres: <https://michalrudypl.github.io/pizza-lab/>. Na iPhone: Safari → Udostępnij → Dodaj do ekranu początkowego. Po aktualizacji otwórz ponownie online, aby pobrać nowy interfejs i zasoby offline.

## Dane lokalne

`pizzaSettings` i `pizzaRecipes` zachowują wcześniejsze klucze. Sesja: `pizzaSessionV1`; dziennik: `pizzaJournalV1`. Zdjęcia i receptury nie są wysyłane na serwer. Wyczyszczenie danych przeglądarki może je usunąć; dziennik można wyeksportować do pliku JSON. Przepisy i aplikacja nadal działają bez konta.
