/**
 * Authentication Middleware
 * 
 * Middleware functions for protecting routes and handling authorization
 */

import { verifyToken, extractTokenFromHeader } from './tokens.js';
import { UserRepository } from '../models/user.model.js';

/**
 * Authenticate user from JWT token
 * 
 * Extracts and verifies JWT from Authorization header,
 * attaches user object to request.
 */
export function authenticate(req, res, next) {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = verifyToken(token, 'access');

    // Attach token and user info to request
    req.token = token;
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid authentication token',
    });
  }
}

/**
 * Authenticate and load full user object
 * 
 * Use when you need full user data, not just token claims
 */
export async function authenticateWithUser(req, res, next) {
  try {
    // First run basic authentication
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    const decoded = verifyToken(token, 'access');

    // Load user from database
    const user = await UserRepository.findById(decoded.sub);
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account has been deactivated',
      });
    }

    // Attach full user to request
    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid authentication token',
    });
  }
}

/**
 * Authorization middleware - check user roles
 * 
 * @param {...string} allowedRoles - Roles that are allowed access
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Must be authenticated first
    if (!req.userRole && !req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.userRole || req.user?.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
}

/**
 * Optional authentication
 * 
 * Attempts to authenticate but doesn't fail if no token present.
 * Useful for routes that work for both authenticated and anonymous users.
 */
export function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token, 'access');
      req.token = token;
      req.userId = decoded.sub;
      req.userEmail = decoded.email;
      req.userRole = decoded.role;
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    // Token is invalid but we proceed anyway
  }

  next();
}

/**
 * Rate limiting by user
 * 
 * Different limits for authenticated vs anonymous users
 */
const requestCounts = new Map();
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 min
const MAX_AUTHENTICATED = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const MAX_ANONYMOUS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_ANON) || 20;

export function rateLimit(req, res, next) {
  const key = req.userId || req.ip;
  const maxRequests = req.userId ? MAX_AUTHENTICATED : MAX_ANONYMOUS;
  
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  // Get or create request history
  let requests = requestCounts.get(key) || [];
  
  // Filter to only requests within window
  requests = requests.filter(time => time > windowStart);
  
  if (requests.length >= maxRequests) {
    const retryAfter = Math.ceil((requests[0] + WINDOW_MS - now) / 1000);
    
    res.set('Retry-After', retryAfter);
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', 0);
    res.set('X-RateLimit-Reset', new Date(requests[0] + WINDOW_MS).toISOString());
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    });
  }
  
  // Add current request
  requests.push(now);
  requestCounts.set(key, requests);
  
  // Set rate limit headers
  res.set('X-RateLimit-Limit', maxRequests);
  res.set('X-RateLimit-Remaining', maxRequests - requests.length);
  
  next();
}

/**
 * Require own resource or admin
 * 
 * For endpoints where users can only access their own resources,
 * unless they are an admin.
 */
export function requireOwnOrAdmin(userIdParam = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam];
    const requestingUserId = req.userId || req.user?.id;
    const requestingRole = req.userRole || req.user?.role;

    if (resourceUserId !== requestingUserId && requestingRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources',
      });
    }

    next();
  };
}

export default {
  authenticate,
  authenticateWithUser,
  authorize,
  optionalAuth,
  rateLimit,
  requireOwnOrAdmin,
};
