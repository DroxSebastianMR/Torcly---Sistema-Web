export type ThemeMode = 'light' | 'dark' | 'system'

export type ResolvedTheme = Exclude<ThemeMode, 'system'>

export interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}
