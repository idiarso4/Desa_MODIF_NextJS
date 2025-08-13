"use client"
import { useSession } from "next-auth/react";

type Permission = { resource: string; action: string }

export function useHasPermission(resource: string, action: string) {
  const { data } = useSession()
  const user = (data?.user ?? {}) as { permissions?: Permission[] }
  const permissions = user.permissions ?? []
  return permissions.some((p) => p.resource === resource && p.action === action)
}

