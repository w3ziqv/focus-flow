# Konfiguracja i odbiór chmury 3.0

Web/PWA korzysta z konfiguracji `.env.example` w `.env.local` lub zmiennych Vercel.
Bez niej konto jest opcjonalne, przycisk chmury pokazuje niedostępność, a dane
pozostają lokalne. Klucze konfiguracji Firebase klienta są publiczne; nie dodawaj
kont usług ani kluczy prywatnych do repozytorium lub paczki aplikacji.

Desktop potrzebuje `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` i oddzielnego
`FOCUS_FLOW_GOOGLE_DESKTOP_CLIENT_ID` typu **Desktop app** z tego samego projektu.
Przekaż je do procesu Cargo/Tauri podczas kompilacji; sam plik `.env.local` Vite
nie konfiguruje Rust. CI czyta publiczne wartości ze zmiennych repozytorium.
Google provider musi być włączony w Firebase Auth. Zatwierdź odbiorców/testerów
na ekranie zgody Google i domeny aplikacji web w Firebase Auth.

OAuth używa przeglądarki systemowej, PKCE S256, losowego `state`, jednorazowego
callbacku na `127.0.0.1:<losowy-port>` i limitu oczekiwania. Kod i tokeny wymienia
Rust; WebView nie otrzymuje tokenów i zachowuje CSP ograniczone do lokalnego IPC.
Firebase refresh token trafia do Secret Service/keyring na Linux lub Credential
Manager na Windows. Brak magazynu oznacza jawny tryb pamięciowy. Sprawdź to na
normalnym systemie oraz z niedostępnym magazynem.
Źródło protokołu: [Google OAuth dla aplikacji desktopowych](https://developers.google.com/identity/protocols/oauth2/native-app).

Nowe reguły i klient muszą być sprawdzone razem na projekcie testowym przed
wdrożeniem produkcyjnym. Dawne dowolne mapy historii nie są już dopuszczalne przy
zapisie. Migracja czyta starszy dokument, zachowuje jego lokalną kopię, zapisuje
zwalidowane dni w paczkach i dopiero wtedy oznacza podsumowanie schematem 3.
Przerwana migracja może być ponowiona. Nie usuwaj starej historii ani jej kopii
ręcznie. Starszy klient może wymagać trybu offline po zmianie reguł.

Zapis sesji jest identyfikowany trwałym ID. Reguły odrzucają ponowne utworzenie
trwale usuniętego ID. Paczka sesji ma najwyżej 6 zapisów: sprawdzenia osobnych
tombstones i wspólnej polityki prywatności muszą zmieścić się w limicie 20 odczytów
reguł Firestore dla jednej paczki bez zakładania współdzielonego cache odczytów. Pozostałe paczki mają najwyżej 400 zapisów. Kolejka zachowuje niepotwierdzone
sesje także poza widocznym limitem 1000; serwer jest czytany w ograniczonych
stronach. Maskowanie usuwa również dawniej wysłane checklisty/tytuły i jest
wymuszane przez reguły przy kolejnych zapisach. Wyłączenie maskowania nie może
odtworzyć treści, której żadne urządzenie już lokalnie nie zachowuje.
Usunięte ID pozostają usunięte niezależnie od czasu offline. Zmiana konta wymaga
jawnej decyzji i zachowuje kopię danych poprzedniego konta.

Odbiór: dwa niezależne urządzenia, Google logowanie/wylogowanie/restart/odświeżenie,
>500 sesji, offline i częściowy błąd, konflikt tytułu, usunięcie po długim offline,
maskowanie >1000 zapisów, zmiana konta, starsze sumy. Emulator testuje adapter
na prawdziwym Firestore, ale nie potwierdza działania produkcyjnego Google OAuth,
restrykcji API, domen ani konfiguracji wdrożonego projektu.

Legacy agregaty bez identyfikatorów sesji nie pozwalają ustalić, czy niezależne
kopie dawnych sum opisują tę samą pracę. Migracja zachowuje źródła i konserwatywnie
scala pokrywające się sumy; odbiór powinien porównać je z eksportami użytkownika,
zwłaszcza przy danych importowanych i zmianach stref czasowych.
