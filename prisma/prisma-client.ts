 import { PrismaClient } from '@prisma/client'

 const prismaClientSingleton = () => {
    const prisma = new PrismaClient({
        log: process.env.LOG_PRISMA_QUERIES === 'true'
            ? [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
            : [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }],
    })

    if (process.env.LOG_PRISMA_QUERIES === 'true') {
        prisma.$on('query', (event) => {
            console.log(`[prisma] ${event.duration}ms ${event.query} params=${event.params}`)
        })
    }

    return prisma
 }

 declare global {
    var prismaGlabal: undefined | ReturnType<typeof prismaClientSingleton>
 }

 export const prisma = globalThis.prismaGlabal ?? prismaClientSingleton()

 if (process.env.NODE_ENV != 'production') globalThis.prismaGlabal = prisma
