'use client'

import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useClickAway, useDebounce } from 'ahooks';
import { useRouter } from 'next/navigation';
import { Api } from '@/services/api-client';

interface Props {
  className?: string;
  initialQuery?: string;
}

interface Product {
  id: number;
  name: string;
  imagesJson: string;
}

export const SearchInput: React.FC<Props> = ({ className, initialQuery = '' }) => {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const clickedItemRef = useRef(false);

  const debouncedQuery = useDebounce(searchQuery, { wait: 300 });

  // Reset search query when initialQuery changes
  useEffect(() => {
    if (initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);


  const closeSearch = useCallback(() => {
    if (!clickedItemRef.current) {
      setFocused(false);
      setResults([]);
      setActiveIndex(-1);
    }
    clickedItemRef.current = false;
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  useClickAway(closeSearch, containerRef);

  
  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/?query=${encodeURIComponent(trimmedQuery)}`);
      closeSearch();
      inputRef.current?.blur();
    }
  }, [searchQuery, router, closeSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        closeSearch();
        break;
      case 'Enter':
        if (activeIndex >= 0 && results[activeIndex]) {
          router.push(`/product/${results[activeIndex].id}`);
          closeSearch();
        } else {
          handleSearch();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, results.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
        break;
    }
  }, [closeSearch, handleSearch, activeIndex, results, router]);

  // Fetch search suggestions
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const data = await Api.products.search(debouncedQuery, { 
          signal: controller.signal,
          limit: 10 // Добавляем лимит для оптимизации
        });
        setResults(data);
        setActiveIndex(-1);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Search error:', error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  // Show/hide overlay with animation
  useEffect(() => {
    if (focused) {
      setShowOverlay(true);
    } else {
      const timer = setTimeout(() => setShowOverlay(false), 200);
      return () => clearTimeout(timer);
    }
  }, [focused]);

  // Scroll to active item
  useEffect(() => {
    if (activeIndex >= 0 && resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  const handleResultClick = useCallback((productId: number) => {
    clickedItemRef.current = true;
    const currentQuery = searchQuery;
    router.push(`/product/${productId}`);
    setTimeout(() => {
      setSearchQuery(currentQuery);
    }, 100);
    closeSearch();
  }, [searchQuery, router, closeSearch]);

  // Memoized results list to avoid unnecessary re-renders
  const resultsList = useMemo(() => {
    if (isLoading) {
      return <div className="p-4 text-center text-gray-500">Загрузка...</div>;
    }

    if (results.length > 0) {
      return (
        <ul>
          {results.map((product, index) => (
            <li 
              key={product.id}
              data-index={index}
              className={`
                p-3 border-b border-gray-100 cursor-pointer
                hover:bg-gray-50 transition-all duration-150
                ${activeIndex === index ? 'bg-primary/5 border-primary/10' : ''}
                group
              `}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleResultClick(product.id)}
            >
              <div className="flex items-center">
                <div className={`w-1 h-6 rounded-full mr-3 transition-all duration-200 ${activeIndex === index ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-300'}`} />
                <img 
                  className='rounded-sm h-8 w-8 object-cover' 
                  src={product.imagesJson} 
                  alt={product.name} 
                  loading="lazy"
                />
                <span className={`ml-2 transition-all duration-200 ${activeIndex === index ? 'font-medium text-primary' : ''}`}>
                  {product.name}
                </span>
              </div>
            </li>
          ))}
          <li 
            data-index={results.length}
            className={`
              p-3 border-b border-gray-100 cursor-pointer 
              font-medium text-primary
              hover:bg-primary/5 transition-all duration-150
              ${activeIndex === results.length ? 'bg-primary/10' : ''}
            `}
            onMouseDown={() => clickedItemRef.current = true}
            onClick={handleSearch}
          >
            <div className="flex items-center">
              <div className={`w-1 h-6 rounded-full mr-3 ${activeIndex === results.length ? 'bg-primary' : 'bg-transparent'}`} />
              Искать "{searchQuery}"
            </div>
          </li>
        </ul>
      );
    }

    return (
      <div 
        className="p-4 text-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
        onMouseDown={() => clickedItemRef.current = true}
        onClick={handleSearch}
      >
        {debouncedQuery ? `Искать "${debouncedQuery}"` : 'Введите запрос'}
      </div>
    );
  }, [isLoading, results, activeIndex, searchQuery, debouncedQuery, handleResultClick, handleSearch]);

  return (
    <div className="relative w-full">
      {showOverlay && (
        <div 
          className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-200 ${focused ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          'flex rounded-2xl flex-1 justify-between relative h-11 z-40',
          className
        )}
      >
        <Search className="absolute top-1/2 -translate-y-1/2 left-3 h-5 text-gray-400" />
        <input
          ref={inputRef}
          className="rounded-2xl outline-none w-full bg-gray-100 pl-11 pr-20 border border-gray-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 shadow-sm transition-all duration-200"
          type="text"
          placeholder="Найти продукт..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!clickedItemRef.current) {
              setTimeout(closeSearch, 100);
            }
          }}
          onKeyDown={handleKeyDown}
          
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              flex items-center justify-center
              text-sm font-medium
              p-2 rounded-full
              bg-gray-200 text-gray-600
              shadow-sm
              transition-all duration-300
              hover:bg-gray-300 hover:text-gray-700
              active:scale-95 active:shadow-none
              cursor-pointer
              overflow-hidden
              after:absolute after:inset-0 after:bg-white/10 
              after:opacity-0 hover:after:opacity-100
              after:transition-opacity after:duration-300
            `}
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {focused && searchQuery && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-40 max-h-96 overflow-y-auto border border-gray-100"
        >
          {resultsList}
        </div>
      )}
    </div>
  );
};