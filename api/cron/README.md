# 📬 TrainLog - FCM Cron Jobs

Pasta contendo scripts de automação para gerenciar notificações push e relatórios via Firebase Cloud Messaging.

## 📁 Estrutura

```
api/cron/
├── cron-reminders.php          # ⏰ Lembretes diários de treino
├── cron-weekly-report.php      # 📊 Relatório semanal + email
├── sync-users.js               # 👥 Sincroniza usuários (Node.js)
├── sync-users.php              # 👥 Sincroniza usuários (PHP)
├── firebase-helper.php         # 🔧 Classes reutilizáveis
├── test-fcm.php                # 🧪 Suite de testes
├── README.md                   # 📖 Este arquivo
├── *.log                       # 📝 Logs (criados automaticamente)
└── users-cache.json            # 💾 Cache de usuários
```

## 🎯 Scripts Principais

### 1. `cron-reminders.php`
**Função:** Enviar notificações de lembretes de treino  
**Frequência:** A cada 6 horas (0:00, 6:00, 12:00, 18:00)  
**Lógica:**
- Sincroniza usuários com FCM tokens
- Verifica se cada usuário tem treino registrado hoje
- Se NÃO tem treino: Envia notificação push
- Registra resultado em `cron-reminders.log`

**Uso:**
```bash
# Via hPanel Cron
wget -q -O- "https://seu-dominio.com/api/cron/cron-reminders.php?secret=SEU_SECRET"

# Via curl (alternativa mais segura)
curl -H "X-Cron-Secret: SEU_SECRET" https://seu-dominio.com/api/cron/cron-reminders.php

# Manual SSH
ssh seu-usuario@seu-host.com
curl "https://seu-dominio.com/api/cron/cron-reminders.php?secret=SEU_SECRET"
```

### 2. `cron-weekly-report.php`
**Função:** Enviar relatório semanal + email  
**Frequência:** Domingo às 20:00  
**Lógica:**
- Calcula estatísticas da semana por usuário
  - Total de treinos
  - Total de exercícios
  - Duração total em minutos
  - Grupos musculares trabalhados
- Monta HTML elegante do email
- Envia notificação push + email
- Registra resultado em `cron-weekly-report.log`

**Uso:**
```bash
# Via hPanel
wget -q -O- "https://seu-dominio.com/api/cron/cron-weekly-report.php?secret=SEU_SECRET"

# Manual
curl "https://seu-dominio.com/api/cron/cron-weekly-report.php?secret=SEU_SECRET"
```

### 3. `sync-users.js` ⭐ Recomendado
**Função:** Sincronizar usuários com FCM tokens do Firestore  
**Frequência:** 2x ao dia (08:00 e 20:00)  
**Pré-requisitos:**
- Node.js instalado no servidor
- `npm install firebase-admin`
- Arquivo `firebase-credentials.json` acessível

**Uso:**
```bash
ssh seu-usuario@seu-host.com

# Executar manualmente
node /home/seu-usuario/public_html/api/cron/sync-users.js

# Output esperado:
# ✅ Firebase Admin inicializado
# 📥 Buscando usuários do Firestore...
# 📊 Total de usuários: 42
# ✅ Usuários com FCM: 12
# ✅ Cache salvo com sucesso

# Adicionar ao cron
crontab -e
# Adicione: 0 8,20 * * * node /home/seu-usuario/public_html/api/cron/sync-users.js >> /home/seu-usuario/public_html/api/cron/sync-users.log 2>&1
```

### 4. `test-fcm.php`
**Função:** Validar setup completo de FCM  
**Testes disponíveis:**
- `?test=credentials` - Verifica arquivo de credenciais
- `?test=jwt` - Testa geração de JWT
- `?test=token` - Testa obtención de access token
- `?test=fcm` - Testa envio de notificação (requer `fcm_token`)
- `?test=cache` - Verifica cache de usuários
- `?test=permissions` - Valida permissões de arquivo
- `?test=logs` - Mostra logs dos scripts
- `?test=full` - Executa todos os testes

**Uso:**
```bash
# Teste completo
curl "https://seu-dominio.com/api/cron/test-fcm.php?secret=SEU_SECRET&test=full"

# Teste específico
curl "https://seu-dominio.com/api/cron/test-fcm.php?secret=SEU_SECRET&test=credentials"

# Enviar notificação (seu token)
curl "https://seu-dominio.com/api/cron/test-fcm.php?secret=SEU_SECRET&test=fcm&fcm_token=SEU_TOKEN"
```

## 🔧 Classes Auxiliares

### `firebase-helper.php`

#### `FirebaseHelper`
```php
$firebase = new FirebaseHelper('/caminho/para/firebase-credentials.json');

// Obter access token
$token = $firebase->get_access_token();

// Enviar notificação
$firebase->send_notification(
  $fcm_token,
  $title,
  $body,
  $data,
  $access_token
);

// Query Firestore
$firebase->query_firestore($collection, $field, $operator, $value, $access_token);
```

#### `UsersCache`
```php
$cache = new UsersCache('/caminho/users-cache.json');

// Carregar cache
$users = $cache->load();

// Salvar cache
$cache->save($users);

// Filtrar usuários com FCM
$users_with_fcm = $cache->get_users_with_fcm();

// Filtrar usuários com email
$users_with_email = $cache->get_users_with_email();
```

#### `CronLogger`
```php
$logger = new CronLogger('/caminho/cron.log');

$logger->log("Mensagem genérica");
$logger->success("✅ Sucesso");
$logger->error("❌ Erro");
$logger->warning("⚠️ Aviso");
$logger->info("ℹ️ Informação");
$logger->section_start("Nome da Seção");
$logger->section_end();
```

## 📝 Logs

Todos os scripts geram logs detalhados:

```
cron-reminders.log          # Lembretes
cron-weekly-report.log      # Relatórios
sync-users.log              # Sincronização
```

**Formato:**
```
[2024-03-24 14:30:15] ========== CRON: Lembretes de Treino ==========
[2024-03-24 14:30:15] 🔐 Obtendo token de acesso Firebase...
[2024-03-24 14:30:16] ✅ Access token obtido com sucesso
[2024-03-24 14:30:18] 📊 Total de usuários com FCM: 5
[2024-03-24 14:30:19] ✅ Notificação enviada para Pedro
[2024-03-24 14:30:20] ✅ Notificações enviadas: 1
[2024-03-24 14:30:20] ❌ Erros: 0
```

**Ver logs em tempo real:**
```bash
ssh seu-usuario@seu-host.com
tail -f ~/public_html/api/cron/cron-reminders.log
```

## 🔐 Segurança

### CRON_SECRET
Proteção de endpoints via variável de ambiente:

```bash
# Gerar secret seguro
openssl rand -hex 32

# Configurar no servidor
export CRON_SECRET="a7f3c9e2b1d4f6a8c3e9b2d5f1a4c7e9"

# Usar nos comandos
curl -H "X-Cron-Secret: $CRON_SECRET" https://seu-dominio.com/api/cron/cron-reminders.php
```

### Firebase Credentials
```bash
# Armazenar FORA de public_html
mkdir -p ~/firebase
chmod 700 ~/firebase

# Upload
scp firebase-credentials.json seu-usuario@seu-host.com:~/firebase/

# Permissões
chmod 600 ~/firebase/firebase-credentials.json
```

## 💾 Cache de Usuários

**Arquivo:** `users-cache.json`

**Formato:**
```json
{
  "user-123": {
    "uid": "user-123",
    "nome": "Pedro",
    "email": "pedro@example.com",
    "fcmToken": "e_rJ0qNm:APA91bGx...",
    "premium": true
  },
  "user-456": {
    "uid": "user-456",
    "nome": "Maria",
    "email": "maria@example.com",
    "fcmToken": "abc123:APA91bGy...",
    "premium": false
  }
}
```

**Quando é atualizado:**
- A cada execução de `sync-users.js` (2x ao dia)
- A cada execução de `sync-users.php` (manual)
- Antes de enviar notificações em `cron-reminders.php`

## 📊 Estrutura de Dados Firestore

### Collection: `usuarios`
```javascript
usuarios/{uid} = {
  // ... campos existentes ...
  fcmToken: "e_rJ0qNm:APA91bGx...",
  fcmTokenUpdatedAt: Timestamp('2024-03-24 14:30:00'),
  
  notificationSettings: {
    remindersEnabled: true,
    weeklyReportEnabled: true,
    frequencyReminders: "6h"
  }
}
```

### Collection: `workouts` (Subcoleção)
```javascript
usuarios/{uid}/workouts/{date} = {
  date: "2024-03-24",
  exercises: [
    { name: "Supino", muscleGroup: "Peito" },
    { name: "Rosca Direta", muscleGroup: "Bíceps" }
  ],
  duration: 45  // em minutos
}
```

## 🚀 Setup Rápido

```bash
# 1. SSH no servidor
ssh seu-usuario@seu-host.com

# 2. Criar diretório
mkdir -p ~/firebase

# 3. Upload arquivo de credenciais
scp firebase-credentials.json seu-usuario@seu-host.com:~/firebase/
chmod 600 ~/firebase/firebase-credentials.json

# 4. Upload scripts PHP
scp -r api/cron/* seu-usuario@seu-host.com:public_html/api/cron/

# 5. Instalar Node.js (se não tiver)
# Via nvm ou package manager do sistema

# 6. Instalar firebase-admin
cd ~/public_html/api/cron
npm install firebase-admin

# 7. Testar sincronização
node sync-users.js

# 8. Adicionar tarefas cron no hPanel
# (Ver documentação FCM_CRON_SETUP.md)
```

## 📚 Documentação Completa

Veja arquivos de documentação para mais detalhes:

- **[QUICK_START_FCM.md](../../QUICK_START_FCM.md)** - Setup rápido (5-15 min)
- **[docs/FCM_CRON_SETUP.md](../../docs/FCM_CRON_SETUP.md)** - Guia completo
- **[docs/FCM_ADVANCED.md](../../docs/FCM_ADVANCED.md)** - Guia técnico avançado
- **[TEST_EXAMPLES.md](../../TEST_EXAMPLES.md)** - Exemplos de teste

## 🤝 Suporte

Se encontrar problemas:

1. Verificar logs: `tail -50 ~/public_html/api/cron/*.log`
2. Testar conectividade: `curl https://seu-dominio.com/api/cron/test-fcm.php?secret=SEU_SECRET&test=full`
3. Validar credenciais: `cat ~/firebase/firebase-credentials.json | jq .`
4. Verificar permissões: `ls -la ~/firebase/ ~/public_html/api/cron/`

---

**Versão:** 1.0  
**Última atualização:** 24 de março de 2024  
**Status:** ✅ Completo e testado
