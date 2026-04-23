import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type ThemeMode = 'light' | 'dark' | 'system'

// Palette of available primary colors
export const PRIMARY_COLORS = [
  { name: 'Verde', hex: '#27AE60', dark: '#219150' },
  { name: 'Azul', hex: '#2980B9', dark: '#2471A3' },
  { name: 'Roxo', hex: '#8E44AD', dark: '#7D3C98' },
  { name: 'Vermelho', hex: '#E74C3C', dark: '#CB4335' },
  { name: 'Laranja', hex: '#E67E22', dark: '#CA6F1E' },
  { name: 'Rosa', hex: '#E91E8C', dark: '#C2185B' },
  { name: 'Ciano', hex: '#00BCD4', dark: '#0097A7' },
] as const

export type PrimaryColorHex = typeof PRIMARY_COLORS[number]['hex']

const DEFAULT_COLOR = PRIMARY_COLORS[0]

interface ThemeContextType {
  // Theme mode (includes 'system')
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  // Resolved theme (always 'light' or 'dark', following system if needed)
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  // Primary color
  primaryColor: PrimaryColorHex
  setPrimaryColor: (color: PrimaryColorHex) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeToDom(resolved: 'light' | 'dark') {
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function applyColorToDom(hex: string, dark: string) {
  document.documentElement.style.setProperty('--color-primary', hex)
  document.documentElement.style.setProperty('--color-primary-dark', dark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColorHex>(DEFAULT_COLOR.hex)
  const [isLoading, setIsLoading] = useState(true)

  // Apply system preference listener when mode === 'system'
  useEffect(() => {
    if (themeMode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyThemeToDom(resolved)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [themeMode])

  // Load persisted settings from Firestore / localStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        // Apply from localStorage immediately to avoid flash
        const localMode = localStorage.getItem('themeMode') as ThemeMode | null
        const localColor = localStorage.getItem('primaryColor') as PrimaryColorHex | null

        const mode: ThemeMode = localMode ?? 'light'
        const color: PrimaryColorHex = localColor ?? DEFAULT_COLOR.hex
        const colorEntry = PRIMARY_COLORS.find(c => c.hex === color) ?? DEFAULT_COLOR

        const resolved = mode === 'system' ? getSystemTheme() : mode
        setThemeModeState(mode)
        setResolvedTheme(resolved)
        setPrimaryColorState(color)
        applyThemeToDom(resolved)
        applyColorToDom(colorEntry.hex, colorEntry.dark)

        // Then sync from Firestore
        const usuarioId = localStorage.getItem('usuarioId')
        if (usuarioId) {
          const userDoc = await getDoc(doc(db, 'usuarios', usuarioId))
          if (userDoc.exists()) {
            const data = userDoc.data()
            const fsMode = (data.themeMode ?? data.theme ?? 'light') as ThemeMode
            const fsColor = (data.primaryColor ?? DEFAULT_COLOR.hex) as PrimaryColorHex
            const fsColorEntry = PRIMARY_COLORS.find(c => c.hex === fsColor) ?? DEFAULT_COLOR
            const fsResolved = fsMode === 'system' ? getSystemTheme() : fsMode

            setThemeModeState(fsMode)
            setResolvedTheme(fsResolved)
            setPrimaryColorState(fsColor)
            applyThemeToDom(fsResolved)
            applyColorToDom(fsColorEntry.hex, fsColorEntry.dark)

            localStorage.setItem('themeMode', fsMode)
            localStorage.setItem('primaryColor', fsColor)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar aparência:', err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const setThemeMode = async (mode: ThemeMode) => {
    const resolved = mode === 'system' ? getSystemTheme() : mode
    setThemeModeState(mode)
    setResolvedTheme(resolved)
    applyThemeToDom(resolved)
    localStorage.setItem('themeMode', mode)

    const usuarioId = localStorage.getItem('usuarioId')
    if (usuarioId) {
      try {
        await updateDoc(doc(db, 'usuarios', usuarioId), { themeMode: mode, theme: resolved })
      } catch (err) {
        console.error('Erro ao salvar modo de tema:', err)
      }
    }
  }

  // Legacy helpers (keep for backwards compat in the rest of the app)
  const setTheme = (newTheme: 'light' | 'dark') => setThemeMode(newTheme)
  const toggleTheme = () => {
    const next = resolvedTheme === 'light' ? 'dark' : 'light'
    setThemeMode(next)
  }

  const setPrimaryColor = async (color: PrimaryColorHex) => {
    const entry = PRIMARY_COLORS.find(c => c.hex === color) ?? DEFAULT_COLOR
    setPrimaryColorState(color)
    applyColorToDom(entry.hex, entry.dark)
    localStorage.setItem('primaryColor', color)

    const usuarioId = localStorage.getItem('usuarioId')
    if (usuarioId) {
      try {
        await updateDoc(doc(db, 'usuarios', usuarioId), { primaryColor: color })
      } catch (err) {
        console.error('Erro ao salvar cor principal:', err)
      }
    }
  }

  if (isLoading) return null

  return (
    <ThemeContext.Provider value={{
      themeMode,
      setThemeMode,
      theme: resolvedTheme,
      toggleTheme,
      setTheme,
      primaryColor,
      setPrimaryColor,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
