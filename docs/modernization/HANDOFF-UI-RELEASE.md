# Przekazanie: architektura UI, weryfikacja i pełne wydanie Focus Flow

## Kontynuacja 28.10.2026 — aktualny kandydat i otwarte bramki

### Lokalizacja i poradniki — implementacja 28.10

Wdrożono PL/EN/ES/ZH-Hans w UI, recovery, narracji, eksportach, metadanych
PWA i menu desktopu oraz pełną redakcję 27 poradników z 28 źródłami. Kontrakty:
[LOCALIZATION](../LOCALIZATION.md), [przegląd wszystkich poradników](../GUIDES-REVIEW-2026-10-28.md).
Raport implementacji, znalezionych regresji i lokalnych kontroli:
[2026-10-28-localization](2026-10-28-localization.md). 872 unit / 68 plików PASS; 108 otwarć
poradników w czterech językach i 20 stanów axe PASS na roboczym web buildzie.
Wynik ten nie zastępuje CI dokładnego commita po zamrożeniu źródeł. Test natywny
lokalnie wymaga brakującego javascriptcoregtk-4.1; cztery izolowane testy menu/
katalogu i fmt PASS. Dodatkowy commit `b70f732` naprawia klawiaturę dialogu po
utracie fokusu przez oczekującą akcję oraz uwzględnia aktywne IME.

Po inspekcji Preview dodano też tłumaczenie tytułu karty/opisów dokumentu (w tym
mini timera) i poprawiono rok stopki bez separatora tysięcy. Słowniki: 439 kluczy.
PR #9 jest otwarty; wcześniejsze `6d30348` CI/Security PASS, Desktop FAILED na
Clippy w jednym teście. `d725d8c` usuwa tę konwersję; nowe CI w toku. Końcowe SHA
metadanych dokumentu wymaga własnych pełnych kontroli.

Świeży npm audit: cztery low w dev z jednego niezałatanego advisory deepmerge;
próg high przechodzi, runtime audit 0. Nie pisać „pełny audit 0”. Nowy PR/CI,
chroniony kandydat i instalatory wymagają odczytu po ukończeniu. Main #7 nadal
draft, produkcyjne domeny/reguły nadal stare, bez publikacji.

### Rozszerzenie zakresu po testach przeglądarkowych

Właściciel zlecił następnie audyt tłumaczeń całej aplikacji, dodanie hiszpańskiego
i chińskiego (przyjęto uproszczony), sprawdzenie wszystkich 27 przewodników na
podstawie źródeł i profesjonalną redakcję; nowe przewodniki są opcjonalne, po
testach aplikacji. **To jest dalsza praca przed publikacją, nie anulowanie celu
wydania.** Nowy kod języków/treści będzie wymagał własnego dokładnego commita,
buildów i weryfikacji. PR #7 pozostaje draftem.

Baseline przed tą pracą: chroniony `codex/v3.0-release` =
`cb3e2389d64ed65894c8e50c6069f10321f9c444`, po zwykłym merge PR #8. Head PR #8
`17cd7ae` (uzupełniony o bazę, bez zmiany drzewa względem `9214af0`) zaliczył
CI `40717230990`, Security `40717231009` i pełny Desktop `40717230923`, w tym
zainstalowany Linux/Windows. Wcześniejszy run `40716037103` też PASS. Produkcyjny
Desktop literalnego `cb3e238` `40720464290`: PASS wszystkich natywnych
paczek, zainstalowanego Linux/Windows i Windows upgrade/rollback; cztery pobrane
instalatory oraz ścisłe metadane/SHA-256 PASS. Świeży staging smoke tego SHA
(header/PWA/mobile/persistence/project) też PASS. Staging tego SHA: `dpl_HpU3dGWv15T84MdPXzUnpyexLiaj`, bez domen własnych.

Rzeczywiste testy Google w IAB na kodzie `5143cd7` (pełne źródła aplikacji/builda
porównano z `cb3e238`: identyczne):

- Właściciel wybrał konto w systemowych oknach Google, które nie są widoczne
  w inwentarzu narzędzia. Logowanie i sync PASS; reload strony → odtworzenie
  konta → rzeczywisty Sync Now z nowym timestampem PASS.
- Dwa niezależne originy HTTPS (`ldcctiyxq` i `g6sjsqy9a`), ten sam testowy
  Firebase/kod. Oba logowania PASS. Drugi świeży profil pobrał 501 sesji /
  12525 minut: zachowano istniejącą sesję i dodano 500 syntetycznych.
- Paginacja 50 → 100 i wyszukiwanie poza pierwszą stroną PASS. Edycja TEST 499
  dotarła do drugiego profilu; usunięcie tej jednej syntetycznej sesji dotarło
  do pierwszego. Końcowo oba mają 500 sesji / 12500 minut.
- Porównanie końcowego eksportu z kopią sprzed importu potwierdziło wszystkie
  oczekiwane ID oraz niezmienione id/date/minutes/task/checklist pierwotnej sesji.
  Nie przywracano starego profilu, więc późniejsze wybory języka/motywu użytkownika
  pozostały zachowane. Dane TEST pozostają w izolowanej chmurze do dalszych prób.
- Jeden dodatkowy odczyt nadpisał wcześniejszy surowy snapshot testowej chmury.
  To błąd obsługi kopii, nie utrata pierwotnej sesji: odrębny pełny eksport profilu
  sprzed importu jest zachowany i porównany; kopie produkcji są nienaruszone.
  Nowszy surowy snapshot ma poprawną nazwę `test-cloud-after-browser-tests.json`
  i dodatkową kopię z timestampem. Nie opisuj go jako kopii sprzed testu.
- W testowym Auth dopisano wyłącznie dwa powyższe kontrolowane hosty Preview,
  z prywatnymi kopiami konfiguracji i odczytem zachowania pozostałych pól.
  Produkcyjnego Auth nie zmieniano. Stable test alias wskazuje teraz ten sam
  kod przez `dpl_43emV5Rc3UB2uxY4YxiVFFPBytuK` (redeploy bez zmiany źródeł).
- Próba 127.0.0.1 odrzucona przez allowlist; localhost po poprawieniu hosta nie
  otworzył widocznego popupu i nie jest PASS. Drugi HTTPS rozwiązał tę przeszkodę.

Raport bez PII: ignorowany `test-artifacts/ui-architecture/browser-google-verification.json`.
Eksporty i snapshoty z danymi są poza Git w prywatnym katalogu kopii z 28.10.
Właściciel ma **jedno konto do testów**: zmiana dwóch rzeczywistych kont Google
pozostaje niedostępna. Dwa fizyczne urządzenia, odcięcie sieci/reconnect z realnym
Google, produkcyjny desktop OAuth/revocation/keyring i fizyczne funkcje OS nadal
są osobnymi, niewykonanymi bramkami. Nie zastępuj ich powyższymi dwoma originami.

**Etap architektury UI wdrożony. Publikacja produkcyjna jeszcze niewykonana.**
Mapa komponentów i przepływu stanu, katalogi i przewodnik:
[UI-ARCHITECTURE](../UI-ARCHITECTURE.md). Kontrakty i przykłady:
[UI-COMPONENTS](../UI-COMPONENTS.md). Pomiary i uzasadnienie:
[raport UI](2026-10-27-ui.md), ADR-0011.

- Zachowano wcześniejsze zmiany w `8903be5`; architektura UI jest w `01d2c2c`.
  Kolejne commity naprawiają lockfile czystego npm ci, reset porad i natywne
  advisories (webpki/roots/Tokio). Żadnej kontroli ani progu audit nie obniżono.
- [PR #6](https://github.com/w3ziqv/focus-flow/pull/6) przeszedł wszystkie wymagane
  kontrole na head `482db00` i został zwyczajnie scalony do chronionego
  `codex/v3.0-release`. Bez admin bypass i bez zmiany ochrony. Auto-merge repo
  jest wyłączone; nie zmieniano tego ustawienia.
- **Kandydat:** `575f070997b7824ddcabaec28eb2bc1c102e1815`. Lokalny checkout
  pozostaje `codex/v3.0-stable`; późniejsze zmiany dokumentacji nie są nowymi
  produkcyjnymi buildami. Sprawdź status/diff i nie pomyl SHA dokumentacji
  z metadanymi instalatora.
- [PR #7 do main](https://github.com/w3ziqv/focus-flow/pull/7) jest draftem.
  Nie scalać przed wynikami bieżącej akceptacji fizycznej.
- Świeże [CI 40711072975](https://github.com/w3ziqv/focus-flow/actions/runs/40711072975)
  i [Security 40711072823](https://github.com/w3ziqv/focus-flow/actions/runs/40711072823)
  PASS: 844 unit/64 pliki, lint/typecheck/tokens/boundaries, audit npm,
  buildy frontendu i izolacja, Firestore, Rust audit. Checkout PR to syntetyczny
  merge `369ec403265b582c7d1efc716e8298165242b2f6`; porównanie pełnych drzew
  z kandydatem dało identyczny `9de9aebb77e125feed2e671f3efdc90ed42e16f9` i pusty diff.
- Produkcyjne instalatory i runtime dokładnego SHA:
  [Desktop 40710979304](https://github.com/w3ziqv/focus-flow/actions/runs/40710979304).
  **PASS**: natywne Linux/Windows/macOS, instalacja i uruchomienie Linux/Windows,
  Windows upgrade alpha.2 → kandydat i rollback z kopii sprzed aktualizacji.
  Pobrano cztery instalatory, wszystkie SHA-256 i czteropolowe metadane
  (`production`, projekt produkcyjny, Desktop client, dokładny commit) PASS.
  Lokalne paczki i płaski manifest: ignorowany
  `test-artifacts/ui-architecture/installers-production-575f070/release-payload/`.
- Osobny Desktop PR #7 `40711072751` pozostaje FAILED: próba 1 zerwała połączenie
  proxy przy screenshot, próba 2 zaliczyła wszystkie asercje, lecz sprzątanie
  mktemp zderzyło się z kończącym portalem (ENOTEMPTY). Nie uznawano ich za PASS.
  Naprawa skryptu testowego `9214af0`, [PR #8](https://github.com/w3ziqv/focus-flow/pull/8):
  bezpośredni WebKit dla obu paczek Linux i ograniczone ponowienia sprzątania
  wyłącznie profilu mktemp. Pierwotny błąd testu i wyczerpane cleanup nadal fail.
  Próby izolowane potwierdziły te trzy polityki. Runtime-only `40716032967`
  PASS Linux/Windows i Windows upgrade/rollback, na paczkach produkcyjnych
  `575f070` po porównaniu pełnych źródeł aplikacji/builda. Native job celowo
  skipped, nie jest to nowy build. Pełne CI PR #8 jest odrębną kontrolą.

Web/PWA: `dpl_8vXsRVKyQSCoMBfdZC6rms79Kxfw`, dokładny kandydat, target=production,
READY, zmienne produkcyjne, bez domen własnych. Świeży smoke PASS: sześć
nagłówków identycznych z vercel.json, zadanie i ID timera po reload, dostępny
Google UI bez logowania, PWA/offline/nawigacja, 390 px i brak page errors.
Zrzut i raport są w ignorowanym `test-artifacts/ui-architecture/staged-575f070/`.
Linki dostępu z parametrami i logi są prywatnie poza Git.

`autoAssignCustomDomains=false` pozostaje zabezpieczeniem stagingu. Odczyt
28.10 obu domen nadal wskazuje `dpl_7kbjGztvYdG7HrryQyMG3boTXZMJ` / `a2f5f22`.
Produkcyjne reguły nadal: `4c8bd509f7ff07d72d75c9104bcb6145e54d607198024d8d99ae8b619cf901bf`;
test/source: `d16c2a2209cf73e577d0433e04464736c1450f3ce308976ea1feb456fe980bab`.
Nie wykonano produkcyjnej migracji ani deploy reguł.

### Co blokuje publikację i jak kontynuować

Właściciel poprosił o instrukcję wykonania testów; **nie podał jeszcze nowych
wyników PASS**. [Procedura i formularz](../TESTING-UI-RELEASE-2026-10-28.md)
opisują dwa fizyczne urządzenia, Google/restart/offline/edycję/usunięcie,
maskowanie i zmianę konta, następnie produkcyjny desktop, revocation/brak
magazynu poświadczeń, funkcje OS i upgrade/rollback. Osobny profil przeglądarki
nie oddziela chmury tego samego konta. Pełny restart testować w trwałym profilu,
ponieważ zamknięcie wszystkich okien incognito usuwa dane.

Właściciel następnie upoważnił agenta do użycia zalogowanej przeglądarki i
przejęcia testów. Inwentarz udostępnił tylko IAB, bez Chrome/Firefox i bez
natywnych okien. Zastany testowy PWA miał alpha.1; przed zmianami wyeksportowano
pełny JSON do prywatnej kopii. Na niezmiennym Preview `5143cd7` potwierdzono UI
3.0.0, ale początkowy Google OAuth zwrócił `auth/unauthorized-domain`.
Po prywatnym snapshotcie testowej chmury (17 dokumentów) i konfiguracji Auth,
dopisano wyłącznie `focus-flow-ldcctiyxq-w3ziqvs-projects.vercel.app` w testowym
authorizedDomains, zachowując pozostałe pola i domeny; odczyt po zmianie PASS.
Produkcja bez zmian. Ponowne Google OAuth w IAB pozostaje na Connecting; popup
Google nie jest widoczny w inwentarzu kart. **Nie jest to PASS OAuth.** Agent
poprosił o sprawdzenie okna i podał oficjalną procedurę podłączenia Chrome przez
Settings → Computer Use → Chrome → Install, następnie @Chrome. Nie zastępuj
tego połączenia kopiowaniem cookies/poświadczeń ani osłabieniem zabezpieczeń.

Izolowany web użytkownika nadal ma `5143cd7` na
`https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app` (test Firebase).
Porównano wszystkie źródła aplikacji/builda z kandydatem: identyczne. Nie
zmieniano tej wersji podczas testów użytkownika. Syntetyczny import 500 sesji
jest w `test-artifacts/ui-architecture/acceptance/TEST-500-sessions.json`;
rzeczywisty import w świeżym profilu dał 500 sesji / 12 500 minut.

Prywatne kopie źródeł/danych/reguł i test migracji/restore z 27.10 zachowane
poza repo (`~/.local/state/focus-flow-checkpoints/2026-10-27-ui/`, 0700,
snapshoty 0600). Bieżący odczyt reguł i prywatny dostęp stagingu są w
`2026-10-28-release/`. Odśwież snapshot i sprawdzenie restore tuż przed
faktycznym rolloutem; stara kopia nie dowodzi aktualności danych.

Po domknięciu bramek stosuj [rollout](../PRODUCTION-ROLLOUT-3.0.md). Po scaleniu
do main ponownie zapisz **rzeczywisty końcowy SHA**, uruchom produkcyjny Desktop
na main, zweryfikuj jego instalatory/metadane i staging tego SHA. Nie publikuj
paczki wcześniejszego merge tylko dlatego, że kod aplikacji jest równoważny.
Kolejność reguły/klient/domeny oraz rollback musi zachować aktualne dane.
Autoryzacja użytkownika obejmuje publikację po zaliczeniu warunków; nie proś
ponownie o samą zgodę, lecz zbierz brakujące rzeczywiste wyniki/dostępy.

## Kontynuacja 27.10.2026 — bieżący etap

Wdrożono mapę i granice `app/views/features/ui`, własność stanu, izolację renderów,
stos dialogów i kontrakty. Źródła: [raport UI](2026-10-27-ui.md),
[mapa i stan](../UI-ARCHITECTURE.md), [kontrakty](../UI-COMPONENTS.md), ADR-0011.
Lokalnie: 844 unit/64 pliki, lint/typecheck/tokeny, oba buildy frontendu, granice,
desktop config, audit npm 0, browser/WebRTC/historia, PWA offline/recovery, axe,
56 prób reguł i integracja 1105 sesji. Prywatny snapshot z 27.10 przeszedł
migrację i odtworzenie w loopback emulatorze. Kopie są poza repozytorium.

Trzy próby pomiaru: nawigacja, TaskField, sync, otwarte ustawienia/audio i indeks
porad przestały renderować się od samych ticków (około 8 → 0 / 2 s); silnik nadal
aktualizuje tarczę. Nie jest to deklaracja oszczędności CPU/baterii.

Publikacja pozostaje zależna od świeżego CI dla commita kandydata, produkcyjnych
instalatorów i nowych testów właściciela: OAuth/restart, dwa fizyczne urządzenia,
zmiana konta/revocation/brak keyringu, sleep/resume i upgrade/backup rollback.
Wyników wcześniejszych kandydatów nie przenoszono na nowy kod. Produkcyjne reguły
i przypisanie domen nadal są starsze; brak migracji i publikacji w tym miejscu.
Commit/PR i wyniki końcowe zostaną zapisane po ukończeniu bieżącej weryfikacji.

Poniższe przekazanie z poprzedniej sesji pozostaje historycznym punktem odniesienia.

Punkt odniesienia: prace z 26.10.2026; przekazanie uzupełnione 27.10.2026.
Ten dokument przekazuje kontekst następnej sesji.
Nie uruchamia jej automatycznie i sam nie upoważnia do wdrożenia produkcji.
Zakres wykonania, w tym publikacja, wynika z polecenia użytkownika w tej sesji.

## Cel następnego etapu

Użytkownik chce po dotychczasowej modernizacji dopracować architekturę UI jako
system komponentów, stanu i interakcji, wdrożyć uzasadnione poprawki, następnie
wykonać pełną weryfikację i przygotować pełne wydanie web/PWA oraz desktopu.
Publikacja może nastąpić po spełnieniu warunków wydania, jeśli użytkownik
zleci ją w nowym czacie. Nie kończyć etapu implementacji na samym planie.

## Najpierw odtwórz stan

- Katalog: `/home/mateusz/Documents/Focus Flow`.
- W chwili przekazania branch: `codex/v3.0-stable`, HEAD: `f95f29d`.
- **Modernizacja jest w niezacommitowanych zmianach i nowych plikach.** Nie
  traktuj ich jako obcego brudu do usunięcia. Sprawdź `git status` i pełny diff.
- Nowy czat powinien używać tego samego lokalnego checkoutu. Nowy pusty worktree
  z samego HEAD nie zawiera tych zmian. Jeśli ich brak, najpierw ustal lokalizację
  lub sposób przeniesienia; nie odtwarzaj dużej modernizacji z samego opisu.
- W tym etapie nie wykonano commit/push, merge, release, deploy ani migracji
  rzeczywistego profilu. Dane testowe były syntetyczne.

Przeczytaj w kolejności:

1. `AGENTS.md`, bieżący kod, konfigurację i diff.
2. `docs/modernization/2026-10-26.md` — problemy, plan, rozwiązania i ograniczenia.
3. `docs/modernization/verification-2026-10-26.json` — zakres wykonanych kontroli.
4. `docs/adr/0010-evidence-based-modular-modernization.md`, aktualny wstęp
   `docs/ARCHITECTURE.md`, `docs/DESIGN.md`.
5. `specs/security/SECURITY_REPORT_2026-10-26.md`,
   `specs/security/Focus Flow-threat-model.md`,
   `specs/security/FIRESTORE_AUDIT_2026-10-26.json`.
6. `docs/PRODUCTION-ROLLOUT-3.0.md`, `docs/VERIFICATION-3.0.md`,
   `docs/INSTALL-UPDATE.md`, `docs/CLOUD-SETUP.md` i workflow CI.

Historyczne ADR-y zawierają nieaktualne opisy TS7, braku backendu/kont i inne
twierdzenia. Nowy ADR i kod mają pierwszeństwo. Starsza akceptacja właściciela
dotyczy wcześniejszych kandydatów, nie automatycznie nowego instalatora.

## Co już wykonano — zachowaj i rozwijaj

| Obszar | Aktualny stan |
| --- | --- |
| Dane i timer | `domain/calendar.ts` i `sessionStatistics.ts`; wspólna operacja w `FocusStore`; data ukończenia, stałe ID snapshotu i ograniczenie replay/duplikatów. Nie jest to transakcja ani formalne exactly-once. |
| Synchronizacja | Null-prototype dictionaries w outbox i poprawna obsługa zagnieżdżonego `applyRemote`; transport, migracje i permanentne tombstones zachowane. |
| Design | `src/design/tokens.json` → generator → CSS; ten sam JSON dla theme.ts. Pięć motywów, kontrast Sage naprawiony, wspólne cele 44 px. |
| Interakcje | `useDialogFocus` dla Modal/FocusOverlay; inert, Tab/Escape i powrót fokusu. Zamknięty overlay nie montuje tarczy. Zoom dozwolony; ukryte presety inert. |
| Ładowanie | Dialogi importowane po otwarciu, dostępny LoadingState i istniejące recovery błędów chunków. Workbox nadal pobiera pełny precache, także Firebase. |
| Statystyki | `memo(StatsView)`, stabilny callback i partie po 50. Wyszukiwanie, agregaty, eksport i zapis obejmują pełny zbiór. Naprawione anulowanie edycji i układ 320 px. |
| Narzędzia | Node 24 w CI/.node-version, jawne discovery unit tylko w src, integracja wymaga emulatora loopback; kontrola wygenerowanych tokenów. Ignorowanie buildów/artefaktów przez watcher Vite. |

Lokalnie przeszło: 841 testów w 63 plikach, 56 prób reguł Firestore,
integracja dwóch profili i 1105 sesji, 5 testów konfiguracji desktop,
lint/typecheck/build web/build frontend desktop/verify:builds, E2E WebRTC,
PWA offline i recovery, axe w 16 stanach. Npm audit: 0; czyste npm ci w osobnym
katalogu z wyłączonymi skryptami instalacji przeszło. Nowego Rust/cargo oraz
instalatorów nie sprawdzono lokalnie — brakowało toolchainu.

Pomiary to punkt odniesienia, nie kryterium zaliczenia przyszłego kodu:

- JS na starcie: 440098 → 380077 decoded bytes; nie jest to gzip ani cały PWA.
- Historia 1000 sesji, CPU 4×, mediana trzech prób: otwarcie 3584,6 → 487,1 ms;
  główna nitka w oknie 5 s: 5003,7 → 39,9 ms. Render 1000 → 50 wierszy.
- Brak zapisu na tick. Edycja zadania nadal wykonuje 3 setItem.
- Wyniki timera/audio powtórzono naprzemiennie z powodu dryfu między seriami.
  Nie deklarowano oszczędności całkowitego RAM, baterii ani ogólnej poprawy LCP.

Surowe próby: `docs/modernization/performance-2026-10-26.json`,
`performance-initial-comparison-2026-10-26.json` i
`history-performance-2026-10-26.json`. Zrzuty/inspector w ignorowanym
`test-artifacts/modernization/`; axe w `/tmp/focus-flow-ux-audit/`.
Zachowaj rozpoznawalny papier, Fraunces/Instrument Sans, ceglany akcent i tarczę.

## Zakres UI do dokończenia

To jest zakres następnej pracy, a nie deklaracja ukończenia wszystkich punktów.
Najpierw obejrzyj działający UI i przedstaw krótki plan z dowodami w kodzie.

1. **Warstwy komponentów:** rozdziel bazowe prymitywy, UI funkcji i układy
   ekranów. Ustal odpowiedzialności i dozwolone zależności. Dokumentacja już
   wyróżnia warstwy, ale `components/` pozostaje wspólnym katalogiem, a ESLint
   egzekwuje przede wszystkim granicę domeny. Przenoś pliki tam, gdzie poprawia
   to granice; sam wzrost liczby katalogów nie jest wynikiem.
2. **Podział funkcji:** timer, audio, statystyki, ustawienia, sync i desktop.
   Zbadaj szczególnie odpowiedzialności Shell w App.tsx, który nadal koordynuje
   te funkcje. Współdziel komponenty o tym samym znaczeniu i zachowaniu;
   nie łącz przypadkowo podobnych wizualnie elementów.
3. **Stan:** sporządź tabelę informacji → właściciel → trwałość → subskrybenci
   → dozwolone zdarzenia. Oddziel stan prezentacji od silnika, danych i sync.
   Rozróżnij autorytatywne dane od cache/snapshotu oraz lokalnego szkicu formularza.
   Zapewnij jedno źródło prawdy; nie dodawaj globalnego store bez wykazanej potrzeby.
4. **Renderowanie:** StatsView już poprawiono. Zmierz pozostałe części Shell,
   nawigację, otwarte ustawienia i audio podczas ticków. Użyj React Profiler lub
   równoważnego pomiaru commitów/renderów. Optymalizuj wykazane przypadki;
   sprawdź też aktualizacje języka, motywu, danych i sync, aby memo nie ukrywało zmian.
5. **Kontrakty:** warianty, propsy/zdarzenia, błędy, loading/empty/disabled/offline,
   semantyka i pięć motywów. Rozwiń istniejące tokeny i prymitywy; udokumentuj
   reprezentatywne przykłady PillButton, Switch, Modal, tabs, TaskField, Dial
   i SyncStatusIndicator wraz z wyglądem oraz interakcjami. Nowa biblioteka
   katalogu komponentów wymaga uzasadnienia kosztu i korzyści.
6. **Interakcje systemowe UI:** nawigacja i stos porad, dialogi/nakładki i ich
   zagnieżdżanie, fokus/powrót fokusu, zakres skrótów oraz resize bez utraty
   treści formularza i aktywnej fazy. Zachowaj działające useDialogFocus.
7. **Hierarchia:** rozpoczęcie skupienia i kontekst zadania pozostają łatwe do
   znalezienia. Dodatkowe ustawienia nie mogą komplikować głównego przepływu.
8. **Weryfikacja:** desktop/telefon, klawiatura, 200% zoom, motywy, offline,
   reconnect i kontrolowane błędy sync. Oddziel symulację przeglądarki od
   rzeczywistego telefonu/OS. Zrzuty przed i po, testy ryzyk oraz wyniki pomiarów.

Wyniki etapu: mapa komponentów i zależności, diagram przepływu stanu, docelowa
struktura katalogów z uzasadnieniem, wdrożone granice i kontrakty, krótki
przewodnik rozwijania UI oraz dokumentacja reprezentatywnych komponentów.
Aktualizuj istniejące źródła i ADR-y; nie twórz sprzecznych równoległych zasad.

Skille: architecture-patterns, architecture-decision-records,
code-review-excellence, debugging-strategies, javascript-testing-patterns,
e2e-testing-patterns, design-taste-frontend, React best practices i verification.
Przy zmianach granic użyj security-best-practices/security-threat-model oraz
odpowiednich Firebase Auth/Firestore rules skills. Rzeczywisty kontekst usług
czytaj z Firebase/Vercel/GitHub; gdy konektor nie wystarcza, użyj oficjalnego CLI.

## Warunki przejścia do pełnego wydania

Zielony zestaw unit nie wystarcza. Po etapie UI wykonaj kontrole dla dokładnego
commita przeznaczonego do wydania; nie używaj zielonego CI z `f95f29d` jako
dowodu dla nowego kodu. Nie omijaj ochrony brancha ani wymaganych checks.

- Przejrzyj cały diff, zapisz zmiany w uzasadnionych commitach, przygotuj PR
  i świeże CI, jeżeli bieżące polecenie obejmuje te czynności. Nie promuj
  częściowej wersji podczas refaktoryzacji UI.
- Wymagane kontrole: lint, typecheck, design:check, unit, npm audit,
  build/build:desktop/verify:builds, browser, a11y, PWA offline/recovery,
  oficjalny emulator z regułami i rzeczywistym adapterem.
- Rust: aktualny cargo audit, testy i Clippy zgodnie z konfiguracją projektu,
  pakowanie oraz uruchomienie instalatorów na wspieranych OS. Jeśli brak lokalnych
  narzędzi, przygotuj je z oficjalnego źródła lub wykorzystaj właściwe CI;
  wyników niewykonanych nie oznaczaj jako passed.
- Sprawdź rzeczywisty Google OAuth, odtworzenie po restarcie, zmianę konta,
  odwołanie dostępu, brak keyringu, dwa urządzenia, sleep/resume oraz upgrade
  i odtworzenie kopii. Zachowaj wcześniejsze wyniki właściciela jako historyczne;
  nowe wymagane ręczne sprawdzenia przedstaw użytkownikowi konkretnie.
- Przed migracją potrzebna jest świeża prywatna kopia danych i reguł oraz test
  odtworzenia. Prywatny test migracji uruchamiaj tylko na loopback emulatorze;
  nie kopiuj rzeczywistych danych do commita, PR, logów lub artefaktów CI.
- Zweryfikuj na nowo konfigurację usług i zgodność wersji klientów, a następnie
  wykonaj sekwencję `docs/PRODUCTION-ROLLOUT-3.0.md`. Dokument jest datowany
  i nie zastępuje bieżącego odczytu. Bieżący branch `codex/v3.0-stable` nie jest
  automatycznie dozwolonym branchem produkcyjnym przez istniejący preflight.
- Odczyt z 26.10 wykazał starszy ruleset produkcji `focus-flow-70527` i brak HTTP
  headers z vercel.json. Testowy Firebase `focus-flow-v3-test-20261010` jest
  zgodny ze źródłami; jego Preview nie jest produkcyjnym buildem do promocji.
- Publikacja obejmuje właściwy klient web/PWA, zgodne reguły/headers oraz
  zweryfikowane instalatory i metadane dokładnego commita. Wersję/tag ustal
  na podstawie aktualnego repo i wydanych wersji; nie zakładaj bez sprawdzenia,
  że historyczny plan 3.0.0 nadal jest właściwy.
- Po wdrożeniu odczytaj reguły/headers, sprawdź domeny i smoke test przepływów.
  Zachowaj kopie i plan rollback; cofnięcie samego webu nie cofa danych chmury.

## Ograniczenia i kontekst bezpieczeństwa

Właściciel potwierdził: aplikacja osobista bez zespołów, potencjalnie prywatne
opisy, opcjonalna chmura i własne świadomie parowane urządzenia. Dotychczasowy
audyt usług był tylko do odczytu; przyszły rollout potrzebuje zakresu wynikającego
z nowego polecenia. Nie ujawniaj danych ani sekretów podczas jego przygotowania.

Pozostają ryzyka webowego multi-key zapisu/crash/quota, dwóch równoczesnych
timerów i replay poza oknem 1000 rekordów; import do 250 MiB może blokować
słaby sprzęt; dane lokalne są plaintext. Zewnętrzne webhooki blokuje obecny
CSP — nie usuwaj tej ochrony przy okazji pracy nad UI.

## Środowisko poprzedniej sesji — sprawdź dostępność ponownie

Node 24.22.1 i Chromium 156.0.8078.47. Node był w
`/home/mateusz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`;
npm w `/tmp/focus-flow-tooling/package/bin`; Java 21 w
`/tmp/focus-flow-tooling/jre/bin`; Chromium `/usr/sbin/chromium`.
Katalogi tymczasowe mogą zniknąć. W razie braku runtime użyj narzędzia
`load_workspace_dependencies` lub oficjalnego źródła, nie zakładaj starego PATH.
Browser scripts przyjmują `CHROMIUM_PATH`; `CHROMIUM_NO_SANDBOX=1` było
użyte wyłącznie dla izolowanej automatyzacji Chromium w tym środowisku.

Przed zakończeniem kolejnej sesji zaktualizuj ten plik: ukończone etapy,
aktualny commit/branch, wyniki kontroli, konkretne otwarte bramki i następny krok.

## Tekst startowy do nowego czatu

Poniższy tekst jest propozycją polecenia. Zawiera zgodę na pełne wydanie po
spełnieniu warunków; staje się poleceniem dopiero, gdy użytkownik wklei go
w nowym czacie. Samo odczytanie tego dokumentu nie stanowi takiej zgody.

```text
Kontynuuj modernizację Focus Flow w istniejącym lokalnym katalogu
/home/mateusz/Documents/Focus Flow.

Najpierw przeczytaj AGENTS.md oraz
docs/modernization/HANDOFF-UI-RELEASE.md i wskazane tam źródła.
Sprawdź bieżący git status i diff. Zachowaj wszystkie dotychczasowe zmiany;
to kontynuacja pracy, a nie rozpoczęcie projektu od nowa.

Wykonaj cały opisany etap architektury UI: komponenty i zależności, podział
funkcji, własność stanu, pomiary renderowania, kontrakty, nawigację, fokus,
skróty, hierarchię i weryfikację przeglądarkową. Przedstaw mapę komponentów
i przepływu stanu, docelową strukturę katalogów oraz zasady i przykłady
komponentów. Po krótkim planie wdrażaj uzasadnione zmiany etapami.

Następnie przygotuj i zweryfikuj pełne wydanie web/PWA oraz desktopu.
Upoważniam Cię do niezbędnych commitów, push, PR i uruchomienia CI,
a po spełnieniu wszystkich warunków planu wydania — do publikacji produkcyjnej
Focus Flow: klienta web/PWA, zgodnych reguł i nagłówków oraz instalatorów.
Zabezpiecz dane i możliwość wycofania. Weryfikuj dokładny commit wydania.

Nie kończ na samym planie. Nie publikuj przy niespełnionych warunkach ani
nie uznawaj niewykonanych kontroli za zaliczone. Jeśli potrzebne są testy
ręczne lub brakujące dostępy, wskaż je konkretnie i kontynuuj niezależne prace.
```
