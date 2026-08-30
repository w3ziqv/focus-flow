import { useMemo } from 'react'
import { Maximize2, Pause, Play, RotateCcw, Settings2 } from 'lucide-react'
import type { AmbientSound, CustomSound, Mode } from '../types'
import type { TimerEngine } from '../lib/timer'
import { last7Days, sumMinutes } from '../lib/stats'
import { randomBreakTip } from '../lib/tips'
import { taskPlaceholder } from '../lib/placeholders'
import { useI18n } from '../lib/i18n'
import { Dial } from '../components/Dial'
import { SegmentedTabs } from '../components/SegmentedTabs'
import { TaskField } from '../components/TaskField'
import { PillButton } from '../components/PillButton'
import { SoundChipRow } from '../components/SoundChipRow'
import { StatCard } from '../components/StatCard'
import { WeekChart } from '../components/WeekChart'

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
}: TimerViewProps) {
  const { t, lang } = useI18n()
  const breakTip = useMemo(
    () => (engine.mode === 'focus' ? null : randomBreakTip(lang)),
    [engine.mode, lang],
  )
  const placeholder = useMemo(() => taskPlaceholder(lang), [lang])

  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'focus', label: t('mode.focus') },
    { id: 'short', label: t('mode.short') },
    { id: 'long', label: t('mode.long') },
  ]

  const taskPhase = engine.running ? 'running' : engine.taskDone ? 'done' : 'draft'
  const chartDays = last7Days(engine.stats, lang)
  const StartIcon = engine.running ? Pause : Play

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pt-24 pb-16 max-md:pt-20">
      <div className="fade-up" style={{ animationDelay: '0ms' }}>
        <TaskField phase={taskPhase} value={engine.task} placeholder={placeholder} onChange={engine.setTask} />
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
        <PillButton variant="icon" onClick={onOpenSettings} aria-label={t('timer.settings')} title={t('timer.settings')}>
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
          <p className="mt-2 font-serif text-[1.125rem] font-[500] text-ink">{breakTip.title}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{breakTip.desc}</p>
          <p className="mt-2 text-[12px] text-ink-3">
            {t('tip.source')}: {breakTip.source}
          </p>
        </div>
      )}

      <div className="fade-up mt-14 max-w-[760px] sm:-mx-[100px]" style={{ animationDelay: '200ms' }}>
        <div className="grid grid-cols-2 gap-y-8 sm:flex sm:items-start">
          <StatCard value={engine.stats.today} label={t('stat.today')} emphasized />
          <StatCard value={engine.stats.week} label={t('stat.week')} />
          <StatCard value={engine.stats.streak} label={t('stat.streak')} />
          <StatCard value={engine.stats.minutes} label={t('stat.minutes')} />
        </div>
        <div className="mt-10">
          <WeekChart days={chartDays} totalMinutes={sumMinutes(chartDays)} />
        </div>
      </div>
    </div>
  )
}
