# Przekazanie: architektura UI, weryfikacja i pełne wydanie Focus Flow

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
