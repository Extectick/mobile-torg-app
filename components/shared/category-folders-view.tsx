'use client'

import React from 'react'
import { ChevronRight, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductsGrid, CatalogProduct } from './products-grid'
import { Skeleton } from '../ui/skeleton'

export interface CatalogCategoryNode {
  id: number
  name: string
  image: string | null
  parentId: number | null
  productCount: number
  children: CatalogCategoryNode[]
}

interface Props {
  activeCategory: CatalogCategoryNode | null
  breadcrumbs: CatalogCategoryNode[]
  products: CatalogProduct[]
  isInitialLoading?: boolean
  isProductsLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  loadingProductId?: number | null
  loadMoreRef?: (node?: Element | null) => void
  searchQuery?: string
  onSelectAll: () => void
  onSelectCategory: (categoryId: number) => void
  onOpenProduct?: (productId: number) => void
}

export const CategoryFoldersView: React.FC<Props> = ({
  activeCategory,
  breadcrumbs,
  products,
  isInitialLoading = false,
  isProductsLoading = false,
  isLoadingMore = false,
  hasMore = false,
  loadingProductId = null,
  loadMoreRef,
  onSelectAll,
  onSelectCategory,
  onOpenProduct,
}) => {
  const showEmptyState = !isInitialLoading && products.length === 0
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const activeCrumbRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    const activeCrumb = activeCrumbRef.current
    const list = listRef.current

    if (!activeCrumb || !list) {
      return
    }

    const activeLeft = activeCrumb.offsetLeft
    const activeRight = activeLeft + activeCrumb.offsetWidth
    const visibleLeft = list.scrollLeft
    const visibleRight = visibleLeft + list.clientWidth

    if (activeRight > visibleRight || activeLeft < visibleLeft) {
      activeCrumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'end',
      })
    }
  }, [activeCategory?.id, breadcrumbs])

  return (
    <section className="min-w-0">
      <div className="mb-2 sm:mb-3">
        <div ref={listRef} className="-mx-0.5 flex overflow-x-auto px-0.5 text-sm text-gray-500 sm:flex-wrap sm:items-center sm:gap-1.5 sm:overflow-visible sm:px-0">
          <button
            type="button"
            className={cn(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-semibold transition hover:bg-black/5',
              !activeCategory && 'bg-primary/10 text-primary',
            )}
            onClick={onSelectAll}
          >
            <Grid3X3 className="size-3.5" />
            Все товары
          </button>

          {breadcrumbs.map((category) => (
            <React.Fragment key={category.id}>
              <ChevronRight className="mt-2 size-4 shrink-0 sm:mt-0" />
              <button
                ref={category.id === activeCategory?.id ? activeCrumbRef : undefined}
                type="button"
                className={cn(
                  'inline-flex h-7 max-w-48 shrink-0 items-center rounded-md px-2 text-sm font-semibold transition hover:bg-black/5 sm:max-w-none',
                  category.id === activeCategory?.id && 'bg-primary/10 text-primary',
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {isInitialLoading || isProductsLoading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <>
          <ProductsGrid
            items={products}
            onOpenProduct={onOpenProduct}
            loadingProductId={loadingProductId}
          />
          {(isLoadingMore || hasMore) && (
            <div ref={loadMoreRef} className="mt-5">
              {isLoadingMore && hasMore && <ProductGridSkeleton count={4} />}
            </div>
          )}
        </>
      ) : showEmptyState ? (
        <div className="rounded-lg border border-dashed border-black/10 bg-white/60 p-8 text-center text-gray-500">
          Ничего не найдено
        </div>
      ) : null}
    </section>
  )
}

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 gap-3 min-[430px]:gap-4 sm:gap-5 md:grid-cols-[repeat(auto-fill,minmax(min(100%,var(--card-min-width)),1fr))] lg:gap-(--card-gap)">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <Skeleton className="aspect-(--product-card-image-ratio) rounded-none" />
        <div className="space-y-3 px-3 pb-4 pt-3 sm:px-4">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-end justify-between gap-3 pt-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
)
