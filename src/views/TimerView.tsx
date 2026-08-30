import { randomBreakTip } from '../lib/breakTips'
import { taskGreeting } from '../lib/placeholders'
import { useI18n } from '../lib/i18n'
import { Dial } from '../components/Dial'
import { SegmentedTabs } from '../components/SegmentedTabs'
import { TaskField } from '../components/TaskField'
import { PillButton } from '../components/PillButton'
import { SoundChipRow } from '../components/SoundChipRow'
import type { AmbientSound, CustomSound, Mode } from '../types'
import type { TimerEngine } from '../lib/timer'
import { useMemo } from 'react'
import { Maximize2, Pause, Play, RotateCcw, Settings2 } from 'lucide-react'

interface TimerViewProps {
  engine: TimerEngine
  ambient: AmbientSound
  sounds: CustomSound[]
  soundMessage: string | null
  volume: number
  onAmbientChange: (sound: AmbientSound) => void
  onAddSoundFile: (file: File) => void
  onRemoveSound: (id: string) => void
  onVolumeChange: (volume: number) => void
  onOpenSettings: () => void
  onEnterFocus: () => void
  showGreeting: boolean
}

export function TimerView({
  engine,
  ambient,
  sounds,
  soundMessage,
  volume,
  onAmbientChange,
  onAddSoundFile,
  onRemoveSound,
  onVolumeChange,
  onOpenSettings,
  onEnterFocus,
  showGreeting,
}: TimerViewProps) {
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

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pt-20 pb-16 max-md:pt-28">
      <p aria-hidden="true" className="mb-8 text-center text-overline text-ink-3 max-sm:block sm:hidden">
        FOCUS FLOW
      </p>

      <div className="fade-up" style={{ animationDelay: '0ms' }}>
        <TaskField phase={taskPhase} value={engine.task} greeting={greeting ?? ''} onChange={engine.setTask} />
      </div>

      <div className="fade-up mt-8" style={{ animationDelay: '40ms' }}>
        <SegmentedTabs tabs={tabs} value={engine.mode} onChange={engine.switchMode} ariaLabel={t('timer.modes')} />
      </div>

      <div className="fade-up mt-8" style={{ animationDelay: '80ms' }}>
        <Dial
          mode={engine.mode}
          remainingMs={engine.remainingMs}
          totalMs={engine.totalMs}
          running={engine.running}
          round={engine.round}
          rounds={engine.settings.rounds}
          onToggle={engine.toggle}
        />
      </div>

      <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '120ms' }}>
        <PillButton variant="primary" className="min-w-[132px]" onClick={engine.toggle}>
          <StartIcon size={18} aria-hidden="true" />
          {engine.running ? t('timer.pause') : t('timer.start')}
        </PillButton>
        <PillButton variant="secondary" onClick={engine.reset}>
          <RotateCcw size={15} aria-hidden="true" />
          {t('timer.reset')}
        </PillButton>
        <PillButton variant="icon" onClick={onOpenSettings} aria-label={t('settings.timer')} title={t('settings.timer')}>
          <Settings2 size={18} aria-hidden="true" />
        </PillButton>
      </div>

      <p className="mt-4 hidden text-center text-[12px] text-ink-3 sm:block">{t('timer.shortcuts')}</p>

      <button
        type="button"
        onClick={onEnterFocus}
        className="mx-auto mt-6 flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-caption text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-[var(--ac-strong)]"
      >
        <Maximize2 size={14} aria-hidden="true" />
        {t('focus.enter')}
      </button>

      <div className="fade-up mt-10" style={{ animationDelay: '160ms' }}>
        <SoundChipRow
          current={ambient}
          sounds={sounds}
          message={soundMessage}
          volume={volume}
          onChange={onAmbientChange}
          onAddFile={onAddSoundFile}
          onRemove={onRemoveSound}
          onVolumeChange={onVolumeChange}
        />
      </div>

      {breakTip !== null && (
        <div className="fade-up mt-10 rounded-2xl border border-line bg-card p-5">
          <p className="text-overline text-ink-3">{t('break.tip')}</p>
          <p className="mt-2 font-serif text-[1.125rem] font-[500] text-ink">
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
