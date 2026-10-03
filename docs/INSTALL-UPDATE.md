# Instalacja, aktualizacja i powrót do poprzedniej wersji

To wydanie jest nadal `3.0.0-alpha.1`. Instalatory CI są artefaktami do odbioru,
nie potwierdzeniem gotowości stabilnej. **Brak podpisu wydawcy**: Windows może
pokazać SmartScreen, a macOS nie ma notarizacji i pozostaje eksperymentalny.
SHA-256 sprawdza zgodność pobranego pliku, nie zastępuje podpisu wydawcy.

## Pobranie i sprawdzenie

Pobierz instalator i `SHA256SUMS.txt` z tego samego runu GitHub Actions lub,
po zamknięciu bramek, z tego samego GitHub Release. Zachowaj strukturę katalogów
z manifestu, aby wykonać `sha256sum -c SHA256SUMS.txt` na Linux.
Na Windows porównaj `Get-FileHash .\Focus-Flow-setup.exe -Algorithm SHA256`
z wpisem dotyczącym dokładnie pobranego pliku. Nazwa zależy od wersji instalatora.

Linux: CI Ubuntu 24.04 buduje `.deb` i `.AppImage` dla x86_64. `.deb` instaluj
przez `sudo apt install ./<plik>.deb`, żeby manager pobrał wymagane biblioteki.
AppImage: nadaj prawa uruchamiania (`chmod +x <plik>.AppImage`) i uruchom plik.
Jeśli dystrybucja wymaga FUSE, skorzystaj z jej pakietu FUSE lub `.deb` na Ubuntu.
Lokalny `.deb` zbudowany na Arch Linux potwierdza pakowanie, lecz nie potwierdza
zgodności ABI z Ubuntu; do dystrybucji przeznaczony jest artefakt z runnera Ubuntu.

Windows: CI tworzy instalator NSIS `.exe`. Zamknij aplikację, uruchom instalator
jako aktualny użytkownik i zachowaj ten sam zakres instalacji podczas aktualizacji.
Nie obchodź ostrzeżeń systemu bez sprawdzenia źródła, wersji i sumy pliku.

## Przed aktualizacją

1. W ustawieniach danych wyeksportuj pełną kopię JSON. Własne audio pozostaje
   lokalne; zachowaj także folder `sounds`, jeśli używasz własnych nagrań.
2. Zakończ lub wstrzymaj aktywną sesję i zamknij aplikację przez polecenie Wyjdź.
3. Skopiuj cały katalog danych aplikacji do osobnego miejsca:
   - Linux: `${XDG_DATA_HOME:-~/.local/share}/ink.focusflow.desktop/`.
   - Windows: `%APPDATA%\ink.focusflow.desktop\`.
4. Zachowaj dotychczasowy instalator. Aktualizacja nie zmienia identyfikatora
   aplikacji ani celowo nie usuwa katalogu danych. Nie używaj czyszczenia danych
   w deinstalatorze, jeśli chcesz je zachować.

Natywny zapis utrzymuje `data.json` i poprzednią poprawną kopię `data.json.bak`.
Przy uszkodzeniu nie zastępuje źródła pustymi danymi. Odzyskiwanie zachowuje
uszkodzony plik jako `data.json.corrupt`. Kopie migracji historii oraz zmiany
konta mają klucze `ff3_history_source_<uid>` i `ff3_account_backup_<uid>` wewnątrz
tego samego pliku; nie usuwaj ich przed potwierdzeniem zgodności historii.
Token odświeżania nie jest częścią kopii JSON; pozostaje w magazynie systemowym.

## Powrót do poprzedniej wersji

Zamknij aplikację, zachowaj osobno nowy katalog danych, zainstaluj poprzednią
wersję i przywróć **kopię utworzoną przed aktualizacją**. Nie otwieraj danych z
nowym schematem w starszej wersji na próbę. Wyloguj chmurę przed powrotem, żeby
starszy klient nie nadpisał nowego schematu. Nowe reguły odrzucają dawne mapy
historii; starszy klient może wymagać pracy offline. Dla web/PWA zachowaj eksport
JSON — pamięć przeglądarki nie zastępuje niezależnej kopii.

Odbiór wydania wymaga rzeczywistej instalacji i aktualizacji na Linux i Windows,
weryfikacji tray/mini/dźwięku/powiadomień/autostartu i uśpienia/wznowienia.
Samo utworzenie instalatora nie zamyka tych bramek.
