/**
 * CSRF Token API
 * Provides CSRF tokens for client-side requests
 */

import { NextRequest } from 'next/server'
import { getCSRFToken } from '@/lib/security/csrf'

export async function GET(request: NextRequest) {
  return getCSRFToken(request)
}
