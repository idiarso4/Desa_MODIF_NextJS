// Image optimization utilities for OpenSID
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

// Image optimization configurations
export const ImageConfig = {
  // Quality settings
  quality: {
    high: 90,
    medium: 75,
    low: 60
  },
  
  // Size presets
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
    banner: { width: 1920, height: 600 }
  },
  
  // Supported formats
  formats: ['jpeg', 'png', 'webp', 'avif'] as const,
  
  // Max file sizes (in bytes)
  maxSizes: {
    avatar: 2 * 1024 * 1024,      // 2MB
    document: 10 * 1024 * 1024,   // 10MB
    gallery: 5 * 1024 * 1024      // 5MB
  }
} as const

export type ImageFormat = typeof ImageConfig.formats[number]
export type ImageSize = keyof typeof ImageConfig.sizes

// Image optimization class
export class ImageOptimizer {
  private uploadDir: string

  constructor(uploadDir: string = 'public/uploads') {
    this.uploadDir = uploadDir
  }

  // Optimize single image with multiple formats and sizes
  async optimizeImage(
    inputBuffer: Buffer,
    filename: string,
    options: {
      sizes?: ImageSize[]
      formats?: ImageFormat[]
      quality?: keyof typeof ImageConfig.quality
    } = {}
  ): Promise<{
    original: string
    optimized: Array<{
      size: ImageSize
      format: ImageFormat
      path: string
      width: number
      height: number
      fileSize: number
    }>
  }> {
    const {
      sizes = ['thumbnail', 'medium'],
      formats = ['webp', 'jpeg'],
      quality = 'medium'
    } = options

    const qualityValue = ImageConfig.quality[quality]
    const originalPath = path.join(this.uploadDir, 'original', filename)
    const optimized: Array<{
      size: ImageSize
      format: ImageFormat
      path: string
      width: number
      height: number
      fileSize: number
    }> = []

    // Ensure directories exist
    await this.ensureDirectories()

    // Save original file
    await fs.writeFile(originalPath, inputBuffer)

    // Generate optimized versions
    for (const size of sizes) {
      for (const format of formats) {
        const sizeConfig = ImageConfig.sizes[size]
        const outputFilename = `${path.parse(filename).name}_${size}.${format}`
        const outputPath = path.join(this.uploadDir, size, outputFilename)

        try {
          let pipeline = sharp(inputBuffer)
            .resize(sizeConfig.width, sizeConfig.height, {
              fit: 'cover',
              position: 'center'
            })

          // Apply format-specific optimizations
          switch (format) {
            case 'jpeg':
              pipeline = pipeline.jpeg({ 
                quality: qualityValue,
                progressive: true,
                mozjpeg: true
              })
              break
            case 'png':
              pipeline = pipeline.png({ 
                quality: qualityValue,
                compressionLevel: 9,
                progressive: true
              })
              break
            case 'webp':
              pipeline = pipeline.webp({ 
                quality: qualityValue,
                effort: 6
              })
              break
            case 'avif':
              pipeline = pipeline.avif({ 
                quality: qualityValue,
                effort: 6
              })
              break
          }

          const outputBuffer = await pipeline.toBuffer()
          await fs.writeFile(outputPath, outputBuffer)

          // Get image metadata
          const metadata = await sharp(outputBuffer).metadata()

          optimized.push({
            size,
            format,
            path: outputPath,
            width: metadata.width || sizeConfig.width,
            height: metadata.height || sizeConfig.height,
            fileSize: outputBuffer.length
          })
        } catch (error) {
          console.error(`Error optimizing image ${filename} to ${size}/${format}:`, error)
        }
      }
    }

    return {
      original: originalPath,
      optimized
    }
  }

  // Optimize avatar images specifically
  async optimizeAvatar(
    inputBuffer: Buffer,
    userId: string
  ): Promise<{
    thumbnail: string
    medium: string
    original: string
  }> {
    const filename = `avatar_${userId}_${Date.now()}.jpg`
    
    const result = await this.optimizeImage(inputBuffer, filename, {
      sizes: ['thumbnail', 'medium'],
      formats: ['webp', 'jpeg'],
      quality: 'high'
    })

    // Find the best versions
    const thumbnail = result.optimized.find(img => 
      img.size === 'thumbnail' && img.format === 'webp'
    )?.path || result.optimized.find(img => img.size === 'thumbnail')?.path || ''

    const medium = result.optimized.find(img => 
      img.size === 'medium' && img.format === 'webp'
    )?.path || result.optimized.find(img => img.size === 'medium')?.path || ''

    return {
      thumbnail,
      medium,
      original: result.original
    }
  }

  // Optimize gallery images
  async optimizeGalleryImage(
    inputBuffer: Buffer,
    filename: string
  ): Promise<{
    thumbnail: string
    medium: string
    large: string
    original: string
  }> {
    const result = await this.optimizeImage(inputBuffer, filename, {
      sizes: ['thumbnail', 'medium', 'large'],
      formats: ['webp', 'jpeg'],
      quality: 'high'
    })

    const findBest = (size: ImageSize) => {
      return result.optimized.find(img => 
        img.size === size && img.format === 'webp'
      )?.path || result.optimized.find(img => img.size === size)?.path || ''
    }

    return {
      thumbnail: findBest('thumbnail'),
      medium: findBest('medium'),
      large: findBest('large'),
      original: result.original
    }
  }

  // Optimize document images (scanned documents, etc.)
  async optimizeDocument(
    inputBuffer: Buffer,
    filename: string
  ): Promise<{
    compressed: string
    thumbnail: string
    original: string
  }> {
    const result = await this.optimizeImage(inputBuffer, filename, {
      sizes: ['thumbnail', 'large'],
      formats: ['jpeg'],
      quality: 'medium'
    })

    const compressed = result.optimized.find(img => img.size === 'large')?.path || ''
    const thumbnail = result.optimized.find(img => img.size === 'thumbnail')?.path || ''

    return {
      compressed,
      thumbnail,
      original: result.original
    }
  }

  // Batch optimize multiple images
  async batchOptimize(
    images: Array<{
      buffer: Buffer
      filename: string
      type: 'avatar' | 'gallery' | 'document'
    }>
  ): Promise<Array<{
    filename: string
    success: boolean
    paths?: any
    error?: string
  }>> {
    const results = []

    for (const image of images) {
      try {
        let paths
        
        switch (image.type) {
          case 'avatar':
            paths = await this.optimizeAvatar(image.buffer, 'batch')
            break
          case 'gallery':
            paths = await this.optimizeGalleryImage(image.buffer, image.filename)
            break
          case 'document':
            paths = await this.optimizeDocument(image.buffer, image.filename)
            break
        }

        results.push({
          filename: image.filename,
          success: true,
          paths
        })
      } catch (error) {
        results.push({
          filename: image.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  // Clean up old optimized images
  async cleanupOldImages(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    let deletedCount = 0

    const directories = ['thumbnail', 'small', 'medium', 'large', 'banner']
    
    for (const dir of directories) {
      const dirPath = path.join(this.uploadDir, dir)
      
      try {
        const files = await fs.readdir(dirPath)
        
        for (const file of files) {
          const filePath = path.join(dirPath, file)
          const stats = await fs.stat(filePath)
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath)
            deletedCount++
          }
        }
      } catch (error) {
        console.error(`Error cleaning up directory ${dir}:`, error)
      }
    }

    return deletedCount
  }

  // Get image metadata
  async getImageMetadata(imagePath: string): Promise<{
    width: number
    height: number
    format: string
    size: number
    hasAlpha: boolean
  }> {
    const metadata = await sharp(imagePath).metadata()
    const stats = await fs.stat(imagePath)

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
      hasAlpha: metadata.hasAlpha || false
    }
  }

  // Validate image file
  async validateImage(buffer: Buffer, maxSize: number): Promise<{
    valid: boolean
    error?: string
    metadata?: any
  }> {
    try {
      // Check file size
      if (buffer.length > maxSize) {
        return {
          valid: false,
          error: `File size ${buffer.length} exceeds maximum ${maxSize} bytes`
        }
      }

      // Check if it's a valid image
      const metadata = await sharp(buffer).metadata()
      
      if (!metadata.width || !metadata.height) {
        return {
          valid: false,
          error: 'Invalid image: no dimensions found'
        }
      }

      // Check format
      if (!ImageConfig.formats.includes(metadata.format as any)) {
        return {
          valid: false,
          error: `Unsupported format: ${metadata.format}`
        }
      }

      return {
        valid: true,
        metadata
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid image file'
      }
    }
  }

  // Ensure required directories exist
  private async ensureDirectories(): Promise<void> {
    const directories = [
      'original',
      ...Object.keys(ImageConfig.sizes)
    ]

    for (const dir of directories) {
      const dirPath = path.join(this.uploadDir, dir)
      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
      }
    }
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer()

// Utility functions
export async function optimizeUploadedImage(
  file: File,
  type: 'avatar' | 'gallery' | 'document' = 'gallery'
): Promise<any> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Validate first
  const maxSize = type === 'avatar' 
    ? ImageConfig.maxSizes.avatar
    : type === 'document'
    ? ImageConfig.maxSizes.document
    : ImageConfig.maxSizes.gallery

  const validation = await imageOptimizer.validateImage(buffer, maxSize)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Optimize based on type
  switch (type) {
    case 'avatar':
      return imageOptimizer.optimizeAvatar(buffer, 'user')
    case 'gallery':
      return imageOptimizer.optimizeGalleryImage(buffer, file.name)
    case 'document':
      return imageOptimizer.optimizeDocument(buffer, file.name)
  }
}