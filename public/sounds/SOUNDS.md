# Ambient recordings and Web Audio synthesis

Focus Flow 3.0 uses two edited nature recordings from [Moodist](https://moodist.mvze.net/)
for **rain and ocean waves**. Pink/brown noise, binaural tones and the completion
chime remain synthesized by Web Audio. The recorded palette preserves the existing
preference identifiers, so saved settings and cloud validation remain compatible.

## Recorded nature palette

Each recording is a 58-second MP3 loop, 32 kHz stereo at 128 kbit/s, under 1 MiB.
The first 60 seconds of the pinned source are edited with a two-second linear
tail/head crossfade and normalized to -24 LUFS, -3 dBTP, LRA 11. Both files together
add approximately 1.78 MiB. Original metadata is removed.

Sources, original/edited SHA-256 hashes and processing are recorded in
[moodist/provenance.json](moodist/provenance.json). Read
[moodist/NOTICE.txt](moodist/NOTICE.txt) for attribution and license boundaries.
Moodist identifies third-party audio as CC0 or Pixabay Content License, without
individual source/license mappings. We retain that limitation and do not label
these files MIT or independently verified CC0. They are embedded app soundscapes,
not a standalone sound library; the app's source-code license does not relicense them.

The app fetches only its own bundled assets; no Moodist/Pixabay server is contacted
at runtime. The web PWA precaches both recordings and attribution; desktop builds
embed them. Decoded buffers are cached, old audio continues until a replacement
is ready, and late downloads cannot overwrite a subsequent selection or disposal.
Network, HTTP, timeout or decoder failures fall back to the procedural models below.
Timer pause and volume continue to use the shared audio graph.

To reproduce the processing with FFmpeg (source paths are in the manifest):

```bash
ffmpeg -i source.mp3 -filter_complex \
  '[0:a]asplit=3[body][tail][head];[body]atrim=start=2:end=58,asetpts=PTS-STARTPTS[b];[tail]atrim=start=58:end=60,asetpts=PTS-STARTPTS[t];[head]atrim=start=0:end=2,asetpts=PTS-STARTPTS[h];[t][h]acrossfade=d=2:c1=tri:c2=tri[seam];[b][seam]concat=n=2:v=0:a=1,loudnorm=I=-24:TP=-3:LRA=11[out]' \
  -map '[out]' -ar 32000 -ac 2 -codec:a libmp3lame -b:a 128k -map_metadata -1 loop.mp3
```

Encoder versions can change output bytes; compare source hashes before rebuilding.

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

Legacy versions (v1.0–v2.1) bundled `.m4a` recordings (rain by ezwa [Public Domain], waves by Luftrum [CC BY 3.0], campfire by Glaneur de sons [CC BY 3.0], and stream by jackthemurray [CC0]). Those files were removed in v2.2 and are not reused here. User-uploaded custom sounds remain local in IndexedDB and are not uploaded by cloud sync.
