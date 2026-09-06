import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '../lib/i18n'
import { SoundSettingsDialog } from './SoundSettingsDialog'
import type { AmbientSound, BinauralMode, CustomSound } from '../types'

describe('SoundSettingsDialog Component', () => {
  const defaultProps = {
    open: true,
    current: 'none' as AmbientSound,
    binaural: 'off' as BinauralMode,
    toneWarmth: 800,
    volume: 0.7,
    sounds: [] as CustomSound[],
    message: null,
    onChange: vi.fn(),
    onBinauralChange: vi.fn(),
    onToneWarmthChange: vi.fn(),
    onVolumeChange: vi.fn(),
    onAddFile: vi.fn(),
    onRemove: vi.fn(),
    onClose: vi.fn(),
  }

  const renderDialog = (props = defaultProps) => {
    return render(
      <I18nProvider>
        <SoundSettingsDialog {...props} />
      </I18nProvider>,
    )
  }

  it('renders dual-layer sound palette with base textures and binaural entrainment', () => {
    renderDialog()

    // Dialog title
    expect(screen.getByRole('heading', { level: 2 })).toBeDefined()

    // Layer 1: Base Texture section
    expect(screen.getByRole('button', { name: /Szum brązowy|Brown noise/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Szum różowy|Pink noise/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Spokojny deszcz|Delikatny deszcz|Soft rain/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Fale oceanu|Ocean waves/i })).toBeDefined()

    // Layer 2: Entrainment Resonance section
    expect(screen.getByRole('button', { name: /Alpha Focus \(10 Hz\)/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Theta Rest \(6 Hz\)/i })).toBeDefined()

    // Headphone guidance note
    expect(
      screen.getByText(/Wymaga słuchawek dla pełnego efektu|Headphones required for spatial effect/i),
    ).toBeDefined()
  })

  it('triggers onChange when base texture chip is clicked', () => {
    const onChange = vi.fn()
    renderDialog({ ...defaultProps, onChange })

    const brownBtn = screen.getByRole('button', { name: /Szum brązowy|Brown noise/i })
    fireEvent.click(brownBtn)
    expect(onChange).toHaveBeenCalledWith('brown')
  })

  it('triggers onBinauralChange when binaural entrainment chip is clicked', () => {
    const onBinauralChange = vi.fn()
    renderDialog({ ...defaultProps, onBinauralChange })

    const alphaBtn = screen.getByRole('button', { name: /Alpha Focus \(10 Hz\)/i })
    fireEvent.click(alphaBtn)
    expect(onBinauralChange).toHaveBeenCalledWith('alpha')

    const thetaBtn = screen.getByRole('button', { name: /Theta Rest \(6 Hz\)/i })
    fireEvent.click(thetaBtn)
    expect(onBinauralChange).toHaveBeenCalledWith('theta')
  })

  it('triggers onToneWarmthChange when Tone Warmth slider is moved', () => {
    const onToneWarmthChange = vi.fn()
    renderDialog({ ...defaultProps, onToneWarmthChange })

    const warmthSlider = screen.getByLabelText(/Ciepło akustyczne|Tone warmth/i)
    fireEvent.change(warmthSlider, { target: { value: '450' } })
    expect(onToneWarmthChange).toHaveBeenCalledWith(450)
  })

  it('triggers onVolumeChange when Master Volume slider is moved', () => {
    const onVolumeChange = vi.fn()
    renderDialog({ ...defaultProps, onVolumeChange })

    const volumeSlider = screen.getByLabelText(/Głośność ogólna|Master volume/i)
    fireEvent.change(volumeSlider, { target: { value: '85' } })
    expect(onVolumeChange).toHaveBeenCalledWith(0.85)
  })

  it('triggers onClose when Save button is clicked', () => {
    const onClose = vi.fn()
    renderDialog({ ...defaultProps, onClose })

    const saveBtn = screen.getByRole('button', { name: /Zapisz|Save/i })
    fireEvent.click(saveBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
