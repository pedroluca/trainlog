import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { notifyAdmins } from '../utils/admin-notifications'
import type { UserProfile } from './user-profile'

/** Dados do pagamento do Premium (os mesmos de tractus-app/src/data/content.ts) */
export const PREMIUM = {
  price: 'R$ 9,90',
  pixKey: 'suporte@trainlog.site',
  whatsapp: '5571982434416',
  supportEmail: 'suporte@trainlog.site',
}

/** Registra o pedido para os admins liberarem depois que o comprovante chegar */
export async function requestPremiumUpgrade(profile: UserProfile) {
  await addDoc(collection(db, 'upgrade_requests'), {
    userId: profile.id,
    userName: profile.nome ?? '',
    userEmail: profile.email ?? '',
    userPhone: profile.telefone ?? '',
    message: 'Upgrade direto via App',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  notifyAdmins('Nova solicitação de Premium!', `${profile.nome} (${profile.email}) solicitou upgrade para Premium.`, '/admin/dashboard')
    .catch(error => console.error('Erro ao avisar os admins:', error))
}
