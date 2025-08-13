import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { resource_action: { resource: 'citizens', action: 'read' } },
      update: {},
      create: {
        name: 'Lihat Data Penduduk',
        resource: 'citizens',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'citizens', action: 'write' } },
      update: {},
      create: {
        name: 'Kelola Data Penduduk',
        resource: 'citizens',
        action: 'write',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'letters', action: 'read' } },
      update: {},
      create: {
        name: 'Lihat Surat',
        resource: 'letters',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'letters', action: 'write' } },
      update: {},
      create: {
        name: 'Kelola Surat',
        resource: 'letters',
        action: 'write',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'reports', action: 'read' } },
      update: {},
      create: {
        name: 'Lihat Laporan',
        resource: 'reports',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'write' } },
      update: {},
      create: {
        name: 'Administrasi Sistem',
        resource: 'admin',
        action: 'write',
      },
    }),
  ])

  // Create default roles
  const adminRole = await prisma.userRole.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Administrator sistem dengan akses penuh',
      permissions: {
        connect: permissions.map(p => ({ id: p.id })),
      },
    },
  })

  const operatorRole = await prisma.userRole.upsert({
    where: { name: 'Operator' },
    update: {},
    create: {
      name: 'Operator',
      description: 'Operator desa untuk mengelola data penduduk dan surat',
      permissions: {
        connect: permissions.filter(p => p.resource !== 'admin').map(p => ({ id: p.id })),
      },
    },
  })

  const viewerRole = await prisma.userRole.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Hanya dapat melihat data',
      permissions: {
        connect: permissions.filter(p => p.action === 'read').map(p => ({ id: p.id })),
      },
    },
  })

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@opensid.local',
      name: 'Administrator',
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  })

  // Create village configuration
  await prisma.villageConfig.upsert({
    where: { code: 'DESA001' },
    update: {},
    create: {
      name: 'Desa Contoh',
      code: 'DESA001',
      headName: 'Kepala Desa',
      address: 'Jl. Desa No. 1, Kecamatan Contoh, Kabupaten Contoh',
      phone: '021-12345678',
      email: 'desa@contoh.id',
      website: 'https://desa-contoh.id',
      description: 'Desa Contoh adalah desa yang menggunakan sistem OpenSID',
    },
  })

  // Create sample address
  const sampleAddress = await prisma.address.create({
    data: {
      street: 'Jl. Merdeka No. 123',
      rt: '001',
      rw: '002',
      village: 'Desa Contoh',
      district: 'Kecamatan Contoh',
      regency: 'Kabupaten Contoh',
      province: 'Provinsi Contoh',
      postalCode: '12345',
    },
  })

  // Create sample family
  const sampleFamily = await prisma.family.upsert({
    where: { familyNumber: 'KK001' },
    update: {},
    create: {
      familyNumber: 'KK001',
      socialStatus: 'MAMPU',
      addressId: sampleAddress.id,
    },
  })

  // Create sample citizen
  const sampleCitizen = await prisma.citizen.upsert({
    where: { nik: '1234567890123456' },
    update: {},
    create: {
      nik: '1234567890123456',
      name: 'John Doe',
      birthDate: new Date('1990-01-01'),
      birthPlace: 'Jakarta',
      gender: 'L',
      religion: 'ISLAM',
      education: 'S1',
      occupation: 'Pegawai Swasta',
      maritalStatus: 'KAWIN',
      bloodType: 'O',
      familyId: sampleFamily.id,
      isHeadOfFamily: true,
      addressId: sampleAddress.id,
      createdById: adminUser.id,
    },
  })

  // Create sample article category
  const newsCategory = await prisma.category.upsert({
    where: { name: 'Berita Desa' },
    update: {},
    create: {
      name: 'Berita Desa',
      slug: 'berita-desa',
      description: 'Berita dan informasi terkini dari desa',
    },
  })

  // Create sample article
  await prisma.article.upsert({
    where: { slug: 'selamat-datang-opensid-baru' },
    update: {},
    create: {
      title: 'Selamat Datang di OpenSID Baru',
      slug: 'selamat-datang-opensid-baru',
      content: 'Sistem OpenSID telah diperbarui dengan teknologi terbaru untuk memberikan pelayanan yang lebih baik kepada masyarakat desa.',
      excerpt: 'OpenSID telah diperbarui dengan teknologi Next.js untuk performa yang lebih baik.',
      featured: true,
      published: true,
      publishedAt: new Date(),
      categoryId: newsCategory.id,
      authorId: adminUser.id,
      tags: ['teknologi', 'update', 'opensid'],
    },
  })

  // Create sample group category
  const groupCategory = await prisma.groupCategory.upsert({
    where: { name: 'Organisasi Masyarakat' },
    update: {},
    create: {
      name: 'Organisasi Masyarakat',
      description: 'Kelompok dan organisasi masyarakat desa',
    },
  })

  // Create sample group
  let sampleGroup = await prisma.group.findFirst({
    where: { name: 'Karang Taruna Desa Contoh' },
  })

  if (!sampleGroup) {
    sampleGroup = await prisma.group.create({
      data: {
        name: 'Karang Taruna Desa Contoh',
        description: 'Organisasi pemuda desa untuk pemberdayaan masyarakat',
        categoryId: groupCategory.id,
        leaderId: sampleCitizen.id,
      },
    })
  }

  // Add citizen as group member
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_citizenId: {
        groupId: sampleGroup.id,
        citizenId: sampleCitizen.id,
      },
    },
  })

  if (!existingMember) {
    await prisma.groupMember.create({
      data: {
        groupId: sampleGroup.id,
        citizenId: sampleCitizen.id,
        position: 'Ketua',
      },
    })
  }

  // Create sample budget
  const currentYear = new Date().getFullYear()
  await prisma.budget.upsert({
    where: {
      year_category_subcategory: {
        year: currentYear,
        category: 'Pembangunan',
        subcategory: 'Infrastruktur Jalan',
      },
    },
    update: {},
    create: {
      year: currentYear,
      category: 'Pembangunan',
      subcategory: 'Infrastruktur Jalan',
      description: 'Anggaran untuk perbaikan jalan desa',
      amount: 50000000,
      remaining: 50000000,
    },
  })

  // Create sample aid program
  const existingProgram = await prisma.aidProgram.findFirst({
    where: { name: 'Bantuan Langsung Tunai Desa' },
  })

  if (!existingProgram) {
    await prisma.aidProgram.create({
      data: {
        name: 'Bantuan Langsung Tunai Desa',
        description: 'Program bantuan langsung tunai untuk masyarakat kurang mampu',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        budget: 100000000,
        criteria: 'Keluarga dengan penghasilan di bawah UMR',
        createdById: adminUser.id,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Default admin user created:')
  console.log('   Username: admin')
  console.log('   Password: admin123')
  console.log('   Email: admin@opensid.local')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })