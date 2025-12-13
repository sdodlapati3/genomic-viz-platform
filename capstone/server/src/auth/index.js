/**
 * Authentication Module Index
 * 
 * Exports all authentication-related utilities
 */

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  revokeToken,
  isTokenRevoked,
  extractTokenFromHeader,
  getTokenExpiration,
} from './tokens.js';

export {
  authenticate,
  authenticateWithUser,
  authorize,
  optionalAuth,
  rateLimit,
  requireOwnOrAdmin,
} from './middleware.js';

export { default as authRoutes } from '../routes/auth.routes.js';
