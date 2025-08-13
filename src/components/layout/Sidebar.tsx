/**
 * Sidebar Navigation Component
 * Main navigation sidebar with role-based menu items
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useAuth, useUserMenu } from '@/lib/auth/hooks'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  Newspaper, 
  BarChart, 
  UserCog, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap = {
  Home,
  Users,
  FileText,
  DollarSign,
  Newspaper,
  BarChart,
  UserCog,
  Settings,
  Shield
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const { user } = useAuth()
  const menuItems = useUserMenu()

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Enhanced menu items with sub-items
  const enhancedMenuItems = menuItems.map(item => {
    const subItems = []
    
    // Add sub-items based on main item
    if (item.href === '/citizens') {
      subItems.push(
        { title: 'Daftar Penduduk', href: '/citizens' },
        { title: 'Tambah Penduduk', href: '/citizens/create' },
        { title: 'Import Data', href: '/citizens/import' }
      )
    } else if (item.href === '/letters') {
      subItems.push(
        { title: 'Daftar Permohonan', href: '/letters' },
        { title: 'Proses Surat', href: '/letters/process' },
        { title: 'Template Surat', href: '/letters/templates' }
      )
    } else if (item.href === '/finance') {
      subItems.push(
        { title: 'Anggaran', href: '/finance/budget' },
        { title: 'Pengeluaran', href: '/finance/expenses' },
        { title: 'Program Bantuan', href: '/finance/aid-programs' }
      )
    } else if (item.href === '/reports') {
      subItems.push(
        { title: 'Laporan Penduduk', href: '/reports/population' },
        { title: 'Laporan Keuangan', href: '/reports/finance' },
        { title: 'Laporan Kegiatan', href: '/reports/activities' }
      )
    }

    return {
      ...item,
      subItems: subItems.length > 0 ? subItems : undefined
    }
  })

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-lg text-gray-900">OpenSID</h1>
              <p className="text-xs text-gray-500">Sistem Informasi Desa</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {enhancedMenuItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || Home
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const isExpanded = expandedItems.includes(item.href)
            const hasSubItems = item.subItems && item.subItems.length > 0

            return (
              <li key={item.href}>
                <div className="relative">
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleExpanded(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  )}
                </div>

                {/* Sub-items */}
                {hasSubItems && isExpanded && !isCollapsed && (
                  <ul className="mt-1 ml-8 space-y-1">
                    {item.subItems!.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-lg transition-colors",
                            pathname === subItem.href
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Keluar</span>}
        </Button>
      </div>
    </div>
  )
}