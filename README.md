# Pizza Lab

Mobilny kalkulator i planer: poolish, biga i ciasto bez zaczynu. Statyczna PWA, bez backendu i zależności produkcyjnych.

## Receptury i dokładność

Aplikacja oddziela dokładny bilans składników od planu fermentacji wymagającego obserwacji. **Nie jest zweryfikowanym modelem biologicznym.**

Przycisk „Wczytaj recepturę źródłową” ładuje proporcje oraz opisany plan dla metody. Skaluje masę do liczby i wagi kulek. Przy każdej bazie jest link i opis przyjętych założeń. Są to adaptacje planu przygotowania z opublikowanych przepisów, nie certyfikowane receptury AVPN. Zmiana parametrów oznacza własną adaptację; aplikacja pokazuje ten status.

| Baza | Składniki na 1 kg całej mąki, drożdże świeże |
| --- | --- |
| Poolish — Städler Made | 700 g wody, 25 g soli; 70% mąki w zaczynie; 1 g drożdży w zaczynie i 1 g dodatkowo |
| Biga — Städler Made | 700 g wody, 28 g soli; 100% mąki w bigze o hydratacji 45%; 7 g drożdży w bigze |
| Bez zaczynu — Gozney | 600 g wody, 30 g soli, 2 g drożdży |

Baza poolishu wybiera wariant chłodzony i chłodzenie finalnego ciasta w masie. Temperatura finalnego TO i budżet mieszania to założenia aplikacji. Biga pomija opcjonalny słód i olej. Czasy z przedziałów źródłowych wybieramy do konkretnego harmonogramu; ich środek nie jest gwarantowaną chwilą gotowości.

Dawka drożdży jest skalowana z wybranej bazy albo wpisywana ręcznie. Własne dawki podaje się w ekwiwalencie świeżych: g/kg mąki zaczynu oraz dodatkowo g/kg całej mąki. Korekta procentowa dotyczy obu dawek. Brak drożdży w zaczynie blokuje przepis; zakwas nie jest obsługiwany.

Dla instant baza Gozney stosuje podaną przez autora proporcję 1:2 do świeżych. Pozostałe bazy i tryb własny używają orientacyjnego 1:3, jawnie opisanego w interfejsie; należy sprawdzić producenta. Nie utożsamiamy niesprecyzowanych „suchych drożdży” z instant.

**Zmiana czasu, temperatury, soli czy udziału zaczynu nie przelicza automatycznie drożdży.** Usunięto z aktywnego modelu niezweryfikowane mnożniki aktywności zaczynu i stały czas chłodzenia. Wpływ tych warunków wymaga dopracowania receptury w rzeczywistych wypiekach; dodanie kolejnej arbitralnej korekty nie zastępowałoby kalibracji.

Sól pozostaje w g/kg gotowego ciasta zgodnie z preferencją użytkownika; podsumowanie podaje także procent mąki. Bilans uwzględnia obie dawki drożdży. Zmiana ich typu może minimalnie zmienić procent soli przy stałym g/kg ciasta. Udział poolishu ogranicza dostępna woda, zamiast dawnego arbitralnego pułapu 50%.

## Temperatura, mąka i obsługiwany zakres

- Rozdzielamy temperaturę pomieszczenia i opcjonalny pomiar ciasta po wyrabianiu. Różnica ponad 2°C wyzwala przypomnienie o zmiennych warunkach startu; próg jest regułą interfejsu, nie granicą technologiczną.
- Pomoc DDT liczy temperaturę wody: `3 × cel − pomieszczenie − mąka − poprawka mieszania`, z zaczynem: `4 × cel − pomieszczenie − mąka − poprawka − zaczyn`. Pola są niezależne od fermentacji. Domyślne wartości są przykładem. To wzór orientacyjny wymagający pomiaru po mieszaniu, szczególnie przy dużym udziale zimnego zaczynu. Wynik poza 0–40°C wymaga zmiany warunków zamiast użycia niepraktycznej temperatury wody.
- Opcjonalne W pochodzi od producenta; nie zgadujemy go z nazwy ani procentu białka. Dla bazy bigi ostrzegamy o mące słabszej niż wskazana w źródle. Nie wyliczamy czasu fermentacji z samego W.
- Twarde granice to **zakres obsługi aplikacji**, nie rekomendacja ani biologiczny termin przydatności: poolish TO 4–24 h; chłodzony poolish 0,5–2 h TO + 12–24 h TK; biga 12–24 h w 16–20°C; końcowe TO do 48 h i TK do 48 h. Temperatura TO 16–28°C, TK 3–5°C. Każde odejście od bazy pozostaje adaptacją.
- Hydratacja 55–80%; sól 10–24 g/kg ciasta, blokada ponad 3,5% mąki, ostrzeżenie poza 2–3,2%. Te granice nie są uniwersalne dla wszystkich stylów pizzy.
- Po TK nie narzucamy uniwersalnego minimum 2 h: krótszy czas wymaga oceny temperatury środka i rozciągliwości.

## Prosty kalkulator

Jeden ekran, bez zakładek, dziennika wypieków, zdjęć, oceny dojrzałości i prowadzenia sesji. Podstawowe pola: metoda, liczba pizz, masa kulki, hydratacja, sól w g/kg ciasta, temperatura pokoju, typ drożdży, włączenie lodówki i opcjonalny termin pieczenia.

**Ustawienia zaawansowane** są domyślnie zwinięte: parametry zaczynu, czasy etapów, chłodzenie masy lub kulek, własne dawki drożdży, mąka i W, temperatura ciasta, pomoc DDT oraz odstępy kontroli. Zmiana metody wczytuje jej bazę, zachowując liczbę pizz, masę kulki i termin. Wyłączenie lodówki usuwa oba etapy TK; poolish przechodzi na 15 h w TO. To własna adaptacja, nie nowa skalibrowana receptura. Zmiana hydratacji poniżej udziału mąki w poolishu ogranicza udział zaczynu, aby zachować dodatni bilans wody.

Wynik pokazuje składniki zaczynu, składniki dodawane do niego i moment rozpoczęcia. Harmonogram, oś czasu i uwagi rozwija się pod wynikiem. Błędy blokują wynik; błąd ukrytego parametru otwiera ustawienia zaawansowane. Termin pieczenia automatycznie wyznacza start wstecz według czasów receptury, bez zmiany dawek. Pusty termin pokazuje czasy względne. Start w przeszłości jest jawnie oznaczony.

Oś zachowuje suwak ±3 h, przyciski ±1 h i znacznik „teraz”. Kreskowany zakres oznacza ustawione przez użytkownika kontrole (domyślnie godzinę przed i po planie), nie przewidywaną tolerancję fermentacji. Suwak nie zmienia receptury. Kopiowanie obejmuje składniki, harmonogram, źródło i uwagi.

## Ustawienia lokalne

`pizzaSettings` zachowuje ostatnie ustawienia. Stare receptury są migrowane do własnych dawek z zachowaniem gramatur; `migrateSettings` odtwarza dawną heurystykę wyłącznie dla zgodności danych.

Dziennik, prowadzenie sesji i lista zapisanych przepisów zostały usunięte z interfejsu oraz aktywnego kodu. Wcześniejszych lokalnych wpisów (`pizzaJournalV1`, `pizzaSessionV1`, `pizzaRecipes`) aplikacja nie odczytuje ani nie kasuje. Brak konta, synchronizacji i powiadomień w tle.

## Źródła

Sprawdzone 23.10.2026. Przepisy dostarczają konkretnych punktów odniesienia; materiały zawodowe wspierają metodę pracy, a nie uniwersalny wzór na godzinę dojrzałości.

- [Städler Made — Poolish](https://www.stadlermade.com/pizza/ingredients/poolish/)
- [Städler Made — Biga](https://www.stadlermade.com/pizza/ingredients/biga/)
- [Gozney — Pizza for Beginners](https://eu.gozney.com/blogs/recipes/pizza-for-beginners-simple-pizza-dough-recipe)
- [King Arthur Baking — Preferment](https://www.kingarthurbaking.com/pro/reference/preferment): zależność dawki od warunków, oznaki dojrzałości.
- [King Arthur Baking — Desired Dough Temperature](https://www.kingarthurbaking.com/blog/2018/05/29/desired-dough-temperature): orientacyjna metoda DDT.
- [King Arthur Baking — Salt](https://www.kingarthurbaking.com/pro/reference/salt): wpływ soli na fermentację i strukturę, bez narzucania chlebowych proporcji każdej pizzy.

## Testy i publikacja

```sh
node --test calculator.test.js
```

Testy sprawdzają proporcje baz, bilans masy, dawki, oznaczanie adaptacji, granice danych, kolejność chłodzenia, DDT, planer, kontrole i migrację. Nie są walidacją biologiczną. Scenariusze DOM sprawdzono osobno przez Happy DOM: pojedynczy ekran, zwijanie ustawień, metody, przełącznik TK, daty, błędy, oś czasu, migracja i zachowanie wcześniejszych lokalnych danych. Brak zależności produkcyjnych.

GitHub Pages: `master`, katalog główny. [Otwórz Pizza Lab](https://michalrudypl.github.io/pizza-lab/). PWA cache v7, offline po pierwszym załadowaniu. iPhone: Safari → Udostępnij → Dodaj do ekranu początkowego.
