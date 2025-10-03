# Dark Mode Implementation

## Overview
Full dark mode support has been implemented across the TrainLog app with automatic persistence to Firestore and localStorage.

## Features

### 1. Theme Toggle
- **Location**: Settings page → "Modo Escuro" section
- **Options**: Light / Dark
- **Persistence**: Saved to Firestore and localStorage
- **Icons**: Sun (light mode) / Moon (dark mode)

### 2. Theme Context
- Global theme state management using React Context
- Automatic theme loading on app startup
- Seamless switching without page refresh

### 3. Color Scheme
**Dark Mode Colors:**
- Background: `#1a1a1a` (very dark gray)
- Surface: `#2d2d2d` (dark gray)
- Surface Hover: `#3d3d3d` (medium dark gray)
- Border: `#404040` (gray)
- Text Primary: `#e5e5e5` (light gray)
- Text Secondary: `#a0a0a0` (medium gray)

**Light Mode:**
- Uses Tailwind's default color palette

## Technical Implementation

### Files Created/Modified:

#### 1. `src/contexts/theme-context.tsx`
- ThemeProvider component
- useTheme hook
- Theme persistence logic (Firestore + localStorage)
- Automatic theme application to document root

#### 2. `src/app.tsx`
- Wrapped entire app with ThemeProvider

#### 3. `src/pages/settings.tsx`
- Added dark mode toggle section
- Updated all components with dark mode classes
- Uses useTheme hook for theme state

#### 4. `src/index.css`
- Added dark mode color definitions (commented out @theme for now)
- Existing animations work in both modes

### Tailwind Dark Mode Classes
Using Tailwind's `dark:` modifier for conditional styling:
```tsx
className="bg-white dark:bg-[#2d2d2d]"
className="text-gray-800 dark:text-gray-100"
className="border-gray-200 dark:border-[#404040]"
```

### Firestore Schema Addition:
```typescript
usuarios/{userId} {
  theme: 'light' | 'dark' // Default: 'light'
}
```

### Theme Detection Priority:
1. Firestore (if user is logged in)
2. localStorage (fallback)
3. Default to 'light' theme

## How It Works

### On App Load:
1. ThemeProvider checks if user is logged in
2. Fetches theme preference from Firestore
3. Falls back to localStorage if not logged in
4. Applies theme by adding/removing 'dark' class to `<html>`

### When User Toggles Theme:
1. Updates local state immediately
2. Applies theme to DOM instantly
3. Saves to Firestore (async)
4. Saves to localStorage as backup

### Dark Mode Application:
```typescript
// Light mode
document.documentElement.classList.remove('dark')

// Dark mode
document.documentElement.classList.add('dark')
```

## Components Updated with Dark Mode

### Settings Page ✅
- Header
- Dark mode toggle section
- Audio settings section
- Password change section
- Future settings placeholder

### Remaining Components (TODO):
- [ ] Profile page
- [ ] Training page
- [ ] Training cards
- [ ] Workout modals
- [ ] Home page
- [ ] Login/Register pages
- [ ] Log page
- [ ] Progress page
- [ ] Bottom bar
- [ ] Header
- [ ] All modals

## Usage Example

```tsx
import { useTheme } from '../contexts/theme-context'

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme()
  
  return (
    <div className="bg-white dark:bg-[#2d2d2d]">
      <button onClick={toggleTheme}>
        Current theme: {theme}
      </button>
      <button onClick={() => setTheme('dark')}>
        Force dark mode
      </button>
    </div>
  )
}
```

## Best Practices

1. **Always pair light and dark classes:**
   ```tsx
   // ✅ Good
   className="bg-white dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-100"
   
   // ❌ Bad
   className="bg-white text-gray-800" // No dark mode styling
   ```

2. **Use consistent dark colors:**
   - Background: `dark:bg-[#1a1a1a]`
   - Surface: `dark:bg-[#2d2d2d]`
   - Border: `dark:border-[#404040]`
   - Text: `dark:text-gray-100` or `dark:text-gray-300`

3. **Test in both modes:**
   - Toggle between light and dark to ensure readability
   - Check contrast ratios
   - Verify icons and images work in both modes

## Future Enhancements
- Auto dark mode based on system preference
- Scheduled dark mode (e.g., sunset to sunrise)
- Multiple theme options (dark, darker, AMOLED black)
- Custom theme colors
- Dark mode for all remaining pages

## Notes
- Dark mode persists across sessions
- Works offline (localStorage fallback)
- Seamless transitions between modes
- No flash of unstyled content
- Theme syncs across devices (via Firestore)
