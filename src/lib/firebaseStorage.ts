import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  collectionGroup
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Client, MetricEntry, UserSettings, Sale, CommercialGoal, MonthlyPayment, FinancialRelease, RecurringBill, FinancialGoal } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanData(data: any) {
  const clean = { ...data };
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      delete clean[key];
    } else if (typeof clean[key] === 'number' && isNaN(clean[key])) {
      clean[key] = 0;
    } else if (clean[key] !== null && typeof clean[key] === 'object' && !Array.isArray(clean[key])) {
      clean[key] = cleanData(clean[key]);
    }
  });
  return clean;
}

const CLIENTS_COL = 'clients';
const USERS_COL = 'users';
const SALES_COL = 'sales';
const GOALS_COL = 'goals';
const PAYMENTS_COL = 'payments';
const FINANCIAL_RELEASES_COL = 'financial_releases';
const RECURRING_BILLS_COL = 'recurring_bills';
const FINANCIAL_GOALS_COL = 'financial_goals';

export const firebaseStorage = {
  // Payments
  getPayments: async (month: number, year: number): Promise<MonthlyPayment[]> => {
    if (!auth.currentUser) return [];
    const path = PAYMENTS_COL;
    try {
      const q = query(
        collection(db, path), 
        where('ownerId', '==', auth.currentUser.uid),
        where('month', '==', month),
        where('year', '==', year)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MonthlyPayment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  savePayment: async (payment: MonthlyPayment) => {
    if (!auth.currentUser) return;
    const path = `${PAYMENTS_COL}/${payment.id}`;
    try {
      await setDoc(doc(db, PAYMENTS_COL, payment.id), cleanData({
        ...payment,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Sales
  getSales: async (monthYear?: string): Promise<Sale[]> => {
    if (!auth.currentUser) return [];
    const path = SALES_COL;
    try {
      let q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid), orderBy('date', 'desc'));
      if (monthYear) {
        // Simple string prefix query for "YYYY-MM" if we format dates correctly
        // Or we can filter in JS for simplicity since sales volume per month is usually manageable
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Sale));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveSale: async (sale: Sale) => {
    if (!auth.currentUser) return;
    const path = `${SALES_COL}/${sale.id}`;
    try {
      await setDoc(doc(db, SALES_COL, sale.id), cleanData({
        ...sale,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteSale: async (id: string) => {
    const path = `${SALES_COL}/${id}`;
    try {
      await deleteDoc(doc(db, SALES_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Goals
  getGoals: async (): Promise<CommercialGoal[]> => {
    if (!auth.currentUser) return [];
    const path = GOALS_COL;
    try {
      const q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CommercialGoal));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveGoal: async (goal: CommercialGoal) => {
    if (!auth.currentUser) return;
    const path = `${GOALS_COL}/${goal.id}`;
    try {
      await setDoc(doc(db, GOALS_COL, goal.id), cleanData({
        ...goal,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
  // Clients
  getClients: async (): Promise<Client[]> => {
    if (!auth.currentUser) return [];
    const path = CLIENTS_COL;
    try {
      const q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Client));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveClient: async (client: Client) => {
    if (!auth.currentUser) return;
    const path = `${CLIENTS_COL}/${client.id}`;
    try {
      await setDoc(doc(db, CLIENTS_COL, client.id), cleanData({
        ...client,
        ownerId: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteClient: async (id: string) => {
    const path = `${CLIENTS_COL}/${id}`;
    try {
      await deleteDoc(doc(db, CLIENTS_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  listenToClients: (callback: (clients: Client[]) => void) => {
    if (!auth.currentUser) return () => {};
    const path = CLIENTS_COL;
    const q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Client));
      callback(clients);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  listenToAllEntries: (callback: (entries: MetricEntry[]) => void) => {
    if (!auth.currentUser) return () => {};
    const q = query(
      collectionGroup(db, 'entries'),
      where('ownerId', '==', auth.currentUser.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MetricEntry));
      callback(entries);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'collectionGroup:entries');
    });
  },

  // Entries
  getEntries: async (clientId: string): Promise<MetricEntry[]> => {
    if (!auth.currentUser) return [];
    const path = `${CLIENTS_COL}/${clientId}/entries`;
    try {
      const q = query(
        collection(db, path), 
        where('ownerId', '==', auth.currentUser.uid),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MetricEntry));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveEntry: async (entry: MetricEntry) => {
    if (!auth.currentUser) return;
    const path = `${CLIENTS_COL}/${entry.clientId}/entries/${entry.id}`;
    try {
      await setDoc(doc(db, CLIENTS_COL, entry.clientId, 'entries', entry.id), cleanData({
        ...entry,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteEntry: async (clientId: string, entryId: string) => {
    const path = `${CLIENTS_COL}/${clientId}/entries/${entryId}`;
    try {
      await deleteDoc(doc(db, CLIENTS_COL, clientId, 'entries', entryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Settings
  getSettings: async (): Promise<UserSettings> => {
    if (!auth.currentUser) return { managerName: 'Gestor Ômega', theme: 'light' };
    const path = `${USERS_COL}/${auth.currentUser.uid}`;
    try {
      const d = await getDoc(doc(db, USERS_COL, auth.currentUser.uid));
      if (d.exists()) {
        return d.data() as UserSettings;
      }
      return { managerName: 'Gestor Ômega', theme: 'light' };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return { managerName: 'Gestor Ômega', theme: 'light' };
    }
  },

  saveSettings: async (settings: UserSettings) => {
    if (!auth.currentUser) return;
    const path = `${USERS_COL}/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, USERS_COL, auth.currentUser.uid), cleanData(settings), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // FOLHA - Financial Releases (Lançamentos Financeiros)
  getFinancialReleases: async (): Promise<FinancialRelease[]> => {
    if (!auth.currentUser) return [];
    const path = FINANCIAL_RELEASES_COL;
    try {
      const q = query(
        collection(db, path),
        where('ownerId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const releases = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FinancialRelease));
      releases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return releases;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveFinancialRelease: async (release: FinancialRelease) => {
    if (!auth.currentUser) return;
    const path = `${FINANCIAL_RELEASES_COL}/${release.id}`;
    try {
      await setDoc(doc(db, FINANCIAL_RELEASES_COL, release.id), cleanData({
        ...release,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteFinancialRelease: async (id: string) => {
    const path = `${FINANCIAL_RELEASES_COL}/${id}`;
    try {
      await deleteDoc(doc(db, FINANCIAL_RELEASES_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // FOLHA - Recurring Bills (Contas Recorrentes)
  getRecurringBills: async (): Promise<RecurringBill[]> => {
    if (!auth.currentUser) return [];
    const path = RECURRING_BILLS_COL;
    try {
      const q = query(
        collection(db, path),
        where('ownerId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as RecurringBill));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveRecurringBill: async (bill: RecurringBill) => {
    if (!auth.currentUser) return;
    const path = `${RECURRING_BILLS_COL}/${bill.id}`;
    try {
      await setDoc(doc(db, RECURRING_BILLS_COL, bill.id), cleanData({
        ...bill,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  deleteRecurringBill: async (id: string) => {
    const path = `${RECURRING_BILLS_COL}/${id}`;
    try {
      await deleteDoc(doc(db, RECURRING_BILLS_COL, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // FOLHA - Financial Goals (Metas Financeiras)
  getFinancialGoals: async (): Promise<FinancialGoal[]> => {
    if (!auth.currentUser) return [];
    const path = FINANCIAL_GOALS_COL;
    try {
      const q = query(
        collection(db, path),
        where('ownerId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FinancialGoal));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  saveFinancialGoal: async (goal: FinancialGoal) => {
    if (!auth.currentUser) return;
    const path = `${FINANCIAL_GOALS_COL}/${goal.id}`;
    try {
      await setDoc(doc(db, FINANCIAL_GOALS_COL, goal.id), cleanData({
        ...goal,
        ownerId: auth.currentUser.uid
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
