/**
 * API Documentation Route
 * Serves OpenAPI specification
 */

import { NextRequest, NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/docs/openapi-spec'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  // Return JSON by default
  if (format === 'yaml') {
    // Convert to YAML if requested
    const yaml = convertToYAML(openApiSpec)
    return new NextResponse(yaml, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Content-Disposition': 'attachment; filename="openapi.yaml"'
      }
    })
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

function convertToYAML(obj: any): string {
  // Simple YAML conversion - in production, use a proper YAML library
  return JSON.stringify(obj, null, 2)
    .replace(/"/g, '')
    .replace(/,$/gm, '')
    .replace(/^\s*{\s*$/gm, '')
    .replace(/^\s*}\s*$/gm, '')
}
