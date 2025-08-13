import { authenticateUser, createSessionData } from "@/lib/auth"
import { config } from "@/lib/config"
import type { AuthUser } from "@/types"
import Credentials from "next-auth/providers/credentials"

export const authOptions = {
  secret: config.auth.secret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const user = await authenticateUser(credentials.username as string, credentials.password as string)
        if (!user) return null
        const sessionUser = createSessionData(user as unknown as AuthUser)
        return sessionUser as unknown as AuthUser
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown> & { user?: AuthUser }; user?: unknown }) {
      if (user) {
        token.user = user as AuthUser
      }
      return token
    },
    async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> & { user?: AuthUser } }) {
      if (token?.user) {
        Object.assign(session, { user: token.user })
      }
      return session
    },
  },
}

