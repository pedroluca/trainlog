# Settings Guide

## Overview
The Settings page provides users with control over their account and app preferences. Currently includes audio notifications toggle and password change functionality.

## Features

### 1. Audio Notifications Toggle
- **Location**: Settings page (`/settings`)
- **Default**: OFF (disabled by default)
- **Purpose**: Controls whether a beep sound plays when the break timer ends
- **Storage**: Saved in Firestore under `usuarios/{userId}/audioEnabled`

#### How it works:
1. User navigates to Settings from Profile page
2. Toggle switch controls the audio notification setting
3. Setting is saved to Firestore immediately
4. TrainingCard component checks the setting on mount
5. Beep sound only plays if `audioEnabled === true`

### 2. Password Change
- **Location**: Settings page
- **Security**: Requires current password for authentication
- **Validation**:
  - All fields required
  - Minimum 6 characters for new password
  - New password must match confirmation
  - New password must be different from current

#### Flow:
1. User clicks "Alterar Senha" button
2. Form appears with three fields:
   - Current password
   - New password
   - Confirm new password
3. Firebase re-authenticates user with current password
4. Updates password using Firebase Auth
5. Success message shown, form auto-closes after 3 seconds

## Technical Implementation

### Files Modified:
- `src/pages/settings.tsx` - New settings page
- `src/pages/profile.tsx` - Added "Configurações" button
- `src/components/training-card.tsx` - Audio setting check
- `src/app.tsx` - Added `/settings` route

### Firestore Schema Addition:
```typescript
usuarios/{userId} {
  audioEnabled: boolean // Default: undefined (treated as false)
}
```

### Component Structure:

#### Settings Page
```tsx
- Audio Settings Section
  - Toggle switch (custom CSS toggle)
  - Description text
  
- Password Change Section
  - Collapsible form
  - Current password input
  - New password input
  - Confirm password input
  - Error/Success messages
  
- Future Settings Placeholder
  - Dark mode (coming soon)
  - Units of measurement (coming soon)
  - Custom notifications (coming soon)
```

## User Flow

### Enable Audio Notifications:
1. Profile → Configurações
2. Toggle "Som ao final do descanso" to ON
3. Setting saved automatically
4. Return to workout
5. Complete a set → timer starts
6. When timer ends → beep sound plays

### Change Password:
1. Profile → Configurações
2. Click "Alterar Senha"
3. Fill in all three fields
4. Click "Confirmar Alteração"
5. System validates and updates password
6. Success message shown

## Future Enhancements
- Dark mode toggle
- Units of measurement (kg/lbs)
- Custom notification sounds
- Timer sound volume control
- Exercise rest timer defaults
- Language preferences
- Data export/import

## Notes
- Audio is disabled by default to avoid unexpected sounds
- Password changes require re-authentication for security
- Settings are user-specific and synced via Firestore
- Settings page has bottom bar navigation for easy access
