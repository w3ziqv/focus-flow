# Lokalizacja i przegląd poradników — 28.10.2026

## Zakres

Dodano hiszpański oraz chiński uproszczony, a polski i angielski poddano audytowi.
Słowniki UI mają po 437 kluczy o zgodnych parametrach. Objęto ekran timera,
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

- Unit: 867 testów, 67 plików PASS. Obejmują cztery słowniki, parametry, plurale,
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
