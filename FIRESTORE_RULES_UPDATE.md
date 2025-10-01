# Firestore Security Rules Update

You need to update your Firestore security rules to allow creation of template workouts.

## Updated Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // usuarios collection
    match /usuarios/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId;
    }
    
    // treinos collection
    match /treinos/{treinoId} {
      // Allow read if:
      // 1. User owns the workout, OR
      // 2. User is admin, OR
      // 3. It's a system template (usuarioID == 'system')
      allow read: if request.auth.uid == resource.data.usuarioID || 
                     isAdmin() || 
                     resource.data.usuarioID == 'system';
      
      // Allow write if user owns the workout or is admin
      allow write: if request.auth.uid == resource.data.usuarioID || isAdmin();
      
      // Allow create if:
      // 1. User is creating their own workout, OR
      // 2. It's a system template being created (for seeding script)
      allow create: if request.auth.uid == request.resource.data.usuarioID || 
                       request.resource.data.usuarioID == 'system';
      
      // exercicios subcollection (nested inside treinos)
      match /exercicios/{exercicioId} {
        allow read: if request.auth.uid == get(/databases/$(database)/documents/treinos/$(treinoId)).data.usuarioID || 
                       isAdmin() ||
                       get(/databases/$(database)/documents/treinos/$(treinoId)).data.usuarioID == 'system';
        
        allow write: if request.auth.uid == get(/databases/$(database)/documents/treinos/$(treinoId)).data.usuarioID || 
                        isAdmin();
        
        allow create: if request.auth.uid == get(/databases/$(database)/documents/treinos/$(treinoId)).data.usuarioID || 
                         get(/databases/$(database)/documents/treinos/$(treinoId)).data.usuarioID == 'system';
      }
    }
    
    // logs collection
    match /logs/{logId} {
      allow read: if request.auth.uid == resource.data.usuarioID || isAdmin();
      allow write: if request.auth.uid == resource.data.usuarioID;
      allow create: if request.auth.uid == request.resource.data.usuarioID;
    }
  }
}
```

## What Changed:

1. **Template Reading**: Anyone authenticated can now read workouts with `usuarioID == 'system'`
2. **Template Creation**: Allows creating documents with `usuarioID == 'system'` (for seeding)
3. **Exercise Reading**: Allows reading exercises from system templates
4. **Exercise Creation**: Allows creating exercises under system templates

## Steps to Update:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Replace with the rules above
5. Click **Publish**
6. Run the seeding script again: `pnpm seed-templates`

---

## Alternative: Temporarily Open Rules (NOT RECOMMENDED FOR PRODUCTION)

If you want to quickly seed without rule changes, you can temporarily set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ DANGEROUS - Only for seeding!
    }
  }
}
```

**Run seeding script, then immediately revert to secure rules above!**
