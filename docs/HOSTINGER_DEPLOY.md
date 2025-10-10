# TrainLog - Hostinger Deployment Guide

## 📦 Passo a Passo para Deploy na Hostinger

### 1️⃣ **Build do Projeto**
```bash
npm run build
```
Isso cria a pasta `dist/` com todos os arquivos otimizados.

### 2️⃣ **Estrutura do Build**
Após o build, você terá:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [outros arquivos]
├── .htaccess (copiado automaticamente do public/)
├── favicon.ico
├── manifest files
└── service worker files
```

### 3️⃣ **Upload para Hostinger**

#### **Opção A: Via File Manager (Web)**
1. Entre no painel da Hostinger (hpanel)
2. Vá em **File Manager**
3. Navegue até `public_html/` (ou o diretório do seu domínio)
4. **DELETE tudo** dentro de `public_html/`
5. **Upload** todo o conteúdo da pasta `dist/`
   - ⚠️ **IMPORTANTE:** Faça upload do **CONTEÚDO** da pasta dist, não a pasta em si
   - Deve ficar: `public_html/index.html`, `public_html/assets/`, etc.
   - NÃO: `public_html/dist/index.html`

#### **Opção B: Via FTP** (Recomendado para projetos grandes)
1. Baixe um cliente FTP (FileZilla, WinSCP, etc.)
2. Conecte usando as credenciais FTP da Hostinger
3. Navegue até `public_html/`
4. Delete tudo dentro
5. Faça upload do conteúdo da pasta `dist/`

### 4️⃣ **Verificar .htaccess**
Certifique-se que o arquivo `.htaccess` está em `public_html/.htaccess`

Se não estiver visível:
1. No File Manager, clique em **Settings** (canto superior direito)
2. Marque **Show Hidden Files**
3. Procure por `.htaccess`
4. Se não existir, crie manualmente com o conteúdo do arquivo `public/.htaccess`

### 5️⃣ **Configurar SSL (HTTPS)**
1. No hpanel, vá em **SSL**
2. Ative o SSL gratuito (Let's Encrypt)
3. Aguarde alguns minutos para ativar
4. Depois que ativar, descomente as linhas de redirect HTTPS no `.htaccess`:
   ```apache
   # Force HTTPS (uncomment after SSL setup)
   <IfModule mod_rewrite.c>
     RewriteCond %{HTTPS} off
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   </IfModule>
   ```

### 6️⃣ **Configurar Firebase (IMPORTANTE)**
Certifique-se que o domínio da Hostinger está autorizado no Firebase:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Adicione seu domínio: `seudominio.com` e `www.seudominio.com`

3. Firebase Console → **Hosting** (se usar) → Configure o domínio customizado

### 7️⃣ **Testar**
Acesse seu domínio e teste:
- ✅ Página inicial carrega
- ✅ Login funciona
- ✅ Navegação entre páginas funciona (React Router)
- ✅ PWA instala corretamente
- ✅ Service Worker funciona (verifique no DevTools)
- ✅ Firebase conecta (teste login/registro)

### 8️⃣ **Troubleshooting Comum**

#### **Problema: Rotas retornam 404**
**Solução:** Verifique se o `.htaccess` está no lugar certo e com o conteúdo correto

#### **Problema: CSS/JS não carregam**
**Solução:** 
- Verifique se os arquivos estão em `public_html/assets/`
- Limpe o cache do navegador
- Verifique permissões dos arquivos (644 para arquivos, 755 para pastas)

#### **Problema: Firebase não conecta**
**Solução:**
- Verifique se o domínio está autorizado no Firebase
- Verifique as variáveis de ambiente no `firebaseConfig.ts`
- Certifique-se que o CORS está configurado no Firestore

#### **Problema: PWA não instala**
**Solução:**
- Certifique-se que o site está em HTTPS
- Verifique se o `manifest.json` está acessível
- Verifique se o Service Worker registra corretamente

### 9️⃣ **Otimizações Pós-Deploy**

1. **Enable Gzip Compression** (já configurado no .htaccess)
2. **Configure Browser Caching** (já configurado no .htaccess)
3. **Enable CDN** (opcional, Hostinger oferece Cloudflare)
4. **Monitor Performance** com Google Analytics

### 🔄 **Atualizações Futuras**

Para atualizar o site:
```bash
npm run build
```
E faça upload apenas dos arquivos que mudaram, ou substitua tudo.

### 📊 **Checklist Final**
- [ ] `npm run build` executado com sucesso
- [ ] Conteúdo da pasta `dist/` enviado para `public_html/`
- [ ] Arquivo `.htaccess` presente em `public_html/`
- [ ] SSL/HTTPS ativado
- [ ] Domínio autorizado no Firebase
- [ ] Todas as rotas funcionando
- [ ] Login/registro funcionando
- [ ] PWA instalável

### 🆘 **Suporte**
Se tiver problemas:
1. Verifique os logs de erro no navegador (F12 → Console)
2. Verifique os logs do servidor no hpanel
3. Contate o suporte da Hostinger se for problema de configuração do servidor

---

## 🚀 Deploy Automatizado (Opcional - CI/CD)

Se quiser automatizar deploys futuros, você pode usar:
- GitHub Actions + FTP
- Hostinger Git Deploy (se disponível no seu plano)

Quer que eu crie um workflow de deploy automatizado?
