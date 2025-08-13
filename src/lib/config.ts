// Application configuration
export const config = {
  app: {
    name: process.env.APP_NAME || 'OpenSID',
    version: process.env.APP_VERSION || '2.0.0',
    description: process.env.APP_DESCRIPTION || 'Sistem Informasi Desa',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}