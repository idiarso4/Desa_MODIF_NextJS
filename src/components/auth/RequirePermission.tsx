"use client"
import { useHasPermission } from "@/hooks/use-permission";
import type { ReactNode } from "react";

export function RequirePermission({ resource, action, children }: { resource: string; action: string; children: ReactNode }) {
  const allowed = useHasPermission(resource, action)
  if (!allowed) return null
  return <>{children}</>
}

