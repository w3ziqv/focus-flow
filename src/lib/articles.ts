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
        pPl: 'Blok bez konkretu zamieni się w „oddychanie" w mediach społecznościowych. Elastyczne „kiedy się znajdzie czas" nigdy się nie znajduje. Wielogodzinne bloki bez przerw obniżają jakość — 90 minut to realny limit.',
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
  'interleaving-practice': {
    id: 'interleaving-practice',
    topicId: 'learning',
    titlePl: 'Przeplatanie materiału: dlaczego bloki dają złudzenie nauki',
    titleEn: 'Interleaved practice: why blocked study is an illusion',
    introPl: 'Uczenie się jednego tematu przez kilka godzin daje szybkie poczucie biegłości, które błyskawicznie znika. Przeplatanie różnych kategorii problemów zmusza mózg do aktywnego dobierania strategii, budując trwałą strukturę wiedzy.',
    introEn: 'Studying one topic for hours creates a quick feeling of mastery that evaporates just as quickly. Interleaving distinct problem categories forces the brain to actively select strategies, building durable knowledge structures.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'W nauce blokowej (AAAA, BBBB) mózg po pierwszym zadaniu przestaje decydować, jakiej metody użyć — wykonuje jedynie mechaniczną procedurę. Przeplatanie (ABAB, CDCD) wprowadza pożądaną trudność: przy każdym kolejnym problemie musisz najpierw rozpoznać jego strukturę głęboką, a dopiero potem dobrać rozwiązanie. Badania pokazują, że choć podczas sesji przeplatanej popełnia się więcej błędów, retencja po tygodniu jest nawet o kilkadziesiąt procent wyższa niż przy nauce blokowej.',
        pEn: 'In blocked practice (AAAA, BBBB), after the first problem the brain stops deciding which method to apply — it merely executes mechanical procedures. Interleaving (ABAB, CDCD) introduces desirable difficulty: with each problem you must first diagnose its deep structure before retrieving the right solution. Research demonstrates that despite higher error rates during the practice session, retention after one week is dramatically higher than with blocked study.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Wybierz 2–3 pokrewne, ale odrębne zagadnienia na dany blok nauki (np. dwa różne typy równań lub dwie koncepcje gramatyczne). 2. Ustaw sesję Focus Flow na 25 minut. 3. Wymieszaj zadania w losowej kolejności, zamiast rozwiązywać je rozdział po rozdziale. 4. Przy każdym zadaniu nazwij na głos lub zapisz regułę, dlaczego wybierasz daną metodę. 5. W 5-minutowej przerwie zweryfikuj wyłącznie trafność wybranej strategii, nie tylko poprawność wyniku liczbowego.',
        pEn: '1. Select 2–3 related but distinct topics for your study block (such as two equation types or grammatical structures). 2. Set a 25-minute Focus Flow session. 3. Shuffle problems in a random sequence instead of working chapter by chapter. 4. For each problem, write down or state aloud why this specific method applies. 5. In the 5-minute break, check whether your diagnosis of the method was correct, not just the final calculation.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie mieszaj zagadnień zupełnie ze sobą niezwiązanych (np. słówek z hiszpańskiego z fizyką kwantową w jednym zadaniu) — przeplatanie działa najsilniej na pojęcia łatwe do pomylenia. Nie poddawaj się frustracji wolniejszego tempa: wysiłek odróżniania to moment, w którym faktycznie powstaje wiedza. Unikaj powrotu do bloków tylko dlatego, że dają przyjemniejsze poczucie płynności.',
        pEn: 'Avoid mixing completely unrelated domains (such as Spanish vocabulary and quantum mechanics in one problem set) — interleaving works best on concepts that are easily confused. Do not surrender to the frustration of slower perceived progress: the effort of discrimination is where learning actually happens. Avoid retreating to blocked practice merely because it feels smoother.',
      },
    ],
    sourcesPl: [
      'Rohrer i Taylor, 2007 (Instructional Science — The shuffling of mathematics problems improves learning)',
      'Kornell i Bjork, 2008 (Psychological Science — Learning concepts and categories: is spacing the "enemy of induction"?)',
      'Dunlosky i in., 2013 (Psychological Science in the Public Interest — Improving students’ learning)',
    ],
    sourcesEn: [
      'Rohrer & Taylor, 2007 (Instructional Science — The shuffling of mathematics problems improves learning)',
      'Kornell & Bjork, 2008 (Psychological Science — Learning concepts and categories: is spacing the "enemy of induction"?)',
      'Dunlosky et al., 2013 (Psychological Science in the Public Interest — Improving students’ learning)',
    ],
  },
  'dual-coding': {
    id: 'dual-coding',
    topicId: 'learning',
    titlePl: 'Podwójne kodowanie: słowa i obrazy w pamięci roboczej',
    titleEn: 'Dual coding: words and visuals in working memory',
    introPl: 'Mózg przetwarza informacje werbalne i wizualne przez dwa niezależne kanały sensoryczne. Połączenie słowa z przestrzennym schematem podwaja szansę na odtworzenie wiedzy bez przeciążania pamięci roboczej.',
    introEn: 'The human brain processes verbal and visual information through two distinct cognitive channels. Coupling words with spatial diagrams doubles retrieval pathways without overloading working memory capacity.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Zgodnie z teorią podwójnego kodowania Allana Paivio, system poznawczy operuje na dwóch odrębnych podsystemach: werbalnym (logogeny) i niewerbalnym (imageny). Gdy informacja jest zakodowana jednocześnie tekstem i powiązanym z nim schematem, w korze mózgowej powstają dwa komplementarne ślady pamięciowe. Uruchomienie jednego automatycznie aktywuje drugi, co ułatwia przypominanie i dramatycznie redukuje obciążenie poznawcze przy złożonych pojęciach.',
        pEn: 'According to Allan Paivio’s Dual Coding Theory, human cognition operates through two independent subsystems: verbal (logogens) and non-verbal (imagens). When information is encoded simultaneously via text and a structurally aligned diagram, the cortex establishes two complementary memory traces. Activating one automatically primes the other, facilitating recall and substantially reducing cognitive load during complex reasoning.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Po przeczytaniu fragmentu tekstu w sesji skupienia odłóż notatki. 2. Weź czystą kartkę i narysuj prosty model relacji: osie czasu, schemat blokowy zależności lub graf przyczynowo-skutkowy. 3. Ogranicz tekst na rysunku do kluczowych pojęć i strzałek kierunkowych. 4. Spróbuj opowiedzieć na głos całą ideę, prowadząc palcem po własnym schemacie. 5. Skonfrontuj rysunek ze źródłem i uzupełnij brakujące węzły innym kolorem.',
        pEn: '1. After reading an informational section in a focus session, set your reading material aside. 2. Take a blank sheet and draw a simple relationship model: timelines, flowchart arrows, or a cause-and-effect graph. 3. Limit words on your sketch to essential terminology and directional arrows. 4. Explain the concept out loud while tracing connections across your diagram with your finger. 5. Compare your diagram against the source text and add missing links in a contrasting color.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie twórz skomplikowanych dzieł sztuki — estetyka rysunku nie ma znaczenia, liczy się wyłącznie relacja logiczna między elementami. Unikaj ozdobników i ikon dekoracyjnych, które nie niosą informacji merytorycznej (tzw. uwodzące detale). Nie kopiuj gotowych infografik bez ich wcześniejszego samodzielnego przetrawienia i zrekonstruowania.',
        pEn: 'Do not treat diagrams as artwork — aesthetic elegance is irrelevant; only logical relationships between nodes matter. Avoid decorative embellishments and illustrations that convey no conceptual meaning (seductive details). Never copy pre-made infographics passively without first attempting to reconstruct the relations independently.',
      },
    ],
    sourcesPl: [
      'Paivio, 1991 (Dual Coding Theory and Education, Oxford University Press)',
      'Clark i Paivio, 1991 (Educational Psychology Review — Dual coding theory and education)',
      'Mayer i Anderson, 1992 (Journal of Educational Psychology — Animation and constructive learning)',
    ],
    sourcesEn: [
      'Paivio, 1991 (Dual Coding Theory and Education, Oxford University Press)',
      'Clark & Paivio, 1991 (Educational Psychology Review — Dual coding theory and education)',
      'Mayer & Anderson, 1992 (Journal of Educational Psychology — Animation and constructive learning)',
    ],
  },
  'nsdr-recovery': {
    id: 'nsdr-recovery',
    topicId: 'break',
    titlePl: 'Głęboki odpoczynek bez snu: protokół NSDR',
    titleEn: 'Non-Sleep Deep Rest: the NSDR recovery protocol',
    introPl: 'Stan hipnagogiczny pomiędzy czuwaniem a snem pozwala na szybkie odnowienie dopaminy i zresetowanie przeciążonych obwodów uwagi. 10 do 20 minut NSDR przywraca sprawność poznawczą bez rozbicia po drzemce.',
    introEn: 'The hypnagogic state between waking and sleep accelerates dopamine replenishment and resets fatigued attentional circuits. 10 to 20 minutes of NSDR restores cognitive vigor without the grogginess of sleep inertia.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Protokół NSDR (Non-Sleep Deep Rest), wywodzący się z jogi nidry, sprowadza aktywność mózgu do fal alfa i teta przy zachowaniu pełnej świadomości sensorycznej. Badania obrazowe mózgu (PET) wykazały, że stan ten zwiększa uwalnianie dopaminy w prążkowiu nawet o 65%, regenerując zasoby neuroprzekaźnika odpowiedzialnego za motywację i utrzymanie wysiłku poznawczego. Obniża również poziom kortyzolu i przywraca równowagę autonomiczną.',
        pEn: 'NSDR (Non-Sleep Deep Rest), derived from yoga nidra practices, guides cortical oscillations into alpha and theta rhythms while maintaining conscious awareness. PET neuroimaging confirms that this state boosts striatal dopamine release by up to 65%, replenishing neurochemical pools vital for motivation and cognitive control. Simultaneously, systemic cortisol decreases while parasympathetic tone stabilizes.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. W dłuższej przerwie pomodoro (15–20 minut) połóż się na plecach lub usiądź w wygodnym fotelu z podparciem karku. 2. Załóż opaskę na oczy lub zgaś ostre światło w pokoju. 3. Weź 3 głębokie podwójne wdechy nosem z wydłużonym wydechem ustami, aby spowolnić tętno. 4. Przeskanuj mentalnie ciało od czubka głowy do palców stóp, świadomie rozluźniając żuchwę, powieki i dłonie. 5. Utrzymuj bierną postawę obserwatora — jeśli pojawią się myśli, pozwól im odpłynąć bez angażowania uwagi.',
        pEn: '1. In an extended pomodoro break (15–20 minutes), lie down flat or sit in a supportive reclining chair. 2. Cover your eyes with an eye mask or darken the room. 3. Take 3 slow double inhales through the nose followed by prolonged mouth exhales to decelerate heart rate. 4. Mentally scan through body regions from scalp to toes, releasing tension in your jaw, eyelids, and hands. 5. Maintain detached witness awareness — when thoughts surface, allow them to drift past without mental pursuit.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie staraj się zasnąć na siłę — celem NSDR jest relaksacja przy zachowanej świadomości, a nie sen wolnofalowy (NREM 3), który wywołuje inercję senną. Nie sprawdzaj powiadomień w trakcie ani bezpośrednio po zakończeniu sesji. Unikaj pozycji, które powodują drętwienie kończyn lub napięcie karku.',
        pEn: 'Do not force yourself into sleep — the goal of NSDR is conscious relaxation rather than slow-wave delta sleep, which triggers post-nap grogginess. Do not inspect notifications during or immediately following the session. Avoid ergonomic postures that produce physical numbness or cervical spine tension.',
      },
    ],
    sourcesPl: [
      'Kjaer i in., 2002 (Cognitive Brain Research — Increased dopamine tone during altered consciousness)',
      'Kumar i in., 2013 (Journal of Alternative and Complementary Medicine — Yoga Nidra and autonomic balance)',
      'Huberman, 2021 (Stanford University School of Medicine — NSDR neurobiology protocols)',
    ],
    sourcesEn: [
      'Kjaer et al., 2002 (Cognitive Brain Research — Increased dopamine tone during altered consciousness)',
      'Kumar et al., 2013 (Journal of Alternative and Complementary Medicine — Yoga Nidra and autonomic balance)',
      'Huberman, 2021 (Stanford University School of Medicine — NSDR neurobiology protocols)',
    ],
  },
  'nature-microbreaks': {
    id: 'nature-microbreaks',
    topicId: 'break',
    titlePl: 'Mikro-przerwy z naturą: 40 sekund, które resetuje uwagę',
    titleEn: 'Nature micro-breaks: 40 seconds to reset attention',
    introPl: 'Już 40 sekund spoglądania na zieleń wystarcza, by zredukować liczbę błędów w kolejnym zadaniu. Mikro-przerwy oparte na naturalnych krajobrazach regenerują korę przedczołową bez odrywania cię od rytmu pracy.',
    introEn: 'Just 40 seconds of viewing green nature suffices to cut error rates in subsequent cognitive tasks. Micro-breaks centered on natural vistas restore the prefrontal cortex without disrupting your workflow cadence.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Koncentracja przy komputerze wymaga uwagi kierowanej (directed attention), kontrolowanej przez korę przedczołową, która ulega fizjologicznemu zmęczeniu. Według teorii odzyskiwania uwagi (ART), kontakt z elementami natury angażuje tzw. miękką fascynację (soft fascination) — mimowolne, bezwysiłkowe przetwarzanie bodźców. Badania Uniwersytetu w Melbourne wykazały, że 40-sekundowa pauza z widokiem na roślinność obniża wariancję czasu reakcji i drastycznie redukuje błędy pominięcia w testach czujności.',
        pEn: 'Desk work relies on directed attention mediated by prefrontal cortical networks, which suffer rapid metabolic fatigue. Under Attention Restoration Theory (ART), natural scenery activates soft fascination — effortless, bottom-up sensory processing. University of Melbourne trials demonstrated that a mere 40-second gaze at a flowering green roof significantly decreased reaction time variability and omission errors on sustained attention tasks.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Gdy timer Focus Flow zasygnalizuje krótką przerwę, natychmiast odwróć wzrok od ekranu i monitora. 2. Podejdź do okna z widokiem na drzewa, park lub rośliny doniczkowe. 3. Skup wzrok na odległym naturalnym punkcie przez minimum 40 sekund, pozwalając spojrzeniu swobodnie dryfować. 4. Jeśli nie masz okna z zielenią, otwórz na biurku widok na żywą roślinę lub wysokiej rozdzielczości fotografię krajobrazu naturalnego. 5. Zwróć uwagę na detale fraktalne: liście, korę drzew lub ruch chmur na niebie.',
        pEn: '1. When the Focus Flow timer announces a short pause, pivot immediately away from your digital displays. 2. Walk to a window facing trees, foliage, or a garden bed. 3. Fix your gaze into the distance for at least 40 seconds, letting your eyes relax and panoramic vision engage. 4. If an outdoor view is unavailable, focus on an indoor potted plant or high-resolution natural landscape photograph. 5. Attend gently to natural fractal patterns: leaf veining, tree canopy motion, or drifting clouds.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie łącz mikro-przerwy z przeglądaniem social mediów lub czytaniem nagłówków informacyjnych na telefonie — teksty natychmiast reaktywują uwagę kierowaną. Unikaj wpatrywania się w geometryczne, betonowe elementy miejskiej zabudowy pozbawione zieleni, które nie wywołują efektu regeneracji. Nie traktuj mikro-przerwy jako straconego czasu: 40 sekund z nawiązką zwraca się w czujności.',
        pEn: 'Do not blend your nature micro-break with scrolling social feeds or reading news notifications — text instantly re-engages directed attention. Avoid staring at stark geometric concrete architecture lacking botanical presence, which fails to trigger restorative processing. Do not discard micro-breaks as unproductive: 40 seconds yields immediate returns in cognitive vigilance.',
      },
    ],
    sourcesPl: [
      'Lee i in., 2015 (Journal of Environmental Psychology — 40-second green roof views sustain attention)',
      'Kaplan, 1995 (Journal of Environmental Psychology — The restorative benefits of nature)',
      'Ulrich i in., 1991 (Journal of Environmental Psychology — Stress recovery during exposure to natural environments)',
    ],
    sourcesEn: [
      'Lee et al., 2015 (Journal of Environmental Psychology — 40-second green roof views sustain attention)',
      'Kaplan, 1995 (Journal of Environmental Psychology — The restorative benefits of nature)',
      'Ulrich et al., 1991 (Journal of Environmental Psychology — Stress recovery during exposure to natural environments)',
    ],
  },
  'adenosine-caffeine-timing': {
    id: 'adenosine-caffeine-timing',
    topicId: 'sleep',
    titlePl: 'Okienko kofeinowe: fizjologia adenozyny i popołudniowy zjazd',
    titleEn: 'The caffeine window: adenosine physiology and the afternoon crash',
    introPl: 'Kofeina nie daje energii — pożycza ją z przyszłości, blokując receptory senności. Zrozumienie krzywej adenozyny pozwala wyeliminować popołudniowy zjazd i zabezpieczyć głęboki sen.',
    introEn: 'Caffeine does not supply energy — it borrows it from the future by occupying fatigue receptors. Mastering your adenosine curve eliminates the afternoon crash and preserves deep restorative sleep.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'W każdej minucie czuwania neurony rozkładają ATP, uwalniając adenozynę, która gromadzi się w mózgu i generuje homeostatyczną presję snu. Kofeina jest antagonistą receptorów adenozynowych A1 i A2A: maskuje uczucie zmęczenia, lecz nie zatrzymuje produkcji cząsteczek adenozyny. Gdy kofeina ulega metabolizmowi w wątrobie przez cytochrom P450, nagromadzona adenozyna gwałtownie wiąże się z receptorami, wywołując nagły zjazd energii. Co więcej, jej okres półtrwania wynosi 5–7 godzin, co oznacza, że popołudniowa kawa niszczy strukturę snu wolnofalowego (faza N3), nawet jeśli zaśniesz bez problemu.',
        pEn: 'During waking hours, neuronal metabolic breakdown of ATP accumulates extracellular adenosine, establishing homeostatic sleep pressure. Caffeine functions as a competitive antagonist at A1 and A2A adenosine receptors: it masks fatigue signals while adenosine molecules continue to build up unimpeded. Once hepatic cytochrome P450 enzymes clear the caffeine, the backed-up pool of adenosine rushes into unoccupied receptors, triggering a severe crash. Furthermore, caffeine’s 5 to 7 hour half-life disrupts slow-wave delta sleep architecture, even if you fall asleep promptly.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Odczekaj 90–120 minut od momentu przebudzenia przed wypiciem pierwszej kawy, pozwalając porannemu wyrzutowi kortyzolu na naturalne usunięcie resztek nocnej adenozyny. 2. Wypij pierwszą dawkę w oknie między 9:30 a 11:00, gdy naturalny poziom kortyzolu zaczyna opadać. 3. Ustal sztywną godzinę odcięcia: dokładnie 8–10 godzin przed planowanym snem (dla snu o 23:00 jest to godzina 13:00–14:00). 4. Gdy o 14:00 dopadnie cię senność, zamiast kolejnego espresso zrób 5-minutowy spacer lub 10 głębokich oddechów na świeżym powietrzu. 5. Ogranicz dobowe spożycie kofeiny do maksymalnie 300–400 mg (około 2–3 filiżanek kawy).',
        pEn: '1. Delay your morning coffee by 90–120 minutes after waking, allowing the cortisol awakening response to clear residual overnight adenosine naturally. 2. Ingest your primary caffeine dose between 9:30 AM and 11:00 AM as baseline cortisol dips. 3. Establish a non-negotiable cutoff time 8–10 hours prior to bedtime (e.g., 1:00 PM to 2:00 PM for an 11:00 PM sleep target). 4. When afternoon lethargy emerges, substitute additional espresso with a 5-minute brisk walk and outdoor hydration. 5. Cap daily caffeine intake at 300–400 mg (approximately 2–3 cups of coffee).',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie sięgaj po kawę w pierwszych minutach po otwarciu oczu — to gwarancja gwałtownego popołudniowego załamania. Unikaj „przełamywania" zmęczenia kofeiną po godzinie 15:00: nawet jeśli subiektywnie zaśniesz, architektura twojego snu głębokiego zostanie zredukowana o 20–30%. Nie ignoruj zawartości kofeiny w przedtreningówkach, napojach typu cola czy ciemnej czekoladzie.',
        pEn: 'Never grab caffeine within minutes of opening your eyes — doing so guarantees an intensified afternoon crash. Avoid powering through late fatigue with caffeine past 3:00 PM: even if you fall asleep, deep slow-wave sleep is truncated by 20–30%. Do not overlook hidden caffeine loads in pre-workout powders, dark chocolate, and sodas.',
      },
    ],
    sourcesPl: [
      'Fredholm i in., 1999 (Pharmacological Reviews — Actions of caffeine in the brain)',
      'Landolt, 2008 (Biochemical Pharmacology — Sleep, adenosine, and caffeine)',
      'Drake i in., 2013 (Journal of Clinical Sleep Medicine — Caffeine effects on sleep taken 0, 3, or 6 hours before bedtime)',
    ],
    sourcesEn: [
      'Fredholm et al., 1999 (Pharmacological Reviews — Actions of caffeine in the brain)',
      'Landolt, 2008 (Biochemical Pharmacology — Sleep, adenosine, and caffeine)',
      'Drake et al., 2013 (Journal of Clinical Sleep Medicine — Caffeine effects on sleep taken 0, 3, or 6 hours before bedtime)',
    ],
  },
  'circadian-light-entrainment': {
    id: 'circadian-light-entrainment',
    topicId: 'sleep',
    titlePl: 'Światło i rytm dobowy: biologia synchronizacji jądra nadskrzyżowaniowego',
    titleEn: 'Light and circadian rhythm: biology of suprachiasmatic entrainment',
    introPl: 'Światło to najsilniejszy zewnętrzny dawca czasu (zeitgeber) dla ludzkiego mózgu. Precyzyjne zarządzanie ekspozycją na fotony rano i wieczorem decyduje o głębokości snu i porannej jasności umysłu.',
    introEn: 'Light is the most potent environmental synchronizer (zeitgeber) for human physiology. Strategic photon exposure in the morning and darkness in the evening dictate sleep depth and morning cognitive clarity.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'W siatkówce oka znajdują się wyspecjalizowane fotoreceptory — wewnętrznie światłoczułe komórki zwojowe (ipRGC), zawierające barwnik melanopsynę. Reagują one najsilniej na niebieskie światło o długości fali ~480 nm i przesyłają bezpośredni sygnał do jądra nadskrzyżowaniowego (SCN) w podwzgórzu — głównego zegara biologicznego organizmu. Poranna dawka jasnego światła natychmiast zatrzymuje produkcję melatoniny, wyzwala zdrowy wyrzut kortyzolu i nastawia zegar na rozpoczęcie syntezy melatoniny około 14 godzin później. Wieczorne światło sztuczne opóźnia ten proces, przesuwając fazę rytmu dobowego i uniemożliwiając wejście w sen głęboki.',
        pEn: 'The human retina houses intrinsically photosensitive retinal ganglion cells (ipRGCs) enriched with the photopigment melanopsin. These cells respond peak-sensitively to blue light (~480 nm) and project directly to the suprachiasmatic nucleus (SCN) in the hypothalamus — the master circadian pacemaker. Morning photon influx halts pineal melatonin release, stimulates the cortisol awakening peak, and starts a biological timer for melatonin resumption roughly 14 hours later. Conversely, evening artificial light delays phase timing and impairs deep sleep architecture.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. W ciągu 30–60 minut od pobudzenia wyjdź na zewnątrz na 10–15 minut bez okularów przeciwsłonecznych (w pochmurny dzień wydłuż ten czas do 20–30 minut). 2. Spoglądaj w stronę nieba (nie bezpośrednio w słońce), aby naświetlić dolną połowę siatkówki. 3. W ciągu dnia pracuj w dobrze doświetlonym pomieszczeniu, najlepiej blisko okna. 4. Po zachodzie słońca wyłącz oświetlenie sufitowe i przełącz się na ciepłe lampy stołowe umieszczone poniżej linii wzroku. 5. Na 60 minut przed snem zredukuj jasność wszystkich ekranów lub całkowicie odłóż urządzenia elektroniczne.',
        pEn: '1. Within 30–60 minutes of waking, step outdoors for 10–15 minutes without sunglasses (extend to 20–30 minutes on overcast mornings). 2. Cast your gaze toward the horizon and sky (never look directly into the sun) to activate melanopsin-rich retinal zones. 3. Work in a brightly illuminated room during daytime hours, ideally proximate to natural daylight. 4. After dusk, switch off high overhead ceiling fixtures and rely on low-level, warm floor or desk lamps below eye level. 5. Dim digital displays to minimum luminosity or power them down 60 minutes prior to sleep.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie próbuj zastępować porannego wyjścia na zewnątrz patrzeniem przez szybę okienną lub samochodową — szkło filtruje kluczowe długości fal i drastycznie zmniejsza liczbę luksów. Unikaj jasnego, chłodnego światła LED w sypialni i łazience po godzinie 21:00. Nie noś okularów przeciwsłonecznych podczas porannego spaceru synchronizującego.',
        pEn: 'Never attempt to substitute outdoor light by looking through window glass or car windshields — glass attenuates essential wavelengths and reduces lux levels multifold. Avoid stark cool-white LED lighting in bathrooms and bedrooms past 9:00 PM. Do not wear sunglasses during your morning circadian calibration walk.',
      },
    ],
    sourcesPl: [
      'Czeisler i in., 1989 (Science — Bright light resets the human circadian pacemaker)',
      'Panda, 2016 (Cell Metabolism — Circadian physiology and metabolic homeostasis)',
      'Duffy i Czeisler, 2009 (Sleep Medicine Clinics — Effect of light on human circadian rhythms)',
    ],
    sourcesEn: [
      'Czeisler et al., 1989 (Science — Bright light resets the human circadian pacemaker)',
      'Panda, 2016 (Cell Metabolism — Circadian physiology and metabolic homeostasis)',
      'Duffy & Czeisler, 2009 (Sleep Medicine Clinics — Effect of light on human circadian rhythms)',
    ],
  },
  'glucose-stability': {
    id: 'glucose-stability',
    topicId: 'food',
    titlePl: 'Krzywa glukozy a uwaga: dlaczego skoki cukru niszczą skupienie',
    titleEn: 'Glucose dynamics and focus: why blood sugar spikes ruin concentration',
    introPl: 'Kora przedczołowa zużywa najwięcej glukozy spośród struktur mózgowych, lecz nie posiada własnych zapasów energii. Gwałtowne wahania cukru we krwi to najczęstsza ukryta przyczyna mgły umysłowej i spadków woli.',
    introEn: 'The prefrontal cortex has the highest metabolic glucose turnover in the brain but possesses virtually zero glycogen storage. Unstable blood sugar spikes and crashes represent the leading hidden cause of brain fog and willpower depletion.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Neurony kory przedczołowej odpowiadające za hamowanie impulsów i pamięć roboczą polegają na stałym napływie glukozy przez barierę krew-mózg za pośrednictwem transporterów GLUT1 i GLUT3. Posiłek bogaty w cukry proste i rafinowaną skrobię powoduje gwałtowny pik glikemiczny, na który trzustka odpowiada masywnym wyrzutem insuliny. Prowadzi to do zjawiska reaktywnej hipoglikemii — poziom glukozy spada poniżej wartości wyjściowej w ciągu 90–120 minut. Mózg odbiera ten spadek jako stan zagrożenia energetycznego, co objawia się dekoncentracją, drażliwością i natrętną chęcią sięgnięcia po przekąskę.',
        pEn: 'Prefrontal cortical neurons governing executive function and working memory depend on an uninterrupted supply of circulating glucose transported across the blood-brain barrier via GLUT1 and GLUT3 transporters. High-glycemic meals trigger rapid glycemic spikes, forcing an aggressive pancreatic insulin response. This prompts reactive hypoglycemia — blood glucose plunging below baseline within 90 to 120 minutes. The brain perceives this rapid drop as an energetic crisis, triggering brain fog, distractibility, and acute food cravings.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Komponuj posiłki przed blokami pracy w oparciu o triadę: białko, błonnik i zdrowe tłuszcze (np. jajka z warzywami lub twaróg z pestkami). 2. Zastosuj zasadę kolejności spożywania: najpierw zjedz warzywa (błonnik), potem białko i tłuszcz, a węglowodany na samym końcu — spłaszcza to krzywą cukrową nawet o 40%. 3. Po obiedzie zrób lekki 10-minutowy spacer: pracujące mięśnie wychwytują glukozę niezależnie od insuliny poprzez translokację transporterów GLUT4 do błony komórkowej. 4. Wyeliminuj słodzone napoje i soki owocowe w godzinach pracy — zastąp je wodą z cytryną lub herbatą zieloną. 5. Jako przekąskę w sesji wybieraj orzechy włoskie lub migdały zamiast batonów zbożowych.',
        pEn: '1. Anchor pre-work meals around the metabolic triad: protein, dietary fiber, and healthy lipids (e.g., eggs with greens or greek yogurt with seeds). 2. Adopt targeted food sequencing: consume vegetables and fiber first, proteins and fats second, and starches or carbohydrates last to flatten the postprandial glucose spike by up to 40%. 3. Take a gentle 10-minute walk after meals: contracting skeletal muscle clears glucose non-insulin-dependently via GLUT4 translocation. 4. Eliminate sweetened drinks and fruit juices during study hours — drink water or unsweetened green tea. 5. Keep raw walnuts or almonds within reach as break snacks rather than processed cereal bars.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie zaczynaj dnia od słodkich śniadań (płatki śniadaniowe, croissanty, dżemy) — skazujesz się na falę zjazdów energetycznych przez cały poranek. Unikaj pracy bezpośrednio po obfitych, ciężkostrawnych obiadach: przekierowanie przepływu krwi do układu trawiennego wywołuje ospałość poposiłkową. Nie ratuj spadku cukru kolejnym ciastkiem — to napędza błędne koło reaktywnej hipoglikemii.',
        pEn: 'Do not launch your morning with high-glycemic breakfasts (processed cereals, pastries, sweetened jams) — doing so locks you into repeated crashes across the day. Avoid tackling complex cognitive tasks right after heavy, carbohydrate-dense meals when splanchnic blood diversion causes postprandial somnolence. Never attempt to rescue an energy slump with sweets — it reinforces the reactive hypoglycemic cycle.',
      },
    ],
    sourcesPl: [
      'Daly i in., 1998 (The American Journal of Clinical Nutrition — Carbohydrates and cognitive function)',
      'Mergenthaler i in., 2013 (Trends in Neurosciences — Sugar for the brain: the role of glucose)',
      'Gailliot i in., 2007 (Journal of Personality and Social Psychology — Self-control and blood glucose)',
    ],
    sourcesEn: [
      'Daly et al., 1998 (The American Journal of Clinical Nutrition — Carbohydrates and cognitive function)',
      'Mergenthaler et al., 2013 (Trends in Neurosciences — Sugar for the brain: the role of glucose)',
      'Gailliot et al., 2007 (Journal of Personality and Social Psychology — Self-control and blood glucose)',
    ],
  },
  'neurotransmitter-nutrition': {
    id: 'neurotransmitter-nutrition',
    topicId: 'food',
    titlePl: 'Paliwo dla neuroprzekaźników: cholina, kwasy omega-3 i magnez',
    titleEn: 'Neurotransmitter precursors: choline, omega-3s, and magnesium',
    introPl: 'Neuroprzekaźniki odpowiedzialne za uwagę, pamięć i spokój nie powstają z próżni — wymagają precyzyjnych prekursorów i kofaktorów dostarczanych z dietą. Odpowiednie składniki odżywcze stabilizują plastyczność synaptyczną.',
    introEn: 'Neurotransmitters governing attention, memory, and calmness cannot form out of thin air — they require specific dietary precursors and enzymatic cofactors. Targeted micronutrition directly fortifies synaptic plasticity.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Acetylocholina, neuroprzekaźnik kluczowy dla skupienia wzroku i kodowania pamięciowego, jest syntetyzowana bezpośrednio z choliny dostarczanej w diecie. Z kolei kwas dokozaheksaenowy (DHA, z rodziny omega-3) stanowi ponad 30% fosfolipidów kory mózgowej — zapewnia płynność błon synaptycznych, niezbędną do sprawnego przesyłania impulsów nerwowych. Magnez natomiast pełni rolę fizjologicznego strażnika receptora NMDA: blokuje nadmierny napływ jonów wapnia do neuronów, chroniąc je przed ekscytotoksycznością i ułatwiając długotrwałe wzmocnienie synaptyczne (LTP), które jest biologiczną podstawą uczenia się.',
        pEn: 'Acetylcholine, the primary neurotransmitter underpinning focal spotlighting and memory encoding, is synthesized directly from dietary choline. Docosahexaenoic acid (DHA, an omega-3 fatty acid) accounts for over 30% of cortical phospholipid architecture, regulating synaptic membrane fluidity and receptor mobility. Meanwhile, magnesium acts as an essential physiological gatekeeper of the NMDA receptor: preventing pathological calcium influx, protecting against excitotoxicity, and enabling long-term potentiation (LTP) — the cellular bedrock of learning.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Wprowadź do jadłospisu bogate źródła choliny: żółtka jaj (1–2 dziennie), soję, wątróbkę lub brokuły. 2. Zadbaj o podaż kwasów omega-3 (zwłaszcza EPA i DHA): jedz tłuste ryby morskie (dziki łosoś, makrela, sardynki) 2–3 razy w tygodniu lub stosuj sprawdzoną suplementację olejem z alg. 3. Uzupełniaj magnez organicznymi formami o wysokiej biodostępności (np. jabłczan lub glicynian magnezu), a także pestkami dyni, gorzkim kakao i szpinakiem. 4. Pij wodę bogatą w elektrolity w trakcie intensywnych bloków umysłowych. 5. Ogranicz tłuszcze trans i wysoko przetworzone oleje roślinne, które wypierają DHA z błon komórkowych.',
        pEn: '1. Incorporate reliable choline sources into your regular diet: egg yolks (1–2 daily), soybeans, organ meats, or cruciferous vegetables. 2. Secure optimal EPA and DHA omega-3 intake: consume fatty cold-water fish (salmon, mackerel, sardines) 2–3 times weekly or utilize verified algal oil supplementation. 3. Replenish bioavailable magnesium via organic salts (such as magnesium glycinate or malate) alongside dietary pumpkin seeds, pure cacao, and dark leafy greens. 4. Sip mineral-rich water during demanding cognitive work to sustain membrane potentials. 5. Minimize industrial trans-fatty acids and oxidized seed oils that displace DHA from neuronal membranes.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie polegaj na suplementach jako substytucie zróżnicowanej diety — związki odżywcze w pełnowartościowej żywności działają synergistycznie z fitoskładnikami. Unikaj tlenku magnezu (posiada znikomą przyswajalność i wywołuje dolegliwości żołądkowe). Nie stosuj ekstremalnie niskotłuszczowych diet bez konsultacji, gdyż odcinają one mózg od podstawowych budulców osłonek mielinowych.',
        pEn: 'Do not treat isolated synthetic pills as a replacement for whole-food nutrition — dietary micronutrients operate in synergistic food matrices. Avoid magnesium oxide (it has very low bioavailability and causes digestive distress). Steer clear of severe fat-free diets, which deprive the central nervous system of lipid substrates required for myelin and synaptic integrity.',
      },
    ],
    sourcesPl: [
      'Gómez-Pinilla, 2008 (Nature Reviews Neuroscience — Brain foods: the effects of nutrients on brain function)',
      'Slutsky i in., 2010 (Neuron — Enhancement of learning and memory by elevating brain magnesium)',
      'Wurtman i in., 2009 (Cambridge University Press — Nutritional precursors and neurotransmitter synthesis)',
    ],
    sourcesEn: [
      'Gómez-Pinilla, 2008 (Nature Reviews Neuroscience — Brain foods: the effects of nutrients on brain function)',
      'Slutsky et al., 2010 (Neuron — Enhancement of learning and memory by elevating brain magnesium)',
      'Wurtman et al., 2009 (Cambridge University Press — Nutritional precursors and neurotransmitter synthesis)',
    ],
  },
  'ultradian-rhythms': {
    id: 'ultradian-rhythms',
    topicId: 'productivity',
    titlePl: 'Rytmy ultradialne: jak synchronizować pracę z falami 90 minut',
    titleEn: 'Ultradian rhythms: riding the 90-minute energy waves',
    introPl: 'Wydajność ludzkiego mózgu nie jest liniowa — porusza się w 90-minutowych cyklach aktywności i wygaszania. Praca zgodna z biologiczną falą chroni przed wyczerpaniem i maksymalizuje głębię skupienia.',
    introEn: 'Human cognitive stamina does not run in a flat line — it oscillates in 90-minute cycles of cresting alertness and troughing fatigue. Aligning sessions with your biological wave prevents burnout and deepens mental flow.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Fizjolog Nathaniel Kleitman odkrył podstawowy cykl odpoczynku i aktywności (BRAC — Basic Rest-Activity Cycle), który rządzi nie tylko fazami snu REM i non-REM, lecz działa nieprzerwanie także w ciągu dnia. W mózgu człowieka fale czuwania narastają i opadają w oknach trwających około 90–120 minut. Pod koniec cyklu dochodzi do spadku neuroprzekaźników, spadku temperatury i wzrostu częstotliwości fal mózgowych alfa i teta. Zmuszanie się do kontynuowania intensywnej pracy intelektualnej w fazie dołka aktywuje awaryjny wyrzut hormonów stresu (kortyzolu i adrenaliny), co prowadzi do chronicznego zmęczenia i spadku jakości myślenia.',
        pEn: 'Physiologist Nathaniel Kleitman discovered the Basic Rest-Activity Cycle (BRAC), which regulates not only nocturnal REM and non-REM architecture but dictates daytime vigilance as well. Human alertness surges and wanes across roughly 90 to 120 minute waves. At the cycle’s trough, neurotransmitter availability drops, peripheral temperature shifts, and slower alpha/theta oscillations intervene. Forcing cerebral exertion through this physiological trough triggers compensatory stress hormone discharge (cortisol and adrenaline), fostering chronic fatigue and degraded cognitive judgment.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Zaplanuj swój najważniejszy blok dnia na maksymalnie 75–90 minut (np. 3 sesje Focus Flow po 25 minut z 5-minutowymi przerwami). 2. Po zakończeniu 90-minutowego cyklu zrób dłuższą, nienegocjowalną przerwę regeneracyjną trwającą 15–20 minut. 3. W trakcie tej dłuższej pauzy całkowicie odetnij stymulację umysłową: wyjdź na krótki spacer, posłuchaj spokojnej muzyki lub wykonaj ćwiczenia oddechowe. 4. Obserwuj sygnały ostrzegawcze ciała sygnalizujące dołek ultradialny: wiercenie się, ziewanie, spadek koncentracji czy bezrefleksyjne sięganie po telefon. 5. Ogranicz liczbę pełnych bloków ultradialnych o wysokiej intensywności do 3–4 w ciągu dnia.',
        pEn: '1. Cap your primary focus blocks at 75–90 minutes (e.g., three 25-minute Focus Flow sessions interspersed with 5-minute micro-breaks). 2. Conclude the 90-minute cycle with a mandatory, non-negotiable 15–20 minute restorative downtime. 3. During this extended break, disengage completely from cognitive input: walk outdoors, listen to instrumental sound, or breathe deeply. 4. Track somatic markers of the ultradian trough: physical restlessness, yawning, mental drifting, or impulsive reaching for your phone. 5. Limit intense, high-load ultradian work blocks to a maximum of 3–4 cycles per day.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie planuj maratonów 4–5 godzin ciągłej pracy przy biurku bez przerw — złudzenie produktywności okupione jest drastycznym wzrostem liczby błędów w kodzie czy tekście. Nie ignoruj fizjologicznych sygnałów zmęczenia, zagłuszając je kolejnymi napojami energetycznymi. Nie traktuj odpoczynku jako nagrody za wykonanie zadania — odpoczynek jest biologicznym warunkiem kolejnej fali skupienia.',
        pEn: 'Never schedule 4–5 hour continuous desktop marathons — the illusion of stamina comes at the cost of compounding errors and cognitive fatigue. Do not silence natural fatigue signals by piling on artificial stimulants. Do not view rest as a luxury reward earned only upon finishing a task — systemic rest is an unbending biological prerequisite for your next wave of focus.',
      },
    ],
    sourcesPl: [
      'Kleitman, 1982 (Sleep — Basic rest-activity cycle—22 years later)',
      'Rossi, 1991 (The Twenty-Minute Break: Using the New Science of Ultradian Rhythms)',
      'Loehr i Schwartz, 2003 (The Power of Full Engagement — Managing energy, not time)',
    ],
    sourcesEn: [
      'Kleitman, 1982 (Sleep — Basic rest-activity cycle—22 years later)',
      'Rossi, 1991 (The Twenty-Minute Break: Using the New Science of Ultradian Rhythms)',
      'Loehr & Schwartz, 2003 (The Power of Full Engagement — Managing energy, not time)',
    ],
  },
  'implementation-intentions': {
    id: 'implementation-intentions',
    topicId: 'productivity',
    titlePl: 'Intencje implementacyjne: automatyzacja nawyków formułą „jeśli… to…"',
    titleEn: 'Implementation intentions: habit automation via "if-then" plans',
    introPl: 'Sama siła woli i niejasne cele rzadko wystarczają w starciu z dystrakcjami. Formuła intencji implementacyjnych przenosi kontrolę nad działaniem z zawodnego wysiłku decyzyjnego na automatyczną reakcję na bodziec.',
    introEn: 'Vague intentions and raw willpower routinely fold under friction and distraction. The implementation intentions formula shifts behavioral execution from fragile conscious deliberation to automated cue-response mechanisms.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Psycholog Peter Gollwitzer wykazał, że klasyczne intencje celu („chcę napisać raport") wymagają ciągłej, świadomej samokontroli i podejmowania decyzji w obliczu pokus. Intencje implementacyjne opierają się na warunkowej strukturze: „JEŚLI pojawi się sytuacja X, TO wykonam reakcję Y". Ta konstrukcja tworzy w pamięci silne, natychmiastowe powiązanie neuronalne pomiędzy mentalną reprezentacją bodźca a zaplanowanym zachowaniem. Gdy napotykasz określony kontekst, działanie wyzwalane jest automatycznie, z pominięciem powolnego, wyczerpującego procesu deliberacji w korze przedczołowej.',
        pEn: 'Psychologist Peter Gollwitzer revealed that generic goal intentions ("I want to write this report") demand continuous conscious self-regulation in the presence of competing impulses. Implementation intentions recruit an explicit contingency structure: "IF situation X arises, THEN I will perform response Y." This conditional pairing anchors the cognitive representation of a situational trigger directly to the intended action. When the critical cue appears, execution fires automatically, bypassing slow and fatigue-prone prefrontal deliberation.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Przed rozpoczęciem dnia zidentyfikuj 1–2 kluczowe momenty tarcia lub dystrakcji (np. sięganie po telefon po zakończeniu sesji). 2. Sformułuj precyzyjną regułę: „JEŚLI [dokładny czas, miejsce lub sygnał], TO [konkretne, natychmiastowe działanie]". 3. Przykład pracy: „JEŚLI wybije godzina 9:00 i usiądę przy biurku, TO uruchomię 25-minutowy timer Focus Flow i otworzę dokument projektu". 4. Przykład anty-rozpraszacza: „JEŚLI podczas pracy poczuję pokusę sprawdzenia wiadomości, TO zapiszę tę myśl na kartce i wezmę jeden głęboki oddech". 5. Zapisz formułę ręcznie na kartce i umieść ją w polu widzenia.',
        pEn: '1. Prior to starting your workday, pinpoint 1–2 recurring moments of friction or distraction (such as opening social apps when a session ends). 2. Draft an explicit formula: "IF [specific time, location, or sensory cue], THEN [concrete, immediate micro-action]". 3. Focus example: "IF the clock strikes 9:00 AM and I sit at my desk, THEN I will launch a 25-minute Focus Flow timer and open the project draft". 4. Distraction example: "IF I feel an impulse to browse news during a session, THEN I will scribble the thought on my scratchpad and take one slow breath". 5. Write the plan down physically and place it directly beside your keyboard.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie formułuj planów w sposób ogólnikowy („JEŚLI będę miał wolną chwilę, TO pouczę się") — mózg potrzebuje ostrego, jednoznacznego bodźca wyzwalającego. Unikaj tworzenia dziesiątek reguł na raz — zacznij od maksymalnie dwóch najważniejszych. Nie definiuj reakcji w formie negacji („JEŚLI zadzwoni telefon, TO NIE odbiorę") — formułuj zachowanie zastępcze pozytywnie („TO włączę tryb cichy").',
        pEn: 'Do not construct vague conditional triggers ("IF I get some free time, THEN I will study") — executive networks require sharp, unmistakable cues. Avoid designing dozens of simultaneous rules — initiate with at most two core contingencies. Do not state responses as negative prohibitions ("IF my phone pings, THEN I will NOT look") — formulate the constructive alternative positively ("THEN I will keep my hands on the keyboard").',
      },
    ],
    sourcesPl: [
      'Gollwitzer i Sheeran, 2006 (Advances in Experimental Social Psychology — Implementation intentions and goal achievement)',
      'Gollwitzer, 1999 (American Psychologist — Implementation intentions: Strong effects of simple plans)',
      'Oettingen i in., 2001 (Journal of Personality and Social Psychology — Mental contrasting and goal commitment)',
    ],
    sourcesEn: [
      'Gollwitzer & Sheeran, 2006 (Advances in Experimental Social Psychology — Implementation intentions and goal achievement)',
      'Gollwitzer, 1999 (American Psychologist — Implementation intentions: Strong effects of simple plans)',
      'Oettingen et al., 2001 (Journal of Personality and Social Psychology — Mental contrasting and goal commitment)',
    ],
  },
  'physiological-sigh': {
    id: 'physiological-sigh',
    topicId: 'wellbeing',
    titlePl: 'Westchnienie fizjologiczne: natychmiastowy reset autonomicznego układu nerwowego',
    titleEn: 'The physiological sigh: rapid autonomic nervous system reset',
    introPl: 'W stanach nagłego stresu i przeciążenia próba racjonalnego uspokojenia myśli często zawodzi. Westchnienie fizjologiczne wykorzystuje obwód nerwu błędnego, by obniżyć tętno i poziom pobudzenia w kilkadziesiąt sekund.',
    introEn: 'During moments of acute stress and cognitive overwhelm, attempting to talk yourself into calmness frequently fails. The physiological sigh leverages vagal circuitry to decelerate heart rate and autonomic arousal in seconds.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Westchnienie fizjologiczne to naturalny odruch oddechowy kontrolowany przez neurony pnia mózgu w kompleksie pre-Bötzinger. Składa się z dwóch kolejnych wdechów z rzędu, po których następuje powolny, wydłużony wydech. Pierwszy wdech napełnia płuca, a drugi (mniejszy) gwałtownie otwiera zapadnięte pęcherzyki płucne (zwiększając powierzchnię wymiany gazowej i usuwając nadmiar dwutlenku węgla). Wydłużony wydech powoduje rozprężenie przepony, zmniejszenie objętości klatki piersiowej i zwolnienie przepływu krwi przez serce. W odpowiedzi węzeł zatokowo-przedsionkowy natychmiast wysyła sygnał za pośrednictwem nerwu błędnego do zwolnienia rytmu serca, wygaszając aktywność współczulną („walcz lub uciekaj").',
        pEn: 'The physiological sigh is an innate respiratory pattern governed by brainstem rhythm generators in the pre-Bötzinger complex. It features two sequential inhales followed by a prolonged, unforced exhale. The first breath fills lung capacity, while the second quick "top-off" inhale re-inflates collapsed pulmonary alveoli, optimizing gas exchange surface area and purging accumulated carbon dioxide. The prolonged exhalation slows venous return through the heart; baroreceptors detect this change and the vagus nerve signals the sinoatrial node to immediately decelerate heart rate, downregulating sympathetic arousal.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Usiądź prosto z obiema stopami opartymi stabilnie na podłodze. 2. Weź głęboki wdech przez nos, napełniając dolną część brzucha i klatkę piersiową. 3. Bez wypuszczania powietrza weź natychmiast krótki, dynamiczny drugi dopompowujący wdech przez nos do pełnego rozszerzenia płuc. 4. Rozchyl usta i wykonaj bardzo powolny, płynny, długi wydech, aż klatka piersiowa całkowicie opadnie (powinien trwać 2–3 razy dłużej niż wdech). 5. Powtórz tę sekwencję 2–3 razy z rzędu tuż przed trudną sesją Focus Flow lub w momencie narastającej irytacji.',
        pEn: '1. Sit comfortably upright with both feet planted firmly on the floor. 2. Take a deep, controlled inhalation through your nose, expanding your lower abdomen and ribcage. 3. Without releasing any air, take a sharp, secondary "top-up" inhale through your nose to achieve maximum lung inflation. 4. Softly part your lips and exhale slowly, smoothly, and completely through the mouth (the exhale should last 2–3 times longer than the inhale). 5. Repeat this exact two-breath sequence 2 to 3 times right before a demanding Focus Flow session or whenever cognitive tension peaks.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie forsuj wydechu gwałtownym dmuchaniem — wydech powinien być biernym, grawitacyjnym opadaniem klatki piersiowej. Unikaj wykonywania więcej niż 4–5 westchnień z rzędu, aby nie wywołać hiperwentylacji i lekkiego zawrotu głowy. Nie czekaj, aż panika lub frustracja całkowicie przejmie kontrolę — stosuj technikę profilaktycznie przy pierwszych somatycznych oznakach napięcia.',
        pEn: 'Do not blow air out aggressively — the exhalation should feel like a passive, gravitational release of thoracic tension. Avoid chaining more than 4–5 sighs continuously to prevent mild hypocapnia or dizziness. Do not wait until overwhelming panic disables concentration — deploy the sigh proactively at the first somatic sensation of tightening tension.',
      },
    ],
    sourcesPl: [
      'Balban i in., 2023 (Cell Reports Medicine — Brief structured respiration practices enhance mood and reduce physiological arousal)',
      'Feldman i in., 2003 (Annual Review of Physiology — Breathing rhythm generation and sigh regulation in mammals)',
      'Vlemincx i in., 2013 (Biological Psychology — Sigh rate and respiratory variability during mental stress and relief)',
    ],
    sourcesEn: [
      'Balban et al., 2023 (Cell Reports Medicine — Brief structured respiration practices enhance mood and reduce physiological arousal)',
      'Feldman et al., 2003 (Annual Review of Physiology — Breathing rhythm generation and sigh regulation in mammals)',
      'Vlemincx et al., 2013 (Biological Psychology — Sigh rate and respiratory variability during mental stress and relief)',
    ],
  },
  'stress-reappraisal': {
    id: 'stress-reappraisal',
    topicId: 'wellbeing',
    titlePl: 'Przeformułowanie stresu: jak przekształcić lęk w gotowość do działania',
    titleEn: 'Stress reappraisal: turning anxiety into cognitive readiness',
    introPl: 'Fizjologiczne pobudzenie przed trudnym wyzwaniem — szybsze bicie serca i przyspieszony oddech — to nie dowód na brak kompetencji, lecz przygotowanie ciała do wysiłku. Zmiana interpretacji tych sygnałów uwalnia zasoby poznawcze.',
    introEn: 'Pre-performance physiological arousal — a racing heart and quickened breath — is not evidence of inadequacy, but the body preparing for effort. Reappraising somatic signals unchains working memory from threat monitoring.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Tradycyjny model postrzega stres jako destrukcyjny czynnik, który należy stłumić. Kiedy interpretujemy podwyższone tętno jako zagrożenie (threat mindset), naczynia krwionośne ulegają zwężeniu (wzrost oporu obwodowego), a ciało migdałowate przejmuje kontrolę nad korą przedczołową, drastycznie ograniczając pojemność pamięci roboczej. Badania prof. Wendy Berry Mendes i Alii Crum pokazują, że przeformułowanie stresu na nastawienie na wyzwanie (challenge mindset) zmienia profil hemodynamiczny: naczynia krwionośne pozostają rozszerzone, a serce pompuje więcej natlenionej krwi bezpośrednio do mózgu. Zamiast paraliżu pojawia się mobilizacja i podwyższona elastyczność poznawcza.',
        pEn: 'Conventional beliefs frame stress as an intrinsically toxic state requiring suppression. When physiological arousal is categorized as threat (threat mindset), peripheral vasculature constricts, vascular resistance climbs, and the amygdala disrupts prefrontal processing, shrinking working memory capacity. Research by Wendy Berry Mendes and Alia Crum demonstrates that cognitive reappraisal toward a challenge mindset transforms the hemodynamic profile: arterial vessels dilate, cardiac efficiency increases, and oxygenated blood surges into cortical centers. Anxiety yields to physiological mobilization and cognitive flexibility.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Gdy przed trudnym zadaniem poczujesz ucisk w klatce piersiowej lub przyspieszone tętno, natychmiast zatrzymaj się i powstrzymaj próbę uspokojenia na siłę. 2. Nazwij fizyczne objawy: „Moje serce bije szybciej, a dłonie są ciepłe". 3. Przeformułuj ich znaczenie za pomocą wewnętrznego komunikatu: „Moje ciało nie panikuje — pompuje tlen i paliwo do mózgu, przygotowując mnie do maksymalnego skupienia". 4. Zapisz jedno zdanie: „To zadanie jest dla mnie ważne, a to pobudzenie jest moim zasobem". 5. Skieruj tę energię w pierwsze 3 minuty konkretnej pracy w Focus Flow.',
        pEn: '1. When chest tightness or accelerated heart rate surfaces before a tough task, pause and halt any reflexive attempt to calm down forcefully. 2. Acknowledge somatic cues objectively: "My pulse is elevated, my alertness is sharpening". 3. Reappraise their physiological meaning with a targeted self-instruction: "My body is not failing — it is delivering oxygen and glucose to my brain to prime me for high performance". 4. Write down one declarative prompt: "This challenge matters, and this arousal is fuel". 5. Channel this physical surge into the first 3 minutes of focused work in your Focus Flow session.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie powtarzaj sobie na siłę: „muszę się wyluzować" — próba drastycznego zgaszenia silnego pobudzenia jest sprzeczna z biologią i potęguje frustrację. Unikaj uznawania niepokoju za znak, że nie jesteś gotowy do zadania. Nie uciekaj w prokrastynację jako sposób na obniżenie dyskomfortu — ucieczka tylko utrwala lękowe skojarzenie z pracą.',
        pEn: 'Never repeat "I need to just relax" under high somatic activation — trying to forcefully extinguish arousal contradicts autonomic physiology and fuels frustration. Avoid interpreting autonomic arousal as a signal of incompetence or unreadiness. Do not run into avoidance procrastination to relieve temporary somatic discomfort — avoidance reinforces threat reactivity.',
      },
    ],
    sourcesPl: [
      'Crum, Salovey i Achor, 2013 (Journal of Personality and Social Psychology — Rethinking stress: the role of mindsets in determining the stress response)',
      'Jamieson, Mendes i Nock, 2012 (Journal of Experimental Psychology: General — Improving acute stress responses through reappraisal)',
      'Yeager i in., 2022 (Nature — A synergistic mindsets intervention protects adolescents against stress)',
    ],
    sourcesEn: [
      'Crum, Salovey & Achor, 2013 (Journal of Personality and Social Psychology — Rethinking stress: the role of mindsets in determining the stress response)',
      'Jamieson, Mendes & Nock, 2012 (Journal of Experimental Psychology: General — Improving acute stress responses through reappraisal)',
      'Yeager et al., 2022 (Nature — A synergistic mindsets intervention protects adolescents against stress)',
    ],
  },
  'open-monitoring-focus': {
    id: 'open-monitoring-focus',
    topicId: 'mindfulness',
    titlePl: 'Trening uwagi: uwaga skupiona kontra otwarte monitorowanie',
    titleEn: 'Attention training: focused attention versus open monitoring',
    introPl: 'Trening uważności obejmuje dwa odmienne tryby kognitywne: laserowe skupienie na jednym obiekcie oraz panoramiczną świadomość wszystkich zjawisk. Dobór odpowiedniego trybu do zadania pozwala trenować różne sieci uwagowe.',
    introEn: 'Mindfulness training comprises two fundamentally distinct cognitive modes: laser spotlighting on a single anchor versus panoramic awareness of all phenomena. Pairing the right mode with your workflow trains different neural attention networks.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Neurobiolog Antoine Lutz podzielił medytację na dwa główne style: Uwagę Skupioną (FA — Focused Attention) i Otwarte Monitorowanie (OM — Open Monitoring). FA aktywuje grzbietową sieć uwagi (dorsal attention network): ćwiczy utrzymywanie skupienia na jednej kotwicy (np. oddechu), rozpoznawanie dystrakcji i natychmiastowy powrót. Z kolei OM angażuje brzuszną sieć uwagi oraz sieć istotności (salience network): nie utrzymuje kotwicy, lecz trenuje bezstronną, panoramiczną obserwację myśli, dźwięków i odczuć bez chwytania się któregokolwiek z nich. FA buduje odporność na dekoncentrację przy zadaniach analitycznych, podczas gdy OM zwiększa elastyczność poznawczą i myślenie dywergencyjne (kreatywność).',
        pEn: 'Neuroscientist Antoine Lutz classified mindfulness into two core operational modes: Focused Attention (FA) and Open Monitoring (OM). FA engages the dorsal frontoparietal attention network, training sustained focal adherence to a chosen anchor (such as breath flow), selective distraction detection, and rapid disengagement. Conversely, OM activates ventral attention and salience networks: relinquishing focal anchors to cultivate non-reactive, panoramic observation of thoughts, ambient audio, and sensations. FA builds deep resistance against distraction in analytical work, while OM enhances cognitive flexibility and divergent creative thinking.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Przed pracą analityczną wybierz trening Uwagi Skupionej (FA): usiądź wygodnie i przez 5 minut skup całą uwagę wyłącznie na odczuciu powietrza w nozdrzach. 2. Gdy uwaga odpłynie, zauważ to bez osądzania i spokojnie sprowadź wzrok mentalny z powrotem na oddech. 3. Przed sesją burzy mózgów lub planowania strategicznego wybierz Otwarte Monitorowanie (OM): usiądź, zamknij oczy i przez 5 minut pozwól wszystkim dźwiękom, myślom i wrażeniom przepływać przez świadomość jak chmury na niebie. 4. W trybie OM nie podążaj za żadną myślą ani jej nie odpychaj — rejestruj wyłącznie sam fakt jej pojawienia się i zniknięcia. 5. Po 5 minutach przejdź natychmiast do właściwej sesji pracy w Focus Flow.',
        pEn: '1. Prior to analytical problem-solving, engage Focused Attention (FA): sit comfortably and anchor your entire perceptual field on the tactile passage of air at your nostrils for 5 minutes. 2. When your mind wanders, acknowledge the intrusion non-judgmentally and smoothly guide attention back to the breath anchor. 3. Prior to strategic ideation or creative brainstorming, employ Open Monitoring (OM): close your eyes and let auditory, mental, and somatic sensations drift across conscious awareness like passing clouds. 4. In OM, neither chase nor suppress thoughts — simply register the emergence and dissolution of each mental event. 5. Conclude the 5-minute warm-up and launch directly into your designated Focus Flow session.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie myl Otwartego Monitorowania ze zwykłym rozkojarzeniem lub marzeniami dziennymi — OM wymaga czujnej obecności i nieutożsamiania się z myślami. Nie oceniaj treningu Uwagi Skupionej miarą tego, jak często twój umysł uciekł: każde zauważenie rozproszenia to jedno powtórzenie mięśnia uwagi. Nie rezygnuj z krótkich form — nawet 5 minut celowej praktyki daje mierzalne efekty neuroplastyczne.',
        pEn: 'Do not mistake Open Monitoring for passive mind-wandering or daydreaming — OM demands lucid vigilance and detached witnessing without conceptual absorption. Never evaluate Focused Attention by the frequency of mind-wandering: each noticed drift and conscious return constitutes one rep of attentional strengthening. Never dismiss brief intervals — even 5 minutes of disciplined daily practice produces measurable neuroplastic shifts.',
      },
    ],
    sourcesPl: [
      'Lutz i in., 2008 (Trends in Cognitive Sciences — Attention regulation and monitoring in meditation)',
      'Slagter i in., 2007 (PLoS Biology — Mental training affects distribution of limited brain resources)',
      'Colzato i in., 2012 (Frontiers in Psychology — Meditate to create: the impact of focused-attention and open-monitoring meditation on divergent thinking)',
    ],
    sourcesEn: [
      'Lutz et al., 2008 (Trends in Cognitive Sciences — Attention regulation and monitoring in meditation)',
      'Slagter et al., 2007 (PLoS Biology — Mental training affects distribution of limited brain resources)',
      'Colzato et al., 2012 (Frontiers in Psychology — Meditate to create: the impact of focused-attention and open-monitoring meditation on divergent thinking)',
    ],
  },
  'body-scan-awareness': {
    id: 'body-scan-awareness',
    topicId: 'mindfulness',
    titlePl: 'Skanowanie ciała: somatosensoryczna kotwica przeciw gonitwie myśli',
    titleEn: 'The body scan: somatosensory anchoring against rumination',
    introPl: 'Kiedy umysł grzęźnie w pętli natrętnych myśli i niepokoju, próba uspokojenia go kolejnymi myślami tylko wzmacnia problem. Przeniesienie uwagi na doznania somatyczne wycisza sieć wzbudzeń spoczynkowych mózgu.',
    introEn: 'When the mind gets caught in analytical rumination, attempting to reason your way out often intensifies the loop. Shifting focal attention to somatic sensations downregulates default mode network hyperactivity.',
    sections: [
      {
        hPl: 'Dlaczego to działa',
        hEn: 'Why it works',
        pPl: 'Sieć wzbudzeń spoczynkowych (DMN — Default Mode Network), obejmująca przyśrodkową korę przedczołową i tylną korę zakrętu obręczy, odpowiada za gonitwę myśli, autodiagnostykę i zamartwianie się o przyszłość. Badania neurobiologiczne dr Catherine Kerr z Harvardu i Browna wykazały, że celowe kierowanie uwagi na konkretne partie ciała moduluje rytmy alfa w pierwotnej korze somatosensorycznej (S1). Działa to jak fizjologiczny filtr bramkujący: mózg aktywnie wycisza przetwarzanie abstrakcyjnych myśli w DMN na rzecz bezpośrednich sygnałów interoceptywnych i proprioceptywnych, przerywając spiralę stresu poznawczego.',
        pEn: 'The Default Mode Network (DMN), encompassing medial prefrontal and posterior cingulate cortices, underpins internal rumination, self-referential narratives, and future-oriented anxiety. Neuroimaging investigations led by Catherine Kerr at Harvard and Brown revealed that directing granular attention toward physical body sites modulates alpha oscillations in the primary somatosensory cortex (S1). This functions as an attentional gating mechanism: cortical processing suppresses abstract DMN rumination in favor of immediate sensory and interoceptive inputs, halting runaway cognitive tension.',
      },
      {
        hPl: 'Jak to zrobić krok po kroku',
        hEn: 'Step by step',
        pPl: '1. Usiądź prosto na krześle, oprzyj stopy o podłoże i zamknij oczy na 5–8 minut. 2. Skieruj całą uwagę na czubki palców lewej stopy — zarejestruj temperaturę, nacisk buta, pulsowanie lub brak jakichkolwiek wyraźnych doznań. 3. Powolnym, płynnym ruchem przesuwaj reflektor uwagi w górę: przez stopę, łydkę, kolano, aż do biodra. 4. Powtórz procedurę dla prawej nogi, a następnie przejdź przez brzuch, klatkę piersiową, dłonie, ramiona, szyję i mięśnie twarzy. 5. Zakończ ćwiczenie, obejmując świadomością całe ciało jednocześnie jako zintegrowaną całość, po czym otwórz oczy i rozpocznij sesję.',
        pEn: '1. Sit comfortably upright on your chair, ground your feet against the floor, and close your eyes for 5–8 minutes. 2. Direct your spotlight of awareness toward the toes of your left foot — register temperature, shoe pressure, tingling, or the absence of sensation. 3. Slowly migrate attention upward through the sole, calf, knee, and thigh into your hip. 4. Mirror the scan across your right leg, then ascend through your abdomen, chest, hands, shoulders, neck, and facial muscles. 5. Conclude by holding your entire physical body simultaneously in unified panoramic awareness before opening your eyes to begin work.',
      },
      {
        hPl: 'Czego unikać',
        hEn: 'What to avoid',
        pPl: 'Nie oceniaj doznań jako „dobrych" lub „złych" — napięcie czy chłód to po prostu neutralne dane sensoryczne do zarejestrowania. Unikaj próby zrelaksowania ciała na siłę: rozluźnienie jest naturalnym efektem ubocznym uważnej obserwacji, a nie celem samym w sobie. Nie wykonuj skanowania w łóżku, jeśli masz tendencję do natychmiastowego zasypiania — utrzymuj pozycję siedzącą z wyprostowanym kręgosłupem.',
        pEn: 'Never categorize somatic signals as "good" or "bad" — tension, warmth, or coolness are simply neutral sensory coordinates to register. Avoid struggling to force muscles to relax: physical release is a natural byproduct of non-judgmental observation, not an enforced demand. Do not conduct the scan supine in bed if prone to dozing off — maintain an alert upright seated posture.',
      },
    ],
    sourcesPl: [
      'Kabat-Zinn, 1982 (General Hospital Psychiatry — An outpatient program in behavioral medicine for chronic pain patients using mindfulness meditation)',
      'Kerr i in., 2013 (Frontiers in Human Neuroscience — Effects of mindfulness meditation on somatosensory alpha rhythm modulation)',
      'Mirams i in., 2013 (Consciousness and Cognition — Brief mindfulness training and tactile acuity)',
    ],
    sourcesEn: [
      'Kabat-Zinn, 1982 (General Hospital Psychiatry — An outpatient program in behavioral medicine for chronic pain patients using mindfulness meditation)',
      'Kerr et al., 2013 (Frontiers in Human Neuroscience — Effects of mindfulness meditation on somatosensory alpha rhythm modulation)',
      'Mirams et al., 2013 (Consciousness and Cognition — Brief mindfulness training and tactile acuity)',
    ],
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
  const intro = lang === 'pl' ? article.introPl : article.introEn
  const paragraphs = article.sections.map((s) => (lang === 'pl' ? s.pPl : s.pEn))
  const sources = lang === 'pl' ? article.sourcesPl : article.sourcesEn
  const words = [intro, ...paragraphs, ...sources].join(' ').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / (lang === 'pl' ? 180 : 200)))
}

export function totalReadMinutesForTopic(topicId: TopicId, lang: 'pl' | 'en'): number {
  return articlesForTopic(topicId).reduce((acc, a) => acc + readMinutes(a, lang), 0)
}

/** Splits "1. … 2. … 3. …" paragraphs into numbered list items; prose stays a paragraph. */
export function isStepList(text: string): string[] | null {
  if (!/^\d+\.\s/.test(text.trim())) return null
  const items = text.trim().split(/(?<=[.!?…:;")”’\]»\n\r])\s*(?=\d+\.\s)/).map((s) => s.replace(/^\d+\.\s*/, '').trim())
  return items.every((s) => s.length > 0) && items.length > 1 ? items : null
}


