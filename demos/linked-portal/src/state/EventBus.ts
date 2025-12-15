/**
 * EventBus - Pub/Sub system for cross-view communication
 *
 * Enables decoupled communication between visualization components.
 * Inspired by ProteinPaint's rx/Bus.ts pattern.
 */

import type { EventCallback, EventSubscription, LinkedViewEvents } from '../types';

class EventBusImpl {
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();
  private eventHistory: Array<{ event: string; data: unknown; timestamp: number }> = [];
  private maxHistorySize = 100;
  private debugMode = false;

  /**
   * Enable/disable debug logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof LinkedViewEvents>(
    event: K,
    callback: EventCallback<LinkedViewEvents[K]>
  ): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    listeners.add(callback as EventCallback<unknown>);

    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to "${event}", total listeners: ${listeners.size}`);
    }

    return {
      unsubscribe: () => {
        listeners.delete(callback as EventCallback<unknown>);
        if (this.debugMode) {
          console.log(`[EventBus] Unsubscribed from "${event}", remaining: ${listeners.size}`);
        }
      },
    };
  }

  /**
   * Subscribe to an event (one-time only)
   */
  once<K extends keyof LinkedViewEvents>(
    event: K,
    callback: EventCallback<LinkedViewEvents[K]>
  ): EventSubscription {
    const subscription = this.on(event, (data) => {
      subscription.unsubscribe();
      callback(data);
    });
    return subscription;
  }

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof LinkedViewEvents>(event: K, data: LinkedViewEvents[K]): void {
    // Record in history
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now(),
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    if (this.debugMode) {
      console.log(`[EventBus] Emit "${event}"`, data);
    }

    const listeners = this.listeners.get(event);
    if (!listeners) return;

    // Create a copy to avoid issues if a listener unsubscribes during iteration
    const listenersCopy = Array.from(listeners);

    for (const callback of listenersCopy) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in listener for "${event}":`, error);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  off(event: keyof LinkedViewEvents): void {
    this.listeners.delete(event);
    if (this.debugMode) {
      console.log(`[EventBus] Removed all listeners for "${event}"`);
    }
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
    if (this.debugMode) {
      console.log('[EventBus] Cleared all listeners');
    }
  }

  /**
   * Get event history (useful for debugging)
   */
  getHistory(): Array<{ event: string; data: unknown; timestamp: number }> {
    return [...this.eventHistory];
  }

  /**
   * Get listener count for an event
   */
  getListenerCount(event: keyof LinkedViewEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Singleton instance
export const EventBus = new EventBusImpl();

// Enable debug mode in development
if (import.meta.env?.DEV) {
  EventBus.setDebugMode(true);
}
