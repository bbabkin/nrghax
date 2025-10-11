'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const currentTheme = savedTheme || systemTheme

    setTheme(currentTheme)
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setRotation(180)
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    setRotation(prev => prev + 180)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!mounted) {
    return (
      <div
        className="w-8 h-8"
        style={{
          backgroundColor: '#fb0',
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
        }}
      />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-8 h-8 outline-none overflow-hidden shadow-md hover:shadow-lg"
      )}
      style={{
        backgroundColor: theme === 'light' ? '#fb0' : '#000',
        transition: 'background-color 500ms ease-in-out, box-shadow 200ms ease-in-out',
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
      }}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>

      {/* Icons container - watch-style rotation */}
      {/* This is the BIG circle that rotates - button only shows the top portion */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div
          className="relative transition-transform duration-500 ease-in-out"
          style={{
            transform: `rotate(${rotation}deg) translate(0, -4px)`,
            transformOrigin: 'center 50px',
            width: '32px',
            height: '100px'
          }}
        >
          {/* Sun icon - at top of the big circle (0 degrees) */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '12px' }}>
            <Sun className="w-4 h-4 text-black" />
          </div>

          {/* Moon icon - at bottom of the big circle (180 degrees) */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '12px' }}>
            <Moon className="w-4 h-4 text-white" style={{ transform: 'translate(0px, 8px) rotate(185deg)' }} />
          </div>
        </div>
      </div>
    </button>
  )
}