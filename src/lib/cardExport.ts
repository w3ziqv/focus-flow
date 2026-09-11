/**
 * Client-Side HTML5 Canvas Summary Card Generator (v2.3)
 *
 * Renders a crisp 1200x630 weekly summary card completely in memory
 * using Fraunces serif typography, Instrument Sans, warm parchment canvas (#F5F4ED),
 * and a 3% procedural film grain tile. Zero external network or CDN calls.
 */

export interface WeeklyCardData {
  lang: 'pl' | 'en'
  totalMinutes: number
  chartDays: Array<{ label: string; minutes: number; isToday: boolean }>
  topTasks: Array<{ name: string; minutes: number; percentage: number }>
  activeDaysCount: number
  dateRangeLabel: string
}

const WIDTH = 1200
const HEIGHT = 630
const SCALE = 2 // 2400x1260 physical pixels for Retina crispness

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
  canvas.width = WIDTH * SCALE
  canvas.height = HEIGHT * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to obtain 2D canvas rendering context.')
  }

  // Set coordinate space to 1200x630
  ctx.scale(SCALE, SCALE)

  // 1. Warm parchment canvas background
  ctx.fillStyle = '#F5F4ED'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 2. Procedural 3% film grain overlay
  const grain = createFilmGrainPattern(ctx)
  if (grain) {
    ctx.fillStyle = grain
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  }

  // 3. Hairline perimeter border
  ctx.strokeStyle = '#E8E6DC'
  ctx.lineWidth = 1.5
  ctx.strokeRect(40, 40, WIDTH - 80, HEIGHT - 80)

  // 4. Overline Header
  ctx.font = '600 13px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = '#716F66'
  ctx.letterSpacing = '1px'
  const headerText = data.lang === 'pl' ? 'FOCUS FLOW • PODSUMOWANIE TYGODNIA' : 'FOCUS FLOW • WEEKLY SUMMARY'
  ctx.fillText(headerText, 70, 85)

  // Date range
  if (data.dateRangeLabel) {
    ctx.textAlign = 'right'
    ctx.fillText(data.dateRangeLabel, WIDTH - 70, 85)
    ctx.textAlign = 'left'
  }

  // 5. Hero Stat: Total Focus Time (Fraunces Serif)
  const hours = (data.totalMinutes / 60).toFixed(1)
  ctx.font = '500 76px "Fraunces Variable", Georgia, serif'
  ctx.fillStyle = '#141413'
  ctx.letterSpacing = '-1px'
  ctx.fillText(hours + 'h', 70, 185)

  ctx.font = '500 15px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = '#5E5D59'
  ctx.letterSpacing = '0px'
  const subHero =
    data.lang === 'pl'
      ? 'Łącznie ' + data.totalMinutes + ' minut skupienia w ' + data.activeDaysCount + ' dniach'
      : data.totalMinutes + ' total focus minutes across ' + data.activeDaysCount + ' active days'
  ctx.fillText(subHero, 70, 220)

  // 6. Mini 7-Day Bar Chart
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
    ctx.fillText(day.label.slice(0, 3), x + barW / 2, chartY + chartH + 20)

    // Minutes value above bar if > 0
    if (day.minutes > 0) {
      ctx.font = '500 11px "Instrument Sans Variable", system-ui, sans-serif'
      ctx.fillStyle = '#5E5D59'
      ctx.fillText(day.minutes + 'm', x + barW / 2, y - 6)
    }
  })
  ctx.textAlign = 'left'

  // 7. Divider between Chart and Intentions
  ctx.strokeStyle = '#E8E6DC'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(600, 130)
  ctx.lineTo(600, 490)
  ctx.stroke()

  // 8. Top Intentions Section
  const taskX = 660
  let taskY = 160

  ctx.font = '600 13px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = '#716F66'
  ctx.letterSpacing = '1px'
  const intentionsTitle = data.lang === 'pl' ? 'GŁÓWNE ZADANIA' : 'PRIMARY INTENTIONS'
  ctx.fillText(intentionsTitle, taskX, taskY)
  ctx.letterSpacing = '0px'

  taskY += 35
  const topTasks = data.topTasks.slice(0, 4)

  if (topTasks.length === 0) {
    ctx.font = '400 15px "Instrument Sans Variable", system-ui, sans-serif'
    ctx.fillStyle = '#716F66'
    const noTasksText = data.lang === 'pl' ? 'Brak zarejestrowanych intencji w tym tygodniu' : 'No recorded intentions this week'
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
      const label = task.name.length > 32 ? task.name.slice(0, 30) + '...' : task.name
      ctx.fillText(label, taskX + 18, taskY)

      // Minutes & percentage
      ctx.font = '400 14px "Instrument Sans Variable", system-ui, sans-serif'
      ctx.fillStyle = '#716F66'
      ctx.textAlign = 'right'
      ctx.fillText(task.minutes + ' min (' + task.percentage + '%)', WIDTH - 70, taskY)
      ctx.textAlign = 'left'

      taskY += 42
    }
  }

  // 9. Serene Footer
  ctx.font = 'italic 14px "Fraunces Variable", Georgia, serif'
  ctx.fillStyle = '#716F66'
  const quote =
    data.lang === 'pl'
      ? 'Spokojna przestrzeń do uważnej, głębokiej pracy.'
      : 'A quiet space for deliberate, unhurried work.'
  ctx.fillText(quote, 70, 545)

  ctx.font = '500 12px "Instrument Sans Variable", system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#B0AEA5'
  ctx.fillText('focus-flow.local', WIDTH - 70, 545)
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
