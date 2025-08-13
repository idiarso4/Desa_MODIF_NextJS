import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { WithPermission } from '@/components/rbac/with-permission'

// Mock the usePermissions hook
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: jest.fn()
}))

describe('WithPermission Component', () => {
  const mockUsePermissions = require('@/hooks/use-permissions').usePermissions

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children when user has permission', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true)
    })

    render(
      <WithPermission resource="citizens" action="read">
        <div>Protected Content</div>
      </WithPermission>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should not render children when user lacks permission', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(false)
    })

    render(
      <WithPermission resource="citizens" action="read">
        <div>Protected Content</div>
      </WithPermission>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render fallback when user lacks permission and fallback is provided', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(false)
    })

    render(
      <WithPermission 
        resource="citizens" 
        action="read"
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </WithPermission>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('should call hasPermission with correct parameters', () => {
    const mockHasPermission = jest.fn().mockReturnValue(true)
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission
    })

    render(
      <WithPermission resource="users" action="manage">
        <div>Admin Panel</div>
      </WithPermission>
    )

    expect(mockHasPermission).toHaveBeenCalledWith('users', 'manage')
  })

  it('should handle multiple permission checks', () => {
    const mockHasPermission = jest.fn()
      .mockReturnValueOnce(false) // First check fails
      .mockReturnValueOnce(true)  // Second check passes

    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission
    })

    const { rerender } = render(
      <WithPermission resource="citizens" action="delete">
        <div>Delete Button</div>
      </WithPermission>
    )

    expect(screen.queryByText('Delete Button')).not.toBeInTheDocument()

    rerender(
      <WithPermission resource="citizens" action="read">
        <div>View Button</div>
      </WithPermission>
    )

    expect(screen.getByText('View Button')).toBeInTheDocument()
  })

  it('should handle nested WithPermission components', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true)
    })

    render(
      <WithPermission resource="citizens" action="read">
        <div>
          <span>Citizen List</span>
          <WithPermission resource="citizens" action="create">
            <button>Add Citizen</button>
          </WithPermission>
        </div>
      </WithPermission>
    )

    expect(screen.getByText('Citizen List')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Citizen' })).toBeInTheDocument()
  })

  it('should handle permission check errors gracefully', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockImplementation(() => {
        throw new Error('Permission check failed')
      })
    })

    // Should not crash and should not render content
    render(
      <WithPermission resource="citizens" action="read">
        <div>Protected Content</div>
      </WithPermission>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})