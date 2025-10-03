import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from Firestore on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const usuarioId = localStorage.getItem('usuarioId')
        
        if (usuarioId) {
          const userDocRef = doc(db, 'usuarios', usuarioId)
          const userDoc = await getDoc(userDocRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            const savedTheme = userData.theme as Theme
            
            if (savedTheme === 'dark' || savedTheme === 'light') {
              setThemeState(savedTheme)
              applyTheme(savedTheme)
            } else {
              // Default to light theme
              applyTheme('light')
            }
          }
        } else {
          // Not logged in, use localStorage fallback
          const localTheme = localStorage.getItem('theme') as Theme
          if (localTheme === 'dark' || localTheme === 'light') {
            setThemeState(localTheme)
            applyTheme(localTheme)
          } else {
            applyTheme('light')
          }
        }
      } catch (err) {
        console.error('Erro ao carregar tema:', err)
        applyTheme('light')
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)

    // Save to Firestore if logged in
    const usuarioId = localStorage.getItem('usuarioId')
    if (usuarioId) {
      try {
        const userDocRef = doc(db, 'usuarios', usuarioId)
        await updateDoc(userDocRef, {
          theme: newTheme
        })
      } catch (err) {
        console.error('Erro ao salvar tema:', err)
      }
    }

    // Also save to localStorage as fallback
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  if (isLoading) {
    return null // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
