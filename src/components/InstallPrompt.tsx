import { useCallback, useEffect, useState } from 'react'
import {
  consumeInstallPrompt,
  getInstallPromptEvent,
  resolveInstallPromptAction,
  subscribeInstallPrompt,
  type InstallPromptAction,
} from '../lib/installPrompt'
import { useI18n } from '../lib/i18n'
import { detectOS, detectPlatform } from '../lib/platform'
import { loadInstallDismissed, saveInstallDismissed } from '../lib/storage'
import { Modal } from './Modal'
import { PillButton } from './PillButton'

interface InstallPromptProps {
  /** Turns true right after the user finishes their first focus session. */
  focusCompleted: boolean
  /** Onboarding holds the floor first — never stack two dialogs. */
  onboardingOpen: boolean
}

export function InstallPrompt({ focusCompleted, onboardingOpen }: InstallPromptProps): React.JSX.Element | null {
  const { t } = useI18n()
  const [action, setAction] = useState<InstallPromptAction>('none')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!focusCompleted || onboardingOpen) return
    const evaluate = (): void => {
      const next = resolveInstallPromptAction({
        platform: detectPlatform(),
        os: detectOS(),
        dismissed: loadInstallDismissed(),
        canPrompt: getInstallPromptEvent() !== null,
      })
      setAction(next)
      setOpen(next !== 'none')
    }
    evaluate()
    return subscribeInstallPrompt(evaluate)
  }, [focusCompleted, onboardingOpen])

  const close = useCallback(() => {
    saveInstallDismissed()
    setOpen(false)
  }, [])

  const installNative = useCallback(async () => {
    const event = consumeInstallPrompt()
    if (!event) {
      setOpen(false)
      return
    }
    try {
      await event.prompt()
      await event.userChoice
    } catch {
      // The browser refused the prompt (stale handshake) — retry later without dismissing forever.
      setOpen(false)
      return
    }
    saveInstallDismissed()
    setOpen(false)
  }, [])

  if (!open) return null

  if (action === 'native') {
    return (
      <Modal open title={t('install.title')} onClose={close}>
        <p className="text-[0.95rem] leading-relaxed text-ink-2">{t('install.body')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <PillButton variant="secondary" onClick={close}>
            {t('install.dismiss')}
          </PillButton>
          <PillButton variant="primary" onClick={() => void installNative()}>
            {t('install.button')}
          </PillButton>
        </div>
      </Modal>
    )
  }

  const guideKeys =
    action === 'guide-ios'
      ? (['install.guide.ios.1', 'install.guide.ios.2', 'install.guide.ios.3'] as const)
      : (['install.guide.android.1', 'install.guide.android.2', 'install.guide.android.3'] as const)

  return (
    <Modal open title={t('install.title')} onClose={close}>
      <p className="text-[0.95rem] leading-relaxed text-ink-2">{t('install.body')}</p>
      <ol className="mt-4 flex flex-col gap-2.5">
        {guideKeys.map((key, index) => (
          <li key={key} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sunken text-caption text-ink-2">
              {index + 1}
            </span>
            <span className="text-[0.95rem] leading-relaxed text-ink-2">{t(key)}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex justify-end">
        <PillButton variant="secondary" onClick={close}>
          {t('install.dismiss')}
        </PillButton>
      </div>
    </Modal>
  )
}
