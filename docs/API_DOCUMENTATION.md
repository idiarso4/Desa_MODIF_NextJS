# OpenSID Next.js API Documentation

## Overview

OpenSID Next.js provides a comprehensive RESTful API for managing village information systems. All API endpoints require authentication and follow role-based access control (RBAC) principles.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "permissions": ["string"]
  },
  "token": "jwt_token"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

## Citizens API

### Get Citizens
```http
GET /api/citizens
Authorization: Bearer {token}

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- search: string
- gender: "L" | "P"
- rt: string
- rw: string
- familyId: string
```

**Response:**
```json
{
  "citizens": [
    {
      "id": "string",
      "nik": "string",
      "name": "string",
      "birthDate": "date",
      "birthPlace": "string",
      "gender": "L" | "P",
      "religion": "enum",
      "education": "enum",
      "occupation": "string",
      "maritalStatus": "enum",
      "address": {
        "street": "string",
        "rt": "string",
        "rw": "string"
      },
      "family": {
        "familyNumber": "string",
        "isHeadOfFamily": boolean
      }
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

### Create Citizen
```http
POST /api/citizens
Authorization: Bearer {token}
Content-Type: application/json

{
  "nik": "string (16 digits)",
  "name": "string",
  "birthDate": "date",
  "birthPlace": "string",
  "gender": "L" | "P",
  "religion": "ISLAM" | "KRISTEN" | "KATOLIK" | "HINDU" | "BUDDHA" | "KONGHUCU",
  "education": "enum",
  "occupation": "string",
  "maritalStatus": "enum",
  "bloodType": "A" | "B" | "AB" | "O",
  "familyId": "string",
  "isHeadOfFamily": boolean,
  "addressId": "string"
}
```

### Update Citizen
```http
PUT /api/citizens/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  // Same fields as create, all optional
}
```

### Delete Citizen
```http
DELETE /api/citizens/{id}
Authorization: Bearer {token}
```

### Bulk Operations
```http
POST /api/citizens/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "citizens": [
    {
      // Citizen data objects
    }
  ]
}
```

### Search Citizens
```http
GET /api/citizens/search
Authorization: Bearer {token}

Query Parameters:
- q: string (search query)
- fields: string[] (fields to search in)
- limit: number
```

### Export Citizens
```http
GET /api/citizens/export
Authorization: Bearer {token}

Query Parameters:
- format: "excel" | "csv" | "pdf"
- filters: object (same as GET /citizens)
```

### Get Citizen Statistics
```http
GET /api/citizens/statistics
Authorization: Bearer {token}

Query Parameters:
- groupBy: "gender" | "age" | "education" | "religion"
- period: "daily" | "monthly" | "yearly"
```

---

## Families API

### Get Families
```http
GET /api/families
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- search: string
- socialStatus: "MAMPU" | "KURANG_MAMPU" | "MISKIN"
- rt: string
- rw: string
```

### Create Family
```http
POST /api/families
Authorization: Bearer {token}
Content-Type: application/json

{
  "familyNumber": "string",
  "socialStatus": "enum",
  "addressId": "string"
}
```

### Get Family Members
```http
GET /api/families/{id}/members
Authorization: Bearer {token}
```

### Add Family Member
```http
POST /api/families/{id}/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "citizenId": "string",
  "isHeadOfFamily": boolean
}
```

---

## Letters API

### Get Letter Requests
```http
GET /api/letters
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- status: "PENDING" | "DIPROSES" | "SELESAI" | "DITOLAK"
- letterType: "enum"
- citizenId: string
- dateFrom: date
- dateTo: date
```

### Create Letter Request
```http
POST /api/letters
Authorization: Bearer {token}
Content-Type: application/json

{
  "citizenId": "string",
  "letterType": "enum",
  "purpose": "string",
  "notes": "string"
}
```

### Process Letter Request
```http
POST /api/letters/{id}/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approve" | "reject" | "request_documents",
  "notes": "string",
  "documents": ["string"] // document IDs
}
```

### Generate Letter
```http
POST /api/letters/{id}/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": "string",
  "customData": object
}
```

### Letter Templates
```http
GET /api/letters/templates
POST /api/letters/templates
PUT /api/letters/templates/{id}
DELETE /api/letters/templates/{id}
```

---

## Finance API

### Budgets
```http
GET /api/finance/budgets
POST /api/finance/budgets
PUT /api/finance/budgets/{id}
DELETE /api/finance/budgets/{id}
```

**Budget Object:**
```json
{
  "year": number,
  "category": "string",
  "subcategory": "string",
  "description": "string",
  "amount": number,
  "spent": number,
  "remaining": number
}
```

### Expenses
```http
GET /api/finance/expenses
POST /api/finance/expenses
PUT /api/finance/expenses/{id}
DELETE /api/finance/expenses/{id}
```

**Expense Object:**
```json
{
  "budgetId": "string",
  "description": "string",
  "amount": number,
  "date": "date",
  "receipt": "string", // file URL
  "approvedBy": "string", // user ID
  "status": "pending" | "approved" | "rejected"
}
```

### Aid Programs
```http
GET /api/finance/aid-programs
POST /api/finance/aid-programs
PUT /api/finance/aid-programs/{id}
DELETE /api/finance/aid-programs/{id}
```

### Financial Transactions
```http
GET /api/finance/transactions
POST /api/finance/transactions
```

**Transaction Object:**
```json
{
  "type": "INCOME" | "EXPENSE" | "TRANSFER",
  "amount": number,
  "description": "string",
  "category": "string",
  "date": "date",
  "reference": "string"
}
```

---

## Maps API

### Get Citizens with Location
```http
GET /api/maps/citizens
Authorization: Bearer {token}

Query Parameters:
- lat: number (center latitude)
- lng: number (center longitude)
- radius: number (search radius in km)
- bounds: string (format: "north,south,east,west")
- rt: string
- rw: string
- includeFamily: boolean
- limit: number
```

**Response:**
```json
{
  "citizens": [
    {
      "id": "string",
      "position": [number, number], // [lat, lng]
      "title": "string",
      "description": "string",
      "type": "citizen",
      "data": {
        "nik": "string",
        "gender": "L" | "P",
        "age": number,
        "address": "string"
      }
    }
  ],
  "statistics": {
    "total": number,
    "withLocation": number,
    "byGender": {
      "male": number,
      "female": number
    }
  },
  "bounds": {
    "north": number,
    "south": number,
    "east": number,
    "west": number
  }
}
```

### Update Citizen Location
```http
POST /api/maps/citizens
Authorization: Bearer {token}
Content-Type: application/json

{
  "citizenId": "string",
  "latitude": number,
  "longitude": number
}
```

### Bulk Update Locations
```http
PUT /api/maps/citizens
Authorization: Bearer {token}
Content-Type: application/json

{
  "updates": [
    {
      "citizenId": "string",
      "latitude": number,
      "longitude": number
    }
  ]
}
```

---

## Public API

### Get Public Statistics
```http
GET /api/public/statistics
```

**Response:**
```json
{
  "totalPopulation": number,
  "totalFamilies": number,
  "malePopulation": number,
  "femalePopulation": number,
  "totalArea": number,
  "totalRT": number,
  "totalRW": number
}
```

### Get Public Articles
```http
GET /api/public/articles

Query Parameters:
- page: number
- limit: number
- category: string
- featured: boolean
```

### Submit Complaint
```http
POST /api/public/complaints
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "category": "string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "submitterName": "string",
  "submitterEmail": "string",
  "submitterPhone": "string",
  "isAnonymous": boolean
}
```

**Response:**
```json
{
  "message": "string",
  "trackingNumber": "string",
  "complaint": {
    "id": "string",
    "title": "string",
    "status": "OPEN",
    "submittedAt": "date"
  }
}
```

### Track Complaint
```http
POST /api/public/complaints/track
Content-Type: application/json

{
  "trackingNumber": "string"
}
```

---

## Users API

### Get Users
```http
GET /api/users
Authorization: Bearer {token}

Query Parameters:
- page: number
- limit: number
- search: string
- role: string
- isActive: boolean
```

### Create User
```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "name": "string",
  "password": "string",
  "roleId": "string",
  "isActive": boolean
}
```

### Update User
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  // Same fields as create, all optional except id
}
```

### Toggle User Status
```http
POST /api/users/{id}/toggle-status
Authorization: Bearer {token}
```

---

## RBAC API

### Get Roles
```http
GET /api/rbac/roles
Authorization: Bearer {token}
```

### Get Role Permissions
```http
GET /api/rbac/roles/{roleName}
Authorization: Bearer {token}
```

### Update Role Permissions
```http
PUT /api/rbac/roles/{roleName}
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": [
    {
      "resource": "string",
      "action": "string"
    }
  ]
}
```

### Get All Permissions
```http
GET /api/rbac/permissions
Authorization: Bearer {token}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "string",
  "message": "string",
  "details": object, // Optional validation details
  "timestamp": "date",
  "path": "string"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| AUTH_001 | Invalid credentials | Check username/password |
| AUTH_002 | Account inactive | Contact administrator |
| AUTH_003 | Session expired | Login again |
| PERM_001 | Insufficient permissions | Contact administrator |
| VALID_001 | Validation failed | Check request data |
| DATA_001 | Resource not found | Check resource ID |
| DATA_002 | Duplicate resource | Use different identifier |

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Read Operations | 100 requests | 1 minute |
| Write Operations | 30 requests | 1 minute |
| Bulk Operations | 5 requests | 5 minutes |
| Public API | 50 requests | 1 minute |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

### Standard Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Cursor-based Pagination (for large datasets)
```json
{
  "data": [...],
  "pagination": {
    "cursor": "string",
    "hasNext": boolean,
    "limit": number
  }
}
```

---

## Filtering and Sorting

### Query Parameters

#### Filtering
```http
GET /api/citizens?gender=L&rt=001&age_gte=18&age_lt=65
```

#### Sorting
```http
GET /api/citizens?sort=name:asc,birthDate:desc
```

#### Field Selection
```http
GET /api/citizens?fields=id,name,nik,gender
```

#### Including Relations
```http
GET /api/citizens?include=family,address,documents
```

---

## File Upload

### Upload Document
```http
POST /api/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": File,
  "type": "KTP" | "KK" | "AKTA_LAHIR" | "IJAZAH" | "SERTIFIKAT" | "LAINNYA",
  "citizenId": "string", // optional
  "letterRequestId": "string" // optional
}
```

**Response:**
```json
{
  "document": {
    "id": "string",
    "name": "string",
    "type": "string",
    "url": "string",
    "size": number,
    "mimeType": "string",
    "uploadedAt": "date"
  }
}
```

### File Constraints
- **Maximum Size**: 5MB per file
- **Allowed Types**: PDF, JPG, PNG, DOC, DOCX
- **Naming**: Alphanumeric characters only
- **Storage**: Secure cloud storage with encryption

---

## Webhooks

### Webhook Events

| Event | Description | Payload |
|-------|-------------|---------|
| `citizen.created` | New citizen registered | Citizen object |
| `citizen.updated` | Citizen data updated | Citizen object |
| `letter.requested` | New letter request | LetterRequest object |
| `letter.processed` | Letter request processed | LetterRequest object |
| `complaint.submitted` | New complaint submitted | Complaint object |
| `user.login` | User logged in | User object |

### Webhook Configuration
```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-endpoint.com/webhook",
  "events": ["citizen.created", "letter.requested"],
  "secret": "string" // for signature verification
}
```

### Webhook Payload Example
```json
{
  "event": "citizen.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "string",
    "nik": "string",
    "name": "string",
    // ... other citizen fields
  },
  "signature": "sha256=..." // HMAC signature
}
```

---

## SDK and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @opensid/sdk
```

```typescript
import { OpenSIDClient } from '@opensid/sdk'

const client = new OpenSIDClient({
  baseURL: 'https://your-domain.com/api',
  apiKey: 'your-api-key'
})

// Get citizens
const citizens = await client.citizens.list({
  page: 1,
  limit: 10,
  search: 'John'
})

// Create citizen
const newCitizen = await client.citizens.create({
  nik: '1234567890123456',
  name: 'John Doe',
  // ... other fields
})
```

### PHP SDK

```bash
composer require opensid/php-sdk
```

```php
use OpenSID\Client;

$client = new Client([
    'base_url' => 'https://your-domain.com/api',
    'api_key' => 'your-api-key'
]);

// Get citizens
$citizens = $client->citizens()->list([
    'page' => 1,
    'limit' => 10
]);

// Create citizen
$citizen = $client->citizens()->create([
    'nik' => '1234567890123456',
    'name' => 'John Doe'
]);
```

---

## Testing

### API Testing with cURL

#### Authentication
```bash
curl -X POST https://your-domain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

#### Get Citizens
```bash
curl -X GET https://your-domain.com/api/citizens \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Create Citizen
```bash
curl -X POST https://your-domain.com/api/citizens \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "1234567890123456",
    "name": "John Doe",
    "birthDate": "1990-01-01",
    "birthPlace": "Jakarta",
    "gender": "L"
  }'
```

### Postman Collection

Download our Postman collection for easy API testing:
- [OpenSID API Collection](./postman/OpenSID_API.postman_collection.json)
- [Environment Variables](./postman/OpenSID_Environment.postman_environment.json)

---

## Performance

### Response Times
- **Simple queries**: < 100ms
- **Complex queries**: < 500ms
- **Bulk operations**: < 2s
- **File uploads**: < 5s
- **Report generation**: < 10s

### Optimization Tips
1. **Use pagination** for large datasets
2. **Implement caching** for frequently accessed data
3. **Use field selection** to reduce payload size
4. **Batch operations** when possible
5. **Monitor API usage** and optimize slow queries

### Caching Strategy
- **Static data**: 1 hour cache
- **Dynamic data**: 5 minutes cache
- **User-specific data**: No cache
- **Public data**: 30 minutes cache

---

## Security

### API Security Features
- **JWT Authentication** with expiration
- **Role-based Access Control** (RBAC)
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **SQL Injection Protection** via ORM
- **XSS Protection** with content security policy
- **HTTPS Enforcement** in production

### Best Practices
1. **Always use HTTPS** in production
2. **Validate all inputs** on client and server
3. **Use strong passwords** and 2FA when available
4. **Regularly rotate API keys**
5. **Monitor for suspicious activities**
6. **Keep dependencies updated**

### Security Headers
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Monitoring and Logging

### Application Logs
- **Access Logs**: All API requests
- **Error Logs**: Application errors and exceptions
- **Audit Logs**: User activities and data changes
- **Performance Logs**: Response times and resource usage

### Metrics
- **Request Rate**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Response Time**: Average and percentile response times
- **Database Performance**: Query execution times

### Alerting
- **High Error Rate**: > 5% error rate
- **Slow Response**: > 2s average response time
- **High CPU Usage**: > 80% CPU utilization
- **Database Issues**: Connection failures or slow queries

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Core CRUD operations for all entities
- Authentication and authorization
- Public API endpoints
- File upload functionality

### Version 1.1.0 (2024-02-01)
- Added bulk operations
- Enhanced search capabilities
- Improved error handling
- Added webhook support

### Version 1.2.0 (2024-02-15)
- Added GIS/mapping endpoints
- Enhanced complaint system
- Improved performance
- Added more comprehensive logging

---

## Support

### Getting Help
- **Documentation**: Check this documentation first
- **GitHub Issues**: Report bugs and feature requests
- **Email Support**: api-support@opensid.go.id
- **Community Forum**: https://forum.opensid.go.id

### Contributing
- **Bug Reports**: Use GitHub issues
- **Feature Requests**: Use GitHub discussions
- **Code Contributions**: Submit pull requests
- **Documentation**: Help improve documentation

---

*This documentation is automatically generated and updated. Last updated: 2024-01-15*