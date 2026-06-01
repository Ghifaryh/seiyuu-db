import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const appUser = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('user'), // user | admin
  createdAt: timestamp('created_at').defaultNow()
})
