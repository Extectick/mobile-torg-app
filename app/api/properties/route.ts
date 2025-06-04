import { prisma } from "@/prisma/prisma-client"
import { NextResponse } from "next/server"

export async function GET() {
    const properties = await prisma.productProperty.findMany()
    
    return NextResponse.json(properties)
}