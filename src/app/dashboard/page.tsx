/**
 * Dashboard Page
 * Main dashboard with overview statistics and quick actions
 */

import { requireServerAuth } from '@/lib/rbac/server-utils'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, FileText, DollarSign, TrendingUp, Calendar } from 'lucide-react'

async function getDashboardStats() {
  try {
    const [
      totalCitizens,
      totalFamilies,
      totalUsers,
      pendingLetters,
      totalArticles,
      recentActivities
    ] = await Promise.all([
      prisma.citizen.count(),
      prisma.family.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.letterRequest.count({ where: { status: 'PENDING' } }),
      prisma.article.count({ where: { published: true } }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      })
    ])

    return {
      totalCitizens,
      totalFamilies,
      totalUsers,
      pendingLetters,
      totalArticles,
      recentActivities
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalCitizens: 0,
      totalFamilies: 0,
      totalUsers: 0,
      pendingLetters: 0,
      totalArticles: 0,
      recentActivities: []
    }
  }
}

export default async function DashboardPage() {
  const user = await requireServerAuth()
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Total Penduduk',
      value: stats.totalCitizens.toLocaleString('id-ID'),
      description: 'Jumlah penduduk terdaftar',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Keluarga',
      value: stats.totalFamilies.toLocaleString('id-ID'),
      description: 'Jumlah kepala keluarga',
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      title: 'Surat Pending',
      value: stats.pendingLetters.toLocaleString('id-ID'),
      description: 'Permohonan surat menunggu',
      icon: FileText,
      color: 'text-orange-600'
    },
    {
      title: 'Pengguna Aktif',
      value: stats.totalUsers.toLocaleString('id-ID'),
      description: 'Pengguna sistem aktif',
      icon: UserCheck,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Selamat datang, {user.name}!
        </h1>
        <p className="text-blue-100">
          Dashboard Sistem Informasi Desa - {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aksi Cepat
            </CardTitle>
            <CardDescription>
              Akses cepat ke fitur yang sering digunakan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/citizens/create"
                className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Tambah Penduduk</span>
              </a>
              <a
                href="/letters"
                className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Proses Surat</span>
              </a>
              <a
                href="/reports"
                className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Lihat Laporan</span>
              </a>
              <a
                href="/settings"
                className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Pengaturan</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aktivitas Terbaru
            </CardTitle>
            <CardDescription>
              Log aktivitas sistem terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user?.name || 'System'}</span>
                        {' '}{activity.description || `${activity.action} ${activity.resource}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Belum ada aktivitas terbaru
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
          <CardDescription>
            Status dan informasi sistem OpenSID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Versi:</span>
              <span className="ml-2">OpenSID 2.0.0 Next.js</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Role Anda:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {user.role}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Login Terakhir:</span>
              <span className="ml-2">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString('id-ID') : 'Belum pernah'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}