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
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Client, MetricEntry, UserSettings } from '../types';

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
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

export const firebaseStorage = {
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
  }
};
