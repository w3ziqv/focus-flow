# Lokalizacja i przegląd poradników — 28.10.2026

## Zakres

Dodano hiszpański oraz chiński uproszczony, a polski i angielski poddano audytowi.
Słowniki UI mają po 439 kluczy o zgodnych parametrach. Objęto ekran timera,
ustawienia, dźwięki, statystyki, synchronizację, onboarding, instalację PWA,
narrację, komunikaty po wznowieniu i recovery oraz eksporty. Nie zmieniano
schematu synchronizacji, ID sesji ani znaczenia danych użytkownika.

Wszystkie 27 poradników przepisano w czterech językach. W katalogu jest 28 źródeł
pierwotnych lub instytucjonalnych. Usunięto nieuzasadnione obietnice dotyczące
m.in. dopaminy, rytmów 90-minutowych, żywienia i automatycznej poprawy koncentracji.
Zachowano siedem kategorii i stabilne trasy. Nie dodano nowych poradników.

Kontrakty i mapa odpowiedzialności: [LOCALIZATION](../LOCALIZATION.md).
Pełna tabela redakcyjna: [przegląd poradników](../GUIDES-REVIEW-2026-10-28.md).

## Błędy ujawnione przez testy

- Opis eksportu i aktywny webhook miały napisy polskie poza słownikiem.
- Recovery błędnie porównywało zapisany JSON języka z niezserializowanym napisem.
- Zakończenie sesji bez ręcznie wybranego języka używało angielskiego zamiast
  języka wykrytego przez interfejs. Teraz oba korzystają z tych samych zasad.
- Karta PNG zawierała tekst poza słownikiem, angielskie jednostki i domenę lokalną.
  Skracanie tekstu według liczby znaków zastąpiono szerokością i granicami grafemów.
- Okno eksportu nie korzystało ze wspólnej obsługi klawiatury. Pobieranie chwilowo
  wyłącza przycisk, co może przenieść fokus na body. Wspólny manager odzyskuje Tab
  i obsługuje Escape także wtedy, zamyka tylko najwyższy dialog i respektuje IME.
  Ten niezależny fragment zapisano w `b70f732`.
- Hiszpańskie statystyki przepełniały ekran 320 px: nagłówek i etykiety wymagają
  zawijania. Naprawę sprawdzono w kolejnym przebiegu.
- Test eksportu początkowo zakładał angielskie nawiasy w nazwie Markdown. Teraz
  wybiera pełną etykietę bieżącego języka, również z chińską interpunkcją, i łączy
  oczekiwanie na pobranie z kliknięciem, bez odrzuconej obietnicy poza kontrolą testu.

## Lokalne wyniki i ich zakres

Wyniki w tej sekcji dotyczą kolejnych roboczych buildów, nie są dowodem publikacji
ani zaliczeniem późniejszego, innego SHA. CI dla końcowego commita jest osobnym
wymaganiem. Surowe logi i zrzuty pozostają w ignorowanych artefaktach.

- Unit: 872 testy, 68 plików PASS. Obejmują cztery słowniki, parametry, plurale,
  kopie v2 w czterech językach, grafemy PNG, recovery z JSON/legacy, źródła, IME
  i fokus. Zmienione asercje dawnej treści nie utrwalają błędnych twierdzeń naukowych.
- Typecheck, ESLint, design:check, granice UI i pięć prób desktop config PASS.
- Web oraz frontend desktopu i verify:builds PASS. To nie jest kompilacja Rust.
- Browser: timer/persistence, WebRTC i konflikt offline, historia/paginacja/
  wyszukiwanie/edycja, zagnieżdżone dialogi i propagacja języka/sync PASS.
- Lokalizacja gotowego web builda: cztery języki, 108 otwarć poradników, zachowane
  ID i deadline aktywnego timera oraz historia, reload, Markdown i PNG, linki,
  układy 320/390/1440 px oraz 20 stanów axe PASS. Chiński start i poradniki oraz
  cztery manifesty działały po przejściu offline. Późniejsze drobne poprawki
  fasady eksportu/recovery wymagają końcowej kontroli SHA, nie dziedziczą tego wyniku.
- PWA: restart offline, dekodowanie lokalnego audio, nawigacja i recovery brakującego
  chunku z zachowaniem danych PASS przed końcowym zamrożeniem źródeł.
- Trzy pomiary renderowania: Shell/Dial nadal 8–9 renderów / 2 s. Nawigacja,
  pole zadania, wskaźnik sync, otwarte dialogi i widok porad nie pojawiają się
  w renderach wywołanych samymi tickami. Brak deklaracji oszczędności CPU/baterii.
- Rust: cztery izolowane testy natywnych etykiet i stałego katalogu URL PASS;
  cargo fmt PASS. Pełna lokalna próba kompilacji zatrzymała się na brakującym
  `javascriptcoregtk-4.1`; nie jest PASS. Pełny native/Clippy/instalatory i runtime
  Linux/Windows muszą przejść właściwe CI.

### Dalsza kontrola rzeczywistego Preview

Na niezmiennym Preview `6d30348` potwierdzono chroniony dostęp i poprawny manifest
chiński z nagłówkami. Ręczna inspekcja UI ujawniła angielski tytuł karty oraz
separator tysięcy w roku stopki. Wspólny adapter metadanych obejmuje teraz główny
widok, recovery i mini timer; stopka przekazuje rok jako napis. Kontrola 108
widoków sprawdza również tytuł dokumentu i rok. Dodano testy metadanych w czterech
językach i aktualizacji języka przez zapis/import bez remountu lokalnego stanu.

## Świeży audit zależności

`npm audit --audit-level=high` przechodzi, ale pełny raport zawiera cztery pozycje
low wynikające z jednego problemu `deepmerge` w łańcuchu narzędzi Workbox/Rollup/PWA.
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) wskazuje
brak wydanej łatki; odczyt 28.10.2026. Nie wykonano proponowanego przez npm
wstecznego skoku do starego pluginu ani nie dodano ignorowania advisory.
`npm audit --omit=dev`: 0. Poprzednie datowane wyniki „0 również w dev” pozostają
historyczne, nie opisują bieżącej bazy advisory.

## Wydanie

[PR #9](https://github.com/w3ziqv/focus-flow/pull/9) otwarto dla `6d30348`.
CI `40736918027` PASS; Firestore w Security `40736917837` PASS.
Desktop `40736917826` zaliczył kompilację i testy Rust Linux/Windows, ale Clippy
zatrzymał oba zadania na zbędnym `to_string()` w nowym teście menu. Ta próba nie
zalicza instalatorów. Konwersję usunięto; cztery lokalne testy i izolowany Clippy
z `-D warnings` PASS. Potrzebne są nowe pełne CI i natywne paczki poprawionego SHA.
Main PR #7 pozostaje draftem. Nadal wymagane są fizyczne dwa urządzenia,
produkcyjny desktop OAuth/restart/revocation/keyring i funkcje OS. Właściciel ma
jedno konto testowe, więc rzeczywista izolacja dwóch kont Google pozostaje
niedostępna. Zmiany języka i poradników nie znoszą tych bramek publikacji.

## Końcowa weryfikacja zamrożonych źródeł

Head `d7b4d64e377e11206535cc3c4c9fb7963d7d4b3f`, czyste drzewo:
pełna kontrola lokalizacji gotowego PWA PASS (108 poradników / 20 stanów axe,
cztery języki, eksporty, timer/historia/reload, cztery manifesty i chiński tryb
offline). Tym razem sprawdzono też tytuł dokumentu i rok w stopce. CI
`40739473540`, Security `40739473221`, Desktop `40739473674` PASS, w tym natywne
pakiety trzech systemów i uruchomienie zainstalowanego Linux/Windows.

PR #9 scalono zwyczajnie jako `e146fe3e29e75826951302f8a44a7167389a572a`;
pełne drzewa są identyczne. CI kandydata `40741239709` i Security `40741239721`
PASS. Main pozostaje draftem. Produkcyjny Desktop literalnego commita:
`40741243519` PASS: natywne trzy systemy, zainstalowany Linux/Windows i Windows
upgrade/rollback. Cztery instalatory pobrano; strict metadata dla production,
projektu/clienta i literalnego SHA oraz komplet SHA-256 PASS. Płaski manifest:
`test-artifacts/ui-architecture/installers-production-e146fe3/release-payload/SHA256SUMS.txt`. Produkcyjny web tego SHA jest READY na stagingu
`dpl_9ST8PwJs9kGve6UKAcrgnLUYc4o6`, bez domen własnych; świeży smoke nagłówków,
metadanych/projektu, timera, manifestów i chińskiego poradnika offline PASS.
Raport: `test-artifacts/ui-architecture/staged-e146fe3/verification.json`.

Testowy `test/v3.0-cloud` zaktualizowano do `d7b4d64`. IAB potwierdził hiszpański
ekran timera i chiński poradnik z bibliografią. Zrzuty:
`test-artifacts/localization/preview-es-timer.png` i `preview-zh-guide.png`.
Nie używano Google ani danych użytkownika na nowych hostach. Dodatkowy
headless smoke testowego Preview zatrzymał się na ochronie Vercel (strona
logowania); nie jest to zaliczona kontrola aplikacji ani OAuth. Nie wyłączano
Deployment Protection i nie kopiowano cookies z przeglądarki użytkownika.

Przez uwierzytelniony connector pobrano skompilowany chunk App testowego Preview:
literalny `projectId` to `focus-flow-v3-test-20261010`. Metoda i publiczne dane
kontroli: `test-artifacts/localization/preview-project.json`. W testowym Auth
dodano wyłącznie ten konkretny niezmienny host, zachowując pozostałe domeny
oraz pola i potwierdzając odczytem po zmianie. Kopie before/after mają timestamp,
tryb wx/0600 i znajdują się prywatnie poza Git. Produkcyjnego Auth nie zmieniano.
Nie jest to wynik rzeczywistego Google OAuth nowego hosta.

Dokumentacja mapy komponentów, stanu i reprezentatywnych komponentów obejmuje
teraz także cztery języki, import preferencji, metadane, ExportCardModal i
ArticleView. Checkpoint dokumentacji na stable nie zmienia źródeł zweryfikowanych
paczek `e146fe3`; nie należy utożsamiać jego późniejszego SHA z commitem instalatorów.

Końcowy odczyt reguł: produkcja nadal ma `4c8bd509…`, test/source `d16c2a22…`.
Kopie tego odczytu są nowe i nie nadpisują wcześniejszych. Obie publiczne domeny
nadal wskazują poprzedni deployment; main to `a2f5f22`, PR #7 draft. Nie utworzono
tagu ani publicznego wydania. Snapshot danych i restore trzeba odświeżyć dopiero
bezpośrednio przed faktycznym rolloutem, po domknięciu otwartych bramek.
