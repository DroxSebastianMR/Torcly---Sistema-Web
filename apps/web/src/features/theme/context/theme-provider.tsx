import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { ThemeContext } from './theme-context'
import type { ResolvedTheme, ThemeMode } from '../types/theme.types'

export const themeStorageKey = 'torcly-theme-preference'

const darkMediaQuery = '(prefers-color-scheme: dark)'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getStoredTheme(): ThemeMode {
  try {
    const preference = window.localStorage.getItem(themeStorageKey)
    return isThemeMode(preference) ? preference : 'system'
  } catch {
    return 'system'
  }
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(darkMediaQuery).matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const mediaQuery = window.matchMedia(darkMediaQuery)
    const updateSystemTheme = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme: ThemeMode) => {
        setThemeState(nextTheme)
        try {
          window.localStorage.setItem(themeStorageKey, nextTheme)
        } catch {
          // La interfaz continúa funcionando si el navegador bloquea almacenamiento local.
        }
      },
      toggleTheme: () => {
        const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark'
        setThemeState(nextTheme)
        try {
          window.localStorage.setItem(themeStorageKey, nextTheme)
        } catch {
          // La interfaz continúa funcionando si el navegador bloquea almacenamiento local.
        }
      },
    }),
    [resolvedTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
