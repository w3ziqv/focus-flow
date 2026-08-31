import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { detectOS, detectPlatform } from '../lib/platform'
import { saveOnboardingDone } from '../lib/storage'
import { Modal } from './Modal'
import { PillButton } from './PillButton'

interface OnboardingProps {
  open: boolean
  onDone: () => void
}

export function Onboarding({ open, onDone }: OnboardingProps) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)

  if (!open) return null

  const os = detectOS()
  const installBodyKey = {
    ios: 'onboarding.install.body.ios',
    android: 'onboarding.install.body.android',
    desktop: 'onboarding.install.body.desktop',
  } as const

  const slides = [
    { title: t('onboarding.timer.title'), body: t('onboarding.timer.body') },
    {
      title: t('onboarding.local.title'),
      body: t(os === 'desktop' ? 'onboarding.local.body' : 'onboarding.local.body.touch'),
    },
    ...(detectPlatform() === 'browser'
      ? [{ title: t('onboarding.install.title'), body: t(installBodyKey[os]) }]
      : []),
  ]
  const total = slides.length
  const slide = slides[Math.min(step, total - 1)]
  const last = step === total - 1

  const complete = () => {
    saveOnboardingDone()
    onDone()
  }

  return (
    <Modal open title={slide.title} onClose={complete}>
      <p className="text-[0.95rem] leading-relaxed text-ink-2">{slide.body}</p>
      <p className="sr-only">{t('onboarding.step', { n: step + 1, total })}</p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="flex gap-1.5" aria-hidden="true">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`size-1.5 rounded-full transition-colors duration-150 ${index === step ? 'bg-[var(--ac)]' : 'bg-line'}`}
            />
          ))}
        </span>
        <div className="flex gap-2">
          {step > 0 && (
            <PillButton variant="secondary" onClick={() => setStep(step - 1)}>
              {t('onboarding.back')}
            </PillButton>
          )}
          <PillButton variant="primary" onClick={() => (last ? complete() : setStep(step + 1))}>
            {last ? t('onboarding.done') : t('onboarding.next')}
          </PillButton>
        </div>
      </div>
    </Modal>
  )
}
