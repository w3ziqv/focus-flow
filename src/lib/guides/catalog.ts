import sources from './sources.json'
import type { TopicId } from '../../types'

/** Stable route IDs; citations are shared by all translations. */
export const GUIDE_SOURCES: typeof sources = sources
export type GuideSourceId = keyof typeof GUIDE_SOURCES
const catalog = {
  'learning-recall': { topicId: 'learning', sources: ['retrieval', 'spacing'] },
  'sleep-protocol': { topicId: 'sleep', sources: ['sleep'] },
  'breaks-that-work': { topicId: 'break', sources: ['breaks'] },
  'eating-for-focus': { topicId: 'food', sources: ['diet'] },
  'switching-cost': { topicId: 'productivity', sources: ['residue'] },
  'pre-work-stress': { topicId: 'wellbeing', sources: ['reappraisal'] },
  'memory-palace': { topicId: 'learning', sources: ['loci', 'memoryAthletes'] },
  'off-screen-breaks': { topicId: 'break', sources: ['nature'] },
  'caffeine-alcohol-sleep': { topicId: 'sleep', sources: ['caffeine', 'sleep'] },
  'hydration-habits': { topicId: 'food', sources: ['water', 'dehydration'] },
  'deep-work-blocks': { topicId: 'productivity', sources: ['residue', 'plans'] },
  'self-compassion': { topicId: 'wellbeing', sources: ['compassion'] },
  'mindfulness-daily': { topicId: 'mindfulness', sources: ['mindfulness'] },
  'interleaving-practice': { topicId: 'learning', sources: ['interleaving'] },
  'dual-coding': { topicId: 'learning', sources: ['dualCoding'] },
  'nsdr-recovery': { topicId: 'break', sources: ['rest'] },
  'nature-microbreaks': { topicId: 'break', sources: ['greenRoof'] },
  'adenosine-caffeine-timing': { topicId: 'sleep', sources: ['caffeineDose'] },
  'circadian-light-entrainment': { topicId: 'sleep', sources: ['light'] },
  'glucose-stability': { topicId: 'food', sources: ['postmeal'] },
  'neurotransmitter-nutrition': { topicId: 'food', sources: ['magnesium', 'omega3'] },
  'ultradian-rhythms': { topicId: 'productivity', sources: ['breaks'] },
  'implementation-intentions': { topicId: 'productivity', sources: ['plans'] },
  'physiological-sigh': { topicId: 'wellbeing', sources: ['breathing'] },
  'stress-reappraisal': { topicId: 'wellbeing', sources: ['reappraisal'] },
  'open-monitoring-focus': { topicId: 'mindfulness', sources: ['monitoring'] },
  'body-scan-awareness': { topicId: 'mindfulness', sources: ['bodyScan'] },
} as const
export type ArticleId = keyof typeof catalog
export const GUIDE_CATALOG: Record<ArticleId, { topicId: TopicId; sources: readonly GuideSourceId[] }> = catalog
export interface ArticleCopy {
  title: string
  intro: string
  evidence: string
  steps: readonly string[]
  limits: string
}
