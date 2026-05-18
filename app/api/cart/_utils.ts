import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/prisma/prisma-client'

export interface IncomingCartItem {
  productId: number
  packageId: number
  quantity: number
}

export const readUserId = (req: NextRequest) => {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? req.headers.get('x-user-id'))

  return Number.isInteger(userId) && userId > 0 ? userId : null
}

export const requireUserId = (req: NextRequest): { userId: number; response?: never } | { userId: null; response: NextResponse } => {
  const userId = readUserId(req)

  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json({ error: 'userId is required until auth session is implemented' }, { status: 401 }),
    }
  }

  return { userId }
}

export const getOrCreateCart = async (userId: number) => {
  const existingCart = await prisma.cart.findUnique({
    where: { userId },
  })

  if (existingCart) {
    return existingCart
  }

  return prisma.cart.create({
    data: {
      userId,
      token: `user-${userId}`,
    },
  })
}

export const getCartResponse = async (userId: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
          productPackage: true,
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
  })

  if (!cart) {
    return {
      id: null,
      userId,
      items: [],
      totalAmount: 0,
      totalCount: 0,
    }
  }

  const items = cart.items.map((item) => {
    const price = item.productPackage.price ?? item.product.price * item.productPackage.quantity

    return {
      id: item.id,
      productId: item.productId,
      packageId: item.packageId,
      quantity: item.quantity,
      name: item.product.name,
      imageUrl: item.product.imagesJson,
      unit: item.productPackage.unit,
      packageName: item.productPackage.name,
      packageQuantity: item.productPackage.quantity,
      price,
    }
  })

  return {
    id: cart.id,
    userId,
    items,
    totalAmount: Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)),
    totalCount: Number(items.reduce((sum, item) => sum + item.quantity, 0).toFixed(3)),
  }
}

export const normalizeIncomingItem = (value: Partial<IncomingCartItem>) => {
  const productId = Number(value.productId)
  const packageId = Number(value.packageId)
  const quantity = Number(value.quantity)

  if (!Number.isInteger(productId) || !Number.isInteger(packageId) || !Number.isFinite(quantity)) {
    return null
  }

  return {
    productId,
    packageId,
    quantity: Math.max(0, quantity),
  }
}

export const upsertCartItem = async (cartId: number, item: IncomingCartItem) => {
  if (item.quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId,
        productId: item.productId,
        packageId: item.packageId,
      },
    })
    return
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId_packageId: {
        cartId,
        productId: item.productId,
        packageId: item.packageId,
      },
    },
    create: {
      cartId,
      productId: item.productId,
      packageId: item.packageId,
      quantity: item.quantity,
    },
    update: {
      quantity: {
        increment: item.quantity,
      },
    },
  })
}

export const setCartItemQuantity = async (cartId: number, item: IncomingCartItem) => {
  if (item.quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId,
        productId: item.productId,
        packageId: item.packageId,
      },
    })
    return
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId_packageId: {
        cartId,
        productId: item.productId,
        packageId: item.packageId,
      },
    },
    create: {
      cartId,
      productId: item.productId,
      packageId: item.packageId,
      quantity: item.quantity,
    },
    update: {
      quantity: item.quantity,
    },
  })
}
