import { randomBreakTip } from '../lib/breakTips'
import { taskGreeting } from '../lib/placeholders'
import { useI18n } from '../lib/i18n'
import { Dial } from '../features/timer/Dial'
import { SegmentedTabs } from '../ui/SegmentedTabs'
import { TaskField } from '../features/timer/TaskField'
import { PillButton } from '../ui/PillButton'
import type { AmbientSound, BinauralMode, Mode } from '../types'
import type { TimerEngine } from '../lib/timer'
import { useMemo } from 'react'
import { Maximize2, Pause, Play, RotateCcw, Settings2, Volume2 } from 'lucide-react'

interface TimerViewProps {
  engine: TimerEngine
  ambient: AmbientSound
  binaural?: BinauralMode
  onOpenSettings: () => void
  onOpenSoundSettings: () => void
  onEnterFocus: () => void
  showGreeting: boolean
}

export function TimerView({
  engine,
  ambient,
  binaural = 'off',
  onOpenSettings,
  onOpenSoundSettings,
  onEnterFocus,
  showGreeting,
}: TimerViewProps): React.JSX.Element {
  const { t, lang } = useI18n()
  const breakTip = useMemo(() => (engine.mode === 'focus' ? null : randomBreakTip()), [engine.mode])
  const greeting = useMemo(() => (showGreeting ? taskGreeting(lang) : null), [lang, showGreeting])

  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'focus', label: t('mode.focus') },
    { id: 'short', label: t('mode.short') },
    { id: 'long', label: t('mode.long') },
  ]

  const taskPhase = engine.running ? 'running' : engine.taskDone ? 'done' : 'draft'
  const StartIcon = engine.running ? Pause : Play

  const todayKey = new Date().toDateString()
  const todayMinutes = engine.stats.history[todayKey] ?? 0
  const isSoundActive = ambient !== 'none' || (binaural && binaural !== 'off')

  return (
    <div className="timer-workspace mx-auto flex w-full max-w-[560px] flex-col px-4">
      <h1 className="sr-only">{t('app.name')} — {t('nav.timer')}</h1>

      <div className="shrink-0">
        <TaskField
          phase={taskPhase}
          value={engine.task}
          greeting={greeting ?? ''}
          onChange={engine.setTask}
          checklist={engine.checklist}
          onChecklistChange={engine.setChecklist}
          onAddChecklistItem={engine.addChecklistItem}
          onToggleChecklistItem={engine.toggleChecklistItem}
          onRemoveChecklistItem={engine.removeChecklistItem}
        />
      </div>

      <div className="mt-3 shrink-0 sm:mt-4">
        <SegmentedTabs tabs={tabs} value={engine.mode} onChange={engine.switchMode} ariaLabel={t('timer.modes')} />
      </div>

      <div className="mt-4 py-1">
        <div className="timer-dial mx-auto aspect-square w-full max-w-[320px] sm:max-w-[360px]">
          <Dial
            mode={engine.mode}
            remainingMs={engine.remainingMs}
            totalMs={engine.totalMs}
            running={engine.running}
            round={engine.round}
            rounds={engine.settings.rounds}
            onToggle={engine.toggle}
            goalEnabled={engine.goals.enabled}
            todayMinutes={todayMinutes}
            dailyTargetMinutes={engine.goals.dailyTargetMinutes}
            goalCelebration={engine.goalCelebration}
          />
        </div>
      </div>

      {/* Unified Command Dock */}
      <div className="mt-4 flex shrink-0 flex-col items-center gap-3">
        {/* Primary Execution Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PillButton variant="primary" className="min-w-[136px]" onClick={engine.toggle}>
            <StartIcon size={18} aria-hidden="true" />
            {engine.running ? t('timer.pause') : t('timer.start')}
          </PillButton>
          <PillButton variant="secondary" onClick={engine.reset}>
            <RotateCcw size={15} aria-hidden="true" />
            {t('timer.reset')}
          </PillButton>
        </div>

        {/* Secondary Quiet Utilities */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onOpenSoundSettings}
            aria-label={t('sound.settings')}
            className="inline-flex min-h-target items-center gap-1.5 rounded-control px-3.5 py-1.5 text-caption text-ink-2 transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink active:scale-95"
          >
            <Volume2 size={15} aria-hidden="true" />
            <span>{t('sound.settings')}</span>
            {isSoundActive && (
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--ac)]" />
            )}
          </button>

          <button
            type="button"
            onClick={onEnterFocus}
            aria-label={t('focus.enter')}
            className="inline-flex min-h-target items-center gap-1.5 rounded-control px-3.5 py-1.5 text-caption text-ink-2 transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink active:scale-95"
          >
            <Maximize2 size={14} aria-hidden="true" />
            <span>{t('focus.enter')}</span>
          </button>

          <PillButton variant="secondary" onClick={onOpenSettings} className="gap-1.5 px-3.5 py-1.5 text-caption">
            <Settings2 size={16} aria-hidden="true" /><span>{t('settings.timer')}</span>
          </PillButton>
        </div>

        <p className="mt-1 hidden text-center text-[12px] text-ink-3 sm:block">{t('timer.shortcuts')}</p>
      </div>

      {breakTip !== null && (
        <div className="mt-6 shrink-0 rounded-panel bg-card p-5 text-center">
          <p className="text-overline text-ink-3">{t('break.tip')}</p>
          <p className="mt-1 font-serif text-[1.125rem] font-[500] text-ink">
            {breakTip.title[lang]}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
            {breakTip.description[lang]}
          </p>
        </div>
      )}
    </div>
  )
}
