'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Supabase Authentication Starter
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            A complete authentication system built with Next.js, Supabase, and NextAuth.js
          </p>
          
          <div className="space-x-4">
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
            <p className="text-gray-600">Built-in email/password and OAuth authentication</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Modern Stack</h3>
            <p className="text-gray-600">TypeScript, Tailwind CSS, and shadCN UI</p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Production Ready</h3>
            <p className="text-gray-600">Comprehensive testing and security features</p>
          </div>
        </div>
      </div>
    </div>
  )
}