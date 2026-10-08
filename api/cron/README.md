# Tractus - Cron Jobs

Esta pasta agora contem apenas rotinas sem envio por FCM.

## Estado atual

- FCM foi removido do fluxo de push.
- O endpoint `cron-reminders.php` envia push via OneSignal para quem ainda nao treinou no dia.
- `cron-weekly-report.php` continua enviando apenas e-mail.
- `sync-users.php` sincroniza dados basicos dos usuarios para `users-cache.json`.
- `cron-streak-leader.php` roda no fim do dia: recalcula a streak de todo mundo (sem depender do usuario abrir o app) e mantem a badge `streak-leader` atualizada.

## Scripts

- `cron-reminders.php`: valida `lastWorkoutDate` e envia push para usuarios elegiveis.
- `cron-weekly-report.php`: envio de relatorio semanal por e-mail.
- `cron-streak-leader.php`: manutencao diaria de streak/freeze + elege quem tem a maior `currentStreak` do dia e ajusta a badge `streak-leader`.
- `sync-users.php`: sincronizacao de usuarios para cache local.
- `test-simple-send.php`: trigger manual para teste rapido de push via OneSignal.
- `onesignal.php`: envio de push compartilhado (crons e endpoints da pasta `api/`).
- `config.php`: segredos e configuracoes comuns (nao vai para o git).

## Credenciais e segredos (config.php)

- **Conta de servico do Firebase:** `domains/<dominio>/firebase/firebase-credentials.json`, ao lado (fora) do
  `public_html`. O caminho sai da propria pasta do `config.php`, entao nao
  depende do numero da conta nem do dominio. Em outubro/2026 os crons ficaram
  semanas falhando porque o caminho estava fixo na conta antiga (`trainlog.site`).
- **`CRON_SECRET`:** so os comandos do hPanel conhecem. Libera os crons.
- **`PUSH_SECRET`:** o que o web e o app usam (`send-admin-push.php`,
  `send-friend-request-notification.php`). Vai no bundle, entao e publico na
  pratica e nao libera os crons. As unicas excecoes sao o que o painel admin
  dispara: `test-simple-send.php` e o `cron-weekly-report.php?test_email=...`.

## Como o push e enviado

Tudo passa por `send_push_to_user()` em `onesignal.php`: o push vai pelo UID do
Firebase (`external_id` no OneSignal), que o app nativo, o webview e o web
registram no login, entao chega em todos os aparelhos do usuario. Os ids de
aparelho salvos no Firestore (`oneSignalSubscriptionId`, `player_id`) so sao
usados se ninguem recebeu pelo UID (aparelho antigo que nunca vinculou o UID).

O OneSignal responde 200 mesmo quando nenhum aparelho recebe; nesse caso o `id`
vem vazio. Os scripts tratam isso como "nao entregue" (com o motivo no log), e
nao como enviado.

## cron-streak-leader

Deve rodar 1x por dia, perto da meia-noite (fim do dia).

Faz duas coisas, nessa ordem:

1. **Manutencao de streak (server-side).** Replica a regra do modo `maintenance`
   de `syncStreakState` em `src/data/streak-utils.ts`. A streak e **semanal**
   (1 treino por semana, Dom-Sab): conta as semanas inteiras sem treino desde
   `lastStreakWeek`, consome um freeze por semana perdida se tiver saldo, ou
   zera `currentStreak` se nao tiver. Quem ainda nao abriu o app desde a mudanca
   para semanal (`streakVersion` diferente de 2) fica de fora: o app recalcula
   pelos logs na proxima abertura.
   > Importante: essa e uma copia da logica de `streak-utils.ts` (web) e de
   > `src/data/streak.ts` (tractus-app). Se a regra de freeze/streak mudar la,
   > replique a mudanca em `cron-streak-leader.php` tambem. Este arquivo nao
   > esta no git (a pasta `api/` esta no `.gitignore`), entao a mudanca nao
   > aparece no diff: foi assim que ele ficou na regra diaria por um tempo.
2. **Badge `streak-leader`.** Com a `currentStreak` ja corrigida, descobre o
   maior valor do dia (empates: todos os empatados recebem a badge), concede
   a quem bateu a streak maxima e ainda nao tinha a badge, e remove de quem
   tinha e deixou de ser o lider. Se ninguem tiver `currentStreak > 0`, a
   badge e removida de todo mundo (nenhum lider naquele dia).

Tambem dispara push via OneSignal (mesmo mecanismo do `cron-reminders.php`):

- para quem teve a streak zerada na manutencao (fase 1);
- para quem perdeu a badge `streak-leader` na fase 2.

Push nao e enviado em `dry_run=1`.

Parametros de query:

- `secret` (obrigatorio, mesmo `CRON_SECRET` do `config.php`)
- `dry_run=1`: calcula tudo mas nao grava nada no Firestore (bom para validar antes de agendar).
- `debug=1`: inclui no JSON de resposta o detalhe de cada usuario alterado.

Exemplo (teste sem gravar):

```bash
curl "https://apptractus.com.br/api/cron/cron-streak-leader.php?secret=SEU_CRON_SECRET&dry_run=1&debug=1"
```

Exemplo (execucao real, para agendar no cron do servidor):

```bash
wget -q -O- "https://apptractus.com.br/api/cron/cron-streak-leader.php?secret=SEU_CRON_SECRET"
```

## Trigger manual - test-simple-send

Use para validar envio OneSignal sem depender do cron completo.

Requisitos:

- `secret` (mesmo `CRON_SECRET` do `config.php`)
- `external_id` (UID Firebase) ou `subscription_id`

Exemplo por `external_id`:

```bash
curl "https://apptractus.com.br/api/cron/test-simple-send.php?secret=SEU_CRON_SECRET&external_id=UID_DO_USUARIO&title=Novo%20treino&body=Seu%20treino%20de%20hoje%20ja%20esta%20disponivel&url=https%3A%2F%2Fapptractus.com.br%2Ftrain"
```

Exemplo por `subscription_id`:

```bash
curl "https://apptractus.com.br/api/cron/test-simple-send.php?secret=SEU_CRON_SECRET&subscription_id=ONESIGNAL_SUBSCRIPTION_ID"
```

## Regra de envio

O `cron-reminders.php` segue esta regra:

- se `lastWorkoutDate` for hoje: nao envia;
- se nao for hoje: envia push OneSignal.

## Monitoramento (heartbeat / dead man's switch)

Em julho/2026 os 3 crons (`cron-reminders`, `cron-weekly-report`, `sync-users`)
ficaram **7 dias sem rodar** (agendador do Hostinger parou de disparar) sem
gerar nenhum erro ou alerta - so foi notado ao checar manualmente. O botao
"View Output" do hPanel tambem se mostrou nao confiavel (chegou a exibir
conteudo de um dominio diferente do configurado no comando).

Pra nao depender de checagem manual, cada script agora manda um ping pra um
servico externo de heartbeat (ex: [healthchecks.io](https://healthchecks.io),
free) ao final de uma execucao bem-sucedida, via `ping_healthcheck()` em
`config.php`. Se o ping esperado nao chegar dentro do prazo configurado no
servico, ele avisa por e-mail sozinho - sem depender do cron do Hostinger
pra isso, entao continua funcionando mesmo se o agendador falhar de novo.

### Setup

1. Crie uma conta gratuita em https://healthchecks.io.
2. Crie um "check" pra cada job, com o periodo batendo no schedule real do
   cron (confira em hPanel -> Cron Jobs):
   - `sync-users` -> periodo 30 min, grace ~15 min
   - `cron-reminders` -> periodo 4h, grace ~30 min
   - `cron-streak-leader` -> periodo 1 dia, grace ~1h
   - `cron-weekly-report` -> periodo 1 semana, grace ~3h
3. Copie a "Ping URL" de cada check (formato `https://hc-ping.com/<uuid>`).
4. Cole cada URL na constante `HEALTHCHECK_PING_URLS` em `config.php` (ou
   defina as env vars `HC_PING_CRON_REMINDERS`, `HC_PING_CRON_WEEKLY_REPORT`,
   `HC_PING_CRON_STREAK_LEADER`, `HC_PING_SYNC_USERS` no servidor).
5. Reenvie `config.php` (e os `.php` dos crons, se ainda nao tiver feito)
   pro servidor.
6. Confirme no dashboard do healthchecks.io que cada check fica verde apos a
   proxima execucao natural do respectivo cron.

Se um job nao configurar sua URL (deixar `''`), o ping e simplesmente
ignorado - nao quebra a execucao do cron.
