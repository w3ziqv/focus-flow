# Roadmap

Focus Flow is a private, useful place to work. The timer stays at
**focusflow.ink**. Accounts remain optional, active timers stay on one device,
and personal task content is never required for product analytics.

The versions below describe planned work. A prototype is a design proposal,
not an implemented release feature. Security and data-recovery fixes take
priority over scheduled features.

## 3.0 — foundation

Released as [3.0.0](https://github.com/w3ziqv/focus-flow/releases/tag/v3.0.0)
on 28 October 2026. The web/PWA and production desktop installers share source
`b35d2db90feb723826efa5515665b8cf695b818d`.

- Offline web/PWA and desktop timer, history, goals and exports.
- Optional cloud history with bounded writes, retries, deletion markers,
  masking and migration/account-change backups.
- Polish, English, Spanish and Simplified Chinese, including 27 reviewed guides.
- Shared keyboard/dialog behavior, responsive history and consistent UI tokens.
- Root `SECURITY.md`, private vulnerability reporting, verified installer
  metadata/checksums and installation/backup/rollback instructions.

Current validation limits are in [security](SECURITY.md). Unexecuted physical
checks remain unverified even where publication has been accepted.

## 3.1 — design and everyday usability

### Direction

Use a restrained editorial layout: generous spacing, warm neutral surfaces,
dark readable text, a measured teal/green accent, large serif headings and clear
sans-serif controls. Preserve a recognizable timer and one primary action.
Motion should explain state changes; decorative animation must not compete
with work or require a permanently running video.

### Scope

1. Map the frequent journeys: start/pause/reset, switch phase, adjust audio,
   find/edit a session, export data and inspect sync status. Identify confusing
   labels and actions hidden behind settings before changing layouts.
2. Produce editable desktop/mobile designs for idle, running, paused and break
   states, plus statistics, audio/settings and the offline/error cases.
3. Build the shared type, color, spacing and control states through existing
   tokens/components. Preserve the five existing theme preferences and add
   lavender and sand as optional themes. Keep four languages. Expand buttons
   and labels where translation needs more room; keep visible keyboard focus.
4. Apply the new hierarchy gradually: timer/navigation first, settings/audio
   next, then statistics/history and guides. Preserve drafts, active deadlines,
   scroll position where useful and account ownership through each change.
5. Compare the release candidate with 3.0 on the same devices and data before
   publishing. Capture startup, input response, rendering and bundle changes.

### Reviewable interface proposal

The [interactive prototype](../design/3.1/index.html) contains 75 named screens
and states, with desktop/phone layouts and seven working color palettes.
Open the HTML file locally, or serve `design/3.1` with a static HTTP server.
Use **Wszystkie ekrany** to navigate the complete inventory. The first five
editable direction screens are also available in
[Figma](https://www.figma.com/design/YGVSnyAZLZX4maFu6vX1DH?node-id=5-224).

The prototype covers timer phases, focus/pause/completion, small steps, goals,
history/search/filters/edit/delete/export, guide layouts, every settings section,
cloud/account/offline/error states, backup/import/recovery, PWA installation,
native mini/tray controls, webhook and experimental P2P. Garden, extended guide
discovery and `/about` screens carry their future version labels. Prototype
interactions use synthetic data and memory only: they do not sign in, send data,
read application storage, import real backups or change OS settings. Its Polish
copy demonstrates layout; production translation checks still apply to all four
languages before 3.1 ships.

Keep the current modular boundaries during implementation:

| Area | Responsibility and state owner |
| --- | --- |
| `src/app`, `src/views` | Shell, routes, lazy dialogs and view composition; navigation/dialog state stays here. |
| `src/features/timer`, `src/hooks` | Timer display and engine commands. The engine owns deadlines; form drafts stay in the timer dialog. |
| `src/features/audio`, `src/features/settings` | Audio controls, settings drafts and preferences; unrelated panels do not subscribe to timer ticks. |
| `src/features/statistics`, `src/features/guides` | Derived history, pagination/search/export and guide navigation; no duplicate authoritative history. |
| `src/ui`, `src/design` | Shared controls, focus/dialog contracts, typography and semantic theme tokens. |
| `src/domain`, `src/lib` | Domain rules, persistence, platform and sync adapters; account identity and deletion records stay authoritative. |

### Themes in the 3.1 release

Include **all seven palettes** as equal options in Appearance settings, with a
live preview across the interface. The palette scope is settled; usability and
contrast testing may refine individual color values without removing a theme.

| Theme | Character |
| --- | --- |
| Papier / Paper | Warm white with a restrained teal accent. |
| Atrament / Ink | Dark teal surfaces and soft light text. |
| Obsydian / Obsidian | Black surfaces with high contrast. |
| Szałwia / Sage | Light natural greens. |
| E-ink | Monochrome with no decorative motion. |
| Lawenda / Lavender | Pale violet surfaces and a plum accent. |
| Piasek / Sand | Warm sand surfaces and a terracotta accent. |

Keep a user's selected theme after updating. Changing a palette must preserve
the active timer, settings drafts, history and account. Cover timer/focus modes,
settings, guides, charts and empty/offline/error states in every theme. Show
text labels and selection indicators alongside color previews.

Map the existing `light`
and `dark` preferences to the corresponding Paper/Ink presentation without
discarding saved preferences. Keep `obsidian`, `sage` and `eink` identifiers.
Define page/surface, primary/secondary text, control boundary, accent/on-accent,
focus background/foreground, and danger/background pairs. Color must never be
the only status cue. Normal text requires 4.5:1 contrast; essential control
boundaries require 3:1. E-ink stays monochrome and suppresses decoration/motion.

Representative component contracts for 3.1:

- **Timer dial:** receives phase, remaining time and commands; only the time
  display updates each second. Theme/navigation changes preserve the deadline.
- **Settings dialog:** owns its draft, traps keyboard focus, closes with Escape
  and restores focus to its trigger. Saving applies validated values; cancellation
  leaves the running timer unchanged. Long mobile panels scroll without hiding
  the final action or causing horizontal overflow.
- **History list:** searches the complete dataset, pages visible rows and keys
  sessions by stable ID. Editing/deleting uses existing domain commands and
  deletion records, with a separate destructive confirmation.
- **Sync status:** exposes connected/pending/offline/error in text and offers
  recovery without resetting local history. Account changes require an explicit
  history choice and a preserved copy; credentials stay in the native store.

Before implementation, test the prototype with users and record the resulting
decisions. Its visual and keyboard checks do not replace real device, native
runtime, translated UI, sync or migration acceptance for the eventual release.

### Acceptance

- At least four of five voluntary testers can start/pause a session, find audio
  controls and export a backup without assistance. Record observations manually;
  add no behavioral tracking to the app.
- No horizontal overflow at 320 px; usable at 200% zoom, with touch, keyboard,
  reduced motion and a real screen reader. All four languages are checked.
- Switching views, language, theme or size preserves the active timer and form
  drafts. No new navigation/settings renders are driven by timer ticks alone.
- No unresolved performance regression beyond measurement noise. Any deliberate
  tradeoff needs a concrete benefit and a recorded before/after comparison.

## 3.2 — an optional personal garden

### Experience

Offer an **Ogród / Garden** where completed focus sessions gradually grow plants.
Make it optional and available offline without an account. The timer remains
the main screen; the garden is a quiet place to visit after work.

Start with a small choice of plants, simple growth stages and a personal layout.
No plant dies because of missed days. Avoid streak penalties, competitive ranks,
paid recovery, forced notifications or prompts during an active session. Include
a static/reduced-motion presentation and a way to hide or reset the garden
without deleting work history.

### Implementation and acceptance

- Prototype the growth pace and empty state before adding a large asset catalog.
- Credit completed sessions once using stable session identities; test duplicate
  completion, offline/reconnect, import, deletion and account switching.
- Keep only the necessary cosmetic state. Do not copy task titles/checklists into
  garden records. Garden progress is a personal visualization, not proof of work.
- Add optional cloud support only with an explicit schema, bounded payloads,
  UID rules, migration/export/restore and consent for the affected data.
- Preserve every existing backup and make a complete export/import round trip.
  Test whether the garden helps a small volunteer group return without pressure.
  Do not introduce analytics or remote engagement scoring to measure it.

## 3.3 — a more useful guide library

1. Improve discovery with clear categories, search, reading length, bookmarks and
   an obvious return to the timer. Cache text and source metadata offline.
2. Add a practical **Using Focus Flow** collection: planning from past sessions,
   protecting task content, importing/restoring a backup and choosing audio.
   Instructions must match the application version they describe.
3. Expand research-based topics in small reviewed batches. Avoid duplicate
   articles and unsupported health/productivity promises. Separate evidence,
   practical examples and limitations; record source and review dates.
4. Publish every article in PL/EN/ES/Simplified ZH. Check natural language,
   screen-reader headings, links, narrow screens and older article routes.
5. Preserve the native source-ID allowlist. Bookmarks and reading position stay
   local by default; any optional sync requires the same consent/rules discipline
   as other personal data.

Acceptance: every new route opens in four languages and offline; sources resolve
or clearly identify access limits; users can find an article and return to the
running timer without losing it. Review outdated material rather than growing
the library by count alone.

## 3.4 — project website at /about

Keep **focusflow.ink/** as the application. Add **focusflow.ink/about** as a
separate, lightweight presentation of the project, with an obvious **Open timer**
action. Use the same visual language as the app while allowing larger editorial
sections and restrained, original botanical imagery.

### Page content

- What the timer does, with real desktop/mobile screenshots and an open-app link.
- Offline use, optional sync, data boundaries and backup/export options.
- Desktop downloads, platform status, checksums and unsigned-installer disclosure.
- Four languages, guides, roadmap, frequently asked questions and security contact.

### Delivery

Use statically rendered HTML through the existing Vite build, sharing tokens
and small components rather than adding a server framework for a single page.
Provide localized pages under `/about/pl`, `/about/en`, `/about/es` and `/about/zh`,
with correct language/canonical metadata; `/about` is the entry point.

Keep the timer's PWA ID, scope, start URL and root route stable. Explicitly
separate `/about` routing from the app's service-worker navigation fallback.
Visiting the presentation page must not clear a timer, history or preferences.
Load no analytics, tracking cookies, third-party embeds or externally hosted
fonts. Optimize images, headings and links, then test keyboard/mobile use and
no-JavaScript content before indexing the pages.

## Technology and security maintenance

Keep **TypeScript + React** for web/UI and **Rust + Tauri** for native capabilities.
This supports the existing web/PWA and desktop clients without a second UI
implementation. A language change alone does not solve security maintenance.
Add a language or service only for a measured requirement that the current
boundaries cannot address efficiently.

- Use supported Node LTS and maintained Rust/Tauri toolchains. Node 24 remains
  the release baseline; evaluate a newer LTS in a separate tested update.
- Keep lockfiles, weekly dependency proposals and advisory checks on PR/main.
  Treat high-impact advisories as patch work; review moderate/low findings by
  actual exposure rather than hiding them or forcing incompatible downgrades.
- Keep source integration protected, actions pinned, production credentials
  scoped and test/production projects separate. Test native runtimes separately
  from frontend builds and verify exact release source plus installer hashes.
- Prioritize installer signing/notarization and a signed, recoverable update
  channel before enabling automatic desktop updates.
- Every data/schema change needs old-backup compatibility, private migration/
  restore testing and a rollback boundary. Never remove old data to pass a test.

Runtime support and native security references:
[Node release policy](https://nodejs.org/en/about/previous-releases),
[Tauri security](https://v2.tauri.app/security/).
