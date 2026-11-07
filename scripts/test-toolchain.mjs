import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { parseConstant } from './read-typescript-constant.mjs'

const require = createRequire(import.meta.url)

test('the application compiler is TypeScript 7 and the AST API stays supported', () => {
  const path = require.resolve('@typescript/native/package.json')
  const compiler = JSON.parse(readFileSync(path, 'utf8'))
  const version = execFileSync('tsc', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim()
  assert.equal(version, `Version ${compiler.version}`)
  assert.match(version, /^Version 7\./)
  assert.match(ts.version, /^6\./)
})

test('localized constants are read through the AST without evaluating source', () => {
  const source = `throw new Error('Source must not execute');
    export const copy = { title: '简体中文', steps: ['Español', 'Polski'], meta: { topic: learning } } as const satisfies Copy;`
  assert.deepEqual(parseConstant('copy.ts', source, 'copy'), {
    title: '简体中文', steps: ['Español', 'Polski'], meta: { topic: 'learning' },
  })
})

test('executable content expressions and missing constants fail extraction', () => {
  assert.throws(() => parseConstant('copy.ts', 'const copy = (() => { throw Error("Do not execute") })()', 'copy'), /Unsupported content expression/)
  assert.throws(() => parseConstant('copy.ts', 'const other = {}', 'copy'), /copy missing/)
})
