// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '../hooks/use-theme'
import { ThemeProvider, themeStorageKey } from './theme-provider'

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <p>{`${theme}:${resolvedTheme}`}</p>
      <button type="button" onClick={() => setTheme('system')}>
        Sistema
      </button>
      <button type="button" onClick={toggleTheme}>
        Alternar
      </button>
    </div>
  )
}

function mockMatchMedia(initialMatches = false) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initialMatches
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      get matches() {
        return matches
      },
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
    }),
  })

  return {
    emitChange(nextMatches: boolean) {
      matches = nextMatches
      listeners.forEach((listener) =>
        listener({ matches: nextMatches } as MediaQueryListEvent),
      )
    },
  }
}

describe('ThemeProvider', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.removeProperty('color-scheme')
  })

  it('restaura el tema guardado y aplica la clase dark', async () => {
    mockMatchMedia(false)
    window.localStorage.setItem(themeStorageKey, 'dark')
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(await screen.findByText('dark:dark')).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('alterna, persiste la preferencia y respeta la opción system', async () => {
    const media = mockMatchMedia(true)
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Alternar' }))
    expect(window.localStorage.getItem(themeStorageKey)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Sistema' }))
    expect(window.localStorage.getItem(themeStorageKey)).toBe('system')
    expect(await screen.findByText('system:dark')).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    media.emitChange(false)
    expect(await screen.findByText('system:light')).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
