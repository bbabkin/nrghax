'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  center?: boolean
}

export function ResponsiveContainer({
  children,
  className = '',
  size = 'lg',
  padding = 'md',
  center = true,
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-7xl',
    xl: 'max-w-none',
    full: 'w-full',
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        paddingClasses[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive grid component
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveGrid({
  children,
  className = '',
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }

  const getColsClass = () => {
    const classes = ['grid']
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`)
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getColsClass(), gapClasses[gap], className)}>
      {children}
    </div>
  )
}

// Responsive text component
interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  size?: {
    default?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  }
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted'
}

export function ResponsiveText({
  children,
  className = '',
  as: Component = 'p',
  size = { default: 'base' },
  weight = 'normal',
  color = 'primary',
}: ResponsiveTextProps) {
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
  }

  const getSizeClasses = () => {
    const classes = []
    
    if (size.default) classes.push(`text-${size.default}`)
    if (size.sm) classes.push(`sm:text-${size.sm}`)
    if (size.md) classes.push(`md:text-${size.md}`)
    if (size.lg) classes.push(`lg:text-${size.lg}`)
    
    return classes.join(' ')
  }

  return (
    <Component
      className={cn(
        getSizeClasses(),
        weightClasses[weight],
        colorClasses[color],
        className
      )}
    >
      {children}
    </Component>
  )
}

// Responsive spacing component
interface ResponsiveSpacingProps {
  children: ReactNode
  className?: string
  space?: {
    y?: {
      default?: number
      sm?: number
      md?: number
      lg?: number
    }
    x?: {
      default?: number
      sm?: number
      md?: number
      lg?: number
    }
  }
}

export function ResponsiveSpacing({
  children,
  className = '',
  space = {},
}: ResponsiveSpacingProps) {
  const getSpacingClasses = () => {
    const classes = []
    
    if (space.y) {
      if (space.y.default) classes.push(`space-y-${space.y.default}`)
      if (space.y.sm) classes.push(`sm:space-y-${space.y.sm}`)
      if (space.y.md) classes.push(`md:space-y-${space.y.md}`)
      if (space.y.lg) classes.push(`lg:space-y-${space.y.lg}`)
    }
    
    if (space.x) {
      if (space.x.default) classes.push(`space-x-${space.x.default}`)
      if (space.x.sm) classes.push(`sm:space-x-${space.x.sm}`)
      if (space.x.md) classes.push(`md:space-x-${space.x.md}`)
      if (space.x.lg) classes.push(`lg:space-x-${space.x.lg}`)
    }
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getSpacingClasses(), className)}>
      {children}
    </div>
  )
}

// Responsive flexbox component
interface ResponsiveFlexProps {
  children: ReactNode
  className?: string
  direction?: {
    default?: 'row' | 'col'
    sm?: 'row' | 'col'
    md?: 'row' | 'col'
    lg?: 'row' | 'col'
  }
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveFlex({
  children,
  className = '',
  direction = { default: 'row' },
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
}: ResponsiveFlexProps) {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const getDirectionClasses = () => {
    const classes = ['flex']
    
    if (direction.default) classes.push(`flex-${direction.default}`)
    if (direction.sm) classes.push(`sm:flex-${direction.sm}`)
    if (direction.md) classes.push(`md:flex-${direction.md}`)
    if (direction.lg) classes.push(`lg:flex-${direction.lg}`)
    
    return classes.join(' ')
  }

  return (
    <div
      className={cn(
        getDirectionClasses(),
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Breakpoint visibility component
interface BreakpointVisibilityProps {
  children: ReactNode
  show?: ('sm' | 'md' | 'lg' | 'xl')[]
  hide?: ('sm' | 'md' | 'lg' | 'xl')[]
  className?: string
}

export function BreakpointVisibility({
  children,
  show = [],
  hide = [],
  className = '',
}: BreakpointVisibilityProps) {
  const getVisibilityClasses = () => {
    const classes = []
    
    // Start with hidden by default if we have show rules
    if (show.length > 0) {
      classes.push('hidden')
      show.forEach(bp => classes.push(`${bp}:block`))
    }
    
    // Add hide rules
    hide.forEach(bp => classes.push(`${bp}:hidden`))
    
    return classes.join(' ')
  }

  return (
    <div className={cn(getVisibilityClasses(), className)}>
      {children}
    </div>
  )
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  default: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}) {
  const [currentValue, setCurrentValue] = React.useState(values.default)

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= 1280 && values.xl !== undefined) {
        setCurrentValue(values.xl)
      } else if (width >= 1024 && values.lg !== undefined) {
        setCurrentValue(values.lg)
      } else if (width >= 768 && values.md !== undefined) {
        setCurrentValue(values.md)
      } else if (width >= 640 && values.sm !== undefined) {
        setCurrentValue(values.sm)
      } else {
        setCurrentValue(values.default)
      }
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [values])

  return currentValue
}

// Hook for detecting breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'sm' | 'md' | 'lg' | 'xl' | 'default'>('default')

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else if (width >= 640) setBreakpoint('sm')
      else setBreakpoint('default')
    }

    checkBreakpoint()
    window.addEventListener('resize', checkBreakpoint)
    
    return () => window.removeEventListener('resize', checkBreakpoint)
  }, [])

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    isDefault: breakpoint === 'default',
    isSmAndUp: ['sm', 'md', 'lg', 'xl'].includes(breakpoint),
    isMdAndUp: ['md', 'lg', 'xl'].includes(breakpoint),
    isLgAndUp: ['lg', 'xl'].includes(breakpoint),
  }
}