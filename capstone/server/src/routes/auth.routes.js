/**
 * Authentication Routes
 * 
 * Endpoints for user authentication and account management
 */

import express from 'express';
import { UserRepository, UserRole } from '../models/user.model.js';
import {
  generateTokenPair,
  verifyToken,
  revokeToken,
  extractTokenFromHeader,
} from '../auth/tokens.js';
import {
  authenticate,
  authenticateWithUser,
  authorize,
  rateLimit,
} from '../auth/middleware.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', rateLimit, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format',
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters long',
      });
    }

    // Check for registration feature flag
    if (process.env.FEATURE_REGISTRATION === 'false') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Registration is currently disabled',
      });
    }

    // Create user (default role: viewer)
    const user = await UserRepository.create({
      email,
      password,
      name,
      role: UserRole.VIEWER,
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      ...tokens,
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message,
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user',
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return tokens
 * @access Public
 */
router.post('/login', rateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = await UserRepository.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account has been deactivated',
      });
    }

    // Verify password
    const isValid = await user.verifyPassword(password);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    user.updateLastLogin();

    // Generate tokens
    const tokens = generateTokenPair(user);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate',
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate token
 * @access Private
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    // Revoke the current token
    revokeToken(req.token);

    res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout',
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public (with refresh token)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');

    // Find user
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

    // Generate new token pair
    const tokens = generateTokenPair(user);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens,
    });
  } catch (error) {
    if (error.message.includes('expired') || error.message.includes('Invalid')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }
    
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to refresh token',
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateWithUser, (req, res) => {
  res.json({
    user: req.user.toJSON(),
  });
});

/**
 * @route PUT /api/auth/me
 * @desc Update current user profile
 * @access Private
 */
router.put('/me', authenticateWithUser, async (req, res) => {
  try {
    const { name } = req.body;

    const updatedUser = await UserRepository.update(req.user.id, {
      name,
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile',
    });
  }
});

/**
 * @route PUT /api/auth/password
 * @desc Change user password
 * @access Private
 */
router.put('/password', authenticateWithUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Current password and new password are required',
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'New password must be at least 8 characters long',
      });
    }

    // Verify current password
    const isValid = await req.user.verifyPassword(currentPassword);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect',
      });
    }

    // Update password
    await UserRepository.updatePassword(req.user.id, newPassword);

    // Revoke current token (force re-login)
    revokeToken(req.token);

    res.json({
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to change password',
    });
  }
});

/**
 * @route GET /api/auth/users
 * @desc List all users (admin only)
 * @access Private (Admin)
 */
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;

    const result = await UserRepository.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
    });

    res.json({
      users: result.data.map(u => u.toJSON()),
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list users',
    });
  }
});

/**
 * @route PUT /api/auth/users/:userId/role
 * @desc Update user role (admin only)
 * @access Private (Admin)
 */
router.put('/users/:userId/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`,
      });
    }

    const user = await UserRepository.update(userId, { role });

    res.json({
      message: 'User role updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    
    console.error('Update role error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role',
    });
  }
});

/**
 * @route PUT /api/auth/users/:userId/status
 * @desc Activate/deactivate user (admin only)
 * @access Private (Admin)
 */
router.put('/users/:userId/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'isActive must be a boolean',
      });
    }

    const user = await UserRepository.update(userId, { isActive });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON(),
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }
    
    console.error('Update status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user status',
    });
  }
});

export default router;
