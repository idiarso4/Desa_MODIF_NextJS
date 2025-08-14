/**
 * Document Service
 * High-level service for generating various administrative documents
 */

import { PDFGenerator, DocumentData, PDFOptions } from './generator'
import { DocumentTemplates, TemplateData, TemplateType } from './templates'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export interface DocumentRequest {
  type: TemplateType
  citizenId: string
  purpose: string
  validUntil?: Date
  additionalData?: Record<string, any>
  options?: PDFOptions
}

export interface GeneratedDocument {
  buffer: Buffer
  filename: string
  metadata: {
    type: string
    citizenName: string
    documentNumber: string
    generatedAt: Date
  }
}

export class DocumentService {
  private pdfGenerator: PDFGenerator

  constructor() {
    this.pdfGenerator = new PDFGenerator()
  }

  async generateDocument(request: DocumentRequest): Promise<GeneratedDocument> {
    try {
      // Get citizen data
      const citizen = await prisma.citizen.findUnique({
        where: { id: request.citizenId },
        include: {
          address: true,
          family: true
        }
      })

      if (!citizen) {
        throw new Error('Citizen not found')
      }

      // Get village configuration
      const villageConfig = await this.getVillageConfig()
      
      // Get current official (kepala desa or authorized person)
      const official = await this.getCurrentOfficial()

      // Generate document number
      const documentNumber = await this.generateDocumentNumber(request.type)

      // Prepare template data
      const templateData: TemplateData = {
        village: villageConfig,
        official: official,
        citizen: {
          nik: citizen.nik,
          name: citizen.name,
          birthPlace: citizen.birthPlace,
          birthDate: format(citizen.birthDate, 'dd MMMM yyyy', { locale: id }),
          gender: citizen.gender === 'L' ? 'Laki-laki' : 'Perempuan',
          religion: this.formatReligion(citizen.religion),
          occupation: citizen.occupation || 'Tidak Bekerja',
          address: citizen.address?.street || '',
          rt: citizen.address?.rt || '',
          rw: citizen.address?.rw || ''
        },
        document: {
          number: documentNumber,
          date: format(new Date(), 'dd MMMM yyyy', { locale: id }),
          purpose: request.purpose,
          validUntil: request.validUntil ? format(request.validUntil, 'dd MMMM yyyy', { locale: id }) : undefined
        },
        additional: request.additionalData
      }

      // Get template
      const template = DocumentTemplates[request.type]
      if (!template) {
        throw new Error(`Template not found for type: ${request.type}`)
      }

      // Prepare document data
      const documentData: DocumentData = {
        title: this.getDocumentTitle(request.type),
        content: template,
        variables: templateData,
        metadata: {
          author: official.name,
          subject: this.getDocumentTitle(request.type),
          creator: 'OpenSID Next.js',
          keywords: ['surat', 'keterangan', 'desa', request.type]
        }
      }

      // Generate PDF
      const buffer = await this.pdfGenerator.generatePDF(documentData, request.options)

      // Save to database for tracking
      await this.saveDocumentRecord({
        type: request.type,
        citizenId: request.citizenId,
        documentNumber,
        purpose: request.purpose,
        validUntil: request.validUntil
      })

      return {
        buffer,
        filename: this.generateFilename(request.type, citizen.name, documentNumber),
        metadata: {
          type: request.type,
          citizenName: citizen.name,
          documentNumber,
          generatedAt: new Date()
        }
      }
    } catch (error) {
      console.error('Error generating document:', error)
      throw new Error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getVillageConfig() {
    // This would typically come from a settings table
    // For now, return default values
    return {
      name: 'Contoh Desa',
      district: 'Contoh Kecamatan',
      regency: 'Contoh Kabupaten',
      province: 'Contoh Provinsi',
      postalCode: '12345',
      phone: '(021) 1234567',
      email: 'desa@example.com',
      website: 'www.contohDesa.go.id'
    }
  }

  private async getCurrentOfficial() {
    // This would typically come from a village officials table
    // For now, return default values
    return {
      name: 'Budi Santoso',
      position: 'Kepala Desa',
      nip: '196501011990031001'
    }
  }

  private async generateDocumentNumber(type: TemplateType): Promise<string> {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    
    // Get the count of documents of this type this month
    const count = await prisma.document.count({
      where: {
        type,
        createdAt: {
          gte: new Date(year, new Date().getMonth(), 1),
          lt: new Date(year, new Date().getMonth() + 1, 1)
        }
      }
    })

    const sequence = String(count + 1).padStart(3, '0')
    const typeCode = this.getTypeCode(type)
    
    return `${sequence}/${typeCode}/${month}/${year}`
  }

  private getTypeCode(type: TemplateType): string {
    const codes = {
      domicileCertificate: 'SKD',
      businessCertificate: 'SKU',
      povertyLetter: 'SKTM'
    }
    return codes[type] || 'DOC'
  }

  private getDocumentTitle(type: TemplateType): string {
    const titles = {
      domicileCertificate: 'Surat Keterangan Domisili',
      businessCertificate: 'Surat Keterangan Usaha',
      povertyLetter: 'Surat Keterangan Tidak Mampu'
    }
    return titles[type] || 'Dokumen'
  }

  private formatReligion(religion: string): string {
    const religions = {
      'ISLAM': 'Islam',
      'KRISTEN': 'Kristen',
      'KATOLIK': 'Katolik',
      'HINDU': 'Hindu',
      'BUDDHA': 'Buddha',
      'KONGHUCU': 'Konghucu'
    }
    return religions[religion as keyof typeof religions] || religion
  }

  private generateFilename(type: TemplateType, citizenName: string, documentNumber: string): string {
    const sanitizedName = citizenName.replace(/[^a-zA-Z0-9]/g, '_')
    const sanitizedNumber = documentNumber.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
    
    return `${type}_${sanitizedName}_${sanitizedNumber}_${timestamp}.pdf`
  }

  private async saveDocumentRecord(data: {
    type: string
    citizenId: string
    documentNumber: string
    purpose: string
    validUntil?: Date
  }) {
    try {
      await prisma.document.create({
        data: {
          type: data.type,
          citizenId: data.citizenId,
          documentNumber: data.documentNumber,
          purpose: data.purpose,
          validUntil: data.validUntil,
          status: 'GENERATED',
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error saving document record:', error)
      // Don't throw here as the PDF was generated successfully
    }
  }

  async close(): Promise<void> {
    await this.pdfGenerator.close()
  }

  // Static method for one-time document generation
  static async generate(request: DocumentRequest): Promise<GeneratedDocument> {
    const service = new DocumentService()
    try {
      return await service.generateDocument(request)
    } finally {
      await service.close()
    }
  }
}

// Utility functions
export async function generateDomicileCertificate(
  citizenId: string,
  purpose: string,
  validUntil?: Date
): Promise<GeneratedDocument> {
  return DocumentService.generate({
    type: 'domicileCertificate',
    citizenId,
    purpose,
    validUntil
  })
}

export async function generateBusinessCertificate(
  citizenId: string,
  purpose: string,
  businessData: {
    businessType: string
    businessAddress: string
    businessStartDate?: string
  }
): Promise<GeneratedDocument> {
  return DocumentService.generate({
    type: 'businessCertificate',
    citizenId,
    purpose,
    additionalData: businessData
  })
}

export async function generatePovertyLetter(
  citizenId: string,
  purpose: string
): Promise<GeneratedDocument> {
  return DocumentService.generate({
    type: 'povertyLetter',
    citizenId,
    purpose
  })
}
