import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'
import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'

initializeApp()
const firestore = getFirestore()

const SMTP_HOST = defineSecret('PLAY_TESTER_SMTP_HOST')
const SMTP_PORT = defineSecret('PLAY_TESTER_SMTP_PORT')
const SMTP_USER = defineSecret('PLAY_TESTER_SMTP_USER')
const SMTP_PASS = defineSecret('PLAY_TESTER_SMTP_PASS')
const SMTP_FROM = defineSecret('PLAY_TESTER_SMTP_FROM')

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.trainlog.app'

type GooglePlayWaitlistDoc = {
  email?: string
  status?: 'pending' | 'invited_on_google_play' | 'access_email_sent'
  source?: string
  locale?: string
  userAgent?: string
  requestCount?: number
  createdAt?: unknown
  updatedAt?: unknown
  invitedAt?: unknown
  emailedAt?: unknown
  accessLink?: string
  processedBy?: string
}

const buildEmailHtml = (email: string) => `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#0b0b0b; color:#fff; padding:32px;">
    <div style="max-width:600px; margin:0 auto; background:#111; border:1px solid #1f1f1f; border-radius:24px; padding:32px;">
      <h1 style="margin:0 0 16px; font-size:28px; line-height:1.15;">Seu acesso ao Tractus foi liberado</h1>
      <p style="margin:0 0 24px; color:#cfcfcf; line-height:1.6;">Oi, ${email}! Sua entrada na lista de acesso antecipado foi aprovada. Agora você pode abrir o app pela Google Play.</p>
      <a href="${PLAY_STORE_URL}" style="display:inline-block; background:#27AE60; color:#000; text-decoration:none; font-weight:700; padding:14px 22px; border-radius:14px;">Abrir na Google Play</a>
      <p style="margin:24px 0 0; color:#9ca3af; font-size:13px; line-height:1.6;">Se o botão não abrir, copie este link: ${PLAY_STORE_URL}</p>
    </div>
  </div>
`

const buildEmailText = (email: string) => [
  `Oi, ${email}!`,
  '',
  'Seu acesso ao Tractus na Google Play foi liberado.',
  '',
  `Abra aqui: ${PLAY_STORE_URL}`,
  '',
  'Se tiver qualquer problema, responda este e-mail.',
].join('\n')

export const sendGooglePlayAccessEmail = onDocumentUpdated(
  {
    document: 'google_play_waitlist/{leadId}',
    secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM],
  },
  async (event) => {
    const before = event.data?.before.data() as GooglePlayWaitlistDoc | undefined
    const after = event.data?.after.data() as GooglePlayWaitlistDoc | undefined

    if (!after?.email) {
      logger.warn('google_play_waitlist document without email, skipping', { leadId: event.params.leadId })
      return
    }

    if (before?.status === after.status) {
      return
    }

    if (after.status !== 'invited_on_google_play' || after.emailedAt) {
      return
    }

    const host = SMTP_HOST.value()
    const port = Number.parseInt(SMTP_PORT.value(), 10)
    const user = SMTP_USER.value()
    const pass = SMTP_PASS.value()
    const from = SMTP_FROM.value()

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    })

    const subject = 'Seu acesso ao Tractus na Google Play'
    const text = buildEmailText(after.email)
    const html = buildEmailHtml(after.email)

    await transporter.sendMail({
      from,
      to: after.email,
      subject,
      text,
      html,
    })

    await firestore.collection('google_play_waitlist').doc(event.params.leadId).update({
      status: 'access_email_sent',
      accessLink: PLAY_STORE_URL,
      emailedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    logger.info('Google Play access email sent', {
      leadId: event.params.leadId,
      email: after.email,
    })
  }
)