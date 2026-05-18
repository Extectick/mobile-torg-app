import { NextRequest, NextResponse } from 'next/server'
import {
  getCartResponse,
  getOrCreateCart,
  normalizeIncomingItem,
  requireUserId,
  setCartItemQuantity,
  upsertCartItem,
} from '../_utils'

export async function POST(req: NextRequest) {
  const { userId, response } = requireUserId(req)

  if (response || !userId) {
    return response
  }

  const item = normalizeIncomingItem(await req.json())

  if (!item) {
    return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
  }

  const cart = await getOrCreateCart(userId)
  await upsertCartItem(cart.id, item)

  return NextResponse.json(await getCartResponse(userId))
}

export async function PATCH(req: NextRequest) {
  const { userId, response } = requireUserId(req)

  if (response || !userId) {
    return response
  }

  const item = normalizeIncomingItem(await req.json())

  if (!item) {
    return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
  }

  const cart = await getOrCreateCart(userId)
  await setCartItemQuantity(cart.id, item)

  return NextResponse.json(await getCartResponse(userId))
}

export async function DELETE(req: NextRequest) {
  const { userId, response } = requireUserId(req)

  if (response || !userId) {
    return response
  }

  const item = normalizeIncomingItem({ ...Object.fromEntries(req.nextUrl.searchParams), quantity: 0 })

  if (!item) {
    return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
  }

  const cart = await getOrCreateCart(userId)
  await setCartItemQuantity(cart.id, item)

  return NextResponse.json(await getCartResponse(userId))
}

