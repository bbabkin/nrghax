'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const currentTheme = savedTheme || systemTheme

    setTheme(currentTheme)
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!mounted) {
    return (
      <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>

      {/* Icons container */}
      <div className="relative w-full h-full flex items-center justify-between px-1">
        {/* Sun icon (left) */}
        <Sun
          className={cn(
            "h-5 w-5 transition-colors",
            theme === 'light' ? 'text-yellow-500' : 'text-gray-400'
          )}
        />

        {/* Moon icon (right) */}
        <Moon
          className={cn(
            "h-5 w-5 transition-colors",
            theme === 'dark' ? 'text-blue-400' : 'text-gray-400'
          )}
        />
      </div>

      {/* Sliding circle */}
      <span
        className={cn(
          "absolute top-0.5 left-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform duration-200",
          theme === 'dark' && 'translate-x-8'
        )}
      >
        {theme === 'light' ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-blue-400" />
        )}
      </span>
    </button>
  )
}