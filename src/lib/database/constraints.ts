/**
 * Database Constraints and Validation
 * Additional database-level constraints and validation rules
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Create additional database constraints for data integrity
 */
export async function createDatabaseConstraints() {
  try {
    // NIK validation constraint (must be exactly 16 digits)
    await prisma.$executeRaw`
      ALTER TABLE citizens 
      ADD CONSTRAINT IF NOT EXISTS chk_nik_format 
      CHECK (nik ~ '^[0-9]{16}$');
    `

    // Email format validation
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD CONSTRAINT IF NOT EXISTS chk_email_format 
      CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    `

    // Phone number format validation (Indonesian format)
    await prisma.$executeRaw`
      ALTER TABLE village_config 
      ADD CONSTRAINT IF NOT EXISTS chk_phone_format 
      CHECK (phone IS NULL OR phone ~ '^(\+62|62|0)[0-9]{8,13}$');
    `

    // Birth date validation (not in the future, not too old)
    await prisma.$executeRaw`
      ALTER TABLE citizens 
      ADD CONSTRAINT IF NOT EXISTS chk_birth_date 
      CHECK (birth_date <= CURRENT_DATE AND birth_date >= '1900-01-01');
    `

    // Budget amount validation (must be positive)
    await prisma.$executeRaw`
      ALTER TABLE budgets 
      ADD CONSTRAINT IF NOT EXISTS chk_budget_amount_positive 
      CHECK (amount > 0);
    `

    // Expense amount validation (must be positive)
    await prisma.$executeRaw`
      ALTER TABLE expenses 
      ADD CONSTRAINT IF NOT EXISTS chk_expense_amount_positive 
      CHECK (amount > 0);
    `

    // Family number format validation
    await prisma.$executeRaw`
      ALTER TABLE families 
      ADD CONSTRAINT IF NOT EXISTS chk_family_number_format 
      CHECK (family_number ~ '^[0-9]{1,20}$');
    `

    // RT/RW format validation (numeric)
    await prisma.$executeRaw`
      ALTER TABLE addresses 
      ADD CONSTRAINT IF NOT EXISTS chk_rt_rw_format 
      CHECK (rt ~ '^[0-9]{1,3}$' AND rw ~ '^[0-9]{1,3}$');
    `

    // Postal code format validation (Indonesian format)
    await prisma.$executeRaw`
      ALTER TABLE addresses 
      ADD CONSTRAINT IF NOT EXISTS chk_postal_code_format 
      CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{5}$');
    `

    // Village code format validation
    await prisma.$executeRaw`
      ALTER TABLE village_config 
      ADD CONSTRAINT IF NOT EXISTS chk_village_code_format 
      CHECK (code ~ '^[0-9]{10,13}$');
    `

    // Ensure only one head of family per family
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_one_head_per_family 
      ON citizens (family_id) 
      WHERE is_head_of_family = true;
    `

    // Ensure username is not empty
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD CONSTRAINT IF NOT EXISTS chk_username_not_empty 
      CHECK (LENGTH(TRIM(username)) > 0);
    `

    // Ensure citizen name is not empty
    await prisma.$executeRaw`
      ALTER TABLE citizens 
      ADD CONSTRAINT IF NOT EXISTS chk_citizen_name_not_empty 
      CHECK (LENGTH(TRIM(name)) > 0);
    `

    console.log('✅ Database constraints created successfully')
  } catch (error) {
    console.error('❌ Error creating database constraints:', error)
    throw error
  }
}

/**
 * Create database triggers for automatic data management
 */
export async function createDatabaseTriggers() {
  try {
    // Trigger to automatically update family remaining budget
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_budget_remaining()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE budgets 
        SET 
          spent = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE budget_id = NEW.budget_id
          ),
          remaining = amount - (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE budget_id = NEW.budget_id
          )
        WHERE id = NEW.budget_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS trigger_update_budget_remaining ON expenses;
      CREATE TRIGGER trigger_update_budget_remaining
        AFTER INSERT OR UPDATE OR DELETE ON expenses
        FOR EACH ROW
        EXECUTE FUNCTION update_budget_remaining();
    `

    // Trigger to automatically log user activities
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION log_user_activity()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO activity_logs (user_id, action, resource, resource_id, description, created_at)
        VALUES (
          COALESCE(NEW.created_by_id, NEW.user_id),
          TG_OP,
          TG_TABLE_NAME,
          NEW.id,
          'Automatic log for ' || TG_OP || ' on ' || TG_TABLE_NAME,
          NOW()
        );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Apply activity logging to important tables
    const tables = ['citizens', 'letter_requests', 'expenses', 'aid_recipients']
    for (const table of tables) {
      await prisma.$executeRaw`
        DROP TRIGGER IF EXISTS trigger_log_activity ON ${table};
        CREATE TRIGGER trigger_log_activity
          AFTER INSERT OR UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION log_user_activity();
      `
    }

    // Trigger to update statistics automatically
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_population_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update monthly population statistics
        INSERT INTO population_statistics (
          year, month, total_male, total_female, total_families
        )
        VALUES (
          EXTRACT(YEAR FROM NOW()),
          EXTRACT(MONTH FROM NOW()),
          (SELECT COUNT(*) FROM citizens WHERE gender = 'L'),
          (SELECT COUNT(*) FROM citizens WHERE gender = 'P'),
          (SELECT COUNT(*) FROM families)
        )
        ON CONFLICT (year, month) 
        DO UPDATE SET
          total_male = (SELECT COUNT(*) FROM citizens WHERE gender = 'L'),
          total_female = (SELECT COUNT(*) FROM citizens WHERE gender = 'P'),
          total_families = (SELECT COUNT(*) FROM families),
          updated_at = NOW();
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS trigger_update_population_stats ON citizens;
      CREATE TRIGGER trigger_update_population_stats
        AFTER INSERT OR UPDATE OR DELETE ON citizens
        FOR EACH STATEMENT
        EXECUTE FUNCTION update_population_stats();
    `

    console.log('✅ Database triggers created successfully')
  } catch (error) {
    console.error('❌ Error creating database triggers:', error)
    throw error
  }
}

/**
 * Validate data integrity across the database
 */
export async function validateDataIntegrity() {
  const issues = []

  try {
    // Check for orphaned records
    const orphanedCitizens = await prisma.$queryRaw`
      SELECT id, name FROM citizens 
      WHERE family_id IS NOT NULL 
        AND family_id NOT IN (SELECT id FROM families);
    `
    if (Array.isArray(orphanedCitizens) && orphanedCitizens.length > 0) {
      issues.push(`Found ${orphanedCitizens.length} citizens with invalid family references`)
    }

    // Check for duplicate NIKs
    const duplicateNiks = await prisma.$queryRaw`
      SELECT nik, COUNT(*) as count 
      FROM citizens 
      GROUP BY nik 
      HAVING COUNT(*) > 1;
    `
    if (Array.isArray(duplicateNiks) && duplicateNiks.length > 0) {
      issues.push(`Found ${duplicateNiks.length} duplicate NIK entries`)
    }

    // Check for families without head
    const familiesWithoutHead = await prisma.$queryRaw`
      SELECT f.id, f.family_number 
      FROM families f 
      LEFT JOIN citizens c ON f.id = c.family_id AND c.is_head_of_family = true 
      WHERE c.id IS NULL;
    `
    if (Array.isArray(familiesWithoutHead) && familiesWithoutHead.length > 0) {
      issues.push(`Found ${familiesWithoutHead.length} families without a head of family`)
    }

    // Check for budget overruns
    const budgetOverruns = await prisma.$queryRaw`
      SELECT b.id, b.category, b.amount, SUM(e.amount) as spent
      FROM budgets b
      LEFT JOIN expenses e ON b.id = e.budget_id
      GROUP BY b.id, b.category, b.amount
      HAVING SUM(e.amount) > b.amount;
    `
    if (Array.isArray(budgetOverruns) && budgetOverruns.length > 0) {
      issues.push(`Found ${budgetOverruns.length} budgets with overruns`)
    }

    return issues
  } catch (error) {
    console.error('❌ Error validating data integrity:', error)
    return [`Error during validation: ${error.message}`]
  }
}

export { prisma }