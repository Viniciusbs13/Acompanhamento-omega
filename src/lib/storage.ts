import { firebaseStorage } from './firebaseStorage';
import { Client, MetricEntry, UserSettings, Sale, CommercialGoal, MonthlyPayment, FinancialRelease, RecurringBill, FinancialGoal, Creative } from '../types';

export const storage = {
  // Payments
  getPayments: async (month: number, year: number): Promise<MonthlyPayment[]> => {
    return await firebaseStorage.getPayments(month, year);
  },

  savePayment: async (payment: MonthlyPayment) => {
    await firebaseStorage.savePayment(payment);
  },

  getClients: async (): Promise<Client[]> => {
    return await firebaseStorage.getClients();
  },
  
  saveClient: async (client: Client) => {
    await firebaseStorage.saveClient(client);
  },

  deleteClient: async (id: string) => {
    await firebaseStorage.deleteClient(id);
  },

  listenToClients: (callback: (clients: Client[]) => void) => {
    return firebaseStorage.listenToClients(callback);
  },

  listenToAllEntries: (callback: (entries: MetricEntry[]) => void) => {
    return firebaseStorage.listenToAllEntries(callback);
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
  },

  // FOLHA
  getFinancialReleases: async (): Promise<FinancialRelease[]> => {
    return await firebaseStorage.getFinancialReleases();
  },

  saveFinancialRelease: async (release: FinancialRelease) => {
    await firebaseStorage.saveFinancialRelease(release);
  },

  deleteFinancialRelease: async (id: string) => {
    await firebaseStorage.deleteFinancialRelease(id);
  },

  getRecurringBills: async (): Promise<RecurringBill[]> => {
    return await firebaseStorage.getRecurringBills();
  },

  saveRecurringBill: async (bill: RecurringBill) => {
    await firebaseStorage.saveRecurringBill(bill);
  },

  deleteRecurringBill: async (id: string) => {
    await firebaseStorage.deleteRecurringBill(id);
  },

  getFinancialGoals: async (): Promise<FinancialGoal[]> => {
    return await firebaseStorage.getFinancialGoals();
  },

  saveFinancialGoal: async (goal: FinancialGoal) => {
    await firebaseStorage.saveFinancialGoal(goal);
  },

  // CREATIVES
  getCreatives: async (): Promise<Creative[]> => {
    return await firebaseStorage.getCreatives();
  },

  saveCreative: async (creative: Creative) => {
    await firebaseStorage.saveCreative(creative);
  },

  deleteCreative: async (id: string) => {
    await firebaseStorage.deleteCreative(id);
  }
};
