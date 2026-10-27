# ADR-0010: Ewolucyjna modernizacja aplikacji lokalnej

Status: Accepted. Data: 2026-10-26.
Zastępuje nieaktualne części ADR-001, 003, 005, 006, 008 i 009;
uzupełnia ADR-002. Historyczne teksty pozostają dostępne.

## Kontekst

Focus Flow ma działający React 19, TypeScript 5.8.3, Vite 7, Tailwind 4,
Vitest 4, Firebase 12 i Tauri 2/Rust. Silnik audio jest oparty na Web Audio,
z dwoma lokalnymi nagraniami; timer opiera się na deadline. Migracja całego
frameworka nie naprawia wykazanego błędu rozliczania daty po uśpieniu.
Istnieją trzy ścieżki rozliczania sesji i nieaktualne deklaracje architektoniczne.

## Decyzja

Zachowujemy obecny stos i identyfikatory przechowywanych danych. Czyste zasady
kalendarza i statystyk przenosimy do `src/domain/`; istniejący `FocusStore`
koordynuje zapis ukończenia dla timera i wznowienia. `lib/storage.ts` pozostaje
kompatybilną fasadą walidacji i zdarzeń, `desktop/runtime.ts` wybiera adapter
localStorage lub NativePersistence, a `sync/` obsługuje transport i konflikty.
Nie dokładamy kontenera DI, globalnej biblioteki stanu ani sieciowego backendu.

Dialogi ładowane są po otwarciu, z widocznym i dostępnym stanem ładowania.
Workbox nadal precache'uje moduły wymagane dla offline, również Firebase.
Tokeny CSS mają jedno źródło, dokumentacja opisuje ich role. Zachowujemy
Fraunces/Instrument Sans, ciepły papier i tarczę; umożliwiamy zoom i poprawiamy
cele dotykowe. Wyjątek marki od reguł skilla: papier i ceglany akcent.

Pomiar widoku statystyk z 1000 sesji wykazał pełne renderowanie listy przy
każdym tyknięciu timera. Granicę ekranu memoizujemy z niezmiennymi propsami,
a listę pokazujemy po 50 wpisów. Wyszukiwanie, sumy i eksport korzystają z
całego zbioru. Nie dodajemy biblioteki wirtualizacji: stronicowanie usuwa
zmierzone wąskie gardło przy niższym koszcie utrzymania i prostym DOM.

Node 24 jest wspólny dla lokalnych kontroli, CI i aktualnego projektu Vercel.
Testy jednostkowe nie uruchamiają scenariuszy emulatorowych ani historycznych
artefaktów. Integracja Firestore wymaga jawnego emulatora na loopback.

## Alternatywy i koszt

| Opcja | Korzyść | Koszt / dlaczego teraz odrzucona |
| --- | --- | --- |
| React → Preact/Svelte | Możliwy mniejszy runtime | Przepisanie testów/hooków i ryzyko desktop/audio; brak dowodu przewagi dla całego przepływu. |
| Vite → Next/SSR | Render serwerowy | Timer osobisty nie wymaga SSR; dodatkowa infrastruktura i osobna ścieżka offline/Tauri. |
| localStorage → IndexedDB dla wszystkiego | Transakcje i asynchroniczny zapis | Duża migracja fasady i synchronizacji. Obecnie brak zapisów na tick; zachować jako opcję po wykazaniu problemu quota/atomowości. Audio już używa IndexedDB/plików. |
| Firebase → własny backend | Pełna kontrola konfliktów | Utrzymanie Auth, API, reguł i wdrożeń bez wykazanej potrzeby produktu. |
| Tauri → Electron | Jednolity Chromium | Nowy runtime i uprawnienia; brak benchmarku uzasadniającego koszt migracji. |
| TypeScript native | Możliwy szybszy typecheck | W repo jest zwykły `typescript`, nie `tsgo`; dawnych tabel nie uznajemy za pomiary. Osobny prototyp wymagany przed zmianą kompilatora. |

## Konsekwencje i wycofanie

Mniejsza zmiana umożliwia bezpośrednie porównanie bundla, CPU i regresji.
Brak migracji danych i nowych zależności runtime. Nowe opcjonalne pole ID
w snapshotach jest ignorowane przez wcześniejszą wersję. Wycofanie kodu nie
wymaga przepisywania archiwów. Multi-key localStorage nie staje się przez to
transakcją; nagła awaria pomiędzy zapisami i równoczesne timery w kartach
pozostają osobnymi ryzykami. Nie deklarujemy formalnego exactly-once.

## Źródła

- [Raport i pomiary](../modernization/2026-10-26.md).
- [React: external stores](https://react.dev/reference/react/useSyncExternalStore).
- [React: memo i stabilność propsów](https://react.dev/reference/react/memo).
- [TypeScript native preview i polecenie tsgo](https://devblogs.microsoft.com/typescript/announcing-typescript-native-previews/).
- [Firestore: offline i LWW](https://firebase.google.com/docs/firestore/manage-data/enable-offline).
- [Tauri: capabilities](https://tauri.app/security/capabilities/).
- [Tauri: architektura](https://v2.tauri.app/concept/architecture/).
- [Electron: model procesów](https://www.electronjs.org/docs/latest/tutorial/process-model).
