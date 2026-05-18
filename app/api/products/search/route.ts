import { prisma } from "@/prisma/prisma-client"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        const query = (req.nextUrl.searchParams.get('query') || '').trim()
        const limitParam = Number(req.nextUrl.searchParams.get('limit') || 5)
        const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 5

        if (!query) {
            return NextResponse.json([])
        }

        const products = await prisma.product.findMany({
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
            },
            orderBy: {
                name: "asc",
            },
            take: limit,
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error("Failed to search products:", error)
        return NextResponse.json({ error: "Failed to search products" }, { status: 500 })
    }
}
