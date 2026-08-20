'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Formato dos dados que qualquer componente pode ler via useAuth()
interface AuthContextType {
  user: User | null;            // usuário logado (ou null se deslogado)
  loading: boolean;             // true enquanto o Firebase restaura a sessão
  logout: () => Promise<void>;  // desloga o usuário
  getToken: () => Promise<string>; // retorna o ID token (usado no Bearer das API)
}

// Valor padrão enquanto o provider ainda não inicializou
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  getToken: async () => '',
});

// Provider global de autenticação. Envolve o app inteiro (em layout.tsx) e
// escuta mudanças de estado de login do Firebase (onAuthStateChanged):
// - usuário loga/desloga → user é atualizado em todas as páginas automaticamente.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Registrar o listener UMA vez. Retorna a função de unsubscribe p/ limpeza.
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false); // sessão restaurada (logado ou não)
    });
    return () => unsub();
  }, []);

  // Encerra a sessão no Firebase
  const logout = async () => {
    await signOut(auth);
  };

  // ID token curto-vivido (JWT) do usuário — necessário nas chamadas autenticadas
  // às API routes (Authorization: Bearer <token>).
  const getToken = async (): Promise<string> => {
    if (!user) return '';
    try {
      return await user.getIdToken();
    } catch {
      return '';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acesso: const { user, loading, logout, getToken } = useAuth();
export const useAuth = () => useContext(AuthContext);