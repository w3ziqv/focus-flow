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
  'memory-palace': {
    id: 'memory-palace',
    topicId: 'learning',
    titlePl: 'Pałac pamięci: technika, której używają mistrzowie',
    titleEn: 'The memory palace: what champions use',
    introPl: 'Mistrzowie zapamiętywania nie mają lepszego mózgu — mają technikę. Pałac pamięci zamienia abstrakcyjne listy w obrazy rozmieszczone w znanym ci miejscu.',
    introEn: 'Memory champions do not have better brains — they have a technique. The memory palace turns abstract lists into images placed inside a place you know.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Mózg zapamiętuje przestrzeń i obrazy znacznie lepiej niż abstrakcyjne fakty — to ewolucyjne odziedzictwo. Badania nad mistrzami pamięci pokazują, że po tygodniach treningu zwykli ludzie podwajają wyniki, a skany mózgu zmieniają się w stronę sieci przestrzennych.',
        pEn: 'The brain encodes space and images far better than abstract facts — an evolutionary inheritance. Studies of memory athletes show that after weeks of training ordinary people double their results, and brain scans shift toward spatial networks.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Wybierz znaną trasę — mieszkanie, drogę do szkoły. 2. Wyodrębnij 10 punktów w stałej kolejności (drzwi, wieszak, kuchnia…). 3. Każdą informację zamień w absurdalny, ruchomy obraz i „połóż" go w punkcie. 4. Przejdź trasę w wyobraźni 2–3 razy. 5. Następnego dnia przejdź trasę ponownie — i po tygodniu.',
        pEn: '1. Pick a familiar route — your flat, the way to school. 2. Extract 10 stops in a fixed order (door, coat rack, kitchen…). 3. Turn each fact into an absurd, moving image and "place" it at a stop. 4. Walk the route in your mind 2–3 times. 5. Walk it again the next day — and a week later.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Zbyt wielu informacji w jednym punkcie — jedna karta, jeden obraz. Znajome obrazy nie działają: im dziwniejszy obraz, tym mocniejszy ślad. Trasa „wymyślona na szybko" rozpada się — używaj miejsc, które znasz na pamięć.',
        pEn: 'Too many facts per stop — one stop, one image. Familiar images do not work: the stranger the image, the stronger the trace. An improvised route falls apart — use places you know by heart.',
      },
    ],
    sourcesPl: ['Dresler i in., 2017 (Neuron — trening pamięci i zmiany w mózgu)', 'Maguire i in., 2003 (mistrzowie pamięci)', 'Yates, „Remember It" (2019)'],
    sourcesEn: ['Dresler et al., 2017 (Neuron — memory training and brain changes)', 'Maguire et al., 2003 (superior memorisers)', 'Yates, "Remember It" (2019)'],
  },
  'off-screen-breaks': {
    id: 'off-screen-breaks',
    topicId: 'break',
    titlePl: 'Poza ekranem: co robić w dłuższej przerwie',
    titleEn: 'Off-screen: what to do in a longer break',
    introPl: 'Krótkie przerwy resetują uwagę, a dłuższe — przywracają ją na poziomie, którego ekran nigdy nie da. Kluczem jest natura i zmiana otoczenia.',
    introEn: 'Short breaks reset attention; longer ones restore it to a level no screen can. The keys are nature and a change of scenery.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Teoria odzyskiwania uwagi (ART) mówi: otoczenie naturalne angażuje uwagę w trybie „miękkim", pozwalając mechanizmom skupienia się zregenerować. Badania nad spacerem w parku pokazały poprawę pamięci roboczej nawet o 20% względem spaceru po mieście.',
        pEn: 'Attention Restoration Theory says natural environments engage attention in a "soft" mode, letting focus mechanisms recover. Research on park walks showed working-memory gains of up to 20% compared with urban walks.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. W przerwie 15–30 minut wyjdź na zewnątrz — najlepszy park lub drzewa, ale ulica też wygrywa z pobytem w środku. 2. Zostaw telefon w kieszeni. 3. Idź bez celu — nie „produktywnie". 4. Wróć 5 minut przed startem i zapisz jeden cel kolejnej sesji.',
        pEn: '1. In a 15–30 minute break go outside — a park or trees is best, but any street beats staying inside. 2. Leave the phone in your pocket. 3. Walk without a goal — not "productively". 4. Return 5 minutes before the next session and write one goal for it.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: '„Przerwa" z telefonem w ręce to zmiana bodźców, nie odpoczynek. Gry i seriale angażują dokładnie te mechanizmy, które mają odpocząć. Przerwa bez ruchu jest lepsza niż żadna, ale ruch wygrywa.',
        pEn: 'A "break" with a phone in hand is a stimulus change, not rest. Games and shows engage exactly the mechanisms that need recovery. A break without movement beats nothing, but movement wins.',
      },
    ],
    sourcesPl: ['Berman, Jonides i Kaplan, 2008 (Psychological Science — natura a uwaga)', 'Kaplan, 1995 (teoria odzyskiwania uwagi)'],
    sourcesEn: ['Berman, Jonides & Kaplan, 2008 (Psychological Science — nature and attention)', 'Kaplan, 1995 (Attention Restoration Theory)'],
  },
  'caffeine-alcohol-sleep': {
    id: 'caffeine-alcohol-sleep',
    topicId: 'sleep',
    titlePl: 'Kofeina, alkohol i sen: co naprawdę robią',
    titleEn: 'Caffeine, alcohol and sleep: what they really do',
    introPl: 'Dwie najpopularniejsze „pomoce" dla zmęczonego mózgu niszczą sen po cichu. Warto znać mechanizm, bo objawy pojawiają się dopiero następnego dnia.',
    introEn: 'The two most popular crutches for a tired brain quietly damage sleep. It helps to know the mechanism — the symptoms only show up the next day.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Kofeina blokuje adenozyne — sygnał zmęczenia — ale nie usuwa jej; połowa pozostaje w organizmie po ~5 godzinach. Alkohol przyspiesza zasypianie, ale rozkręca sen w drugiej połowie nocy i tłumi fazę REM, odpowiedzialną za konsolidację emocji.',
        pEn: 'Caffeine blocks adenosine — the fatigue signal — without removing it; half is still in your body after ~5 hours. Alcohol speeds up falling asleep but fragments the second half of the night and suppresses REM, which handles emotional consolidation.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Ustaw osobistą godzinę graniczną: 6–8 godzin przed snem. 2. Po południu zamień kawę na wodę lub herbatę ziołową. 3. Alkoholu unikaj w dni nauki — „pomaga zasnąć, psuje przespanie". 4. Jeśli czujesz senność rano, to sygnał długu, nie lenistwa — odpowiedzią jest wcześniejsza pora, nie espresso.',
        pEn: '1. Set a personal cutoff: 6–8 hours before bed. 2. Swap afternoon coffee for water or herbal tea. 3. Skip alcohol on study days — "it helps you fall asleep, ruins being asleep". 4. Morning sleepiness signals sleep debt, not laziness — the answer is an earlier bedtime, not espresso.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: '„Znasz swój organizm" — badania pokazują, że subiektywne odczucie nie łapie obiektywnego pogorszenia snu. Energie drinki łączą kofeinę z cukrem w najgorszej proporcji. Naprawianie snu melatoniną pomija przyczynę.',
        pEn: '"I know my body" — research shows subjective feelings miss objective sleep damage. Energy drinks combine caffeine and sugar in the worst ratio. Fixing sleep with melatonin skips the cause.',
      },
    ],
    sourcesPl: ['Drake i in., 2013 (Journal of Clinical Sleep Medicine)', 'Ebrahim i in., 2013 (meta-analiza: alkohol i sen)', 'Institute of Medicine — raport o kofeinie'],
    sourcesEn: ['Drake et al., 2013 (Journal of Clinical Sleep Medicine)', 'Ebrahim et al., 2013 (meta-analysis: alcohol and sleep)', 'Institute of Medicine — caffeine report'],
  },
  'hydration-habits': {
    id: 'hydration-habits',
    topicId: 'food',
    titlePl: 'Nawodnienie: najtańszy booster koncentracji',
    titleEn: 'Hydration: the cheapest focus booster',
    introPl: 'Utrata zaledwie 1–2% wody w ciele obniża uwagę i pamięć roboczą — a poczujesz pragnienie dopiero po tym progu. Woda jest więc pierwszą dźwignią koncentracji.',
    introEn: 'Losing just 1–2% of body water lowers attention and working memory — and you feel thirsty only past that point. Water is the first lever of focus.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Mózg jest w około 75% wodą; niedobór zaburza transport substancji odżywczych i termoregulację, co odczuwasz jako ból głowy, rozdrażnienie i mgłę. Badania pokazują spadek wydajności w zadaniach uwagowych już przy lekkim odwodnieniu.',
        pEn: 'The brain is roughly 75% water; a deficit disrupts nutrient transport and thermoregulation — you feel it as headache, irritability and brain fog. Studies show performance drops in attention tasks even with mild dehydration.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Szklanka wody zaraz po przebudzeniu — noc to 8 godzin bez płynów. 2. Butelka na biurku: widok przypomina lepiej niż pamięć. 3. Szklanka wody w każdej przerwie pomodoro. 4. Kolor moczu to prosty wskaźnik: jasny = dobrze, ciemny = pij.',
        pEn: '1. A glass of water right after waking — the night is 8 hours without fluids. 2. A bottle on the desk: seeing beats remembering. 3. A glass of water in every pomodoro break. 4. Urine colour is a simple gauge: pale = fine, dark = drink.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Słodkie napoje „dodają" płyny, ale z krzywą cukru w pakiecie. Picie litrów na raz nie działa — nadmiar po prostu wydalisz. Kawa odwadnia dopiero w dużych ilościach, ale nie zastępuje wody.',
        pEn: 'Sugary drinks add fluids with a sugar curve attached. Drinking a litre at once does not work — the excess simply leaves. Coffee dehydrates only in large amounts, but it does not replace water.',
      },
    ],
    sourcesPl: ['Popkin i in., 2010 (Nutrition Reviews — woda i organizm)', 'Ritz i Berrut, 2005 (odwodnienie a funkcje poznawcze)', 'Ganio i in., 2011 (odwodnienie 1–2% i uwaga)'],
    sourcesEn: ['Popkin et al., 2010 (Nutrition Reviews — water and the body)', 'Ritz & Berrut, 2005 (dehydration and cognitive function)', 'Ganio et al., 2011 (1–2% dehydration and attention)'],
  },
  'deep-work-blocks': {
    id: 'deep-work-blocks',
    topicId: 'productivity',
    titlePl: 'Bloki głębokiej pracy: jak je budować',
    titleEn: 'Deep-work blocks: how to build them',
    introPl: 'Głęboka praca to sesje, w których myślisz najtrudniejsze myśli bez przełączeń. To umiejętność trenowalna — a kalendarz jest jej narzędziem, nie lista zadań.',
    introEn: 'Deep work is time spent thinking hard without switching. It is a trainable skill — and the calendar is its tool, not the to-do list.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Po przełączeniu zadania „resztki uwagi" z poprzedniego tematu osłabiają pracę nad następnym — nawet jeśli nie odpisałeś na maila. Zaplanowany w kalendarzu blok eliminuje decyzję „co teraz" i broni czas przed innymi.',
        pEn: 'After switching tasks, "attention residue" from the previous topic weakens work on the next — even if you never replied to the email. A calendar-scheduled block removes the "what now" decision and defends time from others.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Znajdź w kalendarzu 2 stałe bloki 90 minut — najlepiej rano. 2. Zablokuj je z tytułem konkretnego projektu, nie „praca". 3. Telefon poza zasięgiem wzroku — widok telefonu sam w sobie obniża zdolności poznawcze. 4. Po bloku 5 minut notatek: gdzie jestem, co dalej.',
        pEn: '1. Find two recurring 90-minute blocks in your calendar — mornings are best. 2. Book them with a concrete project title, not "work". 3. Phone out of sight — the mere presence of a phone lowers cognitive capacity. 4. After each block, 5 minutes of notes: where I am, what is next.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Blok bez konkretu zamieni się w „oddychanie" w mediach społecznościowych. Elastyczne „kiedy się znajdzie czas" nigdy się nie znajduje. Wielogodzinne bloki bez przerw obniżają jakość — 90 minut to realny limit',
        pEn: 'A block without a concrete goal turns into social-media breathing. Flexible "when I find time" never gets found. Multi-hour blocks without breaks lower quality — 90 minutes is a real ceiling.',
      },
    ],
    sourcesPl: ['Leroy, 2009 (Organizational Behavior and Human Decision Processes — resztki uwagi)', 'Ward i in., 2017 (Journal of the Association for Consumer Research — telefon w zasięgu wzroku)', 'Newport, „Deep Work" (2016)'],
    sourcesEn: ['Leroy, 2009 (Organizational Behavior and Human Decision Processes — attention residue)', 'Ward et al., 2017 (JACR — mere presence of a phone)', 'Newport, "Deep Work" (2016)'],
  },
  'self-compassion': {
    id: 'self-compassion',
    topicId: 'wellbeing',
    titlePl: 'Samowspółczucie działa lepiej niż napędzanie się',
    titleEn: 'Self-compassion beats self-criticism',
    introPl: 'Paradoks z badań: osoby, które po porażce traktują siebie życzliwie, osiągają więcej niż te, które się gonią. Samowspółczucie to nie pobłażanie — to lepsze paliwo.',
    introEn: 'The research paradox: people who treat themselves kindly after failure achieve more than those who push harder. Self-compassion is not indulgence — it is better fuel.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Samokrytyka uruchamia system obronny: wstyd i unikanie. Samowspółczucie obniża poczucie zagrożenia, więc trudne zadanie przestaje być „groźne" — a prokrastynacja jest właśnie ucieczką od emocji. Życzliwy wewnętrzny głos zmniejsza odkładanie na później.',
        pEn: 'Self-criticism triggers the defence system: shame and avoidance. Self-compassion lowers threat, so a hard task stops feeling "dangerous" — and procrastination is exactly that escape. A kind inner voice reduces postponement.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Po złej sesji nazwij fakt bez oceny: „dziś poszło słabo". 2. Dodaj wspólną ludzką perspektywę: „każdy ma takie dni". 3. Zadaj pytanie: „co bym powiedział przyjacielowi w tej sytuacji?" — i powiedz to sobie. 4. Zaplanuj jedną małą naprawę, nie karę.',
        pEn: '1. After a bad session, state the fact without judgement: "today went badly". 2. Add common humanity: "everyone has days like this". 3. Ask: "what would I say to a friend in this situation?" — and say it to yourself. 4. Plan one small repair, not a punishment.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Pobłażanie to co innego: samowspółczucie bez zmiany zachowania to usprawiedliwienie. Kary i „zasłużone" wydłużone sesje budzą awersję do samego timera. Porównywanie się do cudzych najlepszych dni to fałszywy punkt odniesienia.',
        pEn: 'Indulgence is different: self-compassion without behaviour change is an excuse. Punishments and "deserved" marathon sessions build aversion to the timer itself. Comparing yourself to other people\'s best days is a false baseline.',
      },
    ],
    sourcesPl: ['Neff, 2003 (Self and Identity — konstrukta samowspółczucia)', 'Sirois, 2014 (Self and Identity — samowspółczucie a prokrastynacja)'],
    sourcesEn: ['Neff, 2003 (Self and Identity — self-compassion construct)', 'Sirois, 2014 (Self and Identity — self-compassion and procrastination)'],
  },
  'mindfulness-daily': {
    id: 'mindfulness-daily',
    topicId: 'mindfulness',
    titlePl: 'Uważność poza poduszką: codzienne czynności',
    titleEn: 'Mindfulness off the cushion: daily activities',
    introPl: 'Formalna praktyka to fundament, ale uwaga trenuje się też w codziennych czynnościach — myciu naczyń, jedzeniu, chodzeniu. To most między 10 minutami a całym dniem.',
    introEn: 'Formal practice is the foundation, but attention also trains in daily activities — washing dishes, eating, walking. This is the bridge between 10 minutes and the whole day.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Trening uważności działa na mechanizm, nie na rytuał: zauważ rozproszenie → wróć. Każda codzienna czynność to seria takich powtórzeń, więc dzień staje się dodatkową sesją treningową zamiast przerwą od treningu.',
        pEn: 'Mindfulness training targets a mechanism, not a ritual: notice drift → return. Every daily activity is a series of such repetitions, so the day becomes an extra training session instead of a break from training.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Wybierz jedną stałą czynność dziennie (mycie zębów, kawa) i rób ją w pełnej uwadze przez tydzień. 2. Podczas jedzenia odłóż telefon — zauważ smak, fakturę, temperaturę. 3. Chodząc między pokojami, poczuj stopy. 4. Przed sesją: trzy świadome oddechy i jedno zdanie celu.',
        pEn: '1. Pick one daily activity (brushing teeth, coffee) and do it with full attention for a week. 2. While eating, put the phone away — notice taste, texture, temperature. 3. Walking between rooms, feel your feet. 4. Before a session: three conscious breaths and one sentence of goal.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Uważność nie jest wymówką do zwolnienia — to rozgrzewka, nie sesja. Sprawdzanie telefonu „tylko na chwilę" w trakcie uważnej czynności zrywa całą nitkę. Idealizm „od jutra" nie działa — zacznij od jednej czynności.',
        pEn: 'Mindfulness is not an excuse to slow down work — it is a warm-up, not the session. Checking the phone "just for a second" during a mindful activity snaps the whole thread. Idealism "from tomorrow" does not work — start with one activity.',
      },
    ],
    sourcesPl: ['Kabat-Zinn, „Full Catastrophe Living" (1990)', 'Zeidan i in., 2010 (krótka praktyka uważności)', 'Tang i in., 2007 (PNAS — IBMT)'],
    sourcesEn: ['Kabat-Zinn, "Full Catastrophe Living" (1990)', 'Zeidan et al., 2010 (brief mindfulness practice)', 'Tang et al., 2007 (PNAS — IBMT)'],
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

export function totalReadMinutesForTopic(topicId: TopicId, lang: 'pl' | 'en'): number {
  return articlesForTopic(topicId).reduce((acc, a) => acc + readMinutes(a, lang), 0)
}
