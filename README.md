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

## Dokładność
Składniki są obliczane na podstawie całkowitej masy ciasta oraz procentów piekarskich. Dawka drożdży jest modelem orientacyjnym, a osiągnięcie 160% początkowej objętości poolish zależy także od mąki, aktywności drożdży i temperatury. Harmonogram jest planem, nie gwarancją dojrzałości fermentacji.

## Prywatność
Dane receptur są przechowywane lokalnie w przeglądarce tego urządzenia (localStorage). Brak serwera i synchronizacji między urządzeniami.
