'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { useToast } from '@/components/ui/use-toast'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        body: formData,
        redirect: 'manual',
      })

      // Check if login was successful based on redirect
      if (response.type === 'opaqueredirect' || response.status === 301 || response.status === 302) {
        // Login successful, the browser will handle the redirect
        window.location.href = '/dashboard'
      } else {
        // Login failed
        toast({
          title: 'Error',
          description: 'Invalid login credentials',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  async function signInWithGitHub() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('provider', 'github')
      
      const response = await fetch('/auth/oauth', {
        method: 'POST',
        body: formData,
      })
      
      if (response.redirected) {
        window.location.href = response.url
      } else {
        throw new Error('OAuth failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with GitHub',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  async function signInWithGoogle() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('provider', 'google')
      
      const response = await fetch('/auth/oauth', {
        method: 'POST',
        body: formData,
      })
      
      if (response.redirected) {
        window.location.href = response.url
      } else {
        throw new Error('OAuth failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  async function signInWithDiscord() {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('provider', 'discord')
      
      const response = await fetch('/auth/oauth', {
        method: 'POST',
        body: formData,
      })
      
      if (response.redirected) {
        window.location.href = response.url
      } else {
        throw new Error('OAuth failed')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Discord',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>
          <Button disabled={isLoading} type="submit">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid gap-2">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={signInWithDiscord}
        >
          <Icons.discord className="mr-2 h-4 w-4" />
          Discord
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={signInWithGitHub}
        >
          <Icons.gitHub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={signInWithGoogle}
        >
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
    </div>
  )
}