# Cloudinary Setup Guide - Profile Images

## ✅ What's Been Done (Code Side)

- ✅ Removed Firebase Storage dependency
- ✅ Updated Profile page to use Cloudinary API
- ✅ Added validation (file type, size)
- ✅ Auto-overwrites old images (uses userId as filename)
- ✅ Shows loading spinner during upload
- ✅ Added env variables to .env file

---

## 🔧 Your Setup Steps (In Cloudinary Dashboard)

### Step 1: Get Your Cloud Name ✅

1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. You'll see your **Cloud Name** at the top
   - Example: `dxxxxxxxxxxxxx`
3. **Copy this value**

### Step 2: Create Upload Preset (Important!) ⭐

**Upload Presets allow secure uploads without exposing API secrets**

1. In Dashboard, click **Settings** (gear icon ⚙️)
2. Click **Upload** tab
3. Scroll to **Upload presets** section
4. Click **Add upload preset**

**Configure the preset:**

| Setting | Value |
|---------|-------|
| **Preset name** | `trainlog_profile_images` |
| **Signing Mode** | **Unsigned** ⭐ (Critical!) |
| **Folder** | `profile-images` |
| **Allowed formats** | `jpg, png, jpeg, webp` |
| **Max file size** | `5242880` (5 MB) |

**Add Incoming Transformation (Auto-optimization):**
- Click **+ Add Transformation**
- **Width**: 400
- **Height**: 400
- **Crop**: Fill
- **Quality**: Auto
- **Format**: Auto

This will:
- Resize all images to 400×400px
- Auto-compress for web
- Convert to best format (usually WebP)
- Reduce file sizes by 60-80%!

5. Click **Save**

### Step 3: Update .env File

Open your `.env` file and replace `your_cloud_name_here`:

```env
VITE_CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxxx  # ← Your actual cloud name
VITE_CLOUDINARY_UPLOAD_PRESET=trainlog_profile_images
```

### Step 4: Restart Dev Server

After updating .env, restart your dev server:

```bash
# Stop current server (Ctrl+C)
# Start again
pnpm dev
```

---

## 🧪 Testing

1. Log in to your app
2. Go to Profile page
3. Click the camera icon on avatar
4. Select an image
5. Wait for upload (spinner shows)
6. See success message
7. **Verify in Cloudinary Dashboard:**
   - Go to Media Library
   - Check `profile-images` folder
   - Your image should be there!

---

## 🎯 How It Works

### Upload Flow:
```
User selects image
    ↓
Validate (type, size)
    ↓
Upload to Cloudinary (FormData)
    ↓
Cloudinary processes:
  - Resize to 400×400
  - Optimize quality
  - Convert to best format
    ↓
Get secure_url (CDN link)
    ↓
Save URL to Firestore
    ↓
Display in UI
```

### Image URL Format:
```
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{userId}
```

Example:
```
https://res.cloudinary.com/dxxxxx/image/upload/v1234567890/profile-images/abc123.jpg
```

### Automatic Features:
- ✅ **CDN delivery** - Fast loading worldwide
- ✅ **Auto format** - WebP for modern browsers, JPEG for old
- ✅ **Auto quality** - Best quality/size ratio
- ✅ **Responsive** - Can add `?w=200` for smaller versions
- ✅ **Caching** - Browser caches images (1 download per user)

---

## 💰 Free Tier Limits

Your Cloudinary free plan includes:

| Resource | Limit | Your Usage (10 users) | % Used |
|----------|-------|----------------------|---------|
| **Storage** | 25 GB | ~2 MB | 0.008% |
| **Bandwidth** | 25 GB/month | ~50 MB/month | 0.2% |
| **Transformations** | 25,000/month | ~100/month | 0.4% |

**You're well within limits!** 🎉

### When You'd Hit Limits:
- **Storage**: 125,000+ profile images (25 GB ÷ 200 KB)
- **Bandwidth**: 125,000 image downloads/month
- **For 10-50 users**: You'll never hit these!

---

## 🎨 Advanced Features (Optional)

### Dynamic Image Transformations:

You can manipulate images on-the-fly by modifying the URL:

**Small thumbnail (100×100):**
```
{photoURL}?w=100&h=100&c=fill
```

**Circular crop:**
```
{photoURL}?r=max
```

**Black & white:**
```
{photoURL}?e=grayscale
```

**Blur background:**
```
{photoURL}?e=blur:1000
```

### Implementation Example:
```typescript
// In your component
<img 
  src={`${photoURL}?w=200&h=200&c=fill`} 
  alt="Profile"
/>
```

No extra uploads needed - Cloudinary transforms on-the-fly and caches the result!

---

## 🔒 Security

### Current Setup:
- ✅ **Unsigned uploads** - No API secret in frontend
- ✅ **Upload preset controls**:
  - Only images allowed
  - Max 5 MB size
  - Specific folder location
  - Auto-transformations
- ✅ **User isolation** - Each user has unique filename (userId)

### Additional Security (Optional):

**1. Limit uploads by IP:**
In Cloudinary Dashboard → Settings → Security:
- Add allowed domains
- Enable CORS restrictions

**2. Signed uploads (more secure):**
Requires backend API - overkill for this use case

---

## 🐛 Troubleshooting

### ❌ "Upload failed" error

**Check:**
1. Is `VITE_CLOUDINARY_CLOUD_NAME` correct in .env?
2. Did you create the unsigned upload preset?
3. Is preset name exactly `trainlog_profile_images`?
4. Did you restart dev server after editing .env?

**Test manually:**
```bash
curl -X POST \
  "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload" \
  -F "upload_preset=trainlog_profile_images" \
  -F "file=@/path/to/image.jpg"
```

### ❌ Image not showing

**Check:**
1. Is URL saved correctly in Firestore?
2. Open URL in browser - does it work?
3. Check browser console for CORS errors
4. Verify image uploaded in Cloudinary Media Library

### ❌ "Invalid signature" error

This means:
- Preset is set to **Signed** instead of **Unsigned**
- Go to preset settings → Change to **Unsigned**

---

## 📊 Monitoring Usage

**Check your usage:**
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. View usage graphs (updated daily)
3. See storage, bandwidth, transformations

**Set up alerts (optional):**
1. Settings → Account → Notifications
2. Get email at 80% usage
3. Never get surprised!

---

## 🔄 Migration from Firebase Storage

If you had users with Firebase Storage images (you didn't go live yet, so N/A):

1. Users re-upload their images naturally
2. OR: Run migration script to copy from Firebase → Cloudinary
3. Update all Firestore `photoURL` fields

Since you're just setting up, no migration needed! ✅

---

## ✨ Benefits Over Firebase Storage

| Feature | Cloudinary | Firebase Storage |
|---------|-----------|------------------|
| Free tier (no CC) | ✅ Yes | ❌ No (Blaze needs CC) |
| Storage limit | 25 GB | 5 GB |
| Bandwidth | 25 GB/month | 30 GB/month |
| Auto optimization | ✅ Yes | ❌ No |
| Image transformations | ✅ On-the-fly | ❌ Manual |
| CDN | ✅ Global | ✅ Global |
| Setup complexity | Easy | Easy |

**Winner for profile images: Cloudinary** 🏆

---

## 📝 Next Steps After Setup

1. **Test upload** - Make sure it works
2. **Test image display** - Check it shows correctly
3. **Have friends test** - Different devices/browsers
4. **Monitor usage** - Check dashboard weekly
5. **Consider**: Add image compression library (`browser-image-compression`) to reduce uploads before sending to Cloudinary (even smaller files!)

---

## ✅ Setup Checklist

- [ ] Created Cloudinary account
- [ ] Got Cloud Name from dashboard
- [ ] Created unsigned upload preset: `trainlog_profile_images`
- [ ] Configured preset:
  - [ ] Signing Mode: Unsigned
  - [ ] Folder: profile-images
  - [ ] Max file size: 5 MB
  - [ ] Transformation: 400×400, fill, auto quality
- [ ] Updated `.env` with Cloud Name
- [ ] Restarted dev server
- [ ] Tested upload functionality
- [ ] Verified image in Cloudinary Media Library
- [ ] Tested image display in app

---

**Status**: ✅ Code ready - Complete Cloudinary setup steps above!

**Estimated setup time**: 5-10 minutes

**Questions?** Check troubleshooting section or Cloudinary docs: https://cloudinary.com/documentation
