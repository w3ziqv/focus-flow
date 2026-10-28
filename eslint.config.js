import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import { uiBoundaries } from './scripts/eslint-ui-boundaries.mjs'

export default tseslint.config([
  globalIgnores(['dist', 'dist-desktop', 'src-tauri/target', 'src-tauri/gen', 'node_modules', 'test-artifacts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactRefresh.configs.vite],
    plugins: {
      'react-hooks': reactHooks,
      architecture: { rules: { ui: uiBoundaries } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'architecture/ui': 'error',
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['../lib/**', '../components/**', '../views/**', 'react', 'react-dom', 'react-dom/*', 'firebase', 'firebase/*', '@tauri-apps/*'],
          message: 'Domain rules must stay independent of persistence, UI and platform adapters.',
        }],
      }],
    },
  },
  {
    // The context provider and its hook live in one idiomatic file.
    files: ['src/lib/i18n.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
