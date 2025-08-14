/**
 * API Documentation Page
 * Swagger UI for API documentation
 */

'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Download, Code, Book } from 'lucide-react'

export default function DocsPage() {
  const swaggerUIRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamically load Swagger UI
    const loadSwaggerUI = async () => {
      if (typeof window !== 'undefined' && swaggerUIRef.current) {
        // Load Swagger UI CSS and JS from CDN
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css'
        document.head.appendChild(link)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js'
        script.onload = () => {
          // Initialize Swagger UI
          if (window.SwaggerUIBundle) {
            window.SwaggerUIBundle({
              url: '/api/docs',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                window.SwaggerUIBundle.presets.apis,
                window.SwaggerUIBundle.presets.standalone
              ],
              plugins: [
                window.SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: 'StandaloneLayout',
              tryItOutEnabled: true,
              requestInterceptor: (request: any) => {
                // Add authentication header if available
                const token = localStorage.getItem('auth-token')
                if (token) {
                  request.headers.Authorization = `Bearer ${token}`
                }
                return request
              }
            })
          }
        }
        document.head.appendChild(script)
      }
    }

    loadSwaggerUI()
  }, [])

  const handleDownloadSpec = async (format: 'json' | 'yaml') => {
    try {
      const response = await fetch(`/api/docs?format=${format}`)
      const content = await response.text()
      
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'application/x-yaml' 
      })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `openapi.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading spec:', error)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Interactive API documentation for OpenSID Next.js
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadSpec('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadSpec('yaml')}
          >
            <Download className="h-4 w-4 mr-2" />
            YAML
          </Button>
        </div>
      </div>

      {/* API Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              API Version
            </CardTitle>
            <CardDescription>Current API version and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version</span>
                <Badge variant="default">v2.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Format</span>
                <Badge variant="secondary">OpenAPI 3.0.3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Endpoints
            </CardTitle>
            <CardDescription>Available API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentication</span>
                <Badge variant="outline">2 endpoints</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Citizens</span>
                <Badge variant="outline">4 endpoints</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Documents</span>
                <Badge variant="outline">2 endpoints</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Resources
            </CardTitle>
            <CardDescription>Additional resources and links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start p-0">
                <ExternalLink className="h-4 w-4 mr-2" />
                GitHub Repository
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start p-0">
                <ExternalLink className="h-4 w-4 mr-2" />
                Postman Collection
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start p-0">
                <ExternalLink className="h-4 w-4 mr-2" />
                API Changelog
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            How to authenticate with the OpenSID API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">1. Login to get access token</h4>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  POST /api/auth/signin<br/>
                  Content-Type: application/json<br/><br/>
                  {`{
  "username": "your_username",
  "password": "your_password"
}`}
                </code>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">2. Use the token in subsequent requests</h4>
              <div className="bg-gray-100 p-3 rounded-md">
                <code className="text-sm">
                  Authorization: Bearer YOUR_ACCESS_TOKEN
                </code>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The Swagger UI below will automatically include your authentication token 
                if you're logged in to the application.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting Info */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>
            API rate limits and usage guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">General API</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 100 requests per minute</li>
                <li>• 1000 requests per hour</li>
                <li>• Rate limit headers included</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Authentication</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 5 attempts per 15 minutes</li>
                <li>• Account lockout after 5 failures</li>
                <li>• IP-based rate limiting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swagger UI Container */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive API Explorer</CardTitle>
          <CardDescription>
            Try out the API endpoints directly from this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="swagger-ui" ref={swaggerUIRef} className="min-h-96">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading API documentation...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Extend Window interface for Swagger UI
declare global {
  interface Window {
    SwaggerUIBundle: any
  }
}
