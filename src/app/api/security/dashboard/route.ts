import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { checkPermission } from '@/lib/rbac/server-utils'
import { AuditQueryService, AuditEventType, AuditSeverity } from '@/lib/security/audit-system'
import { RateLimitStats } from '@/lib/security/rate-limiting'
import { CSRFMonitor } from '@/lib/security/csrf-protection'
import { logger } from '@/lib/monitoring/logger'
import { cache } from '@/lib/cache/redis'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check