import { firebaseStorage } from './firebaseStorage';
import { Client, MetricEntry, UserSettings, Sale, CommercialGoal } from '../types';

export const storage = {
  getClients: async (): Promise<Client[]> => {
    return await firebaseStorage.getClients();
  },
  
  saveClient: async (client: Client) => {
    await firebaseStorage.saveClient(client);
  },

  deleteClient: async (id: string) => {
    await firebaseStorage.deleteClient(id);
  },

  getEntries: async (clientId: string): Promise<MetricEntry[]> => {
    return await firebaseStorage.getEntries(clientId);
  },

  saveEntry: async (entry: MetricEntry) => {
    await firebaseStorage.saveEntry(entry);
  },

  deleteEntry: async (clientId: string, entryId: string) => {
    await firebaseStorage.deleteEntry(clientId, entryId);
  },

  getSettings: async (): Promise<UserSettings> => {
    return await firebaseStorage.getSettings();
  },

  saveSettings: async (settings: UserSettings) => {
    await firebaseStorage.saveSettings(settings);
  },

  // Commercial
  getSales: async (monthYear?: string): Promise<Sale[]> => {
    return await firebaseStorage.getSales(monthYear);
  },
  
  saveSale: async (sale: Sale) => {
    await firebaseStorage.saveSale(sale);
  },

  deleteSale: async (id: string) => {
    await firebaseStorage.deleteSale(id);
  },

  getGoals: async (): Promise<CommercialGoal[]> => {
    return await firebaseStorage.getGoals();
  },

  saveGoal: async (goal: CommercialGoal) => {
    await firebaseStorage.saveGoal(goal);
  }
};
