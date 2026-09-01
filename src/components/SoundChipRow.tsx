import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import type { AmbientSound, CustomSound } from '../types'
import { useI18n } from '../lib/i18n'

interface SoundChipRowProps {
  current: AmbientSound
  sounds: CustomSound[]
  message: string | null
  onChange: (sound: AmbientSound) => void
  onAddFile: (file: File) => void
  onRemove: (id: string) => void
}

const chipBase =
  'inline-flex min-h-11 shrink-0 snap-start items-center gap-1 rounded-full border border-line bg-card px-4 py-2 text-caption shadow-halo transition-colors duration-150 [transition-timing-function:var(--ease-micro)] hover:bg-sunken active:bg-sunken'

export function SoundChipRow({ current, sounds, message, onChange, onAddFile, onRemove }: SoundChipRowProps): React.JSX.Element {
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)

  const builtIns: Array<{ id: AmbientSound; label: string }> = [
    { id: 'none', label: t('sound.off') },
    { id: 'rain', label: t('sound.rain') },
    { id: 'waves', label: t('sound.waves') },
    { id: 'stream', label: t('sound.stream') },
    { id: 'campfire', label: t('sound.campfire') },
    { id: 'noise', label: t('sound.noise') },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('sound.group')}>
        {builtIns.map((item) => {
          const active = current === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={`${chipBase} ${active ? 'border-transparent bg-[var(--ac-soft)] text-[var(--ac-strong)] hover:bg-[var(--ac-soft)]' : 'text-ink-2'}`}
            >
              {item.label}
            </button>
          )
        })}
        {sounds.map((sound) => {
          const id: AmbientSound = `custom:${sound.id}`
          const active = current === id
          return (
            <span
              key={sound.id}
              className={`inline-flex items-center gap-1 rounded-full border py-2 pr-2 pl-4 text-caption shadow-halo transition-colors duration-150 ${
                active ? 'border-transparent bg-[var(--ac-soft)] text-[var(--ac-strong)]' : 'border-line bg-card text-ink-2'
              }`}
            >
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(id)}
                className="max-w-[140px] truncate bg-transparent outline-none"
              >
                {sound.name}
              </button>
              <button
                type="button"
                aria-label={t('sound.remove', { name: sound.name })}
                onClick={() => onRemove(sound.id)}
                className="flex size-11 items-center justify-center rounded-full p-3 text-ink-3 transition-colors hover:bg-sunken hover:text-danger"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          )
        })}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`${chipBase} text-ink-2`}
          aria-label={t('sound.add')}
          title={t('sound.choose')}
        >
          <Plus size={14} aria-hidden="true" />
          {t('sound.add')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onAddFile(file)
          }}
        />
      </div>
      <p aria-live="polite" className="min-h-5 text-caption text-ink-3">
        {message ?? ''}
      </p>
    </div>
  )
}
