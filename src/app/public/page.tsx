/**
 * Public Home Page
 * Landing page for public visitors
 */

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react'

// This would typically come from an API or CMS
const villageStats = {
  population: 2450,
  families: 680,
  area: 15.5,
  hamlets: 4
}

const recentNews = [
  {
    id: 1,
    title: 'Pembangunan Jalan Desa Tahap II Dimulai',
    excerpt: 'Proyek pembangunan jalan desa sepanjang 2 km akan dimulai minggu depan...',
    date: '2024-01-15',
    category: 'Pembangunan'
  },
  {
    id: 2,
    title: 'Program Bantuan Sosial Bulan Januari',
    excerpt: 'Penyaluran bantuan sosial untuk keluarga kurang mampu akan dilaksanakan...',
    date: '2024-01-12',
    category: 'Sosial'
  },
  {
    id: 3,
    title: 'Musyawarah Desa Perencanaan 2024',
    excerpt: 'Undangan untuk seluruh warga menghadiri musyawarah desa...',
    date: '2024-01-10',
    category: 'Pemerintahan'
  }
]

const services = [
  {
    title: 'Surat Keterangan Domisili',
    description: 'Permohonan surat keterangan domisili online',
    icon: FileText,
    href: '/public/services/domicile'
  },
  {
    title: 'Surat Keterangan Usaha',
    description: 'Permohonan surat keterangan usaha untuk UMKM',
    icon: FileText,
    href: '/public/services/business'
  },
  {
    title: 'Pengaduan Online',
    description: 'Sampaikan keluhan dan saran untuk desa',
    icon: MessageSquare,
    href: '/public/complaints'
  },
  {
    title: 'Informasi Bantuan',
    description: 'Cek status dan informasi program bantuan',
    icon: Users,
    href: '/public/aid-info'
  }
]

export default function PublicHomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Selamat Datang di Desa [Nama Desa]
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Portal digital untuk informasi, layanan, dan partisipasi masyarakat desa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/public/services">
                  Layanan Online
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
                <Link href="/public/profile">
                  Profil Desa
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Village Statistics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Desa</h2>
          <p className="text-gray-600">Statistik terkini Desa [Nama Desa]</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{villageStats.population.toLocaleString('id-ID')}</div>
              <div className="text-sm text-gray-600">Penduduk</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{villageStats.families.toLocaleString('id-ID')}</div>
              <div className="text-sm text-gray-600">Keluarga</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{villageStats.area} km²</div>
              <div className="text-sm text-gray-600">Luas Wilayah</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{villageStats.hamlets}</div>
              <div className="text-sm text-gray-600">Dusun</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Layanan Online</h2>
            <p className="text-gray-600">Akses layanan administrasi desa dengan mudah dan cepat</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href={service.href}>
                        Akses Layanan
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Berita Terkini</h2>
            <p className="text-gray-600">Informasi dan kegiatan terbaru dari desa</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/public/news">
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentNews.map((news) => (
            <Card key={news.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{news.category}</Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(news.date).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{news.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{news.excerpt}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/public/news/${news.id}`}>
                    Baca Selengkapnya
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Hubungi Kami</h2>
              <p className="text-gray-600 mb-8">
                Kami siap melayani dan membantu kebutuhan administrasi Anda. 
                Jangan ragu untuk menghubungi kami melalui berbagai cara berikut.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">[Nomor Telepon]</div>
                    <div className="text-sm text-gray-600">Senin - Jumat, 08:00 - 16:00</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">[Email Desa]</div>
                    <div className="text-sm text-gray-600">Respon dalam 1x24 jam</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">[Alamat Kantor Desa]</div>
                    <div className="text-sm text-gray-600">Kecamatan [Nama Kecamatan]</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Jam Pelayanan</CardTitle>
                <CardDescription>
                  Waktu operasional kantor desa untuk pelayanan masyarakat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Senin - Jumat</span>
                  <span className="text-gray-600">08:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sabtu</span>
                  <span className="text-gray-600">08:00 - 12:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Minggu</span>
                  <span className="text-red-600">Tutup</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Istirahat: 12:00 - 13:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}