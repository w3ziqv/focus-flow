# Ambient Sounds & Web Audio Procedural Synthesis

Starting in Focus Flow Milestone v2.2, all bundled ambient soundscapes are synthesized natively in-browser using pure mathematical procedural modeling via the Web Audio API, achieving a **0 KB static audio asset footprint**.

## Procedural Synthesis Models

| Texture / Soundscape | Mathematical Model & Filter Topology | Footprint |
| --- | --- | --- |
| **Pink Noise** | Paul Kellet 6-pole IIR filter over uniform white noise ($1/f, -3\text{ dB/octave}$), output scaled by 0.11, bounded within $[-2.0, 2.0]$. | 0 KB |
| **Leaky Brown Noise** | 1-pole discrete leaky integrator $y[n] = (y[n-1] + 0.02 w[n]) / 1.02$, $\text{out} = 3.5 y[n]$ with $0.08\text{ Hz}$ spatial breathing LFO driving stereo pan ($\pm 0.35$). | 0 KB |
| **Soft Rain** | Pink noise base passed through a 2-pole lowpass filter ($f_c = 1100\text{ Hz}, Q = 0.7$) combined with Poisson-distributed droplet impulses bandpass filtered ($f_c = 4200\text{ Hz}, Q = 8.0$). | 0 KB |
| **Ocean Waves** | Noise source passed through a dynamic Biquad filter cyclically swept by an asymmetric tidal LFO ($10.0\text{s}$ period: $3.5\text{s}$ flood surge to $1200\text{ Hz}$ and $6.5\text{s}$ ebb foam recession to $250\text{ Hz}$). | 0 KB |
| **Tibetan Singing Bowl** | Modal acoustic physical synthesis via 5 inharmonic partials ($216.0\text{ Hz}, 305.4\text{ Hz}, 432.0\text{ Hz}, 596.2\text{ Hz}, 1167.3\text{ Hz}$) with beating shimmer plus a $25\text{ms}$ felt mallet contact burst ($2.4\text{ kHz}, Q = 4$). | 0 KB |
| **Binaural Beats** | Dual-carrier sine wave entrainment oscillators panned hard L/R (Alpha Focus: $216/226\text{ Hz}, \Delta 10\text{ Hz}$; Theta Rest: $180/186\text{ Hz}, \Delta 6\text{ Hz}$). | 0 KB |

## Historical Notes & Attribution

Legacy versions of Focus Flow (v1.0–v2.1) bundled compressed `.m4a` recordings (rain by ezwa [Public Domain], waves by Luftrum [CC BY 3.0], campfire by Glaneur de sons [CC BY 3.0], and stream by jackthemurray [CC0]). These have been completely decommissioned and replaced by real-time mathematical procedural synthesis. User-uploaded custom sounds continue to be supported locally via IndexedDB.
