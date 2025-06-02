 import { PrismaClient} from '@prisma/client'

 const prismaClientSingleton = () => {
    return new PrismaClient()
 }

 declare global {
    var prismaGlabal: undefined | ReturnType<typeof prismaClientSingleton>
 }

 export const prisma = globalThis.prismaGlabal ?? prismaClientSingleton()

 if (process.env.NODE_ENV != 'production') globalThis.prismaGlabal = prisma