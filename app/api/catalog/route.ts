import { prisma } from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'

type CategoryForCount = {
  id: number
  parentId: number | null
  products: { id: number }[]
}

const PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  price: true,
  unit: true,
  imagesJson: true,
  categoryId: true,
  packages: {
    select: {
      id: true,
      name: true,
      unit: true,
      quantity: true,
      minSaleQuantity: true,
      quantityStep: true,
      quantityPrecision: true,
      price: true,
      isDefault: true,
    },
    orderBy: [
      { isDefault: 'desc' as const },
      { quantity: 'asc' as const },
    ],
  },
}

function readNumberParam(value: string | null, fallback: number) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

function buildChildrenMap(categories: { id: number; parentId: number | null }[]) {
  const childrenByParent = new Map<number, number[]>()

  categories.forEach((category) => {
    if (category.parentId === null) {
      return
    }

    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category.id)
    childrenByParent.set(category.parentId, children)
  })

  return childrenByParent
}

function getDescendantCategoryIds(categoryId: number, childrenByParent: Map<number, number[]>) {
  const ids = [categoryId]
  const stack = [...(childrenByParent.get(categoryId) ?? [])]

  while (stack.length > 0) {
    const id = stack.pop()

    if (id === undefined) {
      continue
    }

    ids.push(id)
    stack.push(...(childrenByParent.get(id) ?? []))
  }

  return ids
}

function buildProductCounter(categories: CategoryForCount[]) {
  const childrenByParent = new Map<number, CategoryForCount[]>()

  categories.forEach((category) => {
    if (category.parentId === null) {
      return
    }

    const siblings = childrenByParent.get(category.parentId) ?? []
    siblings.push(category)
    childrenByParent.set(category.parentId, siblings)
  })

  const countCache = new Map<number, number>()

  const countBranchProducts = (category: CategoryForCount): number => {
    const cached = countCache.get(category.id)

    if (cached !== undefined) {
      return cached
    }

    const childProducts = (childrenByParent.get(category.id) ?? []).reduce(
      (sum, child) => sum + countBranchProducts(child),
      0,
    )
    const count = category.products.length + childProducts

    countCache.set(category.id, count)

    return count
  }

  return countBranchProducts
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(Math.max(readNumberParam(searchParams.get('limit'), 12), 1), 48)
    const offset = Math.max(readNumberParam(searchParams.get('offset'), 0), 0)
    const query = (searchParams.get('query') || '').trim()
    const categoryId = readNumberParam(searchParams.get('category'), 0)
    const priceFrom = searchParams.get('priceFrom')
    const priceTo = searchParams.get('priceTo')
    const minPrice = priceFrom === null ? undefined : readNumberParam(priceFrom, Number.NaN)
    const maxPrice = priceTo === null ? undefined : readNumberParam(priceTo, Number.NaN)

    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        parentId: true,
        products: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    })

    const childrenByParent = buildChildrenMap(allCategories)
    const countBranchProducts = buildProductCounter(allCategories)
    const categoryById = new Map(allCategories.map((category) => [category.id, category]))
    const categoryIds = categoryId > 0 && categoryById.has(categoryId)
      ? getDescendantCategoryIds(categoryId, childrenByParent)
      : undefined

    const where = {
      isActive: true,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query
        ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
          ],
        }
        : {}),
      ...(Number.isFinite(minPrice) ? { price: { gte: minPrice } } : {}),
      ...(Number.isFinite(maxPrice) ? { price: { lte: maxPrice } } : {}),
      ...(Number.isFinite(minPrice) && Number.isFinite(maxPrice) ? { price: { gte: minPrice, lte: maxPrice } } : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: {
          id: 'asc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const nextOffset = offset + products.length

    return NextResponse.json({
      categories: allCategories.map((category) => ({
        id: category.id,
        name: category.name,
        image: category.image,
        parentId: category.parentId,
        productCount: countBranchProducts(category),
      })),
      products,
      total,
      allProductsCount: allCategories.reduce((sum, category) => (
        category.parentId === null ? sum + countBranchProducts(category) : sum
      ), 0),
      hasMore: nextOffset < total,
      nextOffset,
    })
  } catch (error) {
    console.error('Failed to load catalog:', error)
    return NextResponse.json({ error: 'Failed to load catalog' }, { status: 500 })
  }
}
