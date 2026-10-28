import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Linter } from 'eslint'
import { uiBoundaries } from './eslint-ui-boundaries.mjs'

const lint = (file, code) => new Linter().verify(code, [{ files: ['**/*.js'], plugins: { architecture: { rules: { ui: uiBoundaries } } }, rules: { 'architecture/ui': 'error' } }], { filename: `${process.cwd()}/src/${file}.js` })
test('presentation dependencies point toward primitives and adapters', () => {
  assert.equal(lint('features/timer/Dial', "import { PillButton } from '../../ui/PillButton'").length, 0)
  assert.equal(lint('ui/Modal', "import { useI18n } from '../lib/i18n'").length, 0)
  assert.equal(lint('ui/Modal', "import('../features/timer/Dial')").length, 1)
  assert.equal(lint('ui/Modal', "import('../../src/lib/storage')").length, 1)
  assert.equal(lint('lib/timer', "import('../views/TimerView')").length, 1)
  assert.equal(lint('features/timer/Dial', "export * from '../../app/Shell'").length, 1)
  assert.equal(lint('domain/nested/Rule', "import('../../../src/lib/storage')").length, 1)
  assert.equal(lint('features/timer/Dial', "import('../../views/TimerView')").length, 1)
})
