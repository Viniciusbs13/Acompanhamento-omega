import { useState, useEffect } from 'react';
import { Client, MetricEntry } from '../types';
import { storage } from '../lib/storage';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  const addClient = (client: Client) => {
    storage.saveClient(client);
    setClients(storage.getClients());
  };

  const removeClient = (id: string) => {
    storage.deleteClient(id);
    setClients(storage.getClients());
  };

  return { clients, addClient, removeClient };
}

export function useEntries(clientId: string) {
  const [entries, setEntries] = useState<MetricEntry[]>([]);

  useEffect(() => {
    if (clientId) {
      setEntries(storage.getEntries(clientId));
    }
  }, [clientId]);

  const addEntry = (entry: MetricEntry) => {
    storage.saveEntry(entry);
    setEntries(storage.getEntries(clientId));
  };

  const removeEntry = (entryId: string) => {
    storage.deleteEntry(clientId, entryId);
    setEntries(storage.getEntries(clientId));
  };

  return { entries, addEntry, removeEntry };
}
