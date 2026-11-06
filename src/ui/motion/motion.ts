import { foundation } from '../../design/tokens.json'

export const motion: { readonly ease: string; readonly depth: number; readonly tab: number; readonly open: number; readonly close: number; readonly reduced: number } = {
  ease: foundation['ease-spatial'],
  depth: Number.parseFloat(foundation['duration-depth']),
  tab: Number.parseFloat(foundation['duration-tab']),
  open: Number.parseFloat(foundation['duration-dialog-open']),
  close: Number.parseFloat(foundation['duration-dialog-close']),
  reduced: 100,
} as const

export function reducedMotion(): boolean {
  return document.documentElement.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

const screens = new Set<() => void>()

export function registerScreenMotion(finish: () => void): () => void {
  screens.add(finish)
  return () => { screens.delete(finish) }
}

/** A dialog takes over the final, stationary layout before it receives focus. */
export function finishScreenMotion(): void {
  for (const finish of screens) finish()
}

const active = new Set<Animation>()
let observing = false

function observePreference(): void {
  if (observing) return
  observing = true
  let previous = reducedMotion()
  const update = () => {
    const next = reducedMotion()
    if (next && !previous) {
      for (const animation of active) if (animation.playState === 'running' || animation.playState === 'paused') animation.finish()
    }
    previous = next
  }
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change', update)
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/** Only interaction-triggered transitions enter this registry. */
export function animate(element: HTMLElement, frames: Keyframe[], duration: number): Animation | undefined {
  if (typeof element.animate !== 'function') return
  observePreference()
  const animation = element.animate(frames, { duration, easing: motion.ease, fill: 'both' })
  active.add(animation)
  void animation.finished.catch(() => {}).then(() => active.delete(animation))
  return animation
}

let snapshotId = 0

/** A noninteractive visual copy lets React release a screen and its focus immediately. */
export function visualCopy(source: HTMLElement): HTMLElement {
  const copy = source.cloneNode(true) as HTMLElement
  copy.setAttribute('inert', '')
  copy.setAttribute('aria-hidden', 'true')
  copy.setAttribute('data-motion-copy', '')
  const prefix = `motion-${++snapshotId}-`
  const ids = new Map<string, string>()
  for (const node of [copy, ...copy.querySelectorAll<HTMLElement>('[id]')]) {
    if (node.id) { ids.set(node.id, prefix + node.id); node.id = prefix + node.id }
  }
  for (const node of [copy, ...copy.querySelectorAll('*')]) {
    for (const attribute of [...node.attributes]) {
      let value = attribute.value
      for (const [id, replacement] of ids) {
        value = value.replaceAll(`url(#${id})`, `url(#${replacement})`)
        if (value === `#${id}`) value = `#${replacement}`
      }
      if (['aria-labelledby', 'aria-describedby', 'aria-controls', 'for'].includes(attribute.name)) value = value.split(' ').map(id => ids.get(id) ?? id).join(' ')
      if (value !== attribute.value) node.setAttribute(attribute.name, value)
    }
    node.removeAttribute('data-dialog-root')
    node.removeAttribute('aria-modal')
    node.removeAttribute('autofocus')
    node.removeAttribute('name')
  }
  const originals = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')
  copy.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select').forEach((field, index) => {
    const original = originals[index]
    if (original && !(field instanceof HTMLInputElement && field.type === 'file')) field.value = original.value
    if (field instanceof HTMLInputElement && original instanceof HTMLInputElement) field.checked = original.checked
  })
  const style = getComputedStyle(source)
  for (const property of ['--ac', '--ac-strong', '--ac-soft', '--ac-fill']) copy.style.setProperty(property, style.getPropertyValue(property))
  return copy
}
