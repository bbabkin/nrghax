import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('base-class', 'additional-class')
    expect(result).toBe('base-class additional-class')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', undefined, 'active')
    expect(result).toBe('base active')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle null and undefined values', () => {
    const result = cn('base', null, undefined, 'final')
    expect(result).toBe('base final')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-8')
    expect(result).toBe('py-2 px-8') // tailwind-merge should handle conflicts
  })

  it('should handle arrays of classes', () => {
    const result = cn(['base', 'middle'], 'end')
    expect(result).toBe('base middle end')
  })

  it('should handle objects with boolean values', () => {
    const result = cn('base', {
      'active': true,
      'disabled': false,
      'hover': true
    })
    expect(result).toBe('base active hover')
  })
})