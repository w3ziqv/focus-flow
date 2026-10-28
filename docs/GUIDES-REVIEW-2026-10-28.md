# Przegląd 27 poradników — 28.10.2026

Przejrzano dotychczasowe treści i bibliografię wszystkich 27 poradników.
Przepisano wersje polską i angielską oraz dodano hiszpańską i chińską uproszczoną.
Nie dodano nowych tematów. Zachowano identyfikatory tras i przypisanie do siedmiu
kategorii. Każda wersja rozdziela wprowadzenie, opis dowodów, propozycję działania
oraz ograniczenia. Kroki są tablicą tekstów, nie akapitem rozcinanym wyrażeniem
regularnym; wcześniejsza kolizja numeracji z `GLUT4` nie ma już zastosowania.

## Jak sprawdzano źródła

Sprawdzono metadane i dostępne abstrakty lub pełne teksty na stronach wydawców,
PubMed/PMC oraz w materiałach WHO, NIH i NHS. Nie deklarujemy przeczytania
niedostępnych pełnych tekstów ani systematycznego przeglądu całej literatury.
Uwzględniono populację, rodzaj zadania, czas interwencji i zakres wyniku.
Propozycje użycia timera są redakcyjnymi przykładami, a nie protokołami z badań.

Wspólny katalog 28 źródeł: `src/lib/guides/sources.json`. Przypisania:
`src/lib/guides/catalog.ts`. Nazwiska i nazwy czasopism pozostają nazwami własnymi
we wszystkich językach. Odnośniki prowadzą do stron źródłowych; data przeglądu
nie jest datą aktualizacji zewnętrznej publikacji. Przy materiałach instytucji
nie przypisujemy im automatycznie statusu recenzowanego eksperymentu.

## Zmiany według poradnika

| ID | Główna korekta | Podstawa |
| --- | --- | --- |
| learning-recall | Odtwarzanie i odstępy; harmonogram 1/3/7 dni jako przykład, bez uniwersalnej recepty. | [Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/), [Cepeda 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/) |
| sleep-protocol | Usunięta obietnica naprawy snu w siedem dni i sztywna temperatura dla wszystkich. | [NHLBI](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) |
| breaks-that-work | Ograniczony zakres wyników zadania laboratoryjnego; czas przerwy dobierany do potrzeb. | [Ariga & Lleras 2011](https://www.sciencedirect.com/science/article/abs/pii/S0010027710002994) |
| eating-for-focus | Planowanie posiłków zamiast obietnic koncentracji po określonym jedzeniu. | [WHO 2026](https://www.who.int/news-room/fact-sheets/detail/healthy-diet) |
| switching-cost | Pozostałość uwagi bez uniwersalnego procentu straconej produktywności. | [Leroy 2009](https://www.sciencedirect.com/science/article/pii/S0749597809000399) |
| pre-work-stress | Mniejszy pierwszy krok i realne wsparcie zamiast gwarancji szybkiego wyciszenia. | [Jamieson 2012](https://pubmed.ncbi.nlm.nih.gov/21942377/) |
| memory-palace | Konkretne zadania pamięciowe, bez „podwojenia pamięci” i błędnego przypisania książki. | [Dresler 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5439266/), [Maguire 2003](https://pubmed.ncbi.nlm.nih.gov/12483214/) |
| off-screen-breaks | Zmiana otoczenia z uwzględnieniem mobilności; wyniki badań natury bez gwarantowanych procentów. | [Berman 2008](https://pubmed.ncbi.nlm.nih.gov/19121124/) |
| caffeine-alcohol-sleep | Wyraźnie podana dawka z eksperymentu, bez traktowania jej jako zalecenia. | [Drake 2013](https://pubmed.ncbi.nlm.nih.gov/24235903/), [NHLBI](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) |
| hydration-habits | Usunięte hasło „najtańszy wzmacniacz skupienia” i obowiązkowa szklanka na każdą przerwę. | [Ganio 2011](https://pubmed.ncbi.nlm.nih.gov/21736786/), [NHS](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/) |
| deep-work-blocks | Realne okno pracy; usunięty uniwersalny limit 90 minut i najlepsza pora dla wszystkich. | [Leroy 2009](https://www.sciencedirect.com/science/article/pii/S0749597809000399), [Webb & Sheeran 2007](https://www.sciencedirect.com/science/article/pii/S002210310600028X) |
| self-compassion | Opis eksperymentów i motywacji, bez obietnicy większych osiągnięć lub diagnozowania prokrastynacji. | [Breines & Chen 2012](https://pubmed.ncbi.nlm.nih.gov/22645164/) |
| mindfulness-daily | Krótkie ćwiczenie jako propozycja; rozdzielone od wyniku czterech sesji badania. | [Zeidan 2010](https://pubmed.ncbi.nlm.nih.gov/20363650/) |
| interleaving-practice | Zakres zadań matematycznych, wskazanie podstaw i informacji zwrotnej. | [Rohrer & Taylor 2007](https://link.springer.com/article/10.1007/s11251-007-9015-8) |
| dual-coding | Schemat służący wyjaśnieniu, bez mnożenia pojemności pamięci i „dwóch niezależnych kanałów” jako ścisłej obietnicy. | [Clark & Paivio 1991](https://link.springer.com/article/10.1007/BF01320076) |
| nsdr-recovery | Zastąpiony obiecujący „reset dopaminy” protokół; spokojny odpoczynek i ograniczony wynik pamięciowy. | [Dewar 2012](https://pubmed.ncbi.nlm.nih.gov/22829465/) |
| nature-microbreaks | 40 sekund i 150 studentów jako warunki badania, nie próg regeneracji mózgu. | [Lee 2015](https://www.sciencedirect.com/science/article/abs/pii/S0272494415000328) |
| adenosine-caffeine-timing | Usunięte obowiązkowe 90–120 minut po przebudzeniu i obietnica eliminacji spadków energii. | [Gardiner 2025](https://pubmed.ncbi.nlm.nih.gov/39377163/) |
| circadian-light-entrainment | Brak nakazu zdejmowania okularów przeciwsłonecznych i uniwersalnej liczby minut ekspozycji. | [Chang 2015](https://pubmed.ncbi.nlm.nih.gov/25535358/) |
| glucose-stability | Oddzielona glikemia od koncentracji; opis małej próby starszych osób zamiast diagnozowania każdego spadku energii. | [DiPietro 2013](https://pubmed.ncbi.nlm.nih.gov/23761134/) |
| neurotransmitter-nutrition | Usunięty zestaw suplementów i wnioskowanie o korzyści poznawczej z samego mechanizmu. | [NIH: magnez](https://ods.od.nih.gov/factsheets/Magnesium-Consumer/), [NIH: omega-3](https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/) |
| ultradian-rhythms | Dopasowanie sesji bez obowiązkowej 90-minutowej fali i dziennej liczby cykli. | [Ariga & Lleras 2011](https://www.sciencedirect.com/science/article/abs/pii/S0010027710002994) |
| implementation-intentions | Konkretny plan sytuacja–działanie; usunięte obietnice pominięcia kontroli wykonawczej. | [Webb & Sheeran 2007](https://www.sciencedirect.com/science/article/pii/S002210310600028X) |
| physiological-sigh | Właściwa sekwencja dwóch wdechów i wydechu, bez forsowania płuc lub „natychmiastowego resetu”. | [Yilmaz Balban 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/) |
| stress-reappraisal | Zwykła trema i zakres interwencji; bez usprawiedliwiania przewlekłego przeciążenia. | [Jamieson 2012](https://pubmed.ncbi.nlm.nih.gov/21942377/) |
| open-monitoring-focus | Dwa sposoby uwagi bez pewnego przypisania do każdego rodzaju pracy. | [Colzato 2012](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2012.00116/full) |
| body-scan-awareness | Obserwacja doznań zamiast „wyłączania DMN”; możliwość pominięcia i zakończenia. | [Mirams 2013](https://pubmed.ncbi.nlm.nih.gov/22889642/) |

## Kontrakt źródeł i testów

Teksty są renderowane jako zwykły tekst Reacta. W webie źródła są odnośnikami
HTTPS z `noopener noreferrer`. Desktop przyjmuje tylko ID skompilowanego katalogu,
sprawdza okno `main` i otwiera stały adres w przeglądarce systemowej. Mini timer
nie otrzymuje tego uprawnienia. Nie dodano uniwersalnego otwierania URL ani plików.

Wcześniejsze testy nazywały wszystkie poradniki „peer reviewed”, rozpoznając rok
w napisie bibliografii, i utrwalały konkretne twierdzenia o GLUT4. Takie asercje
zastąpiono kontrolami pełnych czterech wersji, stabilnych tras, struktury kroków,
źródeł, bezpiecznych URL i czasu czytania dla tekstu chińskiego bez spacji.
Nie oznacza to automatycznego potwierdzenia prawdziwości każdej tezy przez unit.

Raport przeglądarkowy zapisuje wynik 108 rzeczywistych otwarć poradników oraz
próby układu i dostępności. Wynik bieżącego commita należy odczytać z raportu/CI;
ten opis metody sam w sobie nie jest zaliczeniem testu ani zgodą na publikację.
