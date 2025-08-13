/**
 * Create Citizen Page
 * Form for adding new citizen
 */

import { requireServerPermission } from '@/lib/rbac/server-utils'
import { MainLayout } from '@/components/layout/main-layout'
import { CreateCitizenForm } from './create-citizen-form'

export default async function CreateCitizenPage() {
  // Require citizen create permission
  await requireServerPermission('citizens', 'create')

  return (
    <MainLayout title="Tambah Penduduk">
      <CreateCitizenForm />
    </MainLayout>
  )
}