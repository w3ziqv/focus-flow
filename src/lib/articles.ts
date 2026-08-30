import type { TopicId } from '../types'

export interface ArticleSection {
  hPl: string
  hEn: string
  pPl: string
  pEn: string
}

export interface Article {
  id: string
  topicId: TopicId
  titlePl: string
  titleEn: string
  introPl: string
  introEn: string
  sections: ArticleSection[]
  sourcesPl: string[]
  sourcesEn: string[]
}

export const ARTICLES: Record<string, Article> = {
  'learning-recall': {
    id: 'learning-recall',
    topicId: 'learning',
    titlePl: 'Uczenie się, które zostaje: przypominanie i odstępy',
    titleEn: 'Learning that sticks: recall and spacing',
    introPl: 'Największy koszt nauki to iluzja, że coś umiemy, bo rozpoznajemy notatki. W tym przewodniku: dwie techniki, które realnie budują trwałą pamięć, i sposób, jak je wdrożyć w sesjach Focus Flow.',
    introEn: 'The biggest cost of studying is the illusion of knowing — recognising notes feels like learning. This guide covers the two techniques that build durable memory and how to fit them into Focus Flow sessions.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Sięganie do pamięci (przypominanie) wzmacnia ślad pamięciowy silniej niż wielokrotne czytanie — to tzw. efekt testowania. Drugi mechanizm to efekt odstępów: te same powtórki rozłożone na dni dają trwalszy wynik niż zmasowana nauka, bo mózg ćwiczy odzyskiwanie informacji tuż przed zapomnieniem.',
        pEn: 'Actively retrieving information strengthens the memory trace far more than re-reading — the testing effect. Spacing works alongside it: the same number of reviews spread over days beats cramming, because the brain practises retrieval right before forgetting.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Ustaw sesję 25 minut i zapisz cel: „odtworzę rozdział 3 z pamięci". 2. Zamknij notatki i wypisz wszystko, co pamiętasz, na czystej kartce. 3. Otwórz materiał i zaznacz kolorem tylko luki. 4. Luki powtórz następnego dnia, potem po 3 i po 7 dniach. 5. Mieszaj tematy w obrębie tygodnia — przeplatanie uczy rozpoznawać, którą metodę zastosować.',
        pEn: '1. Start a 25-minute session and write the goal: "rebuild chapter 3 from memory". 2. Close the notes and write down everything you remember. 3. Reopen the material and mark only the gaps. 4. Review gaps the next day, then after 3 and 7 days. 5. Mix topics across the week — interleaving teaches you to pick the right method.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Wielokrotne czytanie i podkreślanie dają złudzenie biegłości bez trwałego efektu. Zmasowana nauka w ostatnią noc wyparowuje w ciągu dni. Sprawdzanie się „na zielono" bez trudności to rozrywka, nie trening.',
        pEn: 'Re-reading and highlighting create fluency illusions without durable gains. Cramming the night before evaporates within days. Retrieval that never feels hard is entertainment, not training.',
      },
    ],
    sourcesPl: ['Roediger i Karpicke, 2006 (Psychological Science)', 'Cepeda i in., 2006 (meta-analiza efektu odstępów)', 'Dunlosky i in., 2013 (Psychological Science in the Public Interest)'],
    sourcesEn: ['Roediger & Karpicke, 2006 (Psychological Science)', 'Cepeda et al., 2006 (spacing-effect meta-analysis)', 'Dunlosky et al., 2013 (Psychological Science in the Public Interest)'],
  },
  'sleep-protocol': {
    id: 'sleep-protocol',
    topicId: 'sleep',
    titlePl: 'Sen pod kontrolą: protokół na 7 dni',
    titleEn: 'Sleep under control: a 7-day protocol',
    introPl: 'Sen to nie przerwa od nauki — to moment, w którym mózg przenosi wiedzę do pamięci długotrwałej. Ten protokół naprawia najczęstsze błędy w siedem dni, po jednej zmianie dziennie.',
    introEn: 'Sleep is not a break from learning — it is when the brain files knowledge into long-term memory. This protocol fixes the most common mistakes in seven days, one change per day.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Regularna pora synchronizuje zegar biologiczny — zasypiasz szybciej i śpisz głębiej. Chłodna sypialnia (16–19°C) wspiera naturalny spadek temperatury ciała, sygnał zaśnięcia. Niebieskie światło ekranów opóźnia wyrzut melatoniny, a kofeina wypita 6 godzin przed snem skraca sen o niemal godzinę.',
        pEn: 'A consistent bedtime syncs the circadian clock — you fall asleep faster and sleep deeper. A cool bedroom (16–19°C) supports the natural drop in body temperature that signals sleep. Blue screen light delays melatonin release, and caffeine 6 hours before bed cuts sleep by nearly an hour.',
      },
      {
        hPl: 'Plan dzień po dniu',
        hEn: 'Day by day',
        pPl: 'Dzień 1–2: stała pora kładzenia się i wstawania, również w weekend. Dzień 3: ostatnia kofeina minimum 6 godzin przed snem. Dzień 4: ekrany do „nie" na 30–60 minut — książka działa lepiej. Dzień 5: 150 minut ruchu w tygodniu rozłożone na dni. Dzień 6: 15-minutowy rytuał wyciszenia przed snem. Dzień 7: oceń, która zmiana dała najwięcej, i zostaw ją na stałe.',
        pEn: 'Days 1–2: fixed bedtime and wake time, weekends included. Day 3: last caffeine at least 6 hours before bed. Day 4: screens off 30–60 minutes before — read on paper instead. Day 5: 150 minutes of weekly exercise spread across days. Day 6: a 15-minute wind-down ritual. Day 7: rate which change helped most and keep it.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Drzemki dłuższe niż 30 minut zabierają presję snu z wieczora. Alkohol skraca fazę REM, nawet jeśli pomaga zasnąć. „Nadrabianie" w weekend rozjeżdża zegar — lepsza stała pora.',
        pEn: 'Naps longer than 30 minutes steal sleep pressure from the evening. Alcohol cuts REM sleep even when it helps you doze off. Weekend catch-up sleep wrecks the clock — consistency wins.',
      },
    ],
    sourcesPl: ['National Sleep Foundation — zalecenia dotyczące snu', 'Chang i in., 2015 (PNAS — światło ekranów i melatonina)', 'Drake i in., 2013 (kofeina 6 h przed snem)'],
    sourcesEn: ['National Sleep Foundation — sleep duration recommendations', 'Chang et al., 2015 (PNAS — screens and melatonin)', 'Drake et al., 2013 (caffeine 6 h before bed)'],
  },
  'breaks-that-work': {
    id: 'breaks-that-work',
    topicId: 'break',
    titlePl: 'Przerwa, która naprawdę odpoczywa',
    titleEn: 'A break that actually rests you',
    introPl: 'Uwaga jest jak mięsień: bez przerw spada w ciągu kilkudziesięciu minut. Ale nie każda przerwa odpoczywa — scrollowanie telefonu to zmiana bodźców, nie regeneracja. Oto przerwy, które działają.',
    introEn: 'Attention behaves like a muscle: without breaks it sags within half an hour. But not every break restores it — scrolling your phone swaps stimuli, it does not recover you. Here are breaks that work.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Krótkie przerwy w trakcie długiego zadania ograniczają spadek czujności — mózg na moment „odpuszcza" i wraca świeższy. Ruch zwiększa przepływ krwi, a patrzenie w dal rozluźnia mięśnie oka skupione na bliskim ekranie. Przełączanie na inny ekran tego nie daje.',
        pEn: 'Brief breaks inside long tasks blunt the vigilance decrement — the brain disengages for a moment and returns fresher. Movement boosts blood flow; looking into the distance relaxes eye muscles locked on a near screen. Switching to another screen does none of this.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Co 25–30 minut wstań od biurka — nawet na 60 sekund. 2. Popatrz przez okno w dal przez 20 sekund (zasada 20-20-20). 3. Napij się wody i zrób 10 przysiadów lub kilka skłonów. 4. Co ~2 godziny zrób przerwę 15–30 minut z dala od ekranów — krótki spacer to najlepsza opcja.',
        pEn: '1. Every 25–30 minutes stand up, even for 60 seconds. 2. Look out a window into the distance for 20 seconds (the 20-20-20 rule). 3. Drink water and do 10 squats or a few bends. 4. Every ~2 hours take a 15–30 minute break away from screens — a short walk is the best option.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Przerwa na scrollowanie angażuje tę samą uwagę, którą chcesz odpocząć — po powrocie jesteś bardziej zmęczony. Przerwy „gdy skończę" nie istnieją: ustaw je w rytmie timera, nie w nastroju.',
        pEn: 'A scrolling break engages the same attention you are trying to rest — you come back more tired. Breaks "when I finish" never happen: schedule them with the timer, not your mood.',
      },
    ],
    sourcesPl: ['Ariga i Lleras, 2011 (Cognition — mikro-przerwy a czujność)', 'Oppezzo i Schwartz, 2014 (Journal of Experimental Psychology — spacer i kreatywność)', 'American Optometric Association — zasada 20-20-20'],
    sourcesEn: ['Ariga & Lleras, 2011 (Cognition — brief diversions and vigilance)', 'Oppezzo & Schwartz, 2014 (JEP — walking and creativity)', 'American Optometric Association — the 20-20-20 rule'],
  },
  'eating-for-focus': {
    id: 'eating-for-focus',
    topicId: 'food',
    titlePl: 'Jedz pod koncentrację, nie pod chwilę',
    titleEn: 'Eat for focus, not for a moment',
    introPl: 'To, co masz na talerzu, decyduje o stabilności uwagi w kolejnych dwóch godzinach. Zasada jest jedna: unikaj wahań glukozy — dają chwilę energii i długi spadek.',
    introEn: 'What is on your plate decides how stable your attention is for the next two hours. One rule: avoid glucose swings — a quick spike, then a long dip.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Mózg zużywa ogromną część energii organizmu i pracuje najlepiej na stabilnym poziomie glukozy. Słodycze dają szybki skok i gwałtowny spadek — koncentracja pada razem z krzywą. Lekkie odwodnienie (1–2%) mierzyle obniża uwagę i pamięć roboczą.',
        pEn: 'The brain consumes a large share of the body\'s energy and works best on a steady glucose supply. Sweets cause a fast spike and a steep crash — focus falls with the curve. Mild dehydration (1–2%) measurably lowers attention and working memory.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Przed sesją: lekki posiłek o niskim indeksie glikemicznym — owsianka, jajka, pełnoziarniste pieczywo. 2. Szklanka wody na biurku; pij regularnie, nie dopiero gdy czujesz pragnienie. 3. Przekąska w przerwie: orzechy + owoc zamiast ciastka. 4. Kawa: 1–2 dziennie, ostatnia minimum 6 godzin przed snem.',
        pEn: '1. Before a session: a light low-glycaemic meal — oats, eggs, wholegrain bread. 2. A glass of water on the desk; sip regularly instead of waiting for thirst. 3. Break snack: nuts and fruit instead of a cookie. 4. Coffee: 1–2 a day, the last one at least 6 hours before bed.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Cukier przed nauką daje krótki zastrzyk i długą dziurę. Praca na głodniaka obniża wytrwałość. Napoje energetyczne łączą najgorsze: olbrzymi skok kofeiny z cukrem.',
        pEn: 'Sugar before studying buys a short boost and a long hole. Working hungry lowers persistence. Energy drinks combine the worst of both: a huge caffeine hit plus sugar.',
      },
    ],
    sourcesPl: ['Benton, 2002 (Neuroscience & Biobehavioral Reviews — glukoza i poznanie)', 'Adolphus i in., 2013 (śniadanie a wyniki w nauce)', 'Popkin i in., 2010 (woda, nawodnienie i zdrowie)'],
    sourcesEn: ['Benton, 2002 (Neuroscience & Biobehavioral Reviews — glucose and cognition)', 'Adolphus et al., 2013 (breakfast and academic performance)', 'Popkin et al., 2010 (water, hydration and health)'],
  },
  'switching-cost': {
    id: 'switching-cost',
    topicId: 'productivity',
    titlePl: 'Przełączanie kosztuje: jeden kontekst na sesję',
    titleEn: 'Switching costs: one context per session',
    introPl: 'Mózg nie robi dwóch rzeczy naraz — przełącza się, a każde przełączenie zostawia „resztki uwagi". Ten przewodnik pokazuje, jak zbudować sesję odporną na rozpraszacze.',
    introEn: 'The brain does not multitask — it switches, and every switch leaves attention residue. This guide shows how to build a session that resists distraction.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Badania APA pokazują, że przełączanie między zadaniami potrafi zjeść do 40% czasu produktywnego. Zapisany plan działa jak zewnętrzna pamięć: gdy cel ma konkretne „kiedy, gdzie, jak", znika natrętna potrzeba pilnowania go w głowie.',
        pEn: 'APA research shows task switching can consume up to 40% of productive time. A written plan works as external memory: when a goal has a concrete when-where-how, the urge to keep it in your head disappears.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Przed sesją zapisz jedno zdanie: „od X do Y pracuję nad Z". 2. Wyłącz powiadomienia — telefon w innym pokoju. 3. Jedna aplikacja, jedna karta, jedno zadanie. 4. Przechwytuj przychodzące myśli na kartce obok klawiatury i wracaj do pracy — rozpiszesz je w przerwie. 5. Resetuj timer zamiast „robić tylko 5 minut dłużej".',
        pEn: '1. Before the session write one sentence: "from X to Y I work on Z". 2. Turn notifications off — phone in another room. 3. One app, one tab, one task. 4. Capture incoming thoughts on a notepad next to the keyboard and return to work — sort them in the break. 5. Reset the timer instead of "just five more minutes".',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: '„Sprawdzę tylko maila" to klasyczne wejście w spiralę przełączeń. Brak celu na sesję = twój mózg sam go wybierze w połowie. Porządkowanie narzędzi zamiast pracy to też prokrastynacja — tylko w przebraniu.',
        pEn: '"Just checking email" is the classic entry into the switching spiral. No session goal means your brain will pick one halfway through. Tidying tools instead of working is procrastination in disguise.',
      },
    ],
    sourcesPl: ['Rubinstein, Meyer i Evans, 2001 (Journal of Experimental Psychology — koszt przełączania)', 'Gollwitzer, 1999 (intencje implementacyjne)', 'Masicampo i Baumeister, 2011 (plany a pamięć robocza)'],
    sourcesEn: ['Rubinstein, Meyer & Evans, 2001 (JEP — switching cost)', 'Gollwitzer, 1999 (implementation intentions)', 'Masicampo & Baumeister, 2011 (plans and working memory)'],
  },
  'pre-work-stress': {
    id: 'pre-work-stress',
    topicId: 'wellbeing',
    titlePl: 'Stres przed startem: trzy techniki',
    titleEn: 'Pre-start stress: three techniques',
    introPl: 'Dreszcz przed trudnym zadaniem to fizjologia, nie słabość. Da się go obniżyć w dwie minuty — bez uzależniania się od motywacji.',
    introEn: 'The jitters before a hard task are physiology, not weakness. You can lower them in two minutes — without depending on motivation.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Podwójny wydech (długi wydech po wdechu) to najszybszy znany sposób na obniżenie pobudzenia — działa bezpośrednio na układ przywspółczulny. Reframing pobudzenia jako „ekscytacji" poprawia wyniki pod presją. A odkładanie jest ucieczką od emocji — pierwszy krok przerywa pętlę.',
        pEn: 'A double exhale (long out-breath after the in-breath) is the fastest known way to lower arousal — it acts directly on the parasympathetic system. Reappraising arousal as "excitement" improves performance under pressure. Procrastination is escaping a feeling — the first step breaks the loop.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Trzy podwójne wydechy: wdech nosem, krótki drugi wdech, długi wydech ustami. 2. Nazwij emocję jednym zdaniem: „czuję presję, bo to się liczy". 3. Przeformułuj: „to nie stres, to gotowość". 4. Zacznij od dwóch minut najtrudniejszej części — najtrudniejsze jest zacząć, nie skończyć.',
        pEn: '1. Three double exhales: inhale through the nose, a short second inhale, a long exhale through the mouth. 2. Name the feeling in one sentence: "I feel pressure because this matters". 3. Reframe: "not stress — readiness". 4. Start with two minutes of the hardest part — starting is the hard part, not finishing.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Tłumienie emocji wzmacnia je — nazwanie działa lepiej niż udawanie. Czekanie na „odpowiedni nastrój" to najdłuższa droga do zaczęcia. Kawa przed trudnym zadaniem dodaje pobudzenia tam, gdzie chcesz je zdjąć.',
        pEn: 'Suppressing feelings amplifies them — naming beats pretending. Waiting for the right mood is the longest way to start. Coffee before a hard task adds arousal where you want to subtract it.',
      },
    ],
    sourcesPl: ['Balban i in., 2023 (Cell Reports Medicine — oddech cykliczny a nastrój)', 'Jamieson i in., 2010 (reframing pobudzenia)', 'Sirois i Pychyl, 2013 (prokrastynacja jako regulacja emocji)'],
    sourcesEn: ['Balban et al., 2023 (Cell Reports Medicine — cyclic sighing and mood)', 'Jamieson et al., 2010 (arousal reappraisal)', 'Sirois & Pychyl, 2013 (procrastination as emotion regulation)'],
  },
  'trainable-attention': {
    id: 'trainable-attention',
    topicId: 'mindfulness',
    titlePl: 'Uwaga jest trenowalna: 10 minut dziennie',
    titleEn: 'Attention is trainable: 10 minutes a day',
    introPl: 'Koncentracja nie jest darem — to umiejętność z udokumentowanym treningiem. Dziesięć minut dziennie przez dwa tygodnie daje mierzalne efekty.',
    introEn: 'Focus is not a gift — it is a skill with documented training. Ten minutes a day for two weeks produces measurable gains.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Trening uważności poprawia pamięć roboczą i wyniki testów uwagi już po dwóch tygodniach krótkiej codziennej praktyki. Kluczowy jest moment, w którym zauważasz, że odpłynąłeś — ten „powrót" jest powtórzeniem, dokładnie jak w treningu siłowym.',
        pEn: 'Mindfulness training improves working memory and attention test scores after just two weeks of brief daily practice. The key moment is noticing you drifted — that "return" is a repetition, exactly like in strength training.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. 10 minut dziennie o stałej porze: siedzisz, obserwujesz oddech. 2. Licz oddechy od 1 do 10 i zaczynaj od nowa. 3. Gdy odpłyniesz — wróć do 1. Bez oceniania; rozproszenie to materiał treningowy, nie porażka. 4. Przenieś na sesję: trzy świadome oddechy przed Start.',
        pEn: '1. Ten minutes daily at a fixed time: sit, watch the breath. 2. Count breaths 1 to 10 and restart. 3. When you drift — return to 1. Without judgement; distraction is the training material, not failure. 4. Transfer it to sessions: three conscious breaths before Start.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Cel „pusta głowa" jest błędny — celem jest zauważanie i powrót. Aplikacje z dzwonkami co 30 sekund uczą czekania na bodziec. Trening tylko „gdy jest trudno" nie buduje nawyku — stała pora wygrywa.',
        pEn: 'The goal of an "empty mind" is wrong — the goal is noticing and returning. Apps with a bell every 30 seconds teach waiting for a stimulus. Practising only "when it gets hard" builds no habit — a fixed time wins.',
      },
    ],
    sourcesPl: ['Mrazek i in., 2013 (Psychological Science — trening uważności a pamięć robocza)', 'Tang i in., 2007 (PNAS — IBMT po 5 dniach)', 'Zeidan i in., 2010 (krótka praktyka uważności)'],
    sourcesEn: ['Mrazek et al., 2013 (Psychological Science — mindfulness training and working memory)', 'Tang et al., 2007 (PNAS — IBMT after 5 days)', 'Zeidan et al., 2010 (brief mindfulness practice)'],
  },
}

export function articlesForTopic(topicId: TopicId): Article[] {
  return Object.values(ARTICLES).filter((a) => a.topicId === topicId)
}

export function articleById(topicId: TopicId, articleId: string): Article | null {
  const a = ARTICLES[articleId]
  return a && a.topicId === topicId ? a : null
}

export function readMinutes(article: Article, lang: 'pl' | 'en'): number {
  const words = [article.introPl, ...article.sections.map((s) => s.pPl), ...article.sourcesPl].join(' ').split(/\s+/).length
  return Math.max(1, Math.round(words / (lang === 'pl' ? 180 : 200)))
}
