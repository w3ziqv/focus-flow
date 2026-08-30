export interface BreakTip {
  titlePl: string
  titleEn: string
  descPl: string
  descEn: string
}

export const BREAK_TIPS: BreakTip[] = [
  {
    titlePl: 'Przewietrz pokój',
    descPl: 'W zamkniętym pomieszczeniu poziom CO₂ szybko rośnie, powodując zmęczenie. Otwórz okno na 2 minuty.',
    titleEn: 'Air out the room',
    descEn: 'CO₂ levels rise quickly in a closed room, causing fatigue. Open a window for 2 minutes.',
  },
  {
    titlePl: 'Odsuń wzrok od ekranu',
    descPl: 'Zasada 20-20-20: co 20 minut patrz w dal na 20 sekund — mięśnie oka się rozluźniają.',
    titleEn: 'Look away from the screen',
    descEn: 'The 20-20-20 rule: every 20 minutes look 20 feet away for 20 seconds — the eye muscles relax.',
  },
  {
    titlePl: 'Przejdź się po pokoju',
    descPl: 'Krótki spacer poprawia krążenie i resetuje mózg na kolejne zadanie.',
    titleEn: 'Walk around the room',
    descEn: 'A short walk improves circulation and resets your brain.',
  },
  {
    titlePl: 'Napij się wody',
    descPl: 'Lekkie odwodnienie obniża koncentrację — szklanka wody na biurku załatwia sprawę.',
    titleEn: 'Drink some water',
    descEn: 'Mild dehydration lowers focus — a glass of water on the desk does the job.',
  },
]

export function randomBreakTip(): BreakTip {
  return BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)]
}
