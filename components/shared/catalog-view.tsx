'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInView } from 'react-intersection-observer'
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
  productCount: number
}

interface CatalogResponse {
  categories: CatalogCategory[]
  products: CatalogProduct[]
  total: number
  allProductsCount: number
  hasMore: boolean
  nextOffset: number
}

const PAGE_SIZE = 12

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

export const CatalogView: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: '700px 0px',
  })
  const [categories, setCategories] = React.useState<CatalogCategory[]>([])
  const [products, setProducts] = React.useState<CatalogProduct[]>([])
  const [allProductsCount, setAllProductsCount] = React.useState(0)
  const [nextOffset, setNextOffset] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [isInitialLoading, setIsInitialLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [loadingProductId, setLoadingProductId] = React.useState<number | null>(null)
  const [activeProduct, setActiveProduct] = React.useState<CatalogProduct | null>(null)
  const roots = React.useMemo(() => buildCategoryTree(categories), [categories])
  const allCategories = React.useMemo(() => flattenCategories(roots), [roots])
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const searchQuery = (searchParams.get('query') || '').trim()
  const categoryParam = searchParams.get('category')
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(() => {
    const categoryId = Number(categoryParam)

    return Number.isInteger(categoryId) ? categoryId : null
  })
  const productParam = searchParams.get('product')
  const priceFrom = readPriceParam(searchParams.get('priceFrom'))
  const priceTo = readPriceParam(searchParams.get('priceTo'))
  const catalogRequestKey = React.useMemo(() => {
    const params = new URLSearchParams()

    params.set('limit', String(PAGE_SIZE))
    params.set('offset', '0')

    if (searchQuery) {
      params.set('query', searchQuery)
    }

    if (!searchQuery && activeCategoryId !== null) {
      params.set('category', String(activeCategoryId))
    }

    if (priceFrom !== undefined) {
      params.set('priceFrom', String(priceFrom))
    }

    if (priceTo !== undefined) {
      params.set('priceTo', String(priceTo))
    }

    return params.toString()
  }, [activeCategoryId, priceFrom, priceTo, searchQuery])

  React.useEffect(() => {
    if (isInitialLoading) {
      return
    }

    const activeExists = activeCategoryId === null || allCategories.some((category) => category.id === activeCategoryId)

    if (!activeExists) {
      setActiveCategoryId(null)
    }
  }, [activeCategoryId, allCategories, isInitialLoading])

  React.useEffect(() => {
    if (isInitialLoading) {
      return
    }

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
  }, [allCategories, categoryParam, isInitialLoading, searchQuery])

  const effectiveActiveCategoryId = searchQuery ? null : activeCategoryId
  const activePath = React.useMemo(
    () => effectiveActiveCategoryId ? findCategoryPath(roots, effectiveActiveCategoryId) : [],
    [effectiveActiveCategoryId, roots],
  )
  const activeCategory = activePath[activePath.length - 1] ?? null
  const activePathIds = React.useMemo(
    () => new Set(activePath.map((category) => category.id)),
    [activePath],
  )

  const loadCatalogPage = React.useCallback(async (offset: number, { append }: { append: boolean }) => {
    const params = new URLSearchParams(catalogRequestKey)
    params.set('offset', String(offset))

    const response = await fetch(`/api/catalog?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to load catalog')
    }

    const data = await response.json() as CatalogResponse

    setCategories(data.categories)
    setAllProductsCount(data.allProductsCount)
    setNextOffset(data.nextOffset)
    setHasMore(data.hasMore)
    setProducts((currentProducts) => append ? [...currentProducts, ...data.products] : data.products)
  }, [catalogRequestKey])

  React.useEffect(() => {
    const controller = new AbortController()

    const loadInitialCatalog = async () => {
      try {
        setIsInitialLoading(true)
        setIsLoadingMore(false)

        const response = await fetch(`/api/catalog?${catalogRequestKey}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load catalog')
        }

        const data = await response.json() as CatalogResponse

        setCategories(data.categories)
        setProducts(data.products)
        setAllProductsCount(data.allProductsCount)
        setNextOffset(data.nextOffset)
        setHasMore(data.hasMore)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error)
          setCategories([])
          setProducts([])
          setAllProductsCount(0)
          setNextOffset(0)
          setHasMore(false)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false)
        }
      }
    }

    loadInitialCatalog()

    return () => controller.abort()
  }, [catalogRequestKey])

  React.useEffect(() => {
    if (!inView || !hasMore || isInitialLoading || isLoadingMore) {
      return
    }

    let cancelled = false

    const loadMore = async () => {
      try {
        setIsLoadingMore(true)
        await loadCatalogPage(nextOffset, { append: true })
      } catch (error) {
        if (!cancelled) {
          console.error(error)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMore(false)
        }
      }
    }

    loadMore()

    return () => {
      cancelled = true
    }
  }, [hasMore, inView, isInitialLoading, isLoadingMore, loadCatalogPage, nextOffset])

  const loadProduct = React.useCallback(async (productId: number) => {
    setLoadingProductId(productId)

    try {
      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        throw new Error('Failed to load product')
      }

      const product = await response.json() as CatalogProduct
      setActiveProduct(product)
      return product
    } finally {
      setLoadingProductId(null)
    }
  }, [])

  React.useEffect(() => {
    const productId = Number(productParam)

    if (!Number.isInteger(productId)) {
      setActiveProduct(null)
      return
    }

    if (activeProduct?.id === productId) {
      return
    }

    loadProduct(productId).catch((error) => {
      console.error(error)
      setActiveProduct(null)
    })
  }, [activeProduct?.id, loadProduct, productParam])

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

    loadProduct(productId)
      .then(() => {
        router.push(`/?${params.toString()}`, { scroll: false })
      })
      .catch((error) => {
        console.error(error)
      })
  }, [loadProduct, router, searchParams])

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
            allProductsCount={allProductsCount}
            isLoading={isInitialLoading}
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
                    allProductsCount={allProductsCount}
                    isLoading={isInitialLoading}
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
            products={products}
            isInitialLoading={isInitialLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            loadingProductId={loadingProductId}
            loadMoreRef={loadMoreRef}
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
