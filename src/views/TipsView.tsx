import { TIP_CATEGORIES } from '../lib/tips'
import { useI18n } from '../lib/i18n'
import { TipsAccordion } from '../components/TipsAccordion'

export default function TipsView() {
  const { t } = useI18n()

  return (
    <div className="fade-up mx-auto w-full max-w-[760px] px-4 pt-24 pb-16 max-md:pt-20">
      <p className="text-overline text-ink-3">{t('app.name')}</p>
      <h1 className="mt-2 font-serif text-[2rem] font-[500] tracking-[-0.01em] text-ink">{t('tips.title')}</h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{t('tips.desc')}</p>
      <TipsAccordion categories={TIP_CATEGORIES} />
    </div>
  )
}
