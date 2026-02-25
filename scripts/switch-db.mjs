#!/usr/bin/env node

/**
 * Database Switch Script
 *
 * Reads DB_TYPE from .env and updates prisma/schema.prisma to:
 *   1. Use the correct provider ("mysql" | "sqlserver")
 *   2. Swap @@map() table names (lowercase for MySQL, PascalCase for MSSQL)
 *
 * Usage: pnpm db:switch
 */

import 'dotenv/config'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = resolve(__dirname, '..', 'prisma', 'schema.prisma')

const DB_TYPE = process.env.DB_TYPE ?? 'mysql'

if (!['mysql', 'mssql'].includes(DB_TYPE)) {
  console.error(`❌ Invalid DB_TYPE="${DB_TYPE}". Must be "mysql" or "mssql".`)
  process.exit(1)
}

const providerMap = {
  mysql: 'mysql',
  mssql: 'sqlserver',
}

// Table name mapping: MySQL (lowercase) ↔ MSSQL (PascalCase)
// Note: Column-level @map() handles field names already;
// this only swaps the @@map() table-level mapping.
const tableNameMap = {
  mysql: {
    User: 'users',
    CommunicationStatus: 'communicationstatus',
    RealTimeData: 'realtimedata',
    LiveTestingData: 'livetestingdata',
    MasterData: 'masterdata',
    TestedData: 'testeddata',
  },
  mssql: {
    User: 'Users',
    CommunicationStatus: 'CommunicationStatus',
    RealTimeData: 'RealTimeData',
    LiveTestingData: 'LiveTestingData',
    MasterData: 'MasterData',
    TestedData: 'TestedData',
  },
}

const provider = providerMap[DB_TYPE]
const tableNames = tableNameMap[DB_TYPE]

// Validate required environment variable for Prisma configuration
const requiredUrlVar = DB_TYPE === 'mssql' ? 'MSSQL_URL' : 'DATABASE_URL'
if (!process.env[requiredUrlVar]) {
  console.error(
    `❌ Missing required environment variable: ${requiredUrlVar}`
  )
  console.error(
    `   Please ensure it is defined in your .env file for DB_TYPE="${DB_TYPE}".`
  )
  process.exit(1)
}

console.log(`🔄 Switching database provider to: ${provider} (DB_TYPE=${DB_TYPE})`)

// Read and update schema
let schema = readFileSync(SCHEMA_PATH, 'utf-8')

// 1. Swap provider
schema = schema.replace(
  /provider\s*=\s*"(mysql|sqlserver)"/,
  `provider = "${provider}"`,
)

// 2. Swap @@map() table names
for (const [modelName, tableName] of Object.entries(tableNames)) {
  // Match @@map("anyCurrentName") after the model definition
  // We use a lookahead to make sure we're replacing the right @@map
  // by matching the model block
  const regex = new RegExp(
    `(model\\s+${modelName}\\s*\\{[\\s\\S]*?)@@map\\("([^"]+)"\\)`,
    'g'
  )
  schema = schema.replace(regex, `$1@@map("${tableName}")`)
}

// 3. Swap native types for Booleans (@db.TinyInt for MySQL, @db.Bit for MSSQL)
if (DB_TYPE === 'mssql') {
  schema = schema.replace(/@db\.TinyInt/g, '@db.Bit')
} else {
  schema = schema.replace(/@db\.Bit/g, '@db.TinyInt')
}

// 4. Swap primary-key column name (@map("ID") for MySQL, @map("RecordNo") for MSSQL)
if (DB_TYPE === 'mssql') {
  schema = schema.replace(/@map\("ID"\)/g, '@map("RecordNo")')
} else {
  schema = schema.replace(/@map\("RecordNo"\)/g, '@map("ID")')
}

writeFileSync(SCHEMA_PATH, schema, 'utf-8')

console.log(`✅ Updated prisma/schema.prisma → provider = "${provider}"`)
console.log(`✅ Updated table mappings for ${DB_TYPE}:`)
for (const [model, table] of Object.entries(tableNames)) {
  console.log(`   ${model} → ${table}`)
}

// Run prisma generate
console.log('🔄 Running prisma generate...')
try {
  execSync('pnpm exec prisma generate', {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'),
  })
  console.log('✅ Prisma client regenerated successfully.')
} catch {
  console.error('❌ prisma generate failed.')
  process.exit(1)
}
