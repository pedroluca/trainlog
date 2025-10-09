# PWA## How It Works

### 1. Service Worker Registration
- **Type**: `prompt` (not `autoUpdate`)
- **Reason**: Gives users immediate control over when to update, especially important for minor/major version changes
- **Intelligent Behavior**: Auto-updates patches, prompts for minor/major
- **Location**: `vite.config.ts`

### 2. Update Check Frequency
- **Interval**: Every 60 seconds (1 minute)
- **Trigger**: Automatically runs in the background after initial SW registration
- **Method**: `registration.update()` is called periodically
- **Console logs**: You'll see "🔄 Checking for updates..." every minute

### 3. Version Detection & Decision Matrix

| Update Type | Version Change | Behavior | UI | Console Log |
|-------------|---------------|----------|-----|-------------|
| **Patch** | 1.12.2 → 1.12.3 | ✅ Auto-update | 🔇 Silent | 🔧 Patch update detected |
| **Minor** | 1.11.x → 1.12.0 | 🔔 Prompt user | 🔵 Blue notification | 🎯 Minor update detected |
| **Major** | 1.x.x → 2.0.0 | 🔔 Prompt user | 🔴 Red notification | 🎯 Major update detected |
| **Unknown** | First install | 🔔 Prompt user | ⚪ Default notification | ⚠️ Unknown update type |

### 4. Update Detection Flow
When a new version is detected:
1. Service worker downloads the new assets in the background
2. `onNeedRefresh()` callback is triggered
3. System compares stored version (localStorage) with new version
4. **Decision tree**:
   - **Patch**: `updateServiceWorker(true)` called automatically → page reloads
   - **Minor/Major**: `PWAUpdateNotification` displays → user chooses
5. Console logs show version comparison and decision

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA Opens / Loads                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Service Worker Registers & Starts                   │
│          Checking for Updates (every 60s)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
              ┌──────┴──────┐
              │  New Version │
              │   Detected?  │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │ NO                    │ YES
         ▼                       ▼
    ┌─────────┐      ┌──────────────────┐
    │Continue │      │Compare Versions   │
    │Running  │      │(localStorage vs   │
    └─────────┘      │ APP_VERSION)      │
                     └─────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         PATCH│           MINOR│           MAJOR│
              ▼                ▼                ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Auto-Update     │ │Show Blue     │ │Show Red      │
    │ (Silent)        │ │Notification  │ │Notification  │
    │ ↓               │ │              │ │              │
    │ Reload Page     │ │User Chooses: │ │User Chooses: │
    │ Automatically   │ │• Update Now  │ │• Update Now  │
    └─────────────────┘ │• Dismiss     │ │• Dismiss     │
                        └──────────────┘ └──────────────┘
```# Overview
TrainLog uses a **prompt-based PWA update system** that actively checks for updates and notifies users when a new version is available.

## How It Works

### 1. Service Worker Registration
- **Type**: `prompt` (not `autoUpdate`)
- **Reason**: Gives users immediate control over when to update, especially important for minor/major version changes
- **Location**: `vite.config.ts`

### 2. Update Check Frequency
- **Interval**: Every 60 seconds (1 minute)
- **Trigger**: Automatically runs in the background after initial SW registration
- **Method**: `registration.update()` is called periodically
- **Console logs**: You'll see "🔄 Checking for updates..." every minute in the console

### 3. Version Detection
When a new version is detected:
1. Service worker downloads the new assets in the background
2. `onNeedRefresh()` callback is triggered
3. `PWAUpdateNotification` component displays the update prompt
4. User can choose to update now or dismiss

### 4. Update Process
When user clicks "Atualizar Agora":
1. `updateServiceWorker(true)` is called
2. New service worker activates
3. Page automatically reloads
4. User gets the new version immediately

### 5. Intelligent Version Detection
The system automatically detects the update type:
1. **Version Storage**: Current version saved to `localStorage` on first load
2. **Comparison Logic**: When update detected, compares stored vs new version
3. **Decision Tree**:
   - If **patch** changed → Auto-update silently (no prompt)
   - If **minor** changed → Show blue notification with user choice
   - If **major** changed → Show red notification with urgency
   - If **unknown** → Show notification to be safe
4. **Console Logs**: Full version comparison logged for debugging

Example console output:
```
📊 Version comparison: { stored: '1.12.2', current: '1.12.3' }
🔧 Patch update detected - auto-updating...
```

## Version Types & Behavior

### Patch Updates (1.12.2 → 1.12.3)
- ✅ **Auto-applied silently**: Service worker updates and reloads automatically
- 🔇 **No notification**: Bug fixes don't interrupt users
- ⚡ **Instant**: Happens within 60 seconds of opening the app
- 📝 **Console log**: "🔧 Patch update detected - auto-updating..."

### Minor Updates (1.11.x → 1.12.0)
- 🔔 **Notification shown**: Blue badge with "MINOR" label
- 🎉 **Title**: "Nova Versão Disponível! 🎉"
- ⏱️ **Quick detection**: Within 60 seconds of opening the app
- 💡 **User choice**: Can update now or dismiss

### Major Updates (1.x.x → 2.0.0)
- 🚨 **Critical notification**: Red badge with "MAJOR" label
- � **Title**: "Grande Atualização Disponível! 🚀"
- 🔴 **Red button**: Emphasizes importance
- ⚠️ **Breaking changes**: User should know something big changed

## Configuration Details

### vite.config.ts
```typescript
VitePWA({
  registerType: 'prompt',  // User controls when to update
  // ... rest of config
})
```

### PWA Update Notification Component
```typescript
useRegisterSW({
  onRegistered(r) {
    // Check for updates every 60 seconds
    setInterval(() => {
      r.update()
    }, 60000)
  },
  onNeedRefresh() {
    // Show notification to user
  }
})
```

## Troubleshooting

### "I don't see the update notification"
1. **Check update type**: Patch updates are silent (no notification)
2. **Check console logs**: Look for "🔄 Checking for updates..."
3. **Wait 60 seconds**: First check happens after 1 minute
4. **Check localStorage**: `localStorage.getItem('app-version')` should show old version
5. **Clear cache**: Hard refresh (Ctrl/Cmd + Shift + R)
6. **Check version**: Compare `package.json` version with installed PWA

### "Patch update didn't apply automatically"
1. **Check console**: Should see "🔧 Patch update detected - auto-updating..."
2. **Check version storage**: `localStorage.getItem('app-version')` might be missing
3. **Hard refresh**: Force reload to trigger version comparison
4. **Clear storage**: Application > Clear storage > Service Workers

### "Update installed but old version still shows"
1. **Close all tabs**: Old version may still be cached
2. **Wait for page reload**: Auto-updates trigger reload after a moment
3. **Unregister SW**: Chrome DevTools > Application > Service Workers > Unregister
4. **Clear site data**: Application > Clear storage
5. **Reinstall PWA**: Remove and reinstall from browser

### "Updates take too long to detect"
- **Normal delay**: Up to 60 seconds (one check interval)
- **Browser cache**: May need to wait for browser cache invalidation
- **Network**: Slow network may delay SW update download
- **First install**: No stored version means update type is unknown

### "Wrong update type detected"
1. **Check version.ts**: Ensure major/minor/patch are correct
2. **Check package.json**: Should match version.ts
3. **Check localStorage**: Old version stored correctly?
4. **Console logs**: See "📊 Version comparison" output
5. **Clear localStorage**: Remove 'app-version' key and reload

## Best Practices

### For Development
1. Enable SW in dev mode: `devOptions.enabled: true` (already configured)
2. Use Chrome DevTools > Application > Service Workers
3. Use "Update on reload" during development
4. Check console for update logs
5. Test all three update types (patch, minor, major)

### For Production
1. Always bump version in `package.json` AND `version.ts`
2. Use semantic versioning properly:
   - **Patch** (x.x.+1): Bug fixes only
   - **Minor** (x.+1.0): New features, backwards compatible
   - **Major** (+1.0.0): Breaking changes, major features
3. Test PWA update flow before deploying
4. Monitor update adoption rate
5. Use patch updates for critical hotfixes (users get them instantly!)

### For Users
1. Patch updates happen automatically - no action needed
2. For minor/major updates, click "Atualizar Agora" when prompted
3. Can dismiss updates but will be prompted again in next session
4. Close and reopen app if update doesn't apply
5. Contact support if persistent issues

## Update Notification UI

### Design
- **Position**: Top-right on desktop, top-center on mobile
- **Colors**: Dark theme (gray-800 background, dynamic accent)
- **Icons**: RefreshCw icon from lucide-react
- **Animation**: Slide down entrance

### Visual Variants

#### Minor Update Notification
- **Badge**: Blue "MINOR" label
- **Title**: "Nova Versão Disponível! 🎉"
- **Button**: Blue (bg-blue-500)
- **Message**: "Novas funcionalidades foram adicionadas ao TrainLog..."
- **Tone**: Positive, inviting

#### Major Update Notification
- **Badge**: Red "MAJOR" label
- **Title**: "Grande Atualização Disponível! 🚀"
- **Button**: Red (bg-red-500)
- **Message**: "Uma versão principal do TrainLog está pronta com mudanças importantes..."
- **Tone**: Urgent, important

#### Patch Update (Silent)
- **No UI shown**: Updates automatically in background
- **No user interruption**: Seamless experience
- **Console only**: Logs visible in DevTools

### Common Content
- **Current version**: Shows v1.12.3 format at bottom
- **Actions**: "✨ Atualizar Agora" (primary) and "Depois" (secondary)

## Technical Notes

### Version Comparison Algorithm
```typescript
function getUpdateType(): 'major' | 'minor' | 'patch' | null {
  const storedVersion = localStorage.getItem('app-version') // e.g., "1.12.2"
  const currentVersion = APP_VERSION // e.g., { major: 1, minor: 12, patch: 3 }
  
  // Compare major → minor → patch in order
  if (current.major > stored.major) return 'major'
  if (current.minor > stored.minor) return 'minor'
  if (current.patch > stored.patch) return 'patch'
  
  return null // No update
}
```

### Service Worker Lifecycle
1. **Install**: New SW is downloaded and installed
2. **Wait**: New SW waits for old SW to be released
3. **Activate**: New SW takes control when:
   - All tabs are closed (normal flow)
   - User clicks update (prompt flow) ← **We use this**
   - Patch auto-update (immediate) ← **New!**
4. **Fetch**: New SW handles all network requests

### Cache Strategy
- **Static assets**: Precached (HTML, CSS, JS, images)
- **API calls**: Network-first with fallback
- **Firebase**: Network-first for Firestore, cache-first for Storage

### Update Detection
The service worker compares:
- File hashes (content changes)
- Manifest changes
- Service worker file itself

If any of these change, `needRefresh` becomes `true`.

## Future Improvements

### Possible Enhancements
1. **Intelligent intervals**: Check more frequently after deploy, less after time
2. **Version comparison**: Only show notification for minor/major updates
3. **Release notes**: Show what's new in the update notification
4. **Background updates**: Auto-update patches, prompt for minor/major
5. **Update progress**: Show download progress for large updates
6. **Retry mechanism**: Automatically retry failed update checks

### Analytics
Consider tracking:
- Update notification display rate
- Update acceptance rate
- Time to update after notification
- Failed update attempts

## References
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Service Worker Guide](https://developer.chrome.com/docs/workbox/)
- [PWA Update Best Practices](https://web.dev/service-worker-lifecycle/)
