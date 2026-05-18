'use client'

import { cn } from '@/lib/utils'
import { FolderOpen, Search, X } from 'lucide-react'
import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useClickAway, useDebounce } from 'ahooks'
import { useRouter, useSearchParams } from 'next/navigation'
import { Api } from '@/services/api-client'
import { SearchCategory, SearchProduct, SearchResponse } from '@/services/search'

interface Props {
  className?: string
  initialQuery?: string
  onFocusChange?: (focused: boolean) => void
}

type SuggestionItem =
  | { type: 'category'; category: SearchCategory }
  | { type: 'product'; product: SearchProduct }
  | { type: 'search' }

const emptyResults: SearchResponse = {
  products: [],
  categories: [],
}

export const SearchInput: React.FC<Props> = ({ className, initialQuery = '', onFocusChange }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('query') || ''
  const [focused, setFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState(urlQuery || initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResponse>(emptyResults)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [mounted, setMounted] = useState(false)
  const clickedItemRef = useRef(false)

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
      setResults(emptyResults)
      setActiveIndex(-1)
    }
    clickedItemRef.current = false
  }, [])

  const clearSearch = useCallback(() => {
    clickedItemRef.current = false
    setSearchQuery('')
    setResults(emptyResults)
    setActiveIndex(-1)
    setFocused(false)

    if (urlQuery) {
      router.push('/')
    }
  }, [router, urlQuery])

  useClickAway(closeSearch, containerRef)

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery) {
      router.push(`/?query=${encodeURIComponent(trimmedQuery)}`)
      closeSearch()
      inputRef.current?.blur()
    }
  }, [searchQuery, router, closeSearch])

  const handleCategorySelect = useCallback((categoryId: number) => {
    clickedItemRef.current = true
    setSearchQuery('')
    router.push(`/?category=${categoryId}`)
    closeSearch()
    inputRef.current?.blur()
  }, [router, closeSearch])

  const handleProductSelect = useCallback((productId: number) => {
    clickedItemRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.set('product', String(productId))

    router.push(`/?${params.toString()}`, { scroll: false })
    closeSearch()
    inputRef.current?.blur()
  }, [router, searchParams, closeSearch])

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
        closeSearch()
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
  }, [activateItem, activeIndex, closeSearch, handleSearch, suggestionItems])

  useEffect(() => {
    const controller = new AbortController()

    const fetchSuggestions = async () => {
      if (!focused) {
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
  }, [debouncedQuery, focused])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    onFocusChange?.(focused)
  }, [focused, onFocusChange])

  useEffect(() => {
    if (focused) {
      setShowOverlay(true)
    } else {
      const timer = setTimeout(() => setShowOverlay(false), 200)
      return () => clearTimeout(timer)
    }
  }, [focused])

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
        //'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200',
        focused ? 'opacity-100' : 'opacity-0',
      )}
    />
  ) : null

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

  return (
    <div className="relative w-full">
      {mounted && overlay ? createPortal(overlay, document.body) : null}

      <div
        ref={containerRef}
        className={cn(
          'relative z-[90] flex h-11 flex-1 justify-between rounded-2xl',
          className,
        )}
      >
        <Search className="absolute left-3 top-1/2 h-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          className="w-full rounded-2xl border border-gray-200 bg-gray-100 pl-11 pr-20 outline-none shadow-sm transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          type="text"
          placeholder="Найти продукт..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            clickedItemRef.current = false
            setFocused(true)
          }}
          onBlur={() => {
            if (!clickedItemRef.current) {
              setTimeout(closeSearch, 100)
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-200 p-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-300 after:absolute after:inset-0 after:bg-white/10 after:opacity-0 after:transition-opacity after:duration-300 hover:bg-gray-300 hover:text-gray-700 hover:after:opacity-100 active:scale-95 active:shadow-none"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {focused && searchQuery && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 top-full z-[90] mt-2 max-h-[min(24rem,calc(100vh-8rem))] overflow-y-auto rounded-lg border border-gray-100 bg-white shadow-xl"
        >
          {resultsList}
        </div>
      )}
    </div>
  )
}
