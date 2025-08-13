# OpenSID Next.js

Sistem Informasi Desa (SID) modern yang dibangun dengan Next.js 14+, TypeScript, dan teknologi web terkini.

## 🚀 Fitur Utama

- **Modern Architecture**: Dibangun dengan Next.js 14+ App Router
- **Type Safety**: Full TypeScript support untuk development yang lebih aman
- **Responsive Design**: UI yang responsif dan mobile-friendly
- **Indonesian Language**: Interface lengkap dalam Bahasa Indonesia
- **Real-time Updates**: Update data secara real-time
- **Secure Authentication**: Sistem autentikasi yang aman dengan NextAuth.js
- **Database Modern**: PostgreSQL dengan Prisma ORM
- **Caching**: Redis untuk performa optimal
- **Testing**: Comprehensive testing dengan Jest dan React Testing Library

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework dengan App Router
- **TypeScript** - Type safety dan better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **React Hook Form** - Form handling dengan validasi
- **Zod** - Schema validation
- **Zustand** - State management
- **React Query** - Server state management

### Backend
- **Next.js API Routes** - Server-side API
- **tRPC** - Type-safe API layer
- **Prisma** - Modern database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching dan session storage
- **NextAuth.js** - Authentication

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Unit testing
- **Docker** - Containerization

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn
- Docker dan Docker Compose (untuk development)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd opensid-nextjs
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env.local
# Edit .env.local dengan konfigurasi yang sesuai
```

### 4. Start Development Services
```bash
# Start PostgreSQL, Redis, dan MinIO
npm run docker:dev
```

### 5. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed database dengan data sample
npm run db:seed
```

### 6. Start Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Project Structure

```
opensid-nextjs/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions dan configurations
│   ├── server/              # Server-side logic dan tRPC routers
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── prisma/                  # Database schema dan migrations
├── public/                  # Static assets
├── docker/                  # Docker configurations
└── tests/                   # Test files
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run database migrations
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database with sample data

# Docker
npm run docker:dev      # Start development services
npm run docker:down     # Stop development services
```

## 🐳 Docker Development

Project ini menggunakan Docker untuk development environment:

- **PostgreSQL** (port 5432) - Database utama
- **Redis** (port 6379) - Caching dan session storage  
- **MinIO** (port 9000/9001) - Object storage (S3 compatible)
- **Adminer** (port 8080) - Database management tool

## 📊 Database Management

Akses Adminer di `http://localhost:8080`:
- Server: `postgres`
- Username: `opensid`
- Password: `opensid123`
- Database: `opensid`

## 🔐 Authentication

Sistem menggunakan NextAuth.js dengan support untuk:
- Credentials (username/password)
- Role-based access control
- JWT tokens
- Session management

## 📝 API Documentation

API documentation akan tersedia di `/api/docs` setelah development server berjalan.

## 🌍 Internationalization

Aplikasi ini menggunakan Bahasa Indonesia sebagai bahasa utama dengan dukungan untuk:
- Menu navigasi dalam Bahasa Indonesia
- Pesan error dan validasi dalam Bahasa Indonesia
- Format tanggal dan mata uang Indonesia
- Dokumentasi dalam Bahasa Indonesia

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Project ini menggunakan lisensi GPL-3.0. Lihat file `LICENSE` untuk detail lengkap.

## 🆘 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Check dokumentasi di repository
2. Search existing issues di GitHub
3. Create new issue dengan detail yang lengkap
4. Join komunitas OpenSID di Facebook atau Telegram

## 🙏 Acknowledgments

- Tim OpenSID original untuk foundation yang solid
- Komunitas Next.js untuk framework yang luar biasa
- Kontributor open source yang membuat project ini possible

---

**OpenSID Next.js** - Sistem Informasi Desa Modern untuk Indonesia 🇮🇩