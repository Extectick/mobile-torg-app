import { prisma } from '@/prisma/prisma-client'
import { NextResponse } from 'next/server'

export async function GET() {
  const categories = await prisma.category.findMany({
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

  return NextResponse.json(categories)
}
