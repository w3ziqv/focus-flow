# Testowanie chmury 3.0 na osobnej gałęzi

Gałąź: `test/v3.0-cloud`, utworzona ze sprawdzonego `adea12b`.
Stały podgląd Vercel:
<https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app>.
Projekt Vercel: `focus-flow`, zespół `w3ziqvs-projects`.
Podgląd pozostaje chroniony dostępem Vercel; zaloguj się jako członek zespołu.
Nowe commity należy wdrażać jako Preview, bez promocji do produkcji.

## Granice środowiska

Vercel ma sześć publicznych zmiennych `VITE_FIREBASE_*` dla Preview i Production.
Oba środowiska wskazują na **ten sam Firebase `focus-flow-70527`**.
Osobna gałąź i adres Vercel nie tworzą osobnej bazy danych.
Nie testuj usunięć, maskowania ani migracji na zwykłym koncie z historią.
Użyj odrębnego konta Google bez danych Focus Flow albo oddzielnego projektu
Firebase, z konfiguracją Preview ograniczoną do tej gałęzi.
Nie zapisuj kluczy prywatnych, kont usług, tokenów ani danych logowania w repo.

## Wynik sprawdzenia 2026-10-10

Preview `dpl_HZJ4wuB32aKszZVJoBHSPZwzNcm8` dla `adea12b` osiągnął READY.
W przeglądarce: onboarding, start/pauza, zachowanie zadania i pauzy po
przeładowaniu oraz dostępność przycisku Google z prawdziwą konfiguracją przeszły.
Pierwszy klik Start po edycji zadania nie rozpoczął sesji; kolejny rozpoczął.
Ten przypadek wymaga odtworzenia w zwykłej przeglądarce przed uznaniem go za
błąd produktu lub automatyzacji.

Logowanie jest **zablokowane**: Firebase Auth odpowiada, ale w authorized domains
brakuje `focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app`.
Potwierdzono też ostrzeżenie SDK i użytkowy komunikat błędu w interfejsie.
Żadnych danych użytkowników Firestore nie czytano ani nie zmieniano.
Nie potwierdzono logowania Google ani synchronizacji na żywej chmurze.

## Odblokowanie i kontrola konfiguracji

W konsoli właściwego Firebase: Authentication → Settings → Authorized domains
→ Add domain. Dodaj tylko stały host Preview, bez protokołu i portu.
Nie dodawaj wildcardów ani domen każdego losowego wdrożenia.
Nie zmieniaj reguł produkcyjnego Firestore w ramach tego kroku.

Zmiennymi Preview zarządzaj w Vercel. Po zmianie konfiguracji zbuduj nowy Preview;
Vite osadza publiczne wartości podczas kompilacji.
Sprawdzenie bez zapisu danych (Node 20+):

```bash
FOCUS_FLOW_TEST_URL=https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app \
  node --env-file=.env.preview.local scripts/check-cloud-preview.mjs
```

`.env.preview.local` jest lokalnym, ignorowanym plikiem z publiczną konfiguracją
klienta Firebase; nie dodawaj go do Git. Preflight nie wypisuje wartości kluczy,
nie loguje użytkownika i nie zapisuje nic w Firebase. Jego PASS nie oznacza
zaliczenia logowania ani synchronizacji.

## Odbiór na koncie testowym

1. Otwórz podgląd w dwóch niezależnych profilach przeglądarki. Użyj wyłącznie
   danych syntetycznych, np. zadań z prefiksem `TEST`. Timer pozostaje lokalny.
2. Zaloguj się sam przez Google. Zatwierdź właściwe konto i decyzję o scaleniu
   danych. Sprawdź ostatnią synchronizację i odświeżenie po ponownym otwarciu.
3. Przenieś testową historię ponad 500 sesji i ustawienia. Porównaj sumy oraz
   identyfikatory w obu profilach, także poza limitem 1000 widocznych sesji.
4. Odłącz sieć w jednym profilu, zmień zadanie, połącz ponownie. Sprawdź
   oczekujące zmiany, ponowienie, konflikt, trwałe usunięcie i brak duplikatów.
5. Na danych testowych sprawdź maskowanie wcześniej przesłanych tytułów i
   checklist oraz izolację po wylogowaniu/zmianie konta.
6. Gdy pojawi się błąd reguł, zapisz jego kod i zatrzymaj odbiór. Nowe reguły
   sprawdzaj na osobnym Firebase, zanim zostaną rozważone dla produkcji.

Konfiguracja web z Vercel nie zawiera klienta Desktop OAuth. Opublikowane
instalatory alpha pozostają offline; logowanie desktopowe wymaga osobnego
Client ID typu Desktop app i ponownej kompilacji. Zobacz [CLOUD-SETUP.md](CLOUD-SETUP.md).
