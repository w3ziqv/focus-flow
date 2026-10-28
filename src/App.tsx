import { I18nProvider } from './lib/i18n'
import { Shell } from './app/Shell'

export default function App(): React.JSX.Element {
  return <I18nProvider><Shell /></I18nProvider>
}
