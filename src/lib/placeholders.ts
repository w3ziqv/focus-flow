import type { Lang } from '../types'

type Bucket = 'morning' | 'afternoon' | 'evening' | 'night'

export function bucketOf(date: Date): Bucket {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 23) return 'evening'
  return 'night'
}

const VARIANTS: Record<Bucket, Record<Lang, string[]>> = {
  morning: {
    pl: ['Dzień dobry. Nad czym pracujesz?', 'Świeży poranek. Co dziś robimy?', 'Dzień dobry. Jaki jest cel tej sesji?'],
    en: ['Good morning. What are you working on?', 'Fresh start. What are we tackling?', 'Good morning. What is this session for?'],
  },
  afternoon: {
    pl: ['Dobry dzień. Nad czym pracujesz?', 'Popołudniowy restart — co robimy?', 'Dobry dzień. Jaki jest cel tej sesji?'],
    en: ['Good afternoon. What are you working on?', 'An afternoon restart — what are we tackling?', 'Good afternoon. What is this session for?'],
  },
  evening: {
    pl: ['Dobry wieczór. Nad czym pracujesz?', 'Cichy wieczór. Co dopracowujemy?', 'Dobry wieczór. Jaki jest cel tej sesji?'],
    en: ['Good evening. What are you working on?', 'A quiet evening. What are we polishing?', 'Good evening. What is this session for?'],
  },
  night: {
    pl: ['Nocna sesja. Nad czym pracujesz?', 'Nocna zmiana. Jedna krótka, dobra sesja?', 'Za oknem ciemno. Co robimy?'],
    en: ['A late-night session. What are you working on?', 'The night shift. One short, good session?', 'Dark outside. What are we doing?'],
  },
}

export function taskPlaceholder(lang: Lang, date = new Date()): string {
  const variants = VARIANTS[bucketOf(date)][lang]
  return variants[Math.floor(Math.random() * variants.length)]
}
