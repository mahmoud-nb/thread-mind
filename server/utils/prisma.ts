import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

export function usePrisma(): PrismaClient {
  if (!prisma) {
    if (globalThis.__prisma) {
      prisma = globalThis.__prisma
    } else {
      prisma = new PrismaClient()
      globalThis.__prisma = prisma
    }
  }
  return prisma
}
