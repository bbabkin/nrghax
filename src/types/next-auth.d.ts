import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'user' | 'admin' | 'super_admin'
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: 'user' | 'admin' | 'super_admin' // Optional for database sessions
  }
}

// JWT module not needed when using database sessions
// declare module 'next-auth/jwt' {
//   interface JWT extends DefaultJWT {
//     id: string
//     email: string
//     role: 'user' | 'admin' | 'super_admin'
//   }
// }