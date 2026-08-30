import type { Lang } from '../types'

type Bucket = 'morning' | 'afternoon' | 'evening' | 'night'

export function bucketOf(date: Date): Bucket {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 23) return 'evening'
  return 'night'
}

const GREETINGS: Record<Bucket, Record<Lang, string[]>> = {
  morning: {
    pl: ['Dzień dobry', 'Świeży poranek', 'Miłego poranka'],
    en: ['Good morning', 'A fresh morning', 'Morning focus'],
  },
  afternoon: {
    pl: ['Dobry dzień', 'Popołudniowy restart'],
    en: ['Good afternoon', 'Back at it'],
  },
  evening: {
    pl: ['Dobry wieczór', 'Cichy wieczór'],
    en: ['Good evening', 'A quiet evening'],
  },
  night: {
    pl: ['Nocna zmiana', 'Późna godzina'],
    en: ['Night shift', 'Late hours'],
  },
}

export function taskGreeting(lang: Lang, date = new Date()): string {
  const bucket = bucketOf(date)
  const variants = GREETINGS[bucket][lang]
  return variants[Math.floor(Math.random() * variants.length)]
}
