import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'

export function ViewLoading(): React.JSX.Element {
  const { t } = useI18n()
  return <p role="status" className="mx-auto min-h-[60vh] max-w-xl px-4 pt-24 text-body-sm text-ink-2">{t('common.loading')}</p>
}

export function DialogLoading({ title, onClose }: { title: string; onClose: () => void }): React.JSX.Element {
  const { t } = useI18n()
  return <Modal open title={title} onClose={onClose}><p role="status" className="text-body-sm text-ink-2">{t('common.loading')}</p></Modal>
}
