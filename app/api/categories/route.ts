import { NextResponse } from "next/server"

const fallbackCategories = [
    { id: 1, name: "Мясо", description: null, image: "/categories/meat.png", parentId: null, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 2, name: "Молочные продукты", description: null, image: "/categories/dairy.png", parentId: null, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 3, name: "Сыры", description: null, image: "/categories/cheese.png", parentId: null, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 4, name: "Бакалея", description: null, image: "/categories/grocery.png", parentId: null, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 5, name: "Морепродукты", description: null, image: "/categories/seafood.png", parentId: null, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 6, name: "Овощи", description: null, image: "/categories/vegetables.png", parentId: null, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 7, name: "Деликатесы", description: null, image: "/categories/meat-delicacies.png", parentId: 1, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 8, name: "Охлажденное мясо", description: null, image: "/categories/fresh-meat.png", parentId: 1, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 9, name: "Молоко и напитки", description: null, image: "/categories/milk-drinks.png", parentId: 2, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 10, name: "Завтраки", description: null, image: "/categories/dairy-breakfast.png", parentId: 2, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 11, name: "Крупы", description: null, image: "/categories/cereals.png", parentId: 4, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
    { id: 12, name: "Консервы и паста", description: null, image: "/categories/pantry.png", parentId: 4, GUID: null, createdAt: new Date(0), updatedAt: new Date(0) },
]

export async function GET() {
    try {
        const { prisma } = await import("@/prisma/prisma-client")
        const categories = await prisma.category.findMany({
            orderBy: {
                id: "asc",
            },
        })
        return NextResponse.json(categories)
    } catch (error) {
        console.error("Failed to fetch categories from database:", error)
        return NextResponse.json(fallbackCategories)
    }
}
