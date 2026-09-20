import { randomBreakTip } from '../lib/breakTips'
import { taskGreeting } from '../lib/placeholders'
import { useI18n } from '../lib/i18n'
import { Dial } from '../components/Dial'
import { SegmentedTabs } from '../components/SegmentedTabs'
import { TaskField } from '../components/TaskField'
import { PillButton } from '../components/PillButton'
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
    <div className="mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-[560px] flex-col justify-center px-4 pt-2 pb-24 sm:min-h-0 sm:pt-10 sm:pb-20 md:pt-16">
      <p aria-hidden="true" className="mb-3 text-center text-overline text-ink-3 max-sm:block sm:hidden">
        FOCUS FLOW
      </p>

      <div className="fade-up shrink-0" style={{ animationDelay: '0ms' }}>
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

      <div className="fade-up mt-3 shrink-0 sm:mt-6" style={{ animationDelay: '40ms' }}>
        <SegmentedTabs tabs={tabs} value={engine.mode} onChange={engine.switchMode} ariaLabel={t('timer.modes')} />
      </div>

      <div className="fade-up my-auto py-1 sm:my-0 sm:mt-6 sm:py-0" style={{ animationDelay: '80ms' }}>
        <div className="mx-auto aspect-square w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px]">
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
      <div className="fade-up mt-4 sm:mt-8 flex shrink-0 flex-col items-center gap-3" style={{ animationDelay: '120ms' }}>
        {/* Primary Execution Controls */}
        <div className="flex items-center justify-center gap-3">
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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-caption text-ink-2 shadow-halo transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-caption text-ink-2 shadow-halo transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Maximize2 size={14} aria-hidden="true" />
            <span>{t('focus.enter')}</span>
          </button>

          <PillButton
            variant="icon"
            onClick={onOpenSettings}
            aria-label={t('settings.timer')}
            title={t('settings.timer')}
            className="size-10 rounded-full border border-line bg-card shadow-halo"
          >
            <Settings2 size={16} aria-hidden="true" />
          </PillButton>
        </div>

        <p className="mt-1 hidden text-center text-[12px] text-ink-3 sm:block">{t('timer.shortcuts')}</p>
      </div>

      {breakTip !== null && (
        <div className="fade-up mt-4 shrink-0 rounded-2xl border border-line bg-card p-4 text-center sm:mt-8 sm:p-5">
          <p className="text-overline text-ink-3">{t('break.tip')}</p>
          <p className="mt-1 font-serif text-[1.125rem] font-[500] text-ink">
            {lang === 'pl' ? breakTip.titlePl : breakTip.titleEn}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-2">
            {lang === 'pl' ? breakTip.descPl : breakTip.descEn}
          </p>
        </div>
      )}
    </div>
  )
}
