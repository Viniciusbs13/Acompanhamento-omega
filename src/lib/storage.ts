import { Client, MetricEntry, UserSettings } from '../types';

const KEYS = {
  CLIENTS: 'omega:clients',
  ENTRIES: (clientId: string) => `omega:entries:${clientId}`,
  SETTINGS: 'omega:settings',
};

export const storage = {
  getClients: (): Client[] => {
    const data = localStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  
  saveClient: (client: Client) => {
    const clients = storage.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index > -1) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },

  deleteClient: (id: string) => {
    const clients = storage.getClients().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.removeItem(KEYS.ENTRIES(id));
  },

  getEntries: (clientId: string): MetricEntry[] => {
    const data = localStorage.getItem(KEYS.ENTRIES(clientId));
    return data ? JSON.parse(data) : [];
  },

  saveEntry: (entry: MetricEntry) => {
    const entries = storage.getEntries(entry.clientId);
    const index = entries.findIndex(e => e.id === entry.id);
    if (index > -1) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(KEYS.ENTRIES(entry.clientId), JSON.stringify(entries));
  },

  deleteEntry: (clientId: string, entryId: string) => {
    const entries = storage.getEntries(clientId).filter(e => e.id !== entryId);
    localStorage.setItem(KEYS.ENTRIES(clientId), JSON.stringify(entries));
  },

  getSettings: (): UserSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : { managerName: 'Gestor Ômega', theme: 'light' };
  },

  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
};
