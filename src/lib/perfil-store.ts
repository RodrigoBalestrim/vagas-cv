'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, PROFILE_VAZIO } from './user-profile';

export async function carregarPerfil(uid: string): Promise<UserProfile> {
  try {
    const snap = await getDoc(doc(db, 'perfis', uid));
    if (snap.exists()) {
      return { ...PROFILE_VAZIO, ...(snap.data() as Partial<UserProfile>) };
    }
    return PROFILE_VAZIO;
  } catch {
    return PROFILE_VAZIO;
  }
}

export async function salvarPerfil(uid: string, perfil: UserProfile): Promise<void> {
  await setDoc(doc(db, 'perfis', uid), perfil);
}