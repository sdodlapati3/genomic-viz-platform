/**
 * Session Manager for Genomic Visualization Platform
 * Handles save/restore of visualization state to localStorage and JSON export
 */

export interface SessionMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  demo: string;
  version: string;
}

export interface Session<T = unknown> {
  metadata: SessionMetadata;
  state: T;
}

export interface SessionListItem {
  id: string;
  name: string;
  demo: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'genomic-viz-session:';
const SESSION_LIST_KEY = 'genomic-viz-sessions';
const VERSION = '1.0.0';

/**
 * Generate a unique session ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Session Manager class
 * Provides CRUD operations for visualization sessions
 */
export class SessionManager<T = unknown> {
  private demo: string;
  private onStateChange?: (state: T) => void;

  constructor(demoName: string, onStateChange?: (state: T) => void) {
    this.demo = demoName;
    this.onStateChange = onStateChange;
  }

  /**
   * Save current state as a new session
   */
  saveSession(state: T, name: string): Session<T> {
    const id = generateId();
    const now = new Date().toISOString();

    const session: Session<T> = {
      metadata: {
        id,
        name,
        createdAt: now,
        updatedAt: now,
        demo: this.demo,
        version: VERSION,
      },
      state,
    };

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(session));
      this.addToSessionList(session.metadata);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session. Storage may be full.');
    }

    return session;
  }

  /**
   * Update an existing session
   */
  updateSession(id: string, state: T, name?: string): Session<T> | null {
    const existing = this.loadSession(id);
    if (!existing) return null;

    const updatedSession: Session<T> = {
      metadata: {
        ...existing.metadata,
        name: name || existing.metadata.name,
        updatedAt: new Date().toISOString(),
      },
      state,
    };

    try {
      localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(updatedSession));
      this.updateSessionList(updatedSession.metadata);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw new Error('Failed to update session.');
    }

    return updatedSession;
  }

  /**
   * Load a session by ID
   */
  loadSession(id: string): Session<T> | null {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + id);
      if (!data) return null;

      const session = JSON.parse(data) as Session<T>;

      // Notify state change callback
      if (this.onStateChange) {
        this.onStateChange(session.state);
      }

      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Delete a session
   */
  deleteSession(id: string): boolean {
    try {
      localStorage.removeItem(STORAGE_PREFIX + id);
      this.removeFromSessionList(id);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * List all sessions for current demo
   */
  listSessions(): SessionListItem[] {
    try {
      const listData = localStorage.getItem(SESSION_LIST_KEY);
      if (!listData) return [];

      const allSessions = JSON.parse(listData) as SessionListItem[];
      return allSessions.filter((s) => s.demo === this.demo);
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return [];
    }
  }

  /**
   * List all sessions across all demos
   */
  listAllSessions(): SessionListItem[] {
    try {
      const listData = localStorage.getItem(SESSION_LIST_KEY);
      if (!listData) return [];

      return JSON.parse(listData) as SessionListItem[];
    } catch (error) {
      console.error('Failed to list all sessions:', error);
      return [];
    }
  }

  /**
   * Export session to JSON file (triggers download)
   */
  exportSession(id: string): void {
    const session = this.loadSession(id);
    if (!session) {
      throw new Error('Session not found');
    }

    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.metadata.name.replace(/\s+/g, '_')}_${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export current state directly to JSON file
   */
  exportState(state: T, filename: string): void {
    const session: Session<T> = {
      metadata: {
        id: generateId(),
        name: filename,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        demo: this.demo,
        version: VERSION,
      },
      state,
    };

    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import session from JSON file
   */
  async importSession(file: File): Promise<Session<T>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const imported = JSON.parse(json) as Session<T>;

          // Validate structure
          if (!imported.metadata || !imported.state) {
            throw new Error('Invalid session file format');
          }

          // Generate new ID for imported session
          const newId = generateId();
          const now = new Date().toISOString();

          const session: Session<T> = {
            metadata: {
              ...imported.metadata,
              id: newId,
              createdAt: now,
              updatedAt: now,
              demo: this.demo,
            },
            state: imported.state,
          };

          // Save to localStorage
          localStorage.setItem(STORAGE_PREFIX + newId, JSON.stringify(session));
          this.addToSessionList(session.metadata);

          // Notify state change callback
          if (this.onStateChange) {
            this.onStateChange(session.state);
          }

          resolve(session);
        } catch (error) {
          reject(new Error('Failed to parse session file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Clear all sessions for current demo
   */
  clearDemoSessions(): void {
    const sessions = this.listSessions();
    sessions.forEach((s) => this.deleteSession(s.id));
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // Estimate total available (usually 5-10MB)
    const total = 5 * 1024 * 1024; // 5MB estimate

    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  // Private helper methods

  private addToSessionList(metadata: SessionMetadata): void {
    const list = this.listAllSessions();
    const item: SessionListItem = {
      id: metadata.id,
      name: metadata.name,
      demo: metadata.demo,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };
    list.push(item);
    localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(list));
  }

  private updateSessionList(metadata: SessionMetadata): void {
    const list = this.listAllSessions();
    const index = list.findIndex((s) => s.id === metadata.id);
    if (index !== -1) {
      list[index] = {
        id: metadata.id,
        name: metadata.name,
        demo: metadata.demo,
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
      };
      localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(list));
    }
  }

  private removeFromSessionList(id: string): void {
    const list = this.listAllSessions();
    const filtered = list.filter((s) => s.id !== id);
    localStorage.setItem(SESSION_LIST_KEY, JSON.stringify(filtered));
  }
}

/**
 * Create a session manager UI component
 * Returns HTML string for the session management panel
 */
export function createSessionManagerUI(
  containerId: string,
  onSave: () => void,
  onLoad: (sessionId: string) => void,
  sessions: SessionListItem[]
): string {
  return `
    <div id="${containerId}" class="session-manager">
      <div class="session-header">
        <h4>📁 Sessions</h4>
        <button class="btn-icon" id="session-save-btn" title="Save Session">💾</button>
      </div>
      
      <div class="session-actions">
        <button class="btn-sm" id="session-export-btn">Export JSON</button>
        <label class="btn-sm" id="session-import-label">
          Import
          <input type="file" id="session-import-input" accept=".json" hidden />
        </label>
      </div>
      
      <div class="session-list">
        ${
          sessions.length === 0
            ? '<p class="session-empty">No saved sessions</p>'
            : sessions
                .map(
                  (s) => `
              <div class="session-item" data-id="${s.id}">
                <div class="session-info">
                  <span class="session-name">${s.name}</span>
                  <span class="session-date">${new Date(s.updatedAt).toLocaleDateString()}</span>
                </div>
                <div class="session-actions">
                  <button class="btn-icon session-load" title="Load">📂</button>
                  <button class="btn-icon session-delete" title="Delete">🗑️</button>
                </div>
              </div>
            `
                )
                .join('')
        }
      </div>
    </div>
  `;
}

/**
 * CSS styles for session manager UI
 */
export const sessionManagerStyles = `
  .session-manager {
    background: #1a1a2e;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
  }
  
  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .session-header h4 {
    margin: 0;
    font-size: 0.9rem;
    color: #e0e0e0;
  }
  
  .session-actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .btn-sm {
    background: #16213e;
    border: 1px solid #0f3460;
    color: #e0e0e0;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-sm:hover {
    background: #0f3460;
  }
  
  .btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    transition: transform 0.2s;
  }
  
  .btn-icon:hover {
    transform: scale(1.1);
  }
  
  .session-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .session-empty {
    color: #666;
    font-size: 0.8rem;
    text-align: center;
    padding: 1rem;
  }
  
  .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #16213e;
    border-radius: 4px;
    margin-bottom: 0.25rem;
    transition: background 0.2s;
  }
  
  .session-item:hover {
    background: #0f3460;
  }
  
  .session-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  
  .session-name {
    font-size: 0.85rem;
    color: #e0e0e0;
  }
  
  .session-date {
    font-size: 0.7rem;
    color: #666;
  }
  
  .session-item .session-actions {
    margin: 0;
  }
`;
