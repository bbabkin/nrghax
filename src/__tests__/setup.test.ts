/**
 * Basic setup verification test
 * Ensures Jest configuration is working correctly
 */

describe('Jest Setup', () => {
  it('should have access to environment variables', () => {
    expect(process.env.NEXTAUTH_URL).toBe('http://localhost:3000')
    expect(process.env.NEXTAUTH_SECRET).toBe('test-secret')
  })

  it('should support TypeScript', () => {
    const testFunction = (value: string): string => value.toUpperCase()
    expect(testFunction('hello')).toBe('HELLO')
  })

  it('should support async/await', async () => {
    const asyncFunction = async (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('completed'), 10)
      })
    }

    const result = await asyncFunction()
    expect(result).toBe('completed')
  })
})