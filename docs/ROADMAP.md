# Focus Flow — Product Roadmap

Ten dokument zawiera plan rozwoju aplikacji **Focus Flow** na kolejne wersje. Każda sekcja jest przygotowana jako gotowa specyfikacja wymagań dla kolejnych iteracji i agentów AI.

```
v2.1 (Zadania & Filtry) ──► v2.2 (Dźwięki & Mikser) ──► v2.3 (Nawyki & Zen-Grywalizacja) ──► v2.4 (Integracje) ──► v3.0 (Tauri Desktop & Tray)
```

---

## 📌 Wersja 2.1 — Zadania i Zarządzanie Historią (*Task Flow & Organization*)
*Skupienie na lepszej organizacji pracy podczas codziennych sesji.*

* **Wyszukiwanie i filtry w Statystykach**:
  * Pasek wyszukiwania w Dzienniku sesji (np. wpisujesz *„Projekt X”* i filtrujesz historię po nazwie zadania).
  * Filtrowanie według miesięcy i zakresów dat.
* **Mikro-podzadania w sesji (*Session Checklist*)**:
  * Oprócz głównego celu sesji możliwość dodania 2–3 małych punktów do odhaczenia (np. Główny cel: *„Napisać rozdział 1”*, podpunkty: *[x] Wstęp, [ ] Teoria, [ ] Wnioski*).
* **Szybkie szablony zadań (*Quick Task Presets*)**:
  * Podpowiedzi pod polem zadania (np. *„Głęboka praca”*, *„Refaktoryzacja”*, *„Nauka”*, *„Pisanie”*, *„Inbox Zero”*) pozwalające wystartować sesję jednym kliknięciem.
* **Zarządzanie wpisami w Dzienniku**:
  * Możliwość edycji nazwy zadania lub usunięcia omyłkowo dodanej sesji z historii.

---

## 🎧 Wersja 2.2 — Dźwięki i Imersja (*Soundscapes & Audio Mixer*)
*Podniesienie wrażeń dźwiękowych do poziomu zaawansowanych generatorów skupienia.*

* **Mikser dźwięków otoczenia (*Sound Layering*)**:
  * Możliwość miksowania kilku dźwięków naraz (np. 60% Deszcz + 30% Ognisko + 20% Szum brązowy) z niezależnymi suwakami głośności.
* **Fale Binauralne i Dźwięki Generatywne (*Brainwave Entrainment*)**:
  * Generowane bezpośrednio przez Web Audio API fale alfa (8–12 Hz dla skupienia i nauki) oraz fale theta (4–8 Hz dla medytacji i regeneracji).
* **Płynne wyciszanie (*Audio Fade-in / Fade-out*)**:
  * Dźwięk łagodnie narasta przez pierwsze 3 sekundy sesji i delikatnie gaśnie przy przejściu w przerwę, co zapobiega nagłemu ucięciu audio.
* **Ambient w tle podczas przerw**:
  * Opcja automatycznego przełączania na inny, spokojniejszy dźwięk podczas przerw (np. ptaki / potok).

---

## 🏆 Wersja 2.3 — Budowanie Nawyków i Delikatna Grywalizacja (*Zen Habits*)
*Motywacja do regularnej pracy bez krzykliwych powiadomień i spamu.*

* **Konfigurowalny Cel Dzienny (*Daily Focus Goal*)**:
  * Użytkownik ustala swój dzienny cel (np. *„Chcę pracować w skupieniu 100 minut dziennie”*).
  * Wskaźnik postępu i powiadomienie o osiągnięciu dziennego celu.
* **Oznaki Spokoju (*Zen Badges / Milestones*)**:
  * Minimalistyczne, eleganckie osiągnięcia (np. *„Pierwsza seria 7 dni”*, *„100 godzin głębokiej pracy”*, *„Mistrz porannego skupienia”*).
* **Karta Podsumowania Tygodnia (*Weekly Share Card*)**:
  * Generowanie estetycznego obrazka PNG w ciepłych barwach z podsumowaniem tygodnia (liczba sesji, wykres, ulubione zadania) – gotowe do wklejenia do notatek (Obsidian / Notion) lub zapisania w galerii.

---

## 🔗 Wersja 2.4 — Eksport i Integracje (*Ecosystem & Integrations*)
*Łączenie Focus Flow z codziennym środowiskiem pracy.*

* **Eksport do Markdown i CSV**:
  * Pobranie historii sesji jako plik `.csv` (do Excela) lub `.md` z tabelą i podsumowaniem (gotowy do wklejenia do Notion, Obsidian, Roam).
* **Synchronizacja z Kalendarzem (iCal feed)**:
  * Generowanie lokalnego pliku `.ics` rejestrującego zrealizowane bloki pracy w kalendarzu.
* **Status skupienia (Webhooks / Discord / Slack)**:
  * Opcjonalna wysyłka prostego webhooka zmieniającego status komunikatora na *„W trakcie skupienia 🎯”*.

---

## 🖥️ Wersja 3.0 — Aplikacja Natywna Desktop & Tray (*Tauri 2*)
*Przekształcenie webowego Focus Flow w pełnoprawną aplikację desktopową (zgodnie z ADR-006).*

* **Lekki wrapper Tauri 2 (Windows / macOS / Linux)**:
  * Instalator ważący poniżej 8 MB i zużywający zaledwie 30–50 MB pamięci RAM (bez Electrona).
* **Mini-timer w Trayu / Pasku zadań**:
  * Zegarek odliczający czas w prawym dolnym rogu ekranu (obok zegara Windows / paska menu macOS) z możliwością pauzowania jednym kliknięciem.
* **Globalne skróty klawiszowe (Global Hotkeys)**:
  * Startowanie i pauzowanie timera z poziomu dowolnego programu (np. `Ctrl + Alt + Space` w trakcie pracy w IDE).
* **Tryb Always-on-Top / Picture-in-Picture**:
  * Pływające, miniaturowe okienko timera zawsze na wierzchu innych aplikacji.
