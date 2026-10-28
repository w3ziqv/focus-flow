import type { Lang } from '../domain/language'
import { LANGUAGE_META, localeFor } from '../domain/language'
import { formatNumber, translate } from './translations'

/**
 * Renders a 1200x630 weekly summary card image via an offscreen HTML5 canvas.
 */

export interface WeeklyCardData {
  lang: Lang
  totalMinutes: number
  chartDays: Array<{ label: string; minutes: number; isToday: boolean }>
  topTasks: Array<{ name: string; minutes: number; percentage: number }>
  activeDaysCount: number
  dateRangeLabel: string
}

const WIDTH = 1200
const HEIGHT = 630
const SCALE = 2 // 2400x1260 physical pixels for Retina crispness

/** Fit by rendered width, preserving grapheme clusters (CJK, accents and joined emoji). */
export function fitCanvasText(ctx: { measureText: (text: string) => { width: number } }, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(part => part.segment)
  while (parts.length && ctx.measureText(parts.join('') + '…').width > maxWidth) parts.pop()
  return parts.length ? parts.join('') + '…' : ''
}

/**
 * Procedurally generates a 128x128 film grain noise tile with ~3% alpha.
 */
function createFilmGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (typeof document === 'undefined') return null
  const noiseCanvas = document.createElement('canvas')
  noiseCanvas.width = 128
  noiseCanvas.height = 128
  const nCtx = noiseCanvas.getContext('2d')
  if (!nCtx) return null

  try {
    const imgData = nCtx.createImageData(128, 128)
    const data = imgData.data
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255)
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 9 // ~3.5% opacity
    }
    nCtx.putImageData(imgData, 0, 0)
    return ctx.createPattern(noiseCanvas, 'repeat')
  } catch {
    return null
  }
}

/**
 * Renders the weekly card onto an offscreen canvas and returns the canvas element.
 */
export async function renderWeeklyCardCanvas(data: WeeklyCardData): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') {
    throw new Error('Canvas card rendering is only supported in a DOM environment.')
  }

  // Ensure bundled local fonts are ready before drawing
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready
    } catch {
      // Proceed if font readiness check fails
    }
  }

  const canvas = document.createElement('canvas')
  canvas.lang = LANGUAGE_META[data.lang].htmlLang
  canvas.width = WIDTH * SCALE
  canvas.height = HEIGHT * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to obtain 2D canvas rendering context.')
  }

  // Set coordinate space to 1200x630
  ctx.scale(SCALE, SCALE)

  // Canvas background and film grain
  ctx.fillStyle = '#F5F4ED'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const grain = createFilmGrainPattern(ctx)
  if (grain) {
    ctx.fillStyle = grain
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  }

  // Perimeter border
  ctx.strokeStyle = '#E8E6DC'
  ctx.lineWidth = 1.5
  ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80)

  // Header
  ctx.font = '600 13px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = '#716F66'
  ctx.letterSpacing = '1px'
  const headerText = translate(data.lang, 'card.header')
  ctx.fillText(headerText, 70, 85)

  // Date range
  if (data.dateRangeLabel) {
    ctx.textAlign = 'right'
    ctx.fillText(data.dateRangeLabel, WIDTH - 70, 85)
    ctx.textAlign = 'left'
  }

  // Total focus time
  const hours = new Intl.NumberFormat(localeFor(data.lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(data.totalMinutes / 60)
  ctx.font = '500 76px "Fraunces Variable", Georgia, serif'
  ctx.fillStyle = '#141413'
  ctx.letterSpacing = '-1px'
  ctx.fillText(hours + ' ' + translate(data.lang, 'unit.hourShort'), 70, 185)

  ctx.font = '500 15px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = '#5E5D59'
  ctx.letterSpacing = '0px'
  const subHero = translate(data.lang, 'card.summary', { minutes: data.totalMinutes, days: data.activeDaysCount })
  ctx.fillText(subHero, 70, 220)

  // 7-day bar chart
  const chartX = 70
  const chartY = 270
  const chartW = 460
  const chartH = 180
  const barGap = 16
  const barCount = data.chartDays.length || 7
  const barW = (chartW - (barCount - 1) * barGap) / barCount

  const maxMinutes = Math.max(60, ...data.chartDays.map((d) => d.minutes))

  // Chart baseline
  ctx.strokeStyle = '#E8E6DC'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(chartX, chartY + chartH)
  ctx.lineTo(chartX + chartW, chartY + chartH)
  ctx.stroke()

  data.chartDays.forEach((day, idx) => {
    const x = chartX + idx * (barW + barGap)
    const ratio = Math.min(1, day.minutes / maxMinutes)
    const h = Math.max(day.minutes > 0 ? 6 : 2, ratio * (chartH - 24))
    const y = chartY + chartH - h

    // Fill color: terracotta for today or active, soft stone otherwise
    ctx.fillStyle = day.isToday ? '#C96442' : day.minutes > 0 ? '#B0AEA5' : '#E8E6DC'

    // Draw bar with rounded top
    const radius = 3
    ctx.beginPath()
    ctx.moveTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
    ctx.arcTo(x + barW, y, x + barW, y + radius, radius)
    ctx.lineTo(x + barW, chartY + chartH)
    ctx.lineTo(x, chartY + chartH)
    ctx.closePath()
    ctx.fill()

    // Day caption
    ctx.font = '500 12px "Instrument Sans Variable", system-ui, sans-serif'
    ctx.fillStyle = day.isToday ? '#C96442' : '#716F66'
    ctx.textAlign = 'center'
    ctx.fillText(fitCanvasText(ctx, day.label, barW), x + barW / 2, chartY + chartH + 20)

    // Minutes value above bar if > 0
    if (day.minutes > 0) {
      ctx.font = '500 11px "Instrument Sans Variable", system-ui, sans-serif'
      ctx.fillStyle = '#5E5D59'
      ctx.fillText(formatNumber(data.lang, day.minutes) + ' ' + translate(data.lang, 'unit.minuteShort'), x + barW / 2, y - 6)
    }
  })
  ctx.textAlign = 'left'

  // Section divider
  ctx.strokeStyle = '#E8E6DC'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(600, 130)
  ctx.lineTo(600, 490)
  ctx.stroke()

  // Top intentions list
  const taskX = 660
  let taskY = 160

  ctx.font = '600 13px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = '#716F66'
  ctx.letterSpacing = '1px'
  const intentionsTitle = translate(data.lang, 'card.tasks')
  ctx.fillText(intentionsTitle, taskX, taskY)
  ctx.letterSpacing = '0px'

  taskY += 35
  const topTasks = data.topTasks.slice(0, 4)

  if (topTasks.length === 0) {
    ctx.font = '400 15px "Instrument Sans Variable", system-ui, sans-serif'
    ctx.fillStyle = '#716F66'
    const noTasksText = translate(data.lang, 'card.noTasks')
    ctx.fillText(noTasksText, taskX, taskY + 10)
  } else {
    for (const task of topTasks) {
      // Bullet dot in terracotta
      ctx.fillStyle = '#C96442'
      ctx.beginPath()
      ctx.arc(taskX + 4, taskY - 4, 3, 0, Math.PI * 2)
      ctx.fill()

      // Task name (clamped)
      ctx.font = '500 16px "Instrument Sans Variable", system-ui, sans-serif'
      ctx.fillStyle = '#141413'
      const label = fitCanvasText(ctx, task.name, 285)
      ctx.fillText(label, taskX + 18, taskY)

      // Minutes & percentage
      ctx.font = '400 14px "Instrument Sans Variable", system-ui, sans-serif'
      ctx.fillStyle = '#716F66'
      ctx.textAlign = 'right'
      ctx.fillText(formatNumber(data.lang, task.minutes) + ' ' + translate(data.lang, 'unit.minuteShort') + ' (' + formatNumber(data.lang, task.percentage) + '%)', WIDTH - 70, taskY + 20)
      ctx.textAlign = 'left'

      taskY += 64
    }
  }

  // Footer
  ctx.font = 'italic 14px "Fraunces Variable", Georgia, serif'
  ctx.fillStyle = '#716F66'
  const quote = translate(data.lang, 'card.footer')
  ctx.fillText(quote, 70, 545)

  ctx.font = '500 12px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#B0AEA5'
  ctx.fillText('focusflow.ink', WIDTH - 70, 545)
  ctx.textAlign = 'left'

  return canvas
}

/**
 * Generates an in-memory PNG blob of the weekly card.
 */
export async function generateWeeklyCardBlob(data: WeeklyCardData): Promise<Blob> {
  const canvas = await renderWeeklyCardCanvas(data)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to serialize canvas to PNG blob.'))
      }
    }, 'image/png')
  })
}

/**
 * Triggers a direct client-side download of the summary card PNG.
 */
export async function downloadWeeklyCard(data: WeeklyCardData, filename = 'focus-flow-weekly.png'): Promise<void> {
  const blob = await generateWeeklyCardBlob(data)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Copies the summary card PNG to clipboard using the Clipboard API.
 */
export async function copyWeeklyCardToClipboard(data: WeeklyCardData): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.write) {
    return false
  }
  try {
    const blob = await generateWeeklyCardBlob(data)
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
    return true
  } catch {
    return false
  }
}
