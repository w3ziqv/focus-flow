import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWeeklyCardCanvas, generateWeeklyCardBlob, type WeeklyCardData } from './cardExport'

const mockCardData: WeeklyCardData = {
  lang: 'pl',
  totalMinutes: 175,
  chartDays: [
    { label: 'Pon', minutes: 50, isToday: false },
    { label: 'Wt', minutes: 25, isToday: false },
    { label: 'Śr', minutes: 50, isToday: false },
    { label: 'Czw', minutes: 25, isToday: false },
    { label: 'Pt', minutes: 25, isToday: true },
    { label: 'Sob', minutes: 0, isToday: false },
    { label: 'Ndz', minutes: 0, isToday: false },
  ],
  topTasks: [
    { name: 'Głęboka praca', minutes: 100, percentage: 57 },
    { name: 'Przegląd kodu', minutes: 75, percentage: 43 },
  ],
  activeDaysCount: 5,
  dateRangeLabel: 'Pon — Ndz',
}

describe('cardExport (v2.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas with correct scale and dimensions in DOM environment', async () => {
    // Mock 2D context for jsdom
    const mockCtx = {
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      stroke: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(128 * 128 * 4) }),
      putImageData: vi.fn(),
      createPattern: vi.fn().mockReturnValue({}),
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D)

    const canvas = await renderWeeklyCardCanvas(mockCardData)
    expect(canvas).toBeDefined()
    expect(canvas.width).toBe(2400)
    expect(canvas.height).toBe(1260)
    expect(mockCtx.scale).toHaveBeenCalledWith(2, 2)
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 1200, 630)
  })

  it('generates PNG blob via canvas.toBlob', async () => {
    const mockBlob = new Blob(['mock-png'], { type: 'image/png' })
    const mockCtx = {
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      stroke: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(128 * 128 * 4) }),
      putImageData: vi.fn(),
      createPattern: vi.fn().mockReturnValue({}),
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb: BlobCallback) => {
      cb(mockBlob)
    })

    const blob = await generateWeeklyCardBlob(mockCardData)
    expect(blob).toBeDefined()
    expect(blob.type).toBe('image/png')
  })
})
