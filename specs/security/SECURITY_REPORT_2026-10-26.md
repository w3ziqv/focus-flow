# Focus Flow — audyt bezpieczeństwa 2026-10-26

## Podsumowanie

Naprawiono potwierdzone błędy kolejki synchronizacji i podatne zależności.
Reguły źródłowe przeszły 56 prób autoryzacji w oficjalnym emulatorze, a adapter
przeszedł integrację dwóch profili. Nie wykazano przełamania izolacji UID w
bieżących regułach źródłowych. **Produkcja nadal używa starszych reguł i nie
zwraca nagłówków ochronnych z repozytorium.** Nie wdrażano usług ani nie czytano
dokumentów użytkowników. To audyt kodu i określonych przepływów, nie certyfikat.

Kontekst potwierdzony przez właściciela: aplikacja osobista, prywatne zadania,
opcjonalny Firebase i świadomie parowane urządzenia. Zakres: TypeScript/React,
Auth/Firestore, import/export, webhooki, Web Audio, Tauri IPC/OAuth i CI.
Rust oceniono w kodzie; nowego cargo audit/test/Clippy nie uruchomiono lokalnie,
ponieważ nie ma toolchainu Rust. Nie przenosimy na te zmiany wyników starego CI.

## Potwierdzone i naprawione

### SEC-001 — podatne zależności (high według advisories; ekspozycja zależy od użycia)

- Dowód bazowy: `package-lock.json`, `npm audit`: 7 pakietów, 3 high,
  3 moderate, 1 low. Nie oznacza to siedmiu zdalnie osiągalnych luk w aplikacji.
- Vite 7.3.6: podatności serwera/narzędzi developerskich. Undici 8.11.2 i Zod
  4.5.4: błędy przetwarzania wejścia. Vitest/mocker 4.1.11: rejestracja mocków
  i obejście ograniczeń ścieżek. Fast-uri i serialize-javascript: normalizacja
  URI i serializacja. Browserowy Firebase nie używa Node'owego Undici.
- Naprawa: Vite 7.3.7, Undici 8.12.3, Zod 4.6.7, Vitest/mocker 4.1.12,
  fast-uri 3.1.9, serialize-javascript 7.1.4; zgodne zakresy bez `--force`.
- Weryfikacja: końcowy `npm audit` zgłasza 0; typecheck, lint i testy przechodzą.
- Lockfile sprawdzono także rzeczywistym `npm ci --ignore-scripts` w pustym
  katalogu. Naprawiono brakujący opcjonalny wpis WASI, który lokalny build
  z istniejącym node_modules pomijał. Instalacja zgłasza deprecation glob 11.1.0
  z workbox-build 7.4.1; npm audit nie zgłasza obecnie dla niego advisory.
  To pozostały sygnał utrzymaniowy, nie dowód braku wszystkich podatności.
- Źródła: [Vite advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm),
  [Undici](https://github.com/advisories/GHSA-xjj6-f33q-929c),
  [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
  [Vitest](https://github.com/advisories/GHSA-qxg6-89mg-rqv8).

### SEC-002 — utrata wpisu kolejki dla specjalnego ID (low, integralność własnych danych)

- Dowód: przed poprawką `src/lib/sync/outbox.ts:trackCloudWrite` wykonywał
  `outbox.sessions[session.id] = session` na zwykłym obiekcie. Poprawne w
  archiwum ID `__proto__` zmieniało prototyp słownika zamiast tworzyć wpis.
  Nie wykazano globalnego prototype pollution, wykonania kodu ani dostępu do
  innego konta. Warunek: import/wprowadzenie takiego identyfikatora.
- Naprawa: słowniki bez prototypu przy tworzeniu i odczycie kolejki
  (`outbox.ts:11–24`). Zachowano JSON i wszystkie oczekujące wpisy, również >1000.
- Test: `src/lib/sync/outbox.test.ts`, trzy ID i kolejny zapis po serializacji.
  Test nie przechodził przed zmianą i przechodzi po niej.

### SEC-003 — zagnieżdżony zapis zdalny tracił kontekst (low, granica synchronizacji)

- Dowód: `applyRemote` zawsze ustawiał flagę na false w finally. Test z
  zagnieżdżeniem i wyjątkiem wykazał, że zewnętrzna operacja zaczynała wyglądać
  jak edycja użytkownika, mogąc wejść do outbox. Nie wykazano ataku sieciowego.
- Naprawa: `outbox.ts:27–31` przywraca poprzedni kontekst; test potwierdza,
  że zapis wewnątrz zewnętrznej operacji nie tworzy oczekującej zmiany.

## Potwierdzone rozbieżności wdrożenia — pozostają do osobnego rollout

### SEC-004 — produkcyjne reguły są starsze (medium, prywatność i dostępność sync)

Odczyt Firebaserules API 26.10.2026, bez odczytu danych kont:

| Projekt | Ruleset | SHA-256 | Stan |
| --- | --- | --- | --- |
| focus-flow-70527 | `04bf75a7-6e68-4f59-8b83-bcd071927d77` | `4c8bd509f7ff07d72d75c9104bcb6145e54d607198024d8d99ae8b619cf901bf` | Brak daily_history, kontroli maskowania i blokowania odtworzenia sesji przez istnienie tombstone. |
| focus-flow-v3-test-20261010 | `5f42e416-a379-4845-bfca-870f732067a4` | `d16c2a2209cf73e577d0433e04464736c1450f3ce308976ea1feb456fe980bab` | Identyczne z `src/lib/sync/firestore.rules`. |

Starsze reguły nadal sprawdzają UID i singletony; nie wykazano odczytu cudzych
kont. Pozwalają natomiast na słabszą walidację własnych dokumentów i nie
realizują wszystkich kontraktów v3. Włączenie Google i autoryzowane domeny
potwierdzono w obu projektach. Nie wykonano interaktywnego OAuth użytkownika.
Zalecenie: kontrolowany rollout z eksportem, weryfikacją migracji i planem
wycofania zgodnie z `docs/PRODUCTION-ROLLOUT-3.0.md`; nie wdrażać samych reguł
w oderwaniu od zgodności klientów. Metadane odczytu: raport modernizacji.

### SEC-005 — brak nagłówków ochronnych na produkcyjnej odpowiedzi HTML (medium, warunkowe)

`curl -I https://focusflow.ink` zwrócił HTTP 200, lecz brak HTTP CSP,
X-Frame-Options, Referrer-Policy i X-Content-Type-Options z `vercel.json:4–35`.
Meta CSP w `index.html:5` daje część ochrony, ale nie obsługuje frame-ancestors.
Brak nagłówka jest potwierdzony; skutecznego clickjackingu nie testowano.
Zalecenie: osobne wdrożenie konfiguracji i kontrola odpowiedzi dla obu domen.
Nie zmieniono zdalnych ustawień Vercel.

## Kontrole istniejące i ryzyka rezydualne

- Auth: `adapter.ts:884` czeka na odtworzenie Auth i sprawdza UID; `:905`
  pilnuje epoki konta. Zmiana konta wymaga zgody i kopii (`:295`). Native OAuth
  stosuje loopback/state/PKCE (`src-tauri/src/cloud.rs:191–276`), tokeny pozostają
  w Rust i magazynie systemowym. Zachowanie fizycznego keyringu wymaga testu OS.
- Firestore: `firestore.rules:158–226` wyprowadza autoryzację z UID, waliduje
  create/update, odrzuca obce konta i nieznane ścieżki. Drobne ograniczenie:
  daty sesji/revizji są ograniczonymi stringami, nie pełną walidacją ISO daty;
  klient odrzuca niepoprawną datę. Ryzyko dotyczy własnych danych właściciela.
- Import: `dataPort.ts:184–212` ogranicza bajty i odrzuca klucze prototypu,
  następnie waliduje sesje/audio. Limit 250 MiB nadal może długo blokować słabszy
  sprzęt; mniejszy limit lub parser w workerze wymaga osobnego benchmarku.
- Webhook: `webhook.ts:14–20,73–75` odrzuca URL userinfo i nie wysyła cookies,
  referrera ani redirectów. Nie jest to serwerowy SSRF. Bieżące CSP dopuszcza
  tylko self/Google, więc dowolny zewnętrzny webhook jest blokowany przez ten
  build; nie poluzowano CSP bez wskazania docelowych odbiorców. HTTP lokalnego
  odbiorcy może dodatkowo podlegać mixed-content/CORS.
- IPC: osobne capabilities mini/main, brak zdalnego dostępu; runtime ponownie
  sprawdza etykietę okna (`src-tauri/src/lib.rs:138–163`). Cloud HTTP wymusza
  HTTPS i brak redirectów (`cloud.rs:97–98`). Źródła Rust nie były zmieniane.
- P2P: świadome parowanie, fingerprint, tylko host candidates, limit 2 MiB i
  timeout (`peer.ts:4–24,74`). To nie jest uprawnienie do zaufania treści peer-a.
- Dane i kopie są lokalnie niezaszyfrowane; kompromitacja konta systemowego nie
  jest rozwiązywana przez reguły Firestore. Browserowe multi-key zapisy nie są
  transakcją; odrębne równoczesne timery w kartach i przerwanie zapisu pozostają
  ryzykiem integralności. Nowy kod nie migruje istniejących kluczy danych.
- Zdalne CI dla bazowego SHA było zielone; nowych workflow i natywnych
  instalatorów nie uruchomiono zdalnie w tym zadaniu. Brak deklaracji świeżego
  cargo audit, zgodności Safari, fizycznego uśpienia lub poprawności odwołania OAuth.

Audytor reguł: [FIRESTORE_AUDIT_2026-10-26.json](FIRESTORE_AUDIT_2026-10-26.json).
Model zagrożeń: [Focus Flow-threat-model.md](Focus%20Flow-threat-model.md).
