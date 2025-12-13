/**
 * WebSocket Hook
 * 
 * React hook for WebSocket functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import wsService from '../services/websocket.js';

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocket(token) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    wsService.connect(token);

    const unsubStatus = wsService.on('connection:status', ({ connected, reason }) => {
      setIsConnected(connected);
      if (!connected && reason) {
        setConnectionError(reason);
      } else {
        setConnectionError(null);
      }
    });

    const unsubFailed = wsService.on('connection:failed', ({ error }) => {
      setConnectionError(error);
    });

    return () => {
      unsubStatus();
      unsubFailed();
      wsService.disconnect();
    };
  }, [token]);

  return { isConnected, connectionError };
}

/**
 * Hook for analysis progress tracking
 */
export function useAnalysis() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubProgress = wsService.on('analysis:progress', (data) => {
      setProgress(data.progress);
      setStatus(data.status);
      setMessage(data.message);
    });

    const unsubComplete = wsService.on('analysis:complete', (data) => {
      setProgress(100);
      setStatus('complete');
      setResult(data.result);
    });

    const unsubError = wsService.on('analysis:error', (data) => {
      setStatus('error');
      setError(data.message);
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, []);

  const startAnalysis = useCallback(async (type, params) => {
    setProgress(0);
    setStatus('running');
    setMessage('Starting analysis...');
    setResult(null);
    setError(null);

    try {
      const result = await wsService.startAnalysis(type, params);
      return result;
    } catch (err) {
      setStatus('error');
      setError(err.message);
      throw err;
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    wsService.cancelAnalysis();
    setStatus('cancelled');
    setMessage('Analysis cancelled');
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setMessage('');
    setResult(null);
    setError(null);
  }, []);

  return {
    progress,
    status,
    message,
    result,
    error,
    startAnalysis,
    cancelAnalysis,
    reset,
  };
}

/**
 * Hook for real-time notifications
 */
export function useNotifications(topics = []) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (topics.length > 0) {
      wsService.subscribeToNotifications(topics);
    }

    const unsub = wsService.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => unsub();
  }, [topics]);

  const markAsRead = useCallback((notificationId) => {
    wsService.markNotificationRead(notificationId);
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    notifications
      .filter(n => !n.read)
      .forEach(n => wsService.markNotificationRead(n.id));
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  const clear = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clear,
  };
}

/**
 * Hook for file upload progress
 */
export function useUploadProgress() {
  const [uploads, setUploads] = useState({});

  useEffect(() => {
    const unsubProcessing = wsService.on('upload:processing', (data) => {
      setUploads(prev => ({
        ...prev,
        [data.uploadId]: {
          ...prev[data.uploadId],
          status: 'processing',
          message: data.message,
        },
      }));
    });

    return () => unsubProcessing();
  }, []);

  const trackUpload = useCallback((uploadId, filename, totalSize) => {
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        filename,
        totalSize,
        uploadedSize: 0,
        progress: 0,
        status: 'uploading',
      },
    }));

    wsService.send('upload:start', { filename, size: totalSize });
  }, []);

  const updateProgress = useCallback((uploadId, uploadedSize) => {
    setUploads(prev => {
      const upload = prev[uploadId];
      if (!upload) return prev;

      const progress = Math.round((uploadedSize / upload.totalSize) * 100);
      
      wsService.send('upload:progress', {
        uploadId,
        progress,
        uploadedSize,
      });

      return {
        ...prev,
        [uploadId]: {
          ...upload,
          uploadedSize,
          progress,
        },
      };
    });
  }, []);

  const completeUpload = useCallback((uploadId) => {
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        ...prev[uploadId],
        progress: 100,
        status: 'complete',
      },
    }));

    wsService.send('upload:complete', { uploadId });
  }, []);

  const removeUpload = useCallback((uploadId) => {
    setUploads(prev => {
      const { [uploadId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    uploads,
    trackUpload,
    updateProgress,
    completeUpload,
    removeUpload,
  };
}
