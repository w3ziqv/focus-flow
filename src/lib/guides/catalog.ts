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
  'learning-self-explanation': { topicId: 'learning', sources: ['selfExplanation'], reviewedOn: '2026-11-05' },
  'learning-worked-examples': { topicId: 'learning', sources: ['workedExamples'], reviewedOn: '2026-11-05' },
  'learning-pretest': { topicId: 'learning', sources: ['pretesting'], reviewedOn: '2026-11-05' },
  'break-microbreaks': { topicId: 'break', sources: ['microbreaks'], reviewedOn: '2026-11-05' },
  'break-creative-walk': { topicId: 'break', sources: ['creativeWalking'], reviewedOn: '2026-11-05' },
  'break-movement': { topicId: 'break', sources: ['activity'], reviewedOn: '2026-11-05' },
  'sleep-wake-time': { topicId: 'sleep', sources: ['sleep'], reviewedOn: '2026-11-05' },
  'sleep-memory': { topicId: 'sleep', sources: ['sleepMemory'], reviewedOn: '2026-11-05' },
  'sleep-naps': { topicId: 'sleep', sources: ['naps'], reviewedOn: '2026-11-05' },
  'food-breakfast': { topicId: 'food', sources: ['breakfast'], reviewedOn: '2026-11-05' },
  'food-simple-lunch': { topicId: 'food', sources: ['diet'], reviewedOn: '2026-11-05' },
  'food-caffeine-labels': { topicId: 'food', sources: ['caffeineSafety'], reviewedOn: '2026-11-05' },
  'productivity-notifications': { topicId: 'productivity', sources: ['notifications'], reviewedOn: '2026-11-05' },
  'productivity-restart-plan': { topicId: 'productivity', sources: ['restartPlans'], reviewedOn: '2026-11-05' },
  'productivity-progress': { topicId: 'productivity', sources: ['progress'], reviewedOn: '2026-11-05' },
  'wellbeing-ask-support': { topicId: 'wellbeing', sources: ['stressSupport'], reviewedOn: '2026-11-05' },
  'wellbeing-detachment': { topicId: 'wellbeing', sources: ['detachment'], reviewedOn: '2026-11-05' },
  'wellbeing-activity': { topicId: 'wellbeing', sources: ['activity'], reviewedOn: '2026-11-05' },
  'mindfulness-wandering': { topicId: 'mindfulness', sources: ['mindWandering'], reviewedOn: '2026-11-05' },
  'mindfulness-walking': { topicId: 'mindfulness', sources: ['mindfulWalking'], reviewedOn: '2026-11-05' },
  'mindfulness-sounds': { topicId: 'mindfulness', sources: ['mindfulness'], reviewedOn: '2026-11-05' },
} as const
export type ArticleId = keyof typeof catalog
export const GUIDE_CATALOG: Record<ArticleId, { topicId: TopicId; sources: readonly GuideSourceId[]; reviewedOn?: string }> = catalog
export interface ArticleCopy {
  title: string
  intro: string
  evidence: string
  steps: readonly string[]
  limits: string
}
