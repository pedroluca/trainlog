# PWA Features - Tractus

## ✅ What's Included

### 1. **Installable App**
- Users can install Tractus on their home screen
- Works on mobile (Android/iOS) and desktop (Chrome, Edge, Safari)
- Appears like a native app with no browser UI

### 2. **Offline Support**
- Basic UI works offline
- Cached resources load instantly
- Firebase data cached for 24 hours
- Graceful fallback when offline

### 3. **Auto-Update System**
- Service worker checks for updates every 60 seconds
- Notification appears when new version is available
- User can update with one click
- No need to reinstall the app
- 📄 **See [PWA_UPDATE_SYSTEM.md](./PWA_UPDATE_SYSTEM.md) for detailed update flow**

### 4. **Install Prompt**
- Smart prompt appears after 30 seconds of usage
- Can be dismissed (won't show again)
- Only shows if app is not already installed
- Respects user preferences

### 5. **Caching Strategy**
- **Static assets** (JS, CSS, images): Cache first
- **Firebase Storage** (images): Cache first (30 days)
- **Firestore API**: Network first with fallback
- **Google Fonts**: Cache first (1 year)

## 🧪 Testing PWA Locally

### Development Mode
```bash
pnpm dev
```
PWA will work in dev mode for testing!

### Build and Preview
```bash
pnpm build
pnpm preview
```

### Testing Install Prompt (Chrome/Edge)
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Manifest" - check all details
4. Click "Service Workers" - verify it's registered
5. Look for install button in address bar (⊕ icon)

### Testing Offline
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Check "Offline" checkbox
4. Refresh page - app should still work!

## 📱 Install Instructions for Users

### Android (Chrome/Edge)
1. Open Tractus in browser
2. Tap menu (⋮) → "Install app" or "Add to Home Screen"
3. App appears on home screen like native app

### iOS (Safari)
1. Open Tractus in Safari
2. Tap Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

### Desktop (Chrome/Edge)
1. Look for install icon (⊕) in address bar
2. Click it and confirm
3. App opens in standalone window

## 🔄 Update Process

When you deploy a new version:
1. Service worker detects the change
2. User sees "Update Available" notification
3. User clicks "Update Now"
4. Page refreshes with new version
5. Done!

## 🎨 PWA Assets Checklist

- ✅ `manifest.json` - App metadata
- ✅ `192x192` icon - Android home screen
- ✅ `512x512` icon - Android splash screen
- ✅ `apple-touch-icon.png` - iOS home screen
- ✅ `favicon.ico` - Browser tab
- ✅ Theme color - Matches app design (#27AE60)

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel
```
PWA works automatically! Service worker is served correctly.

### Firebase Hosting
```bash
firebase deploy
```
Make sure `firebase.json` includes service worker:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Service-Worker-Allowed",
            "value": "/"
          }
        ]
      }
    ]
  }
}
```

## 📊 Monitoring PWA Performance

### Lighthouse Audit
1. Open DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Run audit
4. Aim for 90+ score

### Key Metrics to Track
- **Install rate**: How many users install?
- **Offline usage**: Do users access offline?
- **Update adoption**: Do users update quickly?
- **Retention**: Do installed users return more?

## 🐛 Troubleshooting

### Install button not showing
- Check console for errors
- Verify manifest.json is valid
- Make sure HTTPS is enabled (required for PWA)
- Clear cache and reload

### Service worker not updating
- Go to DevTools → Application → Service Workers
- Click "Update on reload"
- Click "Unregister" and reload
- Service worker will re-register with new version

### Offline mode not working
- Check if service worker is registered
- Verify network requests in DevTools → Network tab
- Check cache storage in Application → Cache Storage

## 🎯 Best Practices

1. **Always test offline** before deploying
2. **Version your service worker** (happens automatically)
3. **Monitor cache size** (don't cache too much)
4. **Test on real devices** (mobile and desktop)
5. **Update regularly** but don't force updates

## 🔮 Future Enhancements

- **Push Notifications**: Workout reminders
- **Background Sync**: Sync data when back online
- **Web Share API**: Share workouts easily
- **Periodic Sync**: Auto-refresh data in background

---

## 📖 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker Guide](https://web.dev/service-worker-lifecycle/)
- [vite-plugin-pwa Docs](https://vite-pwa-org.netlify.app/)
