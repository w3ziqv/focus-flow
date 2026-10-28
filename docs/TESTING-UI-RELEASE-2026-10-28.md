# Akceptacja fizyczna kandydata UI — 28.10.2026

Status: **niewykonane próby ręczne, zaakceptowane odstępstwo dla publikacji**.
28.10 właściciel wyraźnie zaakceptował wydanie 3.0 bez wymienionych wyników.
Instrukcja pozostaje do późniejszej akceptacji; automatyczne CI ani decyzja
właściciela nie zmieniają niewykonanej próby w PASS. Świeże kopie/restore,
pełne CI i dokładny końcowy commit/paczki nadal są obowiązkowe.

Kandydat produkcyjny: `e146fe3e29e75826951302f8a44a7167389a572a`.
Izolowany web testowy: `d7b4d64e377e11206535cc3c4c9fb7963d7d4b3f`; porównano
pełne drzewa z kandydatem — są identyczne. Zawierają cztery języki i 27
zredagowanych poradników. Testowy Firebase: `focus-flow-v3-test-20261010`,
produkcyjny: `focus-flow-70527`.

Logowanie Google po poprzednich próbach na dwóch originach, odtworzenie konta po
reload oraz online edycja/usunięcie były zaliczone na wcześniejszym kodzie.
To nie jest pełny restart przeglądarki ani fizyczny test dwóch urządzeń.
Właściciel ma jedno konto testowe: próba dwóch rzeczywistych kont w punkcie 8
pozostaje **niedostępna**, nie PASS. Nie trzeba ponownie odpowiadać na pytanie
o drugie konto. Udostępnione agentowi narzędzie nie obsługuje natywnych okien
ani drugiego fizycznego urządzenia; ich testy wymagają dostępu właściciela.

## Najpierw komputer i telefon

1. Na komputerze utwórz **osobny zwykły profil przeglądarki**, bez synchronizacji
   profilu przeglądarki. Na telefonie użyj osobnej przeglądarki/profilu, w którym
   nie masz własnych danych Focus Flow. Pozwala to naprawdę zamknąć i uruchomić
   przeglądarkę bez usuwania danych. Incognito wystarcza do ponownego otwarcia
   karty, ale zamknięcie ostatniego prywatnego okna usuwa jego dane.
2. Na obu urządzeniach otwórz
   [niezmienny web testowy](https://focus-flow-3r90tbnzf-w3ziqvs-projects.vercel.app).
   Jeśli pojawi się ochrona Vercel, zaloguj się swoim kontem Vercel. Następnie
   w aplikacji: **Aplikacja → Synchronizacja w chmurze → Zaloguj się przez Google**
   (EN: **App → Cloud Synchronization → Sign in with Google**).
   Ten konkretny host jest wpisany do testowej allowlisty OAuth; pozostałe pola
   Auth zachowano i odczytano po zmianie, z prywatnymi kopiami o unikalnych nazwach.
   Faktyczne Google OAuth nowego hosta nadal nie jest zaliczone.
   Wybierz to samo, osobne konto Google przeznaczone do testów na obu urządzeniach.
   Osobny profil przeglądarki nie oddziela danych chmury tego samego konta Google.
3. Najpierw wykonaj pełny eksport aktualnego profilu. Używane wcześniej konto
   ma obecnie 500 sesji / 12 500 minut, z zachowaniem pierwotnej sesji i usunięciem
   jednej syntetycznej. **Nie importuj ponownie 500 sesji do tego konta.** Pobierz
   aktualny stan z testowej chmury i zapisz liczby/ID jako punkt odniesienia.
   Tylko w nowym pustym koncie/profilu na komputerze importuj syntetyczny plik
   `test-artifacts/ui-architecture/acceptance/TEST-500-sessions.json` przez
   **Aplikacja → Dane → Importuj JSON**. Plik ma 500 sesji / 12 500 minut,
   zadania zaczynają się od `TEST physical acceptance`. Import może przełączyć
   interfejs na angielski. Nie importuj go do osobistego profilu.
4. W synchronizacji wybierz **Synchronizuj teraz / Sync Now**. Na telefonie
   wykonaj to samo. W pustym koncie porównaj 500 sesji i 12 500 minut, otwórz
   kolejne strony historii (**Show more sessions**) i wyszukaj wpis spoza
   pierwszych 50. Jeśli konto miało już dane, zachowaj je i porównaj przyrost
   o 500 sesji / 12 500 minut; niczego nie usuwaj dla uzyskania równej liczby.
   Czas sesji pozostaje lokalny dla każdego urządzenia.
5. Zamknij i uruchom ponownie przeglądarkę na obu urządzeniach. Sprawdź zachowane
   konto, historię i ponowną synchronizację bez kolejnego logowania Google.
6. Wyłącz sieć na telefonie. Zmień nazwę jednej sesji TEST i usuń inną. Przywróć
   sieć, synchronizuj telefon i komputer. Nowa nazwa ma być na obu, usunięta
   sesja nie może wrócić. Powtórz restart i sprawdź brak duplikatów.
7. Na danych TEST sprawdź **Hide task content in the cloud**. Po synchronizacji
   zaloguj A w jeszcze jednym świeżym profilu: nie powinien otrzymać wcześniej
   wysłanych tytułów/list kroków. Lokalne treści już istniejące na urządzeniach
   nie są miarodajnym odczytem tego, co pozostaje w chmurze.
8. Wyloguj konto A i zaloguj osobne konto B. Nie zgadzaj się na przesłanie
   lokalnych danych A do B. Sprawdź brak historii A w B, następnie wróć do A
   i sprawdź jego dane. Zachowaj kopie przełączenia konta.

Do każdego punktu zapisz: urządzenie, OS, przeglądarkę, PASS/FAIL i objaw błędu.
Nie przesyłaj haseł, tokenów ani prywatnych zrzutów historii.

## Następnie desktop

Instalatory kandydata produkcyjnego pochodzą wyłącznie z
[Desktop 40741243519](https://github.com/w3ziqv/focus-flow/actions/runs/40741243519).
Przed uruchomieniem porównaj SHA-256 z manifestem i `desktop-build.json`:
`mode=production`, `projectId=focus-flow-70527`, `commit=e146fe3e29e75826951302f8a44a7167389a572a`.
Nie zastępuj ich paczkami offline z PR ani wcześniejszymi instalatorami.
Cztery paczki i manifest znajdują się lokalnie w ignorowanym
`test-artifacts/ui-architecture/installers-production-e146fe3/release-payload/`;
metadane i wszystkie SHA-256 sprawdzono po pobraniu.

Przed aktualizacją wykonaj eksport JSON i pełną kopię katalogu danych zgodnie
z [INSTALL-UPDATE](INSTALL-UPDATE.md). Zachowaj poprzedni instalator. Pierwszą
próbę produkcyjnego OAuth przeprowadź na osobnym koncie/profilu z danymi TEST;
reguły produkcyjne nadal są starsze, a zwykłego profilu nie należy migrować
przed skoordynowanym wdrożeniem reguł i klienta.

Na Linuxie i Windowsie trzeba odnotować:

- Google login → synchronizacja → Quit → ponowne uruchomienie i odtworzenie konta.
- Cofnięcie dostępu aplikacji w koncie Google → ponowne otwarcie → czytelna
  informacja/powtórne logowanie bez utraty danych i kolejki zmian.
- Brak systemowego magazynu poświadczeń w oddzielnej VM/użytkowniku testowym:
  ostrzeżenie o połączeniu tylko do zamknięcia aplikacji; po restarcie ponowne
  logowanie i zachowane dane. Nie wyłączaj globalnego keyringu własnej sesji.
- Zmiana PL/EN/ES/ZH: etykiety menu/tray i mini bez angielskich pozostałości,
  treść narracji w wybranym języku, dostępność odpowiedniego głosu w OS.
  Brak zainstalowanego głosu trzeba odnotować jako ograniczenie systemu.
- Dźwięki, mini/tray, powiadomienie końca krótkiej sesji, autostart po ponownym
  zalogowaniu do OS, sleep/resume z aktywnym timerem i czytnik ekranu/klawiatura.
- Aktualizacja poprzedniej wersji w tym samym zakresie instalacji: zachowane
  dane. Rollback: zachować nowszy profil osobno, pozostać offline/wylogowanym,
  przywrócić poprzedni instalator i **kopię sprzed aktualizacji**.

CI sprawdza instalację i uruchomienie Linux/Windows oraz osobno automatyczną
aktualizację/rollback Windows na jednorazowym profilu. Nie uruchamiaj
`scripts/test-windows-upgrade.ps1` na osobistym komputerze: ten wrapper usuwa
i odtwarza profil przeznaczony wyłącznie dla runnera CI.

## Formularz wyniku

```text
Web: komputer / OS / przeglądarka:
Web: telefon / OS / przeglądarka:
Google na obu / 500 sesji i 12500 min / historia poza 50:
Pełny restart / offline edycja / offline usunięcie / brak duplikatów:
Maskowanie / konto A → B → A:
Desktop: OS / format instalatora / SHA-256:
Produkcyjny Google / Quit i restart / revocation / brak magazynu:
Audio / tray i mini / powiadomienia / autostart / sleep / czytnik:
Aktualizacja / kopia / rollback:
FAIL i kroki odtworzenia (jeśli wystąpił):
```

Starsze akceptacje właściciela pozostają historyczne. Publikacja jest zależna
od nowych wyników oraz [sekwencji wydania](PRODUCTION-ROLLOUT-3.0.md).
