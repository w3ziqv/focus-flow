# Interface motion

Focus Flow 3.1.2 uses one easing curve, `cubic-bezier(0.22, 0.8, 0.24, 1)`,
for spatial transitions. The timing values live in `src/design/tokens.json`;
`src/design/tokens.css` is generated from that file. These are application design
choices, not timing values prescribed by Apple.

| Interaction | Duration | Behavior |
| --- | --- | --- |
| Main views | 320 ms | An 18 px horizontal movement with a crossfade. |
| Guide routes and settings sections | 440 ms | Forward entry from the right; back entry from the left. Depth movement is capped at 560 px on larger screens. |
| Settings and onboarding size changes | 440 ms | Content height interpolates with its transition. |
| Dialog opening | 380 ms | Fade and an 18 px lift from scale 0.985. |
| Dialog closing | 260 ms | Fade with a 10 px departure toward scale 0.99. |
| Focus mode entry | 440 ms | The dialog lift and fade use the depth timing. |
| Press and release | 90 / 180 ms | A small scale change; no overshoot. |
| Switches and checklist marks | 180 ms | The control settles without bouncing. |
| Theme surfaces and chart bars | 400 ms | Surface colors interpolate; chart entry delays are capped at 120 ms. |
| Reduced motion | 100 ms | Screen transitions and dialogs fade without displacement or scaling. |

The timer's numeric readout remains still. The session indicator no longer
pulses continuously. Motion runs in response to an interaction or a state change.

## State and interruption

`MotionSurface` captures the departing DOM before React replaces or hides it.
The temporary visual copy is inert, hidden from accessibility, has remapped IDs
and no live React handlers. It never owns timer state or a form draft. The new
screen becomes interactive immediately. A second navigation cancels the current
animations and removes their copies. Returning during an animation starts from
the departing copy's current position.

The shell keeps visited views mounted. It loads an unvisited destination before
committing the view change, so its transition does not start with a loading
placeholder. Dialog modules load on demand; pending opens can be cancelled with
Escape. Parent dialogs stay mounted while their child opens.

Opening a dialog completes active screen movement before it takes focus. Static
motion containers do not create a stacking context, so dialogs inside statistics
cover the viewport and navigation.

Dialog closure returns focus and releases background isolation immediately. An
inert visual copy completes the departure. Opening another dialog removes any
remaining departure visual. Strict Mode mount rehearsals do not leave copies.

The system and manual reduced-motion preferences both apply to Web Animations
API transitions. Changing either preference during movement finishes active
animations and cleans up their copies. Browsers without `Element.animate` switch
screens immediately. CSS transitions also honor both preferences.

Route changes reset new guide pages to the top. Switching main views restores
their saved window scroll positions. Sticky guide navigation remains attached to
the viewport, including during transitions; motion containers use clipping that
does not create a scrolling ancestor.

## Validation

`npm run test:motion` checks actual browser animation timing, interrupted and
rapid navigation, stationary header/navigation, sticky return controls during
movement, restored reading positions, retained running sessions and checklists,
settings height changes, nested focus restoration, export dialog layering, modal
exit semantics, manual
and dynamic OS reduced motion, and accessibility at 320, 393 and 1440 px.

See [the 3.1.2 validation report](validation/3.1.2/VALIDATION.md) for the completed
checks and platform limits. Headless Chromium results do not establish frame
rate or animation behavior on a physical iPhone or installed desktop app.
