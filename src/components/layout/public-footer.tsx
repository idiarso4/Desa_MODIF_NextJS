/**
 * Public Footer Component
 * Footer for public-facing pages
 */

import Link from 'next/link'
import { Shield, MapPin, Phone, Mail, Clock } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Village Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Desa [Nama Desa]</h3>
                <p className="text-gray-300">Kecamatan [Nama Kecamatan]</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Website resmi Desa [Nama Desa] yang menyediakan informasi dan layanan 
              administrasi untuk masyarakat desa.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>[Alamat Lengkap Desa]</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>[Nomor Telepon Desa]</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>[Email Desa]</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/public/profile" className="text-gray-300 hover:text-white transition-colors">
                  Profil Desa
                </Link>
              </li>
              <li>
                <Link href="/public/news" className="text-gray-300 hover:text-white transition-colors">
                  Berita Terkini
                </Link>
              </li>
              <li>
                <Link href="/public/services" className="text-gray-300 hover:text-white transition-colors">
                  Layanan Publik
                </Link>
              </li>
              <li>
                <Link href="/public/complaints" className="text-gray-300 hover:text-white transition-colors">
                  Pengaduan Online
                </Link>
              </li>
              <li>
                <Link href="/public/contact" className="text-gray-300 hover:text-white transition-colors">
                  Kontak Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Jam Pelayanan</h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Senin - Jumat</span>
              </div>
              <p className="ml-6">08:00 - 16:00 WIB</p>
              
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Sabtu</span>
              </div>
              <p className="ml-6">08:00 - 12:00 WIB</p>
              
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Minggu</span>
              </div>
              <p className="ml-6">Tutup</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Desa [Nama Desa]. Semua hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-gray-400 text-sm">Powered by</span>
            <Link 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              OpenSID Next.js
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}