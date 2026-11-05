import { describe, expect, it } from 'vitest'
import { escapeCsvField } from './export'

describe('spreadsheet export boundaries', () => {
  it.each(['+SUM(1,2)', '-1+2', '\t=1+1', '\r=1+1', '\n=1+1', ' \t@SUM(1,2)', '\uFEFF=1+1', '\0=1+1', '\u200B=1+1'])(
    'keeps formula-like text literal: %j', value => {
      expect(escapeCsvField(value)).toBe(`"'${value.replace(/"/g, '""')}"`)
    },
  )
  it('preserves numeric values as numbers', () => {
    expect(escapeCsvField(-25)).toBe('-25')
    expect(escapeCsvField('ordinary task')).toBe('"ordinary task"')
  })
})
