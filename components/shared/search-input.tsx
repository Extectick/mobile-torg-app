'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft, FolderOpen, Search, SlidersHorizontal, X } from 'lucide-react'
import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useClickAway, useDebounce } from 'ahooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '../ui'
import { Api } from '@/services/api-client'
import { SearchCategory, SearchProduct, SearchResponse } from '@/services/search'

interface Props {
  className?: string
  initialQuery?: string
  onFocusChange?: (focused: boolean) => void
  variant?: 'default' | 'floating'
  resultsPlacement?: 'bottom' | 'top'
  mobileFullscreen?: boolean
  onFilterClick?: () => void
}

type SuggestionItem =
  | { type: 'category'; category: SearchCategory }
  | { type: 'product'; product: SearchProduct }
  | { type: 'search' }

const emptyResults: SearchResponse = {
  products: [],
  categories: [],
}

export const SearchInput: React.FC<Props> = ({
  className,
  initialQuery = '',
  onFocusChange,
  variant = 'default',
  resultsPlacement = 'bottom',
  mobileFullscreen = false,
  onFilterClick,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('query') || ''
  const [focused, setFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(urlQuery || initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResponse>(emptyResults)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [mounted, setMounted] = useState(false)
  const clickedItemRef = useRef(false)
  const keyboardOpenRef = useRef(false)
  const suppressFullscreenOpenUntilRef = useRef(0)
  const fullscreenHistoryActiveRef = useRef(false)
  const modalOpen = mobileFullscreen && fullscreenOpen

  const debouncedQuery = useDebounce(searchQuery, { wait: 300 })
  const suggestionItems = useMemo<SuggestionItem[]>(() => [
    { type: 'search' as const },
    ...results.categories.map((category) => ({ type: 'category' as const, category })),
    ...results.products.map((product) => ({ type: 'product' as const, product })),
  ], [results])

  useEffect(() => {
    setSearchQuery(urlQuery || initialQuery)
  }, [initialQuery, urlQuery])

  const closeSearch = useCallback(() => {
    if (!clickedItemRef.current) {
      setFocused(false)
      setFullscreenOpen(false)
      setResults(emptyResults)
      setActiveIndex(-1)
    }
    clickedItemRef.current = false
  }, [])

  const closeFullscreenHistoryEntry = useCallback((action: 'back' | 'release' | 'none') => {
    if (!fullscreenHistoryActiveRef.current || typeof window === 'undefined') {
      return
    }

    fullscreenHistoryActiveRef.current = false

    if (action === 'back') {
      window.history.back()
      return
    }

    if (action === 'release') {
      const currentState = window.history.state

      if (currentState && typeof currentState === 'object' && currentState.__mobileSearchFullscreen) {
        const nextState = { ...currentState }
        delete nextState.__mobileSearchFullscreen
        window.history.replaceState(nextState, '', window.location.href)
      }
    }
  }, [])

  const closeFullscreenSearch = useCallback((options?: { history?: 'back' | 'release' | 'none' }) => {
    suppressFullscreenOpenUntilRef.current = Date.now() + 450
    clickedItemRef.current = false
    setFocused(false)
    setFullscreenOpen(false)
    setResults(emptyResults)
    setActiveIndex(-1)
    inputRef.current?.blur()
    modalInputRef.current?.blur()
    closeFullscreenHistoryEntry(options?.history ?? 'release')
  }, [closeFullscreenHistoryEntry])

  const clearSearch = useCallback((options?: { keepClosed?: boolean }) => {
    clickedItemRef.current = false
    setSearchQuery('')
    setResults(emptyResults)
    setActiveIndex(-1)

    if (urlQuery) {
      closeFullscreenHistoryEntry('release')
      router.replace('/')
      closeFullscreenSearch({ history: 'none' })
      return
    }

    if (options?.keepClosed) {
      setFocused(false)
      setFullscreenOpen(false)
      return
    }

    if (modalOpen) {
      closeFullscreenSearch({ history: 'back' })
    } else if (!mobileFullscreen) {
      setFocused(false)
    } else {
      setFocused(true)
      setFullscreenOpen(true)
    }
  }, [closeFullscreenHistoryEntry, closeFullscreenSearch, mobileFullscreen, modalOpen, router, urlQuery])

  useClickAway(() => {
    if (mobileFullscreen) {
      return
    }

    closeSearch()
  }, containerRef)

  const runAfterFullscreenClose = useCallback((callback: () => void) => {
    closeFullscreenHistoryEntry('release')
    callback()
    closeFullscreenSearch({ history: 'none' })
  }, [closeFullscreenHistoryEntry, closeFullscreenSearch])

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery) {
      runAfterFullscreenClose(() => {
        router.push(`/?query=${encodeURIComponent(trimmedQuery)}`)
      })
    }
  }, [router, runAfterFullscreenClose, searchQuery])

  const handleCategorySelect = useCallback((categoryId: number) => {
    clickedItemRef.current = true
    setSearchQuery('')
    runAfterFullscreenClose(() => {
      router.push(`/?category=${categoryId}`)
    })
  }, [router, runAfterFullscreenClose])

  const handleProductSelect = useCallback((productId: number) => {
    clickedItemRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.set('product', String(productId))

    runAfterFullscreenClose(() => {
      router.push(`/?${params.toString()}`, { scroll: false })
    })
  }, [router, runAfterFullscreenClose, searchParams])

  const activateItem = useCallback((item: SuggestionItem) => {
    if (item.type === 'category') {
      handleCategorySelect(item.category.id)
      return
    }

    if (item.type === 'product') {
      handleProductSelect(item.product.id)
      return
    }

    handleSearch()
  }, [handleCategorySelect, handleProductSelect, handleSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (modalOpen) {
          closeFullscreenSearch()
        } else {
          closeSearch()
        }
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && suggestionItems[activeIndex]) {
          activateItem(suggestionItems[activeIndex])
        } else {
          handleSearch()
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => Math.min(prev + 1, suggestionItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => Math.max(prev - 1, -1))
        break
    }
  }, [activateItem, activeIndex, closeFullscreenSearch, closeSearch, handleSearch, modalOpen, suggestionItems])

  useEffect(() => {
    const controller = new AbortController()
    const searchIsActive = focused || modalOpen

    const fetchSuggestions = async () => {
      if (!searchIsActive) {
        return
      }

      if (!debouncedQuery.trim()) {
        setResults(emptyResults)
        setActiveIndex(-1)
        return
      }

      try {
        setIsLoading(true)
        const data = await Api.search.search(debouncedQuery, {
          signal: controller.signal,
          limit: 10,
        })
        setResults(data)
        setActiveIndex(-1)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Search error:', error)
          setResults(emptyResults)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      controller.abort()
    }
  }, [debouncedQuery, focused, modalOpen])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    onFocusChange?.(focused || modalOpen)
  }, [focused, modalOpen, onFocusChange])

  useEffect(() => {
    if (variant !== 'floating') {
      return
    }

    window.dispatchEvent(new CustomEvent('mobile-search-focus-change', {
      detail: { focused: focused || modalOpen },
    }))

    return () => {
      window.dispatchEvent(new CustomEvent('mobile-search-focus-change', {
        detail: { focused: false },
      }))
    }
  }, [focused, modalOpen, variant])

  useEffect(() => {
    if (focused) {
      setShowOverlay(true)
    } else {
      const timer = setTimeout(() => setShowOverlay(false), 200)
      return () => clearTimeout(timer)
    }
  }, [focused])

  useEffect(() => {
    if (!modalOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      modalInputRef.current?.focus()
    }, 80)

    return () => window.clearTimeout(timer)
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modalOpen])

  useEffect(() => {
    if (!mobileFullscreen || !modalOpen || typeof window === 'undefined') {
      return
    }

    if (fullscreenHistoryActiveRef.current) {
      return
    }

    fullscreenHistoryActiveRef.current = true
    const currentState = window.history.state
    const nextState = {
      ...(currentState && typeof currentState === 'object' ? currentState : {}),
      __mobileSearchFullscreen: true,
    }

    window.history.pushState(nextState, '', window.location.href)
  }, [mobileFullscreen, modalOpen])

  useEffect(() => {
    if (!mobileFullscreen || typeof window === 'undefined') {
      return
    }

    const handlePopState = () => {
      if (!fullscreenHistoryActiveRef.current) {
        return
      }

      fullscreenHistoryActiveRef.current = false
      closeFullscreenSearch({ history: 'none' })
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [closeFullscreenSearch, mobileFullscreen])

  useEffect(() => {
    if (mobileFullscreen || variant !== 'floating' || !focused || typeof window === 'undefined' || !window.visualViewport) {
      return
    }

    const viewport = window.visualViewport
    const initialHeight = viewport.height
    keyboardOpenRef.current = false

    const handleViewportResize = () => {
      const heightDiff = initialHeight - viewport.height

      if (heightDiff > 120) {
        keyboardOpenRef.current = true
        return
      }

      if (keyboardOpenRef.current) {
        keyboardOpenRef.current = false
        closeSearch()
        inputRef.current?.blur()
        modalInputRef.current?.blur()
      }
    }

    viewport.addEventListener('resize', handleViewportResize)

    return () => {
      viewport.removeEventListener('resize', handleViewportResize)
    }
  }, [closeSearch, focused, mobileFullscreen, variant])

  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`)

      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [activeIndex])

  const overlay = showOverlay ? (
    <div
      className={cn(
        //'fixed inset-0 z-60 bg-black/50 transition-opacity duration-200',
        focused ? 'opacity-100' : 'opacity-0',
      )}
    />
  ) : null

  const handleFullscreenFilterClick = useCallback(() => {
    closeFullscreenSearch()
    window.setTimeout(() => {
      onFilterClick?.()
    }, 120)
  }, [closeFullscreenSearch, onFilterClick])

  const openFullscreenSearch = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (!mobileFullscreen) {
      return
    }

    if (Date.now() < suppressFullscreenOpenUntilRef.current) {
      return
    }

    event?.preventDefault()
    event?.stopPropagation()
    clickedItemRef.current = false
    setFocused(false)
    setFullscreenOpen(true)
  }, [mobileFullscreen])

  const resultsList = useMemo(() => {
    if (isLoading) {
      return (
        <ul>
          <li
            key="search-action"
            data-index={0}
            className={cn(
              'sticky top-0 z-10 cursor-pointer border-b border-gray-100 bg-white p-3 font-medium text-primary shadow-sm transition-all duration-150 hover:bg-primary/5',
              activeIndex === 0 && 'bg-primary/10',
            )}
            onMouseDown={() => {
              clickedItemRef.current = true
            }}
            onClick={handleSearch}
          >
            <div className="flex min-w-0 items-center">
              <div className={cn('mr-3 h-6 w-1 rounded-full', activeIndex === 0 ? 'bg-primary' : 'bg-transparent')} />
              <Search className="mr-3 size-4 shrink-0" />
              <span className="min-w-0 truncate">Искать &quot;{searchQuery}&quot;</span>
            </div>
          </li>
          <li className="p-4 text-center text-gray-500">Загрузка...</li>
        </ul>
      )
    }

    const renderCategory = (category: SearchCategory, index: number) => (
      <li
        key={`category-${category.id}`}
        data-index={index}
        className={cn(
          'group cursor-pointer border-b border-gray-100 p-3 transition-all duration-150 hover:bg-gray-50',
          activeIndex === index && 'bg-primary/5',
        )}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleCategorySelect(category.id)}
      >
        <div className="flex min-w-0 items-center">
          <div className={cn('mr-3 h-8 w-1 rounded-full transition-all duration-200', activeIndex === index ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-300')} />
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
            {category.image ? (
              <img className="h-auto w-full object-contain" src={category.image} alt="" loading="lazy" />
            ) : (
              <FolderOpen className="size-5 text-gray-400" />
            )}
          </span>
          <span className="ml-3 min-w-0 flex-1">
            <span className={cn('block truncate text-sm font-bold', activeIndex === index && 'text-primary')}>
              {category.name}
            </span>
            <span className="block truncate text-xs text-gray-400">{category.productCount} товаров</span>
          </span>
        </div>
      </li>
    )

    const renderProduct = (product: SearchProduct, index: number) => (
      <li
        key={`product-${product.id}`}
        data-index={index}
        className={cn(
          'group cursor-pointer border-b border-gray-100 p-3 transition-all duration-150 hover:bg-gray-50',
          activeIndex === index && 'bg-primary/5',
        )}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleProductSelect(product.id)}
      >
        <div className="flex min-w-0 items-center">
          <div className={cn('mr-3 h-8 w-1 rounded-full transition-all duration-200', activeIndex === index ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-300')} />
          <img
            className="size-10 shrink-0 rounded-md object-cover ring-1 ring-black/5"
            src={product.imagesJson}
            alt={product.name}
            loading="lazy"
          />
          <span className="ml-3 min-w-0 flex-1">
            <span className={cn('block truncate text-sm font-bold', activeIndex === index && 'text-primary')}>
              {product.name}
            </span>
            {product.category?.name && (
              <span className="block truncate text-xs text-gray-400">{product.category.name}</span>
            )}
          </span>
        </div>
      </li>
    )

    const content: React.ReactNode[] = []
    let currentIndex = 1

    content.push(
      <li
        key="search-action"
        data-index={0}
        className={cn(
          'sticky top-0 z-10 cursor-pointer border-b border-gray-100 bg-white p-3 font-medium text-primary shadow-sm transition-all duration-150 hover:bg-primary/5',
          activeIndex === 0 && 'bg-primary/10',
        )}
        onMouseDown={() => {
          clickedItemRef.current = true
        }}
        onClick={handleSearch}
      >
        <div className="flex min-w-0 items-center">
          <div className={cn('mr-3 h-6 w-1 rounded-full', activeIndex === 0 ? 'bg-primary' : 'bg-transparent')} />
          <Search className="mr-3 size-4 shrink-0" />
          <span className="min-w-0 truncate">Искать &quot;{searchQuery}&quot;</span>
        </div>
      </li>,
    )

    if (results.categories.length > 0) {
      content.push(
        <li key="categories-title" className="px-4 pb-1 pt-3 text-xs font-bold uppercase text-gray-400">
          Группы
        </li>,
      )
      results.categories.forEach((category) => {
        content.push(renderCategory(category, currentIndex))
        currentIndex += 1
      })
    }

    if (results.products.length > 0) {
      content.push(
        <li key="products-title" className="px-4 pb-1 pt-3 text-xs font-bold uppercase text-gray-400">
          Товары
        </li>,
      )
      results.products.forEach((product) => {
        content.push(renderProduct(product, currentIndex))
        currentIndex += 1
      })
    }

    return <ul>{content}</ul>
  }, [activeIndex, handleCategorySelect, handleProductSelect, handleSearch, isLoading, results, searchQuery])

  const fullscreenModal = modalOpen ? (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white lg:hidden [contain:layout_paint]"
    >
      <div className="sticky top-0 z-10 transform-gpu animate-in fade-in slide-in-from-top-2 duration-200 border-b border-black/5 bg-white/95 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-sm">
        <form
          role="search"
          action="/"
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault()
            handleSearch()
          }}
          className="flex items-center gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-2xl border-gray-100 bg-white text-gray-700 shadow-md shadow-black/10 transition hover:bg-white"
            aria-label="Назад"
            onClick={() => closeFullscreenSearch({ history: 'back' })}
          >
            <ArrowLeft className="size-5" />
          </Button>

          <div className="relative h-11 min-w-0 flex-1 rounded-2xl bg-white shadow-[0_0_0_3px_rgba(154,196,44,0.16),0_12px_30px_rgba(0,0,0,0.08)]">
            <Search className="absolute left-3 top-1/2 h-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={modalInputRef}
              className="h-full w-full rounded-2xl border border-primary/20 bg-white pl-11 pr-11 text-base outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
              type="search"
              name="mobile-product-query"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="search"
              enterKeyHint="search"
              placeholder="Найти продукт..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  clearSearch()
                }}
                className="absolute right-1.5 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-gray-200 p-2 text-gray-600 transition hover:bg-gray-300"
                aria-label="Очистить поиск"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 shrink-0 rounded-2xl border-gray-100 bg-white text-gray-700 shadow-md shadow-black/10 transition hover:bg-white"
            aria-label="Открыть фильтры"
            onClick={handleFullscreenFilterClick}
          >
            <SlidersHorizontal className="size-5" />
          </Button>
        </form>
      </div>

      <div ref={resultsRef} className="min-h-0 flex-1 bg-white">
        {searchQuery ? (
          <div className="w-full transform-gpu animate-in fade-in slide-in-from-bottom-1 duration-150">
            {resultsList}
          </div>
        ) : (
          <div className="flex h-full min-h-[18rem] flex-col items-center justify-start px-8 pt-16 text-center text-gray-400">
            <Search className="mb-4 size-10 text-primary/40" />
            <p className="text-base font-bold text-gray-500">Начните вводить название товара</p>
          </div>
        )}
      </div>
    </div>
  ) : null

  return (
    <div className="relative w-full">
      {mounted && overlay ? createPortal(overlay, document.body) : null}
      {mounted && fullscreenModal ? createPortal(fullscreenModal, document.body) : null}

      {mobileFullscreen ? (
        <div
          role="search"
          onClick={openFullscreenSearch}
          className={cn(
            'relative z-90 flex h-11 flex-1 justify-between rounded-2xl transition-[background-color,box-shadow,opacity] duration-200',
            variant === 'floating' && (
              focused
                ? 'bg-white opacity-100 shadow-[0_0_0_3px_rgba(154,196,44,0.20),0_12px_36px_rgba(154,196,44,0.22)]'
                : 'bg-white/85 opacity-95 shadow-lg shadow-black/10'
            ),
            className,
          )}
        >
          <Search className="absolute left-3 top-1/2 h-5 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            onClick={openFullscreenSearch}
            className={cn(
              'h-full w-full rounded-2xl border pl-11 pr-20 text-left outline-none transition-all duration-200',
              variant === 'floating'
                ? 'border-white/70 bg-white/85 text-gray-700 placeholder:text-gray-500 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/25'
                : 'border-gray-200 bg-gray-100 text-gray-700 shadow-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
              !searchQuery && 'text-gray-400',
            )}
          >
            <span className="block truncate">{searchQuery || 'Найти продукт...'}</span>
          </button>
          {searchQuery && (
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.stopPropagation()
                clearSearch({ keepClosed: true })
              }}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-200 p-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-300 after:absolute after:inset-0 after:bg-white/10 after:opacity-0 after:transition-opacity after:duration-300 hover:bg-gray-300 hover:text-gray-700 hover:after:opacity-100 active:scale-95 active:shadow-none"
              aria-label="Очистить поиск"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
      <>
      <form
        ref={containerRef}
        role="search"
        action="/"
        autoComplete="off"
        onClick={openFullscreenSearch}
        onSubmit={(event) => {
          event.preventDefault()
          handleSearch()
        }}
        className={cn(
          'relative z-90 flex h-11 flex-1 justify-between rounded-2xl transition-[background-color,box-shadow,opacity] duration-200',
          variant === 'floating' && (
            focused
              ? 'bg-white opacity-100 shadow-[0_0_0_3px_rgba(154,196,44,0.20),0_12px_36px_rgba(154,196,44,0.22)]'
              : 'bg-white/85 opacity-95 shadow-lg shadow-black/10'
          ),
          className,
        )}
      >
        <Search className="absolute left-3 top-1/2 h-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          className={cn(
            'w-full rounded-2xl border pl-11 pr-20 outline-none transition-all duration-200',
            '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
            variant === 'floating'
              ? 'border-white/70 bg-white/85 placeholder:text-gray-500 focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/25'
              : 'border-gray-200 bg-gray-100 shadow-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
          )}
          type="search"
          name="product-query"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="search"
          enterKeyHint="search"
          placeholder="Найти продукт..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            clickedItemRef.current = false
            setFocused(true)
            if (mobileFullscreen) {
              setFullscreenOpen(true)
            }
          }}
          onBlur={() => {
            if (mobileFullscreen) {
              return
            }

            if (!clickedItemRef.current) {
              setTimeout(closeSearch, 100)
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {searchQuery && (
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.stopPropagation()
              clearSearch()
            }}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-200 p-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-300 after:absolute after:inset-0 after:bg-white/10 after:opacity-0 after:transition-opacity after:duration-300 hover:bg-gray-300 hover:text-gray-700 hover:after:opacity-100 active:scale-95 active:shadow-none"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {focused && searchQuery && !modalOpen && (
        <div
          ref={resultsRef}
          className={cn(
            'absolute left-0 right-0 z-90 max-h-[min(24rem,calc(100dvh-var(--app-header-height,80px)-1rem))] overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-xl',
            resultsPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {resultsList}
        </div>
      )}
      </>
      )}
    </div>
  )
}
