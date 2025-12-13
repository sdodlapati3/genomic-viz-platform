/**
 * User Model
 * 
 * Defines user schema and database operations
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// In-memory store (replace with actual database in production)
const users = new Map();

// User roles
export const UserRole = {
  ADMIN: 'admin',
  RESEARCHER: 'researcher',
  VIEWER: 'viewer',
};

/**
 * User class representing a user in the system
 */
export class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.name = data.name || '';
    this.role = data.role || UserRole.VIEWER;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin || null;
  }

  /**
   * Get safe user object (without password)
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
    };
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin() {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
    users.set(this.id, this);
    return this;
  }
}

/**
 * User Repository - Database operations
 */
export const UserRepository = {
  /**
   * Create a new user
   */
  async create({ email, password, name, role }) {
    // Check if email exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, rounds);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: role || UserRole.VIEWER,
    });

    users.set(user.id, user);
    return user;
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    const user = users.get(id);
    return user || null;
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    for (const user of users.values()) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  },

  /**
   * Update user
   */
  async update(id, updates) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'role', 'isActive'];
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    }

    user.updatedAt = new Date();
    users.set(id, user);
    return user;
  },

  /**
   * Update password
   */
  async updatePassword(id, newPassword) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.passwordHash = await bcrypt.hash(newPassword, rounds);
    user.updatedAt = new Date();
    users.set(id, user);
    return user;
  },

  /**
   * Delete user
   */
  async delete(id) {
    return users.delete(id);
  },

  /**
   * List all users (with pagination)
   */
  async findAll({ page = 1, limit = 20, role } = {}) {
    let userList = Array.from(users.values());

    // Filter by role if specified
    if (role) {
      userList = userList.filter(u => u.role === role);
    }

    // Sort by creation date (newest first)
    userList.sort((a, b) => b.createdAt - a.createdAt);

    // Paginate
    const total = userList.length;
    const start = (page - 1) * limit;
    const data = userList.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Count users
   */
  async count() {
    return users.size;
  },
};

export default UserRepository;
