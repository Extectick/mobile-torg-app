import { CatalogView, Container } from '@/components/shared'
import { Suspense } from 'react'
import { prisma } from '@/prisma/prisma-client'

export const dynamic = 'force-dynamic'

interface CatalogProduct {
  id: number
  name: string
  description: string | null
  price: number
  unit: string
  imagesJson: string
  categoryId: number
  packages: {
    id: number
    name: string
    unit: string
    quantity: number
    minSaleQuantity: number
    quantityStep: number
    quantityPrecision: number
    price: number | null
    isDefault: boolean
  }[]
}

interface CatalogCategory {
  id: number
  name: string
  image: string | null
  parentId: number | null
  products: CatalogProduct[]
}

async function getCatalog(): Promise<CatalogCategory[]> {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      parentId: true,
      products: {
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
              { isDefault: 'desc' },
              { quantity: 'asc' },
            ],
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  })
}

export default async function Home() {
  const categories = await getCatalog()

  return (
    <Container className="mt-8 pb-14 px-4 scroll-smooth sm:px-6 lg:mt-[var(--page-catalog-top)] lg:px-0">
      <Suspense fallback={null}>
        <CatalogView categories={categories} />
      </Suspense>
    </Container>
  )
}
