import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock session data for testing
export const mockSession = {
  user: {
    id: 'test-user-id',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Admin',
    permissions: [
      { resource: 'citizens', action: 'read' },
      { resource: 'citizens', action: 'create' },
      { resource: 'citizens', action: 'update' },
      { resource: 'citizens', action: 'delete' },
      { resource: 'users', action: 'manage' }
    ]
  },
  expires: '2024-12-31'
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
}

const AllTheProviders = ({ 
  children, 
  session = null 
}: { 
  children: React.ReactNode
  session?: any 
}) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  { session = null, ...options }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders session={session}>{children}</AllTheProviders>
  )
  
  return render(ui, { wrapper: Wrapper, ...options })
}

// Render with authenticated session
export const renderWithAuth = (ui: ReactElement, options?: CustomRenderOptions) => {
  return customRender(ui, { session: mockSession, ...options })
}

// Render with unauthenticated session
export const renderWithoutAuth = (ui: ReactElement, options?: CustomRenderOptions) => {
  return customRender(ui, { session: null, ...options })
}

// Mock API response helpers
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  })
}

export const mockApiError = (message: string, status = 500) => {
  return Promise.reject({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message }))
  })
}

// Mock form data
export const mockCitizenData = {
  nik: '1234567890123456',
  name: 'John Doe',
  birthDate: '1990-01-01',
  birthPlace: 'Jakarta',
  gender: 'L' as const,
  religion: 'ISLAM' as const,
  education: 'S1' as const,
  occupation: 'Software Engineer',
  maritalStatus: 'KAWIN' as const,
  bloodType: 'A' as const,
  rt: '001',
  rw: '002',
  address: 'Jl. Merdeka No. 1'
}

export const mockUserData = {
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  password: 'SecurePass123!',
  roleId: 'role-id-123'
}

export const mockLetterRequestData = {
  citizenId: 'citizen-id-123',
  letterType: 'DOMICILE' as const,
  purpose: 'Untuk keperluan administrasi',
  notes: 'Catatan tambahan'
}

// Test database helpers
export const createMockPrismaClient = () => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  citizen: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  family: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  letterRequest: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  activityLog: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  $connect: jest.fn(),
  $disconnect: jest.fn()
})

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Custom matchers
expect.extend({
  toHaveValidationError(received, field) {
    const pass = received.error?.issues?.some((issue: any) => 
      issue.path.includes(field)
    )
    
    if (pass) {
      return {
        message: () => `Expected validation to not have error for field "${field}"`,
        pass: true
      }
    } else {
      return {
        message: () => `Expected validation to have error for field "${field}"`,
        pass: false
      }
    }
  }
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }