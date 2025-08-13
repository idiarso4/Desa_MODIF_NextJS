-- Initialize OpenSID database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database if it doesn't exist
SELECT 'CREATE DATABASE opensid'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'opensid')\gexec

-- Create a test database for running tests
SELECT 'CREATE DATABASE opensid_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'opensid_test')\gexec

-- Connect to the opensid database
\c opensid;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;

-- Connect to the test database and enable extensions there too
\c opensid_test;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;

-- Switch back to the main database
\c opensid;

-- Create initial admin user (will be handled by Prisma seed instead)
-- This is just a placeholder for any additional setup needed