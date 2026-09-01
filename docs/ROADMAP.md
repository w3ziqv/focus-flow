# Focus Flow — Technical Product Roadmap Specification (v2.1 → v3.0)

**Document Version:** 2.0.0  
**Author:** Senior Product Designer & Lead Systems Architect  
**Status:** Approved Engineering Specification  
**Target Platform:** Web (PWA / Offline-First) & Native Desktop (Tauri 2)  
**Verification Baseline:** TypeScript 5.8 Strict (`tsc --noEmit`), Vitest 100% Green, ADR-001–ADR-008 Compliance  

---

## 1. Executive Vision & Core Architectural Pillars

Focus Flow is a quiet, zero-friction, local-first Pomodoro companion engineered to recede into the background while real work takes place. The product rejects cloud lock-in, recurring subscription paywalls, telemetry beacons, and anxiety-inducing gamification loops. Instead, it pairs warm editorial aesthetics with rigorous client-side systems architecture.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE QUIET COMPANION                             │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      Warm Paper Canvas                         │   │
│   │             (--surface-page: #F5F4ED / #141413)                │   │
│   │                                                                │   │
│   │   [ Task Greeting / Current Focus Line ]                       │   │
│   │                                                                │   │
│   │              ┌───────────────────────────┐                     │   │
│   │              │   Hairline Ticks (60)     │                     │   │
│   │              │                           │                     │   │
│   │              │         25:00             │  <-- Fraunces Serif │   │
│   │              │                           │                     │   │
│   │              │    Round 1 of 4           │                     │   │
│   │              └───────────────────────────┘                     │   │
│   │             Progress Arc: Terracotta / Sage                    │   │
│   │                                                                │   │
│   │                 [ Start / Pause CTA ]                          │   │
│   │                                                                │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   • Zero Backend             • Zero External CDNs  • Offline Always    │
│   • Zero Guilt / Streaks     • Wall-Clock Anchored • Micro Ergonomics  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 The Four Architectural Pillars

1. **The Quiet Companion Doctrine (Recessive Interface)**  
   The interface never competes with the user's attention. When the timer runs, the viewport strips down to the essential dial, the active task intention, and a single dominant CTA. There are no banner notifications, marketing popups, or noisy interface animations. Light mode features a 3% tactile film grain (`#F5F4ED` parchment), while dark mode uses a warm soot canvas (`#141413`).
2. **Local-First Data Sovereignty (Zero-Backend Invariant)**  
   In conformance with **ADR-005**, 100% of user data remains on the local device. There are no remote databases, analytics pings, user accounts, or OAuth dependencies. State persistence is isolated behind a strictly typed storage adapter (**ADR-003**), allowing transparent evolution from `localStorage` to IndexedDB and native desktop filesystem JSON.
3. **Procedural Web Audio Synthesis (0 KB Asset Footprint)**  
   To eliminate static audio payload bloat, bandwidth latency, and looping seams, ambient soundscapes (pink noise, brown noise, singing bowls, rain, ocean surges, binaural carriers) are synthesized mathematically at runtime via the Web Audio API. Audio processing executes on the browser's real-time audio thread, maintaining glitch-free playback across background tabs.
4. **Native Lightweight Desktop Architecture (Tauri 2 Target)**  
   In conformance with **ADR-006**, desktop packaging utilizes Tauri 2. Electron is explicitly rejected to avoid 100 MB+ installer sizes and 150–300 MB idle memory footprints. Tauri 2 compiles to a sub-10 MB native binary consuming under 40 MB of RAM, delivering system tray countdowns, global hotkeys, and an always-on-top Picture-in-Picture (PiP) mini-dial.

---

### 1.2 The 4-Tier Progressive Disclosure Architecture

To prevent feature bloat from eroding the product's focus sanctuary, all UX capabilities are organized into four progressive disclosure tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│               4-TIER PROGRESSIVE DISCLOSURE FRAMEWORK                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   TIER 0: THE SANCTUARY (Active Timer View)                            │
│   • Pure countdown dial, active task line, and primary Play/Pause CTA. │
│   • Generous, load-bearing whitespace. Zero persistent widgets.        │
│                                                                        │
│   TIER 1: CONTEXTUAL MICRO-AFFORDANCES (Hover / Focus States)          │
│   • Intent preset chips appear only upon task field focus.             │
│   • Ephemeral micro-step checklist (max 3) attached to running task.   │
│   • Compact volume slider appears only when soundscape is active.      │
│                                                                        │
│   TIER 2: ELEVATED MODALS & DIALOGS (Configuration & Preferences)      │
│   • Timer Steppers, Sound Mixer, App Settings, Ecosystem Exporter.     │
│   • Whisper shadows (`0 4px 24px rgba(20,20,19,0.06)`), 200ms ease.    │
│                                                                        │
│   TIER 3: DEDICATED CONTEMPLATIVE VIEWS (Retrospective Analytics)      │
│   • StatsView (Parchment Heatmap, Session Log Search, Pebble Badges).  │
│   • Topics Library (Evidence-based focus guides).                      │
│   • Navigation via floating NavPill island only.                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Design System & Motion Contracts

- **Typography Contract**:
  - **Display / Serif (`Fraunces Variable`)**: Optical size axis (`opsz: 9..144`), weights `300–550`, `tabular-nums`. Renders timer digits (`clamp(4.5rem, 14vw, 8rem)`), stat counters, view titles, and milestone seals. Bold weights (>550) are forbidden.
  - **UI / Sans (`Instrument Sans Variable`)**: Weights `400–600`. Renders all buttons, inputs, micro-steps, captions, and overlines (`0.6875rem`, `0.09em` tracking, uppercase).
  - **Zero Remote CDN Calls**: All fonts are bundled locally via `@fontsource-variable` to eliminate network requests, tracking vectors, and layout shifts (FOUT/FOIT).
- **Color Semantics (`src/index.css`)**:
  - **Focus Mode**: Terracotta accent (`--accent-focus: #C96442`, Strong: `#A84E2F`, Fill: `#B4552F`).
  - **Break Modes**: Sage / Moss accent (`--accent-break: #6E7F5C`, Strong: `#57664A`, Fill: `#5D6B4D`).
  - **Accessibility Focus Ring**: High-contrast blue (`--focus-ring: #3898EC`, 2px with 2px offset), active exclusively on keyboard focus.
  - **Contrast Floor**: Accent text against parchment (#C96442 on #F5F4ED ≈ 3.2:1) is restricted to display graphics (dial arc) and large text (≥24px). Small accent text uses `-strong` tokens (≥4.57:1 AA).
- **Motion & Interaction Curves**:
  - `Micro` (120–150ms, `cubic-bezier(0.2, 0, 0, 1)`): Button presses (`scale(0.98)`), hairline focus highlights.
  - `Standard` (200–260ms, `cubic-bezier(0.32, 0.72, 0, 1)`): Segmented tab sliding indicator, modal zoom, switch toggle.
  - `Emphasis` (400–600ms, `cubic-bezier(0.16, 1, 0.3, 1)`): View entry fade-up, dial completion pulse.
  - **Hardware-Accelerated Invariant**: Transitions animate exclusively `transform`, `opacity`, `filter`, and SVG `stroke-dashoffset`. Layout properties (`height`, `width`, `margin`, `padding`) are forbidden from animations.
  - **Accessibility**: Dual-layer reduced motion via OS media query (`prefers-reduced-motion: reduce`) and manual interface toggle (`.reduce-motion`).

---

## 2. Release Progression & Architecture Decision Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       VERSION ROADMAP & SYSTEM DEPENDENCIES                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

   v2.0 (Baseline PWA)
           │
           ▼
   v2.1 Task Flow & Session Log  ──► Unified Storage Layer (`storage.ts` adapter)
           │
           ├───────────────────────────────────────┐
           ▼                                       ▼
   v2.2 Soundscapes & Synthesis            v2.3 Zen Habits & Milestones
   (Web Audio Math Engine)                 (Pebble Seals, Canvas Export)
           │                                       │
           └───────────────────┬───────────────────┘
                               ▼
   v2.4 Ecosystem & Local Exports
   (RFC 5545 .ics, RFC 4180 CSV, Backup v2, Timer Worker)
                               │
                               ▼
   v3.0 Tauri 2 Desktop & Tray Companion
   (Sub-10MB Rust Core, Dynamic SVG Tray, Floating PiP, File Adapter)
```

| Milestone | Target Version | Primary Scope Summary | Storage Schema | Audio Engine State | Local Export Formats | Target Platform | Primary Anti-Pattern Eliminated |
|---|---|---|---|---|---|---|---|
| **M1** | **v2.1** | Task Flow & Session Log Depth | Schema v1.1 (`ff2_sessions` unified) | 2-note sine chime + basic brown noise | JSON Backup v1 | Web / PWA | Jira/Todoist backlog creep & complex task nesting |
| **M2** | **v2.2** | Ambient Synthesis & Acoustic Architecture | Schema v1.2 (Mixer preferences) | Pure Web Audio math synthesis (0 KB assets) | JSON Backup v1 | Web / PWA | Multi-MB audio file downloads & audible loop clicks |
| **M3** | **v2.3** | Zen Habits & Subtle Milestones | Schema v1.3 (Milestones & Goals) | Synthesized modal singing bowl chime | Offline Canvas PNG Card | Web / PWA | Broken-streak shame, red alerts & toxic gamification |
| **M4** | **v2.4** | Sovereign Ecosystem & Local Exports | Schema v2.0 (Full history & soundbeds) | Dual-layer mixer + binaural carriers | RFC 4180 CSV, GFM Markdown, RFC 5545 `.ics` | Web / PWA | Cloud database sync lock-in & OAuth server walls |
| **M5** | **v3.0** | Tauri 2 Native Desktop & System Tray | Schema v2.0 (File-backed JSON adapter) | OS-integrated audio engine | All v2.4 formats + Native File I/O | Windows, macOS, Linux | Bloated Electron runtime (150MB+ RAM / 100MB bundle) |

---

## 3. Milestone Specifications

---

### 3.1 Milestone v2.1 — Task Flow & Intention Anchor (*Task Flow & Session Log*)

#### 3.1.1 Core Theme & User Value
Focus Flow is an **Intention Anchor**, not an issue tracker. A session task exists solely to tether the user's mind to a single commitment for the next 25–50 minutes. Milestone v2.1 introduces ephemeral micro-steps to solve the initial inertia ("activation energy") problem and unifies session log management directly inside `StatsView`.

#### 3.1.2 User Experience & Interaction Model (Tier 1 & Tier 3)
1. **Ephemeral Session Checklist (Max 3 Micro-Steps)**:
   - Within `TaskField` (Tier 1), clicking `+ Add micro-step` reveals up to 3 checklist inputs.
   - Micro-steps render as delicate 14px check circles with Instrument Sans text beneath the active intention.
   - Checking a micro-step strikes through the text with a 120ms micro-transition.
   - *Ephemeral Scoping*: Micro-steps attach exclusively to the active session. When the timer completes, micro-step completion states are recorded into the session log record, but uncompleted items do not carry forward into future sessions as uncompleted backlog debt.
2. **Intent Presets (Single-Tap Activation)**:
   - Below an empty `TaskField`, a horizontal row of quiet chips presents customizable intention presets (*Deep Work*, *Writing*, *Code Review*, *Reading*, *Inbox Zero*).
   - Tapping a preset populates the input instantly without modal interruption.
3. **Session Log In-Place Correction & Filtering (`StatsView` / Tier 3)**:
   - Session history displays a sunken search well with real-time substring filtering across task titles and dates.
   - Clicking a task title allows inline editing (`Enter` commits, `Esc` cancels).
   - Erroneously logged sessions can be deleted with a swipe or trash click; deletion atomically decrements aggregate statistics (`stats.minutes`, `stats.today`, `stats.week`, and `stats.history[dayKey]`) to prevent orphaned metrics.

#### 3.1.3 Technical Architecture & Data Mechanics
- **Storage Layer Unification (Fixing ADR-003 Compliance)**:
  Direct calls to `localStorage` in `src/lib/sessions.ts` are eliminated. All persistence routes through typed load/save adapters with boundary sanitizers in `src/lib/storage.ts`.
- **TypeScript Schema Extensions (`src/types.ts` & `src/lib/storage.ts`)**:

```typescript
export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface TaskPreset {
  id: string
  label: string
}

export interface SessionLogEntryV2 {
  id: string
  date: string // ISO-8601 timestamp
  minutes: number
  task: string | null
  checklist?: ChecklistItem[] // Ephemeral micro-steps captured at session end
}

export interface SessionSnapshotV2 extends SessionSnapshot {
  checklist: ChecklistItem[]
}
```

- **Storage Bounds & Sanitization**:
  The session log is capped at 1,000 entries (representing over a year of active daily use, consuming ~120 KB of storage). Malformed entries are discarded on read without throwing runtime exceptions.

#### 3.1.4 Explicit Non-Goals
- ❌ Persistent multi-project task backlogs, folders, or Kanban boards.
- ❌ Due dates, scheduling algorithms, time estimates, or recurring task managers.
- ❌ Priority flags (P1/P2/P3), color-coded tags, or custom metadata taxonomies.
- ❌ Cloud task import from Jira, Asana, Linear, or Todoist.

---

### 3.2 Milestone v2.2 — Ambient Synthesis & Acoustic Architecture (*Soundscapes & Audio Mixer*)

#### 3.2.1 Core Theme & User Value
Elevate ambient audio immersion into a studio-grade acoustic sanctuary using pure on-device Web Audio mathematical synthesis. Eliminates multi-megabyte sound file downloads, audible looping seams, and licensing ambiguities.

#### 3.2.2 User Experience & Interaction Model (Tier 1 & Tier 2)
1. **Dual-Layer Sound Palette Dialog (`SoundSettingsDialog.tsx` / Tier 2)**:
   - The primary timer retains its single quiet sound pill (`[Volume2] Sound`).
   - Clicking opens an elevated modal presenting a two-layer selector:
     * **Base Texture**: Off, Brown Noise, Pink Noise, Soft Rain, Ocean Waves, Bundled Sample, Custom Upload.
     * **Entrainment Resonance**: Off, Alpha Focus (10 Hz beat), Theta Rest (6 Hz beat).
   - Controls: Master Volume slider + Tone Warmth slider (modulating a Biquad lowpass filter cutoff between 200 Hz and 1200 Hz).
2. **Acoustic Transitions & Cross-Fades**:
   - 3.0-second exponential gain ramp on session start/pause.
   - Smooth 2.0-second crossfade when switching ambient textures or transitioning between focus and break modes.
   - Optional automatic switch to a tranquil stream texture during break phases.

#### 3.2.3 Web Audio Synthesis Formulas & Node Graphs

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WEB AUDIO SYNTHESIS GRAPH                       │
└────────────────────────────────────────────────────────────────────────┘

  [Procedural Texture Generator]
  ┌───────────────────────────────┐
  │ AudioBufferSourceNode (Noise) │ (Pink / Brown / Rain Buffer)
  └───────────────┬───────────────┘
                  │
                  ▼
  ┌───────────────────────────────┐
  │  BiquadFilterNode (Tone/LPF)  │ (Swept Cutoff: 200 Hz - 1400 Hz)
  └───────────────┬───────────────┘
                  │
                  ▼
  ┌───────────────────────────────┐      ┌─────────────────────────┐
  │       StereoPannerNode        │ ◄────┤ LFO (Sine, 0.05-0.08 Hz)│ (Spatial Breathing)
  └───────────────┬───────────────┘      └─────────────────────────┘
                  │
                  ▼
  ┌───────────────────────────────┐
  │        Noise GainNode         │
  └───────────────┬───────────────┘
                  │
                  ├─────────────────────────────────────────┐
                  │                                         │
  [Binaural Carrier Engine]                                 │
  ┌───────────────────────────────┐                         │
  │ Left Carrier Osc (Sine)       │ 216 Hz                  │
  └───────────────┬───────────────┘                         │
                  ▼                                         │
  ┌───────────────────────────────┐                         │
  │     Pan Left (-1.0) Gain      │                         │
  └───────────────┬───────────────┘                         │
                  │                                         ▼
                  │                               ┌───────────────────┐      ┌─────────────────┐
                  ├──────────────────────────────►│  Master GainNode  ├─────►│ ctx.destination │
                  │                               │ (Fade Ramps & Vol)│      └─────────────────┘
                  │                               └───────────────────┘
  ┌───────────────────────────────┐                         ▲
  │ Right Carrier Osc (Sine)      │ 226 Hz (10 Hz Alpha)    │
  └───────────────┬───────────────┘                         │
                  ▼                                         │
  ┌───────────────────────────────┐                         │
  │     Pan Right (+1.0) Gain     │                         │
  └───────────────┬───────────────┘                         │
                  │                                         │
                  └─────────────────────────────────────────┘
```

##### 1. Pink Noise ($1/f$ Spectrum, -3 dB/Octave)
Synthesized using Paul Kellet’s 6-pole filter over uniform white noise $w \in [-1, 1]$:
```typescript
export function generatePinkNoiseBuffer(ctx: AudioContext, seconds = 10): AudioBuffer {
  const samples = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, samples, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}
```

##### 2. Leaky Brown Noise ($1/f^2$ Spectrum, -6 dB/Octave) with LFO Breathing
Synthesized via a 1-pole leaky integrator modulated by an $0.08\text{ Hz}$ sine LFO:
$$y[n] = \frac{y[n-1] + 0.02 \cdot w[n]}{1.02}, \quad \text{output}[n] = 3.5 \cdot y[n]$$

##### 3. Tibetan Singing Bowl Modal Synthesis (Completion Chime)
Vibrational physics of a singing bowl modeled via five inharmonic modal partials with acoustic beating and a 25ms mallet strike transient:

| Partial | Ratio ($f / f_0$) | Frequency ($f_0 = 216\text{ Hz}$) | Gain Envelope | Decay Time ($\tau$) | Acoustic Role |
|---|---|---|---|---|---|
| **$f_1$ (Fundamental)** | $1.000$ | $216.0\text{ Hz}$ ($\pm 0.4\text{ Hz}$ beat) | $1.00$ ($0\text{ dB}$) | $6.0\text{ s}$ | Deep resonant body |
| **$f_2$ (Prime)** | $1.414$ ($\sqrt{2}$) | $305.4\text{ Hz}$ ($\pm 0.5\text{ Hz}$ beat) | $0.65$ ($-3.7\text{ dB}$) | $4.5\text{ s}$ | Inharmonic shimmer |
| **$f_3$ (Tierce)** | $2.000$ | $432.0\text{ Hz}$ | $0.40$ ($-8.0\text{ dB}$) | $3.2\text{ s}$ | Warm harmonic overtone |
| **$f_4$ (Septimal)** | $2.760$ | $596.2\text{ Hz}$ | $0.25$ ($-12.0\text{ dB}$) | $2.0\text{ s}$ | Upper bell ring |
| **$f_5$ (High Metal)** | $5.404$ | $1167.3\text{ Hz}$ | $0.12$ ($-18.4\text{ dB}$) | $0.8\text{ s}$ | Initial metallic brilliance |
| **Mallet Transient** | White noise burst | Bandpass ($2.4\text{ kHz}, Q=4$) | Peak $0.80$ | $0.025\text{ s}$ | Felt mallet contact |

##### 4. Binaural Beat Carrier Mechanics (Headphones Required)
- **Alpha Entrainment (Flow & Focus)**: Left Channel $= 216\text{ Hz}$, Right Channel $= 226\text{ Hz}$ ($\Delta f = 10\text{ Hz}$).
- **Theta Entrainment (Rest & Reflection)**: Left Channel $= 180\text{ Hz}$, Right Channel $= 186\text{ Hz}$ ($\Delta f = 6\text{ Hz}$).

##### 5. Procedural Soft Rain & Ocean Waves
- **Rain**: Pink noise buffer passed through a 2-pole lowpass filter ($f_c = 1100\text{ Hz}, Q=0.7$) combined with Poisson-distributed droplet impulses passed through a high bandpass filter ($f_c = 4200\text{ Hz}, Q=8$).
- **Ocean Waves**: Pink/brown noise passed through a Biquad filter whose cutoff frequency is swept cyclically by an asymmetric LFO ($3.5\text{s}$ surge to $1200\text{ Hz}$, $6.5\text{s}$ foam hiss recession to $250\text{ Hz}$).

#### 3.2.4 Lifecycle, Resource Disposal & Background Resilience
- **AudioContext Auto-Resume**: The `AudioContext` resumes gracefully on user gesture (`pointerdown`, `keydown`) if suspended by browser autoplay policies.
- **Garbage Collection Invariant**: Stopped `AudioBufferSourceNode` and `OscillatorNode` instances are immediately disconnected (`node.disconnect()`) and dereferenced to allow V8 garbage collection during multi-hour focus sessions.
- **Audio Thread Stability**: Processing executes on the OS real-time audio thread (WASAPI, CoreAudio, PipeWire), rendering audio playback completely immune to background tab execution throttling.

#### 3.2.5 Explicit Non-Goals
- ❌ External music streaming API integrations (Spotify, Apple Music, SoundCloud).
- ❌ Complex 10-channel mixing boards with excessive sliders.
- ❌ Abrasive raw white noise or crackling campfire transients that trigger startle reflexes.

---

### 3.3 Milestone v2.3 — Zen Habits & Subtle Milestones (*Zen Habits & Anti-Anxiety Consistency*)

#### 3.3.1 Core Theme & User Value
Acknowledge dedication and daily focus momentum without toxic gamification. Focus Flow rejects streak shaming, broken-chain alerts, and engagement traps in favor of serene milestone seals and reflective summary cards.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TRADITIONAL STREAKS vs. ZEN CONSISTENCY              │
├────────────────────────────────┬───────────────────────────────────────┤
│ Traditional Gamification       │ Focus Flow Zen Habit Philosophy       │
├────────────────────────────────┼───────────────────────────────────────┤
│ Fragile: 1 missed day = 0      │ Resilient: Rolling momentum & pebbles │
│ Red alert badge anxiety        │ Warm terracotta/sage; zero alarms     │
│ Coercive push notification spam│ Respects deliberate rest and weekends │
│ Public social competition      │ Private, self-contained reflection    │
└────────────────────────────────┴───────────────────────────────────────┘
```

#### 3.3.2 User Experience & Interaction Model (Tier 1 & Tier 3)
1. **Calm Hairline Daily Goal Ring**:
   - Users can configure an optional daily focus target (e.g. 100 minutes) in Timer Settings.
   - Visualized as a fine, concentric hairline ring on the outer perimeter of the Dial. It fills smoothly as sessions accumulate throughout the day.
   - When the target is reached, the dial center displays a quiet checkmark for 3 seconds alongside a soft singing bowl chime. No confetti cannons or modal takeovers.
2. **Zen Pebble Milestone Seals (`StatsView` / Tier 3)**:
   - Rendered as minimalist vector ink stamps inspired by balanced stones in a rock garden.
   - Unlocked milestones:
     * *The First Step*: First completed session.
     * *Pebble of Rhythm*: 3 active focus days within a single calendar week.
     * *Stone of Stillness*: 10 cumulative hours of deep focus.
     * *Garden of Flow*: 50 cumulative hours of deep focus.
     * *Century of Craft*: 100 cumulative hours of deep focus.
   - Unearned stamps appear as faint dotted outlines (`--border-default`); earned stamps render in warm ink (`--text-primary`) with the unlock date in overline typography.
3. **Rolling 30-Day Activity Mosaic (Parchment Heatmap)**:
   - A 30-day paper-toned grid showing daily density (0 to 4 focus blocks) with subtle terracotta tonal shifts, celebrating consistency without punishing rest days.
4. **Client-Side Canvas Summary Card Generator**:
   - Tapping `Export Weekly Card` in `StatsView` renders a 1200×630 image entirely in memory via an offscreen HTML5 `<canvas>` (`devicePixelRatio: 2`):
     * Fraunces serif typography, warm parchment background (`#F5F4ED`), 3% film grain overlay.
     * Total focus hours, weekly chart, and primary intentions.
     * Instant PNG download or clipboard copy for direct pasting into Obsidian, Notion, or personal journals.

#### 3.3.3 Technical Architecture & Data Mechanics
- **TypeScript Schema Extensions (`src/types.ts` & `src/lib/storage.ts`)**:

```typescript
export interface GoalSettings {
  dailyTargetMinutes: number // 0 = disabled, max 720
  enabled: boolean
}

export interface MilestoneRecord {
  id: string
  unlockedAt: string // ISO-8601 timestamp
  seen: boolean
}

export interface StatsV2 extends Stats {
  goals?: GoalSettings
  milestones?: MilestoneRecord[]
}
```

- **Canvas Card Rendering (`src/lib/cardExport.ts`)**:
  Canvas operations run synchronously in client memory. Fonts are resolved from `@fontsource-variable` font faces before painting. Image export triggers an ephemeral anchor blob download (`URL.createObjectURL(blob)`), generating zero server requests.

#### 3.3.4 Explicit Non-Goals
- ❌ Public leaderboards, social feeds, or multiplayer competitions.
- ❌ Gamified XP points, leveling systems, or "streak freeze" consumable tokens.
- ❌ Guilt-inducing push notifications or red warning banners when a streak breaks.

---

### 3.4 Milestone v2.4 — Sovereign Ecosystem & Local Exports (*Ecosystem & Local Exports*)

#### 3.4.1 Core Theme & User Value
Provide seamless interoperability with personal knowledge management (PKM) tools, spreadsheets, and calendar clients while maintaining strict zero-backend data sovereignty.

#### 3.4.2 User Experience & Interaction Model (Tier 2)
1. **Data & Ecosystem Exporter (`AppSettingsModal.tsx` / Tier 2)**:
   - A dedicated export section providing instant, single-click downloads:
     * **Markdown (`.md`)**: Formatted GitHub-Flavored Markdown tables grouped by date with summary callouts, designed for Obsidian and Notion.
     * **CSV (`.csv`)**: RFC 4180-compliant comma-delimited file with UTF-8 BOM for Microsoft Excel, Numbers, and Google Sheets.
     * **iCalendar (`.ics`)**: RFC 5545 calendar event feed mapping completed focus blocks directly to native calendar apps.
     * **Full Backup JSON (Schema v2)**: Complete, uncompressed JSON archive containing settings, stats, session history, micro-steps, presets, custom sound metadata, and interface preferences.
2. **Optional Client-Side Webhook Trigger (Direct Dispatch)**:
   - Users can configure a private HTTP POST URL (e.g., Discord channel, Slack workflow, Home Assistant, Make/Zapier).
   - Upon timer start, completion, or pause, the client dispatches a direct JSON payload without passing through an intermediary server.

#### 3.4.3 Technical Architecture & Export Serializers (`src/lib/export.ts`)

##### 1. RFC 5545 iCalendar (`.ics`) Serializer
```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Focus Flow//Pomodoro Companion//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:ff-session-s18f4a9b2@focus-flow.local
DTSTAMP:20260901T124500Z
DTSTART:20260901T090500Z
DTEND:20260901T093000Z
SUMMARY:Focus: Refactor Audio Engine
DESCRIPTION:Task: Refactor Audio Engine\nDuration: 25 minutes\nChecklist: 3/3 completed
STATUS:CONFIRMED
TRANSP:OPAQUE
CATEGORIES:Focus,Pomodoro
END:VEVENT
END:VCALENDAR
```

##### 2. RFC 4180 CSV Serializer with UTF-8 BOM
Prepend the UTF-8 Byte Order Mark (`\uFEFF`) to prevent character corruption in Microsoft Excel:
```csv
id,date_iso,date_local,time_local,duration_minutes,task,checklist_total,checklist_completed
"s18f4a9b2","2026-09-01T09:30:00.000Z","2026-09-01","09:30",25,"Refactor Audio Engine",3,3
```

##### 3. GitHub-Flavored Markdown Serializer
```markdown
# Focus Flow — Session History
*Exported on 2026-09-01 12:45 · 4 sessions · 100 minutes*

| Date | Time | Duration | Intention | Micro-Steps |
|---|---|---|---|---|
| 2026-09-01 | 09:05 | 25 min | Refactor Audio Engine | 3/3 |
| 2026-09-01 | 09:40 | 25 min | Web Audio Procedural Rain | 2/2 |
| 2026-09-01 | 10:15 | 25 min | Write Roadmap Specification | 4/4 |
| 2026-09-01 | 11:00 | 25 min | Vitest Verification Pass | 1/1 |

> **Daily Summary**: 4 sessions completed · 1 hour 40 minutes of deep focus.
```

##### 4. Full Backup Schema v2 (`BackupFileV2`)
```typescript
export interface BackupFileV2 {
  app: 'focus-flow'
  version: 2
  exportedAt: string // ISO timestamp
  data: {
    settings: Settings
    stats: StatsV2
    sessions: SessionLogEntryV2[]
    presets: TaskPreset[]
    sounds: BackupSound[]
    lang: Lang
    theme: Theme
    volume: number
    interface: InterfacePrefs
  }
}
```

##### 5. Web Worker Timer Ticker & Cold-Start Wake Reconciliation
- **Dedicated Timer Worker (`src/lib/timerWorker.ts`)**:
  To prevent backgrounded browser tabs from throttling `setInterval` down to 1000ms, a dedicated Web Worker maintains an unthrottled 250ms tick heartbeat.
- **Cold-Start Expiration Reconciliation**:
  If a user shuts their laptop lid during a running 25-minute focus session and reopens it after `endTs` has elapsed:
  1. On boot, `useTimerEngine` detects `snapshot.running && snapshot.endTs <= Date.now()`.
  2. The elapsed session is credited to `Stats` and logged to `SessionLog`.
  3. The timer advances round and mode to break cleanly.
  4. An in-app status message announces: *"Focus session completed while you were away."*

#### 3.4.4 Explicit Non-Goals
- ❌ Cloud-hosted synchronization database servers (Firebase, Supabase, AWS RDS).
- ❌ OAuth token management for Google Calendar or Microsoft Outlook cloud APIs.
- ❌ Bi-directional calendar mutation (reading, modifying, or deleting user external events).

---

### 3.5 Milestone v3.0 — Native Desktop Shell (*Tauri 2 & Tray Companion*)

#### 3.5.1 Core Theme & User Value
Transform Focus Flow into a first-class native desktop application (Windows, macOS, Linux) with dynamic system tray countdowns, global operating system hotkeys, and an always-on-top floating Picture-in-Picture (PiP) mini-dial.

#### 3.5.2 Why Tauri 2 Over Electron (ADR-006)
Electron packages an entire Chromium browser and Node.js runtime, requiring ~100 MB downloads and 150–300 MB of idle RAM. Tauri 2 binds directly to the OS webview (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) via a compiled Rust core:

| Metric | Web PWA | Tauri 2 Desktop (Target) | Electron (Rejected) |
|---|---|---|---|
| **Installer Size** | 0 MB (Cached) | **~3–8 MB** | ~85–110 MB |
| **Idle Memory (RAM)** | Browser Tab (~60 MB) | **~25–40 MB** | 150–300 MB |
| **System Tray Dial** | Not supported | **Supported (Dynamic SVG)** | Supported |
| **Global OS Hotkeys** | Not supported | **Supported (System-wide)** | Supported |
| **Local Storage Backend** | `localStorage` (Quota Risk) | **Atomic JSON Filesystem** | Filesystem |
| **Idle CPU Utilization** | < 0.1% | **< 0.05%** | ~0.5–2.0% |

#### 3.5.3 Native Desktop Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TAURI 2 DESKTOP ARCHITECTURE                      │
└────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────┐
  │                    React 19 Frontend Webview                      │
  │  (Dial, AudioEngine, Keyboard Navigation, Storage Bridge)         │
  └──────────────────┬────────────────────────────────────────────▲───┘
                     │ Tauri IPC Invoke                           │ Tauri Event Bus
                     ▼                                            │
  ┌───────────────────────────────────────────────────────────────┴───┐
  │                     Rust Native Core (Tauri 2)                    │
  ├───────────────────────────────────────────────────────────────────┤
  │ • Tray Manager: Dynamic SVG rendering into OS tray canvas         │
  │ • Global Shortcuts Plugin: Intercepts OS keys (Ctrl+Alt+Space)    │
  │ • Window Manager: Spawns frameless, floating PiP mini-window      │
  │ • Power & WakeLock: Prevents OS sleep during running sessions     │
  │ • Native File Storage Adapter: Atomic writes to ~/.focusflow.json │
  └───────────────────────────────────────────────────────────────────┘
```

#### 3.5.4 Desktop Feature Specifications
1. **Dynamic SVG System Tray Dial**:
   - The OS system tray icon updates dynamically each minute, rendering a miniature circular countdown dial and remaining minutes.
   - Tray Tooltip: Shows `Mode • MM:SS remaining • Active Task`.
   - Left-click toggles timer play/pause; right-click opens native context menu (*Start/Pause*, *Skip Phase*, *Reset*, *Show Main Window*, *Preferences*, *Quit*).
2. **Always-on-Top Floating Mini-Dial (Picture-in-Picture)**:
   - A dedicated frameless, transparent window (220×80px) displaying mode, serif countdown digits, and a subtle play/pause control.
   - Recedes to 70% opacity when unfocused so it floats peacefully above code editors and writing tools.
3. **Global Operating System Hotkeys**:
   - `Ctrl + Alt + Space` (Windows/Linux) / `Cmd + Option + Space` (macOS): Toggle timer.
   - `Ctrl + Alt + R` / `Cmd + Option + R`: Reset phase.
   - `Ctrl + Alt + F` / `Cmd + Option + F`: Toggle floating PiP window.
4. **Native Filesystem Storage Adapter**:
   - In Tauri mode (`detectPlatform() === 'tauri'`), `src/lib/storage.ts` transparently redirects persistence to an atomic local file (`$APPDATA/focus-flow/data.json`) via `@tauri-apps/plugin-fs`, completely eliminating browser cache eviction risks.
5. **Build Flag Isolation**:
   - The desktop production build passes `--mode desktop`, disabling `vite-plugin-pwa` service worker generation to prevent asset protocol collisions with Tauri's custom URL scheme.

#### 3.5.5 Explicit Non-Goals
- ❌ Invasive desktop activity monitoring, keystroke loggers, or window surveillance.
- ❌ Heavy persistent background daemons after exiting the tray.
- ❌ Multi-window window management bloat.

---

## 4. Cross-Cutting Non-Goals & Architectural Boundaries Matrix

To protect Focus Flow’s soul across all iterations, every architectural proposal must be evaluated against this strict boundary matrix:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CROSS-CUTTING NON-GOALS & BOUNDARIES                          │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ Proposed Temptation            │ Architectural & Design Rejection Rationale            │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Cloud Database Sync & Accounts │ Violates ADR-005. Introduces recurring server costs,  │
│                                │ privacy liabilities, auth token decay, and offline lag│
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Multi-tiered Project Backlogs  │ Morphs a quiet focus companion into a high-friction   │
│ & Jira/Todoist Importers       │ task organizer; increases cognitive startup friction. │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Competitive Gamification &     │ Induces guilt, anxiety, and eventual app abandonment  │
│ Broken-Streak Penalties        │ upon the first missed day or deliberate weekend off.  │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ External Streaming Audio APIs  │ Introduces network latency, playback buffering, token │
│ (Spotify / Apple Music)        │ refreshes, battery drain, and licensing complexities. │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Electron Native Packaging      │ Rebuffed by ADR-006. 150MB+ RAM and 100MB installers  │
│                                │ waste resources on a lightweight focus utility.       │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Telemetry, Analytics SDKs &    │ Violates user trust and sovereign privacy; Focus Flow │
│ Third-Party Tracking Pixels    │ operates with zero tracking beacons or phone-home SDKs│
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 5. Quality Assurance, Verification Gates & Definition of Done

Every milestone release must satisfy all verification gates prior to merge:

### 5.1 Automated Verification Pipeline
1. **Type Safety Gate**: `npm run typecheck` (`tsc --noEmit`) must complete with 0 errors under strict mode.
2. **Unit Test Suite Gate**: `npm run test:run` must achieve 100% green across all test suites (timer engine, storage validators, stats math, export serializers).
3. **Linting Gate**: `npm run lint` must pass with 0 warnings/errors.
4. **Linguistic Parity Gate**: Complete key-for-key parity between Polish (`pl`) and English (`en`) dictionaries in `src/lib/i18n.tsx`, validated by automated tests (`content.test.ts`).

### 5.2 Performance & Bundle Budgets
- **Web Production Bundle**: Total uncompressed JS bundle must remain strictly under **300 kB** (<90 kB gzip).
- **Lighthouse Scores (Mobile, Throttled)**:
  * Accessibility: **100**
  * Best Practices: **100**
  * SEO: **100**
  * Performance: **≥ 98** (LCP gated strictly by Fraunces variable webfont load).
- **Runtime Frame Budget**: 60 FPS / 120 FPS smooth rendering during all timer transitions and SVG dashoffset animations; 0 ms layout reflows during timer ticks.

### 5.3 Accessibility Baseline (WCAG 2.2 AA)
- 100% keyboard navigability with visible focus indicators (`--focus-ring`).
- Screen reader live regions (`aria-live="polite"`) announcing phase changes and full minutes without spamming audio buffers.
- Touch target hit boxes maintain a minimum area of **44×44px**.
- Verified high-contrast color stops across light and dark themes.
