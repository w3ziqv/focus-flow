import { useI18n } from '../lib/i18n'
import type { AmbientSound, CustomSound } from '../types'
import { Modal } from './Modal'
import { SoundChipRow } from './SoundChipRow'

interface SoundSettingsDialogProps {
  open: boolean
  current: AmbientSound
  sounds: CustomSound[]
  message: string | null
  volume: number
  onChange: (sound: AmbientSound) => void
  onAddFile: (file: File) => void
  onRemove: (id: string) => void
  onVolumeChange: (volume: number) => void
  onClose: () => void
}

export function SoundSettingsDialog({
  open,
  current,
  sounds,
  message,
  volume,
  onChange,
  onAddFile,
  onRemove,
  onVolumeChange,
  onClose,
}: SoundSettingsDialogProps) {
  const { t } = useI18n()
  // On touch-primary devices the hardware volume buttons control media volume;
  // a draggable slider adds no value there.
  const showSlider = !window.matchMedia('(pointer: coarse)').matches

  return (
    <Modal open={open} onClose={onClose} title={t('sound.settings')}>
      <SoundChipRow
        current={current}
        sounds={sounds}
        message={message}
        onChange={onChange}
        onAddFile={onAddFile}
        onRemove={onRemove}
      />

      {showSlider && (
        <div className="mt-5 border-t border-line pt-5">
          <label htmlFor="sound-volume-dialog" className="flex items-center justify-between gap-3 text-[14px] text-ink">
            {t('sound.volume')}
            <span className="tnum text-caption text-ink-3">{Math.round(volume * 100)}%</span>
          </label>
          <input
            id="sound-volume-dialog"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            aria-label={t('sound.volume')}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
            className="sound-volume mt-2 w-full"
          />
        </div>
      )}

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
