'use client'

import React from 'react'
import { ChevronRight, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CatalogCategoryNode } from './category-folders-view'
import { Skeleton } from '../ui/skeleton'

interface Props {
  roots: CatalogCategoryNode[]
  activeCategoryId: number | null
  activePathIds: Set<number>
  allProductsCount: number
  onSelectAll: () => void
  onSelectCategory: (categoryId: number) => void
  className?: string
}

interface CategoryTreeItemProps {
  category: CatalogCategoryNode
  activeCategoryId: number | null
  activePathIds: Set<number>
  manuallyExpandedPathIds: Set<number>
  depth?: number
  onSelectCategory: (categoryId: number) => void
  onToggleCategory: (categoryId: number) => void
}

function findCategoryPath(categories: CatalogCategoryNode[], id: number): CatalogCategoryNode[] {
  for (const category of categories) {
    if (category.id === id) {
      return [category]
    }

    const childPath = findCategoryPath(category.children, id)

    if (childPath.length > 0) {
      return [category, ...childPath]
    }
  }

  return []
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  activeCategoryId,
  activePathIds,
  manuallyExpandedPathIds,
  depth = 0,
  onSelectCategory,
  onToggleCategory,
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const active = category.id === activeCategoryId
  const hasChildren = category.children.length > 0
  const expanded = activePathIds.has(category.id) || manuallyExpandedPathIds.has(category.id)

  return (
    <div className={cn(depth > 0 && 'relative before:absolute before:left-5 before:top-0 before:h-full before:w-px before:bg-primary/10')}>
      <div
        className={cn(
          'group relative flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition',
          'hover:bg-black/2.5',
          active && 'bg-primary/5 text-primary ring-1 ring-primary/25',
        )}
        style={{ paddingLeft: `${8 + depth * 18}px` }}
      >
        <button
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none"
        >
          <span className={cn(
            'relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5 transition duration-300',
            'group-hover:scale-110 group-hover:ring-primary/20',
            active && 'bg-primary/10 ring-primary/25',
          )}>
            {!imageLoaded && <Skeleton className="absolute inset-0 rounded-lg" />}
            <img
              src={category.image || '/window.svg'}
              alt=""
              className={cn('h-auto w-full object-contain', !imageLoaded && 'opacity-0')}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold">{category.name}</span>
            <span className="block text-xs text-gray-400">{category.productCount} товаров</span>
          </span>
        </button>

        {hasChildren && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleCategory(category.id)
            }}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-primary/10 hover:text-primary"
            aria-label={expanded ? `Свернуть ${category.name}` : `Раскрыть ${category.name}`}
            aria-expanded={expanded}
          >
            <ChevronRight
              className={cn(
                'size-4 transition',
                expanded && 'rotate-90 text-primary',
              )}
            />
          </button>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 flex flex-col gap-1">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              activeCategoryId={activeCategoryId}
              activePathIds={activePathIds}
              manuallyExpandedPathIds={manuallyExpandedPathIds}
              depth={depth + 1}
              onSelectCategory={onSelectCategory}
              onToggleCategory={onToggleCategory}
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
  onSelectAll,
  onSelectCategory,
  className,
}) => {
  const [manuallyExpandedCategoryId, setManuallyExpandedCategoryId] = React.useState<number | null>(null)
  const manuallyExpandedPathIds = React.useMemo(() => {
    if (manuallyExpandedCategoryId === null) {
      return new Set<number>()
    }

    return new Set(findCategoryPath(roots, manuallyExpandedCategoryId).map((category) => category.id))
  }, [manuallyExpandedCategoryId, roots])
  const handleToggleCategory = React.useCallback((categoryId: number) => {
    setManuallyExpandedCategoryId((currentId) => currentId === categoryId ? null : categoryId)
  }, [])

  return (
    <div className={cn('rounded-xl bg-transparent', className)}>
      <div className="flex flex-col gap-1 px-1">
        <button
          type="button"
          onClick={onSelectAll}
          className={cn(
            'group flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-black/2.5',
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
            manuallyExpandedPathIds={manuallyExpandedPathIds}
            onSelectCategory={onSelectCategory}
            onToggleCategory={handleToggleCategory}
          />
        ))}
      </div>
    </div>
  )
}
