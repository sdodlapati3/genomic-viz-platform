/**
 * WebSocket Server
 * 
 * Real-time communication using Socket.io
 */

import { Server } from 'socket.io';
import { verifyToken } from '../auth/tokens.js';

// Store active connections
const connections = new Map();

/**
 * Initialize WebSocket server
 * 
 * @param {Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export function initWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // Allow anonymous connections with limited access
        socket.user = { role: 'anonymous' };
        return next();
      }

      const decoded = verifyToken(token, 'access');
      socket.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id} (${socket.user.email || 'anonymous'})`);
    
    // Store connection
    if (socket.user.id) {
      connections.set(socket.user.id, socket);
      socket.join(`user:${socket.user.id}`);
    }

    // Join role-based rooms
    socket.join(`role:${socket.user.role}`);

    // Handle analysis events
    setupAnalysisHandlers(io, socket);

    // Handle file upload events
    setupUploadHandlers(io, socket);

    // Handle notification events
    setupNotificationHandlers(io, socket);

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} - ${reason}`);
      if (socket.user.id) {
        connections.delete(socket.user.id);
      }
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`Socket error (${socket.id}):`, error);
    });
  });

  console.log('✅ WebSocket server initialized');
  return io;
}

/**
 * Analysis event handlers
 */
function setupAnalysisHandlers(io, socket) {
  // Start analysis
  socket.on('analysis:start', async (data) => {
    const { type, params } = data;
    
    console.log(`Starting analysis: ${type} for ${socket.user.email}`);
    
    // Emit progress updates
    socket.emit('analysis:progress', {
      type,
      progress: 0,
      status: 'started',
      message: 'Initializing analysis...',
    });

    // Simulate analysis progress
    // In production, this would be actual analysis code
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      socket.emit('analysis:progress', {
        type,
        progress: Math.min(progress, 100),
        status: progress >= 100 ? 'complete' : 'processing',
        message: getProgressMessage(type, progress),
      });

      if (progress >= 100) {
        clearInterval(interval);
        
        // Emit completion
        socket.emit('analysis:complete', {
          type,
          result: { success: true },
          duration: Date.now() - data.startTime,
        });
      }
    }, 500);

    // Store interval for cleanup
    socket.analysisInterval = interval;
  });

  // Cancel analysis
  socket.on('analysis:cancel', () => {
    if (socket.analysisInterval) {
      clearInterval(socket.analysisInterval);
      socket.emit('analysis:cancelled', { message: 'Analysis cancelled by user' });
    }
  });
}

/**
 * File upload event handlers
 */
function setupUploadHandlers(io, socket) {
  socket.on('upload:start', (data) => {
    const { filename, size } = data;
    console.log(`Upload started: ${filename} (${size} bytes)`);
    
    socket.emit('upload:acknowledged', {
      filename,
      uploadId: Date.now().toString(36),
    });
  });

  socket.on('upload:progress', (data) => {
    // Broadcast to admin users for monitoring
    io.to('role:admin').emit('upload:progress', {
      userId: socket.user.id,
      ...data,
    });
  });

  socket.on('upload:complete', (data) => {
    socket.emit('upload:processing', {
      message: 'File uploaded, starting processing...',
    });
  });
}

/**
 * Notification event handlers
 */
function setupNotificationHandlers(io, socket) {
  socket.on('notification:read', (notificationId) => {
    // Mark notification as read
    console.log(`Notification ${notificationId} marked as read`);
  });

  socket.on('notification:subscribe', (topics) => {
    topics.forEach(topic => {
      socket.join(`notification:${topic}`);
    });
  });
}

/**
 * Get progress message based on analysis type
 */
function getProgressMessage(type, progress) {
  const messages = {
    mutation: [
      'Loading mutation data...',
      'Filtering variants...',
      'Annotating mutations...',
      'Calculating statistics...',
      'Generating visualization data...',
      'Finalizing results...',
    ],
    expression: [
      'Loading expression matrix...',
      'Normalizing values...',
      'Computing differential expression...',
      'Applying multiple testing correction...',
      'Generating volcano plot data...',
      'Finalizing results...',
    ],
    survival: [
      'Loading survival data...',
      'Building cohorts...',
      'Computing Kaplan-Meier curves...',
      'Running log-rank test...',
      'Generating plot data...',
      'Finalizing results...',
    ],
  };

  const typeMessages = messages[type] || ['Processing...'];
  const index = Math.min(Math.floor(progress / 20), typeMessages.length - 1);
  return typeMessages[index];
}

/**
 * Send notification to specific user
 */
export function sendToUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Send notification to role
 */
export function sendToRole(io, role, event, data) {
  io.to(`role:${role}`).emit(event, data);
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(io, event, data) {
  io.emit(event, data);
}

/**
 * Get connection count
 */
export function getConnectionCount() {
  return connections.size;
}

export default {
  initWebSocket,
  sendToUser,
  sendToRole,
  broadcast,
  getConnectionCount,
};
