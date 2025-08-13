/* eslint-disable @typescript-eslint/no-explicit-any */
// Authentication service
import { userRepository } from '../repositories/user'
import { hashPassword, verifyPassword } from '../auth'
import type { User } from '../../types'
import type { LoginInput, UserInput } from '../validations'

export class AuthService {
  async login(credentials: LoginInput): Promise<{ user: User; success: boolean }> {
    const user = await userRepository.findByCredentials(credentials.username)
    
    if (!user) {
      throw new Error('Username atau password salah')
    }

    if (!user.isActive) {
      throw new Error('Akun Anda tidak aktif. Hubungi administrator.')
    }

    const isValidPassword = await verifyPassword(credentials.password, user.password)
    
    if (!isValidPassword) {
      throw new Error('Username atau password salah')
    }

    // Update last login
    await userRepository.updateLastLogin(user.id)

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword as User,
      success: true,
    }
  }

  async createUser(data: UserInput): Promise<User> {
    // Check if username already exists
    const existingUsername = await userRepository.findByUsername(data.username)
    if (existingUsername) {
      throw new Error('Username sudah digunakan')
    }

    // Check if email already exists
    const existingEmail = await userRepository.findByEmail(data.email)
    if (existingEmail) {
      throw new Error('Email sudah digunakan')
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    })

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  async updateUser(id: string, data: Partial<UserInput>): Promise<User> {
    const existingUser = await userRepository.findById(id)
    if (!existingUser) {
      throw new Error('User tidak ditemukan')
    }

    // Check username uniqueness if being updated
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await userRepository.findByUsername(data.username)
      if (usernameExists) {
        throw new Error('Username sudah digunakan')
      }
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await userRepository.findByEmail(data.email)
      if (emailExists) {
        throw new Error('Email sudah digunakan')
      }
    }

    // Hash password if being updated
    const updateData = { ...data }
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    // Update user
    const updatedUser = await userRepository.update(id, updateData)

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword as User
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('User tidak ditemukan')
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      throw new Error('Password saat ini salah')
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await userRepository.update(userId, {
      password: hashedNewPassword,
    })
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await userRepository.update(id, {
      isActive: false,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  async activateUser(id: string): Promise<User> {
    const user = await userRepository.update(id, {
      isActive: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await userRepository.findById(id)
    if (!user) return null

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  async searchUsers(query: string) {
    const users = await userRepository.searchUsers(query)
    return users.map((user: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }

  async validateUserData(data: UserInput): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check username uniqueness
    const existingUsername = await userRepository.findByUsername(data.username)
    if (existingUsername) {
      errors.push('Username sudah digunakan')
    }

    // Check email uniqueness
    const existingEmail = await userRepository.findByEmail(data.email)
    if (existingEmail) {
      errors.push('Email sudah digunakan')
    }

    // Validate password strength
    if (data.password.length < 6) {
      errors.push('Password minimal 6 karakter')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const authService = new AuthService()