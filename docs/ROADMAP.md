# Focus Flow — Technical Product Roadmap Specification (v2.1 → v3.0)

**Document Version:** 2.1.0  
**Author:** Lead Systems Architect & Core Platform Team  
**Status:** Approved Engineering Specification  
**Target Platform:** Web (PWA / Offline-First) & Native Desktop (Tauri 2)  
**Verification Baseline:** TypeScript 7.0 Native Go (`tsc --noEmit`), Vitest 100% Green, ADR-001–ADR-008 Compliance  

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

## 2. 6-Stage Release Progression & Architecture Decision Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       6-STAGE RESTRUCTURED PRODUCT ROADMAP                                     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

   Stage 1: v2.1 Infrastructure & Tooling (TS 7.0 Native Go / Corsa, Vitest 4+, Modern Toolchain)
            │
            ▼
   Stage 2: v2.2 Enhanced Audio Engine & Sound Synthesis (Procedural Math, Binaural Beats, Presets)
            │
            ▼
   Stage 3: v2.3 Task Management & Productivity Analytics (Micro-Steps, Zen Milestones, Heatmap, Canvas)
            │
            ▼
   Stage 4: v2.4 Data Portability, Integrations & Offline Sync (RFC 5545, CSV BOM, Webhooks, Timer Worker)
            │
            ▼
   Stage 5: v2.5 Customization, Themes & Accessibility (WCAG AAA, Theming, Shortcuts Manager)
            │
            ▼
   Stage 6: v3.0 Platform Expansion & Multi-Device Synchronization (Tauri 2 Desktop, Tray Dial, P2P Sync)
```

| Milestone | Target Version | Primary Scope Summary | Storage Schema | Audio Engine State | Local Export Formats | Target Platform | Primary Anti-Pattern Eliminated |
|---|---|---|---|---|---|---|---|
| **Stage 1** | **v2.1** | Infrastructure & Tooling Matrix | Schema v1.1 (`ff2_` unified adapter) | Baseline 2-note chime & brown noise | JSON Backup v1 | Web / CI | Slow V8 compilation, multi-second CI delays & type-check memory bloat |
| **Stage 2** | **v2.2** | Enhanced Audio Engine & Sound Synthesis | Schema v1.2 (Mixer prefs & tone cutoff) | Pure Web Audio math synthesis (0 KB assets) | JSON Backup v1 | Web / PWA | Multi-MB audio downloads, audible loop clicks & audio thread stalling |
| **Stage 3** | **v2.3** | Task Management & Productivity Analytics | Schema v1.3 (Tasks, goals & milestones) | Synthesized 5-partial modal singing bowl chime | Offline Canvas PNG Card | Web / PWA | Jira/Todoist backlog creep, broken-streak shame & toxic gamification |
| **Stage 4** | **v2.4** | Data Portability, Integrations & Offline Sync | Schema v2.0 (`BackupFileV2` full archive) | Dual-layer mixer + binaural carriers | RFC 4180 CSV, GFM Markdown, RFC 5545 `.ics` | Web / PWA | Cloud database lock-in, OAuth server walls & background tab throttling |
| **Stage 5** | **v2.5** | Customization, Themes & Accessibility | Schema v2.1 (`InterfacePrefs` extensions) | Full dual-layer acoustic palette | All v2.4 formats | Web / PWA | Inaccessible low-contrast UI, rigid layouts & keyboard traps |
| **Stage 6** | **v3.0** | Platform Expansion & Multi-Device Sync | Schema v3.0 (Atomic JSON + P2P CRDT sync) | OS-integrated audio engine | All v2.4 formats + Native File I/O | Windows, macOS, Linux | Bloated Electron runtime (150MB+ RAM), spyware daemons & cloud sync servers |

---

## 3. Milestone Specifications

---

### 3.1 Stage 1: Milestone v2.1 — Infrastructure & Tooling (*TypeScript 7.0 Native Go & Modern Toolchain*)

#### 3.1.1 Core Theme & Engineering Value
Milestone v2.1 establishes an ultra-fast, strictly typed developer foundation and unified persistence architecture. By adopting **TypeScript 7.0 (Project Corsa)**, Focus Flow replaces the Node.js V8 runtime layer with a high-performance native Go compiler binary (`tsc`). This delivers 10x–20x faster type checking, eliminates JIT warmup latencies, cuts CI/CD memory footprints by over 78%, and solidifies storage boundary validation before rolling out downstream acoustic and data features.

#### 3.1.2 TypeScript 7.0 Native Go Compiler Integration (Project Corsa)
In conformance with **ADR-001**, the TypeScript 7.0 native Go engine executes directly on the host OS architecture without V8 runtime overhead:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              TYPESCRIPT 7.0 (PROJECT CORSA) PIPELINE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Native Source Files (.ts, .tsx)                                       │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 1. Parallel Go Scanner & Parser (Goroutines per file)        │      │
│   │    • Direct OS thread scheduling                             │      │
│   │    • Compact Go struct AST nodes (50-80% lower RAM)          │      │
│   └──────────────────────────────┬───────────────────────────────┘      │
│                                  ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 2. Symbol Binder & Scope Resolver                            │      │
│   │    • Lock-free concurrent symbol tables                      │      │
│   └──────────────────────────────┬───────────────────────────────┘      │
│                                  ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 3. Parallel Semantic Type Checker (Work-Stealing Scheduler)  │      │
│   │    • Strict null checks, union resolution, type inference    │      │
│   │    • Zero JIT warmup; immediate native execution             │      │
│   └──────────────────────────────┬───────────────────────────────┘      │
│                                  ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │ 4. Output Gate / Isolated Declarations Emitter               │      │
│   │    • `tsc --noEmit` exit code 0 or structured diagnostics    │      │
│   │    • Memory-mapped binary `.tsbuildinfo` incremental cache   │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Multi-Core Goroutine Scheduling:** Distributes parsing and type checking across all available CPU cores via native Go work-stealing schedulers, bypassing Node.js single-threaded event loop bottlenecks.
2. **Compact Struct AST Memory Layout:** Go value-type structs replace V8 object headers (which carry 32–48 bytes of hidden-class and prototype overhead per AST node), reducing compiler peak RSS memory by 78%+.
3. **Zero JIT Warmup:** Native machine binary runs immediately at full speed, eliminating the 500–1500ms Ignition/Turbofan tier-up penalty.
4. **Binary Incremental Caching:** Generates memory-mapped `.tsbuildinfo` images for sub-30ms warm incremental checks.

##### TypeScript Compilation & Performance Benchmarks

| Benchmark Metric | TS 5.8 (Node 22 / V8) | TS 7.0 (Native Go) | Improvement Delta |
|---|---|---|---|
| **Cold CI Type-Check (`tsc --noEmit`)** | 2380 ms | **165 ms** | **14.4x faster** |
| **Warm Incremental Check** | 420 ms | **85 ms** | **4.9x faster** |
| **Peak Memory Footprint (RSS)** | 245 MB | **52 MB** | **78.7% reduction** |
| **JIT Warmup Latency** | 850 ms | **0 ms** | **Instantaneous** |
| **Binary Cache Loading** | 120 ms | **18 ms** | **6.7x faster** |

##### Compiler Settings & Strict Boundaries (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedDeclarations": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
```

#### 3.1.3 Modern Toolchain Matrix & Integration Mechanics
- **Vite 7+ / Rollup:** Transpiles modules during development via esbuild (<10ms HMR). In production builds, `tsc --noEmit` runs as a mandatory static verification gate prior to Rollup asset bundling.
- **Vitest 4+:** High-throughput in-memory test runner executing unit, boundary, math, and adversarial test suites in JSDOM.
- **ESLint 10+ & typescript-eslint v8+:** Flat configuration architecture (`eslint.config.js`) operating with complete AST parity for type-aware linting.
- **React 19 Types:** Strict typings (`@types/react` v19.1.x, `@types/react-dom` v19.1.x) with automatic JSX transform (`react-jsx`).
- **Tailwind CSS v4:** Integrated via `@tailwindcss/vite`, parsing CSS-first `@theme` design tokens and eliminating PostCSS overhead.

#### 3.1.4 Storage Layer Unification & Boundary Sanitization
- In conformance with **ADR-003**, all direct invocations of `localStorage` across legacy components are removed.
- All reads, writes, and migrations route exclusively through `src/lib/storage.ts`.
- Implements Schema v1.1 boundary sanitizers: malformed JSON, prototype pollution payloads, and out-of-bounds numbers are intercepted and replaced with safe defaults without throwing runtime exceptions.

#### 3.1.5 Fast CI Verification Gates
- Full CI quality gate (`npm run typecheck`, `npm run lint`, `npm run test:run`) executing deterministically in under 3.0 seconds.

#### 3.1.6 Explicit Non-Goals
- ❌ No user interface modifications or visual regressions during infrastructure stabilization.
- ❌ No cloud-based build servers or remote compiler dependencies.
- ❌ No premature runtime refactors outside of persistence storage layer unification.

---

### 3.2 Stage 2: Milestone v2.2 — Enhanced Audio Engine & Sound Synthesis (*Procedural Math & Acoustic Sanctuary*)

#### 3.2.1 Core Theme & User Value
Milestone v2.2 elevates ambient audio immersion into a studio-grade acoustic sanctuary using pure on-device Web Audio mathematical synthesis. It completely eliminates multi-megabyte sound file downloads, audible looping seams, and licensing ambiguities while maintaining a **0 KB static asset footprint**.

#### 3.2.2 User Experience & Interaction Model (Tier 1 & Tier 2)
1. **Dual-Layer Sound Palette Dialog (`SoundSettingsDialog.tsx` / Tier 2)**:
   - The primary timer retains its single quiet sound pill (`[Volume2] Sound`).
   - Clicking opens an elevated modal presenting a two-layer selector:
     * **Base Texture**: Off, Brown Noise, Pink Noise, Soft Rain, Ocean Waves, Bundled Sample, Custom Upload.
     * **Entrainment Resonance**: Off, Alpha Focus (10 Hz beat), Theta Rest (6 Hz beat).
   - Controls: Master Volume slider + Tone Warmth slider (modulating a Biquad lowpass filter cutoff between 200 Hz and 1200 Hz).
2. **Acoustic Transitions & Cross-Fades**:
   - 3.0-second exponential gain ramp on session start/pause (`gainNode.gain.exponentialRampToValueAtTime`).
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

#### 3.2.5 Storage Schema
- Schema v1.2: Adds `soundPreferences` and tone warmth cutoff frequencies to storage schema.

#### 3.2.6 Explicit Non-Goals
- ❌ External music streaming API integrations (Spotify, Apple Music, SoundCloud).
- ❌ Complex 10-channel mixing boards with excessive sliders.
- ❌ Abrasive raw white noise or crackling campfire transients that trigger startle reflexes.

---

### 3.3 Stage 3: Milestone v2.3 — Task Management & Productivity Analytics (*Intention Anchor & Zen Consistency*)

#### 3.3.1 Core Theme & User Value
Focus Flow is an **Intention Anchor**, not an issue tracker. A session task exists solely to tether the user's mind to a single commitment for the next 25–50 minutes. Milestone v2.3 introduces ephemeral micro-steps to solve the initial inertia problem, provides in-place session log management, and acknowledges daily focus momentum with serene milestone seals and reflective summary cards—without toxic gamification.

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
1. **Ephemeral Session Checklist (Max 3 Micro-Steps)**:
   - Within `TaskField` (Tier 1), clicking `+ Add micro-step` reveals up to 3 checklist inputs (capped at 140 chars each).
   - Micro-steps render as delicate 14px check circles with Instrument Sans text beneath the active intention.
   - Checking a micro-step strikes through the text with a 120ms micro-transition.
   - *Ephemeral Scoping*: Micro-steps attach exclusively to the active session. When the timer completes, micro-step completion states are recorded into the session log record, but uncompleted items do not carry forward into future sessions as uncompleted backlog debt.
2. **Intent Presets (Single-Tap Activation)**:
   - Below an empty `TaskField`, a horizontal row of quiet chips presents customizable intention presets (*Deep Work*, *Writing*, *Code Review*, *Reading*, *Inbox Zero*, capped at 200 chars).
   - Tapping a preset populates the input instantly without modal interruption.
3. **Session Log In-Place Correction & Filtering (`StatsView` / Tier 3)**:
   - Session history displays a sunken search well with real-time substring filtering across task titles and dates.
   - Clicking a task title allows inline editing (`Enter` commits, `Esc` cancels).
   - Erroneously logged sessions can be deleted with a swipe or trash click; deletion atomically decrements aggregate statistics (`stats.minutes`, `stats.today`, `stats.week`, and `stats.history[dayKey]`) to prevent orphaned metrics.
4. **Calm Hairline Daily Goal Ring**:
   - Users can configure an optional daily focus target (e.g. 100 minutes) in Timer Settings.
   - Visualized as a fine, concentric hairline ring on the outer perimeter of the Dial. It fills smoothly via SVG `stroke-dashoffset` as sessions accumulate throughout the day.
   - When the target is reached, the dial center displays a quiet checkmark for 3 seconds alongside a soft singing bowl chime. No confetti cannons or modal takeovers.
5. **Zen Pebble Milestone Seals (`StatsView` / Tier 3)**:
   - Rendered as minimalist vector ink stamps inspired by balanced stones in a rock garden:
     * *The First Step*: First completed session.
     * *Pebble of Rhythm*: 3 active focus days within a single calendar week.
     * *Stone of Stillness*: 10 cumulative hours of deep focus.
     * *Garden of Flow*: 50 cumulative hours of deep focus.
     * *Century of Craft*: 100 cumulative hours of deep focus.
   - Unearned stamps appear as faint dotted outlines (`--border-default`); earned stamps render in warm ink (`--text-primary`) with the unlock date in overline typography.
6. **Rolling 30-Day Activity Mosaic (Parchment Heatmap)**:
   - A 30-day paper-toned grid showing daily density (0 to 4 focus blocks) with subtle terracotta tonal shifts, celebrating consistency without punishing rest days.
7. **Client-Side Canvas Summary Card Generator**:
   - Tapping `Export Weekly Card` in `StatsView` renders a 1200×630 image entirely in memory via an offscreen HTML5 `<canvas>` (`devicePixelRatio: 2`):
     * Fraunces serif typography, warm parchment background (`#F5F4ED`), 3% film grain overlay.
     * Total focus hours, weekly chart, and primary intentions.
     * Instant PNG download or clipboard copy for direct pasting into Obsidian, Notion, or personal journals.

#### 3.3.3 Technical Architecture & Data Schemas

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
- **Storage Bounds & Sanitization**:
  The session log is capped at 1,000 entries (representing over a year of active daily use, consuming ~382 KB of storage). Task strings are clamped to 200 characters and micro-step text to 140 characters, preventing adversarial quota exhaustion.

#### 3.3.4 Storage Schema
- Schema v1.3: Extended with `ChecklistItem`, `TaskPreset`, `SessionLogEntryV2`, `GoalSettings`, and `MilestoneRecord`.

#### 3.3.5 Explicit Non-Goals
- ❌ Persistent multi-project task backlogs, folders, or Kanban boards.
- ❌ Due dates, scheduling algorithms, time estimates, or recurring task managers.
- ❌ Priority flags (P1/P2/P3), color-coded tags, or custom metadata taxonomies.
- ❌ Cloud task import from Jira, Asana, Linear, or Todoist.
- ❌ Public leaderboards, social feeds, or multiplayer competitions.
- ❌ Gamified XP points, leveling systems, or "streak freeze" consumable tokens.
- ❌ Guilt-inducing push notifications or red warning banners when a streak breaks.

---

### 3.4 Stage 4: Milestone v2.4 — Data Portability, Integrations & Offline Sync (*Sovereign Ecosystem & Background Execution*)

#### 3.4.1 Core Theme & User Value
Provide seamless interoperability with personal knowledge management (PKM) tools, spreadsheets, and calendar clients while maintaining strict zero-backend data sovereignty and unthrottled timer execution in background browser tabs.

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
export interface BackupSound {
  id: string
  name: string
  audio?: string
}

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

#### 3.4.4 Storage Schema
- Schema v2.0: Full structured backup archive containing session snapshots, checklists, custom sounds, and UI preferences.

#### 3.4.5 Explicit Non-Goals
- ❌ Cloud-hosted synchronization database servers (Firebase, Supabase, AWS RDS).
- ❌ OAuth token management for Google Calendar or Microsoft Outlook cloud APIs.
- ❌ Bi-directional calendar mutation (reading, modifying, or deleting user external events).

---

### 3.5 Stage 5: Milestone v2.5 — Customization, Themes & Accessibility (*WCAG 2.2 AAA & Sensory Personalization*)

#### 3.5.1 Core Theme & User Value
Elevate the product to universal accessibility standards (**WCAG 2.2 AAA**), provide sensory-friendly personalization for neurodivergent and light-sensitive users, and empower power users with full keyboard mastery.

#### 3.5.2 User Experience & Accessibility Enhancements (Tier 1 & Tier 2)
1. **WCAG 2.2 AAA Accessibility Suite**:
   - Enhanced contrast stops: minimum contrast ratio of 7:1 for normal body text and 4.5:1 for large display text across all active themes.
   - High-contrast focus indicator ring (`--focus-ring: #3898EC`, 2px solid with 2px offset) enabled on all interactive elements during keyboard navigation.
   - Touch target hit boxes maintain a strict minimum bounding box of **44×44px**.
   - Screen reader polite live regions (`aria-live="polite"`) announcing timer state changes, phase completions, and round advances without spamming the user.
2. **Keyboard Shortcuts Manager Modal (`ShortcutsModal.tsx` / Tier 2)**:
   - Visual interactive cheat sheet and configuration panel accessible via `?` key or settings.
   - Global shortcuts:
     * `Space`: Toggle Start / Pause (isolated when text input is focused).
     * `R`: Reset current timer phase.
     * `F`: Toggle Focus Overlay mode.
     * `Esc`: Close open modal / cancel inline editing.
     * `Arrow Up / Down`: Adjust active timer duration in steppers.
3. **Sensory-Friendly Themes Palette**:
   - **Warm Parchment** (Default): Tactile paper background (`#F5F4ED`) with charcoal ink (`#141413`).
   - **Warm Soot Dark**: Low-glare dark canvas (`#141413`) with muted bone typography (`#E6E4D9`).
   - **High-Contrast Obsidian**: Pure black background (`#000000`) with ultra-crisp white text (`#FFFFFF`) meeting strict AAA standards.
   - **Botanical Sage**: Calming earthy olive/sage palette for prolonged visual calm.
   - **E-Ink Monochrome**: Zero-color high-contrast grayscale optimized for e-paper displays and maximum distraction reduction.
4. **Granular Screen Reader Narration Controls**:
   - Configurable narration verbosity: *Minimal* (phase completion chimes only), *Standard* (phase changes and round finishes), *Detailed* (minute tick reminders and task title readout).
5. **Advanced Hardware-Accelerated Reduced Motion**:
   - Dual-layer respect for `prefers-reduced-motion: reduce` and manual app toggle.
   - Restricts all animated properties strictly to `transform`, `opacity`, `filter`, and SVG `stroke-dashoffset`. Layout properties (`height`, `width`, `margin`) are completely forbidden from transitions.

#### 3.5.3 Technical Architecture & Data Schemas

```typescript
export interface NarrationSettings {
  verbosity: 'minimal' | 'standard' | 'detailed'
  voiceAlertsEnabled: boolean
}

export interface ShortcutKeymap {
  toggleTimer: string
  resetTimer: string
  toggleFullscreen: string
  openSettings: string
}

export interface ThemeTokens {
  id: string
  name: string
  surfacePage: string
  surfaceCard: string
  textPrimary: string
  textSecondary: string
  accentFocus: string
  accentBreak: string
  focusRing: string
}
```

#### 3.5.4 Storage Schema
- Schema v2.1: Extended `InterfacePrefs` with custom theme selection, shortcut mappings, and narration verbosity.

#### 3.5.5 Explicit Non-Goals
- ❌ Cloud-hosted theme marketplaces or third-party CSS injection.
- ❌ Heavy, non-standard CSS animation libraries that compromise rendering performance.
- ❌ Decorative, non-functional animations that increase cognitive load.

---

### 3.6 Stage 6: Milestone v3.0 — Platform Expansion & Multi-Device Synchronization (*Tauri 2 Desktop & Local-First P2P Sync*)

#### 3.6.1 Core Theme & User Value
Transform Focus Flow into a first-class native desktop application (Windows, macOS, Linux) with dynamic system tray countdowns, global operating system hotkeys, an always-on-top floating Picture-in-Picture (PiP) mini-dial, and zero-server peer-to-peer data synchronization across local devices.

#### 3.6.2 Why Tauri 2 Over Electron (ADR-006)
Electron packages an entire Chromium browser and Node.js runtime, requiring ~100 MB downloads and 150–300 MB of idle RAM. Tauri 2 binds directly to the OS webview (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux) via a compiled Rust core:

| Metric | Web PWA | Tauri 2 Desktop (Target) | Electron (Rejected) |
|---|---|---|---|
| **Installer Size** | 0 MB (Cached) | **~3–8 MB** | ~85–110 MB |
| **Idle Memory (RAM)** | Browser Tab (~60 MB) | **~25–40 MB** | 150–300 MB |
| **System Tray Dial** | Not supported | **Supported (Dynamic SVG)** | Supported |
| **Global OS Hotkeys** | Not supported | **Supported (System-wide)** | Supported |
| **Local Storage Backend** | `localStorage` (Quota Risk) | **Atomic JSON Filesystem** | Filesystem |
| **Idle CPU Utilization** | < 0.1% | **< 0.05%** | ~0.5–2.0% |

#### 3.6.3 Native Desktop Technical Architecture

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
  │ • Local P2P Sync Engine: WebRTC / CRDT local peer exchange        │
  └───────────────────────────────────────────────────────────────────┘
```

#### 3.6.4 Desktop & Sync Feature Specifications
1. **Dynamic SVG System Tray Dial**:
   - The OS system tray icon updates dynamically each minute, rendering a miniature circular countdown dial and remaining minutes.
   - Dynamic rasterizer renders with native OS DPI scaling: macOS Retina (44px), Windows 100% (16px), Windows 150% (24px), Windows 200% (32px), Linux GNOME (22px).
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
6. **Zero-Server Local-First P2P Multi-Device Sync**:
   - Local network encrypted synchronization using WebRTC and Conflict-Free Replicated Data Types (CRDTs).
   - Devices on the same Wi-Fi discover each other via mDNS / local broadcast and reconcile session histories without routing data through an external server or cloud database.

#### 3.6.5 Storage Schema
- Schema v3.0: File-backed atomic JSON storage model with CRDT vector clocks for local P2P multi-device sync.

#### 3.6.6 Explicit Non-Goals
- ❌ Invasive desktop activity monitoring, keystroke loggers, or window surveillance spyware.
- ❌ Heavy persistent background daemons after exiting the application tray.
- ❌ Multi-window window management bloat.
- ❌ Centralized telemetry, tracking servers, or user profiling SDKs.

---

## 4. Cross-Cutting Non-Goals & Architectural Invariants Matrix

To protect Focus Flow’s soul across all iterations, every architectural proposal must be evaluated against this strict boundary matrix:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CROSS-CUTTING NON-GOALS & BOUNDARIES                          │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ Proposed Temptation            │ Architectural & Design Rejection Rationale            │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Cloud Database Sync & Accounts │ Violates ADR-005. Introduces recurring server costs,  │
│ (Firebase / Supabase / AWS)    │ privacy liabilities, auth token decay, and offline lag│
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
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Complex 10-Channel Audio Mixers│ Excessive sliders distract from immediate focus work. │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Bi-Directional Calendar Write  │ Risk of corrupting user primary calendars via OAuth.  │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ Desktop Surveillance & Spyware │ Keystroke loggers and window monitors violate trust.  │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 5. Storage Evolution & Migration Strategy Matrix (Schema v1.0 → v3.0)

All persistence operations follow a deterministic, forward-compatible schema evolution path managed centrally by `src/lib/storage.ts`:

| Schema Version | Milestone | Storage Key / Target | Managed Entities | Validation & Migration Rules |
|---|---|---|---|---|
| **v1.0** | Baseline | `focus_settings`, `focus_stats` | Legacy settings & raw minutes | Unsanitized raw reads; migrated transparently to v1.1 format on first load. |
| **v1.1** | **v2.1** | `ff2_settings`, `ff2_stats`, `ff2_sessions` | Typed Settings, Stats, basic Session records | Strict boundary validation; prototype pollution payloads stripped; malformed numbers clamped. |
| **v1.2** | **v2.2** | `ff2_sound_prefs` | Sound texture, tone warmth cutoff (200-1200Hz), binaural preset | Graceful fallback to brown noise if custom sound metadata is missing or corrupted. |
| **v1.3** | **v2.3** | `ff2_sessions`, `ff2_presets`, `ff2_milestones` | Ephemeral micro-steps (max 3), Presets (max 200 chars), Zen Pebble unlock timestamps | Caps sessions at 1,000 records (~382 KB); validates micro-step text length (max 140 chars). |
| **v2.0** | **v2.4** | `BackupFileV2` (JSON Export / Import) | Full application state archive with sound metadata | Validates export schema version; safely ignores unrecognized keys without throwing. |
| **v2.1** | **v2.5** | `ff2_interface` | Theme tokens, shortcut mappings, narration verbosity | Falls back to default Warm Parchment theme if custom theme tokens fail contrast check. |
| **v3.0** | **v3.0** | `$APPDATA/focus-flow/data.json` & P2P CRDT | Atomic local JSON file + CRDT vector clocks | Atomic write via temporary file swap to eliminate corruption during OS shutdown. |

---

## 6. Quality Assurance, Verification Gates & Definition of Done

Every milestone release must satisfy all verification gates prior to merge:

### 6.1 Automated Verification Pipeline
1. **Type Safety Gate**: `npm run typecheck` (`tsc --noEmit` via TypeScript 7.0 Native Go compiler) must complete with 0 errors under strict mode (<165ms).
2. **Unit & Adversarial Test Gate**: `npm run test:run` must achieve 100% green across all test suites (timer engine, storage validators, synthesis math bounds, export serializers, adversarial length checks).
3. **Linting Gate**: `npm run lint` must pass with 0 warnings and 0 errors under ESLint flat config.
4. **Linguistic Parity Gate**: Complete key-for-key parity between Polish (`pl`) and English (`en`) dictionaries in `src/lib/i18n.tsx`, validated by automated tests (`content.test.ts`).

### 6.2 Performance & Bundle Budgets
- **Web Production Bundle**: Total uncompressed JS bundle must remain strictly under **300 kB** (<90 kB gzip).
- **Lighthouse Scores (Mobile, Throttled)**:
  * Accessibility: **100**
  * Best Practices: **100**
  * SEO: **100**
  * Performance: **≥ 98** (LCP gated strictly by Fraunces variable webfont load).
- **Runtime Frame Budget**: 60 FPS / 120 FPS smooth rendering during all timer transitions and SVG dashoffset animations; 0 ms layout reflows during timer ticks.

### 6.3 Accessibility Baseline (WCAG 2.2 AAA)
- 100% keyboard navigability with visible high-contrast focus indicators (`--focus-ring: #3898EC`).
- Screen reader live regions (`aria-live="polite"`) announcing phase changes and full minutes without spamming audio buffers.
- Touch target hit boxes maintain a minimum area of **44×44px**.
- Verified high-contrast color stops (minimum 7:1 body text, 4.5:1 large text) across all themes.
