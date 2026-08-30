import { Brain, Coffee, MoonStar, Salad, Zap } from 'lucide-react'
import type { TipCategory } from '../types'

/**
 * Study and focus advice, ported from the original Focus Flow.
 * Polish-first copy, English translations kept in step.
 */
export const TIP_CATEGORIES: TipCategory[] = [
  {
    id: 'learning',
    icon: Brain,
    titlePl: 'Nauka',
    titleEn: 'Learning',
    tips: [
      {
        pl: { title: 'Rób notatki ręcznie', desc: 'Pisanie odręczne angażuje obszary mózgu odpowiedzialne za przetwarzanie i zapamiętywanie. Badania pokazują, że studenci notujący ręcznie lepiej rozumieją materiał niż ci, którzy piszą na laptopie.' },
        en: { title: 'Write notes by hand', desc: 'Handwriting engages brain areas responsible for processing and memory. Studies show students who write by hand understand material better than those who type.' },
      },
      {
        pl: { title: 'Ucz się aktywnym przypominaniem', desc: 'Zamiast czytać notatki wielokrotnie, zamknij książkę i spróbuj odtworzyć z pamięci to, czego się nauczyłeś. Active Recall to jedna z najskuteczniejszych technik zapamiętywania.' },
        en: { title: 'Use active recall', desc: 'Instead of re-reading notes, close the book and try to recall from memory. Active recall is one of the most effective learning techniques.' },
      },
      {
        pl: { title: 'Wyłącz telefon podczas nauki', desc: 'Rozpraszacze kosztują Cię średnio 23 minuty na odzyskanie pełnej koncentracji po każdym spojrzeniu w ekran.' },
        en: { title: 'Turn off your phone while studying', desc: 'Distractions cost you an average of 23 minutes to regain full focus after each glance.' },
      },
      {
        pl: { title: 'Dziel materiał na małe partie', desc: 'Próba nauczenia się 50 stron na raz jest nieskuteczna. Podziel materiał na 5–10 stron na sesję i powtarzaj każdą partię przed przejściem dalej.' },
        en: { title: 'Break material into small chunks', desc: 'Trying to learn 50 pages at once is ineffective. Split material into 5–10 page sessions.' },
      },
      {
        pl: { title: 'Ucz się w ciszy albo przy muzyce bez słów', desc: 'Muzyka z tekstem angażuje korę słuchową i konkuruje z materiałem, który próbujesz zapamiętać.' },
        en: { title: 'Study in silence or with instrumental music', desc: "Music with lyrics engages the auditory cortex and competes with what you're trying to learn." },
      },
      {
        pl: { title: 'Powtarzaj materiał następnego dnia', desc: 'Jeśli nie powtórzysz następnego dnia, zapomnisz nawet 50–70% tego, czego się nauczyłeś. Powtórka po 24h to klucz do długotrwałej pamięci.' },
        en: { title: 'Review material the next day', desc: "If you don't review the next day, you'll forget up to 50–70% of what you learned." },
      },
    ],
  },
  {
    id: 'break',
    icon: Coffee,
    titlePl: 'Przerwa',
    titleEn: 'Break',
    tips: [
      {
        pl: { title: 'Napij się wody', desc: 'Nawet lekkie odwodnienie (1–2%) obniża koncentrację i sprawność umysłową. Miej szklankę wody na biurku.' },
        en: { title: 'Drink water', desc: 'Even mild dehydration (1–2%) reduces concentration and mental performance.' },
      },
      {
        pl: { title: 'Zjedz orzechy lub owoc', desc: 'Migdały, orzechy włoskie, jabłko lub banan dostarczają glukozy i zdrowych tłuszczów stabilizujących poziom cukru we krwi.' },
        en: { title: 'Eat nuts or fruit', desc: 'Almonds, walnuts, apples, or bananas provide glucose and healthy fats that stabilise blood sugar.' },
      },
      {
        pl: { title: 'Przewietrz pokój', desc: 'W zamkniętym pomieszczeniu poziom CO₂ szybko rośnie, powodując zmęczenie. Otwórz okno na 2 minuty.' },
        en: { title: 'Air out the room', desc: 'CO₂ levels rise quickly in a closed room, causing fatigue. Open the window for 2 minutes.' },
      },
      {
        pl: { title: 'Zrób 10 przysiadów', desc: 'Aktywność fizyczna zwiększa przepływ krwi do mózgu i poprawia nastrój. 10 przysiadów zajmuje 30 sekund.' },
        en: { title: 'Do 10 squats', desc: 'Physical activity boosts blood flow to the brain and improves mood. 10 squats take 30 seconds.' },
      },
      {
        pl: { title: 'Odsuń wzrok od ekranu', desc: 'Patrzenie w dal rozluźnia mięśnie rzęskowe oka. Zasada 20-20-20: co 20 minut patrz w dal na 20 sekund.' },
        en: { title: 'Look away from the screen', desc: "Looking at a distance relaxes the eye's ciliary muscles. The 20-20-20 rule." },
      },
      {
        pl: { title: 'Przejdź się po pokoju', desc: 'Zmiana pozycji i krótki spacer poprawiają krążenie i resetują mózg na kolejne zadanie.' },
        en: { title: 'Walk around the room', desc: 'Changing position and a short walk improve circulation and reset your brain.' },
      },
      {
        pl: { title: 'Rozciągnij ramiona i szyję', desc: 'Wielogodzinne siedzenie powoduje napięcie w barkach i karku. 30-sekundowe rozciągnięcie zapobiega bólom.' },
        en: { title: 'Stretch your shoulders and neck', desc: 'Hours of sitting cause tension in shoulders and neck. A 30-second stretch prevents pain.' },
      },
    ],
  },
  {
    id: 'sleep',
    icon: MoonStar,
    titlePl: 'Sen',
    titleEn: 'Sleep',
    tips: [
      {
        pl: { title: 'Kładź się spać o stałej porze', desc: 'Regularny rytm dobowy synchronizuje cykle snu z zegarem biologicznym. Nieregularne pory obniżają jakość snu.' },
        en: { title: 'Go to bed at a consistent time', desc: 'A regular circadian rhythm syncs your sleep cycles. Irregular bedtimes lower sleep quality.' },
      },
      {
        pl: { title: 'Nie używaj telefonu przed snem', desc: 'Niebieskie światło hamuje wydzielanie melatoniny. Odłóż telefon na 30–60 minut przed snem.' },
        en: { title: "Don't use your phone before bed", desc: 'Blue light inhibits melatonin production. Put your phone away 30–60 minutes before bed.' },
      },
      {
        pl: { title: 'Śpij 7–9 godzin na dobę', desc: 'W czasie snu mózg konsoliduje wspomnienia i regeneruje się. Mniej niż 7 godzin obniża zdolność uczenia się.' },
        en: { title: 'Sleep 7–9 hours per night', desc: 'During sleep your brain consolidates memories and regenerates. Less than 7 hours impairs learning.' },
      },
      {
        pl: { title: 'Wywietrz sypialnię przed snem', desc: 'Optymalna temperatura do snu to 16–19°C. Chłodne pomieszczenie pomaga szybciej zasnąć.' },
        en: { title: 'Air out your bedroom before sleeping', desc: 'The optimal sleep temperature is 16–19°C. A cool room helps you fall asleep faster.' },
      },
      {
        pl: { title: 'Nie jedz ciężkich posiłków przed snem', desc: 'Trawienie obciąża organizm i utrudnia zasypianie. Ostatni posiłek zjedz 2–3 godziny przed snem.' },
        en: { title: "Don't eat heavy meals before bed", desc: 'Digestion burdens your body and makes it harder to fall asleep. Eat 2–3 hours before bed.' },
      },
      {
        pl: { title: 'Czytaj książkę zamiast scrollować', desc: 'Czytanie wycisza układ nerwowy. 15 minut książki przed snem działa lepiej niż melatonina.' },
        en: { title: 'Read a book instead of scrolling', desc: 'Reading calms the nervous system. 15 minutes of reading before bed works better than melatonin.' },
      },
    ],
  },
  {
    id: 'food',
    icon: Salad,
    titlePl: 'Jedzenie',
    titleEn: 'Food',
    tips: [
      {
        pl: { title: 'Pij dużo wody w ciągu dnia', desc: 'Mózg składa się w 75% z wody. Nawet niewielkie odwodnienie powoduje bóle głowy i spadek koncentracji.' },
        en: { title: 'Drink plenty of water', desc: 'Your brain is 75% water. Even mild dehydration causes headaches and reduced focus.' },
      },
      {
        pl: { title: 'Unikaj cukru przed nauką', desc: 'Cukier daje szybki zastrzyk energii, po którym następuje gwałtowny spadek. Jesteś bardziej zmęczony niż przed.' },
        en: { title: 'Avoid sugar before studying', desc: 'Sugar gives a quick energy spike followed by a crash. You end up more tired than before.' },
      },
      {
        pl: { title: 'Zjedz lekkie śniadanie', desc: 'Owsianka, jajecznica, pełnoziarniste pieczywo — unikaj cukru i wysoko przetworzonych płatków.' },
        en: { title: 'Eat a light breakfast', desc: 'Oatmeal, eggs, wholegrain bread — avoid sugar and highly processed cereals.' },
      },
      {
        pl: { title: 'Orzechy i owoce to idealna przekąska', desc: 'Orzechy dostarczają zdrowych tłuszczów, a owoce naturalnej glukozy. Dają stabilną energię.' },
        en: { title: 'Nuts and fruit are the ideal snack', desc: 'Nuts provide healthy fats, fruit provides natural glucose. They give stable energy.' },
      },
      {
        pl: { title: 'Nie ucz się na głodniaka', desc: 'Brak glukozy obniża koncentrację. Lekki posiłek 30–60 minut przed nauką zapewnia mózgowi paliwo.' },
        en: { title: "Don't study hungry", desc: 'Lack of glucose impairs concentration. A light meal 30–60 min before studying fuels your brain.' },
      },
      {
        pl: { title: 'Kawa? Max 2 dziennie', desc: 'Kofeina blokuje receptor zmęczenia, ale jej nadmiar prowadzi do niepokoju. Do 2 kaw dziennie.' },
        en: { title: 'Coffee? Max 2 per day', desc: 'Caffeine blocks the fatigue receptor, but too much causes anxiety. Up to 2 coffees per day.' },
      },
    ],
  },
  {
    id: 'productivity',
    icon: Zap,
    titlePl: 'Produktywność',
    titleEn: 'Productivity',
    tips: [
      {
        pl: { title: 'Rób jedną rzecz na raz', desc: 'Multitasking to mit — mózg szybko przełącza się między zadaniami, a każde przełączenie kosztuje czas i energię.' },
        en: { title: 'Do one thing at a time', desc: 'Multitasking is a myth — your brain quickly switches between tasks, and each switch costs time and energy.' },
      },
      {
        pl: { title: 'Ustal cel przed startem timera', desc: 'Zapisz konkretne zadanie na tę sesję. Zamiast „uczyć się" napisz „zrobić 15 ćwiczeń".' },
        en: { title: 'Set a goal before starting', desc: 'Write a specific task for this session. Instead of "study", write "do 15 exercises".' },
      },
      {
        pl: { title: 'Zacznij od najtrudniejszego zadania', desc: 'Zasada „Eat the frog" — jeśli zrobisz najtrudniejszą rzecz rano, reszta pójdzie lekko.' },
        en: { title: 'Start with the hardest task', desc: 'The "Eat the frog" rule — do the hardest thing first and the rest feels easy.' },
      },
      {
        pl: { title: 'Sprzątanie biurka = sprzątanie myśli', desc: 'Bałagan na biurku to bodźce odciągające uwagę. Poświęć 60 sekund na uporządkowanie przestrzeni.' },
        en: { title: 'Clean desk, clean mind', desc: 'Clutter is visual distraction. Spend 60 seconds tidying up before starting.' },
      },
      {
        pl: { title: 'Planuj dzień wieczorem', desc: 'Wieczorne zaplanowanie 3 najważniejszych zadań sprawia, że rano nie tracisz energii na decyzję „co robić".' },
        en: { title: 'Plan your day the evening before', desc: 'Planning the 3 most important tasks the night before saves decision-making energy in the morning.' },
      },
      {
        pl: { title: 'Co 4 pomodoro zrób dłuższą przerwę', desc: 'Po 4 cyklach (ok. 2h) mózg potrzebuje dłuższej regeneracji. 15–30 minut przerwy od ekranu.' },
        en: { title: 'Longer break every 4 pomodoros', desc: 'After 4 cycles (~2h) your brain needs longer recovery. 15–30 min away from screens.' },
      },
    ],
  },
]

/** A random tip from the break and food categories — shown while a break runs. */
export function randomBreakTip(lang: 'pl' | 'en'): { title: string; desc: string } {
  const pool = [...TIP_CATEGORIES[1].tips, ...TIP_CATEGORIES[3].tips]
  const tip = pool[Math.floor(Math.random() * pool.length)]
  return tip[lang]
}
