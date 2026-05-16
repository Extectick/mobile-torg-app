import { CatalogView, Container } from '@/components/shared'
import { Suspense } from 'react'
import { prisma } from '@/prisma/prisma-client'

interface CatalogProduct {
  id: number
  name: string
  description: string | null
  price: number
  imagesJson: string
  categoryId: number
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
          imagesJson: true,
          categoryId: true,
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
    <Container className="mt-8 pb-14 px-4 scroll-smooth sm:px-6 lg:px-0">
      <Suspense fallback={null}>
        <CatalogView categories={categories} />
      </Suspense>
    </Container>
  )
}
