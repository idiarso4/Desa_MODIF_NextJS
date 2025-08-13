# Database Setup Guide

## Manual Database Setup

Since you've created the database manually, here are the steps to complete the setup:

### 1. Verify Database Connection

First, make sure your PostgreSQL database is running and accessible:

```bash
# Test connection with psql
psql -h localhost -U postgres -d opensisd-next

# Or test with our script
npm run tsx scripts/init-db.ts
```

### 2. Update Connection String (if needed)

If your PostgreSQL is running on a different port or configuration, update `.env.local`:

```env
# Standard PostgreSQL port
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/opensisd-next"

# If using different port (example)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/opensisd-next"
```

### 3. Create Database Tables

Run Prisma migrations to create the database schema:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR create and run migrations (for production)
npm run db:migrate
```

### 4. Seed Database with Sample Data

```bash
npm run db:seed
```

This will create:
- Default admin user (username: `admin`, password: `admin123`)
- Sample village configuration
- Basic roles and permissions
- Sample citizen and family data

### 5. Verify Setup

```bash
# Check database connection
npm run tsx scripts/init-db.ts

# Start the application
npm run dev
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Or check services in Task Manager
   ```

2. **Verify database exists:**
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- List databases
   \l
   
   -- Create database if it doesn't exist
   CREATE DATABASE "opensisd-next";
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE "opensisd-next" TO postgres;
   ```

3. **Check connection details:**
   - Host: `localhost`
   - Port: `5432` (default) or your custom port
   - Username: `postgres`
   - Password: `postgres`
   - Database: `opensisd-next`

### Port Issues

If PostgreSQL is running on a different port:

1. **Find the correct port:**
   ```bash
   # Check PostgreSQL configuration
   psql -U postgres -c "SHOW port;"
   
   # Or check pg_hba.conf and postgresql.conf files
   ```

2. **Update .env.local with correct port:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:YOUR_PORT/opensisd-next"
   ```

### Permission Issues

If you get permission errors:

```sql
-- Connect as superuser
psql -U postgres

-- Create user if needed
CREATE USER opensid WITH PASSWORD 'opensid123';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE "opensisd-next" TO opensid;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO opensid;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO opensid;

-- Update .env.local
-- DATABASE_URL="postgresql://opensid:opensid123@localhost:5432/opensisd-next"
```

## Alternative Setup Methods

### Using Docker (Recommended for Development)

If you prefer to use Docker for PostgreSQL:

```bash
# Start PostgreSQL with Docker
npm run docker:dev

# This will start:
# - PostgreSQL on port 5432
# - Redis on port 6379
# - MinIO on ports 9000/9001
# - Adminer on port 8080

# Update .env.local to use Docker database
DATABASE_URL="postgresql://opensid:opensid123@localhost:5432/opensid"
```

### Using pgAdmin

1. Install pgAdmin
2. Connect to your PostgreSQL server
3. Create database `opensisd-next`
4. Run the Prisma migrations

## Next Steps

Once the database is set up:

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Main app: http://localhost:3000
   - Login page: http://localhost:3000/login
   - Public portal: http://localhost:3000/public

3. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin123`

4. **Access database management:**
   - Prisma Studio: `npm run db:studio`
   - Adminer (if using Docker): http://localhost:8080

## Database Schema Overview

The database includes these main tables:

- **users** - System users and authentication
- **user_roles** - User roles and permissions
- **citizens** - Citizen/resident data
- **families** - Family/household data
- **addresses** - Address information
- **documents** - Document storage metadata
- **letter_requests** - Letter/certificate requests
- **village_config** - Village configuration

All tables include proper relationships, indexes, and constraints for data integrity.