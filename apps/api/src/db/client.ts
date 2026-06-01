import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// for migrations (max 1 connection)
export const migrationClient = postgres(connectionString, { max: 1 })

// for queries
const queryClient = postgres(connectionString)
export const db = drizzle(queryClient, { schema })
