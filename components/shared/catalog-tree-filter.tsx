'use client'

import React from 'react'
import { ChevronRight, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CatalogCategoryNode } from './category-folders-view'
import { CatalogProduct } from './products-grid'

interface Props {
  roots: CatalogCategoryNode[]
  activeCategoryId: number | null
  activePathIds: Set<number>
  allProductsCount: number
  getBranchProducts: (category: CatalogCategoryNode) => CatalogProduct[]
  onSelectAll: () => void
  onSelectCategory: (categoryId: number) => void
  className?: string
}

interface CategoryTreeItemProps {
  category: CatalogCategoryNode
  activeCategoryId: number | null
  activePathIds: Set<number>
  depth?: number
  getBranchProducts: (category: CatalogCategoryNode) => CatalogProduct[]
  onSelectCategory: (categoryId: number) => void
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  activeCategoryId,
  activePathIds,
  depth = 0,
  getBranchProducts,
  onSelectCategory,
}) => {
  const active = category.id === activeCategoryId
  const expanded = activePathIds.has(category.id)
  const productCount = getBranchProducts(category).length

  return (
    <div className={cn(depth > 0 && 'relative before:absolute before:left-5 before:top-0 before:h-full before:w-px before:bg-primary/10')}>
      <button
        type="button"
        onClick={() => onSelectCategory(category.id)}
        className={cn(
          'group relative flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition',
          'hover:bg-black/[0.025]',
          active && 'bg-primary/5 text-primary ring-1 ring-primary/25',
        )}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
      >
        <span className={cn(
          'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5 transition duration-300',
          'group-hover:scale-110 group-hover:ring-primary/20',
          active && 'bg-primary/10 ring-primary/25',
        )}>
          <img
            src={category.image || '/window.svg'}
            alt=""
            className="h-auto w-full object-contain"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">{category.name}</span>
          <span className="block text-xs text-gray-400">{productCount} товаров</span>
        </span>

        {category.children.length > 0 && (
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-gray-400 transition group-hover:text-primary',
              expanded && 'rotate-90 text-primary',
            )}
          />
        )}
      </button>

      {expanded && category.children.length > 0 && (
        <div className="mt-1 flex flex-col gap-1">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              activeCategoryId={activeCategoryId}
              activePathIds={activePathIds}
              depth={depth + 1}
              getBranchProducts={getBranchProducts}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const CatalogTreeFilter: React.FC<Props> = ({
  roots,
  activeCategoryId,
  activePathIds,
  allProductsCount,
  getBranchProducts,
  onSelectAll,
  onSelectCategory,
  className,
}) => {
  return (
    <div className={cn('rounded-xl bg-transparent', className)}>
      <div className="flex flex-col gap-1 px-1">
        <button
          type="button"
          onClick={onSelectAll}
          className={cn(
            'group flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-black/[0.025]',
            activeCategoryId === null && 'bg-primary/5 text-primary ring-1 ring-primary/25',
          )}
        >
          <span className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/5 transition duration-300 group-hover:scale-110 group-hover:ring-primary/20',
            activeCategoryId === null && 'bg-primary/10 ring-primary/25',
          )}>
            <Grid3X3 className="size-5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold">Все товары</span>
            <span className="block text-xs text-gray-400">{allProductsCount} товаров</span>
          </span>
        </button>

        {roots.map((category) => (
          <CategoryTreeItem
            key={category.id}
            category={category}
            activeCategoryId={activeCategoryId}
            activePathIds={activePathIds}
            getBranchProducts={getBranchProducts}
            onSelectCategory={onSelectCategory}
          />
        ))}
      </div>
    </div>
  )
}
