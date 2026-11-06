# Focus Flow 3.1.2: guides, settings and motion

The guide library now has mountain photography, clearer category pages and a
compact reader. Settings use the same surfaces and control shapes as the rest
of the 3.1 interface. Navigation and dialogs now share a calmer motion system.

## Changes

- Main views crossfade with a short horizontal movement. Guide categories,
  articles, settings sections and onboarding steps use directional transitions;
  returning reverses the movement. Header and navigation positions stay fixed.
- Dialogs open with a small lift and close with a shorter fade. Focus mode uses
  the same curve. Closing visuals release focus and modal semantics immediately.
- Settings resize smoothly. The navigation underline, switches, checklist marks,
  chart bars and theme surfaces use related timing without an overshoot.
- Both the system preference and the app's Reduce motion setting replace screen
  movement with a 100 ms fade. Enabling the preference during a transition
  completes the movement immediately.
- Rapid navigation interrupts the current transition. Timer state, checklist
  drafts and retained reading positions survive view changes. Destination views
  load before they enter, and dialogs animate their actual contents.
- Seven generated landscape covers appear in the library and category headers.
  Local WebP files keep the total image payload near 517 KiB and work offline.
- Category pages show a description, an actual article count, estimated reading
  time and a readable article list. Long names fit mobile and tablet layouts.
- Articles begin below a compact sticky back row. The previous padded close row
  and repeated category label no longer push the title down the screen.
- Settings group appearance, working preferences and data into plain rows. Theme
  choices show small interface previews. The main sync row has a short summary;
  the full explanation remains in the sync dialog.
- The library grows from 27 to 48 articles. All 21 additions have copy in Polish,
  English, Spanish and Simplified Chinese, shared citations and source-review dates.
- Introductions to all 27 existing guides have been rewritten in four languages,
  and four titles shortened using the Humanizer skill. Research claims, practical
  steps and limitations are retained. The repository now requires the skill for
  authored or revised prose.
- Category imagery is grayscale in the e-ink theme. The other four themes retain
  their current palette. Keyboard controls, reduced motion and safe areas remain.
- npm and Cargo metadata use version 3.1.2. Storage and synchronization schemas
  are unchanged. No dependencies or permissions were added.

[Motion behavior and implementation](MOTION.md) documents timing, interruptions
and accessibility. [Content sources and image prompts](GUIDE-CONTENT.md) describe the evidence and
local assets. [Local validation](validation/3.1.2/VALIDATION.md) records the tests
and remaining limits.

## Install and update

The web app and installed PWA are available at [focusflow.ink](https://focusflow.ink).
Desktop installers and their SHA-256 manifest are published on the
[3.1.2 release page](https://github.com/w3ziqv/focus-flow/releases/tag/v3.1.2).
Use installers, build metadata and checksums from that same release. Follow the
[installation and rollback guide](INSTALL-UPDATE.md) before updating.

Production installers use the existing protected production workflow. Linux
packages target x86_64, Windows uses an x64 NSIS installer, and macOS ARM64 remains
experimental and is not notarized. Installers remain unsigned. Storage, backup,
account and synchronization schemas are unchanged.

The release entry records the exact source commit and completed workflow runs.
Local browser checks cover the new interface and motion; native workflow results
cover builds and installed Linux/Windows behavior. Physical iPhone/PWA rendering,
interactive macOS use and the acceptance limits in the
[validation report](validation/3.1.2/VALIDATION.md) remain separate checks.
