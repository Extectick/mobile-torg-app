'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filters } from './filters'
import { CatalogProduct } from './products-grid'
import { CategoryFoldersView, CatalogCategoryNode } from './category-folders-view'

interface CatalogCategory {
  id: number
  name: string
  image: string | null
  parentId: number | null
  products: CatalogProduct[]
}

interface Props {
  categories: CatalogCategory[]
}

function buildCategoryTree(categories: CatalogCategory[]): CatalogCategoryNode[] {
  const nodes = new Map<number, CatalogCategoryNode>()

  categories.forEach((category) => {
    nodes.set(category.id, {
      ...category,
      children: [],
    })
  })

  const roots: CatalogCategoryNode[] = []

  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)?.children.push(node)
      return
    }

    roots.push(node)
  })

  return roots
}

function flattenProducts(categories: CatalogCategoryNode[]): CatalogProduct[] {
  return categories.flatMap((category) => [
    ...category.products,
    ...flattenProducts(category.children),
  ])
}

function flattenCategories(categories: CatalogCategoryNode[]): CatalogCategoryNode[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)])
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

export const CatalogView: React.FC<Props> = ({ categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roots = React.useMemo(() => buildCategoryTree(categories), [categories])
  const allCategories = React.useMemo(() => flattenCategories(roots), [roots])
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(null)
  const searchQuery = (searchParams.get('query') || '').trim()
  const categoryParam = searchParams.get('category')

  React.useEffect(() => {
    const activeExists = activeCategoryId === null || allCategories.some((category) => category.id === activeCategoryId)

    if (!activeExists) {
      setActiveCategoryId(null)
    }
  }, [activeCategoryId, allCategories])

  React.useEffect(() => {
    if (searchQuery) {
      return
    }

    if (!categoryParam) {
      setActiveCategoryId(null)
      return
    }

    const categoryId = Number(categoryParam)
    const categoryExists = Number.isInteger(categoryId) && allCategories.some((category) => category.id === categoryId)

    setActiveCategoryId(categoryExists ? categoryId : null)
  }, [allCategories, categoryParam, searchQuery])

  const allProducts = React.useMemo(() => flattenProducts(roots), [roots])
  const effectiveActiveCategoryId = searchQuery ? null : activeCategoryId
  const activePath = React.useMemo(
    () => effectiveActiveCategoryId ? findCategoryPath(roots, effectiveActiveCategoryId) : [],
    [effectiveActiveCategoryId, roots],
  )
  const activeCategory = activePath[activePath.length - 1] ?? null
  const categoryProducts = activeCategory ? flattenProducts([activeCategory]) : allProducts
  const activeProducts = React.useMemo(() => {
    if (!searchQuery) {
      return categoryProducts
    }

    const normalizedQuery = searchQuery.toLowerCase()

    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description?.toLowerCase().includes(normalizedQuery)
    )
  }, [allProducts, categoryProducts, searchQuery])
  const activePathIds = React.useMemo(
    () => new Set(activePath.map((category) => category.id)),
    [activePath],
  )
  const handleSelectAll = React.useCallback(() => {
    setActiveCategoryId(null)
    router.push('/')
  }, [router])

  const handleSelectCategory = React.useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId)
    router.push(`/?category=${categoryId}`)
  }, [router])

  return (
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-[36px]">
        <aside className="w-full lg:w-[300px] lg:shrink-0">
          <Filters
            catalogRoots={roots}
            activeCategoryId={effectiveActiveCategoryId}
            activePathIds={activePathIds}
            allProductsCount={allProducts.length}
            getBranchProducts={(category) => flattenProducts([category])}
            onSelectAll={handleSelectAll}
            onSelectCategory={handleSelectCategory}
          />
        </aside>

        <section className="min-w-0 flex-1">
          <CategoryFoldersView
            activeCategory={activeCategory}
            breadcrumbs={activePath}
            products={activeProducts}
            searchQuery={searchQuery}
            onSelectAll={handleSelectAll}
            onSelectCategory={handleSelectCategory}
          />
        </section>
      </div>
  )
}
