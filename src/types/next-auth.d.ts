declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      name: string
      role: {
        id: string
        name: string
      }
      permissions: Array<{
        resource: string
        action: string
        name: string
      }>
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: Session["user"]
  }
}

