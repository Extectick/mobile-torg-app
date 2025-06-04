'use client'

import { cn } from '@/lib/utils';
import { ArrowRight, Search } from 'lucide-react';
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useClickAway, useDebounce } from 'ahooks';
import { useRouter } from 'next/navigation';
import { Api } from '@/services/api-client';

interface Props {
  className?: string;
}

export const SearchInput: React.FC<Props> = ({ className }) => {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, { wait: 300 });

  const closeSearch = useCallback(() => {
    setFocused(false);
    setResults([]);
    setActiveIndex(-1);
  }, []);

  useClickAway(closeSearch, containerRef);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      closeSearch();
      inputRef.current?.blur();
    }
  }, [searchQuery, router, closeSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        router.push(`/product/${results[activeIndex].id}`);
        closeSearch();
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    }
  }, [closeSearch, handleSearch, activeIndex, results, router]);

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
        signal: controller.signal
      });
      setResults(data);
      setActiveIndex(-1);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Search error:', error);
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


  useEffect(() => {
    if (focused) {
      setShowOverlay(true);
    } else {
      const timer = setTimeout(() => setShowOverlay(false), 200);
      return () => clearTimeout(timer);
    }
  }, [focused]);

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
          onBlur={() => setTimeout(closeSearch, 100)}
          onKeyDown={handleKeyDown}
        />
        {searchQuery && (
          <button
            onClick={handleSearch}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              flex items-center justify-center
              text-sm font-medium text-white
              px-4 py-2 rounded-lg
              bg-primary
              shadow-[0_4px_12px_rgba(0,0,0,0.1)]
              transition-all duration-300
              hover:bg-primary/90 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)]
              active:scale-95 active:shadow-[0_2px_8px_rgba(0,0,0,0.1)]
              cursor-pointer
              overflow-hidden
              after:absolute after:inset-0 after:bg-white/10 
              after:opacity-0 hover:after:opacity-100
              after:transition-opacity after:duration-300
            `}
          >
            {/* <span className="mr-2">Найти</span> */}
            <ArrowRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-1" />
            {/* <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" /> */}
          </button>
        )}
      </div>

      {focused && searchQuery && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-40 max-h-96 overflow-y-auto border border-gray-100"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Загрузка...</div>
          ) : results.length > 0 ? (
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
                  onClick={() => {
                    router.push(`/product/${product.id}`);
                    closeSearch();
                  }}
                >
                  <div className="flex items-center">
                    <div className={`w-1 h-6 rounded-full mr-3 transition-all duration-200 ${activeIndex === index ? 'bg-primary' : 'bg-transparent group-hover:bg-gray-300'}`} />
                    {/* Убрать если долго будет грузиться */}
                    <img className='rounded-sm h-8 w-8' src={product.imagesJson} alt='-' />
                    
                    <span className={`transition-all duration-200 ${activeIndex === index ? 'font-medium text-primary' : ''}`}>
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
                onClick={handleSearch}
              >
                <div className="flex items-center">
                  <div className={`w-1 h-6 rounded-full mr-3 ${activeIndex === results.length ? 'bg-primary' : 'bg-transparent'}`} />
                  Искать "{searchQuery}"
                </div>
              </li>
            </ul>
          ) : (
            <div 
              className="p-4 text-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleSearch}
            >
              {debouncedQuery ? `Искать "${debouncedQuery}"` : 'Введите запрос'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};