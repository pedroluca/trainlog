# Admin Dashboard - Setup Guide

## ✅ What's Been Created

### **1. Admin Login Page** (`/admin/login`)
- Separate login for administrators
- Validates email, password, and `isAdmin` status
- Dark themed UI with shield icon
- Denies access if user is not admin
- Redirects to dashboard on success

### **2. Admin Dashboard** (`/admin/dashboard`)
- Protected route (requires admin authentication)
- Comprehensive statistics and analytics
- User management interface
- Activity monitoring

## 📊 Dashboard Features

### **Statistics Cards:**
- 📈 **Total de Usuários** - Count of all registered users
- 💪 **Total de Treinos** - Number of workout programs created
- 📝 **Total de Logs** - Exercise logs recorded
- 🔥 **Usuários Ativos** - Users who have logged exercises

### **User Management Table:**
- Complete list of all users
- Shows: Name, Email, Workout count, Log count, Admin status
- Hover effects for better UX
- Badge indicators (Admin/User)

### **Recent Activity Feed:**
- Last 10 exercise logs
- Shows: User name, exercise, timestamp
- Real-time activity monitoring

## 🔒 Security Features

### **Authentication Flow:**
1. User enters email and password
2. Firebase authenticates credentials
3. System checks Firestore for `isAdmin: true`
4. If not admin → denied access + signed out
5. If admin → stores session + redirects to dashboard

### **Protected Route:**
- Dashboard checks `localStorage` for admin session
- Verifies admin status in Firestore on load
- Redirects to login if not authenticated
- Auto-logout on session expiry

## 🚀 How to Create an Admin User

### **Method 1: Firebase Console (Recommended)**
1. Go to Firebase Console → Firestore Database
2. Find the user document in `usuarios` collection
3. Add field: `isAdmin` (boolean) = `true`
4. Save

### **Method 2: Manually in Firestore**
```javascript
// In Firebase console or via script
db.collection('usuarios').doc('USER_ID').update({
  isAdmin: true
})
```

### **Method 3: Create Admin During Registration**
Modify `register.tsx` to add admin field for specific emails:
```typescript
const isAdminEmail = email === 'admin@trainlog.com'

await setDoc(doc(db, 'usuarios', user.uid), {
  nome: nome,
  email: email,
  isAdmin: isAdminEmail // Add this
})
```

## 📍 Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin/login` | Admin authentication | Public |
| `/admin/dashboard` | Admin panel | Protected (admin only) |

## 🎨 Design Features

### **Dark Theme:**
- Gradient background: `from-gray-900 via-gray-800 to-gray-900`
- Glass morphism cards with backdrop blur
- Subtle borders and shadows
- Green accent color matching app branding

### **Responsive:**
- Grid layout for stats (1-4 columns)
- Scrollable tables on mobile
- Touch-friendly buttons

## 📝 Data Structure Required

### **usuarios Collection:**
```typescript
{
  nome: string,
  email: string,
  isAdmin?: boolean,  // ← NEW: Required for admin access
  createdAt?: Timestamp
}
```

## 🔧 Usage

### **Access Admin Panel:**
1. Navigate to: `http://localhost:5173/admin/login`
2. Enter admin credentials
3. Dashboard loads with all statistics

### **Logout:**
- Click "Sair" button in dashboard header
- Clears all admin session data
- Redirects to admin login

## 🛡️ Security Best Practices

### **✅ Implemented:**
- Separate admin login (not using regular user login)
- Server-side admin verification (Firestore check)
- Protected routes with authentication guards
- Auto-logout on unauthorized access
- Session stored in localStorage (cleared on logout)

### **⚠️ Future Improvements:**
1. **Add Firebase Security Rules:**
```javascript
// firestore.rules
match /usuarios/{userId} {
  allow read: if request.auth != null && 
              get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.isAdmin == true;
}
```

2. **Add Admin Actions:**
- Delete users
- Edit user permissions
- View detailed user analytics
- Export data to CSV

3. **Add Audit Log:**
- Track all admin actions
- Store in separate collection
- Show in dashboard

4. **Add Search/Filter:**
- Search users by name/email
- Filter by admin status
- Sort tables

## 🎯 Statistics Calculations

```typescript
// Total users
totalUsers = usuarios.length

// Total workouts
totalWorkouts = treinos.length

// Total logs
totalLogs = logs.length

// Active users (users who have logged exercises)
activeUsers = unique(logs.map(log => log.usuarioID)).length
```

## 📸 What the Admin Sees

### **Dashboard Layout:**
```
┌─────────────────────────────────────────┐
│  Admin Dashboard    Bem-vindo, [Name]  │
│                              [Sair]     │
└─────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ [Icon]   │ │ [Icon]   │ │ [Icon]   │ │ [Icon]   │
│ Total    │ │ Total    │ │ Total    │ │ Usuários │
│ Usuários │ │ Treinos  │ │ Logs     │ │ Ativos   │
│   123    │ │   456    │ │   789    │ │    45    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────┐
│  📋 Lista de Usuários                   │
├─────────┬──────────┬────────┬──────────┤
│ Nome    │ Email    │ Treinos│ Admin    │
├─────────┼──────────┼────────┼──────────┤
│ Pedro   │ p@...    │ 5      │ Admin    │
│ João    │ j@...    │ 3      │ User     │
└─────────┴──────────┴────────┴──────────┘

┌─────────────────────────────────────────┐
│  📈 Atividade Recente                   │
├─────────────────────────────────────────┤
│ Pedro - Registrou: Supino   | 10:30    │
│ João - Registrou: Agachamento | 10:25  │
└─────────────────────────────────────────┘
```

## ✅ Testing Checklist

- [ ] Create admin user (set `isAdmin: true` in Firestore)
- [ ] Try to login with non-admin user (should be denied)
- [ ] Login with admin credentials
- [ ] Verify dashboard loads all data
- [ ] Check statistics are correct
- [ ] View user list
- [ ] Check recent activity feed
- [ ] Test logout functionality
- [ ] Verify protection (try accessing `/admin/dashboard` without login)

## 🐛 Troubleshooting

**"Acesso negado" error:**
- User doesn't have `isAdmin: true` in Firestore
- Add the field manually via Firebase Console

**Dashboard shows empty data:**
- Check Firestore collections exist: `usuarios`, `treinos`, `logs`
- Verify Firestore permissions allow reads

**Redirect loop:**
- Clear localStorage
- Check admin user exists and has `isAdmin: true`

---

**Status**: ✅ Complete and ready to use!

**Access**: `http://localhost:5173/admin/login`
