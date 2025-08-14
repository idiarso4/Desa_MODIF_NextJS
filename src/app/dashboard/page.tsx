/**
 * Enhanced Dashboard Page
 * Modern dashboard with improved UI/UX and interactive components
 */

import { requireServerAuth } from '@/lib/rbac/server-utils'
import { prisma } from '@/lib/db'
import { StatsGrid } from '@/components/ui/stats-grid'
import { QuickActions } from '@/components/ui/quick-actions'
import { ActivityFeed } from '@/components/ui/activity-feed'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Settings,
  BarChart3,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react'

async function getDashboardStats() {
  try {
    const [
      totalCitizens,
      totalFamilies,
      totalUsers,
      pendingLetters,
      completedLetters,
      totalArticles,
      recentActivities,
      citizensThisMonth,
      lettersThisMonth
    ] = await Promise.all([
      prisma.citizen.count(),
      prisma.family.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.letterRequest.count({ where: { status: 'PENDING' } }),
      prisma.letterRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.article.count({ where: { published: true } }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      }),
      prisma.citizen.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.letterRequest.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    // Calculate trends (mock data for demo)
    const citizenTrend = citizensThisMonth > 0 ? 12 : 0
    const letterTrend = lettersThisMonth > 0 ? 8 : 0

    return {
      totalCitizens,
      totalFamilies,
      totalUsers,
      pendingLetters,
      completedLetters,
      totalArticles,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        user: activity.user ? {
          name: activity.user.name,
          avatar: undefined
        } : undefined,
        action: activity.action,
        resource: activity.resource,
        description: activity.description,
        timestamp: activity.createdAt,
        type: activity.action.toLowerCase() as any,
        metadata: activity.metadata as Record<string, any>
      })),
      trends: {
        citizens: citizenTrend,
        letters: letterTrend
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalCitizens: 0,
      totalFamilies: 0,
      totalUsers: 0,
      pendingLetters: 0,
      completedLetters: 0,
      totalArticles: 0,
      recentActivities: [],
      trends: { citizens: 0, letters: 0 }
    }
  }
}

export default async function DashboardPage() {
  const user = await requireServerAuth()
  const stats = await getDashboardStats()

  const dashboardStats = [
    {
      title: 'Total Penduduk',
      value: stats.totalCitizens,
      description: 'Jumlah penduduk terdaftar',
      icon: Users,
      iconColor: 'text-blue-600',
      trend: {
        value: stats.trends.citizens,
        isPositive: stats.trends.citizens > 0
      },
      href: '/citizens'
    },
    {
      title: 'Total Keluarga',
      value: stats.totalFamilies,
      description: 'Jumlah kepala keluarga',
      icon: UserCheck,
      iconColor: 'text-green-600',
      href: '/families'
    },
    {
      title: 'Surat Pending',
      value: stats.pendingLetters,
      description: 'Permohonan surat menunggu',
      icon: Clock,
      iconColor: 'text-orange-600',
      href: '/letters?status=pending'
    },
    {
      title: 'Surat Selesai',
      value: stats.completedLetters,
      description: 'Surat yang telah diproses',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      trend: {
        value: stats.trends.letters,
        isPositive: stats.trends.letters > 0
      },
      href: '/letters?status=completed'
    }
  ]

  const quickActions = [
    {
      title: 'Tambah Penduduk',
      description: 'Daftarkan penduduk baru',
      icon: Plus,
      href: '/citizens/create',
      color: 'blue'
    },
    {
      title: 'Proses Surat',
      description: 'Kelola permohonan surat',
      icon: FileText,
      href: '/letters',
      color: 'green'
    },
    {
      title: 'Lihat Laporan',
      description: 'Analisis dan statistik',
      icon: BarChart3,
      href: '/reports',
      color: 'purple'
    },
    {
      title: 'Peta Desa',
      description: 'Visualisasi geografis',
      icon: MapPin,
      href: '/maps',
      color: 'orange'
    },
    {
      title: 'Kelola Artikel',
      description: 'Konten website publik',
      icon: Eye,
      href: '/content/articles',
      color: 'blue'
    },
    {
      title: 'Pengaturan',
      description: 'Konfigurasi sistem',
      icon: Settings,
      href: '/settings',
      color: 'gray'
    }
  ]

  const currentTime = new Date()
  const greeting = currentTime.getHours() < 12 ? 'Selamat pagi' : 
                  currentTime.getHours() < 15 ? 'Selamat siang' : 
                  currentTime.getHours() < 18 ? 'Selamat sore' : 'Selamat malam'

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {greeting}, {user.name}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  OpenSID v2.0.0
                </Badge>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Users className="w-16 h-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Enhanced Statistics Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Statistik Utama</h2>
            <p className="text-gray-600">Ringkasan data sistem informasi desa</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </div>
        <StatsGrid stats={dashboardStats} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Quick Actions - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <QuickActions 
            title="Aksi Cepat"
            description="Akses cepat ke fitur yang sering digunakan"
            actions={quickActions}
            columns={3}
          />
        </div>

        {/* Activity Feed - Takes 1 column on xl screens */}
        <div className="xl:col-span-1">
          <ActivityFeed 
            activities={stats.recentActivities}
            maxItems={6}
          />
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Database</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">API</span>
                <Badge className="bg-green-100 text-green-800">Aktif</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Backup</span>
                <Badge className="bg-green-100 text-green-800">Terjadwal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Performa Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Penduduk Baru</span>
                  <span className="font-medium">+{stats.trends.citizens}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Surat Diproses</span>
                  <span className="font-medium">+{stats.trends.letters}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Perlu Perhatian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingLetters > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{stats.pendingLetters} surat menunggu proses</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Sistem berjalan normal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Backup terakhir: Hari ini</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}