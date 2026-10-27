# ADR-0011: Własność UI i granice renderowania

Status: Accepted. Data: 2026-10-27. Uzupełnia ADR-0010.

## Kontekst

Shell łączył timer, feedback, audio i sześć niezależnych flag dialogów.
`components/` mieszał prymitywy z modułami funkcji. Pomiar DevTools w trzech
próbach wykazał około 8 renderów / 2 s nawigacji, pola zadania, statusu sync,
otwartych ustawień i audio wywołanych wyłącznie tickami. StatsView był już
odizolowany. Zagnieżdżenie dialogów wymaga zachowania szkicu i fokusu rodzica.

## Decyzja

Wydzielamy `ui/`, `features/`, `views/` i `app/` z kierunkiem zależności
egzekwowanym przez ESLint również dla lazy importów. Adaptery pozostają w lib,
czyste reguły w domain. AppDialogs dostaje stabilne wycinki ustawień i polecenia,
nie engine. Memo obejmuje granice wykazane pomiarem, bez własnych komparatorów.
Audio i feedback otrzymują osobne hooki z jednym właścicielem subsystemu.
Stos dialogów zachowuje zamontowanych rodziców, manager fokusu wyprowadza
inertność z aktualnej najwyższej warstwy, również przy zmianie lazy fallback.

## Alternatywy i konsekwencje

Globalny store UI wymagałby nowego sposobu subskrypcji i duplikował lokalny stan
formularzy. Przepisanie engine na framework-free store przekracza wykazany
problem renderowania. Samo memo na dialogach z inline callbackami nie tworzy
stabilnej granicy. Wybrany podział nie dodaje zależności runtime ani migracji
danych. Koszt to więcej jawnych propsów i konieczność utrzymania ich stabilności;
testy zmiany danych/języka/audio/sync chronią przed ukryciem poprawnych aktualizacji.

Mapa, tabela stanu i zasady: [UI-ARCHITECTURE](../UI-ARCHITECTURE.md).
Kontrakty: [UI-COMPONENTS](../UI-COMPONENTS.md). Pomiary i ograniczenia:
[raport etapu](../modernization/2026-10-27-ui.md).
