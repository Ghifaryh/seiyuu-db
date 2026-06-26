import { db } from './db/client'
import { appUser } from './db/schema'
import { eq } from 'drizzle-orm'

const email = process.env.ADMIN_EMAIL ?? 'admin@seiyuu.db'
const password = process.env.ADMIN_PASSWORD ?? 'admin123'

const hash = await Bun.password.hash(password)

// upsert admin
const [existing] = await db.select().from(appUser).where(eq(appUser.email, email))

if (existing) {
  await db.update(appUser)
    .set({ passwordHash: hash, role: 'superadmin' })
    .where(eq(appUser.id, existing.id))
  console.log(`Superadmin updated: ${email}`)
} else {
  await db.insert(appUser).values({
    email,
    passwordHash: hash,
    role: 'superadmin',
  })
  console.log(`Superadmin created: ${email}`)
}

process.exit(0)
