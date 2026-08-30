import { Brain, Coffee, MoonStar, Salad, Zap } from 'lucide-react'
import type { TipCategory } from '../types'

export const TIP_CATEGORIES: TipCategory[] = [
  {
    id: 'learning',
    icon: Brain,
    titlePl: 'Nauka',
    titleEn: 'Learning',
    tips: [
      {
        pl: { title: 'Sprawdzaj się zamiast czytać', desc: 'Zamknij notatki i odtwórz materiał z pamięci. Samo sięganie do pamięci uczy skuteczniej niż kolejne czytanie.', source: 'Roediger i Karpicke, 2006' },
        en: { title: 'Test yourself instead of re-reading', desc: 'Close the notes and rebuild the material from memory. Retrieving beats re-reading.', source: 'Roediger & Karpicke, 2006' },
      },
      {
        pl: { title: 'Rozłóż powtórki w czasie', desc: 'Trzy krótkie powtórki w odstępach dni wygrywają z jedną długą sesją tuż przed egzaminem.', source: 'Cepeda i in., 2006' },
        en: { title: 'Space out your reviews', desc: 'Three short reviews spread over days beat one long cram session the night before.', source: 'Cepeda et al., 2006' },
      },
      {
        pl: { title: 'Rób notatki ręcznie', desc: 'Pisanie odręczne zmusza do przerabiania treści własnymi słowami zamiast przepisywania.', source: 'Mueller i Oppenheimer, 2014' },
        en: { title: 'Take notes by hand', desc: 'Handwriting forces you to rephrase ideas instead of transcribing them.', source: 'Mueller & Oppenheimer, 2014' },
      },
      {
        pl: { title: 'Schowaj telefon', desc: 'Po każdym spojrzeniu w ekran potrzeba średnio ok. 23 minut na pełny powrót koncentracji.', source: 'Gloria Mark, UC Irvine' },
        en: { title: 'Silence your phone', desc: 'After each glance at a screen it takes about 23 minutes to fully refocus.', source: 'Gloria Mark, UC Irvine' },
      },
      {
        pl: { title: 'Mieszaj tematy', desc: 'Przeplatanie rodzajów zadań w jednej sesji uczy rozpoznawać, którą metodę wybrać — to sprawdzane na egzaminie.', source: 'Rohrer i Taylor, 2007' },
        en: { title: 'Mix up the topics', desc: 'Interleaving task types teaches you to pick the right method — exactly what exams test.', source: 'Rohrer & Taylor, 2007' },
      },
      {
        pl: { title: 'Naucz kogoś innego', desc: 'Samo przygotowanie do tłumaczenia komuś porządkuje wiedzę mocniej niż nauka na siebie.', source: 'Nestojko i in., 2014' },
        en: { title: 'Teach it to someone', desc: 'Merely expecting to explain something to others makes you organise the material better.', source: 'Nestojko et al., 2014' },
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
        pl: { title: 'Napij się wody', desc: 'Odwodnienie na poziomie zaledwie 1–2% masy ciała mierzyle obniża uwagę i pamięć roboczą.', source: 'Ganio i in., 2011' },
        en: { title: 'Drink water', desc: 'Dehydration of just 1–2% of body mass measurably lowers attention and working memory.', source: 'Ganio et al., 2011' },
      },
      {
        pl: { title: 'Zasada 20-20-20', desc: 'Co 20 minut patrz przez 20 sekund na coś oddalonego o co najmniej 20 stóp — mięśnie oka się rozluźniają.', source: 'American Optometric Association' },
        en: { title: 'The 20-20-20 rule', desc: 'Every 20 minutes, look 20 feet away for 20 seconds — the eye muscles relax.', source: 'American Optometric Association' },
      },
      {
        pl: { title: 'Porusz się trochę', desc: 'Krótka dawka ruchu poprawia uwagę jeszcze przez 20–30 minut po powrocie do biurka.', source: 'Chang i in., 2012' },
        en: { title: 'Move a little', desc: 'A short dose of exercise keeps attention higher for 20–30 minutes after you sit back down.', source: 'Chang et al., 2012' },
      },
      {
        pl: { title: 'Przewietrz pokój', desc: 'Przy stężeniu CO₂ ok. 1000 ppm wyniki testów decyzyjnych spadają mierzalnie. Otwórz okno.', source: 'Satish i in., 2012' },
        en: { title: 'Air out the room', desc: 'At CO₂ levels around 1000 ppm decision-making scores drop measurably. Open a window.', source: 'Satish et al., 2012' },
      },
      {
        pl: { title: 'Drzemka 10–20 minut', desc: 'Krótka drzemka w badaniu NASA poprawiła czujność o 34%, a wydajność o 16%. Dłuższa działa odwrotnie.', source: 'NASA (Rosekind i in., 1995)' },
        en: { title: 'A 10–20 minute nap', desc: 'A short nap in NASA research raised alertness by 34% and performance by 16%. Longer naps backfire.', source: 'NASA (Rosekind et al., 1995)' },
      },
      {
        pl: { title: 'Wyjdź na krótki spacer', desc: 'Chodzenie podnosi kreatywność myślenia — średnio o ponad połowę w badaniu Stanforda.', source: 'Oppezzo i Schwartz, 2014' },
        en: { title: 'Take a short walk', desc: 'Walking boosts creative thinking — on average by more than half in the Stanford experiments.', source: 'Oppezzo & Schwartz, 2014' },
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
        pl: { title: 'Kładź się o stałej porze', desc: 'Stała pora (też w weekend) synchronizuje zegar biologiczny — zasypiasz szybciej, śpisz głębiej.', source: 'National Sleep Foundation' },
        en: { title: 'Keep a consistent bedtime', desc: 'A fixed bedtime (weekends too) syncs your body clock — you fall asleep faster and sleep deeper.', source: 'National Sleep Foundation' },
      },
      {
        pl: { title: 'Śpij 7–9 godzin', desc: 'W głębokim snu mózg przenosi wiedzę z pamięci krótkiej do długiej. Mniej niż 7 h = luki.', source: 'National Sleep Foundation' },
        en: { title: 'Sleep 7–9 hours', desc: 'During deep sleep the brain moves knowledge into long-term memory. Under 7 hours leaves gaps.', source: 'National Sleep Foundation' },
      },
      {
        pl: { title: 'Chłodna sypialnia', desc: '16–19°C pomaga — spadek temperatury ciała jest sygnałem do zaśnięcia.', source: 'AASM (higiena snu)' },
        en: { title: 'A cool bedroom', desc: '16–19°C helps — the drop in body temperature is a signal for your body to fall asleep.', source: 'AASM (sleep hygiene)' },
      },
      {
        pl: { title: 'Ekran do “nie” na 30–60 min', desc: 'Niebieskie światło ekranów opóźnia wyrzut melatoniny — czytaj papier zamiast scrollować.', source: 'Chang i in., PNAS 2015' },
        en: { title: 'Screens off 30–60 min before bed', desc: 'Blue screen light delays melatonin release — read on paper instead of scrolling.', source: 'Chang et al., PNAS 2015' },
      },
      {
        pl: { title: 'Kofeina min. 6 h przed snem', desc: 'Połowa kofeiny wciąż krąży w ciele po ok. 5 godzinach. Kawa 6 h przed snem skraca sen o niemal godzinę.', source: 'Drake i in., 2013' },
        en: { title: 'Caffeine 6+ hours before bed', desc: 'Half the caffeine is still in your body after ~5 hours. Coffee 6 h before bed cuts sleep by nearly an hour.', source: 'Drake et al., 2013' },
      },
      {
        pl: { title: 'Ruch w ciągu dnia = lepszy sen', desc: 'Osoby aktywne przez 150 min tygodniowo raportowały wyraźnie lepszą jakość snu.', source: 'National Sleep Foundation, 2013' },
        en: { title: 'Daytime exercise, better sleep', desc: 'People active 150 minutes a week report markedly better sleep quality.', source: 'National Sleep Foundation, 2013' },
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
        pl: { title: 'Pij wodę regularnie', desc: 'Mózg w ~75% to woda; nawet lekkie odwodnienie daje bóle głowy i rozdrażnienie.', source: 'Popkin i in., 2010' },
        en: { title: 'Drink water regularly', desc: 'The brain is ~75% water; even mild dehydration brings headaches and irritability.', source: 'Popkin et al., 2010' },
      },
      {
        pl: { title: 'Bez cukru przed sesją', desc: 'Słodycze dają szybki skok glukozy i równie szybki spadek — koncentracja pada razem z nim.', source: 'Benton, 2002' },
        en: { title: 'Skip the sugar hit', desc: 'Sweets give a fast glucose spike and an equally fast crash — focus goes down with it.', source: 'Benton, 2002' },
      },
      {
        pl: { title: 'Lekki, powolny posiłek', desc: 'Śniadanie o niskim indeksie glikemicznym (owsianka, jajka) utrzymuje uwagę do południa.', source: 'Adolphus i in., 2013' },
        en: { title: 'A light, slow breakfast', desc: 'A low-glycaemic breakfast (oats, eggs) keeps attention stable until noon.', source: 'Adolphus et al., 2013' },
      },
      {
        pl: { title: 'Orzechy i owoce na przekąskę', desc: 'Tłuszcze z orzechów plus naturalna glukoza z owocu = energia bez skoków cukru.', source: 'zalecenia WHO / WHO dietary guidance' },
        en: { title: 'Nuts and fruit as a snack', desc: 'Nut fats plus natural fruit glucose = steady energy without sugar swings.', source: 'WHO dietary guidance' },
      },
      {
        pl: { title: 'Nie pracuj głodny', desc: 'Niski poziom glukozy obniża wytrwałość i samokontrolę. Lekki posiłek 30–60 min przed sesją.', source: 'Gailliot i Baumeister, 2007' },
        en: { title: "Don't work hungry", desc: 'Low glucose lowers persistence and self-control. Have a light meal 30–60 min before a session.', source: 'Gailliot & Baumeister, 2007' },
      },
      {
        pl: { title: 'Kawa: tak, ale z głową', desc: '1–2 kawy dziennie wzmagą uwagę; więcej prowadzi do niepokoju i pogarsza sen.', source: 'Drake i in., 2013' },
        en: { title: 'Coffee: yes, but smart', desc: '1–2 coffees sharpen attention; more leads to anxiety and worse sleep.', source: 'Drake et al., 2013' },
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
        pl: { title: 'Jedna rzecz naraz', desc: 'Mózg nie robi dwóch rzeczy naraz — przełącza się. Same przełączanie potrafi zjeść do 40% czasu.', source: 'Rubinstein, Meyer i Evans, 2001 (APA)' },
        en: { title: 'One thing at a time', desc: 'The brain does not multitask — it switches. Switching alone can eat up to 40% of productive time.', source: 'Rubinstein, Meyer & Evans, 2001 (APA)' },
      },
      {
        pl: { title: 'Zapisz cel sesji', desc: 'Konkretne „kiedy, gdzie, jak” podwaja szansę, że zamiar zamieni się w działanie.', source: 'Gollwitzer, 1999' },
        en: { title: 'Write down the session goal', desc: 'A concrete when-where-how plan roughly doubles the chance that intention becomes action.', source: 'Gollwitzer, 1999' },
      },
      {
        pl: { title: 'Zacznij od najtrudniejszego', desc: 'Odkładanie jest ucieczką od emocji związanych z zadaniem. Pierwszy krok przerywa pętlę.', source: 'Sirois i Pychyl, 2013' },
        en: { title: 'Start with the hardest', desc: 'Procrastination is escaping the feelings attached to a task. The first step breaks the loop.', source: 'Sirois & Pychyl, 2013' },
      },
      {
        pl: { title: 'Uporządkuj biurko', desc: 'Bałagan konkuruje o uwagę na poziomie zmysłow — mózg przetwarza go mimo woli.', source: 'McMains i Kastner, 2011' },
        en: { title: 'Tidy the desk', desc: 'Clutter competes for attention at the sensory level — the brain processes it even when you ignore it.', source: 'McMains & Kastner, 2011' },
      },
      {
        pl: { title: 'Zaplanuj jutro wieczorem', desc: 'Zapisany plan wyłącza natrętne „pamiętaj o…” i zwalnia pamięć roboczą.', source: 'Masicampo i Baumeister, 2011' },
        en: { title: 'Plan tomorrow tonight', desc: 'A written plan switches off intrusive “remember to…” thoughts and frees working memory.', source: 'Masicampo & Baumeister, 2011' },
      },
      {
        pl: { title: 'Dłuższa przerwa co ~2 h', desc: 'Uwaga pracuje w cyklach ok. 90 minut. Po 4 pomodoro weź 15–30 min z dala od ekranu.', source: 'cykl BRAC (Kleitman)' },
        en: { title: 'A longer break every ~2 hours', desc: 'Attention runs in ~90-minute cycles. After 4 pomodoros take 15–30 minutes away from screens.', source: 'BRAC (Kleitman)' },
      },
    ],
  },
]

/** A random tip from the break and food categories — shown while a break runs. */
export function randomBreakTip(lang: 'pl' | 'en'): { title: string; desc: string; source: string } {
  const pool = [...TIP_CATEGORIES[1].tips, ...TIP_CATEGORIES[3].tips]
  const tip = pool[Math.floor(Math.random() * pool.length)]
  return tip[lang]
}
