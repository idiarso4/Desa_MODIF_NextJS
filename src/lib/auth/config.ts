/**
 * NextAuth.js Configuration
 * Authentication configuration for OpenSID
 */

import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { compare } from 'bcryptjs'
import { JWT } from 'next-auth/jwt'
import { Session } from 'next-auth'
import { z } from 'zod'

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter').max(255, 'Password terlalu panjang')
})

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { 
          label: 'Username', 
          type: 'text', 
          placeholder: 'Masukkan username' 
        },
        password: { 
          label: 'Password', 
          type: 'password', 
          placeholder: 'Masukkan password' 
        }
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error('Username dan password harus diisi')
          }

          // Validate input format
          const validatedCredentials = loginSchema.parse(credentials)
          const { username, password } = validatedCredentials

          // Check rate limiting
          const clientId = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || 'unknown'
          const attemptKey = `${clientId}-${username}`
          const attempts = loginAttempts.get(attemptKey)
          
          if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt
            if (timeSinceLastAttempt < LOCKOUT_DURATION) {
              const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000)
              throw new Error(`Terlalu banyak percobaan login. Coba lagi dalam ${remainingTime} menit.`)
            } else {
              // Reset attempts after lockout period
              loginAttempts.delete(attemptKey)
            }
          }

          // Find user by username or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: username },
                { email: username }
              ]
            },
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          })

          if (!user) {
            // Record failed attempt
            const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 }
            loginAttempts.set(attemptKey, {
              count: currentAttempts.count + 1,
              lastAttempt: Date.now()
            })
            
            throw new Error('Username atau password salah')
          }

          if (!user.isActive) {
            throw new Error('Akun Anda tidak aktif. Hubungi administrator.')
          }

          // Verify password
          const isPasswordValid = await compare(password, user.password)
          if (!isPasswordValid) {
            // Record failed attempt
            const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 }
            loginAttempts.set(attemptKey, {
              count: currentAttempts.count + 1,
              lastAttempt: Date.now()
            })

            // Log failed login attempt
            await prisma.activityLog.create({
              data: {
                userId: user.id,
                action: 'LOGIN_FAILED',
                resource: 'auth',
                description: `Failed login attempt for user: ${user.username}`,
                ipAddress: clientId as string,
                userAgent: req?.headers?.['user-agent'] || ''
              }
            }).catch(console.error)
            
            throw new Error('Username atau password salah')
          }

          // Clear failed attempts on successful login
          loginAttempts.delete(attemptKey)

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          // Log successful login activity
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN',
              resource: 'auth',
              description: 'User logged in successfully',
              ipAddress: clientId as string,
              userAgent: req?.headers?.['user-agent'] || ''
            }
          }).catch(console.error)

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role.name,
            roleId: user.roleId,
            permissions: user.role.permissions.map(p => ({
              name: p.name,
              resource: p.resource,
              action: p.action
            })),
            isActive: user.isActive,
            lastLogin: user.lastLogin
          }
        } catch (error) {
          console.error('Authentication error:', error)
          
          if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message)
          }
          
          throw new Error(error instanceof Error ? error.message : 'Terjadi kesalahan saat login')
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60,   // 1 hour
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.permissions = user.permissions
        token.isActive = user.isActive
      }

      // Handle session update
      if (trigger === 'update' && session) {
        // Update token with new session data
        if (session.user) {
          token.name = session.user.name
          token.email = session.user.email
        }
      }

      // Refresh user data periodically
      if (token.id && Date.now() - (token.iat || 0) * 1000 > 60 * 60 * 1000) { // 1 hour
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: {
              role: {
                include: {
                  permissions: true
                }
              }
            }
          })

          if (user && user.isActive) {
            token.name = user.name
            token.email = user.email
            token.role = user.role.name
            token.permissions = user.role.permissions.map(p => ({
              resource: p.resource,
              action: p.action
            }))
            token.isActive = user.isActive
          } else {
            // User is inactive or deleted, invalidate token
            return {}
          }
        } catch (error) {
          console.error('Error refreshing user data:', error)
        }
      }

      return token
    },

    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          role: token.role as string,
          permissions: token.permissions as Array<{ resource: string; action: string }>,
          isActive: token.isActive as boolean
        }
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Additional sign-in validation
      if (user && !user.isActive) {
        throw new Error('Akun Anda tidak aktif. Hubungi administrator.')
      }

      return true
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async signOut({ token }) {
      // Log logout activity
      if (token?.id) {
        try {
          await prisma.activityLog.create({
            data: {
              userId: token.id as string,
              action: 'LOGOUT',
              resource: 'auth',
              description: 'User logged out',
            }
          })
        } catch (error) {
          console.error('Error logging logout:', error)
        }
      }
    },

    async session({ session, token }) {
      // Update session activity
      if (token?.id) {
        try {
          await prisma.user.update({
            where: { id: token.id as string },
            data: { lastLogin: new Date() }
          })
        } catch (error) {
          console.error('Error updating session activity:', error)
        }
      }
    }
  },

  debug: process.env.NODE_ENV === 'development',
}