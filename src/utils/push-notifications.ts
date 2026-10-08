type PushNotificationParams = {
  /** UIDs do Firebase: o push chega em todos os aparelhos de cada usuário (external_id no OneSignal) */
  userIds: string[]
  title: string
  body: string
  url: string
  icon?: string
}

export async function sendOneSignalPushToUsers({
  userIds,
  title,
  body,
  url,
  icon
}: PushNotificationParams): Promise<boolean> {
  if (userIds.length === 0) return false

  const CRON_SECRET = import.meta.env.VITE_CRON_SECRET || 'tlg_2ab6ApP7sc1SE_BKyuem_zag7Z7'
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://apptractus.com.br/api'

  try {
    const baseUrl = window.location.origin
    const response = await fetch(`${API_BASE}/send-admin-push.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: CRON_SECRET,
        external_ids: userIds,
        title,
        body,
        url,
        icon: icon || `${baseUrl}/pwa-512x512.png`
      })
    })

    const data = await response.json().catch(() => null)
    return response.ok && data?.status === 'success'
  } catch (error) {
    console.error('Erro ao enviar push OneSignal:', error)
    return false
  }
}