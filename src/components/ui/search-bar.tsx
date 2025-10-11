'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  className?: string
  placeholder?: string
}

export function SearchBar({ className, placeholder = "Search hacks and routines..." }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize search query from URL params when on hacks page
  useEffect(() => {
    if (pathname === '/hacks') {
      const query = searchParams.get('q') || ''
      setSearchQuery(query)
    }
  }, [pathname, searchParams])

  const handleSearch = (value: string) => {
    setSearchQuery(value)

    // If on hacks page, update URL immediately
    if (pathname === '/hacks') {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      router.replace(`/hacks?${params.toString()}`, { scroll: false })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Redirect to hacks page with search query
      if (pathname !== '/hacks') {
        router.push(`/hacks?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    if (pathname === '/hacks') {
      router.replace('/hacks', { scroll: false })
    }
  }

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none transition-colors duration-500">
        <Search className="h-4 w-4 text-white dark:text-black" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-full h-8 pl-9 pr-9 bg-black dark:bg-white text-white dark:text-black text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none transition-colors duration-500"
        style={{
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
        }}
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 z-10 text-white dark:text-black hover:opacity-70 transition-opacity"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
