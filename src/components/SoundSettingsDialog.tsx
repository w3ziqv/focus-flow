import { Headphones } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import type { AmbientSound, BinauralMode, CustomSound } from '../types'
import { Modal } from './Modal'
import { SoundChipRow } from './SoundChipRow'

interface SoundSettingsDialogProps {
  open: boolean
  current: AmbientSound
  binaural?: BinauralMode
  toneWarmth?: number
  volume: number
  sounds: CustomSound[]
  message: string | null
  onChange: (sound: AmbientSound) => void
  onBinauralChange?: (mode: BinauralMode) => void
  onToneWarmthChange?: (warmth: number) => void
  onVolumeChange: (volume: number) => void
  onAddFile: (file: File) => void
  onRemove: (id: string) => void
  onClose: () => void
}

const chipBase =
  'inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken active:bg-sunken'

export function SoundSettingsDialog({
  open,
  current,
  binaural = 'off',
  toneWarmth = 800,
  volume,
  sounds,
  message,
  onChange,
  onBinauralChange,
  onToneWarmthChange,
  onVolumeChange,
  onAddFile,
  onRemove,
  onClose,
}: SoundSettingsDialogProps): React.JSX.Element {
  const { t } = useI18n()

  const binauralChips: Array<{ id: BinauralMode; label: string }> = [
    { id: 'off', label: t('sound.binauralOff') },
    { id: 'alpha', label: t('sound.binauralAlpha') },
    { id: 'theta', label: t('sound.binauralTheta') },
  ]

  return (
    <Modal open={open} onClose={onClose} title={t('sound.settings')}>
      {/* Layer 1: Base Texture */}
      <section className="mb-6">
        <h3 className="mb-2 text-overline uppercase tracking-wider text-ink-3">
          {t('sound.baseTexture')}
        </h3>
        <SoundChipRow
          current={current}
          sounds={sounds}
          message={message}
          onChange={onChange}
          onAddFile={onAddFile}
          onRemove={onRemove}
        />
      </section>

      {/* Layer 2: Entrainment Resonance */}
      <section className="mt-6 border-t border-line pt-5">
        <h3 className="mb-1 text-overline uppercase tracking-wider text-ink-3">
          {t('sound.entrainment')}
        </h3>
        <p className="mb-3 flex items-center gap-1.5 text-caption text-ink-3">
          <Headphones size={13} aria-hidden="true" />
          {t('sound.binauralHeadphones')}
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('sound.entrainment')}>
          {binauralChips.map((chip) => {
            const active = binaural === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => onBinauralChange?.(chip.id)}
                className={`${chipBase} ${
                  active
                    ? 'border-transparent bg-[var(--ac-soft)] text-[var(--ac-strong)] hover:bg-[var(--ac-soft)]'
                    : 'text-ink-2'
                }`}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Tone Warmth Filter Slider */}
      <section className="mt-6 border-t border-line pt-5">
        <label htmlFor="sound-tone-warmth" className="flex items-center justify-between gap-3 text-[14px] text-ink">
          <span>{t('sound.toneWarmth')}</span>
          <span className="tnum text-caption text-ink-3">
            {t('sound.toneWarmthUnit', { hz: toneWarmth })}
          </span>
        </label>
        <input
          id="sound-tone-warmth"
          type="range"
          min={200}
          max={1200}
          step={25}
          value={toneWarmth}
          aria-label={t('sound.toneWarmth')}
          onChange={(event) => onToneWarmthChange?.(Number(event.target.value))}
          className="sound-volume mt-2 w-full"
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>{t('sound.warmthWarm')} (200 Hz)</span>
          <span>{t('sound.warmthBright')} (1200 Hz)</span>
        </div>
      </section>

      {/* Master Volume Slider */}
      <section className="mt-5 border-t border-line pt-5">
        <label htmlFor="sound-volume-dialog" className="flex items-center justify-between gap-3 text-[14px] text-ink">
          <span>{t('sound.masterVolume')}</span>
          <span className="tnum text-caption text-ink-3">{Math.round(volume * 100)}%</span>
        </label>
        <input
          id="sound-volume-dialog"
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          aria-label={t('sound.masterVolume')}
          onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
          className="sound-volume mt-2 w-full"
        />
      </section>

      {/* Modal Actions Footer */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center rounded-full bg-sunken px-6 py-2 text-[14px] font-medium text-ink transition-all duration-150 [transition-timing-function:var(--ease-micro)] active:scale-[0.98]"
        >
          {t('settings.save')}
        </button>
      </div>
    </Modal>
  )
}
