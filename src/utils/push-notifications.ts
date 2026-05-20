type PushNotificationParams = {
  targetIds: string[]
  title: string
  body: string
  url: string
  icon?: string
}

export async function sendOneSignalPushToTargets({
  targetIds,
  title,
  body,
  url,
  icon
}: PushNotificationParams): Promise<boolean> {
  if (targetIds.length === 0) return false

  const CRON_SECRET = import.meta.env.VITE_CRON_SECRET || 'tlg_2ab6ApP7sc1SE_BKyuem_zag7Z7'
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://trainlog.site/api'

  try {
    const baseUrl = window.location.origin
    const response = await fetch(`${API_BASE}/send-admin-push.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: CRON_SECRET,
        target_ids: targetIds,
        title,
        body,
        url,
        icon: icon || `${baseUrl}/pwa-512x512.png`
      })
    })

    const data = await response.json().catch(() => null)
    return response.ok && data?.status !== 'error'
  } catch (error) {
    console.error('Erro ao enviar push OneSignal:', error)
    return false
  }
}