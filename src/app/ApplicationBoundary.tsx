import { Component, type ReactNode } from 'react'
import { LANGUAGE_META } from '../domain/language'
import { recoveryLanguage } from '../lib/recoveryLanguage'
import { translate } from '../lib/translations'

interface Props {children: ReactNode; onReload?: () => void}
interface State {failed: boolean}

export class ApplicationBoundary extends Component<Props, State> {
  state: State = {failed: false}

  static getDerivedStateFromError(): State {return {failed: true}}

  componentDidCatch(): void {
    document.documentElement.lang = LANGUAGE_META[recoveryLanguage()].htmlLang
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    const lang = recoveryLanguage()
    return <main role="alert" className="mx-auto max-w-xl p-8 text-ink">
      <h1 className="text-2xl font-medium">{translate(lang, 'recovery.viewTitle')}</h1>
      <p className="my-4">{translate(lang, 'recovery.viewDetail')}</p>
      <button type="button" className="min-h-11 rounded-full border px-5" onClick={this.props.onReload ?? (() => location.reload())}>{translate(lang, 'recovery.reload')}</button>
    </main>
  }
}
