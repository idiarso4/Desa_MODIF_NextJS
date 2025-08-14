/**
 * PDF Generator Library
 * Handles PDF generation for various document types using Puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import { promises as fs } from 'fs'
import path from 'path'

export interface PDFOptions {
  format?: 'A4' | 'A5' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  headerTemplate?: string
  footerTemplate?: string
  displayHeaderFooter?: boolean
}

export interface DocumentData {
  title: string
  content: string
  variables?: Record<string, any>
  metadata?: {
    author?: string
    subject?: string
    creator?: string
    keywords?: string[]
  }
}

export class PDFGenerator {
  private browser: Browser | null = null
  private page: Page | null = null

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })
    }
    
    if (!this.page) {
      this.page = await this.browser.newPage()
      await this.page.setViewport({ width: 1200, height: 800 })
    }
  }

  async generatePDF(
    documentData: DocumentData,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    await this.initialize()
    
    if (!this.page) {
      throw new Error('Failed to initialize PDF page')
    }

    // Process template with variables
    const processedContent = this.processTemplate(documentData.content, documentData.variables || {})
    
    // Create complete HTML document
    const html = this.createHTMLDocument(processedContent, documentData.title)
    
    // Set content
    await this.page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Generate PDF
    const pdfBuffer = await this.page.pdf({
      format: options.format || 'A4',
      landscape: options.orientation === 'landscape',
      margin: options.margin || {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      printBackground: true,
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      ...options.metadata && {
        metadata: {
          title: documentData.title,
          author: options.metadata?.author || 'OpenSID',
          subject: options.metadata?.subject || documentData.title,
          creator: options.metadata?.creator || 'OpenSID Next.js',
          keywords: options.metadata?.keywords?.join(', ') || ''
        }
      }
    })

    return pdfBuffer
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template
    
    // Replace variables in format {{variable_name}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processed = processed.replace(regex, String(value || ''))
    })
    
    // Handle conditional blocks {{#if condition}}...{{/if}}
    processed = this.processConditionals(processed, variables)
    
    // Handle loops {{#each array}}...{{/each}}
    processed = this.processLoops(processed, variables)
    
    return processed
  }

  private processConditionals(template: string, variables: Record<string, any>): string {
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = variables[condition]
      return value ? content : ''
    })
  }

  private processLoops(template: string, variables: Record<string, any>): string {
    const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g
    
    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = variables[arrayName]
      if (!Array.isArray(array)) return ''
      
      return array.map((item, index) => {
        let itemContent = content
        
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/{{this}}/g, String(item))
        
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/{{@index}}/g, String(index))
        
        // Replace object properties if item is an object
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            itemContent = itemContent.replace(regex, String(value || ''))
          })
        }
        
        return itemContent
      }).join('')
    })
  }

  private createHTMLDocument(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page {
            margin: 1cm;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }
        
        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
        }
        
        .header h2 {
            font-size: 14pt;
            font-weight: normal;
            margin: 5px 0;
        }
        
        .header .address {
            font-size: 10pt;
            margin-top: 10px;
        }
        
        .content {
            margin: 20px 0;
        }
        
        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            width: 200px;
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            margin: 60px 0 5px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        table, th, td {
            border: 1px solid #000;
        }
        
        th, td {
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        
        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .mb-3 { margin-bottom: 15px; }
        .mb-4 { margin-bottom: 20px; }
        
        .mt-1 { margin-top: 5px; }
        .mt-2 { margin-top: 10px; }
        .mt-3 { margin-top: 15px; }
        .mt-4 { margin-top: 20px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close()
      this.page = null
    }
    
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  // Static method for one-time PDF generation
  static async generate(
    documentData: DocumentData,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    const generator = new PDFGenerator()
    try {
      return await generator.generatePDF(documentData, options)
    } finally {
      await generator.close()
    }
  }
}

// Utility function to save PDF to file
export async function savePDFToFile(
  pdfBuffer: Buffer,
  filePath: string
): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, pdfBuffer)
}

// Utility function to get PDF as base64
export function pdfToBase64(pdfBuffer: Buffer): string {
  return pdfBuffer.toString('base64')
}
