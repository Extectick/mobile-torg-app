'use client'

import React from 'react'
import { ChevronRight, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Title } from './title'
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
  searchQuery,
  onSelectAll,
  onSelectCategory,
  onOpenProduct,
}) => {
  return (
    <section className="min-w-0">
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <button
            type="button"
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-md px-2.5 font-semibold transition hover:bg-black/5',
              !activeCategory && 'bg-primary/10 text-primary',
            )}
            onClick={onSelectAll}
          >
            <Grid3X3 className="size-4" />
            Все товары
          </button>

          {breadcrumbs.map((category) => (
            <React.Fragment key={category.id}>
              <ChevronRight className="size-4" />
              <button
                type="button"
                className={cn(
                  'inline-flex h-8 items-center rounded-md px-2.5 font-semibold transition hover:bg-black/5',
                  category.id === activeCategory?.id && 'bg-primary/10 text-primary',
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                {category.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div>
          <div>
            <Title text={activeCategory?.name || 'Все товары'} size="lg" className="font-extrabold leading-tight" />
            <p className="mt-0.5 text-sm text-gray-500">
              {searchQuery ? `${products.length} товаров по запросу "${searchQuery}"` : `${products.length} товаров`}
            </p>
          </div>
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
