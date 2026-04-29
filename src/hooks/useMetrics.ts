import { useState, useEffect } from 'react';
import { Client, MetricEntry } from '../types';
import { storage } from '../lib/storage';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const data = await storage.getClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addClient = async (client: Client) => {
    await storage.saveClient(client);
    await refresh();
  };

  const removeClient = async (id: string) => {
    await storage.deleteClient(id);
    await refresh();
  };

  return { clients, loading, addClient, removeClient, refresh };
}

export function useEntries(clientId: string) {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (clientId) {
      const data = await storage.getEntries(clientId);
      setEntries(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [clientId]);

  const addEntry = async (entry: MetricEntry) => {
    await storage.saveEntry(entry);
    await refresh();
  };

  const removeEntry = async (entryId: string) => {
    await storage.deleteEntry(clientId, entryId);
    await refresh();
  };

  return { entries, loading, addEntry, removeEntry, refresh };
}
