import { maskIC } from '@/lib/ic-mask'

describe('maskIC (VOICE-05 / D-06)', () => {
  test('masks a 12-digit undashed IC correctly', () => {
    expect(maskIC('880512123456')).toBe('880512-**-****')
  })

  test('masks a dashed IC (880512-12-3456) correctly', () => {
    expect(maskIC('880512-12-3456')).toBe('880512-**-****')
  })

  test('returns safe placeholder for too-short input', () => {
    expect(maskIC('123')).toBe('??????-**-****')
  })

  test('returns safe placeholder for non-numeric 12-char input', () => {
    expect(maskIC('abcdefghijkl')).toBe('??????-**-****')
  })

  test('returns safe placeholder for empty string', () => {
    expect(maskIC('')).toBe('??????-**-****')
  })
})
