import { NextRequest, NextResponse } from 'next/server'
import { getCartResponse, requireUserId } from './_utils'

export async function GET(req: NextRequest) {
  const { userId, response } = requireUserId(req)

  if (response || !userId) {
    return response
  }

  return NextResponse.json(await getCartResponse(userId))
}

