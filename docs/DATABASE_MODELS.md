# Database Models Documentation

This document describes all database models used in the OpenSID Next.js application.

## Core Models

### User Management

#### User
Represents system users (administrators, operators, etc.)

**Fields:**
- `id`: Unique identifier
- `username`: Unique username (max 50 chars)
- `email`: Unique email address (max 100 chars)
- `name`: Full name (max 100 chars)
- `password`: Hashed password
- `roleId`: Reference to UserRole
- `isActive`: Account status
- `lastLogin`: Last login timestamp

**Relations:**
- `role`: Many-to-one with UserRole
- `createdCitizens`: One-to-many with Citizen
- `processedRequests`: One-to-many with LetterRequest
- `apparatus`: One-to-one with VillageApparatus

#### UserRole
Defines user roles and permissions

**Fields:**
- `id`: Unique identifier
- `name`: Role name (max 50 chars, unique)
- `description`: Role description

**Relations:**
- `permissions`: Many-to-many with Permission
- `users`: One-to-many with User

#### Permission
Defines system permissions

**Fields:**
- `id`: Unique identifier
- `name`: Permission name (max 100 chars)
- `resource`: Resource type (max 50 chars)
- `action`: Action type (max 50 chars)

**Relations:**
- `roles`: Many-to-many with UserRole

### Village Configuration

#### VillageConfig
Stores village/desa configuration and information

**Fields:**
- `id`: Unique identifier
- `name`: Village name (max 100 chars)
- `code`: Unique village code (max 20 chars)
- `headName`: Village head name (max 100 chars)
- `address`: Village address
- `phone`: Contact phone (max 20 chars)
- `email`: Contact email (max 100 chars)
- `website`: Village website URL
- `logo`: Logo file path
- `description`: Village description
- `latitude/longitude`: Geographic coordinates
- `area`: Village area in hectares
- `altitude`: Altitude in meters
- `districtCode/regencyCode/provinceCode`: Administrative codes

#### Setting
Application settings and configuration

**Fields:**
- `id`: Unique identifier
- `key`: Setting key (unique)
- `value`: Setting value
- `type`: Value type (STRING, NUMBER, BOOLEAN, JSON)
- `category`: Setting category
- `description`: Setting description
- `isPublic`: Whether setting is publicly accessible

### Citizen Management

#### Citizen
Core model for village residents

**Fields:**
- `id`: Unique identifier
- `nik`: National ID number (16 digits, unique)
- `name`: Full name (max 100 chars)
- `birthDate`: Date of birth
- `birthPlace`: Place of birth (max 100 chars)
- `gender`: Gender (L/P)
- `religion`: Religion enum
- `education`: Education level enum
- `occupation`: Occupation (max 100 chars)
- `maritalStatus`: Marital status enum
- `bloodType`: Blood type enum (optional)
- `addressId`: Reference to Address
- `familyId`: Reference to Family
- `isHeadOfFamily`: Whether this person is head of family
- `latitude/longitude`: Geographic coordinates
- `createdById`: Reference to User who created the record

**Relations:**
- `address`: Many-to-one with Address
- `family`: Many-to-one with Family
- `documents`: One-to-many with Document
- `letterRequests`: One-to-many with LetterRequest
- `groupMemberships`: One-to-many with GroupMember
- `aidRecipients`: One-to-many with AidRecipient

#### Family
Family/household information

**Fields:**
- `id`: Unique identifier
- `familyNumber`: Unique family number (max 20 chars)
- `socialStatus`: Social/economic status enum
- `addressId`: Reference to Address

**Relations:**
- `members`: One-to-many with Citizen
- `address`: Many-to-one with Address

#### Address
Address information for citizens and families

**Fields:**
- `id`: Unique identifier
- `street`: Street address (max 255 chars)
- `rt`: RT number (max 5 chars)
- `rw`: RW number (max 5 chars)
- `village`: Village name (max 100 chars)
- `district`: District name (max 100 chars)
- `regency`: Regency name (max 100 chars)
- `province`: Province name (max 100 chars)
- `postalCode`: Postal code (max 10 chars)

**Relations:**
- `citizens`: One-to-many with Citizen
- `families`: One-to-many with Family

### Document Management

#### Document
File attachments and documents

**Fields:**
- `id`: Unique identifier
- `name`: Document name
- `type`: Document type enum
- `url`: File URL/path
- `size`: File size in bytes
- `mimeType`: MIME type
- `citizenId`: Reference to Citizen (optional)
- `letterRequestId`: Reference to LetterRequest (optional)
- `uploadedById`: Reference to User who uploaded

#### LetterRequest
Requests for official letters/certificates

**Fields:**
- `id`: Unique identifier
- `citizenId`: Reference to Citizen
- `letterType`: Type of letter enum
- `purpose`: Purpose of the letter
- `status`: Request status enum
- `notes`: Additional notes
- `processedById`: Reference to User who processed
- `processedAt`: Processing timestamp

**Relations:**
- `citizen`: Many-to-one with Citizen
- `documents`: One-to-many with Document
- `generatedLetter`: One-to-one with GeneratedLetter

#### LetterTemplate
Templates for generating letters

**Fields:**
- `id`: Unique identifier
- `name`: Template name
- `letterType`: Letter type enum
- `template`: HTML template with placeholders
- `variables`: Available variables (JSON)
- `isActive`: Template status

#### GeneratedLetter
Generated letters/certificates

**Fields:**
- `id`: Unique identifier
- `letterRequestId`: Reference to LetterRequest
- `letterNumber`: Unique letter number
- `content`: Generated content
- `pdfUrl`: PDF file URL
- `signedAt`: Digital signature timestamp
- `signedBy`: Signer information

### Content Management

#### Article
News articles and announcements

**Fields:**
- `id`: Unique identifier
- `title`: Article title
- `slug`: URL slug (unique)
- `content`: Article content
- `excerpt`: Article excerpt
- `featured`: Whether article is featured
- `published`: Publication status
- `publishedAt`: Publication timestamp
- `categoryId`: Reference to Category
- `authorId`: Reference to User
- `tags`: Article tags (array)
- `viewCount`: View counter

#### Category
Content categories

**Fields:**
- `id`: Unique identifier
- `name`: Category name (unique)
- `slug`: URL slug (unique)
- `description`: Category description

#### Gallery
Image gallery management

**Fields:**
- `id`: Unique identifier
- `title`: Image title
- `description`: Image description
- `imageUrl`: Image URL
- `albumId`: Reference to Album
- `uploadedById`: Reference to User

#### Album
Photo albums

**Fields:**
- `id`: Unique identifier
- `name`: Album name
- `description`: Album description
- `coverImage`: Cover image URL

### Organization Management

#### Group
Village groups/organizations

**Fields:**
- `id`: Unique identifier
- `name`: Group name
- `description`: Group description
- `categoryId`: Reference to GroupCategory
- `leaderId`: Reference to Citizen (leader)
- `isActive`: Group status

#### GroupCategory
Categories for groups

**Fields:**
- `id`: Unique identifier
- `name`: Category name (unique)
- `description`: Category description

#### GroupMember
Group membership

**Fields:**
- `id`: Unique identifier
- `groupId`: Reference to Group
- `citizenId`: Reference to Citizen
- `position`: Member position
- `joinedAt`: Join date
- `leftAt`: Leave date (optional)
- `isActive`: Membership status

### Financial Management

#### Budget
Budget planning and allocation

**Fields:**
- `id`: Unique identifier
- `year`: Budget year
- `category`: Budget category
- `subcategory`: Budget subcategory
- `description`: Budget description
- `amount`: Allocated amount
- `spent`: Spent amount
- `remaining`: Remaining amount

#### Expense
Expense records

**Fields:**
- `id`: Unique identifier
- `budgetId`: Reference to Budget
- `description`: Expense description
- `amount`: Expense amount
- `date`: Expense date
- `receipt`: Receipt file URL
- `approvedBy`: Reference to User (approver)
- `createdById`: Reference to User (creator)

#### AidProgram
Social aid programs

**Fields:**
- `id`: Unique identifier
- `name`: Program name
- `description`: Program description
- `startDate`: Program start date
- `endDate`: Program end date
- `budget`: Program budget
- `criteria`: Eligibility criteria
- `status`: Program status enum
- `createdById`: Reference to User

#### AidRecipient
Aid program recipients

**Fields:**
- `id`: Unique identifier
- `programId`: Reference to AidProgram
- `citizenId`: Reference to Citizen
- `amount`: Aid amount
- `receivedAt`: Receipt date
- `status`: Recipient status enum
- `notes`: Additional notes

### Village Administration

#### VillageApparatus
Village staff/apparatus

**Fields:**
- `id`: Unique identifier
- `name`: Staff name (max 100 chars)
- `position`: Position/title (max 100 chars)
- `nip`: Employee ID (max 20 chars, unique)
- `nik`: National ID (max 16 chars, unique)
- `phone`: Contact phone (max 20 chars)
- `email`: Contact email (max 100 chars)
- `address`: Home address
- `startDate`: Start date
- `endDate`: End date (optional)
- `isActive`: Employment status
- `photo`: Photo URL
- `userId`: Reference to User (optional)

#### VillageRegulation
Village regulations and laws

**Fields:**
- `id`: Unique identifier
- `number`: Regulation number (max 50 chars, unique)
- `title`: Regulation title (max 255 chars)
- `type`: Regulation type enum
- `content`: Regulation content
- `status`: Regulation status enum
- `enactedDate`: Enactment date
- `effectiveDate`: Effective date
- `revokedDate`: Revocation date
- `documentUrl`: Document file URL

#### VillageMeeting
Village meetings and assemblies

**Fields:**
- `id`: Unique identifier
- `title`: Meeting title (max 255 chars)
- `description`: Meeting description
- `type`: Meeting type enum
- `date`: Meeting date
- `location`: Meeting location (max 255 chars)
- `agenda`: Meeting agenda
- `minutes`: Meeting minutes
- `attendees`: Attendee information (JSON)
- `status`: Meeting status enum

#### VillageAsset
Village assets and infrastructure

**Fields:**
- `id`: Unique identifier
- `name`: Asset name (max 255 chars)
- `description`: Asset description
- `category`: Asset category enum
- `location`: Asset location (max 255 chars)
- `condition`: Asset condition enum
- `value`: Asset value
- `purchaseDate`: Purchase date
- `lastMaintenance`: Last maintenance date
- `nextMaintenance`: Next maintenance date
- `latitude/longitude`: Geographic coordinates

#### VillageEvent
Village events and activities

**Fields:**
- `id`: Unique identifier
- `title`: Event title (max 255 chars)
- `description`: Event description
- `startDate`: Event start date
- `endDate`: Event end date
- `location`: Event location (max 255 chars)
- `organizer`: Event organizer (max 255 chars)
- `budget`: Event budget
- `status`: Event status enum
- `isPublic`: Public visibility
- `imageUrl`: Event image URL

### System Management

#### Notification
System notifications

**Fields:**
- `id`: Unique identifier
- `title`: Notification title
- `message`: Notification message
- `type`: Notification type enum
- `userId`: Reference to User (optional)
- `isRead`: Read status
- `readAt`: Read timestamp
- `data`: Additional data (JSON)

#### ActivityLog
System activity logging

**Fields:**
- `id`: Unique identifier
- `userId`: Reference to User
- `action`: Action performed
- `resource`: Resource type
- `resourceId`: Resource ID
- `description`: Action description
- `ipAddress`: User IP address
- `userAgent`: User agent string

#### Statistics
System statistics

**Fields:**
- `id`: Unique identifier
- `type`: Statistic type
- `label`: Statistic label
- `value`: Statistic value
- `date`: Statistic date
- `metadata`: Additional metadata (JSON)

#### PopulationStatistic
Population statistics

**Fields:**
- `id`: Unique identifier
- `year`: Statistics year
- `month`: Statistics month
- `totalMale`: Total male population
- `totalFemale`: Total female population
- `totalFamilies`: Total families
- `births`: Birth count
- `deaths`: Death count
- `migrations`: Migration count
- Age group fields (`age0to4`, `age5to9`, etc.)

### Inventory Management

#### InventoryCategory
Inventory categories

**Fields:**
- `id`: Unique identifier
- `name`: Category name (unique)
- `description`: Category description

#### InventoryItem
Inventory items

**Fields:**
- `id`: Unique identifier
- `name`: Item name
- `description`: Item description
- `categoryId`: Reference to InventoryCategory
- `quantity`: Item quantity
- `unit`: Unit of measurement
- `price`: Item price
- `condition`: Item condition enum
- `location`: Storage location
- `purchaseDate`: Purchase date

### Feedback Management

#### Complaint
Public complaints and feedback

**Fields:**
- `id`: Unique identifier
- `title`: Complaint title
- `description`: Complaint description
- `category`: Complaint category
- `priority`: Priority level enum
- `status`: Complaint status enum
- `submitterId`: Reference to Citizen (optional)
- `assignedToId`: Reference to User (handler)
- `response`: Response text
- `respondedAt`: Response timestamp

### Backup and Audit

#### BackupLog
System backup logs

**Fields:**
- `id`: Unique identifier
- `filename`: Backup filename
- `size`: File size in bytes
- `type`: Backup type enum
- `status`: Backup status enum
- `startedAt`: Backup start time
- `completedAt`: Backup completion time
- `errorMessage`: Error message (if failed)
- `checksum`: File checksum
- `location`: Storage location

## Enums

### Gender
- `L`: Laki-laki (Male)
- `P`: Perempuan (Female)

### Religion
- `ISLAM`
- `KRISTEN`
- `KATOLIK`
- `HINDU`
- `BUDDHA`
- `KONGHUCU`

### Education
- `TIDAK_SEKOLAH`
- `SD`
- `SMP`
- `SMA`
- `D1`, `D2`, `D3`
- `S1`, `S2`, `S3`

### MaritalStatus
- `BELUM_KAWIN`
- `KAWIN`
- `CERAI_HIDUP`
- `CERAI_MATI`

### BloodType
- `A`, `B`, `AB`, `O`

### SocialStatus
- `MAMPU`
- `KURANG_MAMPU`
- `MISKIN`

### DocumentType
- `KTP`
- `KK`
- `AKTA_LAHIR`
- `IJAZAH`
- `SERTIFIKAT`
- `LAINNYA`

### LetterType
- `SURAT_KETERANGAN_DOMISILI`
- `SURAT_KETERANGAN_USAHA`
- `SURAT_KETERANGAN_TIDAK_MAMPU`
- `SURAT_PENGANTAR`
- `LAINNYA`

### RequestStatus
- `PENDING`
- `DIPROSES`
- `SELESAI`
- `DITOLAK`

## Database Constraints

The database includes several constraints for data integrity:

1. **NIK Format**: Must be exactly 16 digits
2. **Email Format**: Must be valid email format
3. **Phone Format**: Must follow Indonesian phone format
4. **Birth Date**: Cannot be in the future or before 1900
5. **Positive Amounts**: Budget and expense amounts must be positive
6. **Family Number**: Must be numeric
7. **RT/RW Format**: Must be numeric
8. **Postal Code**: Must be 5 digits (Indonesian format)
9. **Village Code**: Must be 10-13 digits
10. **One Head per Family**: Only one head of family per family unit

## Database Indexes

The database includes optimized indexes for:

1. **Composite Indexes**: For common query patterns
2. **Full-text Search**: For citizen names and article content
3. **Performance Indexes**: For frequently accessed data
4. **Unique Constraints**: For data integrity

## Database Triggers

Automatic triggers handle:

1. **Budget Updates**: Automatically update spent and remaining amounts
2. **Activity Logging**: Log important user activities
3. **Statistics Updates**: Update population statistics automatically
4. **Data Validation**: Ensure data consistency

### Extended Models (New in Migration)

#### MigrationLog
Tracks data migration progress from legacy system

**Fields:**
- `id`: Unique identifier
- `tableName`: Name of migrated table (max 100 chars)
- `operation`: Migration operation enum (EXPORT, IMPORT, VALIDATE, CLEANUP)
- `recordCount`: Number of records processed
- `status`: Migration status enum (PENDING, IN_PROGRESS, COMPLETED, FAILED, ROLLBACK)
- `startedAt`: Migration start time
- `completedAt`: Migration completion time
- `errorMessage`: Error details if failed
- `checksum`: Data integrity checksum

#### SystemConfig
Module-specific system configurations

**Fields:**
- `id`: Unique identifier
- `module`: Module name (max 50 chars)
- `key`: Configuration key (max 100 chars)
- `value`: Configuration value
- `dataType`: Value type enum (STRING, NUMBER, BOOLEAN, JSON, EMAIL, URL)
- `isRequired`: Whether configuration is required
- `description`: Configuration description
- `validationRule`: Validation rules

#### LandParcel
Land and property management

**Fields:**
- `id`: Unique identifier
- `parcelNumber`: Unique parcel identifier (max 50 chars)
- `ownerName`: Property owner name (max 100 chars)
- `ownerNik`: Owner's national ID (max 16 chars)
- `area`: Land area in square meters
- `landUse`: Land usage enum (RESIDENTIAL, AGRICULTURE, COMMERCIAL, etc.)
- `landClass`: Land classification enum (CLASS_I to CLASS_V)
- `taxValue`: Property tax value
- `address`: Property address
- `rt/rw`: Administrative area codes
- `latitude/longitude`: Geographic coordinates
- `boundaries`: Property boundaries (GeoJSON)
- `certificateNumber`: Land certificate number
- `certificateType`: Certificate type enum (SHM, SHGB, SHP, etc.)
- `issuedDate`: Certificate issue date

#### Business
Local business registration and tracking

**Fields:**
- `id`: Unique identifier
- `name`: Business name (max 255 chars)
- `ownerNik`: Owner's national ID (max 16 chars)
- `ownerName`: Owner's name (max 100 chars)
- `type`: Business type enum (MIKRO, KECIL, MENENGAH, BESAR)
- `category`: Business category enum (AGRICULTURE, TRADE, SERVICES, etc.)
- `address`: Business address
- `rt/rw`: Administrative area codes
- `establishedDate`: Business establishment date
- `employees`: Number of employees
- `capital`: Business capital
- `revenue`: Annual revenue
- `licenseNumber`: Business license number
- `licenseType`: License type
- `licenseExpiry`: License expiration date
- `isActive`: Business status

#### HealthData
Comprehensive health records for citizens

**Fields:**
- `id`: Unique identifier
- `citizenId`: Reference to Citizen (unique)
- `height`: Height in centimeters
- `weight`: Weight in kilograms
- `bloodPressure`: Blood pressure reading
- `chronicDiseases`: Array of chronic conditions
- `allergies`: Array of known allergies
- `medications`: Array of current medications
- `vaccinations`: Vaccination history (JSON)
- `insuranceType`: Health insurance type enum
- `insuranceNumber`: Insurance policy number
- `emergencyContact`: Emergency contact name
- `emergencyPhone`: Emergency contact phone
- `lastCheckup`: Last medical checkup date

#### DisasterEvent
Disaster and emergency management

**Fields:**
- `id`: Unique identifier
- `name`: Disaster event name (max 255 chars)
- `type`: Disaster type enum (FLOOD, EARTHQUAKE, FIRE, etc.)
- `severity`: Severity level enum (LOW, MEDIUM, HIGH, CRITICAL)
- `startDate`: Disaster start date
- `endDate`: Disaster end date
- `location`: Affected location
- `description`: Event description
- `affectedFamilies`: Number of affected families
- `affectedPeople`: Number of affected individuals
- `casualties`: Number of casualties
- `damages`: Estimated damage value
- `responseActions`: Response measures taken
- `evacuationSites`: Evacuation locations
- `reliefDistributed`: Relief aid distributed
- `status`: Event status enum (ACTIVE, RECOVERY, RESOLVED)

### Additional Enums

#### MigrationOperation
- `EXPORT`: Data export operation
- `IMPORT`: Data import operation
- `VALIDATE`: Data validation operation
- `CLEANUP`: Data cleanup operation

#### MigrationStatus
- `PENDING`: Migration pending
- `IN_PROGRESS`: Migration in progress
- `COMPLETED`: Migration completed successfully
- `FAILED`: Migration failed
- `ROLLBACK`: Migration rolled back

#### ConfigDataType
- `STRING`: Text configuration
- `NUMBER`: Numeric configuration
- `BOOLEAN`: Boolean configuration
- `JSON`: JSON object configuration
- `EMAIL`: Email address configuration
- `URL`: URL configuration

#### LandUse
- `RESIDENTIAL`: Residential area
- `AGRICULTURE`: Agricultural land
- `COMMERCIAL`: Commercial area
- `INDUSTRIAL`: Industrial zone
- `PUBLIC_FACILITY`: Public facilities
- `FOREST`: Forest area
- `WATER_BODY`: Water bodies
- `OTHER`: Other usage

#### LandClass
- `CLASS_I` to `CLASS_V`: Land quality classifications

#### CertificateType
- `SHM`: Sertifikat Hak Milik
- `SHGB`: Sertifikat Hak Guna Bangunan
- `SHP`: Sertifikat Hak Pakai
- `GIRIK`: Girik certificate
- `PETOK_D`: Petok D certificate

#### BusinessType
- `MIKRO`: Micro business
- `KECIL`: Small business
- `MENENGAH`: Medium business
- `BESAR`: Large business

#### BusinessCategory
- `AGRICULTURE`: Agricultural business
- `LIVESTOCK`: Livestock business
- `FISHERY`: Fishery business
- `MANUFACTURING`: Manufacturing
- `TRADE`: Trading business
- `SERVICES`: Service business
- `FOOD_BEVERAGE`: Food and beverage
- `HANDICRAFT`: Handicraft business
- `TRANSPORTATION`: Transportation service
- `OTHER`: Other categories

#### InsuranceType
- `BPJS_KESEHATAN`: National health insurance
- `BPJS_KETENAGAKERJAAN`: Employment insurance
- `ASURANSI_SWASTA`: Private insurance
- `TIDAK_ADA`: No insurance

#### DisasterType
- `FLOOD`: Flood disaster
- `EARTHQUAKE`: Earthquake
- `LANDSLIDE`: Landslide
- `FIRE`: Fire incident
- `DROUGHT`: Drought
- `STORM`: Storm/typhoon
- `VOLCANIC`: Volcanic eruption
- `PANDEMIC`: Pandemic/epidemic
- `OTHER`: Other disasters

#### DisasterSeverity
- `LOW`: Low severity
- `MEDIUM`: Medium severity
- `HIGH`: High severity
- `CRITICAL`: Critical severity

#### DisasterStatus
- `ACTIVE`: Active disaster
- `RECOVERY`: Recovery phase
- `RESOLVED`: Disaster resolved

## Advanced Database Features

### Performance Optimizations

#### Composite Indexes
- **Citizen Search**: `(name, nik, family_id)` for fast citizen lookups
- **Location Queries**: `(address_id, rt, rw)` for geographic searches
- **Request Processing**: `(status, letter_type, requested_at)` for workflow management
- **Financial Reporting**: `(budget_id, date, amount)` for expense analysis
- **Activity Tracking**: `(user_id, action, created_at)` for audit trails
- **Statistics Queries**: `(type, date, value)` for reporting

#### Partial Indexes
- **Active Users**: `WHERE is_active = true` for authentication queries
- **Pending Requests**: `WHERE status = 'PENDING'` for workflow management
- **Published Content**: `WHERE published = true` for public content
- **Active Programs**: `WHERE status = 'ACTIVE'` for program management

#### Full-Text Search
- **Citizen Names**: Full-text search on citizen names
- **Article Content**: Full-text search on article titles and content
- **Business Names**: Full-text search on business names
- **Address Search**: Full-text search on address components

### Data Integrity Constraints

#### Check Constraints
- **NIK Validation**: Ensures 16-digit format for National ID numbers
- **Birth Date Validation**: Birth dates must be in the past and after 1900
- **Amount Validation**: Financial amounts must be positive
- **Phone Validation**: Phone numbers must follow Indonesian format
- **Email Validation**: Email addresses must be valid format
- **Coordinate Validation**: Latitude/longitude must be within valid ranges

#### Unique Constraints with Conditions
- **One Head per Family**: Only one head of family per family unit
- **Unique Active Apparatus**: Only one active apparatus per position
- **Unique Certificate Numbers**: Certificate numbers must be unique per type

### Maintenance Functions

#### Automated Statistics Updates
```sql
update_citizen_statistics() -- Updates population demographics
update_financial_statistics() -- Updates budget and expense summaries
update_health_statistics() -- Updates health data summaries
```

#### Data Cleanup Functions
```sql
cleanup_old_activity_logs(retention_days) -- Removes old activity logs
cleanup_expired_notifications() -- Removes read notifications older than 30 days
cleanup_temporary_files() -- Removes orphaned file references
```

#### Data Integrity Validation
```sql
validate_data_integrity() -- Comprehensive data validation
validate_citizen_relationships() -- Validates family relationships
validate_financial_data() -- Validates budget and expense consistency
```

### Backup and Recovery

#### Backup Strategies
- **Full Backups**: Complete database backup daily
- **Incremental Backups**: Transaction log backups every 15 minutes
- **Differential Backups**: Changed data backup every 6 hours
- **Point-in-Time Recovery**: Recovery to any point within retention period

#### Backup Validation
- **Checksum Verification**: Validates backup file integrity
- **Restore Testing**: Automated restore testing on separate environment
- **Data Consistency Checks**: Validates restored data consistency

### Security Features

#### Audit Logging
- **User Activities**: All user actions logged with timestamps
- **Data Changes**: All data modifications tracked with before/after values
- **System Events**: System events and errors logged
- **Security Events**: Authentication attempts and security violations logged

#### Data Encryption
- **Sensitive Fields**: NIK, phone numbers, and addresses encrypted at rest
- **Password Security**: Passwords hashed with bcrypt and salt
- **File Encryption**: Uploaded documents encrypted in storage
- **Transmission Security**: All data encrypted in transit with TLS

#### Access Control
- **Role-Based Permissions**: Granular permissions for all operations
- **Resource-Level Security**: Access control at individual record level
- **Time-Based Access**: Access restrictions based on time and location
- **Session Management**: Secure session handling with timeout controls

This comprehensive database design supports all OpenSID functionality while maintaining data integrity, performance, and security. The extended models provide complete coverage for village administration, from basic citizen management to advanced features like disaster management and health tracking.