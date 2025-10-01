# Custom Password Reset Email Template for Firebase

## 📧 Complete Email Template

Copy this template to **Firebase Console → Authentication → Templates → Password Reset**

### **From Name:**
```
TrainLog
```

### **Reply-to (if you have custom domain):**
```
contato@trainlog.app
```
Or leave empty for now.

### **Subject:**
```
🔒 Recuperação de Senha - TrainLog
```

### **Message (HTML):**

```html
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Header with Logo -->
  <div style="background: linear-gradient(135deg, #27AE60 0%, #229954 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="https://res.cloudinary.com/dd2caxfkn/image/upload/w_180,f_auto,q_auto/trainlog-email-logo.png" alt="TrainLog" style="max-width: 180px; height: auto;">
  </div>
  
  <!-- Body -->
  <div style="background: #ffffff; padding: 40px 30px; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
    <h2 style="color: #333; margin-top: 0; font-size: 24px;">Recuperação de Senha 🔒</h2>
    
    <p style="color: #555; font-size: 16px;">Olá,</p>
    
    <p style="color: #555; font-size: 16px;">
      Recebemos uma solicitação para redefinir a senha da sua conta <strong>TrainLog</strong>.
    </p>
    
    <p style="color: #555; font-size: 16px;">
      Conta: <strong>%EMAIL%</strong>
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="%LINK%" style="background: linear-gradient(135deg, #27AE60 0%, #229954 100%); color: #ffffff; padding: 16px 50px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(39, 174, 96, 0.3);">
        Redefinir Minha Senha
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; text-align: center;">
      Ou copie e cole este link no seu navegador:<br>
      <a href="%LINK%" style="color: #27AE60; word-break: break-all;">%LINK%</a>
    </p>
    
    <!-- Security Notice -->
    <div style="background: #fff9e6; border-left: 4px solid #F1C40F; padding: 15px; margin-top: 30px; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>⚠️ Não solicitou isso?</strong><br>
        Se você não pediu para redefinir sua senha, pode ignorar este e-mail com segurança. Sua senha permanecerá inalterada.
      </p>
    </div>
    
    <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <strong>Dica de segurança:</strong> Este link expira em 1 hora por motivos de segurança.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background: #f5f5f5; padding: 25px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
    <p style="margin: 0; color: #666; font-size: 14px;">
      Atenciosamente,<br>
      <strong style="color: #27AE60;">Equipe TrainLog 💪</strong>
    </p>
    <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">
      © 2025 TrainLog - Seu app de acompanhamento de treinos
    </p>
  </div>
  
</div>
```

---

## 🔧 **Important: Firebase Configuration**

### **1. Action URL Field:**

In the Firebase template editor, you'll see an **"Action URL (%LINK% value)"** field at the bottom.

**Enter this URL:**
```
https://trainlog.site/reset-password
```

This tells Firebase to redirect users to YOUR custom page instead of the default Firebase page.

**How it works:**
- Firebase automatically adds `?mode=resetPassword&oobCode=ABC123` to your URL
- Your custom page reads the `oobCode` parameter
- Everything works automatically!

### **2. Update the URLs!**

In the template above, replace:
```
https://trainlog-ae8e6.web.app/reset-password?oobCode=%OOB_CODE%
```

With your actual domain once you set it up:
```
https://trainlog.app/reset-password?oobCode=%OOB_CODE%
```
or
```
https://trainlog.com.br/reset-password?oobCode=%OOB_CODE%
```

---

## ✅ **What This Does:**

1. User clicks "Esqueci minha senha" in your app
2. Firebase sends email with YOUR custom link
3. Link goes to: `https://your-domain.com/reset-password?oobCode=ABC123`
4. User sees YOUR branded page (green gradient, logo, TrainLog style)
5. User enters new password
6. Success! Redirects to login

---

## 🎨 **Benefits of Custom Page:**

✅ **Full branding** - Your logo, colors, fonts
✅ **Better UX** - Consistent with your app
✅ **Password confirmation** - Ask user to type password twice
✅ **Better error messages** - In Portuguese
✅ **Success animation** - Shows check mark
✅ **Auto-redirect** - Takes user to login after success
✅ **Link validation** - Checks if link is valid/expired

---

## 📝 **Setup Checklist:**

1. ✅ Custom page created (`src/pages/reset-password.tsx`)
2. ✅ Route added to app (`/reset-password`)
3. ⬜ Update Firebase email template (copy HTML above)
4. ⬜ Update URLs in template to match your domain
5. ⬜ Test the flow!

---

## 🧪 **How to Test:**

1. Go to your login page
2. Click "Esqueceu a senha?"
3. Enter your email
4. Check your email inbox
5. Click the link in the email
6. Should see YOUR custom page (not Firebase's)
7. Enter new password
8. Should see success message
9. Auto-redirect to login

---

## 🚨 **Firebase Configuration:**

You also need to configure Firebase to allow your custom domain:

1. Go to **Firebase Console → Authentication → Settings**
2. Scroll down to **Authorized domains**
3. Add your domain:
   - `trainlog-ae8e6.web.app` (already there)
   - `localhost` (for testing - already there)
   - `trainlog.app` (add when you get domain)
   - `trainlog.com.br` (add when you get domain)

---

## 💡 **Pro Tip:**

For now, keep the current Vercel URL in the email template:
```
https://trainlog-ae8e6.web.app/reset-password?oobCode=%OOB_CODE%
```

When you buy your custom domain, just update this in Firebase (takes 2 minutes).

---

Want me to help you test this or make any design changes to the reset page? 😊
