import { useState } from 'react'
import { Download, Copy, Check, X } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { PillButton } from './PillButton'
import { downloadWeeklyCard, copyWeeklyCardToClipboard, type WeeklyCardData } from '../lib/cardExport'

interface ExportCardModalProps {
  open: boolean
  onClose: () => void
  cardData: WeeklyCardData
}

export function ExportCardModal({ open, onClose, cardData }: ExportCardModalProps): React.JSX.Element | null {
  const { t } = useI18n()
  const [downloading, setDownloading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  if (!open) return null

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await downloadWeeklyCard(cardData)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)
    } catch {
      // Ignored
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = async () => {
    try {
      setCopying(true)
      const ok = await copyWeeklyCardToClipboard(cardData)
      if (ok) {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch {
      // Ignored
    } finally {
      setCopying(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink-3 hover:bg-sunken focus-visible:ring-2 focus-visible:ring-[var(--ac)]"
          aria-label={t('settings.cancel')}
        >
          <X className="size-5" />
        </button>

        <div>
          <p className="text-overline text-ink-3">{t('app.name')}</p>
          <h2 id="card-modal-title" className="mt-1 font-serif text-[22px] font-medium text-ink">
            {t('stats.exportCardTitle')}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
            {t('stats.exportCardSubtitle')}
          </p>
        </div>

        {/* Card preview summary */}
        <div className="mt-6 rounded-xl border border-line bg-surface-sunken p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-caption font-medium text-ink-3">{cardData.dateRangeLabel}</span>
            <span className="font-serif text-[20px] font-medium text-ink">
              {(cardData.totalMinutes / 60).toFixed(1)}h
            </span>
          </div>
          <p className="text-[13px] text-ink-2">
            {cardData.lang === 'pl'
              ? String(cardData.totalMinutes) + ' min w ' + String(cardData.activeDaysCount) + ' aktywnych dniach'
              : String(cardData.totalMinutes) + ' min across ' + String(cardData.activeDaysCount) + ' active days'}
          </p>
        </div>

        {/* Action status notification */}
        {(copied || downloaded) && (
          <div className="mt-4 flex items-center gap-2 text-[13px] font-medium text-[var(--ac-strong)]">
            <Check className="size-4" />
            <span>{copied ? t('stats.cardCopied') : t('stats.cardDownloaded')}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[14px] font-medium text-ink-2 hover:bg-sunken"
          >
            {t('settings.cancel')}
          </button>

          <PillButton
            variant="secondary"
            onClick={handleCopy}
            disabled={copying}
            className="flex items-center gap-2"
          >
            <Copy className="size-4" />
            <span>{copying ? t('stats.exportCardGenerating') : t('stats.exportCardClipboard')}</span>
          </PillButton>

          <PillButton
            variant="primary"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2"
          >
            <Download className="size-4" />
            <span>{downloading ? t('stats.exportCardGenerating') : t('stats.exportCardDownload')}</span>
          </PillButton>
        </div>
      </div>
    </div>
  )
}
