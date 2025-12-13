/**
 * Swagger/OpenAPI Configuration
 * 
 * Generates API documentation from JSDoc comments
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini-ProteinPaint API',
      version: '1.0.0',
      description: `
## Overview

RESTful API for the Mini-ProteinPaint genomic visualization platform. This API provides endpoints for:

- **Mutations**: Query and filter mutation data, including lollipop plot data
- **Gene Expression**: Access gene expression matrices and differential expression results
- **Survival Analysis**: Kaplan-Meier survival data and Cox regression results
- **Sample Management**: Clinical and sample metadata
- **File Upload**: Parse VCF, MAF, and other genomic file formats
- **AI Chat**: Natural language queries for genomic data

## Authentication

Most endpoints require JWT authentication. To authenticate:

1. Register a new account: \`POST /api/auth/register\`
2. Login to get tokens: \`POST /api/auth/login\`
3. Include the access token in subsequent requests:
   \`\`\`
   Authorization: Bearer <access_token>
   \`\`\`

## Rate Limiting

- **Authenticated users**: 100 requests per 15 minutes
- **Anonymous users**: 20 requests per 15 minutes

Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining in window
- \`Retry-After\`: Seconds until rate limit resets (when exceeded)

## Pagination

List endpoints support pagination with these parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
\`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
        url: 'https://github.com/example/mini-proteinpaint'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.mini-proteinpaint.example.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management'
      },
      {
        name: 'Mutations',
        description: 'Genomic mutation data and analysis'
      },
      {
        name: 'Expression',
        description: 'Gene expression data and differential analysis'
      },
      {
        name: 'Survival',
        description: 'Survival analysis and Kaplan-Meier curves'
      },
      {
        name: 'Samples',
        description: 'Sample and clinical metadata'
      },
      {
        name: 'Upload',
        description: 'File upload and parsing'
      },
      {
        name: 'Chat',
        description: 'AI-powered natural language queries'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
              example: 'Invalid input data'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' }
                }
              },
              description: 'Validation error details'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 20
            },
            total: {
              type: 'integer',
              example: 150
            },
            totalPages: {
              type: 'integer',
              example: 8
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['admin', 'researcher', 'viewer'],
              example: 'researcher'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              nullable: true
            }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            },
            tokenType: {
              type: 'string',
              example: 'Bearer'
            },
            expiresIn: {
              type: 'string',
              example: '15m'
            }
          }
        },
        Mutation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            gene: {
              type: 'string',
              example: 'TP53'
            },
            chromosome: {
              type: 'string',
              example: 'chr17'
            },
            position: {
              type: 'integer',
              example: 7577120
            },
            refAllele: {
              type: 'string',
              example: 'G'
            },
            altAllele: {
              type: 'string',
              example: 'A'
            },
            type: {
              type: 'string',
              enum: ['missense', 'nonsense', 'frameshift', 'splice', 'silent'],
              example: 'missense'
            },
            aaChange: {
              type: 'string',
              example: 'R248Q'
            },
            aaPosition: {
              type: 'integer',
              example: 248
            },
            sampleCount: {
              type: 'integer',
              description: 'Number of samples with this mutation'
            },
            consequence: {
              type: 'string',
              example: 'missense_variant'
            }
          }
        },
        Gene: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            symbol: {
              type: 'string',
              example: 'TP53'
            },
            name: {
              type: 'string',
              example: 'Tumor protein p53'
            },
            chromosome: {
              type: 'string',
              example: 'chr17'
            },
            start: {
              type: 'integer'
            },
            end: {
              type: 'integer'
            },
            strand: {
              type: 'string',
              enum: ['+', '-']
            },
            proteinLength: {
              type: 'integer',
              example: 393
            },
            domains: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProteinDomain'
              }
            }
          }
        },
        ProteinDomain: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'DNA-binding domain'
            },
            start: {
              type: 'integer',
              example: 94
            },
            end: {
              type: 'integer',
              example: 292
            },
            color: {
              type: 'string',
              example: '#3498db'
            },
            description: {
              type: 'string'
            }
          }
        },
        Sample: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            patientId: {
              type: 'string'
            },
            sampleType: {
              type: 'string',
              enum: ['tumor', 'normal', 'metastasis']
            },
            cancerType: {
              type: 'string',
              example: 'Breast Cancer'
            },
            stage: {
              type: 'string',
              example: 'Stage III'
            },
            age: {
              type: 'integer'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other']
            },
            survivalDays: {
              type: 'integer',
              nullable: true
            },
            vitalStatus: {
              type: 'string',
              enum: ['alive', 'deceased']
            }
          }
        },
        SurvivalData: {
          type: 'object',
          properties: {
            time: {
              type: 'number',
              description: 'Time in days'
            },
            survival: {
              type: 'number',
              description: 'Survival probability (0-1)'
            },
            event: {
              type: 'boolean',
              description: 'Whether event occurred'
            },
            atRisk: {
              type: 'integer',
              description: 'Number at risk'
            }
          }
        },
        ExpressionMatrix: {
          type: 'object',
          properties: {
            genes: {
              type: 'array',
              items: { type: 'string' }
            },
            samples: {
              type: 'array',
              items: { type: 'string' }
            },
            values: {
              type: 'array',
              items: {
                type: 'array',
                items: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Unauthorized',
                message: 'No authentication token provided'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Forbidden',
                message: 'Insufficient permissions for this action'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Not Found',
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation Error',
                message: 'Invalid input data',
                details: [
                  { path: 'email', message: 'Invalid email format' }
                ]
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Try again in 300 seconds.',
                retryAfter: 300
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/routes/*.js',
    './src/docs/paths/*.js'
  ]
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 */
export function setupSwagger(app) {
  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50 }
    `,
    customSiteTitle: 'Mini-ProteinPaint API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
    }
  }));

  // Serve raw OpenAPI spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  app.get('/api/docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    // Convert to YAML (simplified)
    res.send(JSON.stringify(specs, null, 2));
  });
}

export { specs, swaggerUi };
export default setupSwagger;
