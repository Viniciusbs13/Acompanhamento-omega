import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where, setDoc, deleteDoc, onSnapshot, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, ModulePermissions } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../lib/permissions';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasPermission: (module: string, action: string) => boolean;
  isClientAllowed: (clientId: string) => boolean;
  isProcessAllowed: (processId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);

      if (currUser) {
        const userRef = doc(db, 'users', currUser.uid);
        let d = await getDoc(userRef);

        let userProfile: UserProfile | null = null;

        if (d.exists()) {
          userProfile = d.data() as UserProfile;
          const isOmegaAdmin = currUser.email === 'assessoriaomega1@gmail.com';
          const updates: any = { lastAccess: new Date().toISOString() };
          if (isOmegaAdmin && userProfile.roleName !== 'Administrador') {
            updates.roleName = 'Administrador';
            updates.team = 'Diretoria';
            userProfile.roleName = 'Administrador';
            userProfile.team = 'Diretoria';
          }
          // Update last access (and role if Omega Admin)
          await setDoc(userRef, updates, { merge: true });
        } else {
          // Check if there's a pre-created profile matching this email
          const q = query(collection(db, 'users'), where('email', '==', currUser.email));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const oldDoc = snap.docs[0];
            const oldData = oldDoc.data();
            userProfile = {
              ...oldData,
              id: currUser.uid,
              lastAccess: new Date().toISOString()
            } as UserProfile;

            const isOmegaAdmin = currUser.email === 'assessoriaomega1@gmail.com';
            if (isOmegaAdmin) {
              userProfile.roleName = 'Administrador';
              userProfile.team = 'Diretoria';
            }

            await setDoc(userRef, userProfile);
            if (oldDoc.id !== currUser.uid) {
              await deleteDoc(oldDoc.ref);
            }
          } else {
            // First user or Omega Admin is Administrator
            const allUsersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
            const isFirstUser = allUsersSnap.empty;
            const isOmegaAdmin = currUser.email === 'assessoriaomega1@gmail.com';

            const defaultRole = (isFirstUser || isOmegaAdmin) ? 'Administrador' : 'Atendimento';

            const names = currUser.displayName ? currUser.displayName.split(' ') : ['Colaborador', 'Ômega'];
            userProfile = {
              id: currUser.uid,
              managerName: currUser.displayName || 'Colaborador',
              theme: 'light',
              firstName: names[0],
              lastName: names.slice(1).join(' ') || 'Ômega',
              email: currUser.email || '',
              photoUrl: currUser.photoURL || '',
              status: 'ACTIVE',
              roleName: defaultRole,
              team: (isFirstUser || isOmegaAdmin) ? 'Diretoria' : 'Atendimento',
              createdAt: new Date().toISOString(),
              lastAccess: new Date().toISOString()
            } as UserProfile;

            await setDoc(userRef, userProfile);
          }
        }

        if (userProfile) {
          setProfile(userProfile);
        }

        // Set real-time listener for user profile
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
        });

      } else {
        setProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Sync roles from DB for real-time permissions update
  useEffect(() => {
    if (!profile) {
      setRoles([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'roles'), (snap) => {
      setRoles(snap.docs.map(d => ({ ...d.data(), id: d.id } as UserRole)));
    });
    return unsub;
  }, [profile]);

  // Handle Light / Dark theme toggling dynamically
  useEffect(() => {
    if (profile?.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [profile?.theme]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = profile?.roleName === 'Administrador' || user?.email === 'assessoriaomega1@gmail.com';

  const hasPermission = (module: string, action: string): boolean => {
    if (!profile) {
      if (user?.email === 'assessoriaomega1@gmail.com') return true;
      return false;
    }
    if (profile.status === 'INACTIVE' && user?.email !== 'assessoriaomega1@gmail.com') return false;

    // Administrator has total access
    if (profile.roleName === 'Administrador' || user?.email === 'assessoriaomega1@gmail.com') return true;

    // 1. Check custom overrides
    const custom = profile.customPermissions?.[module];
    if (custom !== undefined && custom[action as keyof ModulePermissions] !== undefined) {
      return !!custom[action as keyof ModulePermissions];
    }

    // 2. Check Role from DB
    const dbRole = roles.find(r => r.name === profile.roleName || r.id === profile.roleId);
    if (dbRole) {
      const rolePerm = dbRole.permissions?.[module];
      if (rolePerm !== undefined && rolePerm[action as keyof ModulePermissions] !== undefined) {
        return !!rolePerm[action as keyof ModulePermissions];
      }
    }

    // 3. Fallback to default static configuration
    const defaultPerm = DEFAULT_ROLE_PERMISSIONS[profile.roleName || '']?.[module];
    if (defaultPerm !== undefined && defaultPerm[action as keyof ModulePermissions] !== undefined) {
      return !!defaultPerm[action as keyof ModulePermissions];
    }

    return false;
  };

  const isClientAllowed = (clientId: string): boolean => {
    if (user?.email === 'assessoriaomega1@gmail.com') return true;
    if (!profile) return false;
    if (profile.roleName === 'Administrador') return true;
    if (!profile.restrictedClients || profile.restrictedClients.length === 0) return true;
    return profile.restrictedClients.includes(clientId);
  };

  const isProcessAllowed = (processId: string): boolean => {
    if (user?.email === 'assessoriaomega1@gmail.com') return true;
    if (!profile) return false;
    if (profile.roleName === 'Administrador') return true;
    if (!profile.restrictedProcesses || profile.restrictedProcesses.length === 0) return true;
    return profile.restrictedProcesses.includes(processId);
  };

  const isAuthReady = !loading && (!user || profile !== null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading: !isAuthReady, 
      signInWithGoogle, 
      logout,
      isAdmin,
      hasPermission,
      isClientAllowed,
      isProcessAllowed
    }}>
      {isAuthReady && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
