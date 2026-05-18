import { NextRequest, NextResponse } from 'next/server'
import {
  IncomingCartItem,
  getCartResponse,
  getOrCreateCart,
  normalizeIncomingItem,
  setCartItemQuantity,
  upsertCartItem,
} from '../_utils'
import { prisma } from '@/prisma/prisma-client'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const userId = Number(body.userId)
  const strategy = body.strategy === 'replace' ? 'replace' : 'merge'
  const rawItems: unknown[] = Array.isArray(body.items) ? body.items : []
  const incomingItems: IncomingCartItem[] = rawItems
    .map((item) => normalizeIncomingItem(item as Partial<IncomingCartItem>))
    .filter((item): item is IncomingCartItem => item !== null)

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'userId is required until auth session is implemented' }, { status: 401 })
  }

  if (incomingItems.length === 0) {
    return NextResponse.json(await getCartResponse(userId))
  }

  const cart = await getOrCreateCart(userId)

  if (strategy === 'replace') {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
  }

  await Promise.all(incomingItems.map((item) => (
    strategy === 'merge'
      ? upsertCartItem(cart.id, item)
      : setCartItemQuantity(cart.id, item)
  )))

  return NextResponse.json(await getCartResponse(userId))
}
