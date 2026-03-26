# OneSignal Migration Guide

## O que voce precisa pegar no OneSignal

No dashboard da OneSignal, copie estes dados:

1. `App ID`
2. `REST API Key`
3. `Web Push (VAPID) Public Key`
4. `Safari Web ID` (se for usar Safari/iOS web push)
5. `User Auth Key` (opcional, apenas para chamadas administrativas)

## Estrategia de identificacao (external_id)

Use `external_id` = UID do Firebase.

Isso permite enviar push por usuario sem depender de token manual no Firestore:

- frontend chama `OneSignal.login(uid)`
- backend envia para `include_aliases.external_id`
- se o token/inscricao mudar no dispositivo, o OneSignal continua resolvendo o usuario pelo mesmo UID

## Configuracao recomendada no projeto

Variaveis de ambiente frontend:

- `VITE_ONESIGNAL_APP_ID`
- `VITE_ONESIGNAL_SAFARI_WEB_ID` (opcional)

Variaveis de ambiente backend:

- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

## Dados que devem ser salvos no Firestore por usuario

No documento `usuarios/{uid}`:

- `oneSignalSubscriptionId`
- `oneSignalPlayerId` (legado, opcional)
- `pushProvider: "onesignal"`
- `oneSignalExternalId` (igual ao UID)

## Fluxo de envio (backend)

1. `sync-users.php` traz usuarios com email + ids OneSignal
2. `cron-reminders.php` filtra elegiveis (nao treinou hoje)
3. Envia POST para `https://api.onesignal.com/notifications`
4. Em caso de subscription invalida, limpar `oneSignalSubscriptionId` do usuario

## iOS (Web App) - requisitos obrigatorios

Para push funcionar no iPhone/iPad com webapp:

1. iOS/iPadOS 16.4+
2. App aberto pelo icone na Tela de Inicio (PWA instalado)
3. HTTPS no dominio final (`https://app.trainlog.site`)
4. Permissao de notificacao concedida pelo usuario apos instalar o PWA
5. Configuracao completa de Web Push no OneSignal (incluindo etapa Apple/Safari quando o painel solicitar)

Observacao: push no iOS Safari em aba comum pode nao funcionar como no app instalado. O caminho confiavel e via PWA na Tela de Inicio.

## Endpoint basico de envio (referencia)

```bash
curl -X POST https://api.onesignal.com/notifications \
  -H "Authorization: Key $ONESIGNAL_REST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "'$ONESIGNAL_APP_ID'",
    "include_subscription_ids": ["SUBSCRIPTION_ID"],
    "headings": {"en": "Hora do Treino!"},
    "contents": {"en": "Voce ainda nao treinou hoje."},
    "url": "https://app.trainlog.site/train"
  }'
```
