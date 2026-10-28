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
    es: ['Buenos días', 'Una nueva mañana'],
    zh: ['早上好', '新的一天'],
  },
  afternoon: {
    pl: ['Dobry dzień', 'Popołudniowy restart'],
    en: ['Good afternoon', 'Back at it'],
    es: ['Buenas tardes', 'Es hora de continuar'],
    zh: ['下午好', '继续专注'],
  },
  evening: {
    pl: ['Dobry wieczór', 'Cichy wieczór'],
    en: ['Good evening', 'A quiet evening'],
    es: ['Buenas noches', 'Una tarde tranquila'],
    zh: ['晚上好', '安静的夜晚'],
  },
  night: {
    pl: ['Nocna zmiana', 'Późna godzina'],
    en: ['Night shift', 'Late hours'],
    es: ['Turno de noche', 'A estas horas'],
    zh: ['夜间时段', '夜已深'],
  },
}

export function taskGreeting(lang: Lang, date: Date = new Date()): string {
  const bucket = bucketOf(date)
  const variants = GREETINGS[bucket][lang]
  return variants[Math.floor(Math.random() * variants.length)]
}
