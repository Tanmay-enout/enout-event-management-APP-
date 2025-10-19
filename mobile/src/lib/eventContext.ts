import { storage } from './storage';
import { DEFAULT_EVENT_ID } from './config';

// Simple event context for managing current event ID
class EventContext {
  private currentEventId: string | null = null;

  async getCurrentEventId(): Promise<string> {
    if (this.currentEventId) {
      return this.currentEventId;
    }

    // Try to get from storage first
    const storedEventId = await storage.getItem('current_event_id');
    if (storedEventId) {
      this.currentEventId = storedEventId;
      return storedEventId;
    }

    // Fallback to default
    this.currentEventId = DEFAULT_EVENT_ID;
    await storage.setItem('current_event_id', DEFAULT_EVENT_ID);
    return DEFAULT_EVENT_ID;
  }

  async setCurrentEventId(eventId: string): Promise<void> {
    this.currentEventId = eventId;
    await storage.setItem('current_event_id', eventId);
  }

  clearEventId(): void {
    this.currentEventId = null;
    storage.removeItem('current_event_id');
  }
}

export const eventContext = new EventContext();
