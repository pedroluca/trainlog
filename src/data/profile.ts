import { collection, deleteField, doc, getDoc, getDocs, query, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import type { Privacidade, UserProfile } from './user-profile'

// Mesmas regras do app nativo (tractus-app/src/data/profile.ts)

const userRef = (userId: string) => doc(db, 'usuarios', userId)

/** Perfil de outra pessoa: garante um nome para exibir */
export function asOtherUser(id: string, data: DocumentData | undefined): UserProfile {
  const nome = typeof data?.nome === 'string' && data.nome.trim() ? data.nome : 'Usuário'
  return { ...data, id, nome } as UserProfile
}

/** Busca por id do documento ou, se não existir, por username */
export async function findUserByIdOrUsername(idOrUsername: string): Promise<UserProfile | null> {
  const byId = await getDoc(userRef(idOrUsername))
  if (byId.exists()) return asOtherUser(byId.id, byId.data())

  const byUsername = await getDocs(query(collection(db, 'usuarios'), where('username', '==', idOrUsername)))
  const match = byUsername.docs[0]
  return match ? asOtherUser(match.id, match.data()) : null
}

export class UsernameTakenError extends Error {}

export type ProfileEdit = {
  nome: string
  username: string
  bio: string
  dataNascimento: string
  instagram: string
  isTrainer: boolean
  cref: string
}

export async function saveProfile(current: UserProfile, edit: ProfileEdit) {
  const username = edit.username.trim().replace(/^@/, '')

  if (username && username !== current.username) {
    const snapshot = await getDocs(query(collection(db, 'usuarios'), where('username', '==', username)))
    if (snapshot.docs.some(userDoc => userDoc.id !== current.id)) {
      throw new UsernameTakenError(`O username "@${username}" já está em uso.`)
    }
  }

  const data: DocumentData = {
    nome: edit.nome.trim(),
    username,
    bio: edit.bio.trim(),
    dataNascimento: edit.dataNascimento,
    instagram: edit.instagram.replace(/^@/, '').trim(),
    isTrainer: edit.isTrainer,
    cref: edit.isTrainer ? edit.cref.trim().toUpperCase() : '',
  }

  if (edit.isTrainer !== !!current.isTrainer) {
    // Perfis antigos sem o campo `badges` derivam as badges das flags; parte delas para não perdê-las
    const seed = current.badges?.length
      ? current.badges
      : [current.isFounder && 'founder', current.isPremium && 'premium', current.isTrainer && 'trainer'].filter((id): id is string => !!id)
    const badges = new Set(seed)
    if (edit.isTrainer) badges.add('trainer')
    else badges.delete('trainer')
    data.badges = Array.from(badges)
  }

  await updateDoc(userRef(current.id), data)
}

/** Atualiza campos soltos do perfil (preferências) */
export async function updateUserFields(userId: string, fields: DocumentData) {
  await updateDoc(userRef(userId), fields)
}

export async function savePrivacy(userId: string, privacidade: Privacidade) {
  await updateDoc(userRef(userId), { privacidade })
}

export async function setProfilePhoto(userId: string, url: string | null) {
  await updateDoc(userRef(userId), { photoURL: url ?? deleteField() })
}

export class InvalidImageError extends Error {}

/** Envia a foto para o endpoint PHP (o mesmo do app) e devolve a URL pública */
export async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new InvalidImageError('Selecione uma imagem válida.')
  if (file.size > 5 * 1024 * 1024) throw new InvalidImageError('A imagem deve ter no máximo 5 MB.')

  const formData = new FormData()
  formData.append('image', file)
  formData.append('userId', userId)

  const response = await fetch(import.meta.env.VITE_API_UPLOAD_URL, { method: 'POST', body: formData })
  if (!response.ok) throw new Error('Falha no upload da imagem')
  const data = await response.json()
  if (!data.success || !data.imageUrl) throw new Error(data.message || 'Falha no upload da imagem')
  return data.imageUrl as string
}
