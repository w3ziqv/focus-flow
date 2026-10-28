# Focus Flow — wskazówki dla kolejnych sesji

Focus Flow to osobisty timer web/PWA i Tauri, z opcjonalnym Firebase oraz P2P.
Pracuj na rzeczywistym kodzie i zachowuj dane oraz istniejące zmiany robocze.

## Kontekst i kontynuacja

Przy kontynuacji modernizacji UI lub przygotowaniu wydania przeczytaj
`docs/modernization/HANDOFF-UI-RELEASE.md` i wskazane tam źródła.
Datowane wyniki są dowodem historycznym: porównaj je z bieżącym `git status`,
diffem i commitem. Plik przekazania opisuje stan i plan, nie dowodzi gotowości
nowej wersji i sam nie stanowi autoryzacji publikacji.

## Zasady projektu

- Aktualna architektura: `docs/adr/0010-evidence-based-modular-modernization.md`.
  Zastępuje sprzeczne twierdzenia w historycznych częściach ARCHITECTURE.md.
- Tokeny UI edytuj w `src/design/tokens.json`, następnie generuj CSS poleceniem
  `npm run design:tokens`. Kontrakt komponentów opisuje `docs/DESIGN.md`.
- Dopasuj rozmiar refaktoryzacji do wykazanego problemu. Optymalizacje i zmiany
  technologii uzasadniaj pomiarem lub konkretną granicą odpowiedzialności.
- Nie usuwaj zmian roboczych, kopii, tombstones ani danych w celu uzyskania
  zielonych testów. Prywatne snapshoty i tokeny nie mogą trafić do Git/logów CI.
- Oddzielaj unit, emulator, browser i natywny runtime. Build frontendu desktopu
  nie zastępuje kompilacji Rust i sprawdzenia zainstalowanej aplikacji.
- Zakres commit/push, usług i publikacji wynika z bieżącego polecenia użytkownika.
  Wydanie wykonuj według `docs/PRODUCTION-ROLLOUT-3.0.md`, po zweryfikowaniu
  aktualności jego konfiguracji i warunków dla dokładnego commita.
