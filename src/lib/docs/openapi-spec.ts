/**
 * OpenAPI Specification
 * API documentation for OpenSID Next.js
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'OpenSID Next.js API',
    description: 'API documentation for OpenSID Next.js - Sistem Informasi Desa',
    version: '2.0.0',
    contact: {
      name: 'OpenSID Team',
      url: 'https://github.com/OpenSID/OpenSID',
      email: 'info@opensid.or.id'
    },
    license: {
      name: 'GPL v3',
      url: 'https://www.gnu.org/licenses/gpl-3.0.html'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://your-domain.com/api',
      description: 'Production server'
    }
  ],
  paths: {
    '/auth/signin': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with username and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: {
                    type: 'string',
                    description: 'Username or email',
                    example: 'admin'
                  },
                  password: {
                    type: 'string',
                    description: 'User password',
                    example: 'admin123'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '429': {
            description: 'Too many login attempts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/citizens': {
      get: {
        tags: ['Citizens'],
        summary: 'Get citizens list',
        description: 'Retrieve paginated list of citizens with optional filtering',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term for name or NIK',
            schema: { type: 'string' }
          },
          {
            name: 'gender',
            in: 'query',
            description: 'Filter by gender',
            schema: { type: 'string', enum: ['L', 'P'] }
          },
          {
            name: 'religion',
            in: 'query',
            description: 'Filter by religion',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Citizens list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Citizen' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      },
      post: {
        tags: ['Citizens'],
        summary: 'Create new citizen',
        description: 'Create a new citizen record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CitizenInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Citizen created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Citizen' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      }
    },
    '/citizens/{id}': {
      get: {
        tags: ['Citizens'],
        summary: 'Get citizen by ID',
        description: 'Retrieve a specific citizen by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Citizen ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Citizen retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/CitizenDetail' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Citizen not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      },
      put: {
        tags: ['Citizens'],
        summary: 'Update citizen',
        description: 'Update an existing citizen record',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Citizen ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CitizenInput' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Citizen updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Citizen' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Citizen not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      },
      delete: {
        tags: ['Citizens'],
        summary: 'Delete citizen',
        description: 'Delete a citizen record',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Citizen ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Citizen deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Citizen not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      }
    },
    '/documents/generate': {
      post: {
        tags: ['Documents'],
        summary: 'Generate PDF document',
        description: 'Generate administrative PDF documents',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DocumentGenerationRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Document generated successfully',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            },
            headers: {
              'Content-Disposition': {
                description: 'Attachment filename',
                schema: { type: 'string' }
              },
              'X-Document-Type': {
                description: 'Document type',
                schema: { type: 'string' }
              },
              'X-Document-Number': {
                description: 'Document number',
                schema: { type: 'string' }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      },
      get: {
        tags: ['Documents'],
        summary: 'Preview document',
        description: 'Generate document preview as base64 PDF',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: true,
            description: 'Document type',
            schema: { 
              type: 'string',
              enum: ['domicileCertificate', 'businessCertificate', 'povertyLetter']
            }
          },
          {
            name: 'citizenId',
            in: 'query',
            required: true,
            description: 'Citizen ID',
            schema: { type: 'string' }
          },
          {
            name: 'purpose',
            in: 'query',
            required: true,
            description: 'Document purpose',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Document preview generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        pdf: { type: 'string', description: 'Base64 encoded PDF' },
                        filename: { type: 'string' },
                        metadata: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['Super Admin', 'Admin', 'Operator', 'User'] },
          isActive: { type: 'boolean' },
          lastLogin: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Citizen: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nik: { type: 'string', description: 'National ID Number' },
          name: { type: 'string' },
          birthPlace: { type: 'string' },
          birthDate: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['L', 'P'] },
          religion: { type: 'string' },
          education: { type: 'string' },
          occupation: { type: 'string' },
          maritalStatus: { type: 'string' },
          nationality: { type: 'string', enum: ['WNI', 'WNA'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      CitizenDetail: {
        allOf: [
          { $ref: '#/components/schemas/Citizen' },
          {
            type: 'object',
            properties: {
              family: { $ref: '#/components/schemas/Family' },
              address: { $ref: '#/components/schemas/Address' },
              documents: {
                type: 'array',
                items: { $ref: '#/components/schemas/Document' }
              }
            }
          }
        ]
      },
      CitizenInput: {
        type: 'object',
        required: ['nik', 'name', 'birthPlace', 'birthDate', 'gender'],
        properties: {
          nik: { type: 'string', pattern: '^[0-9]{16}$' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          birthPlace: { type: 'string', minLength: 1, maxLength: 100 },
          birthDate: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['L', 'P'] },
          religion: { type: 'string' },
          education: { type: 'string' },
          occupation: { type: 'string' },
          maritalStatus: { type: 'string' },
          nationality: { type: 'string', enum: ['WNI', 'WNA'], default: 'WNI' },
          fatherName: { type: 'string' },
          motherName: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      },
      Family: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          familyNumber: { type: 'string' },
          headNIK: { type: 'string' },
          registrationDate: { type: 'string', format: 'date' },
          isActive: { type: 'boolean' },
          members: {
            type: 'array',
            items: { $ref: '#/components/schemas/Citizen' }
          }
        }
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          street: { type: 'string' },
          rt: { type: 'string' },
          rw: { type: 'string' },
          village: { type: 'string' },
          district: { type: 'string' },
          regency: { type: 'string' },
          province: { type: 'string' },
          postalCode: { type: 'string' }
        }
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          documentNumber: { type: 'string' },
          purpose: { type: 'string' },
          status: { type: 'string', enum: ['DRAFT', 'GENERATED', 'SIGNED', 'ARCHIVED'] },
          validUntil: { type: 'string', format: 'date', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      DocumentGenerationRequest: {
        type: 'object',
        required: ['type', 'citizenId', 'purpose'],
        properties: {
          type: {
            type: 'string',
            enum: ['domicileCertificate', 'businessCertificate', 'povertyLetter']
          },
          citizenId: { type: 'string' },
          purpose: { type: 'string', minLength: 1, maxLength: 500 },
          validUntil: { type: 'string', format: 'date-time' },
          additionalData: {
            type: 'object',
            properties: {
              businessType: { type: 'string' },
              businessAddress: { type: 'string' },
              businessStartDate: { type: 'string', format: 'date' }
            }
          },
          options: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['A4', 'A5', 'Letter'], default: 'A4' },
              orientation: { type: 'string', enum: ['portrait', 'landscape'], default: 'portrait' }
            }
          }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          statusCode: { type: 'integer' }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                code: { type: 'string' }
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Citizens',
      description: 'Citizen management operations'
    },
    {
      name: 'Families',
      description: 'Family management operations'
    },
    {
      name: 'Documents',
      description: 'Document generation and management'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Settings',
      description: 'Application settings management'
    }
  ]
}
