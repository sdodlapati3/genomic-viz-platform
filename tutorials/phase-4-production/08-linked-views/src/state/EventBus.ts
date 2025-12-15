/**
 * EventBus - Pub/Sub system for cross-view communication
 *
 * Enables decoupled communication between visualization components.
 * Based on ProteinPaint's event coordination patterns.
 */

export type EventCallback<T = unknown> = (data: T) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

export type LinkedViewEvents = {
  'selection:change': SelectionChangeEvent;
  'selection:clear': SelectionClearEvent;
  'highlight:show': HighlightEvent;
  'highlight:hide': HighlightEvent;
  'filter:apply': FilterEvent;
  'filter:clear': FilterClearEvent;
  'zoom:change': ZoomEvent;
  'data:update': DataUpdateEvent;
};

export interface SelectionChangeEvent {
  sampleIds: string[];
  mutationIds: string[];
  source: string;
  type: 'click' | 'brush' | 'lasso';
  additive?: boolean;
}

export interface SelectionClearEvent {
  source: string;
}

export interface HighlightEvent {
  sampleIds: string[];
  mutationIds: string[];
  source: string;
}

export interface FilterEvent {
  filters: Record<string, unknown>;
  source: string;
}

export interface FilterClearEvent {
  source: string;
}

export interface ZoomEvent {
  domain: [number, number];
  source: string;
}

export interface DataUpdateEvent {
  dataType: 'samples' | 'mutations' | 'expression';
  source: string;
}

class EventBusImpl {
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();
  private eventHistory: Array<{ event: string; data: unknown; timestamp: number }> = [];
  private maxHistorySize = 100;
  private debugMode = false;

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
   * Subscribe to an event (one-time)
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
    const listeners = this.listeners.get(event);

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
      console.log(`[EventBus] Emit "${event}":`, data);
    }

    if (!listeners || listeners.size === 0) {
      return;
    }

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in listener for "${event}":`, error);
      }
    });
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
   * Get event history for debugging
   */
  getHistory(): Array<{ event: string; data: unknown; timestamp: number }> {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Enable/disable debug mode
   */
  setDebug(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[EventBus] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: keyof LinkedViewEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all registered event names
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}

// Singleton instance
export const EventBus = new EventBusImpl();

// Export type for testing/mocking
export type { EventBusImpl };
