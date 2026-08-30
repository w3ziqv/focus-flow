import { Brain, Coffee, Flower2, MoonStar, Salad, Sparkles, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TopicId } from '../types'

export type TopicAccent = 'focus' | 'rest'

export interface Topic {
  id: TopicId
  icon: LucideIcon
  accent: TopicAccent
  titlePl: string
  titleEn: string
  descPl: string
  descEn: string
}

export const TOPICS: Topic[] = [
  {
    id: 'learning',
    icon: Brain,
    accent: 'focus',
    titlePl: 'Nauka',
    titleEn: 'Learning',
    descPl: 'Techniki zapamiętywania, które przetrwają tygodnie, nie godziny.',
    descEn: 'Retention techniques that survive weeks, not hours.',
  },
  {
    id: 'break',
    icon: Coffee,
    accent: 'rest',
    titlePl: 'Przerwy',
    titleEn: 'Breaks',
    descPl: 'Odpoczynek, który faktycznie regeneruje uwagę.',
    descEn: 'Rest that actually restores attention.',
  },
  {
    id: 'sleep',
    icon: MoonStar,
    accent: 'rest',
    titlePl: 'Sen',
    titleEn: 'Sleep',
    descPl: 'Fundament pamięci i koncentracji — łatwy do zepsucia, prosty do naprawy.',
    descEn: 'The foundation of memory and focus — easy to break, simple to fix.',
  },
  {
    id: 'food',
    icon: Salad,
    accent: 'rest',
    titlePl: 'Jedzenie',
    titleEn: 'Food',
    descPl: 'Co jeść (i czego unikać), żeby energia była stabilna.',
    descEn: 'What to eat (and avoid) for steady energy.',
  },
  {
    id: 'productivity',
    icon: Zap,
    accent: 'focus',
    titlePl: 'Produktywność',
    titleEn: 'Productivity',
    descPl: 'Struktura dnia, która robi różnicę zanim zaczniesz pracować.',
    descEn: 'Day structure that matters before the work starts.',
  },
  {
    id: 'wellbeing',
    icon: Sparkles,
    accent: 'rest',
    titlePl: 'Samopoczucie',
    titleEn: 'Wellbeing',
    descPl: 'Stres przed pracą da się okiełznać — są na to konkretne techniki.',
    descEn: 'Pre-work stress can be tamed — with specific techniques.',
  },
  {
    id: 'mindfulness',
    icon: Flower2,
    accent: 'rest',
    titlePl: 'Mindfulness',
    titleEn: 'Mindfulness',
    descPl: 'Uwaga jest trenowalna jak mięsień. Krótko, codziennie, skutecznie.',
    descEn: 'Attention is trainable like a muscle. Short, daily, effective.',
  },
]

export function topicById(id: TopicId): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0]
}
