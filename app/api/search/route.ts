import { prisma } from "@/prisma/prisma-client"
import { NextRequest, NextResponse } from "next/server"

type CategoryForCount = {
  id: number
  parentId: number | null
  products: { id: number }[]
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
    const query = (req.nextUrl.searchParams.get("query") || "").trim()
    const limitParam = Number(req.nextUrl.searchParams.get("limit") || 5)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 5

    if (!query) {
      return NextResponse.json({ products: [], categories: [] })
    }

    const [products, categories, allCategories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
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
              { isDefault: "desc" },
              { quantity: "asc" },
            ],
          },
          category: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: limit,
      }),
      prisma.category.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
          parentId: true,
        },
        orderBy: {
          name: "asc",
        },
        take: limit,
      }),
      prisma.category.findMany({
        select: {
          id: true,
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
      }),
    ])

    const categoryById = new Map(allCategories.map((category) => [category.id, category]))
    const countBranchProducts = buildProductCounter(allCategories)

    return NextResponse.json({
      products,
      categories: categories.map((category) => ({
        ...category,
        productCount: countBranchProducts(categoryById.get(category.id) ?? { ...category, products: [] }),
      })),
    })
  } catch (error) {
    console.error("Failed to search catalog:", error)
    return NextResponse.json({ error: "Failed to search catalog" }, { status: 500 })
  }
}
