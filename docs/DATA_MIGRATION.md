# Data Migration Guide

This guide explains how to migrate data from the legacy MySQL OpenSID system to the new PostgreSQL-based OpenSID Next.js application.

## Overview

The migration process involves:
1. **Data Extraction**: Reading data from MySQL OpenSID database
2. **Data Transformation**: Converting MySQL data format to PostgreSQL format
3. **Data Loading**: Inserting transformed data into PostgreSQL database
4. **Validation**: Ensuring data integrity and completeness
5. **Backup & Rollback**: Safety mechanisms for migration

## Prerequisites

### System Requirements
- Node.js 18+ with npm
- PostgreSQL 15+ (target database)
- MySQL 5.7+ or 8.0+ (source database)
- Sufficient disk space for backups
- Network access to both databases

### Environment Setup

1. **Configure Environment Variables**

Create or update `.env.local` with both database connections:

```env
# PostgreSQL (Target Database)
DATABASE_URL="postgresql://username:password@localhost:5432/opensid_new"

# MySQL (Source Database)
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="opensid_user"
MYSQL_PASSWORD="opensid_password"
MYSQL_DATABASE="opensid"
```

2. **Install Dependencies**

```bash
npm install
npm install mysql2  # MySQL client for migration
```

3. **Test Database Connections**

```bash
# Test PostgreSQL connection
npm run db:generate
npm run db:push

# Test MySQL connection (will be tested during migration)
```

## Migration Process

### Step 1: Create Backup

**Always create a backup before migration:**

```bash
# Create a full backup
npm run backup create "Pre-migration backup"

# List available backups
npm run backup list
```

### Step 2: Prepare Target Database

```bash
# Set up PostgreSQL database with schema and constraints
npm run db:setup

# Verify database setup
npm run db:studio
```

### Step 3: Run Migration

**Basic Migration:**
```bash
npm run migrate
```

**Advanced Migration Options:**
```bash
# Custom batch size (default: 1000)
npm run migrate -- --batch-size 500

# Skip data validation (faster but less safe)
npm run migrate -- --no-validate

# Skip backup creation
npm run migrate -- --no-backup

# Skip existing records (useful for re-running migration)
npm run migrate -- --skip-existing

# Force migration without confirmation
npm run migrate -- --force

# Combine options
npm run migrate -- --batch-size 2000 --skip-existing --force
```

### Step 4: Verify Migration

The migration process automatically validates data integrity. You can also run manual verification:

```bash
# Check migration logs
cat logs/migration-report-*.json

# Verify data in Prisma Studio
npm run db:studio

# Run database integrity checks
npm run db:validate
```

## Migration Mapping

### Table Mapping

| MySQL Table | PostgreSQL Table | Description |
|-------------|------------------|-------------|
| `user` | `users` | System users |
| `user_grup` | `user_roles` | User roles |
| `tweb_penduduk` | `citizens` | Citizens/residents |
| `tweb_keluarga` | `families` | Family records |
| `tweb_wil_clusterdesa` | `addresses` | Address information |
| `dokumen` | `documents` | Document attachments |
| `permohonan_surat` | `letter_requests` | Letter requests |
| `artikel` | `articles` | News articles |
| `kategori` | `categories` | Content categories |
| `config` | `village_config` | Village configuration |
| `setting_aplikasi` | `settings` | Application settings |

### Data Transformation

#### User Data
- **Username**: Direct mapping
- **Password**: Preserved (already hashed)
- **Email**: Generated if missing (`username@example.com`)
- **Role**: Mapped from `id_grup` to role names
- **Status**: `active` field mapped to `isActive`

#### Citizen Data
- **NIK**: Padded to 16 digits with leading zeros
- **Gender**: `1` → `L` (Laki-laki), `2` → `P` (Perempuan)
- **Religion**: ID mapped to enum values
- **Education**: ID mapped to education levels
- **Marital Status**: ID mapped to marital status enum
- **Blood Type**: ID mapped to blood type enum
- **Family Head**: `kk_level = 1` → `isHeadOfFamily = true`

#### Family Data
- **Family Number**: Direct mapping from `no_kk`
- **Social Status**: ID mapped to social status enum
- **Address**: Linked to address records

### Enum Mappings

#### Gender
```
MySQL: 1 → PostgreSQL: L (Laki-laki)
MySQL: 2 → PostgreSQL: P (Perempuan)
```

#### Religion
```
1 → ISLAM
2 → KRISTEN
3 → KATOLIK
4 → HINDU
5 → BUDDHA
6 → KONGHUCU
```

#### Education
```
1 → TIDAK_SEKOLAH
2 → SD
3 → SMP
4 → SMA
5 → D1
6 → D2
7 → D3
8 → S1
9 → S2
10 → S3
```

#### Marital Status
```
1 → BELUM_KAWIN
2 → KAWIN
3 → CERAI_HIDUP
4 → CERAI_MATI
```

#### Blood Type
```
1 → A
2 → B
3 → AB
4 → O
```

## Data Validation

The migration process includes several validation steps:

### Pre-Migration Validation
- Database connectivity tests
- Schema compatibility checks
- Required field validation

### During Migration Validation
- NIK format validation (16 digits)
- Email format validation
- Date range validation
- Foreign key integrity
- Enum value validation

### Post-Migration Validation
- Record count verification
- Orphaned record detection
- Duplicate detection
- Referential integrity checks
- Business rule validation

## Backup and Recovery

### Creating Backups

```bash
# Full backup
npm run backup create "Description"

# Incremental backup (based on previous backup)
npm run backup incremental backup_2024-01-01T10-00-00-000Z
```

### Restoring Backups

```bash
# List available backups
npm run backup list

# Restore specific backup
npm run backup restore backup_2024-01-01T10-00-00-000Z
```

### Backup Management

```bash
# Delete old backup
npm run backup delete backup_2024-01-01T10-00-00-000Z
```

## Troubleshooting

### Common Issues

#### 1. Connection Errors
```
Error: MySQL connection failed
```
**Solution**: Check MySQL credentials and network connectivity
```bash
# Test MySQL connection manually
mysql -h localhost -u opensid_user -p opensid
```

#### 2. Data Validation Errors
```
Error: Invalid NIK format
```
**Solution**: Clean source data or use `--no-validate` flag
```bash
npm run migrate -- --no-validate
```

#### 3. Memory Issues with Large Datasets
```
Error: JavaScript heap out of memory
```
**Solution**: Reduce batch size
```bash
npm run migrate -- --batch-size 100
```

#### 4. Duplicate Key Errors
```
Error: Unique constraint violation
```
**Solution**: Use skip existing option
```bash
npm run migrate -- --skip-existing
```

### Performance Optimization

#### For Large Datasets (>100k records)
```bash
# Use smaller batch size and skip validation
npm run migrate -- --batch-size 500 --no-validate

# Run migration during off-peak hours
# Consider using database-specific optimizations
```

#### For Slow Networks
```bash
# Increase batch size to reduce round trips
npm run migrate -- --batch-size 5000
```

### Recovery Procedures

#### If Migration Fails Midway
1. **Check logs**: Review migration report for specific errors
2. **Fix issues**: Address data quality issues in source
3. **Resume migration**: Use `--skip-existing` to continue
4. **Full rollback**: Restore from backup if needed

```bash
# Resume failed migration
npm run migrate -- --skip-existing

# Or rollback and start over
npm run backup restore backup_pre_migration
npm run migrate
```

#### If Data Corruption is Detected
1. **Stop application**: Prevent further data corruption
2. **Restore backup**: Use most recent clean backup
3. **Investigate**: Check migration logs and source data
4. **Fix and retry**: Address root cause and re-migrate

## Migration Checklist

### Pre-Migration
- [ ] Source database accessible and backed up
- [ ] Target database set up with correct schema
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Test migration on sample data
- [ ] Full backup created

### During Migration
- [ ] Monitor migration progress
- [ ] Check for error messages
- [ ] Verify disk space availability
- [ ] Monitor system resources

### Post-Migration
- [ ] Verify record counts match
- [ ] Test application functionality
- [ ] Run data integrity checks
- [ ] Update application configuration
- [ ] Train users on new system
- [ ] Monitor system performance

## Best Practices

### Before Migration
1. **Test on staging**: Always test migration on a copy first
2. **Clean source data**: Fix data quality issues beforehand
3. **Plan downtime**: Schedule migration during low-usage periods
4. **Communicate**: Inform users about the migration schedule

### During Migration
1. **Monitor progress**: Watch logs and system resources
2. **Be patient**: Large datasets take time to migrate
3. **Don't interrupt**: Let the process complete naturally
4. **Keep backups**: Maintain multiple backup points

### After Migration
1. **Validate thoroughly**: Check data integrity and completeness
2. **Test functionality**: Verify all features work correctly
3. **Monitor performance**: Watch for any performance issues
4. **Keep old system**: Maintain read-only access for reference

## Support and Resources

### Log Files
- Migration reports: `logs/migration-report-*.json`
- Application logs: Check console output
- Database logs: PostgreSQL and MySQL logs

### Useful Commands
```bash
# Check migration status
npm run migrate -- --help

# Database operations
npm run db:studio     # Visual database browser
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Push schema changes

# Backup operations
npm run backup list   # List all backups
npm run backup create # Create new backup
```

### Getting Help
1. Check this documentation
2. Review migration logs
3. Test on smaller dataset
4. Consult database documentation
5. Contact system administrator

This migration system is designed to be safe, reliable, and recoverable. Always test thoroughly before running on production data.