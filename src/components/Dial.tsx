import type { GoalSettings, Mode } from '../types'
import { useI18n } from '../lib/i18n'
import type { TranslationKey } from '../lib/translations'

export interface DialProps {
  mode: Mode
  remainingMs: number
  totalMs: number
  running: boolean
  round: number
  rounds: number
  onToggle: () => void
  /** Today's accumulated focus minutes. Defaults to 0. */
  todayMinutes?: number
  /** Daily focus goal settings. */
  goalSettings?: GoalSettings
  /** Direct override for daily target minutes (0 = disabled, max 720). */
  dailyTargetMinutes?: number
  /** Direct override for whether daily goal ring is enabled. */
  goalEnabled?: boolean
  /** Whether the calm 3-second goal completion checkmark indicator is visible. */
  goalCelebration?: boolean
}

const RADIUS: number = 150
const CIRCUMFERENCE: number = 2 * Math.PI * RADIUS

/** Outer perimeter goal ring radius positioned outside radial ticks (outer = 174px) within 360x360 viewBox */
export const GOAL_RADIUS: number = 175
export const GOAL_CIRCUMFERENCE: number = 2 * Math.PI * GOAL_RADIUS

interface DialTick {
  x1: number
  y1: number
  x2: number
  y2: number
  major: boolean
}

function ticks(): DialTick[] {
  const out: DialTick[] = []
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

const TICKS: DialTick[] = ticks()

export function Dial({
  mode,
  remainingMs,
  totalMs,
  running,
  round,
  rounds,
  onToggle,
  todayMinutes = 0,
  goalSettings,
  dailyTargetMinutes,
  goalEnabled,
  goalCelebration = false,
}: DialProps): React.JSX.Element {
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
  const complete = remainingMs === 0

  // Goal ring logic
  const targetMinutes = Math.max(0, Math.min(720, dailyTargetMinutes ?? goalSettings?.dailyTargetMinutes ?? 0))
  const isEnabled = goalEnabled ?? goalSettings?.enabled ?? false
  const showGoalRing = isEnabled && targetMinutes > 0

  const safeTodayMinutes = typeof todayMinutes === 'number' && Number.isFinite(todayMinutes) ? Math.max(0, todayMinutes) : 0
  const goalProgress = targetMinutes > 0 ? Math.max(0, Math.min(1, safeTodayMinutes / targetMinutes)) : 0
  const goalDashOffset = GOAL_CIRCUMFERENCE * (1 - goalProgress)

  // Safe translation helper allowing graceful fallback
  const translateSafe = (key: string, fallback: string, vars?: Record<string, string | number>): string => {
    try {
      const translated = t(key as TranslationKey, vars)
      return translated && translated !== key ? translated : fallback
    } catch {
      return fallback
    }
  }

  const goalAriaLabel = showGoalRing
    ? translateSafe(
        'goals.ringAria',
        `Goal: ${Math.round(safeTodayMinutes)}/${targetMinutes}m (${Math.round(goalProgress * 100)}%)`,
        {
          current: Math.round(safeTodayMinutes),
          target: targetMinutes,
          percent: Math.round(goalProgress * 100),
        },
      )
    : ''

  const celebrationAria = translateSafe(
    'goals.reachedAria',
    `Daily focus goal reached: ${Math.round(safeTodayMinutes || targetMinutes)} minutes completed.`,
    {
      minutes: Math.round(safeTodayMinutes || targetMinutes),
    },
  )

  const announceText = goalCelebration
    ? celebrationAria
    : t('timer.aria', { time, mode: modeLabel }) + (goalAriaLabel ? ` ${goalAriaLabel}` : '')

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

        {/* Concentric Hairline Outer Perimeter Goal Ring (Tier 0 & Tier 2) */}
        {showGoalRing && (
          <g data-testid="dial-goal-ring">
            {/* Subtle hairline background track */}
            <circle
              data-testid="dial-goal-track"
              cx="180"
              cy="180"
              r={GOAL_RADIUS}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Hairline progress arc */}
            <circle
              data-testid="dial-goal-arc"
              cx="180"
              cy="180"
              r={GOAL_RADIUS}
              fill="none"
              stroke="var(--accent-focus, var(--color-accent))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={GOAL_CIRCUMFERENCE}
              strokeDashoffset={goalDashOffset}
              style={{
                transition: 'stroke-dashoffset 600ms var(--ease-emphasis), opacity 200ms var(--ease-standard)',
              }}
            />
          </g>
        )}

        {/* Main Countdown Timer Track & Progress Arc */}
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

      {/* Standard Center Digit Stack (Smooth 120ms fade when goalCelebration activates) */}
      <div
        aria-hidden="true"
        data-testid="dial-center-digits"
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all duration-120 ease-[var(--ease-micro)] ${
          goalCelebration ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <span className="text-overline text-ink-3">{modeLabel}</span>
        <span className="tnum font-serif text-[clamp(3.25rem,11vw,5rem)] leading-none font-[340] tracking-[-0.02em] text-ink">
          {time}
        </span>
        <span className="text-caption text-ink-2">{t('timer.round', { n: Math.min(round + 1, rounds), total: rounds })}</span>
      </div>

      {/* Calm 3-Second Goal Completion Indicator (Smooth 120ms fade-in, serene checkmark, zero confetti/modals) */}
      <div
        aria-hidden="true"
        data-testid="dial-goal-celebration"
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-120 ease-[var(--ease-micro)] ${
          goalCelebration ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-120 ease-[var(--ease-micro)]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="text-overline text-ink tracking-[0.09em] font-medium">
          {translateSafe('goals.completed', 'DAILY GOAL')}
        </span>
        <span className="text-caption text-ink-2">
          {showGoalRing
            ? `${Math.round(safeTodayMinutes)} / ${targetMinutes} min`
            : translateSafe('goals.celebrationSubtitle', 'Focus Momentum')}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={
          (goalCelebration ? `${celebrationAria}. ` : '') +
          t('timer.aria', { time, mode: modeLabel }) +
          ' ' +
          t(running ? 'timer.pause' : 'timer.start')
        }
        className="absolute inset-0 cursor-pointer rounded-full opacity-0 focus-visible:opacity-100 focus-visible:outline-2"
      />
      <span aria-live="polite" className="sr-only">
        {announceText}
      </span>
    </div>
  )
}
