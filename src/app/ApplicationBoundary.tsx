import { Component, type ReactNode } from 'react'
import { getPersistence } from '../lib/desktop/runtime'

interface Props {children: ReactNode; onReload?: () => void}
interface State {failed: boolean}

export class ApplicationBoundary extends Component<Props, State> {
  state: State = {failed: false}

  static getDerivedStateFromError(): State {return {failed: true}}

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    let polish = navigator.language.startsWith('pl')
    try {
      const language = getPersistence().getItem('ff2_lang')
      if (language === 'pl' || language === 'en') polish = language === 'pl'
    } catch { /* Recovery must also work with unavailable storage. */ }
    return <main role="alert" className="mx-auto max-w-xl p-8 text-ink">
      <h1 className="text-2xl font-medium">{polish ? 'Nie udało się otworzyć widoku' : 'Could not open this view'}</h1>
      <p className="my-4">{polish ? 'Zapisane dane lokalne nie zostały usunięte. Wczytaj aplikację ponownie. Jeśli jesteś offline, najpierw sprawdź połączenie.' : 'Your saved local data has not been removed. Reload the application. If you are offline, check your connection first.'}</p>
      <button type="button" className="min-h-11 rounded-full border px-5" onClick={this.props.onReload ?? (() => location.reload())}>{polish ? 'Wczytaj ponownie' : 'Reload application'}</button>
    </main>
  }
}
