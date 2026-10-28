# Akceptacja fizyczna kandydata UI — 28.10.2026

Status: **oczekuje na wyniki właściciela**. Żaden punkt poniżej nie jest zaliczony
samym przygotowaniem instrukcji ani automatycznym testem CI.

Kandydat produkcyjny: `575f070997b7824ddcabaec28eb2bc1c102e1815`.
Izolowany web testowy nadal używa `5143cd7198c458c132a6d12931e750832419ec55`;
porównano komplet źródeł aplikacji/builda obu commitów — są identyczne. Różnią
się dokumentacją i kontrolą zależności UI. Testowy Firebase to
`focus-flow-v3-test-20261010`, produkcyjny to `focus-flow-70527`.

## Najpierw komputer i telefon

1. Na komputerze utwórz **osobny zwykły profil przeglądarki**, bez synchronizacji
   profilu przeglądarki. Na telefonie użyj osobnej przeglądarki/profilu, w którym
   nie masz własnych danych Focus Flow. Pozwala to naprawdę zamknąć i uruchomić
   przeglądarkę bez usuwania danych. Incognito wystarcza do ponownego otwarcia
   karty, ale zamknięcie ostatniego prywatnego okna usuwa jego dane.
2. Na obu urządzeniach otwórz
   [izolowany web testowy](https://focus-flow-git-test-v30-cloud-w3ziqvs-projects.vercel.app).
   Jeśli pojawi się ochrona Vercel, zaloguj się swoim kontem Vercel. Następnie
   w aplikacji: **Aplikacja → Synchronizacja w chmurze → Zaloguj się przez Google**
   (EN: **App → Cloud Synchronization → Sign in with Google**).
   Wybierz to samo, osobne konto Google przeznaczone do testów na obu urządzeniach.
   Osobny profil przeglądarki nie oddziela danych chmury tego samego konta Google.
3. Wyłącznie na komputerze importuj syntetyczny plik
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
[Desktop 40710979304](https://github.com/w3ziqv/focus-flow/actions/runs/40710979304).
Przed uruchomieniem porównaj SHA-256 z manifestem i `desktop-build.json`:
`mode=production`, `projectId=focus-flow-70527`, `commit=575f070997b7824ddcabaec28eb2bc1c102e1815`.
Nie zastępuj ich paczkami offline z PR ani testowymi instalatorami `5143cd7`.

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
