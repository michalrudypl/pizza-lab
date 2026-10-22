# Pizza Lab — kalkulator pizzy z poolish

Mobilna aplikacja PWA bez backendu, oparta na HTML, CSS i JavaScript.

## Funkcje
- Liczba i masa kulek, hydratacja oraz ilość soli.
- Proporcje poolish i ciasta końcowego, w tym orientacyjna ilość drożdży świeżych lub instant.
- Planowanie fermentacji poolish, ciasta w temperaturze pokojowej (TO) i kulek w lodówce (TK).
- Harmonogram od daty i godziny pieczenia.
- Zapisywanie własnych wariantów receptury w localStorage.
- Działanie offline po pierwszym wejściu (service worker).
- Ikona aplikacji na ekran iPhone'a.

## Publikacja na GitHub Pages
Repozytorium ma gałąź `master`, a aplikacja znajduje się w katalogu głównym.
1. Otwórz `Settings → Pages`.
2. W `Build and deployment` wybierz `Deploy from a branch`.
3. Ustaw `master` i `/ (root)`; kliknij `Save`.
4. Po udanej publikacji adres powinien mieć format:
   `https://michalrudypl.github.io/pizza-lab/`

**Uwaga:** GitHub Pages w prywatnym repozytorium wymaga odpowiedniego planu (GitHub Pro / Team / Enterprise); GitHub Free nie udostępnia Pages z prywatnego repozytorium. Publiczne Pages nie ukrywa treści aplikacji nawet gdy repozytorium jest prywatne.

## Instalacja na iPhone
Otwórz aktywną stronę w Safari → Udostępnij → Dodaj do ekranu początkowego.

## Walidacja i zakres modelu

Wpisanie liczby, odtworzenie ustawień i wczytanie zapisanego przepisu przechodzą tę samą walidację w `calculator.js`. Błędne dane ukrywają wyniki i blokują kopiowanie oraz zapis. Atrybuty HTML nie są jedyną ochroną. Nieprawidłowe stare przepisy nie są automatycznie poprawiane; przycisk „Ustaw zalecany wariant” przywraca wartości domyślne.

To zachowawcze granice **tej aplikacji**, nie uniwersalne prawa kulinarne ani gwarancja dojrzałości:

| Temperatura TO | Maks. poolish w TO | Maks. TO po poolish (z 30 min wyrabiania) |
| --- | --- | --- |
| 16–20°C | 18 h | 12 h |
| 21–23°C | 16 h | 10 h |
| 24–26°C | 12 h | 8 h |
| 27–28°C | 8 h | 6 h |

- Poolish: minimum 4 h, hydratacja zawsze 100%, udział 10–50% całej mąki. Dla krótkich czasów, ciepła i dużego udziału pojawiają się ostrzeżenia. Punkt startowy: 12 h przy 21°C.
- W aplikacji poolish dojrzewa wyłącznie w TO. TK dotyczy gotowych kulek. Dłuższy poolish z chłodzeniem wymaga innej receptury i modelu. Nie należy mylić czasu poolish z długością całego procesu.
- Fermentacja po poolish: minimum 2 h łącznie w TO; TK 0–48 h przy zmierzonych 3–5°C; po TK minimum 2 h w TO. Powyżej 24 h TK pojawia się ostrzeżenie o mące i ograniczeniach modelu. Czas ogrzania zależy także od masy kulek i pojemnika.
- Sól pozostaje w g/kg gotowego ciasta. Domyślnie 18 g/kg, czyli około 3,03% mąki przy 65% hydratacji. Aplikacja ostrzega poza 2–3,2% mąki i blokuje ponad 3,5%. Dawne domyślne 28 g/kg dawało około 4,76% mąki. Zakres 2–3,2% jest wyborem aplikacji dla pizzy, nie cytatem z normy.
- Hydratacja 55–80%; powyżej 70% ostrzeżenie o wymaganiach mąki i techniki. Weryfikowane są też liczby skończone, puste pola, kroki, zakresy i rodzaj drożdży.
- Drożdże: zachowany model heurystyczny 0,25% świeżych względem mąki w poolish przy 12 h i 21°C, z korektą czasu i temperatury. Instant to orientacyjnie 1/3 świeżych. Korekta ręczna 50–150%. Model **nie jest skalibrowany do całego cyklu ciasta**, zwłaszcza długiego TK. Trzy miejsca po przecinku pomagają odważyć małą dawkę, nie oznaczają takiej dokładności prognozy.
- Słoiki pokazują poglądowe 2× początkowej objętości i wspólną skalę. Dojrzałość ocenia się po napowietrzeniu i początku spłaszczania lub lekkiego zapadania wierzchu, bez sztywnego celu 160%. Należy zostawić zapas na około 3× objętości.

### Źródła

Zweryfikowano 22.10.2026. Konkretne progi temperatury i czasu w tabeli są konserwatywną polityką aplikacji wybraną na podstawie poniższych praktyk; nie są tabelą opublikowaną przez te źródła.

- [King Arthur Baking — Preferment](https://www.kingarthurbaking.com/pro/reference/preferment): poolish 1:1 mąka/woda, bez soli; przykłady 8 h oraz 14–16 h, zależność dawki od temperatury i oznaki dojrzałości.
- [Städler Made — Poolish](https://www.stadlermade.com/pizza/ingredients/poolish/): przykład 12–18 h w 15–20°C; alternatywnie 1 h w TO i 24 h w lodówce 4–6°C. Te warianty wymagają rozróżnienia.
- [Ooni — Our Best Poolish Dough](https://ooni.com/blogs/recipes/our-best-poolish-dough): przykład typowego poolish 6–12 h, pokazujący zależność od konkretnej receptury.
- [AVPN — przepis pizzy neapolitańskiej](https://www.pizzanapoletana.org/it/ricetta_pizza_napoletana): 40–60 g soli na litr wody w metodzie bezpośredniej; podstawa porównania jednostek, nie zatwierdzenie receptury poolish.

## Sprawdzenie

`node --test calculator.test.js`

Testy obejmują m.in. odrzucenie poolish 50 h, zależność limitów od temperatury, całkowity czas w TO, warunki TK, nieprawidłowe dane i bilans masy. Interfejs można uruchomić dowolnym lokalnym serwerem HTTP; nie wymaga budowania ani zależności produkcyjnych.

## Prywatność
Dane receptur są przechowywane lokalnie w przeglądarce tego urządzenia (localStorage). Brak serwera i synchronizacji między urządzeniami.

