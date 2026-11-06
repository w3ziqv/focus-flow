# Guide content and evidence

The library contains 48 guides in Polish, English, Spanish and Simplified Chinese.
The original 27 route IDs remain valid. Each of the seven categories contains at
least six articles. Reading times are editorial estimates based on the localized
text, not measured completion times.

## Writing and review

Use the [Humanizer skill](https://github.com/blader/humanizer) when writing or
revising prose. Keep the advice specific and readable. A wording edit must retain
the supported claim, population and material limitations; it must not invent a
benefit or a citation. The 3.1.2 edit rewrites the introductions of the original
27 guides in all four languages and shortens four titles. Their existing evidence,
steps, limitations and source-review dates remain intact.

Each article separates a research summary, a practical exercise and limitations.
The exercise is an editorial application of the evidence. It is not necessarily
the intervention tested in the cited study. For example, a short mindful walk is
not equivalent to a four-week programme that also included discussion. Institutional
health guidance is identified as guidance; correlational findings are described
as associations. The library does not label all methods as equally established.

The 21 added articles have a source-review date of 2026-11-05. Citation IDs and
URLs are shared across all translations in
[src/lib/guides/sources.json](../src/lib/guides/sources.json). Desktop source links
use the same compiled catalog as the web app.

## Added subjects

| Subject | Source | Scope retained in the article |
| --- | --- | --- |
| Self-explanation | [Chi et al., 1994](https://www.sciencedirect.com/science/article/pii/0364021394900167) | Small classroom experiment with a science text; explanations need checking. |
| Worked examples | [Sweller & Cooper, 1985](https://doi.org/10.1207/s1532690xci0201_3) | Benefits for beginners solving structurally similar algebra problems. |
| Pretesting | [Kornell et al., 2009](https://pubmed.ncbi.nlm.nih.gov/19586265/) | Unsuccessful retrieval followed by the correct answer. |
| Short breaks | [Albulescu et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9432722/) | Small fatigue and energy benefits; overall performance effect was not significant. |
| Walking for ideas | [Oppezzo & Schwartz, 2014](https://pubmed.ncbi.nlm.nih.gov/24749966/) | Divergent idea generation, without the same benefit for a single correct answer. |
| Movement during breaks and regular activity | [WHO: Physical activity](https://www.who.int/news-room/fact-sheets/detail/physical-activity) | Health guidance, adapted to ability; no immediate focus promise. |
| Consistent waking | [NHLBI: Healthy sleep habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) | Regular schedules while preserving enough sleep. |
| Sleep and memory | [Rasch & Born, 2013](https://pubmed.ncbi.nlm.nih.gov/23589831/) | Memory consolidation; no ideal bedtime study window. |
| Naps | [Brooks & Lack, 2006](https://pubmed.ncbi.nlm.nih.gov/16796222/) | Controlled study after restricted sleep; actual sleep duration differs from an alarm setting. |
| Breakfast | [Galioto & Spitznagel, 2016](https://pubmed.ncbi.nlm.nih.gov/27184286/) | Small memory benefit, mixed findings for other functions. |
| Practical lunches | [WHO: Healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet) | General dietary guidance, without a meal-specific focus claim. |
| Caffeine labels | [EFSA: Caffeine](https://www.efsa.europa.eu/en/topics/topic/caffeine) | All sources count; safety thresholds are not consumption targets. |
| Notifications | [Stothart et al., 2015](https://pubmed.ncbi.nlm.nih.gov/26121498/) | Laboratory attention task; essential workplace alerts may need to stay on. |
| Restart plans | [Masicampo & Baumeister, 2011](https://doi.org/10.1037/a0024192) | Specific plans reduced interference from unfinished goals in experiments. |
| Progress records | [Harkin et al., 2016](https://pubmed.ncbi.nlm.nih.gov/26479070/) | Experimental meta-analysis; time alone cannot represent all complex work. |
| Asking for support | [WHO: Stress](https://www.who.int/news-room/questions-and-answers/item/stress) | Practical guidance, with professional care when needed. |
| Detachment from work | [Wendsche & Lohmann-Haislah, 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5233687/) | Much of the evidence is correlational. |
| Noticing wandering | [Mrazek et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23538911/) | Small randomized study of a two-week course, not a single exercise. |
| Mindful walking | [Teut et al., 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3747483/) | Combined programme compared with a waiting group. |
| Sound as an anchor | [Zeidan et al., 2010](https://pubmed.ncbi.nlm.nih.gov/20363650/) | Brief training evidence; listening alone was not separately validated. |

## Category imagery

Seven landscape covers were generated with the built-in ImageGen tool. Optimized
1200px covers and 400px thumbnails are stored in
[public/images/guides](../public/images/guides). The 14 WebP files total 529,050
bytes. They ship with both targets and are included in the PWA precache. Images
are decorative; category names and descriptions remain text. E-ink mode displays
the covers in grayscale.

The shared final prompt was:

> Use case: photorealistic-natural. Asset type: wide editorial category cover for
> Focus Flow, a quiet focus and learning app. Primary request: [category scene].
> Style: understated fine-art landscape photography, realistic natural texture,
> atmospheric depth, soft film grain. Composition: panoramic landscape, wide 3:2
> frame, continuous landscape without borders, balanced open upper third, mountains
> across lower two thirds; attractive when cropped to 2.6:1 hero or a square
> thumbnail. Mood: contemplative, calm, mature, inspired by understated wellbeing
> magazine photography. Constraints: landscape only, no people, no buildings, no
> typography, no logos, no watermark, no UI, no illustration, no excessive saturation.

| Category | Scene substituted into the prompt |
| --- | --- |
| Learning | Layered alpine mountain ridgelines rising above still morning mist, deep evergreen foothills, a pale warm sky and delicate dawn light, distant peak slightly to the right. |
| Breaks | Quiet alpine lake with soft reflections, rounded mountain slopes, sparse pine trees beside the shore, early morning mist and muted moss-green tones. |
| Sleep | Mountain ridgelines at blue hour, deep muted indigo and charcoal, small crescent moon in a clear twilight sky, last warm light on the distant horizon. |
| Food | A sunlit alpine valley with meadows and rolling green foothills, distant stone mountains, warm pale morning light and subdued olive-green colors. |
| Productivity | A clear rocky mountain peak above layered forested ridges, early daylight revealing a path along the ridge, muted stone and deep green palette. |
| Wellbeing | Soft rolling mountain silhouettes in warm late-afternoon light, gentle ochre sky, mist settling between distant ridges, natural earth and olive tones. |
| Mindfulness | A peaceful mountain reflection in a very still lake, low morning fog, soft sage hills and grey-blue mountains, natural quiet light. |
