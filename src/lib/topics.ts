import { Brain, Coffee, Flower2, MoonStar, Salad, Sparkles, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Lang } from '../domain/language'
import type { TopicId } from '../types'

export type TopicAccent = 'focus' | 'rest'

export interface Topic {
  id: TopicId
  icon: LucideIcon
  accent: TopicAccent
  copy: Record<Lang, { title: string; description: string }>
}

export const TOPICS: Topic[] = [
  { id: 'learning', icon: Brain, accent: 'focus', copy: {
    pl: { title: 'Nauka', description: 'Odtwarzanie z pamięci, powtórki i dobór ćwiczeń.' },
    en: { title: 'Learning', description: 'Recall, review and choosing useful practice.' },
    es: { title: 'Aprendizaje', description: 'Recuerdo, repaso y elección de ejercicios.' },
    zh: { title: '学习', description: '主动回忆、复习与练习方法。' },
  } },
  { id: 'break', icon: Coffee, accent: 'rest', copy: {
    pl: { title: 'Przerwy', description: 'Pomysły na odpoczynek dopasowany do Twojego dnia.' },
    en: { title: 'Breaks', description: 'Ways to rest that fit your day.' },
    es: { title: 'Pausas', description: 'Formas de descansar que encajan en tu día.' },
    zh: { title: '休息', description: '选择适合日常安排的休息方式。' },
  } },
  { id: 'sleep', icon: MoonStar, accent: 'rest', copy: {
    pl: { title: 'Sen', description: 'Czas na sen, światło i napoje z kofeiną.' },
    en: { title: 'Sleep', description: 'Time for sleep, light and caffeine.' },
    es: { title: 'Sueño', description: 'Tiempo para dormir, luz y cafeína.' },
    zh: { title: '睡眠', description: '睡眠时间、光照与咖啡因。' },
  } },
  { id: 'food', icon: Salad, accent: 'rest', copy: {
    pl: { title: 'Jedzenie', description: 'Posiłki, napoje i rozsądna ocena obietnic żywieniowych.' },
    en: { title: 'Food', description: 'Meals, drinks and evaluating nutrition claims.' },
    es: { title: 'Alimentación', description: 'Comidas, bebidas y evaluación de consejos nutricionales.' },
    zh: { title: '饮食', description: '安排餐饮，理性看待营养宣传。' },
  } },
  { id: 'productivity', icon: Zap, accent: 'focus', copy: {
    pl: { title: 'Produktywność', description: 'Zakres sesji, przejścia między zadaniami i konkretne plany.' },
    en: { title: 'Productivity', description: 'Session scope, task transitions and specific plans.' },
    es: { title: 'Productividad', description: 'Alcance de las sesiones, transiciones y planes concretos.' },
    zh: { title: '效率', description: '安排任务范围、任务切换与具体计划。' },
  } },
  { id: 'wellbeing', icon: Sparkles, accent: 'rest', copy: {
    pl: { title: 'Samopoczucie', description: 'Łagodniejszy start, ocena sesji i radzenie sobie z napięciem.' },
    en: { title: 'Wellbeing', description: 'Starting gently, reviewing sessions and managing tension.' },
    es: { title: 'Bienestar', description: 'Empezar con calma, revisar sesiones y afrontar la tensión.' },
    zh: { title: '身心状态', description: '从容开始、复盘专注时段与应对紧张。' },
  } },
  { id: 'mindfulness', icon: Flower2, accent: 'rest', copy: {
    pl: { title: 'Uważność', description: 'Krótkie, opcjonalne ćwiczenia uwagi i obserwacji.' },
    en: { title: 'Mindfulness', description: 'Brief, optional exercises in attention and observation.' },
    es: { title: 'Atención plena', description: 'Ejercicios breves y opcionales de atención y observación.' },
    zh: { title: '正念', description: '简短、可自行选择的注意与观察练习。' },
  } },
]

export function topicById(id: TopicId): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0]
}
