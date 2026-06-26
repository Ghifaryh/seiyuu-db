import { db } from '../db/client'
import { appUser } from '../db/schema'
import { eq } from 'drizzle-orm'

// we'll use these for hashing
async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash)
}

function generateToken(userId: string, role: string): string {
  // simple JWT using Bun — we'll use a proper plugin next
  return btoa(JSON.stringify({ userId, role, exp: Date.now() + 1000 * 60 * 60 * 24 }))
}

export async function register(email: string, password: string) {
  const existing = await db
    .select()
    .from(appUser)
    .where(eq(appUser.email, email))

  if (existing.length > 0) {
    return { error: 'Email already in use' }
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(appUser)
    .values({ email, passwordHash })
    .returning({ id: appUser.id, email: appUser.email, role: appUser.role })

  return { user }
}

// export async function login(email: string, password: string) {
//   const [user] = await db
//     .select()
//     .from(appUser)
//     .where(eq(appUser.email, email))
//
//   if (!user) return { error: 'Invalid credentials' }
//
//   const valid = await verifyPassword(password, user.passwordHash)
//   if (!valid) return { error: 'Invalid credentials' }
//
//   const token = generateToken(user.id, user.role ?? 'user')
//   return { token, user: { id: user.id, email: user.email, role: user.role } }
// }

export async function login(email: string, password: string) {
  const [user] = await db
    .select()
    .from(appUser)
    .where(eq(appUser.email, email))

  if (!user) return { error: 'Invalid credentials' }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return { error: 'Invalid credentials' }

  // return user data — JWT signing happens in the route
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role ?? 'user'
    }
  }
}

export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: appUser.id,
      email: appUser.email,
      role: appUser.role,
      createdAt: appUser.createdAt
    })
    .from(appUser)
    .where(eq(appUser.id, id))

  return user ?? null
}

export async function getAllUsers() {
  return db
    .select({
      id: appUser.id,
      email: appUser.email,
      role: appUser.role,
      createdAt: appUser.createdAt
    })
    .from(appUser)
    .orderBy(appUser.createdAt)
}

export async function updateUserRole(id: string, role: string) {
  const [result] = await db
    .update(appUser)
    .set({ role })
    .where(eq(appUser.id, id))
    .returning()
  return result ?? null
}

export async function changePassword(id: string, newPassword: string) {
  const hash = await Bun.password.hash(newPassword)
  const [result] = await db
    .update(appUser)
    .set({ passwordHash: hash })
    .where(eq(appUser.id, id))
    .returning()
  return result ?? null
}

export async function deleteUser(id: string) {
  const [result] = await db
    .delete(appUser)
    .where(eq(appUser.id, id))
    .returning()
  return result ?? null
}
