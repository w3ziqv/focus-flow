import type { Mode } from '../types'
import { useI18n } from '../lib/i18n'

interface DialProps {
  mode: Mode
  remainingMs: number
  totalMs: number
  running: boolean
  round: number
  rounds: number
  onToggle: () => void
}

const RADIUS = 150
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ticks(): Array<{ x1: number; y1: number; x2: number; y2: number; major: boolean }> {
  const out = []
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2
    const inner = i % 5 === 0 ? 162 : 166
    const outer = 174
    out.push({
      x1: 180 + Math.cos(angle) * inner,
      y1: 180 + Math.sin(angle) * inner,
      x2: 180 + Math.cos(angle) * outer,
      y2: 180 + Math.sin(angle) * outer,
      major: i % 5 === 0,
    })
  }
  return out
}

const TICKS = ticks()

export function Dial({ mode, remainingMs, totalMs, running, round, rounds, onToggle }: DialProps) {
  const { t } = useI18n()
  const secondsLeft = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const modeLabel = t(mode === 'focus' ? 'mode.focus' : mode === 'short' ? 'mode.short' : 'mode.long')

  const progress = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const accent = mode === 'focus' ? 'var(--color-accent)' : 'var(--color-break)'
  const paused = !running && remainingMs < totalMs && remainingMs > 0
  const announceText = t('timer.aria', { time, mode: modeLabel })
  const complete = remainingMs === 0

  return (
    <div className={'relative mx-auto aspect-square w-full max-w-[400px]' + (complete ? ' dial-complete' : '')}>
      <svg aria-hidden="true" viewBox="0 0 360 360" className="absolute inset-0 h-full w-full -rotate-90">
        {TICKS.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="var(--color-ink-3)"
            strokeWidth={tick.major ? 1.5 : 1}
            opacity={tick.major ? 0.55 : 0.28}
          />
        ))}
        <circle cx="180" cy="180" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="2" />
        <circle
          cx="180"
          cy="180"
          r={RADIUS}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          opacity={paused ? 0.4 : 1}
          style={{ transition: 'stroke-dashoffset 1s linear, opacity 200ms var(--ease-standard)' }}
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-overline text-ink-3">{modeLabel}</span>
        <span className="tnum font-serif text-[clamp(3.25rem,11vw,5rem)] leading-none font-[340] tracking-[-0.02em] text-ink">
          {time}
        </span>
        <span className="text-caption text-ink-2">{t('timer.round', { n: Math.min(round + 1, rounds), total: rounds })}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={t('timer.aria', { time, mode: modeLabel }) + ' ' + t(running ? 'timer.pause' : 'timer.start')}
        className="absolute inset-0 cursor-pointer rounded-full opacity-0 focus-visible:opacity-100 focus-visible:outline-2"
      />
      <span aria-live="polite" className="sr-only">
        {announceText}
      </span>
    </div>
  )
}
