import { Elysia, t } from 'elysia'
import { register, login, changePassword } from '../../services/auth.service'
import { jwtPlugin } from '../../plugins/jwt'

const publicAuthRoutes = new Elysia()
  .use(jwtPlugin)

  // POST /api/v1/auth/register
  .post('/register', async ({ body, set }) => {
    const result = await register(body.email, body.password)
    if (result.error) {
      set.status = 400
      return { message: result.error }
    }
    set.status = 201
    return result
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // POST /api/v1/auth/login
  .post('/login', async ({ body, set, jwt }) => {
    const result = await login(body.email, body.password)
    if (result.error) {
      set.status = 401
      return { message: result.error }
    }

    const token = await jwt.sign({
      id: result.user!.id,
      email: result.user!.email,
      role: result.user!.role
    })

    return { token, user: result.user }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })

  // POST /api/v1/auth/logout
  .post('/logout', () => {
    return { message: 'Logged out successfully' }
  })

  // POST /api/v1/auth/change-password
  .post('/change-password', async ({ body, set, jwt, headers }) => {
    const token = headers['authorization']?.replace('Bearer ', '')
    if (!token) { set.status = 401; return { message: 'Unauthorized' } }
    const payload = await jwt.verify(token)
    if (!payload) { set.status = 401; return { message: 'Invalid token' } }

    const targetId = (body as any).userId || payload.id
    if (targetId !== payload.id && payload.role !== 'superadmin') {
      set.status = 403
      return { message: 'Forbidden' }
    }
    await changePassword(targetId as string, (body as any).password)
    return { message: 'Password changed' }
  }, {
    body: t.Object({
      password: t.String(),
      userId: t.Optional(t.String()),
    })
  })

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(publicAuthRoutes)
