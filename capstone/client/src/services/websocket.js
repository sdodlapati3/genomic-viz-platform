/**
 * WebSocket Client Service
 * 
 * Manages WebSocket connection for real-time features
 */

import { io } from 'socket.io-client';
import { addBreadcrumb } from '../utils/sentry.js';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token = null) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
    return this;
  }

  /**
   * Setup core event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      addBreadcrumb('WebSocket connected', 'websocket', {
        socketId: this.socket.id,
      });
      
      this.emit('connection:status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      addBreadcrumb('WebSocket disconnected', 'websocket', { reason });
      this.emit('connection:status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('connection:failed', { error: error.message });
      }
    });

    // Analysis events
    this.socket.on('analysis:progress', (data) => {
      this.emit('analysis:progress', data);
    });

    this.socket.on('analysis:complete', (data) => {
      this.emit('analysis:complete', data);
    });

    this.socket.on('analysis:error', (data) => {
      this.emit('analysis:error', data);
    });

    // Upload events
    this.socket.on('upload:processing', (data) => {
      this.emit('upload:processing', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data);
    });
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit event to local listeners
   */
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  /**
   * Send event to server
   */
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, queueing message');
    }
  }

  /**
   * Start an analysis job
   */
  startAnalysis(type, params) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.send('analysis:start', {
        type,
        params,
        startTime,
      });

      const unsubComplete = this.on('analysis:complete', (data) => {
        if (data.type === type) {
          unsubComplete();
          unsubError();
          resolve(data);
        }
      });

      const unsubError = this.on('analysis:error', (data) => {
        if (data.type === type) {
          unsubComplete();
          unsubError();
          reject(new Error(data.message));
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        unsubComplete();
        unsubError();
        reject(new Error('Analysis timeout'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Cancel ongoing analysis
   */
  cancelAnalysis() {
    this.send('analysis:cancel', {});
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(topics) {
    this.send('notification:subscribe', topics);
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId) {
    this.send('notification:read', notificationId);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.listeners.clear();
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

export default wsService;
