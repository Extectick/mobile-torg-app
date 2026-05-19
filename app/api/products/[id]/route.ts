import { prisma } from '@/prisma/prisma-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const productId = Number(id)

    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
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
            { isDefault: 'desc' },
            { quantity: 'asc' },
          ],
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Failed to load product:', error)
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 })
  }
}
