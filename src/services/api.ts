import { FestivalEvent, initialEvents } from '../data';

declare const process: { env?: Record<string, string | undefined> } | undefined;

// Default API URL from environment variable or placeholder
let customApiUrl: string = (typeof process !== 'undefined' ? process?.env?.EXPO_PUBLIC_API_URL : '') || '';

// Local in-memory store for fallback/offline mode
let localStore: FestivalEvent[] = [...initialEvents];

export const festivalApi = {
  getApiUrl(): string {
    return customApiUrl;
  },

  setApiUrl(url: string) {
    customApiUrl = url.trim().replace(/\/$/, '');
  },

  isLive(): boolean {
    return Boolean(customApiUrl);
  },

  async getEvents(): Promise<{ events: FestivalEvent[]; source: 'dynamodb' | 'local' }> {
    if (!customApiUrl) {
      return { events: [...localStore], source: 'local' };
    }

    try {
      const response = await fetch(`${customApiUrl}/events`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FestivalEvent[] = await response.json();
      localStore = data;
      return { events: data, source: 'dynamodb' };
    } catch (err) {
      console.warn('Fallo al conectar con DynamoDB, usando almacén local:', err);
      return { events: [...localStore], source: 'local' };
    }
  },

  async createEvent(event: Omit<FestivalEvent, 'id'>): Promise<{ event: FestivalEvent; source: 'dynamodb' | 'local' }> {
    const newId = 'EVT-' + Math.floor(100 + Math.random() * 900);
    const newItem: FestivalEvent = { id: newId, ...event };

    if (!customApiUrl) {
      localStore = [newItem, ...localStore];
      return { event: newItem, source: 'local' };
    }

    try {
      const response = await fetch(`${customApiUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const created: FestivalEvent = await response.json();
      localStore = [created, ...localStore.filter(e => e.id !== created.id)];
      return { event: created, source: 'dynamodb' };
    } catch (err) {
      console.warn('Fallo al persistir en DynamoDB, guardado local:', err);
      localStore = [newItem, ...localStore];
      return { event: newItem, source: 'local' };
    }
  },

  async updateEvent(
    id: string,
    updates: Partial<FestivalEvent>
  ): Promise<{ event: FestivalEvent; source: 'dynamodb' | 'local' }> {
    const existing = localStore.find(e => e.id === id);
    const updatedLocal: FestivalEvent = {
      ...(existing || { id, artist: '', space: '', time: '', status: 'CONFIRMED' }),
      ...updates,
    };

    if (!customApiUrl) {
      localStore = localStore.map(e => (e.id === id ? updatedLocal : e));
      return { event: updatedLocal, source: 'local' };
    }

    try {
      const response = await fetch(`${customApiUrl}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const saved: FestivalEvent = await response.json();
      localStore = localStore.map(e => (e.id === id ? saved : e));
      return { event: saved, source: 'dynamodb' };
    } catch (err) {
      console.warn('Fallo al actualizar en DynamoDB, actualizado localmente:', err);
      localStore = localStore.map(e => (e.id === id ? updatedLocal : e));
      return { event: updatedLocal, source: 'local' };
    }
  },

  async deleteEvent(id: string): Promise<{ source: 'dynamodb' | 'local' }> {
    localStore = localStore.filter(e => e.id !== id);

    if (!customApiUrl) {
      return { source: 'local' };
    }

    try {
      const response = await fetch(`${customApiUrl}/events/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { source: 'dynamodb' };
    } catch (err) {
      console.warn('Fallo al eliminar en DynamoDB, eliminado localmente:', err);
      return { source: 'local' };
    }
  },
};
