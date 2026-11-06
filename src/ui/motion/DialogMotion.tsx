import { Component, createRef, type ReactNode } from 'react'
import { animate, finishScreenMotion, motion, reducedMotion, visualCopy } from './motion'

let generation = 0
const departures = new Set<{ element: HTMLElement; animations: Animation[] }>()

interface Props { children: ReactNode; className: string; focusMode?: boolean }

/** The departing visual has no focus, event handlers, or live application state. */
export class DialogMotion extends Component<Props> {
  private root = createRef<HTMLDivElement>()
  private animations: Animation[] = []

  componentDidMount(): void {
    finishScreenMotion()
    ++generation
    for (const departure of departures) {
      for (const animation of departure.animations) animation.cancel()
      departure.element.remove()
    }
    departures.clear()
    const root = this.root.current
    if (!root) return
    const panel = root.querySelector<HTMLElement>('[role="dialog"]')
    const reduced = reducedMotion()
    const duration = reduced ? motion.reduced : this.props.focusMode ? motion.depth : motion.open
    const backdrop = animate(root, [{ opacity: 0 }, { opacity: 1 }], duration)
    if (backdrop) this.animations.push(backdrop)
    if (panel && !reduced) {
      const entrance = animate(panel, [
        { transform: 'translateY(18px) scale(.985)' },
        { transform: 'translateY(0) scale(1)' },
      ], duration)
      if (entrance) this.animations.push(entrance)
    }
    const animations = this.animations
    void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
      for (const animation of animations) animation.cancel()
      if (this.animations === animations) this.animations = []
    })
  }

  componentWillUnmount(): void {
    const root = this.root.current
    if (!root || typeof root.animate !== 'function') return
    const closingGeneration = generation
    const copy = visualCopy(root)
    const opacity = getComputedStyle(root).opacity
    const originalPanel = root.querySelector<HTMLElement>('[role="dialog"]')
    const transform = originalPanel ? getComputedStyle(originalPanel).transform : 'none'
    for (const animation of this.animations) animation.cancel()
    copy.classList.add('motion-dialog-exit')
    queueMicrotask(() => {
      // Strict Mode rehearses mounting while retaining the same DOM.
      if (root.isConnected || generation !== closingGeneration) return
      document.body.append(copy)
      const reduced = reducedMotion()
      const duration = reduced ? motion.reduced : motion.close
      const animations: Animation[] = []
      const exit = animate(copy, [{ opacity }, { opacity: 0 }], duration)
      if (exit) animations.push(exit)
      const panel = copy.querySelector<HTMLElement>('[role="dialog"]')
      if (panel && !reduced) {
        const departure = animate(panel, [{ transform }, { transform: 'translateY(10px) scale(.99)' }], duration)
        if (departure) animations.push(departure)
      }
      const departure = { element: copy, animations }
      departures.add(departure)
      void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
        copy.remove()
        departures.delete(departure)
      })
    })
  }

  render(): ReactNode {
    return <div ref={this.root} data-dialog-root className={this.props.className}>{this.props.children}</div>
  }
}
