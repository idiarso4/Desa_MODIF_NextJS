/**
 * Additional Database Constraints and Indexes
 * This file contains additional constraints and indexes that should be applied
 * to optimize database performance for the OpenSID system.
 */

export const additionalConstraints = {
  // Composite indexes for better query performance
  compositeIndexes: [
    // Citizen search optimization
    {
      table: 'citizens',
      name: 'idx_citizen_search',
      columns: ['name', 'nik', 'family_id'],
    },
    {
      table: 'citizens',
      name: 'idx_citizen_location',
      columns: ['address_id', 'rt', 'rw'],
    },
    
    // Letter request optimization
    {
      table: 'letter_requests',
      name: 'idx_letter_request_processing',
      columns: ['status', 'letter_type', 'requested_at'],
    },
    
    // Financial data optimization
    {
      table: 'expenses',
      name: 'idx_expense_budget_date',
      columns: ['budget_id', 'date', 'amount'],
    },
    
    // Activity logging optimization
    {
      table: 'activity_logs',
      name: 'idx_activity_user_action',
      columns: ['user_id', 'action', 'created_at'],
    },
    
    // Statistics optimization
    {
      table: 'statistics',
      name: 'idx_statistics_type_date',
      columns: ['type', 'date', 'value'],
    },
  ],

  // Check constraints for data validation
  checkConstraints: [
    // NIK validation (must be 16 digits)
    {
      table: 'citizens',
      name: 'chk_citizen_nik_length',
      condition: 'LENGTH(nik) = 16 AND nik ~ \'^[0-9]+$\'',
    },
    
    // Birth date validation (must be in the past)
    {
      table: 'citizens',
      name: 'chk_citizen_birth_date',
      condition: 'birth_date <= CURRENT_DATE',
    },
    
    // Budget validation (amount must be positive)
    {
      table: 'budgets',
      name: 'chk_budget_amount_positive',
      condition: 'amount > 0',
    },
    
    // Expense validation (amount must be positive and not exceed budget)
    {
      table: 'expenses',
      name: 'chk_expense_amount_positive',
      condition: 'amount > 0',
    },
    
    // Family number format validation
    {
      table: 'families',
      name: 'chk_family_number_format',
      condition: 'LENGTH(family_number) >= 5',
    },
    
    // Phone number validation
    {
      table: 'village_config',
      name: 'chk_village_phone_format',
      condition: 'phone IS NULL OR phone ~ \'^[0-9+\\-\\s()]+$\'',
    },
  ],

  // Unique constraints for business rules
  uniqueConstraints: [
    // One head of family per family
    {
      table: 'citizens',
      name: 'unq_one_head_per_family',
      columns: ['family_id'],
      condition: 'is_head_of_family = true',
    },
    
    // Unique NIK across all citizens
    {
      table: 'citizens',
      name: 'unq_citizen_nik',
      columns: ['nik'],
    },
    
    // Unique family number
    {
      table: 'families',
      name: 'unq_family_number',
      columns: ['family_number'],
    },
  ],

  // Foreign key constraints with proper cascading
  foreignKeyConstraints: [
    // Citizen to family relationship
    {
      table: 'citizens',
      column: 'family_id',
      references: {
        table: 'families',
        column: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    
    // Document to citizen relationship
    {
      table: 'documents',
      column: 'citizen_id',
      references: {
        table: 'citizens',
        column: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    
    // Letter request to citizen relationship
    {
      table: 'letter_requests',
      column: 'citizen_id',
      references: {
        table: 'citizens',
        column: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  ],
};

/**
 * SQL statements to create additional constraints
 */
export const constraintSQL = {
  // Create composite indexes
  createCompositeIndexes: additionalConstraints.compositeIndexes.map(
    (index) => `
    CREATE INDEX IF NOT EXISTS ${index.name} 
    ON ${index.table} (${index.columns.join(', ')});
  `
  ),

  // Create check constraints
  createCheckConstraints: additionalConstraints.checkConstraints.map(
    (constraint) => `
    ALTER TABLE ${constraint.table} 
    ADD CONSTRAINT ${constraint.name} 
    CHECK (${constraint.condition});
  `
  ),

  // Create unique constraints with conditions
  createUniqueConstraints: additionalConstraints.uniqueConstraints
    .filter((constraint) => constraint.condition)
    .map(
      (constraint) => `
    CREATE UNIQUE INDEX ${constraint.name} 
    ON ${constraint.table} (${constraint.columns.join(', ')}) 
    WHERE ${constraint.condition};
  `
    ),
};

/**
 * Performance optimization queries
 */
export const performanceOptimizations = {
  // Analyze table statistics
  analyzeQueries: [
    'ANALYZE citizens;',
    'ANALYZE families;',
    'ANALYZE letter_requests;',
    'ANALYZE documents;',
    'ANALYZE expenses;',
    'ANALYZE budgets;',
    'ANALYZE activity_logs;',
    'ANALYZE statistics;',
  ],

  // Vacuum tables for better performance
  vacuumQueries: [
    'VACUUM ANALYZE citizens;',
    'VACUUM ANALYZE families;',
    'VACUUM ANALYZE letter_requests;',
    'VACUUM ANALYZE activity_logs;',
  ],

  // Create partial indexes for common queries
  partialIndexes: [
    // Index only active users
    'CREATE INDEX IF NOT EXISTS idx_users_active ON users (id, username) WHERE is_active = true;',
    
    // Index only pending letter requests
    'CREATE INDEX IF NOT EXISTS idx_letter_requests_pending ON letter_requests (citizen_id, requested_at) WHERE status = \'PENDING\';',
    
    // Index only published articles
    'CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published_at, title) WHERE published = true;',
    
    // Index only active aid programs
    'CREATE INDEX IF NOT EXISTS idx_aid_programs_active ON aid_programs (start_date, end_date) WHERE status = \'ACTIVE\';',
  ],
};

/**
 * Database maintenance functions
 */
export const maintenanceFunctions = {
  // Function to update citizen statistics
  updateCitizenStats: `
    CREATE OR REPLACE FUNCTION update_citizen_statistics()
    RETURNS void AS $$
    BEGIN
      -- Update population statistics
      INSERT INTO statistics (type, label, value, date)
      VALUES 
        ('population', 'total_citizens', (SELECT COUNT(*) FROM citizens), CURRENT_DATE),
        ('population', 'total_families', (SELECT COUNT(*) FROM families), CURRENT_DATE),
        ('population', 'male_citizens', (SELECT COUNT(*) FROM citizens WHERE gender = 'L'), CURRENT_DATE),
        ('population', 'female_citizens', (SELECT COUNT(*) FROM citizens WHERE gender = 'P'), CURRENT_DATE)
      ON CONFLICT (type, label, date) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        created_at = CURRENT_TIMESTAMP;
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Function to cleanup old activity logs
  cleanupActivityLogs: `
    CREATE OR REPLACE FUNCTION cleanup_old_activity_logs(retention_days INTEGER DEFAULT 365)
    RETURNS INTEGER AS $$
    DECLARE
      deleted_count INTEGER;
    BEGIN
      DELETE FROM activity_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * retention_days;
      
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RETURN deleted_count;
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Function to validate data integrity
  validateDataIntegrity: `
    CREATE OR REPLACE FUNCTION validate_data_integrity()
    RETURNS TABLE(table_name TEXT, issue_description TEXT, affected_count BIGINT) AS $$
    BEGIN
      -- Check for citizens without valid NIK
      RETURN QUERY
      SELECT 'citizens'::TEXT, 'Invalid NIK format'::TEXT, COUNT(*)
      FROM citizens 
      WHERE LENGTH(nik) != 16 OR nik !~ '^[0-9]+$';
      
      -- Check for families without head of family
      RETURN QUERY
      SELECT 'families'::TEXT, 'No head of family'::TEXT, COUNT(*)
      FROM families f
      WHERE NOT EXISTS (
        SELECT 1 FROM citizens c 
        WHERE c.family_id = f.id AND c.is_head_of_family = true
      );
      
      -- Check for orphaned documents
      RETURN QUERY
      SELECT 'documents'::TEXT, 'Orphaned documents'::TEXT, COUNT(*)
      FROM documents d
      WHERE d.citizen_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM citizens c WHERE c.id = d.citizen_id);
    END;
    $$ LANGUAGE plpgsql;
  `,
};