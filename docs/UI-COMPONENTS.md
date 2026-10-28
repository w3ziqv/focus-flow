# Kontrakty reprezentatywnych komponentów

27.10.2026. Źródłem geometrii i kolorów jest [DESIGN.md](DESIGN.md), a kierunku
zależności [UI-ARCHITECTURE.md](UI-ARCHITECTURE.md). Przykłady są TSX wewnątrz
I18nProvider i roota z `accentStyle`. Kontrolki dziedziczą pięć motywów CSS:
light/dark/obsidian/sage/eink; nie mają osobnych kopii stylu dla każdego motywu.

| Komponent | Wygląd / propsy | Zdarzenia i semantyka | Stany / granice |
| --- | --- | --- | --- |
| `ui/PillButton` | primary: fill i on-accent; secondary: card/line; icon: kwadrat 44 px; natywne propsy button i ref | domyślnie type=button, onClick, aria-pressed dla toggle; icon wymaga aria-label | disabled natywne i widoczne; loading dostarcza rodzic z tekstem/status; brak automatycznych zapisów |
| `ui/Switch` | tor + suwak w obszarze 44 px; checked, label, hideLabel, disabled | role=switch, aria-checked i połączona etykieta; Enter/Space natywnie; onChange(!checked) | kontrolowany: rodzic decyduje o zapisie; disabled blokuje zmianę; label pozostaje dostępna przy hideLabel |
| `ui/Modal` | wspólny dialog-panel, title, open, onClose, children; przewijanie wewnątrz ograniczonej wysokości | role=dialog, aria-modal, nazwany h2; Tab/Shift+Tab, Escape, przycisk i backdrop zamykają najwyższy dialog | closed nie montuje treści; loading używa DialogLoading; szkic i błędy należą do formularza; manager stosu blokuje tło i przywraca fokus |
| `ui/SegmentedTabs` | tablica id/label, value, onChange, ariaLabel; przesuwane tło wybranego segmentu | tablist/tab, aria-selected, pojedynczy tabindex=0; klik/strzałki/Home/End wybierają i przenoszą fokus | bez ukrytego stanu wyboru; pusta lista bez dzielenia przez zero; nie submituje formularza; ekran odpowiada za zmianę trybu |
| `features/timer/TaskField` | phase draft/running/done, value, greeting, checklist i callbacks; tytuł pracy przed tarczą | nazwane input, zdarzenia edycji i add/toggle/remove; presety nieosiągalne, gdy zastępuje je wpisane zadanie | stan szkicu microstep pozostaje lokalny; aktywne zadanie/checklista należy do engine; limit 200 znaków zadania, 3 microsteps; offline działa lokalnie |
| `features/timer/Dial` | mode, remainingMs, totalMs, running, round/rounds, opcjonalne cele/celebration; Fraunces, koncentryczny SVG i akcent fazy | onToggle; tekstowy stan timera i round; dźwięk/animacja są dodatkiem, nigdy jedynym sygnałem | brak własnego zegara/persystencji/network; koniec określa engine; reduced motion i eink; renderuje się podczas ticku, closed FocusOverlay nie montuje drugiej tarczy |
| `features/sync/SyncStatusIndicator` | onClick, className; dyskretny tekst i ikona przy stopce | nazwany button, aria-live=polite; otwiera szczegóły, nie rozpoczyna automatycznie logowania | local-only / syncing / synced+pending / offline-error; navigator offline wpływa tylko na połączone konto; słucha zdarzeń stanu niezależnie od memo; brak surowych błędów |

```tsx
<PillButton variant="primary" disabled={busy} onClick={start}>
  {busy ? t('common.loading') : t('timer.start')}
</PillButton>
<PillButton variant="icon" aria-label={t('settings.timer')} onClick={openTimer}>
  <Settings2 aria-hidden="true" size={16} />
</PillButton>
<Switch label={t('sync.mask')} checked={mask} disabled={busy} onChange={setMask} />
<Modal open={open} title={t('settings.timer')} onClose={close}>
  <TimerSettingsForm draft={draft} onSave={save} />
</Modal>
<SegmentedTabs tabs={modes} value={mode} onChange={switchMode} ariaLabel={t('timer.modes')} />
<TaskField phase={running ? 'running' : 'draft'} value={task} greeting="" onChange={setTask} />
<Dial mode={mode} remainingMs={remainingMs} totalMs={totalMs} running={running}
  round={round} rounds={settings.rounds} onToggle={toggle} />
<SyncStatusIndicator onClick={openCloud} />
```

`TimerSettingsForm` powyżej oznacza treść formularza konsumenta, nie dodatkowy
eksport biblioteki. W produkcji formularz jest częścią TimerSettingsModal.
Loading nie dotyczy samego Dial/TaskField; użycie sztucznego spinnera przy każdym
tyknięciu byłoby błędem kontraktu. Empty statystyk oferuje pierwszą sesję,
brak własnych nagrań nie blokuje dźwięków wbudowanych. CloudSyncModal odróżnia
brak konfiguracji (disabled), brak trwałego keyringu, offline i błąd allowlisty.

Dowody wizualne powstają w `test-artifacts/ui-architecture/{before,after}/` oraz
raporcie a11y. Pliki są ignorowane przez Git. Testy komponentów obejmują fokus
i usunięcie rodzica, klawiaturę tabs, TaskField oraz statusy sync; browser pokrywa
rzeczywiste fokusowanie, zachowanie szkicu przy resize i propagację preferencji.
Automatyzacja Chromium nie potwierdza fizycznego telefonu, screen readera ani OS.
