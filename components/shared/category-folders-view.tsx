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
  isLoadingMore = false,
  hasMore = false,
  loadingProductId = null,
  loadMoreRef,
  onSelectAll,
  onSelectCategory,
  onOpenProduct,
}) => {
  const showEmptyState = !isInitialLoading && products.length === 0

  return (
    <section className="min-w-0">
      <div className="mb-4">
        <div className="-mx-1 flex overflow-x-auto px-1 text-sm text-gray-500 sm:flex-wrap sm:items-center sm:gap-2 sm:overflow-visible sm:px-0">
          <button
            type="button"
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-2.5 font-semibold transition hover:bg-black/5',
              !activeCategory && 'bg-primary/10 text-primary',
            )}
            onClick={onSelectAll}
          >
            <Grid3X3 className="size-4" />
            Все товары
          </button>

          {breadcrumbs.map((category) => (
            <React.Fragment key={category.id}>
              <ChevronRight className="mt-2 size-4 shrink-0 sm:mt-0" />
              <button
                type="button"
                className={cn(
                  'inline-flex h-8 max-w-[12rem] shrink-0 items-center rounded-md px-2.5 font-semibold transition hover:bg-black/5 sm:max-w-none',
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

      {isInitialLoading ? (
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
              {isLoadingMore && <ProductGridSkeleton count={4} />}
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
  <div className="grid grid-cols-2 gap-3 min-[430px]:gap-4 sm:gap-5 md:grid-cols-[repeat(auto-fill,minmax(min(100%,var(--card-min-width)),1fr))] lg:gap-[var(--card-gap)]">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <Skeleton className="[aspect-ratio:var(--product-card-image-ratio)] rounded-none" />
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
