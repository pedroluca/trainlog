import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import adminLogo from '../assets/admin-logo.png'

/**
 * Notifica todos os usuários com `isAdmin == true` no Firebase
 * através do envio de push notification em lote.
 */
export async function notifyAdmins(title: string, body: string, targetPath: string = '/admin/dashboard') {
  try {
    // 1. Busca no Firestore quem são os Admins
    const q = query(
      collection(db, 'usuarios'),
      where('isAdmin', '==', true)
    )
    
    const snapshot = await getDocs(q)
    
    // 2. Extrai os IDs de assinatura válidos
    const targetIds: string[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      // Priorizamos o campo oneSignalSubscriptionId ou player_id
      const pushId = data.oneSignalSubscriptionId || data.player_id
      if (pushId && typeof pushId === 'string' && pushId.length > 10) {
        targetIds.push(pushId)
      }
    })

    if (targetIds.length === 0) {
      console.log('Nenhum admin com Push Notification ativa encontrado. Notificação ignorada.')
      return false
    }

    // 3. Envia para a API PHP rodar o push seguro agrupado
    const CRON_SECRET = import.meta.env.VITE_CRON_SECRET || 'tlg_2ab6ApP7sc1SE_BKyuem_zag7Z7'
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://trainlog.site/api'
    
    // Converte rota relativa (ex: '/admin/dashboard/users') em absoluta do App.
    const baseUrl = window.location.origin
    const url = targetPath.startsWith('http') ? targetPath : `${baseUrl}${targetPath}`
    const iconUrl = `${baseUrl}${adminLogo}`

    const response = await fetch(`${API_BASE}/send-admin-push.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: CRON_SECRET,
        target_ids: targetIds,
        title,
        body,
        url,
        icon: iconUrl
      }),
    })

    const data = await response.json()
    console.log('Admin Push Result:', data)
    return data.status === 'success'
  } catch (error) {
    console.error('Erro ao notificar admins:', error)
    return false
  }
}
