'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filters } from './filters'
import { CatalogProduct } from './products-grid'
import { CategoryFoldersView, CatalogCategoryNode } from './category-folders-view'
import { ProductDetailsDialog } from './product-details-dialog'
import { SearchInput } from './search-input'
import { Button } from '../ui'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { SlidersHorizontal } from 'lucide-react'

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

function readPriceParam(value: string | null) {
  if (!value) {
    return undefined
  }

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : undefined
}

export const CatalogView: React.FC<Props> = ({ categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roots = React.useMemo(() => buildCategoryTree(categories), [categories])
  const allCategories = React.useMemo(() => flattenCategories(roots), [roots])
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const searchQuery = (searchParams.get('query') || '').trim()
  const categoryParam = searchParams.get('category')
  const productParam = searchParams.get('product')
  const priceFrom = readPriceParam(searchParams.get('priceFrom'))
  const priceTo = readPriceParam(searchParams.get('priceTo'))

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
  const activeProduct = React.useMemo(() => {
    const productId = Number(productParam)

    if (!Number.isInteger(productId)) {
      return null
    }

    return allProducts.find((product) => product.id === productId) ?? null
  }, [allProducts, productParam])
  const effectiveActiveCategoryId = searchQuery ? null : activeCategoryId
  const activePath = React.useMemo(
    () => effectiveActiveCategoryId ? findCategoryPath(roots, effectiveActiveCategoryId) : [],
    [effectiveActiveCategoryId, roots],
  )
  const activeCategory = activePath[activePath.length - 1] ?? null
  const categoryProducts = activeCategory ? flattenProducts([activeCategory]) : allProducts
  const activeProducts = React.useMemo(() => {
    const filterByPrice = (products: CatalogProduct[]) => products.filter((product) => {
      const aboveMin = priceFrom === undefined || product.price >= priceFrom
      const belowMax = priceTo === undefined || product.price <= priceTo

      return aboveMin && belowMax
    })

    if (!searchQuery) {
      return filterByPrice(categoryProducts)
    }

    const normalizedQuery = searchQuery.toLowerCase()

    const searchedProducts = allProducts.filter((product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.description?.toLowerCase().includes(normalizedQuery)
    )

    return filterByPrice(searchedProducts)
  }, [allProducts, categoryProducts, priceFrom, priceTo, searchQuery])
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

  const handleMobileSelectAll = React.useCallback(() => {
    handleSelectAll()
    setMobileFiltersOpen(false)
  }, [handleSelectAll])

  const handleMobileSelectCategory = React.useCallback((categoryId: number) => {
    handleSelectCategory(categoryId)
    setMobileFiltersOpen(false)
  }, [handleSelectCategory])

  const handleOpenProduct = React.useCallback((productId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('product', String(productId))

    router.push(`/?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const handleCloseProduct = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('product')

    const query = params.toString()
    router.replace(query ? `/?${query}` : '/', { scroll: false })
  }, [router, searchParams])

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-[var(--catalog-gap)]">
        <aside className="hidden lg:block lg:w-[var(--sidebar-width)] lg:shrink-0 lg:self-start lg:pr-1 [@media_(min-width:1024px)_and_(min-height:850px)]:sticky [@media_(min-width:1024px)_and_(min-height:850px)]:top-[calc(var(--app-header-height,80px)+16px)]">
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

        <section className="min-w-0 flex-1 pb-44 lg:pb-0">
          <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.7rem)] z-40 flex gap-2 px-3 sm:px-6 lg:hidden">
            <React.Suspense fallback={<div className="h-11 flex-1 rounded-2xl bg-gray-100" />}>
              <SearchInput className="h-11" variant="floating" resultsPlacement="top" />
            </React.Suspense>

            <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 shrink-0 rounded-2xl border-white/70 bg-white/85 text-gray-700 opacity-95 shadow-lg shadow-black/10 backdrop-blur transition hover:bg-white focus-visible:ring-primary/30"
                  aria-label="Открыть фильтры"
                >
                  <SlidersHorizontal className="size-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85dvh] overflow-hidden rounded-t-xl bg-white">
                <DrawerHeader className="border-b border-black/5 px-4 pb-3 pt-4">
                  <DrawerTitle className="text-lg font-extrabold">Каталог и фильтры</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto">
                  <Filters
                    surface="plain"
                    catalogRoots={roots}
                    activeCategoryId={effectiveActiveCategoryId}
                    activePathIds={activePathIds}
                    allProductsCount={allProducts.length}
                    getBranchProducts={(category) => flattenProducts([category])}
                    onSelectAll={handleMobileSelectAll}
                    onSelectCategory={handleMobileSelectCategory}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <CategoryFoldersView
            activeCategory={activeCategory}
            breadcrumbs={activePath}
            products={activeProducts}
            searchQuery={searchQuery}
            onSelectAll={handleSelectAll}
            onSelectCategory={handleSelectCategory}
            onOpenProduct={handleOpenProduct}
          />
        </section>
      </div>
      <ProductDetailsDialog
        product={activeProduct}
        open={Boolean(activeProduct)}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseProduct()
          }
        }}
      />
    </>
  )
}
