import { NextRequest, NextResponse } from 'next/server'
import { validateCSPReport, type CSPViolationReport } from '@/lib/security/security-headers'
import { logger } from '@/lib/monitoring/logger'
import { prisma } from '@/lib/db'

// POST /api/security/csp-report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const report = validateCSPReport(body)

    if (!report) {
      return NextResponse.json(
        { error: 'Invalid CSP report' },
        { status: 400 }
      )
    }

    const cspReport = report['csp-report']
    
    // Log CSP violation
    logger.warn('CSP Violation', {
      documentUri: cspReport['document-uri'],
      violatedDirective: cspReport['violated-directive'],
      blockedUri: cspReport['blocked-uri'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      userAgent: request.headers.get('user-agent')
    })

    // Store CSP violation in database for analysis
    await prisma.securityEvent.create({
      data: {
        type: 'CSP_VIOLATION',
        severity: 'medium',
        description: `CSP violation: ${cspReport['violated-directive']}`,
        metadata: {
          documentUri: cspReport['document-uri'],
          violatedDirective: cspReport['violated-directive'],
          effectiveDirective: cspReport['effective-directive'],
          blockedUri: cspReport['blocked-uri'],
          sourceFile: cspReport['source-file'],
          lineNumber: cspReport['line-number'],
          columnNumber: cspReport['column-number'],
          scriptSample: cspReport['script-sample'],
          userAgent: request.headers.get('user-agent'),
          ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
        },
        timestamp: new Date()
      }
    })

    // Check for potential attack patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /eval\(/i,
      /<script/i,
      /onclick/i,
      /onerror/i
    ]

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(cspReport['blocked-uri']) || 
      pattern.test(cspReport['script-sample'] || '')
    )

    if (isSuspicious) {
      // Log as potential attack
      logger.error('Potential XSS Attack Detected', {
        documentUri: cspReport['document-uri'],
        blockedUri: cspReport['blocked-uri'],
        scriptSample: cspReport['script-sample'],
        ip: request.ip || request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      })

      // Create high-severity security event
      await prisma.securityEvent.create({
        data: {
          type: 'POTENTIAL_XSS_ATTACK',
          severity: 'high',
          description: 'Potential XSS attack detected via CSP violation',
          metadata: {
            documentUri: cspReport['document-uri'],
            blockedUri: cspReport['blocked-uri'],
            scriptSample: cspReport['script-sample'],
            userAgent: request.headers.get('user-agent'),
            ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
          },
          timestamp: new Date()
        }
      })
    }

    return NextResponse.json({ status: 'received' }, { status: 204 })

  } catch (error) {
    console.error('CSP report processing error:', error)
    
    // Log the error but don't expose details
    logger.error('CSP report processing failed', {
      error: error instanceof Error ? error.message : String(error),
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for')
    })

    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}