import { categories, products, carts, cartItems } from './constants'
import { prisma } from './prisma-client'
import { hashSync } from 'bcrypt'

type SeedProduct = (typeof products)[number]

function getProductUnit(product: SeedProduct) {
    if (
        product.name.includes('Говядина') ||
        product.name.includes('Филе лосося') ||
        product.name.includes('Креветки') ||
        product.name.includes('Мидии') ||
        product.name.includes('Кальмар') ||
        product.name.includes('Томаты') ||
        product.name.includes('Огурцы') ||
        product.name.includes('Картофель') ||
        product.name.includes('Морковь') ||
        product.name.includes('Сыр') ||
        product.name.includes('Моцарелла') ||
        product.name.includes('Пармезан')
    ) {
        return 'кг'
    }

    return 'шт'
}

function getPackageName(unit: string) {
    return unit === 'кг' ? 'ящик' : 'коробка'
}

function getPackageQuantity(unit: string) {
    return unit === 'кг' ? 5 : 12
}

function getBasePackageRules(unit: string) {
    if (unit === 'кг') {
        return {
            minSaleQuantity: 2,
            quantityStep: 0.1,
            quantityPrecision: 1,
        }
    }

    return {
        minSaleQuantity: 1,
        quantityStep: 1,
        quantityPrecision: 0,
    }
}

async function up() {
    await prisma.user.createMany({
        data: [
            {
                email: 'user@test.ru',
                password: hashSync('111111', 10),
                role: 'USER',              

            },
            {
                email: 'admin@test.ru',
                password: hashSync('111111', 10),
                role: 'ADMIN',
            },
        ]
    })

    await prisma.individualProfile.createMany({
        data: [
            {
                userId: 1,
                fullName : "User test"
            },
            {
                userId: 2,
                fullName : "Admin test"
            },

        ]
    })

    await prisma.category.createMany({
        data: categories
    })

    await prisma.product.createMany({
        data: products.map((product) => ({
            ...product,
            unit: getProductUnit(product),
        }))
    })

    const createdProducts = await prisma.product.findMany({
        select: {
            id: true,
            price: true,
            unit: true,
        },
    })

    await prisma.productPackage.createMany({
        data: createdProducts.flatMap((product) => {
            const packageQuantity = getPackageQuantity(product.unit)
            const baseRules = getBasePackageRules(product.unit)

            return [
                {
                    productId: product.id,
                    name: product.unit,
                    unit: product.unit,
                    quantity: 1,
                    ...baseRules,
                    price: product.price,
                    isDefault: true,
                },
                {
                    productId: product.id,
                    name: getPackageName(product.unit),
                    unit: product.unit,
                    quantity: packageQuantity,
                    minSaleQuantity: 1,
                    quantityStep: 1,
                    quantityPrecision: 0,
                    price: product.price * packageQuantity,
                },
            ]
        })
    })

    await prisma.cart.createMany({
        data: carts
    })

    const defaultPackages = await prisma.productPackage.findMany({
        where: {
            isDefault: true,
        },
        select: {
            id: true,
            productId: true,
        },
    })
    const defaultPackageByProductId = new Map(defaultPackages.map((item) => [item.productId, item.id]))

    await prisma.cartItem.createMany({
        data: cartItems.map((item) => ({
            ...item,
            packageId: defaultPackageByProductId.get(item.productId) ?? item.productId,
        }))
    })
}

async function down() {
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "IndividualProfile" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "Product" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "ProductPackage" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "Cart" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "CartItem" RESTART IDENTITY CASCADE`

    
}

async function main() {
    try {
        await down()
        await up()
    } catch (e) {
        console.error(e)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
