# Języki aplikacji

Focus Flow obsługuje polski (`pl`), angielski (`en`), hiszpański (`es`) oraz
chiński uproszczony (`zh`, HTML `zh-Hans`, formaty regionalne `zh-CN`).
Nazwy w przełączniku są nazwami własnymi języków: Polski, English, Español,
简体中文. Wybór jest lokalnym ustawieniem urządzenia.

## Odpowiedzialności i kontrakty

- `src/domain/language.ts`: stabilne kody, walidacja, metadane i dopasowanie
  regionalnych ustawień przeglądarki. Nie zależy od Reacta ani pamięci trwałej.
- `src/lib/locales/{pl,en,es,zh}.ts`: pełne słowniki UI o identycznych kluczach
  i zmiennych interpolacji. `TranslationKey` wynika ze słownika polskiego;
  brak klucza w innym języku jest błędem TypeScript.
- `src/lib/translations.ts`: czysta interpolacja w jednym przebiegu, formaty
  liczb i odmiana liczby poradników. Tekst zadania zawierający np. `{round}`
  pozostaje tekstem użytkownika, nie kolejnym szablonem.
- `I18nProvider`: bieżący język, zapis wyboru, HTML `lang` i wybór manifestu.
  Subskrybuje lokalne zdarzenia pamięci oraz zmiany z innych kart; import kopii
  aktualizuje język bez ponownego montowania silnika timera.
- Narracja, powiadomienia, eksporty i recovery używają tych samych funkcji
  tłumaczeń poza Reactem. Głos systemowy musi odpowiadać językowi; gdy go nie ma,
  wybór pozostaje silnikowi TTS, zamiast wymuszać obcy głos domyślny.
- `src/lib/pwaManifest.ts`: opisy, podpisy i skróty instalowanej PWA.
  Vite generuje cztery manifesty, a Workbox przechowuje je offline. Wszystkie
  zachowują `id`, `scope`, `start_url` i nazwy marki. System operacyjny może
  odświeżyć metadane już zainstalowanej PWA dopiero według własnego harmonogramu.
- `src-tauri/src/menu_language.rs`: tekst menu natywnego dostępny przed startem
  webview, z uwzględnieniem zapisanego wyboru. Główne akcje w czasie pracy nadal
  otrzymują etykiety z frontendu. NSIS zawiera cztery języki i wybór przy instalacji;
  dodatkowe komunikaty Tauri po polsku są w `src-tauri/windows/Polish.nsh`.

Własny tekst zadań, list, nazw dźwięków, presetów i danych konta nie jest
automatycznie tłumaczony. Podobnie nazwy autorów, czasopism, marki oraz standardy
CSV/JSON/HTTP zachowują swoje znaczenie. Nie nadpisuj zapisanych etykiet tylko
na podstawie ich podobieństwa do dawnego presetu.

## Dane i zgodność

`ff2_lang` zachowuje klucz. Czytnik akceptuje JSON oraz wcześniejszy zwykły napis,
waliduje cztery kody i bezpiecznie odrzuca inne wartości. Regionalne oznaczenia
przeglądarki, np. `es-MX` czy `zh-TW`, wybierają odpowiedni obsługiwany język;
chiński interfejs pozostaje uproszczony. Nie dodano nowego schematu danych.

Eksport/import JSON v1/v2 akceptuje cztery języki; identyfikatory sesji i własne
etykiety pozostają niezmienione. Starszy klient obsługujący tylko `pl/en` może
odrzucić nową kopię z `es/zh`: do odzyskiwania takiej kopii należy użyć klienta
z obsługą tych języków. Kopii nie należy edytować ani usuwać w celu obejścia walidacji.

CSV zachowuje stałe nazwy kolumn, liczby maszynowe i formaty dat. Markdown,
opisy i tytuły iCalendar oraz PNG są lokalizowane. UID iCalendar i znaczniki
RFC 5545 nie zmieniają się ze zmianą języka. Język nie wchodzi do schematu
synchronizacji Firestore; ta zmiana nie wymaga rozszerzania reguł chmury.

## Dodawanie i weryfikowanie tekstu

1. Dodaj klucz w czterech słownikach. Zachowaj nazwy zmiennych i znaczenie akcji,
   również w błędzie, stanie pustym i atrybutach dostępności.
2. Liczby i daty formatuj według wybranego języka. Nie zmieniaj kodów protokołów,
   ID danych ani separatorów formatu maszynowego.
3. Sprawdź zmianę języka przy aktywnym timerze, otwartym oknie i zapisanym szkicu.
   Unikaj zmiany klucza Reacta tylko z powodu języka.
4. Uruchom unit/typecheck/lint oraz `npm run test:localization`. Skrypt sprawdza
   cztery języki, 108 widoków poradników, linki do źródeł, eksporty, zachowanie
   timera i historii, reload, układ 320/390/1440 px oraz axe. Escape nie przerywa aktywnego składania
   tekstu przez IME. Domyślnie używa
   izolowanej przeglądarki i lokalnego serwera. `FOCUS_FLOW_TEST_URL` pozwala
   sprawdzić gotowy build. Nie kieruj danych syntetycznych do istniejącego profilu.
5. Sprawdź produkcyjny build offline i manifesty, a desktop osobno w natywnym
   runtime. Zrzuty i raporty lokalne są w ignorowanym `test-artifacts/localization`.

Automatyczna kompletność słowników nie jest dowodem naturalności języka ani
pełnej dostępności czytnika ekranowego. Test dwóch profili na jednym komputerze
nie zastępuje akceptacji dwóch fizycznych urządzeń z planu wydania.

Przegląd treści i źródeł: [27 poradników](GUIDES-REVIEW-2026-10-28.md).
