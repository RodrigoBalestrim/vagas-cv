'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, PROFILE_VAZIO } from './user-profile';

// Camada de persistência do perfil do usuário no Firestore.
// Cada usuário tem UM documento: perfis/{uid} (protegido pelas regras).

// Lê o perfil do usuário. Se não existir (ou der erro), devolve um perfil vazio
// para a UI nunca quebrar.
export async function carregarPerfil(uid: string): Promise<UserProfile> {
  try {
    const snap = await getDoc(doc(db, 'perfis', uid));
    if (snap.exists()) {
      // Mescla com o vazio para garantir que campos novos existam
      return { ...PROFILE_VAZIO, ...(snap.data() as Partial<UserProfile>) };
    }
    return PROFILE_VAZIO;
  } catch {
    return PROFILE_VAZIO;
  }
}

// Salva o perfil (cria ou sobrescreve o documento do usuário)
export async function salvarPerfil(uid: string, perfil: UserProfile): Promise<void> {
  await setDoc(doc(db, 'perfis', uid), perfil);
}