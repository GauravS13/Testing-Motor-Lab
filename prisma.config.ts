import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const dbType = env('DB_TYPE') ?? 'mysql'
const urlVar = dbType === 'mssql' ? 'MSSQL_URL' : 'DATABASE_URL'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env(urlVar),
  },
})
