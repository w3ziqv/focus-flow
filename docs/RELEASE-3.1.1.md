# Focus Flow 3.1.1 — interface refinement

Focus Flow 3.1.1 makes the existing web/PWA and desktop interface quieter while
keeping the circular timer, warm themes and the 3.1 navigation and data behavior.

## Changes

- Plain desktop navigation and an opaque mobile bottom bar replace the repeated
  floating pill treatment. Centered navigation and all four safe-area insets stay.
- Task presets become text actions. The timer keeps 12 major ticks; decorative
  grain and entrance animation are removed from the core timer/statistics views.
- Controls use a shared 6px radius and panels use 8px. Secondary actions and data
  surfaces rely on tone rather than repeated borders and nested cards.
- First-run statistics show one explanation and the actual start-session action,
  instead of zero charts, search filters and five locked milestones.
- Retained aggregate totals still expose statistics when the bounded or imported
  session log is empty. A search with no matches keeps its search/date controls.
- Populated statistics use an aligned overview and plain session rows. Milestones
  remain available in a keyboard-accessible disclosure, with readable labels.
- Zero-minute bars have zero height. Task bars use their actual percentage without
  an artificial minimum fill.
- The guide index uses compact topic rows with its existing descriptions and
  article counts. All 27 guides and their source links remain available.
- First-run copy is provided in Polish, English, Spanish and Simplified Chinese.
  All five themes, visible keyboard focus and existing timer shortcuts remain.

## Compatibility and update

This patch does not change storage, backup, account or Firestore schemas. Active
deadlines, task/checklist input, retained views, guide routes, synchronization
and export behavior continue to use the 3.1 implementation. No dependencies,
externally hosted fonts, telemetry or new permissions are added.

The web app and installed PWA remain at [focusflow.ink](https://focusflow.ink).
Desktop downloads and the flat SHA-256 manifest are published on the
[3.1.1 release page](https://github.com/w3ziqv/focus-flow/releases/tag/v3.1.1).
Use installer metadata and checksums from the same release. Follow the
[installation, backup and rollback guide](INSTALL-UPDATE.md); preserve a JSON
backup, the native data directory and the previous installer before updating.

Installers remain unsigned. Linux targets x86_64, Windows uses an x64 NSIS
installer, and macOS ARM64 remains experimental and is not notarized. Production
installers must come from the existing protected production workflow; ordinary
pull-request installers intentionally use offline configuration.

## Validation

Local interface validation passed 910 application tests, TypeScript, ESLint,
generated-token consistency and the production web build. Responsive checks
covered 16 language/viewport combinations, injected PWA safe areas, retained
routes/drafts/deadlines, five themes and JSON download. Browser interaction checks
covered nested dialogs, keyboard focus restoration, resize persistence and
sound/language/synchronization/offline state. Axe WCAG A/AA checks covered the
Polish timer, statistics and cloud dialog, plus modal keyboard behavior and
200% CSS zoom.

The focused regressions cover the first-session action, aggregate-only history
and clearing a search with no matches. Visual review covered timer, empty and
populated statistics and the guide index at 1440, 768 and 390px. The existing
brand palette is retained. The inspection tool's first-h1 lookup selects the
hidden retained Timer view on other screens; active headings were checked
separately rather than removing retained views to satisfy that probe.

Release checks additionally verify both web and desktop build isolation and
version consistency across npm and Cargo metadata. Protected-branch CI and the
production desktop workflow provide native build and installed-app results; the
release entry links the exact source and completed workflow runs.

Physical iPhone/PWA acceptance, real two-device P2P, interactive macOS acceptance,
full screen-reader/volunteer acceptance and current real-account OAuth/device
scenarios remain unverified. Automated checks and publication do not turn these
into passing checks. The security and data-recovery boundaries from the
[3.1 security review](SECURITY-REVIEW-3.1.md) continue to apply.
