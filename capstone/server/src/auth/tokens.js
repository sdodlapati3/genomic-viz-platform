/**
 * JWT Token Utilities
 * 
 * Functions for generating, verifying, and managing JWT tokens
 */

import jwt from 'jsonwebtoken';

// Token blacklist for logout (in production, use Redis)
const tokenBlacklist = new Set();

/**
 * Get JWT configuration from environment
 */
function getJwtConfig() {
  return {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

/**
 * Generate access token
 */
export function generateAccessToken(user) {
  const config = getJwtConfig();
  
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn,
    issuer: 'mini-proteinpaint',
    audience: 'mini-proteinpaint-client',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(user) {
  const config = getJwtConfig();
  
  const payload = {
    sub: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, config.secret, {
    expiresIn: config.refreshExpiresIn,
    issuer: 'mini-proteinpaint',
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    tokenType: 'Bearer',
    expiresIn: getJwtConfig().expiresIn,
  };
}

/**
 * Verify and decode a token
 */
export function verifyToken(token, type = 'access') {
  const config = getJwtConfig();

  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, config.secret, {
      issuer: 'mini-proteinpaint',
      audience: type === 'access' ? 'mini-proteinpaint-client' : undefined,
    });

    // Verify token type
    if (decoded.type !== type) {
      throw new Error(`Invalid token type: expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token) {
  return jwt.decode(token, { complete: true });
}

/**
 * Add token to blacklist (for logout)
 */
export function revokeToken(token) {
  tokenBlacklist.add(token);
}

/**
 * Check if token is blacklisted
 */
export function isTokenRevoked(token) {
  return tokenBlacklist.has(token);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.payload.exp) {
    return null;
  }
  return new Date(decoded.payload.exp * 1000);
}

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  revokeToken,
  isTokenRevoked,
  extractTokenFromHeader,
  getTokenExpiration,
};
