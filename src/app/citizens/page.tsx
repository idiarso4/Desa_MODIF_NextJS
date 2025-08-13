/**
 * Citizens Management Page
 * Main page for managing citizen data
 */

import { requireServerPermission } from '@/lib/rbac/server-utils'
import { MainLayout } from '@/components/layout/main-layout'
import { CitizenManagementClient } from './citizen-management-client'

export default async function CitizensPage() {
  // Require citizen read permission
  await requireServerPermission('citizens', 'read')

  return (
    <MainLayout title="Manajemen Penduduk">
      <CitizenManagementClient />
    </MainLayout>
  )
}