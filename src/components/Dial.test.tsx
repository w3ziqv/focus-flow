import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '../lib/i18n'
import { Dial, GOAL_CIRCUMFERENCE, GOAL_RADIUS } from './Dial'
import type { DialProps } from './Dial'

describe('Dial Component — Hairline Goal Ring & Goal Celebration Indicator', () => {
  const defaultProps: DialProps = {
    mode: 'focus',
    remainingMs: 25 * 60 * 1000,
    totalMs: 25 * 60 * 1000,
    running: false,
    round: 0,
    rounds: 4,
    onToggle: vi.fn(),
  }

  const renderDial = (props: Partial<DialProps> = {}) => {
    return render(
      <I18nProvider>
        <Dial {...defaultProps} {...props} />
      </I18nProvider>,
    )
  }

  describe('Concentric Hairline Goal Ring Geometry & Visibility', () => {
    it('verifies GOAL_RADIUS is 175 and GOAL_CIRCUMFERENCE is approx 1099.6px', () => {
      expect(GOAL_RADIUS).toBe(175)
      expect(Math.round(GOAL_CIRCUMFERENCE * 10) / 10).toBe(1099.6)
      expect(GOAL_CIRCUMFERENCE).toBeCloseTo(2 * Math.PI * 175, 4)
    })

    it('does not render the outer goal ring when goals are not configured or disabled', () => {
      renderDial({ goalEnabled: false, dailyTargetMinutes: 60 })
      expect(screen.queryByTestId('dial-goal-ring')).toBeNull()
      expect(screen.queryByTestId('dial-goal-track')).toBeNull()
      expect(screen.queryByTestId('dial-goal-arc')).toBeNull()
    })

    it('does not render the outer goal ring when daily target is 0 minutes', () => {
      renderDial({ goalEnabled: true, dailyTargetMinutes: 0 })
      expect(screen.queryByTestId('dial-goal-ring')).toBeNull()
    })

    it('renders outer perimeter goal ring with exact track (1px) and progress arc (1.5px) when enabled', () => {
      renderDial({
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: 25,
      })

      const ringGroup = screen.getByTestId('dial-goal-ring')
      expect(ringGroup).toBeDefined()

      const track = screen.getByTestId('dial-goal-track')
      expect(track.getAttribute('r')).toBe('175')
      expect(track.getAttribute('cx')).toBe('180')
      expect(track.getAttribute('cy')).toBe('180')
      expect(track.getAttribute('stroke-width')).toBe('1')
      expect(track.getAttribute('stroke')).toBe('var(--color-line)')

      const arc = screen.getByTestId('dial-goal-arc')
      expect(arc.getAttribute('r')).toBe('175')
      expect(arc.getAttribute('cx')).toBe('180')
      expect(arc.getAttribute('cy')).toBe('180')
      expect(arc.getAttribute('stroke-width')).toBe('1.5')
      expect(arc.getAttribute('stroke-linecap')).toBe('round')
      expect(arc.getAttribute('stroke-dasharray')).toBe(String(GOAL_CIRCUMFERENCE))
    })

    it('correctly respects goalSettings object prop', () => {
      renderDial({
        goalSettings: {
          enabled: true,
          dailyTargetMinutes: 120,
        },
        todayMinutes: 60,
      })

      expect(screen.getByTestId('dial-goal-ring')).toBeDefined()
      const arc = screen.getByTestId('dial-goal-arc')
      const offset = Number(arc.getAttribute('stroke-dashoffset'))
      // 60 / 120 = 50% progress -> dashoffset = 50% of circumference
      expect(offset).toBeCloseTo(GOAL_CIRCUMFERENCE * 0.5, 2)
    })
  })

  describe('Smooth SVG Stroke-Dashoffset Progression Calculation', () => {
    it('calculates full offset (0% progress) when todayMinutes is 0', () => {
      renderDial({
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: 0,
      })

      const arc = screen.getByTestId('dial-goal-arc')
      const offset = Number(arc.getAttribute('stroke-dashoffset'))
      expect(offset).toBeCloseTo(GOAL_CIRCUMFERENCE, 2)
    })

    it('calculates 50% offset when todayMinutes is half of target', () => {
      renderDial({
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: 50,
      })

      const arc = screen.getByTestId('dial-goal-arc')
      const offset = Number(arc.getAttribute('stroke-dashoffset'))
      expect(offset).toBeCloseTo(GOAL_CIRCUMFERENCE * 0.5, 2)
    })

    it('calculates 0 offset (100% full circle) when target is fully met', () => {
      renderDial({
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: 100,
      })

      const arc = screen.getByTestId('dial-goal-arc')
      const offset = Number(arc.getAttribute('stroke-dashoffset'))
      expect(offset).toBeCloseTo(0, 2)
    })

    it('clamps offset to 0 when todayMinutes exceeds dailyTargetMinutes', () => {
      renderDial({
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: 180,
      })

      const arc = screen.getByTestId('dial-goal-arc')
      const offset = Number(arc.getAttribute('stroke-dashoffset'))
      expect(offset).toBeCloseTo(0, 2)
    })

    it('robustly handles invalid/negative todayMinutes and NaN without crashing', () => {
      renderDial({
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: -25 as unknown as number,
      })

      const arc = screen.getByTestId('dial-goal-arc')
      const offset = Number(arc.getAttribute('stroke-dashoffset'))
      expect(offset).toBeCloseTo(GOAL_CIRCUMFERENCE, 2)
    })
  })

  describe('Calm Goal Completion Indicator (3-Second Center State)', () => {
    it('shows normal digits and hides celebration checkmark when goalCelebration is false', () => {
      renderDial({
        goalCelebration: false,
      })

      const digits = screen.getByTestId('dial-center-digits')
      expect(digits.className).toContain('opacity-100')
      expect(digits.className).toContain('scale-100')

      const celebration = screen.getByTestId('dial-goal-celebration')
      expect(celebration.className).toContain('opacity-0')
      expect(celebration.className).toContain('pointer-events-none')
    })

    it('transitions digits to opacity-0 and shows serene checkmark with calm 120ms transition when goalCelebration is true', () => {
      renderDial({
        goalCelebration: true,
        goalEnabled: true,
        dailyTargetMinutes: 100,
        todayMinutes: 100,
      })

      const digits = screen.getByTestId('dial-center-digits')
      expect(digits.className).toContain('opacity-0')
      expect(digits.className).toContain('scale-95')

      const celebration = screen.getByTestId('dial-goal-celebration')
      expect(celebration.className).toContain('opacity-100')
      expect(celebration.className).toContain('scale-100')
      expect(celebration.className).toContain('duration-120')

      // Verifies checkmark vector
      const polyline = celebration.querySelector('polyline')
      expect(polyline).not.toBeNull()
      expect(polyline?.getAttribute('points')).toBe('20 6 9 17 4 12')
    })

    it('preserves non-blocking dial overlay clickability during celebration', () => {
      const onToggle = vi.fn()
      renderDial({
        goalCelebration: true,
        onToggle,
      })

      const button = screen.getByRole('button', { hidden: true })
      fireEvent.click(button)
      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })
})
