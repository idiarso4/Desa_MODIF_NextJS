/**
 * Header Component
 * Top navigation bar with user menu and notifications
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useAuth } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Shield,
  ChevronDown,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Search:', searchQuery)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and Search */}
        <div className="flex items-center gap-6">
          {title && (
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          )}
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari penduduk, surat, atau data lainnya..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </form>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="flex-col items-start p-3">
                  <div className="font-medium">Permohonan surat baru</div>
                  <div className="text-sm text-gray-500">
                    Ahmad Wijaya mengajukan surat keterangan domisili
                  </div>
                  <div className="text-xs text-gray-400 mt-1">2 menit yang lalu</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start p-3">
                  <div className="font-medium">Data penduduk diperbarui</div>
                  <div className="text-sm text-gray-500">
                    5 data penduduk telah diperbarui oleh operator
                  </div>
                  <div className="text-xs text-gray-400 mt-1">1 jam yang lalu</div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start p-3">
                  <div className="font-medium">Backup otomatis selesai</div>
                  <div className="text-sm text-gray-500">
                    Backup database harian telah berhasil dibuat
                  </div>
                  <div className="text-xs text-gray-400 mt-1">3 jam yang lalu</div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center">
                <Link href="/notifications" className="text-sm text-blue-600">
                  Lihat semua notifikasi
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profil Saya
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/profile/change-password" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Ubah Password
                  </Link>
                </DropdownMenuItem>
                
                {(user.role === 'Super Admin' || user.role === 'Admin Desa') && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Pengaturan
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}