'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useInView } from 'react-intersection-observer'
import { Filters } from './filters'
import { CatalogProduct } from './products-grid'
import { CategoryFoldersView, CatalogCategoryNode } from './category-folders-view'
import { ProductDetailsDialog } from './product-details-dialog'
import { DesktopCartPanel } from './desktop-cart-panel'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '../ui/drawer'
import { FolderOpen } from 'lucide-react'
import { useOverlayHistory } from '@/hooks/use-overlay-history'

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

class ProductLoadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ProductLoadError'
  }
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

function readIdParam(value: string | null) {
  if (!value) {
    return null
  }

  const numberValue = Number(value)

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null
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
  const [isCatalogBootstrapping, setIsCatalogBootstrapping] = React.useState(true)
  const [isProductsLoading, setIsProductsLoading] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [loadingProductId, setLoadingProductId] = React.useState<number | null>(null)
  const [activeProduct, setActiveProduct] = React.useState<CatalogProduct | null>(null)
  const hasLoadedCatalogRef = React.useRef(false)
  const roots = React.useMemo(() => buildCategoryTree(categories), [categories])
  const allCategories = React.useMemo(() => flattenCategories(roots), [roots])
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const searchQuery = (searchParams.get('query') || '').trim()
  const categoryParam = searchParams.get('category')
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(() => {
    return readIdParam(categoryParam)
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
    if (isCatalogBootstrapping) {
      return
    }

    const activeExists = activeCategoryId === null || allCategories.some((category) => category.id === activeCategoryId)

    if (!activeExists) {
      setActiveCategoryId(null)
    }
  }, [activeCategoryId, allCategories, isCatalogBootstrapping])

  React.useEffect(() => {
    if (isCatalogBootstrapping) {
      return
    }

    if (searchQuery) {
      return
    }

    if (!categoryParam) {
      setActiveCategoryId(null)
      return
    }

    const categoryId = readIdParam(categoryParam)
    const categoryExists = categoryId !== null && allCategories.some((category) => category.id === categoryId)

    setActiveCategoryId(categoryExists ? categoryId : null)
  }, [allCategories, categoryParam, isCatalogBootstrapping, searchQuery])

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
      const isFirstLoad = !hasLoadedCatalogRef.current

      try {
        setIsCatalogBootstrapping(isFirstLoad)
        setIsProductsLoading(!isFirstLoad)
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
        hasLoadedCatalogRef.current = true
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error)
          if (!hasLoadedCatalogRef.current) {
            setCategories([])
            setAllProductsCount(0)
          }
          setProducts([])
          setNextOffset(0)
          setHasMore(false)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCatalogBootstrapping(false)
          setIsProductsLoading(false)
        }
      }
    }

    loadInitialCatalog()

    return () => controller.abort()
  }, [catalogRequestKey])

  React.useEffect(() => {
    if (!inView || !hasMore || isCatalogBootstrapping || isProductsLoading || isLoadingMore) {
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
  }, [hasMore, inView, isCatalogBootstrapping, isLoadingMore, isProductsLoading, loadCatalogPage, nextOffset])

  const loadProduct = React.useCallback(async (productId: number) => {
    setLoadingProductId(productId)

    try {
      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: string } | null
        throw new ProductLoadError(errorBody?.error || 'Failed to load product', response.status)
      }

      const product = await response.json() as CatalogProduct
      setActiveProduct(product)
      return product
    } finally {
      setLoadingProductId(null)
    }
  }, [])

  const handleCloseProduct = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('product')

    const query = params.toString()
    router.replace(query ? `/?${query}` : '/', { scroll: false })
  }, [router, searchParams])

  React.useEffect(() => {
    const productId = readIdParam(productParam)

    if (productId === null) {
      setActiveProduct(null)
      return
    }

    if (activeProduct?.id === productId) {
      return
    }

    loadProduct(productId).catch((error: unknown) => {
      if (error instanceof ProductLoadError && error.status === 404) {
        handleCloseProduct()
        return
      }

      console.error(error)
      setActiveProduct(null)
    })
  }, [activeProduct?.id, handleCloseProduct, loadProduct, productParam])

  const handleSelectAll = React.useCallback(() => {
    setActiveCategoryId(null)
    router.push('/')
  }, [router])

  const handleSelectCategory = React.useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId)
    router.push(`/?category=${categoryId}`)
  }, [router])

  const handleMobileSelectAll = React.useCallback(() => {
    setActiveCategoryId(null)
    setMobileFiltersOpen(false)
    window.setTimeout(() => {
      router.replace('/')
    }, 0)
  }, [router])

  const handleMobileSelectCategory = React.useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId)
    setMobileFiltersOpen(false)
    window.setTimeout(() => {
      router.replace(`/?category=${categoryId}`)
    }, 0)
  }, [router])

  useOverlayHistory({
    open: mobileFiltersOpen,
    stateKey: 'mobile-filters',
    onClose: () => setMobileFiltersOpen(false),
  })

  React.useEffect(() => {
    const handleOpenMobileFilters = () => {
      setMobileFiltersOpen(true)
    }

    window.addEventListener('mobile-catalog-filters-open', handleOpenMobileFilters)

    return () => window.removeEventListener('mobile-catalog-filters-open', handleOpenMobileFilters)
  }, [])

  const handleOpenProduct = React.useCallback((productId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('product', String(productId))

    router.push(`/?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <>
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)_var(--desktop-cart-width)] lg:items-start lg:gap-(--catalog-gap)">
        <aside className="hidden lg:block lg:self-start lg:pr-1 [@media_(min-width:1024px)_and_(min-height:850px)]:sticky [@media_(min-width:1024px)_and_(min-height:850px)]:top-[calc(var(--app-header-height,80px)+16px)]">
          <Filters
            catalogRoots={roots}
            activeCategoryId={effectiveActiveCategoryId}
            activePathIds={activePathIds}
            allProductsCount={allProductsCount}
            isLoading={isCatalogBootstrapping}
            onSelectAll={handleSelectAll}
            onSelectCategory={handleSelectCategory}
          />
        </aside>

        <section className="min-w-0 pb-28 lg:pb-0">
          <Drawer open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <DrawerContent className="max-h-[85dvh] overflow-hidden rounded-t-xl bg-white">
              <DrawerHeader className="border-b border-black/5 px-4 pb-3 pt-4">
                <DrawerTitle className="flex items-center gap-2 text-[22px] font-extrabold">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <FolderOpen className="size-5" />
                  </span>
                  Каталог
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  Выберите категорию или настройте фильтры каталога
                </DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto">
                <Filters
                  surface="plain"
                  catalogRoots={roots}
                  activeCategoryId={effectiveActiveCategoryId}
                  activePathIds={activePathIds}
                  allProductsCount={allProductsCount}
                  isLoading={isCatalogBootstrapping}
                  onSelectAll={handleMobileSelectAll}
                  onSelectCategory={handleMobileSelectCategory}
                  showTitle={false}
                />
              </div>
            </DrawerContent>
          </Drawer>

          <CategoryFoldersView
            activeCategory={activeCategory}
            breadcrumbs={activePath}
            products={products}
            isInitialLoading={isCatalogBootstrapping}
            isProductsLoading={isProductsLoading}
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

        <DesktopCartPanel />
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
