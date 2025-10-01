# Firebase Storage Setup - Profile Images

## ✅ What's Been Done

### 1. Code Implementation
- ✅ Added Firebase Storage to `firebaseConfig.ts`
- ✅ Updated Profile page to support image uploads
- ✅ Added camera icon button on avatar for easy upload
- ✅ Displays uploaded image or falls back to letter avatar
- ✅ Validates file type (images only) and size (max 5MB)
- ✅ Shows loading spinner during upload

### 2. How It Works

**Upload Flow:**
1. User clicks the camera icon on their avatar
2. Selects an image from their device
3. Image is validated (type and size)
4. Uploaded to Firebase Storage at `profile-images/{userId}`
5. Download URL is retrieved
6. URL is saved to Firestore user document (`photoURL` field)
7. UI updates immediately to show new image

**Display Flow:**
1. On page load, fetch user data including `photoURL`
2. If `photoURL` exists, display the image
3. If not, show gradient circle with first letter of name

## 🚀 Firebase Console Setup Steps

### Step 1: Enable Storage (Required!)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **trainlog**
3. Click **"Storage"** in the left sidebar
4. Click **"Get Started"**
5. Choose **"Start in test mode"** (temporary - we'll secure it next)
6. Select your region (ideally same as Firestore)
7. Click **"Done"**

### Step 2: Set Up Security Rules (Important for Production!)

Replace the default test mode rules with these:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile images - users can only read/write their own
    match /profile-images/{userId} {
      allow read: if true; // Anyone can view profile images
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                   && request.resource.contentType.matches('image/.*'); // Images only
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**What these rules do:**
- ✅ Anyone can view profile images (public access)
- ✅ Users can only upload to their own profile location
- ✅ Must be authenticated to upload
- ✅ File size limited to 5MB
- ✅ Only image files allowed
- ✅ All other paths are blocked

### Step 3: Verify Storage Bucket in .env

Check your `.env` file has the storage bucket (should already be there):
```
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## 💰 Pricing (Free Tier)

Firebase Storage Free Tier (Spark Plan):
- **Storage**: 5 GB
- **Downloads**: 1 GB/day
- **Uploads**: 20,000/day

**For profile images, this is more than enough!**

Example calculation:
- Average profile image: ~200 KB (compressed)
- 5 GB = ~25,000 profile images
- 1 GB/day downloads = ~5,000 profile image views/day

You'll need to upgrade only if you:
- Store thousands of high-res images
- Have massive traffic (unlikely for personal project)

## 🎨 UI Features Added

1. **Camera Icon Button**
   - Positioned at bottom-right of avatar
   - Blue color matching your theme
   - Shows spinner when uploading
   - Hover effect for better UX

2. **Image Display**
   - Circular crop (20x20, 80px)
   - Object-fit cover (no distortion)
   - Falls back to letter avatar if no image

3. **Validation**
   - Only accepts image files
   - Max 5MB size
   - User-friendly error messages

## 📝 Firestore Schema Update

The user document now includes:
```typescript
{
  nome: string,
  email: string,
  photoURL: string | null  // ← NEW: URL from Firebase Storage
}
```

## 🔧 Future Improvements (Optional)

1. **Image Compression**
   - Use library like `browser-image-compression` before upload
   - Reduces storage costs and faster loading

2. **Image Cropping**
   - Add a crop tool before upload (e.g., `react-image-crop`)
   - Ensures images are square and properly framed

3. **Delete Old Images**
   - When uploading new image, delete the old one from Storage
   - Saves storage space

4. **Thumbnails**
   - Use Firebase Cloud Functions to generate smaller versions
   - Faster loading, less bandwidth

## 🐛 Troubleshooting

**"Upload failed" error:**
- Make sure Storage is enabled in Firebase Console
- Check Storage Rules are set correctly
- Verify `.env` has correct storage bucket

**Image not showing:**
- Check browser console for errors
- Verify `photoURL` is saved in Firestore
- Check Storage Rules allow read access

**"Permission denied" error:**
- User must be authenticated
- Check Storage Rules match the code logic
- Verify user ID in path matches authenticated user

## ✨ Testing

1. Log in to your app
2. Go to Profile page
3. Click the camera icon on your avatar
4. Select an image (< 5MB)
5. Wait for upload (spinner shows progress)
6. See success message
7. Refresh page - image should persist!

---

**Status**: ✅ Code complete - Just need to enable Storage in Firebase Console!
