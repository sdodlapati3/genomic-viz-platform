/**
 * Zod Validation Schemas
 * 
 * Input validation schemas for API endpoints
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidSchema = z.string().uuid();

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc');

// ============================================
// Authentication Schemas
// ============================================

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim()
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const updateProfileSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'researcher', 'viewer']),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// ============================================
// Mutation Schemas
// ============================================

export const mutationQuerySchema = paginationSchema.extend({
  gene: z.string().max(50).optional(),
  type: z.enum(['missense', 'nonsense', 'frameshift', 'splice', 'silent', 'indel']).optional(),
  chromosome: z.string()
    .regex(/^chr([1-9]|1[0-9]|2[0-2]|X|Y|M)$/, 'Invalid chromosome format')
    .optional(),
  minPosition: z.coerce.number().int().positive().optional(),
  maxPosition: z.coerce.number().int().positive().optional(),
  sampleId: z.string().uuid().optional(),
  sortBy: z.enum(['gene', 'position', 'type', 'sampleCount', 'aaPosition']).default('gene'),
  sortOrder: sortOrderSchema,
}).refine(
  data => !data.minPosition || !data.maxPosition || data.minPosition <= data.maxPosition,
  { message: 'minPosition must be less than or equal to maxPosition', path: ['minPosition'] }
);

export const mutationCreateSchema = z.object({
  gene: z.string().min(1).max(50),
  chromosome: z.string().regex(/^chr([1-9]|1[0-9]|2[0-2]|X|Y|M)$/),
  position: z.number().int().positive(),
  refAllele: z.string().regex(/^[ACGT]+$/, 'Invalid reference allele'),
  altAllele: z.string().regex(/^[ACGT]+$/, 'Invalid alternate allele'),
  type: z.enum(['missense', 'nonsense', 'frameshift', 'splice', 'silent', 'indel']),
  aaChange: z.string().optional(),
  aaPosition: z.number().int().positive().optional(),
  consequence: z.string().optional(),
  sampleId: z.string().uuid().optional(),
});

export const geneParamSchema = z.object({
  gene: z.string().min(1).max(50),
});

export const topGenesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ============================================
// Expression Schemas
// ============================================

export const expressionQuerySchema = paginationSchema.extend({
  genes: z.string()
    .transform(val => val.split(',').map(g => g.trim()))
    .optional(),
  samples: z.string()
    .transform(val => val.split(',').map(s => s.trim()))
    .optional(),
  minExpression: z.coerce.number().optional(),
  maxExpression: z.coerce.number().optional(),
});

export const differentialExpressionSchema = z.object({
  group1: z.array(z.string()).min(1, 'At least one sample required in group 1'),
  group2: z.array(z.string()).min(1, 'At least one sample required in group 2'),
  pValueThreshold: z.number().min(0).max(1).default(0.05),
  foldChangeThreshold: z.number().positive().default(2),
});

// ============================================
// Survival Schemas
// ============================================

export const survivalQuerySchema = z.object({
  cohort: z.string().optional(),
  stratifyBy: z.enum(['gene', 'mutation', 'expression', 'clinical']).optional(),
  gene: z.string().optional(),
  expressionCutoff: z.coerce.number().optional(),
  maxTime: z.coerce.number().positive().optional(),
});

export const kaplanMeierSchema = z.object({
  groups: z.array(z.object({
    name: z.string(),
    sampleIds: z.array(z.string()),
  })).min(1).max(5),
  timeField: z.string().default('survivalDays'),
  eventField: z.string().default('vitalStatus'),
});

// ============================================
// Sample Schemas
// ============================================

export const sampleQuerySchema = paginationSchema.extend({
  cancerType: z.string().optional(),
  sampleType: z.enum(['tumor', 'normal', 'metastasis']).optional(),
  stage: z.string().optional(),
  minAge: z.coerce.number().int().min(0).max(120).optional(),
  maxAge: z.coerce.number().int().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  vitalStatus: z.enum(['alive', 'deceased']).optional(),
});

export const sampleCreateSchema = z.object({
  patientId: z.string().optional(),
  sampleType: z.enum(['tumor', 'normal', 'metastasis']),
  cancerType: z.string().min(1).max(100),
  stage: z.string().optional(),
  age: z.number().int().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  survivalDays: z.number().int().positive().optional(),
  vitalStatus: z.enum(['alive', 'deceased']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================
// Upload Schemas
// ============================================

export const uploadMetadataSchema = z.object({
  fileType: z.enum(['vcf', 'maf', 'csv', 'tsv', 'bed', 'gff']),
  description: z.string().max(500).optional(),
  projectId: z.string().uuid().optional(),
});

// ============================================
// Chat Schemas
// ============================================

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long'),
  context: z.object({
    currentGene: z.string().optional(),
    currentView: z.string().optional(),
    selectedSamples: z.array(z.string()).optional(),
  }).optional(),
});

// ============================================
// Export all schemas
// ============================================

export default {
  // Common
  paginationSchema,
  uuidSchema,
  sortOrderSchema,
  
  // Auth
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  updateRoleSchema,
  updateStatusSchema,
  
  // Mutations
  mutationQuerySchema,
  mutationCreateSchema,
  geneParamSchema,
  topGenesQuerySchema,
  
  // Expression
  expressionQuerySchema,
  differentialExpressionSchema,
  
  // Survival
  survivalQuerySchema,
  kaplanMeierSchema,
  
  // Samples
  sampleQuerySchema,
  sampleCreateSchema,
  
  // Upload
  uploadMetadataSchema,
  
  // Chat
  chatMessageSchema,
};
