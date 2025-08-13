import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <section className="opensid-hero">
        <div className="container">
          <h1 className="opensid-fade-in text-balance">
            Selamat Datang di{" "}
            <span className="text-blue-600">OpenSID</span>
          </h1>
          <p className="opensid-fade-in text-balance">
            Sistem Informasi Desa yang modern dan mudah digunakan untuk membantu 
            administrasi desa Anda
          </p>
          
          <div className="opensid-button-group opensid-fade-in">
            <Link href="/login" className="opensid-button-primary">
              Masuk ke Sistem
            </Link>
            <Link href="/public" className="opensid-button-secondary">
              Portal Publik
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="opensid-section bg-white">
        <div className="container">
          <h3>Fitur Utama OpenSID</h3>
          <div className="opensid-grid">
            <div className="opensid-card text-center opensid-fade-in">
              <div className="opensid-icon-container bg-blue-600">
                <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Manajemen Penduduk</h3>
              <p className="text-gray-600 flex-grow">
                Kelola data penduduk, keluarga, dan dokumen kependudukan dengan mudah dan terstruktur
              </p>
            </div>

            <div className="opensid-card text-center opensid-fade-in">
              <div className="opensid-icon-container bg-green-600">
                <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Layanan Surat</h3>
              <p className="text-gray-600 flex-grow">
                Proses pembuatan surat-menyurat dan dokumen administrasi desa secara digital
              </p>
            </div>

            <div className="opensid-card text-center opensid-fade-in">
              <div className="opensid-icon-container bg-red-600">
                <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Laporan & Statistik</h3>
              <p className="text-gray-600 flex-grow">
                Generate laporan dan statistik desa untuk keperluan administrasi dan pelaporan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="opensid-footer">
        <div className="container">
          <p className="font-medium">OpenSID v2.0.0 - Sistem Informasi Desa Modern</p>
          <p className="text-gray-400">
            Dikembangkan dengan ❤️ untuk kemajuan desa di Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
}