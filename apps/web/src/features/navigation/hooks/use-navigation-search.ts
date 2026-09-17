import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  searchNavigation,
  type NavigationLink,
} from '../utils/navigation-search'

export function useNavigationSearch(items: readonly NavigationLink[]) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const results = searchNavigation(items, query)

  function openSearch() {
    setQuery('')
    dialogRef.current?.showModal()
    inputRef.current?.focus()
  }
  function closeSearch() {
    dialogRef.current?.close()
  }
  function restoreFocus() {
    triggerRef.current?.focus()
  }
  function selectResult(path: string) {
    closeSearch()
    void navigate(path)
  }

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setQuery('')
        dialogRef.current?.showModal()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  return {
    dialogRef,
    triggerRef,
    inputRef,
    query,
    setQuery,
    results,
    openSearch,
    closeSearch,
    restoreFocus,
    selectResult,
  }
}
