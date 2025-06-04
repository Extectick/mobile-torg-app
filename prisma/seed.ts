import { categories, products, carts, cartItems } from './constants'
import { prisma } from './prisma-client'
import { hashSync } from 'bcrypt'

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
        data: products
    })

    await prisma.cart.createMany({
        data: carts
    })

    await prisma.cartItem.createMany({
        data: cartItems
    })
}

async function down() {
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "IndividualProfile" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE`
    await prisma.$executeRaw`TRUNCATE TABLE "Product" RESTART IDENTITY CASCADE`
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