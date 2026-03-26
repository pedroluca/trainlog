# TrainLog - Cron Jobs

Esta pasta agora contem apenas rotinas sem envio por FCM.

## Estado atual

- FCM foi removido do fluxo de push.
- O endpoint `cron-reminders.php` envia push via OneSignal para quem ainda nao treinou no dia.
- `cron-weekly-report.php` continua enviando apenas e-mail.
- `sync-users.php` sincroniza dados basicos dos usuarios para `users-cache.json`.

## Scripts

- `cron-reminders.php`: valida `lastWorkoutDate` e envia push para usuarios elegiveis.
- `cron-weekly-report.php`: envio de relatorio semanal por e-mail.
- `sync-users.php`: sincronizacao de usuarios para cache local.
- `test-simple-send.php`: trigger manual para teste rapido de push via OneSignal.
- `config.php`: segredo e configuracoes comuns.

## Trigger manual - test-simple-send

Use para validar envio OneSignal sem depender do cron completo.

Requisitos:

- `secret` (mesmo `CRON_SECRET` do `config.php`)
- `external_id` (UID Firebase) ou `subscription_id`

Exemplo por `external_id`:

```bash
curl "https://app.trainlog.site/api/cron/test-simple-send.php?secret=SEU_CRON_SECRET&external_id=UID_DO_USUARIO&title=Novo%20treino&body=Seu%20treino%20de%20hoje%20ja%20esta%20disponivel&url=https%3A%2F%2Fapp.trainlog.site%2Ftrain"
```

Exemplo por `subscription_id`:

```bash
curl "https://app.trainlog.site/api/cron/test-simple-send.php?secret=SEU_CRON_SECRET&subscription_id=ONESIGNAL_SUBSCRIPTION_ID"
```

## Regra de envio

O `cron-reminders.php` segue esta regra:

- se `lastWorkoutDate` for hoje: nao envia;
- se nao for hoje: envia push OneSignal.
