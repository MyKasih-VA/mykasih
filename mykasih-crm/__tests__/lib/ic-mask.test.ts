import { maskIC } from '@/lib/ic-mask'

describe('maskIC', () => {
  it('masks 12-digit IC without dashes', () => {
    expect(maskIC('880512123456')).toBe('880512-**-****')
  })

  it('masks IC with existing dashes', () => {
    expect(maskIC('880512-12-3456')).toBe('880512-**-****')
  })

  it('returns placeholder for short input', () => {
    expect(maskIC('123')).toBe('??????-**-****')
  })

  it('returns placeholder for non-numeric input', () => {
    expect(maskIC('abcdefghijkl')).toBe('??????-**-****')
  })

  it('returns placeholder for empty string', () => {
    expect(maskIC('')).toBe('??????-**-****')
  })
})
