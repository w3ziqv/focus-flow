# Focus Flow — roadmapa od wersji 3.0

Stan: przygotowanie `3.0.0-alpha.1`. Stabilna wersja 3.0 pozostaje zablokowana
przez testy rzeczywistej chmury oraz odbiór instalatorów i działania na Windows.
Wcześniejsza specyfikacja: [archiwum](archive/ROADMAP-before-3.0.md).
Dowody i ograniczenia: [weryfikacja](VERIFICATION-3.0.md).

Kierunek: spokojny timer dostępny offline, opcjonalne konto i niezawodna chmura.
Historia, ustawienia, cele oraz domyślnie treści zadań/checklist są synchronizowane.
Aktywne timery pozostają niezależne. Pliki audio są lokalne.
P2P i macOS są eksperymentalne. Nie dokładamy AI, menedżera zadań ani integracji
bez potwierdzonego problemu użytkownika. Terminy określimy po zamknięciu zależności.

## 3.0 — niezawodna praca na kilku urządzeniach

**Problem:** historia może zniknąć ze statystyk, wysyłka dużego dziennika zawieść,
prywatne checklisty pozostać w chmurze, a logowanie desktopowe nie działać.
**Zmiana:** paczki do 400 zapisów, trwała kolejka offline, trwałe usunięcia,
dokumenty dzienne zamiast dowolnej mapy, kopie migracji i potwierdzenie zmiany
konta. Systemowa przeglądarka z PKCE, losowym loopbackiem i tokenami w Rust.
**Sukces:** wszystkie poniższe bramki zaliczone na dokładnym commicie wydania.
**Zależności:** klient OAuth Desktop, Firebase Auth/Firestore, magazyn poświadczeń,
Linux i Windows oraz CI z instalatorami.

- [ ] Dwa niezależne urządzenia: pierwsze połączenie, >500 sesji, offline,
  ponowienie częściowego błędu, konflikt, trwałe usunięcie, maskowanie >1000
  zapisów, zmiana konta i starsze sumy. Emulator uzupełnia test rzeczywistej chmury.
- [ ] Desktop: rzeczywiste logowanie, odświeżenie po restarcie i cofnięcie zgody;
  brak magazynu poświadczeń prowadzi do jawnej sesji pamięciowej.
- [ ] Linux i Windows: instalacja, aktualizacja z kopią, powrót do poprzedniej
  wersji, tray, miniokno, dźwięk, powiadomienia, autostart i uśpienie/wznowienie.
- [ ] Jednostki, emulator, audyty npm/Rust, optymalizowany test poprawki glib,
  kompilacje i testy przeglądarkowe przechodzą lokalnie oraz w rzeczywistym CI.
- [ ] Instalatory mają SHA-256; brak podpisu wydawcy jest jawny; pobrane
  instalatory zostały sprawdzone, nie tylko zbudowane.
- [ ] UX: zrozumiałe błędy i ponowienie, offline/oczekujące zmiany/synchronizacja/
  ostatni sukces, spójne PL/EN, klawiatura, 200% powiększenia, kontrast i czytnik.

Kolejność publikacji: gałąź → PR z dowodami → CI → odbiór powyższych bramek →
scalenie → `v3.0.0`, release notes i sprawdzone instalatory. Brak dostępnej bramki
pozostawia PR otwarty; sam zielony zestaw testów nie uprawnia do stabilnego tagu.

## 3.0.x — szybkie naprawy po wydaniu

**Problem:** rzeczywiste środowiska mogą ujawnić regresje, których nie odtworzył CI.
**Zmiana:** małe poprawki, jasne komunikaty i odzyskiwanie danych bez zmiany
podstawowego przepływu. **Sukces:** każda regresja odtworzona i pokryta testem;
aktualizacja i rollback sprawdzone. **Zależności:** raporty z wersją/systemem,
przykładowe dane za zgodą użytkownika, bez treści zadań w telemetrii.

## 3.1 — świadome przekazanie aktywnej sesji

**Problem:** użytkownik zmienia urządzenie w trakcie pracy i musi ręcznie odtworzyć
stan. **Zmiana:** opcjonalne, wyraźnie zatwierdzone przekazanie sesji i potwierdzenie
na urządzeniu odbierającym. **Sukces:** jeden jednoznaczny właściciel, brak
podwójnego naliczania również przy offline i wznowieniu. **Zależności:** stabilna
3.0, protokół własności i testy dwóch urządzeń. Nie uruchamiamy automatycznie
timera na wszystkich urządzeniach.

## 3.2 — historia, podsumowania i naprawianie pomyłek

**Problem:** puste statystyki przeciążają odznakami; trudno odnaleźć pracę lub
odzyskać pomyłkowo usunięty zapis. **Zmiana:** podsumowanie i pierwsza sesja przed
odznakami, czytelniejsza historia, cofanie usunięcia i przewidywalny eksport.
**Sukces:** co najmniej 4 z 5 testerów bez pomocy znajdują dzień pracy, porównują
okresy i odzyskują pomyłkę. **Zależności:** testowalny mechanizm cofania z nową
identyfikacją sesji, żeby nie wskrzeszać trwale usuniętych identyfikatorów.

## 3.3 — wygodniejsze P2P i rozszerzenie wsparcia

**Problem:** parowanie techniczne jest trudne, a część systemowych WebView nie
obsługuje WebRTC. **Zmiana:** natywny transport i prostsze parowanie; rozszerzenie
wsparcia dopiero po odbiorze na danym systemie. **Sukces:** transport, utrata sieci,
ponowne parowanie i konflikt sprawdzone na każdym deklarowanym systemie.
**Zależności:** przegląd bezpieczeństwa parowania, stabilne 3.0 i dostęp do tych OS.

## Wnioski UX i sposób sprawdzania

Bieżący audyt (`/tmp/focus-flow-ux-audit`) ocenił onboarding i timer jako czytelne.
Najpierw poprawiamy wyjaśnienie zakresu chmury, błędy z ponowieniem i polskie
komunikaty. Puste statystyki zaczynają się od działania, a integracje trafiają do
sekcji zaawansowanej. Zachowujemy spokojny wygląd i możliwość pominięcia konta.
Zrzuty pokazują wygląd; zgodność dostępności wymaga osobnych testów klawiaturą,
czytnikiem ekranu, przy powiększeniu i pomiarów kontrastu.
