'use client'

import React from 'react'
import { ChevronRight, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductsGrid, CatalogProduct } from './products-grid'

export interface CatalogCategoryNode {
  id: number
  name: string
  image: string | null
  parentId: number | null
  products: CatalogProduct[]
  children: CatalogCategoryNode[]
}

interface Props {
  activeCategory: CatalogCategoryNode | null
  breadcrumbs: CatalogCategoryNode[]
  products: CatalogProduct[]
  searchQuery?: string
  onSelectAll: () => void
  onSelectCategory: (categoryId: number) => void
  onOpenProduct?: (productId: number) => void
}

export const CategoryFoldersView: React.FC<Props> = ({
  activeCategory,
  breadcrumbs,
  products,
  onSelectAll,
  onSelectCategory,
  onOpenProduct,
}) => {
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

      {products.length > 0 ? (
        <ProductsGrid items={products} onOpenProduct={onOpenProduct} />
      ) : (
        <div className="rounded-lg border border-dashed border-black/10 bg-white/60 p-8 text-center text-gray-500">
          Ничего не найдено
        </div>
      )}
    </section>
  )
}
