import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaMssql } from '@prisma/adapter-mssql'
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client/client'

type DriverAdapter = PrismaMariaDb | PrismaMssql

function createAdapter(): DriverAdapter {
  const dbType = process.env.DB_TYPE ?? 'mysql'

  if (dbType === 'mssql') {
    return new PrismaMssql({
      server: process.env.MSSQL_HOST ?? 'localhost',
      port: Number(process.env.MSSQL_PORT ?? 1433),
      user: process.env.MSSQL_USER ?? 'sa',
      password: process.env.MSSQL_PASSWORD ?? '',
      database: process.env.MSSQL_DATABASE ?? 'IRVFDNoLoadTestSetup',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    })
  }

  return new PrismaMariaDb({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'IRVFDNoLoadTestSetup',
    connectionLimit: 10,
    acquireTimeout: 30_000,
    allowPublicKeyRetrieval: true,
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
