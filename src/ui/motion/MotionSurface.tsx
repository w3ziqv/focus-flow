import { Component, createRef, type ReactNode } from 'react'
import { animate, motion, reducedMotion, registerScreenMotion, visualCopy } from './motion'

type Direction = 'forward' | 'backward'
interface Props {
  value: string
  direction?: Direction
  kind?: 'depth' | 'tab'
  as?: 'div' | 'main'
  className?: string
  target?: string
  resize?: boolean
  scrollTop?: number
  children: ReactNode
}
interface Snapshot {
  copy?: HTMLElement
  height: number
  rect: DOMRect
  opacity: string
  returnRect?: DOMRect
  returnOpacity?: string
}

/** Captures the outgoing DOM before React replaces it; live components are never copied. */
export class MotionSurface extends Component<Props> {
  private root = createRef<HTMLDivElement>()
  private animations: Animation[] = []
  private ghost?: { key: string; element: HTMLElement }
  private revision = 0
  private unregister?: () => void

  componentDidMount(): void { this.unregister = registerScreenMotion(this.clear) }

  private content = (): HTMLElement | null => {
    const root = this.root.current
    return root ? this.props.target ? root.querySelector<HTMLElement>(this.props.target) : root.firstElementChild as HTMLElement | null : null
  }

  private clear = (): void => {
    ++this.revision
    for (const animation of this.animations) animation.cancel()
    this.animations = []
    this.ghost?.element.remove()
    this.ghost = undefined
    this.root.current?.removeAttribute('data-motion-running')
    this.root.current?.removeAttribute('data-motion-resizing')
  }

  getSnapshotBeforeUpdate(previous: Props): Snapshot | null {
    if (previous.value === this.props.value) return null
    const source = this.content()
    if (!source) return null
    const returning = this.ghost?.key === this.props.value ? this.ghost.element : undefined
    return {
      height: this.root.current?.getBoundingClientRect().height ?? 0,
      rect: source.getBoundingClientRect(),
      opacity: getComputedStyle(source).opacity,
      copy: !reducedMotion() && typeof source.animate === 'function' ? visualCopy(source) : undefined,
      returnRect: returning?.getBoundingClientRect(),
      returnOpacity: returning ? getComputedStyle(returning).opacity : undefined,
    }
  }

  componentDidUpdate(previous: Props, _state: unknown, snapshot: Snapshot | null): void {
    if (!snapshot) return
    this.clear()
    if (this.props.scrollTop !== undefined) window.scrollTo({ top: this.props.scrollTop, behavior: 'auto' })
    const root = this.root.current
    const incoming = this.content()
    if (!root || !incoming) return
    const reduced = reducedMotion()
    const duration = reduced ? motion.reduced : this.props.kind === 'tab' ? motion.tab : motion.depth
    const direction = this.props.direction === 'backward' ? -1 : 1
    if (this.props.resize && !reduced) {
      const height = root.getBoundingClientRect().height
      if (Math.abs(snapshot.height - height) > 1) {
        root.setAttribute('data-motion-resizing', '')
        const resize = animate(root, [{ height: `${snapshot.height}px` }, { height: `${height}px` }], duration)
        if (resize) this.animations.push(resize)
      }
    }
    const rect = incoming.getBoundingClientRect()
    const stage = root.getBoundingClientRect()
    const distance = this.props.kind === 'tab' ? 18 : Math.min(rect.width, window.innerWidth, 560)
    const revision = this.revision
    root.setAttribute('data-motion-running', '')
    if (snapshot.copy && !reduced) {
      const copy = snapshot.copy
      copy.classList.add('motion-snapshot')
      Object.assign(copy.style, {
        position: 'absolute', margin: '0', left: `${snapshot.rect.left - stage.left}px`, top: `${snapshot.rect.top - stage.top}px`,
        width: `${snapshot.rect.width}px`, height: `${snapshot.rect.height}px`, zIndex: direction < 0 ? '3' : '1',
      })
      root.append(copy)
      this.ghost = { key: previous.value, element: copy }
      const exit = animate(copy, [
        { transform: 'translateX(0)', opacity: snapshot.opacity },
        { transform: `translateX(${-direction * distance * (this.props.kind === 'tab' ? 1 : direction < 0 ? 1 : .24)}px)`, opacity: this.props.kind === 'tab' ? 0 : .55 },
      ], duration)
      if (exit) this.animations.push(exit)
    }
    const startX = reduced ? 0 : snapshot.returnRect ? snapshot.returnRect.left - rect.left : direction * distance
    const entrance = animate(incoming, reduced ? [{ opacity: 0 }, { opacity: 1 }] : [
      { transform: `translateX(${startX}px)`, opacity: reduced || this.props.kind === 'tab' ? 0 : snapshot.returnOpacity ?? 1 },
      { transform: 'translateX(0)', opacity: 1 },
    ], duration)
    if (entrance) this.animations.push(entrance)
    void Promise.all(this.animations.map(animation => animation.finished.catch(() => {}))).then(() => {
      if (this.revision === revision) this.clear()
    })
  }

  componentWillUnmount(): void { this.unregister?.(); this.clear() }

  render(): ReactNode {
    const Tag = this.props.as ?? 'div'
    return <Tag ref={this.root} className={`motion-surface ${this.props.className ?? ''}`}>
      {this.props.target ? this.props.children : <div className="motion-content">{this.props.children}</div>}
    </Tag>
  }
}
