'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { useToast } from '@/components/ui/use-toast'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Check your email to confirm your account',
        })
        router.push('/auth')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function signInWithGoogle() {
    setIsLoading(true)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/oauth'
    
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'provider'
    input.value = 'google'
    
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
  }

  function signInWithDiscord() {
    setIsLoading(true)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/oauth'
    
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'provider'
    input.value = 'discord'
    
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
  }

  function signInWithGitHub() {
    setIsLoading(true)
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/auth/oauth'
    
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'provider'
    input.value = 'github'
    
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="email-signup">Email</Label>
            <Input
              id="email-signup"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password-signup">Password</Label>
            <Input
              id="password-signup"
              placeholder="Create a password (min 6 characters)"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              placeholder="Confirm your password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Account
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
        <Button variant="outline" type="button" disabled={isLoading} onClick={signInWithDiscord}>
          <Icons.discord className="mr-2 h-4 w-4" />
          Discord
        </Button>
        <Button variant="outline" type="button" disabled={isLoading} onClick={signInWithGitHub}>
          <Icons.gitHub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button variant="outline" type="button" disabled={isLoading} onClick={signInWithGoogle}>
          <Icons.google className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>
    </div>
  )
}